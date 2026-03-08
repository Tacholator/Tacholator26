import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Volume2, Mic } from 'lucide-react';

export default function AudioSettingsContent() {
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('enable_audio_reading') !== 'false';
  });
  const [audioVoice, setAudioVoice] = useState(() => {
    return localStorage.getItem('study_material_voice') || 'neutral_female';
  });

  const handleAudioToggle = (checked) => {
    setAudioEnabled(checked);
    localStorage.setItem('enable_audio_reading', checked.toString());
    if (!checked) {
      window.speechSynthesis.cancel();
    }
  };

  const handleVoiceChange = (voice) => {
    setAudioVoice(voice);
    localStorage.setItem('study_material_voice', voice);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label className="text-base font-medium flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            Enable audio reading
          </Label>
          <p className="text-sm text-slate-500 mt-1">
            Allow the app to read study content and course sections aloud
          </p>
        </div>
        <Switch
          checked={audioEnabled}
          onCheckedChange={handleAudioToggle}
        />
      </div>

      {audioEnabled && (
        <div className="space-y-2 pl-4 border-l-2 border-slate-200">
          <Label className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-slate-400" />
            Study Material Voice
          </Label>
          <Select value={audioVoice} onValueChange={handleVoiceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral_female">Female (UK)</SelectItem>
              <SelectItem value="neutral_male">Male (UK)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Choose the voice used when listening to study material
          </p>
        </div>
      )}
    </div>
  );
}