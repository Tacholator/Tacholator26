import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, Settings2, FastForward, Rewind } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function GoogleTTSAudioPlayer({ 
  text, 
  topicId, 
  sectionId = 'full-content',
  sectionTitle = 'Full Content'
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceGender, setVoiceGender] = useState('female');
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const audioRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch saved progress
  const { data: savedProgress } = useQuery({
    queryKey: ['audioProgress', user?.id, topicId, sectionId],
    queryFn: async () => {
      if (!user?.id) return null;
      const records = await base44.entities.StudyAudioProgress.filter({
        userId: user.id,
        topicId: topicId?.toString(),
        sectionId
      });
      return records.length > 0 ? records[0] : null;
    },
    enabled: !!user?.id && !!topicId
  });

  // Load saved preferences
  useEffect(() => {
    if (savedProgress) {
      setVoiceGender(savedProgress.voiceGender || 'female');
      setSpeakingRate(savedProgress.speakingRate || 1.0);
    }
  }, [savedProgress]);

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async ({ position, completed }) => {
      const progressData = {
        userId: user.id,
        topicId: topicId?.toString(),
        sectionId,
        lastPosition: position,
        duration: duration,
        voiceGender,
        speakingRate,
        completed: completed || false
      };

      if (savedProgress) {
        return base44.entities.StudyAudioProgress.update(savedProgress.id, progressData);
      } else {
        return base44.entities.StudyAudioProgress.create(progressData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['audioProgress']);
    }
  });

  // Generate audio mutation
  const generateAudioMutation = useMutation({
    mutationFn: async ({ voice, rate }) => {
      const response = await base44.functions.invoke('generateStudyMaterialAudio', {
        materialId: topicId?.toString(),
        sectionId,
        sectionText: text,
        voiceGender: voice,
        speakingRate: rate
      });
      return response.data;
    }
  });

  // Setup audio with event listeners
  const setupAudio = (url, startPosition = 0) => {
    const audio = new Audio(url);
    audio.playbackRate = 1.0; // Always use 1.0 for actual playback since speed is baked in

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsLoading(false);
      
      // Set start position
      if (startPosition > 0 && startPosition < audio.duration) {
        audio.currentTime = startPosition;
        setCurrentTime(startPosition);
        setProgress((startPosition / audio.duration) * 100);
      }
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(100);
      if (audio.duration > 0) {
        saveProgressMutation.mutate({ position: audio.duration, completed: true });
      }
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
    });

    return audio;
  };

  // Load or generate audio
  const loadAudio = async (voice = voiceGender, rate = speakingRate) => {
    setIsLoading(true);
    try {
      const result = await generateAudioMutation.mutateAsync({ voice, rate });
      setAudioUrl(result.audioUrl);
      return result.audioUrl;
    } catch (error) {
      console.error('Failed to generate audio:', error);
      setIsLoading(false);
      return null;
    }
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    // If we have an audio object, just toggle play/pause
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        saveProgressMutation.mutate({ position: currentTime, completed: false });
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Play error:', error);
        }
      }
      return;
    }

    // Otherwise, load audio and create Audio object
    let urlToUse = audioUrl;
    if (!urlToUse) {
      urlToUse = await loadAudio();
      if (!urlToUse) return;
    }

    // Setup audio with saved position
    const startPos = savedProgress?.lastPosition || 0;
    audioRef.current = setupAudio(urlToUse, startPos);

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Play error:', error);
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    }
  };

  const handleVoiceChange = async (newVoice) => {
    const wasPlaying = isPlaying;
    const currentPos = currentTime;

    // Stop and cleanup current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setIsPlaying(false);
    setAudioUrl(null);
    setVoiceGender(newVoice);

    // If user was actively listening, regenerate and auto-restart
    if (wasPlaying) {
      const url = await loadAudio(newVoice, speakingRate);
      if (url) {
        audioRef.current = setupAudio(url, currentPos);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Play error:', error);
        }
      }
    }
  };

  const handleSpeedChange = async (newRate) => {
    const wasPlaying = isPlaying;
    const currentPos = currentTime;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setIsPlaying(false);
    setAudioUrl(null);
    setSpeakingRate(newRate);

    // Regenerate audio with new speed if user was actively listening
    if (wasPlaying) {
      const url = await loadAudio(voiceGender, newRate);
      if (url) {
        audioRef.current = setupAudio(url, currentPos);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Play error:', error);
        }
      }
    }
  };

  // Save progress periodically
  useEffect(() => {
    if (!isPlaying || !user?.id) return;

    const interval = setInterval(() => {
      if (currentTime > 0) {
        saveProgressMutation.mutate({ position: currentTime, completed: false });
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasSavedProgress = savedProgress && savedProgress.lastPosition > 5 && !savedProgress.completed;

  return (
    <div className="bg-gradient-to-r from-[#071739] to-[#0a2350] rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <Volume2 className="w-5 h-5 text-[#F7B602]" />
        <h3 className="text-white font-semibold">Listen to {sectionTitle}</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="h-10 w-10 p-0 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#071739] border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSeek(-10)}
            disabled={!audioUrl}
            className="h-10 w-10 p-0 text-white hover:bg-white/10"
            aria-label="Rewind 10 seconds"
          >
            <Rewind className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSeek(10)}
            disabled={!audioUrl}
            className="h-10 w-10 p-0 text-white hover:bg-white/10"
            aria-label="Forward 10 seconds"
          >
            <FastForward className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReplay}
            disabled={!audioUrl}
            className="h-10 w-10 p-0 text-white hover:bg-white/10"
            aria-label="Restart audio"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-3">
          <Progress value={progress} className="h-2 bg-white/20" />
          <span className="text-xs text-white/80 whitespace-nowrap font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Settings & Speed */}
        <div className="flex items-center gap-2">
          {/* Speed Control */}
          <Select value={speakingRate.toString()} onValueChange={(val) => handleSpeedChange(parseFloat(val))}>
            <SelectTrigger className="h-10 w-20 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.8">0.8x</SelectItem>
              <SelectItem value="1.0">1.0x</SelectItem>
              <SelectItem value="1.2">1.2x</SelectItem>
            </SelectContent>
          </Select>

          {/* Voice Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-white hover:bg-white/10">
                <Settings2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-2 block">
                    Voice Gender
                  </label>
                  <Select value={voiceGender} onValueChange={handleVoiceChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female (UK)</SelectItem>
                      <SelectItem value="male">Male (UK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-slate-500">
                  Powered by Google Cloud Text-to-Speech
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Continue Listening Hint */}
      {hasSavedProgress && !isPlaying && !audioUrl && (
        <div className="mt-3 text-xs text-white/70 bg-white/10 rounded-lg p-2 flex items-center gap-2">
          <Volume2 className="w-3 h-3" />
          <span>You left off at {formatTime(savedProgress.lastPosition)}. Click play to continue.</span>
        </div>
      )}
    </div>
  );
}