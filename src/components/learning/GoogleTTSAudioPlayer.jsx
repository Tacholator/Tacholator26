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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceGender, setVoiceGender] = useState('female');
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const audioRef = useRef(null);
  const queryClient = useQueryClient();
  const playIntentRef = useRef(false);

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

  // Load saved preferences and prefetch audio
  useEffect(() => {
    if (savedProgress) {
      setVoiceGender(savedProgress.voiceGender || 'female');
      setSpeakingRate(savedProgress.speakingRate || 1.0);
    }
    
    // Prefetch audio in background when component mounts
    if (!isPrefetched && text) {
      const prefetchAudio = async () => {
        try {
          console.log('🔄 Prefetching audio in background...');
          setLoadingMessage('Preparing audio...');
          const url = await loadAudio(savedProgress?.voiceGender || 'female', savedProgress?.speakingRate || 1.0);
          if (url) {
            console.log('✓ Audio prefetched successfully');
            setIsPrefetched(true);
            setLoadingMessage('');
          }
        } catch (error) {
          console.log('Prefetch failed, will generate on play:', error);
          setLoadingMessage('');
        }
      };
      
      // Start prefetch after a short delay to not block initial page load
      const timer = setTimeout(prefetchAudio, 500);
      return () => clearTimeout(timer);
    }
  }, [savedProgress, isPrefetched, text]);

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
      console.log('=== CALLING BACKEND FUNCTION ===');
      console.log('Params:', { materialId: topicId, sectionId, voiceGender: voice, speakingRate: rate, textLength: text?.length });
      
      try {
        const response = await base44.functions.invoke('generateStudyMaterialAudio', {
          materialId: topicId?.toString(),
          sectionId,
          sectionText: text,
          voiceGender: voice,
          speakingRate: rate
        });
        
        console.log('✓ Function call succeeded');
        console.log('Raw response object:', response);
        console.log('Response.data:', response.data);
        console.log('Response.status:', response.status);
        
        // Check if the response contains an error in the data
        if (response.data?.errorCode) {
          console.error('Backend returned error in data:', response.data);
          throw new Error(JSON.stringify(response.data));
        }
        
        return response.data;
      } catch (err) {
        console.error('❌ Function invoke threw error');
        console.error('Error type:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Error object keys:', Object.keys(err));
        console.error('err.response:', err.response);
        console.error('err.response?.data:', err.response?.data);
        console.error('err.data:', err.data);
        throw err;
      }
    }
  });

  // Setup audio with event listeners
  const setupAudio = (url, startPosition = 0) => {
    console.log('Setting up audio with URL:', url);
    const audio = new Audio();
    audio.src = url;
    audio.playbackRate = 1.0;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    
    const handleLoadedMetadata = () => {
      console.log('✓ Audio metadata loaded. Duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      
      // Set start position
      if (startPosition > 0 && startPosition < audio.duration) {
        audio.currentTime = startPosition;
        setCurrentTime(startPosition);
        setProgress((startPosition / audio.duration) * 100);
        console.log('Set start position to:', startPosition);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      console.log('Audio ended');
      setIsPlaying(false);
      setProgress(100);
      if (audio.duration > 0) {
        saveProgressMutation.mutate({ position: audio.duration, completed: true });
      }
    };

    const handleError = (e) => {
      console.error('❌ Audio error:', e);
      console.error('Audio error details:', {
        code: audio.error?.code,
        message: audio.error?.message,
        url: url
      });
      setIsLoading(false);
      setIsPlaying(false);
      alert('Audio playback failed. Please try again.');
    };

    const handleCanPlay = () => {
      console.log('✓ Audio can play, ready for playback');
    };

    const handleLoadStart = () => {
      console.log('Loading audio...');
    };

    const handleLoadedData = () => {
      console.log('✓ Audio data loaded');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return audio;
  };

  // Load or generate audio
  const loadAudio = async (voice = voiceGender, rate = speakingRate, showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
      setLoadingMessage('Generating audio...');
    }
    
    try {
      console.log('Calling backend function to generate audio...');
      const result = await generateAudioMutation.mutateAsync({ voice, rate });
      console.log('Backend response:', result);
      
      if (!result.audioUrl) {
        console.error('❌ No audio URL in response:', result);
        throw new Error('No audio URL received from backend');
      }
      
      setAudioUrl(result.audioUrl);
      console.log('✓ Audio URL set successfully');
      if (showLoadingState) {
        setLoadingMessage('');
      }
      return result.audioUrl;
    } catch (error) {
      console.error('❌ Failed to generate audio:', error);
      
      // Try to parse structured error from backend
      let errorData = null;
      try {
        if (error.message && error.message.startsWith('{')) {
          errorData = JSON.parse(error.message);
        }
      } catch (e) {
        // Not a JSON error
      }
      
      errorData = errorData || error.response?.data || error.data;
      
      let userMessage = 'Audio is temporarily unavailable. Please try again.';
      let debugCode = 'TTS_UNKNOWN';
      
      if (errorData?.errorCode) {
        debugCode = errorData.errorCode;
        
        // Provide user-friendly messages with debug codes
        switch (errorData.errorStage) {
          case 'VALIDATION_INPUT':
            userMessage = errorData.errorMessage;
            break;
          case 'GOOGLE_TTS_CALL':
            if (errorData.errorCode === 'TTS_API_NOT_ENABLED') {
              userMessage = 'Google Text-to-Speech API needs to be enabled. Please contact support.';
            } else if (errorData.errorCode === 'TTS_PERMISSION_DENIED') {
              userMessage = 'Service account lacks permission. Please contact support.';
            } else if (errorData.errorCode === 'TTS_QUOTA_EXCEEDED') {
              userMessage = 'TTS quota exceeded. Please try again later.';
            } else if (errorData.errorCode === 'TTS_VOICE_INVALID') {
              userMessage = 'Voice selection error. Please try a different voice.';
            } else {
              userMessage = 'Unable to generate audio. Please try again.';
            }
            break;
          case 'BASE44_FILE_UPLOAD':
            userMessage = 'Failed to save audio file. Please try again.';
            break;
          case 'SIGNED_URL':
            userMessage = 'Failed to create audio URL. Please try again.';
            break;
          default:
            userMessage = errorData.errorMessage || userMessage;
        }
      }
      
      setIsLoading(false);
      setLoadingMessage('');
      if (showLoadingState) {
        alert(`${userMessage}\n\nDebug Code: ${debugCode}`);
      }
      return null;
    }
  };

  // Handle play/pause - single click should work
  const handlePlayPause = async () => {
    console.log('Play/Pause clicked. State:', { isPlaying, hasAudio: !!audioRef.current, audioUrl, isLoading });
    
    // Prevent multiple clicks during loading
    if (isLoading) {
      console.log('Already loading, ignoring click');
      return;
    }
    
    // If we have an audio object, just toggle play/pause
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        playIntentRef.current = false;
        saveProgressMutation.mutate({ position: currentTime, completed: false });
      } else {
        try {
          setLoadingMessage('Loading...');
          await audioRef.current.play();
          setIsPlaying(true);
          playIntentRef.current = false;
          setLoadingMessage('');
        } catch (error) {
          console.error('Play error:', error);
          setLoadingMessage('');
          alert('Unable to play audio. Please try again.');
        }
      }
      return;
    }

    // First play - set loading state and intent flag
    playIntentRef.current = true;
    setIsLoading(true);
    setLoadingMessage(audioUrl ? 'Loading...' : 'Generating audio...');

    try {
      // Load or use cached URL
      let urlToUse = audioUrl;
      if (!urlToUse) {
        console.log('No cached URL, generating audio...');
        urlToUse = await loadAudio(voiceGender, speakingRate, false);
        if (!urlToUse) {
          console.error('Failed to get audio URL');
          setIsLoading(false);
          setLoadingMessage('');
          playIntentRef.current = false;
          return;
        }
      }

      // Setup audio with saved position
      const startPos = savedProgress?.lastPosition || 0;
      console.log('Setting up audio player with start position:', startPos);
      audioRef.current = setupAudio(urlToUse, startPos);

      // Auto-play immediately (user gesture allows this)
      console.log('Attempting to auto-play after load...');
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
      setLoadingMessage('');
      playIntentRef.current = false;
      console.log('✓ Playing successfully on first click');
    } catch (error) {
      console.error('Play error on first click:', error);
      setIsLoading(false);
      setLoadingMessage('');
      playIntentRef.current = false;
      
      // If autoplay failed, show user-friendly message
      if (error.name === 'NotAllowedError') {
        alert('Please click the play button again to start audio playback.');
      } else {
        alert('Unable to play audio. Please try again.');
      }
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
    setIsPrefetched(false);

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
    setIsPrefetched(false);

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
        {isPrefetched && !audioRef.current && (
          <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Ready</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="h-10 w-10 p-0 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] disabled:opacity-50"
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
            disabled={!audioRef.current || isLoading}
            className="h-10 w-10 p-0 text-white hover:bg-white/10"
            aria-label="Rewind 10 seconds"
          >
            <Rewind className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSeek(10)}
            disabled={!audioRef.current || isLoading}
            className="h-10 w-10 p-0 text-white hover:bg-white/10"
            aria-label="Forward 10 seconds"
          >
            <FastForward className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReplay}
            disabled={!audioRef.current || isLoading}
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

        {/* Speed Display & Controls */}
        <div className="flex items-center gap-2">
          {/* Current Speed - Always Visible */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
            <Settings2 className="w-3.5 h-3.5 text-[#F7B602]" />
            <span className="text-sm font-bold text-[#F7B602]">{speakingRate}x</span>
          </div>

          {/* Speed Control */}
          <Select value={speakingRate.toString()} onValueChange={(val) => handleSpeedChange(parseFloat(val))}>
            <SelectTrigger className="h-9 w-[70px] bg-[#F7B602] border-none text-[#071739] font-bold">
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
                <Volume2 className="w-4 h-4" />
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

      {/* Loading Message */}
      {loadingMessage && (
        <div className="mt-3 text-xs text-[#F7B602] bg-[#F7B602]/10 rounded-lg p-2 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[#F7B602] border-t-transparent rounded-full animate-spin" />
          <span>{loadingMessage}</span>
        </div>
      )}

      {/* Continue Listening Hint */}
      {hasSavedProgress && !isPlaying && !audioRef.current && !loadingMessage && (
        <div className="mt-3 text-xs text-white/70 bg-white/10 rounded-lg p-2 flex items-center gap-2">
          <Volume2 className="w-3 h-3" />
          <span>You left off at {formatTime(savedProgress.lastPosition)}. Click play to continue.</span>
        </div>
      )}
    </div>
  );
}