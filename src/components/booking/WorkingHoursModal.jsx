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

export default function WorkingHoursModal({ open, onOpenChange, onSave, isSaving, existingRules = [] }) {
  const [daySettings, setDaySettings] = useState(() => {
    const settings = {};
    DAYS.forEach(day => {
      const existingRule = existingRules.find(r => 
        r.ruleType === 'working_hours' && r.daysOfWeek.includes(day.value)
      );
      settings[day.value] = {
        enabled: !!existingRule,
        startTime: existingRule?.startTimeLocal || '09:00',
        endTime: existingRule?.endTimeLocal || '17:00'
      };
    });
    return settings;
  });

  useEffect(() => {
    if (open && existingRules.length > 0) {
      const settings = {};
      DAYS.forEach(day => {
        const existingRule = existingRules.find(r => 
          r.ruleType === 'working_hours' && r.daysOfWeek.includes(day.value)
        );
        settings[day.value] = {
          enabled: !!existingRule,
          startTime: existingRule?.startTimeLocal || '09:00',
          endTime: existingRule?.endTimeLocal || '17:00'
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

  const anyDayEnabled = DAYS.some(day => daySettings[day.value].enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Working Hours</DialogTitle>
          <DialogDescription>
            Configure your working hours for each day of the week
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {DAYS.map(day => (
            <div key={day.value} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 w-32">
                <Switch
                  checked={daySettings[day.value].enabled}
                  onCheckedChange={(checked) => handleToggleDay(day.value, checked)}
                />
                <Label className="font-medium text-slate-700">{day.label}</Label>
              </div>
              {daySettings[day.value].enabled ? (
                <div className="flex-1">
                  <TimeRangePicker
                    startTime={daySettings[day.value].startTime}
                    endTime={daySettings[day.value].endTime}
                    onStartChange={(value) => handleTimeChange(day.value, 'startTime', value)}
                    onEndChange={(value) => handleTimeChange(day.value, 'endTime', value)}
                  />
                </div>
              ) : (
                <div className="flex-1 text-sm text-slate-400">
                  Not working this day
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
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Working Hours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}