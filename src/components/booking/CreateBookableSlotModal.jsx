import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' }
];

const COLOR_OPTIONS = [
  { value: '#F7B602', label: 'Gold' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#22C55E', label: 'Green' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#071739', label: 'Navy' }
];

export default function CreateBookableSlotModal({
  open,
  onOpenChange,
  onSave,
  isSaving,
  slotDateTime,
  existingSlot
}) {
  const slotMoment = slotDateTime ? moment(slotDateTime) : moment();
  const dayOfWeek = slotMoment.format('ddd').toLowerCase();

  // Lesson tab state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(slotMoment.format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(slotMoment.format('HH:mm'));
  const [endTime, setEndTime] = useState(slotMoment.clone().add(1, 'hour').format('HH:mm'));
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [selectedDays, setSelectedDays] = useState([dayOfWeek]);
  const [stopDate, setStopDate] = useState('');

  // Personal tab state
  const [personalTitle, setPersonalTitle] = useState('');
  const [personalDate, setPersonalDate] = useState(slotMoment.format('YYYY-MM-DD'));
  const [personalStartTime, setPersonalStartTime] = useState(slotMoment.format('HH:mm'));
  const [personalDuration, setPersonalDuration] = useState(60);
  const [personalRepeat, setPersonalRepeat] = useState('none');
  const [personalColor, setPersonalColor] = useState(COLOR_OPTIONS[0].value);

  const [slotType, setSlotType] = useState('personal');

  // Pre-fill form when editing existing slot
  React.useEffect(() => {
    if (existingSlot && open) {
      const slotStart = moment(existingSlot.startAtUtc).local();
      const slotEnd = moment(existingSlot.endAtUtc).local();

      setStartDate(slotStart.format('YYYY-MM-DD'));
      setStartTime(slotStart.format('HH:mm'));
      setEndTime(slotEnd.format('HH:mm'));
      setTitle(existingSlot.title || '');
      setRepeatWeekly(false);
      setSelectedDays([dayOfWeek]);
      setStopDate('');
      setSlotType('lesson');
    } else if (!existingSlot && open && slotDateTime) {
      const m = moment(slotDateTime);
      const dow = m.format('ddd').toLowerCase();
      setStartDate(m.format('YYYY-MM-DD'));
      setStartTime(m.format('HH:mm'));
      setEndTime(m.clone().add(1, 'hour').format('HH:mm'));
      setTitle('');
      setRepeatWeekly(false);
      setSelectedDays([dow]);
      setStopDate('');
      setPersonalTitle('');
      setPersonalDate(m.format('YYYY-MM-DD'));
      setPersonalStartTime(m.format('HH:mm'));
      setPersonalDuration(60);
      setPersonalRepeat('none');
      setPersonalColor(COLOR_OPTIONS[0].value);
      setSlotType('personal');
    }
  }, [existingSlot, open, slotDateTime, dayOfWeek]);

  const handleDayToggle = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    if (slotType === 'personal') {
      const startLocal = moment(`${personalDate} ${personalStartTime}`, 'YYYY-MM-DD HH:mm');
      const endLocal = startLocal.clone().add(personalDuration, 'minutes');
      onSave({
        slotType: 'personal',
        title: personalTitle,
        startAtUtc: startLocal.toISOString(),
        endAtUtc: endLocal.toISOString(),
        durationMinutes: personalDuration,
        repeatType: personalRepeat,
        color: personalColor
      });
    } else {
      onSave({
        slotId: existingSlot?.id,
        slotType: 'lesson',
        title,
        startDate,
        startTime,
        endTime,
        repeatWeekly,
        selectedDays,
        stopDate: stopDate || null
      });
    }
  };

  const isPersonalValid = personalTitle.trim().length > 0;
  const isLessonValid = !repeatWeekly || selectedDays.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{existingSlot ? 'Edit Slot' : 'New Slot'}</DialogTitle>
          <DialogDescription>
            {existingSlot ? 'Update the time slot details' : 'Create a personal event or bookable lesson slot'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-full w-fit mx-auto">
          <button
            type="button"
            onClick={() => setSlotType('personal')}
            className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-colors ${
              slotType === 'personal'
                ? 'bg-[#F7B602] text-[#071739]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setSlotType('lesson')}
            className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-colors ${
              slotType === 'lesson'
                ? 'bg-[#F7B602] text-[#071739]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lesson
          </button>
        </div>

        {slotType === 'personal' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="e.g., Lunch break, School run"
                value={personalTitle}
                onChange={(e) => setPersonalTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={personalDate}
                onChange={(e) => setPersonalDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={personalStartTime}
                  onChange={(e) => setPersonalStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={String(personalDuration)} onValueChange={(v) => setPersonalDuration(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select value={personalRepeat} onValueChange={setPersonalRepeat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={personalColor} onValueChange={setPersonalColor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: opt.value }} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (slotType === 'personal' ? !isPersonalValid : !isLessonValid)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (existingSlot ? 'Update Slot' : 'Save Slot')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}