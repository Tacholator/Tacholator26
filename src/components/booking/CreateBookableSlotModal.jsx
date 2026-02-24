import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import moment from 'moment';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

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
  slotDateTime,
  existingSlot 
}) {
  const { toast } = useToast();
  const slotMoment = slotDateTime ? moment(slotDateTime) : moment();
  const dayOfWeek = slotMoment.format('ddd').toLowerCase();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: existingSlots = [] } = useQuery({
    queryKey: ['bookableSlots', user?.id],
    queryFn: () => base44.entities.BookableSlotTemplate.list(),
    enabled: !!user?.id
  });
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(slotMoment.format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(slotMoment.format('HH:mm'));
  const [endTime, setEndTime] = useState(slotMoment.clone().add(1, 'hour').format('HH:mm'));
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [selectedDays, setSelectedDays] = useState([dayOfWeek]);
  const [stopDate, setStopDate] = useState('');

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
    } else if (!existingSlot && open && slotDateTime) {
      const slotMoment = moment(slotDateTime);
      const dayOfWeek = slotMoment.format('ddd').toLowerCase();
      setStartDate(slotMoment.format('YYYY-MM-DD'));
      setStartTime(slotMoment.format('HH:mm'));
      setEndTime(slotMoment.clone().add(1, 'hour').format('HH:mm'));
      setTitle('');
      setRepeatWeekly(false);
      setSelectedDays([dayOfWeek]);
      setStopDate('');
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
    // Check for time overlaps
    const newStart = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const newEnd = moment(`${startDate} ${endTime}`, 'YYYY-MM-DD HH:mm');

    if (newEnd.isSameOrBefore(newStart)) {
      toast({
        title: 'Invalid time range',
        description: 'End time must be after start time',
        variant: 'destructive'
      });
      return;
    }

    // Check for overlaps with existing slots
    const hasOverlap = existingSlots.some(slot => {
      // Skip the slot being edited
      if (existingSlot && slot.id === existingSlot.id) return false;

      const slotStart = moment(slot.startAtUtc).local();
      const slotEnd = moment(slot.endAtUtc).local();
      const slotStartDate = slotStart.format('YYYY-MM-DD');
      const slotDayOfWeek = slotStart.format('ddd').toLowerCase();

      // Check if this existing slot occurs on the target date
      let slotOccursOnDate = false;
      
      if (repeatWeekly) {
        // If new slot is recurring, check if it overlaps with existing slot's occurrence on new slot's date
        slotOccursOnDate = slotStart.isSameOrBefore(moment(startDate)) && 
                           (!slot.stopDate || moment(startDate).isSameOrBefore(moment(slot.stopDate)));
        
        if (slotOccursOnDate && slot.repeatWeekly) {
          // Both are recurring - check if they share any days
          const existingDays = slot.selectedDays || [slotDayOfWeek];
          slotOccursOnDate = selectedDays.some(day => existingDays.includes(day));
        }
      } else {
        // New slot is single occurrence - check if existing slot occurs on that date
        if (slot.repeatWeekly) {
          const existingDays = slot.selectedDays || [slotDayOfWeek];
          const newSlotDayOfWeek = moment(startDate).format('ddd').toLowerCase();
          slotOccursOnDate = existingDays.includes(newSlotDayOfWeek) &&
                             slotStart.isSameOrBefore(moment(startDate)) &&
                             (!slot.stopDate || moment(startDate).isSameOrBefore(moment(slot.stopDate)));
        } else {
          slotOccursOnDate = slotStartDate === startDate;
        }
      }

      if (!slotOccursOnDate) return false;

      // Check if times overlap
      return newStart.isBefore(slotEnd) && newEnd.isAfter(slotStart);
    });

    if (hasOverlap) {
      toast({
        title: 'Time conflict',
        description: 'This time slot overlaps with an existing lesson slot',
        variant: 'destructive'
      });
      return;
    }

    onSave({
      slotId: existingSlot?.id,
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
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{existingSlot ? 'Edit Bookable Slot' : 'Create Bookable Slot'}</DialogTitle>
          <DialogDescription>
            {existingSlot ? 'Update the time slot details' : 'Publish a time slot that pupils can book'}
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
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (existingSlot ? 'Update Slot' : 'Save Slot')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}