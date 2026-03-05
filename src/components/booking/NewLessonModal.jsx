import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Loader2, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import moment from 'moment';

// Generate half-hour time slots for the full day
const TIME_SLOTS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

const DURATION_OPTIONS = [
  { label: '30 minutes', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '2 hours', value: 2 },
];

const RECURRENCE_OPTIONS = [
  { label: 'Once (no recurrence)', value: 'once' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly (every 2 weeks)', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function NewLessonModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = moment().format('YYYY-MM-DD');

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(1);
  const [selectedPupilId, setSelectedPupilId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [recurrence, setRecurrence] = useState('once');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideBalance, setOverrideBalance] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pupils = [], refetch: refetchPupils } = useQuery({
    queryKey: ['newLessonModalPupils', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return [];
      const allPupils = await base44.entities.Pupil.filter({
        instructorId: user.id,
        instructorEmail: user.email,
      });
      return allPupils
        .filter(p => p.status === 'Active' || p.status === 'Stopped')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    },
    enabled: !!user?.id && !!user?.email && open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (open && user?.id && user?.email) {
      refetchPupils();
      setDate(today);
      setStartTime('09:00');
      setDurationHours(1);
      setSelectedPupilId('');
      setPickupLocation('');
      setRecurrence('once');
      setRecurrenceEndDate('');
      setSearchQuery('');
      setOverrideBalance(false);
    }
  }, [open]);

  const filteredPupils = useMemo(() => {
    if (!searchQuery.trim()) return pupils;
    const q = searchQuery.toLowerCase();
    return pupils.filter(p => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      return name.includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q);
    });
  }, [pupils, searchQuery]);

  const selectedPupil = useMemo(() => pupils.find(p => p.id === selectedPupilId), [pupils, selectedPupilId]);

  // Balance check
  const lessonCost = (selectedPupil?.hourlyRate || 0) * durationHours;
  const currentBalance = selectedPupil?.bulkPaymentBalance || 0;
  const hasInsufficientBalance = selectedPupil && !selectedPupil.payAsYouGo && currentBalance < lessonCost;

  // Build list of booking dates based on recurrence
  const bookingDates = useMemo(() => {
    if (!date) return [];
    const dates = [date];
    if (recurrence === 'once') return dates;

    const end = recurrenceEndDate ? moment(recurrenceEndDate) : moment(date).add(3, 'months');
    let current = moment(date);

    while (true) {
      if (recurrence === 'weekly') current = current.clone().add(1, 'week');
      else if (recurrence === 'biweekly') current = current.clone().add(2, 'weeks');
      else if (recurrence === 'monthly') current = current.clone().add(1, 'month');

      if (current.isAfter(end)) break;
      dates.push(current.format('YYYY-MM-DD'));
    }
    return dates;
  }, [date, recurrence, recurrenceEndDate]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPupil) throw new Error('No pupil selected');

      const hourlyRate = selectedPupil.hourlyRate || 0;
      const totalPriceEach = hourlyRate * durationHours;

      const created = [];
      for (const bookingDate of bookingDates) {
        const startAtUtc = moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        const endAtUtc = moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm')
          .add(durationHours * 60, 'minutes')
          .utc()
          .toISOString();

        // Check for conflict: any non-cancelled booking that overlaps this time slot
        const existingBookings = await base44.entities.LessonBooking.filter({ instructorId: user.id });
        const hasConflict = existingBookings.some(b => {
          if (['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor', 'deleted'].includes(b.status)) return false;
          if (b.isDeleted) return false;
          const bStart = moment(b.startAtUtc);
          const bEnd = moment(b.endAtUtc);
          const newStart = moment(startAtUtc);
          const newEnd = moment(endAtUtc);
          return newStart.isBefore(bEnd) && newEnd.isAfter(bStart);
        });

        if (hasConflict) {
          throw new Error(`A booking already exists on ${moment(bookingDate).format('ddd D MMM')} at ${startTime}. Please choose a different time.`);
        }

        const booking = await base44.entities.LessonBooking.create({
          instructorId: user.id,
          pupilId: selectedPupilId,
          startAtUtc,
          endAtUtc,
          durationHours,
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          pickupLocation,
          hourlyRateAtBookingGbp: hourlyRate,
          totalPriceGbp: totalPriceEach,
          notesFromPupil: `Pickup: ${pickupLocation}`,
        });

        // Deduct from balance
        if (totalPriceEach > 0) {
          await base44.entities.PaymentLedger.create({
            userId: selectedPupilId,
            bookingId: booking.id,
            type: 'charge',
            reason: 'lesson_confirmed_charge',
            amountGbp: totalPriceEach,
            hours: durationHours,
            createdByRole: 'instructor',
            note: 'Charge applied on instructor booking',
          });

          // Update pupil balance
          const newBalance = (selectedPupil.bulkPaymentBalance || 0) - totalPriceEach;
          await base44.entities.Pupil.update(selectedPupilId, {
            bulkPaymentBalance: newBalance,
          });
        }

        // Notify pupil
        if (selectedPupil.linkedUserId) {
          await base44.entities.Notification.create({
            userId: selectedPupil.linkedUserId,
            title: 'Lesson Booked',
            message: `Your instructor has booked a lesson for ${moment(bookingDate).format('ddd D MMM')} at ${startTime}.`,
            type: 'booking',
            linkTarget: 'LearnerCalendar',
          });
        }

        created.push(booking);
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['lessonBookings'] });
      queryClient.invalidateQueries({ queryKey: ['instructorBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pupils'] });
      toast({
        title: `${created.length} Lesson${created.length > 1 ? 's' : ''} Booked ✓`,
        description:
          created.length > 1
            ? `${created.length} recurring lessons have been scheduled.`
            : `Lesson on ${moment(date).format('ddd D MMM')} at ${startTime} confirmed.`,
        duration: 4000,
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: 'Booking failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleBook = () => {
    if (!selectedPupilId) {
      toast({ title: 'Missing info', description: 'Please select a pupil', variant: 'destructive' });
      return;
    }
    if (!date) {
      toast({ title: 'Missing info', description: 'Please select a date', variant: 'destructive' });
      return;
    }
    if (!pickupLocation.trim()) {
      toast({ title: 'Missing info', description: 'Please enter a pickup location', variant: 'destructive' });
      return;
    }
    if (moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').isBefore(moment())) {
      toast({ title: 'Invalid date', description: 'Please select a future date and time', variant: 'destructive' });
      return;
    }
    if (hasInsufficientBalance && !overrideBalance) {
      toast({ title: 'Insufficient balance', description: 'Check the balance warning below and use override if you want to proceed.', variant: 'destructive' });
      return;
    }
    bookMutation.mutate();
  };

  const displayDate = date ? moment(date).format('ddd, D MMM YYYY') : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#F7B602]" />
            New Lesson
          </DialogTitle>
          <DialogDescription>Book a confirmed lesson directly into your calendar</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
        <div className="space-y-5 py-2">
          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <div className="relative">
              <Input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                className="pr-4"
              />
            </div>
            {displayDate && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {displayDate}
              </p>
            )}
          </div>

          {/* Time + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {TIME_SLOTS.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration *</Label>
              <Select value={String(durationHours)} onValueChange={v => setDurationHours(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End time preview */}
          {date && startTime && (
            <p className="text-sm text-slate-500 flex items-center gap-1 -mt-2">
              <Clock className="w-3.5 h-3.5" />
              {startTime} – {moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').add(durationHours * 60, 'minutes').format('HH:mm')}
            </p>
          )}

          {/* Pupil */}
          <div className="space-y-1.5">
            <Label>Pupil *</Label>
            <div className="relative mb-1.5">
              <Input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-9"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <Select value={selectedPupilId} onValueChange={v => { setSelectedPupilId(v); setOverrideBalance(false); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pupil..." />
              </SelectTrigger>
              <SelectContent>
                <div className="max-h-64 overflow-y-auto">
                  {filteredPupils.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">No pupils found</div>
                  ) : (
                    filteredPupils.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.firstName} {p.lastName}</span>
                          {p.email && <span className="text-xs text-slate-500">{p.email}</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Balance check */}
          {selectedPupil && (
            <div className={`rounded-lg border p-3 text-sm ${hasInsufficientBalance ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-start gap-2">
                {hasInsufficientBalance ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${hasInsufficientBalance ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {hasInsufficientBalance ? 'Insufficient balance' : 'Balance OK'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Balance: <strong>£{currentBalance.toFixed(2)}</strong> · Lesson cost: <strong>£{lessonCost.toFixed(2)}</strong>
                    {recurrence !== 'once' && bookingDates.length > 1 && (
                      <span> · Total: <strong>£{(lessonCost * bookingDates.length).toFixed(2)}</strong> for {bookingDates.length} lessons</span>
                    )}
                  </p>
                  {hasInsufficientBalance && (
                    <button
                      type="button"
                      onClick={() => setOverrideBalance(v => !v)}
                      className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${overrideBalance ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-rose-300 text-rose-700 hover:bg-rose-50'}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {overrideBalance ? 'Override active — will book anyway' : 'Override & book anyway'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pickup Location */}
          <div className="space-y-1.5">
            <Label>Pickup Location *</Label>
            <Input
              value={pickupLocation}
              onChange={e => setPickupLocation(e.target.value)}
              placeholder="Enter pickup address..."
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <Select value={recurrence} onValueChange={v => { setRecurrence(v); setRecurrenceEndDate(''); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recurrence !== 'once' && (
            <div className="space-y-1.5">
              <Label>Repeat Until (optional)</Label>
              <Input
                type="date"
                value={recurrenceEndDate}
                min={date}
                onChange={e => setRecurrenceEndDate(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Leave blank to default to 3 months from the first lesson.
              </p>
              {bookingDates.length > 1 && (
                <div className="bg-slate-50 rounded-lg p-3 border">
                  <p className="text-xs font-medium text-slate-600 mb-1.5">
                    {bookingDates.length} lessons will be booked:
                  </p>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {bookingDates.map(d => (
                      <div key={d} className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {moment(d).format('ddd D MMM YYYY')}
                        </Badge>
                        <span className="text-xs text-slate-500">{startTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bookMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleBook}
            disabled={bookMutation.isPending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold"
          >
            {bookMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {bookMutation.isPending ? 'Booking...' : `Book ${bookingDates.length > 1 ? `${bookingDates.length} Lessons` : 'Lesson'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}