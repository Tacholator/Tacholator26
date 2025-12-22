import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { TimeRangePicker } from '@/components/ui/TimePicker';

const DAYS = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' }
];

export default function UnavailableModal({ open, onOpenChange, onSave, isSaving, existingRules = [] }) {
  const [daySettings, setDaySettings] = useState(() => {
    const settings = {};
    DAYS.forEach(day => {
      const existingRule = existingRules.find(r => 
        r.ruleType === 'unavailable' && r.daysOfWeek.includes(day.value)
      );
      settings[day.value] = {
        enabled: !!existingRule,
        startTime: existingRule?.startTimeLocal || '14:00',
        endTime: existingRule?.endTimeLocal || '15:00'
      };
    });
    return settings;
  });

  useEffect(() => {
    if (open && existingRules.length > 0) {
      const settings = {};
      DAYS.forEach(day => {
        const existingRule = existingRules.find(r => 
          r.ruleType === 'unavailable' && r.daysOfWeek.includes(day.value)
        );
        settings[day.value] = {
          enabled: !!existingRule,
          startTime: existingRule?.startTimeLocal || '14:00',
          endTime: existingRule?.endTimeLocal || '15:00'
        };
      });
      setDaySettings(settings);
    }
  }, [open, existingRules]);

  const handleToggleDay = (dayValue, enabled) => {
    setDaySettings(prev => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], enabled }
    }));
  };

  const handleTimeChange = (dayValue, field, value) => {
    setDaySettings(prev => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], [field]: value }
    }));
  };

  const handleSave = () => {
    const rulesData = [];
    DAYS.forEach(day => {
      if (daySettings[day.value].enabled) {
        rulesData.push({
          daysOfWeek: [day.value],
          startTimeLocal: daySettings[day.value].startTime,
          endTimeLocal: daySettings[day.value].endTime,
          isRecurring: true,
          rrule: 'FREQ=WEEKLY;INTERVAL=1'
        });
      }
    });
    onSave(rulesData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Unavailable Times</DialogTitle>
          <DialogDescription>
            Configure unavailable time blocks for each day of the week (displayed in red)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {DAYS.map(day => (
            <div key={day.value} className="flex items-center gap-4 p-3 bg-rose-50 rounded-lg border border-rose-100">
              <div className="flex items-center gap-3 w-32">
                <Switch
                  checked={daySettings[day.value].enabled}
                  onCheckedChange={(checked) => handleToggleDay(day.value, checked)}
                />
                <Label className="font-medium text-slate-700">{day.label}</Label>
              </div>
              {daySettings[day.value].enabled ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <Input
                      type="time"
                      value={daySettings[day.value].startTime}
                      onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <span className="text-slate-400">—</span>
                  <div className="flex-1">
                    <Input
                      type="time"
                      value={daySettings[day.value].endTime}
                      onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-sm text-slate-400">
                  Available this day
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !anyDayEnabled}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Unavailable Times'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}