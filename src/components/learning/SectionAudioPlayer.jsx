import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, Settings2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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

export default function SectionAudioPlayer({ text, sectionId, onPlay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem('study_material_voice') || 'neutral_female';
  });
  const utteranceRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Check if audio is enabled in user settings
  const audioEnabled = localStorage.getItem('enable_audio_reading') !== 'false';

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const estimateDuration = (text) => {
    // Rough estimate: average speaking rate is ~150 words per minute
    const wordCount = text.trim().split(/\s+/).length;
    return (wordCount / 150) * 60; // duration in seconds
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const voicePreference = selectedVoice === 'neutral_male' ? 'male' : 'female';
    
    // Try to find UK English voice matching preference
    let voice = voices.find(v => 
      v.lang.startsWith('en-GB') && 
      v.name.toLowerCase().includes(voicePreference)
    );
    
    // Fallback to any UK English voice
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en-GB'));
    }
    
    // Fallback to any English voice
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en'));
    }
    
    return voice;
  };

  const handlePlay = () => {
    if (!audioEnabled) return;
    
    // Notify parent to pause other players
    if (onPlay) {
      onPlay(sectionId);
    }

    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      startProgressTracking();
      return;
    }

    // Start new speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Moderate pace for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Set voice based on user preference
    const voice = getVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    const duration = estimateDuration(text);
    setTotalTime(duration);
    setCurrentTime(0);
    setProgress(0);

    utterance.onstart = () => {
      setIsPlaying(true);
      startProgressTracking();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      setCurrentTime(totalTime);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const duration = estimateDuration(text);
    setTotalTime(duration);
    
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      setCurrentTime(Math.min(elapsed, duration));

      if (newProgress >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, 100);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleReplay = () => {
    handleStop();
    setTimeout(() => {
      handlePlay();
    }, 100);
  };

  const handleVoiceChange = (voice) => {
    setSelectedVoice(voice);
    localStorage.setItem('study_material_voice', voice);
    
    // Stop current playback if any
    if (isPlaying) {
      handleStop();
    }
  };

  if (!audioEnabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
      <Volume2 className="w-4 h-4 text-slate-500 hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className="h-8 w-8 p-0"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReplay}
          className="h-8 w-8 p-0"
          aria-label="Replay audio"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <Progress value={progress} className="h-2" />
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(totalTime)}
        </span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings2 className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-2 block">
                Study Material Voice
              </label>
              <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral_female">Female (UK)</SelectItem>
                  <SelectItem value="neutral_male">Male (UK)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              Voice changes apply immediately
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-xs text-slate-500 hidden md:block">Listen to this section</span>
    </div>
  );
}