import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Loader2, Search, AlertTriangle, CheckCircle, RefreshCw, MapPin, Repeat } from 'lucide-react';
import moment from 'moment';

const TIME_SLOTS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

const DURATION_OPTIONS = [
  { label: '30 min', value: 0.5 },
  { label: '1 hr', value: 1 },
  { label: '1 hr 30', value: 1.5 },
  { label: '2 hrs', value: 2 },
  { label: '2 hrs 30', value: 2.5 },
  { label: '3 hrs', value: 3 },
  { label: '3 hrs 30', value: 3.5 },
  { label: '4 hrs', value: 4 },
];

const RECURRENCE_OPTIONS = [
  { label: 'No repeat', value: 'once' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'biweekly' },
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

  const lessonCost = (selectedPupil?.hourlyRate || 0) * durationHours;
  const currentBalance = selectedPupil?.bulkPaymentBalance || 0;
  const hasInsufficientBalance = selectedPupil && !selectedPupil.payAsYouGo && currentBalance < lessonCost;

  const endTime = date && startTime
    ? moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').add(durationHours * 60, 'minutes').format('HH:mm')
    : null;

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
        const endAtUtc = moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm').add(durationHours * 60, 'minutes').utc().toISOString();

        const [existingBookings, existingSlots] = await Promise.all([
          base44.entities.LessonBooking.filter({ instructorId: user.id }),
          base44.entities.BookableSlotInstance.filter({ instructorId: user.id }),
        ]);

        const newStart = moment(startAtUtc);
        const newEnd = moment(endAtUtc);

        const overlapsBooking = existingBookings.some(b => {
          if (['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor', 'deleted'].includes(b.status)) return false;
          if (b.isDeleted) return false;
          return newStart.isBefore(moment(b.endAtUtc)) && newEnd.isAfter(moment(b.startAtUtc));
        });

        const overlapsSlot = existingSlots.some(s => {
          // Ignore blocked slots only — available/reserved/confirmed all count as occupied time
          if (s.status === 'blocked') return false;
          return newStart.isBefore(moment(s.endAtUtc)) && newEnd.isAfter(moment(s.startAtUtc));
        });

        if (overlapsBooking || overlapsSlot) {
          const reason = overlapsSlot
            ? 'an available slot (bookable by pupils)'
            : 'an existing booking';
          throw new Error(`Overlap on ${moment(bookingDate).format('ddd D MMM')} at ${startTime} — there is already ${reason} during this time. To fix this: go to your Calendar, remove or adjust the conflicting slot/booking, then try again.`);
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
          const newBalance = (selectedPupil.bulkPaymentBalance || 0) - totalPriceEach;
          await base44.entities.Pupil.update(selectedPupilId, { bulkPaymentBalance: newBalance });
        }

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
        description: created.length > 1
          ? `${created.length} recurring lessons scheduled.`
          : `${moment(date).format('ddd D MMM')} at ${startTime} confirmed.`,
        duration: 4000,
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: 'Cannot book — time conflict',
        description: err.message,
        variant: 'destructive',
        duration: 8000,
      });
    },
  });

  const handleBook = () => {
    if (!selectedPupilId) return toast({ title: 'Select a pupil', variant: 'destructive' });
    if (!date) return toast({ title: 'Select a date', variant: 'destructive' });
    if (!pickupLocation.trim()) return toast({ title: 'Enter a pickup location', variant: 'destructive' });
    if (moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').isBefore(moment())) {
      return toast({ title: 'Select a future date & time', variant: 'destructive' });
    }
    if (hasInsufficientBalance && !overrideBalance) {
      return toast({ title: 'Insufficient balance', description: 'Use the override option to proceed anyway.', variant: 'destructive' });
    }
    bookMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 flex flex-col overflow-hidden top-[45%]" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 shrink-0 border-b bg-[#071739]">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-4 h-4 text-[#F7B602]" />
            New Lesson
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto" style={{ flex: '1 1 auto', minHeight: 0 }}>
          <div className="p-4 space-y-4">

            {/* Date, Time, Duration — compact row */}
            <div className="space-y-2">
              <Input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="text-sm">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(durationHours)} onValueChange={v => setDurationHours(Number(v))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(d => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {endTime && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {date ? moment(date).format('ddd D MMM') : ''} · {startTime} – {endTime}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Pupil */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search pupil..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-8 text-sm"
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
              <Select value={selectedPupilId} onValueChange={v => { setSelectedPupilId(v); setOverrideBalance(false); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select pupil..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredPupils.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500 text-center">No pupils found</div>
                    ) : (
                      filteredPupils.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                          {p.email && <span className="text-xs text-slate-400 ml-1">· {p.email}</span>}
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>

              {/* Balance pill */}
              {selectedPupil && (
                <div className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${hasInsufficientBalance ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  {hasInsufficientBalance
                    ? <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                    : <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  }
                  <div className="flex-1">
                    <span className={hasInsufficientBalance ? 'text-rose-700 font-medium' : 'text-emerald-700 font-medium'}>
                      {hasInsufficientBalance ? 'Low balance' : 'Balance OK'}
                    </span>
                    <span className="text-slate-500 ml-1.5">
                      £{currentBalance.toFixed(2)} / £{lessonCost.toFixed(2)} needed
                    </span>
                    {hasInsufficientBalance && (
                      <button
                        type="button"
                        onClick={() => setOverrideBalance(v => !v)}
                        className={`mt-1.5 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border transition-colors ${overrideBalance ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50'}`}
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        {overrideBalance ? 'Override active' : 'Override & book anyway'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Pickup + Recurrence */}
            <div className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="Pickup address..."
                  className="pl-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={recurrence} onValueChange={v => { setRecurrence(v); setRecurrenceEndDate(''); }}>
                  <SelectTrigger className="text-sm">
                    <Repeat className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {recurrence !== 'once' ? (
                  <Input
                    type="date"
                    value={recurrenceEndDate}
                    min={date}
                    onChange={e => setRecurrenceEndDate(e.target.value)}
                    className="text-sm"
                    placeholder="Until..."
                  />
                ) : (
                  <div /> 
                )}
              </div>

              {recurrence !== 'once' && bookingDates.length > 1 && (
                <div className="bg-slate-50 rounded-lg p-2.5 border text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{bookingDates.length} lessons</span> — {moment(bookingDates[0]).format('D MMM')} to {moment(bookingDates[bookingDates.length - 1]).format('D MMM YYYY')}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t bg-slate-50 shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={bookMutation.isPending}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold"
            onClick={handleBook}
            disabled={bookMutation.isPending}
          >
            {bookMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {bookMutation.isPending ? 'Booking...' : `Book${bookingDates.length > 1 ? ` (${bookingDates.length})` : ''}`}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}