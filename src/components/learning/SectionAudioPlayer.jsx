import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SectionAudioPlayer({ text, sectionId, onPlay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const utteranceRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Check if audio is enabled in user settings
  const audioEnabled = localStorage.getItem('enable_audio_reading') !== 'false';
  const voiceGender = localStorage.getItem('study_material_voice') || 'neutral_female';

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
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-GB';
    
    // Set voice based on user preference
    const voices = window.speechSynthesis.getVoices();
    const preferMale = voiceGender === 'neutral_male';
    const ukVoice = voices.find(v => 
      v.lang.includes('en-GB') && 
      (preferMale ? v.name.toLowerCase().includes('male') : v.name.toLowerCase().includes('female'))
    ) || voices.find(v => v.lang.includes('en-GB')) || voices[0];
    
    if (ukVoice) {
      utterance.voice = ukVoice;
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

      <span className="text-xs text-slate-500 hidden md:block">Listen to this section</span>
    </div>
  );
}