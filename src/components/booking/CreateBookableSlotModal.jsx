import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import moment from 'moment';
import { TimeRangePicker } from '@/components/ui/TimePicker';

const DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' }
];

export default function CreateBookableSlotModal({ 
  open, 
  onOpenChange, 
  onSave, 
  isSaving,
  slotDateTime 
}) {
  const slotMoment = slotDateTime ? moment(slotDateTime) : moment();
  const dayOfWeek = slotMoment.format('ddd').toLowerCase();
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(slotMoment.format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(slotMoment.format('HH:mm'));
  const [endTime, setEndTime] = useState(slotMoment.clone().add(1, 'hour').format('HH:mm'));
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [selectedDays, setSelectedDays] = useState([dayOfWeek]);
  const [stopDate, setStopDate] = useState('');

  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    onSave({
      title,
      startDate,
      startTime,
      endTime,
      repeatWeekly,
      selectedDays,
      stopDate: stopDate || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Bookable Slot</DialogTitle>
          <DialogDescription>
            Publish a time slot that pupils can book
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              placeholder="e.g., Morning slot"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Time Range</Label>
            <TimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
              startPlaceholder="Start time"
              endPlaceholder="End time"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Switch
              checked={repeatWeekly}
              onCheckedChange={setRepeatWeekly}
            />
            <Label className="font-medium">Repeat weekly</Label>
          </div>

          {repeatWeekly && (
            <>
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <div 
                      key={day.value}
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedDays.includes(day.value)
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stop Date (optional)</Label>
                <Input
                  type="date"
                  value={stopDate}
                  onChange={(e) => setStopDate(e.target.value)}
                  placeholder="No end date"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (repeatWeekly && selectedDays.length === 0)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Slot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}