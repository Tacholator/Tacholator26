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
import { Calendar, Clock, Loader2, Search, AlertTriangle, CheckCircle, RefreshCw, MapPin, Repeat, XCircle } from 'lucide-react';
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

export default function NewLessonModal({ open, onOpenChange, defaultPupilId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = moment().format('YYYY-MM-DD');

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(1);
  const [selectedPupilId, setSelectedPupilId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffSameAsPickup, setDropoffSameAsPickup] = useState(true);
  const [recurrence, setRecurrence] = useState('once');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideBalance, setOverrideBalance] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['newLessonModalSlots', user?.id, date],
    queryFn: async () => {
      if (!user?.id || !date) return [];
      const allSlots = await base44.entities.BookableSlotInstance.filter({ instructorId: user.id, status: 'available' });
      return allSlots.filter(s => moment(s.startAtUtc).local().format('YYYY-MM-DD') === date)
        .sort((a, b) => new Date(a.startAtUtc) - new Date(b.startAtUtc));
    },
    enabled: !!user?.id && !!date && open,
  });

  const { data: pupils = [], refetch: refetchPupils } = useQuery({
    queryKey: ['newLessonModalPupils', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return [];
      const [byId, byEmail] = await Promise.all([
        base44.entities.Pupil.filter({ instructorId: user.id }),
        user?.email ? base44.entities.Pupil.filter({ instructorEmail: user.email }) : Promise.resolve([]),
      ]);
      // Merge and deduplicate
      const map = new Map();
      [...byId, ...byEmail].forEach(p => map.set(p.id, p));
      return Array.from(map.values())
        .filter(p => p.status === 'Active' || p.status === 'Stopped')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    },
    enabled: !!user?.id && open,
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
      setSelectedPupilId(defaultPupilId || '');
      setPickupLocation('');
      setDropoffLocation('');
      setDropoffSameAsPickup(true);
      setRecurrence('once');
      setRecurrenceEndDate('');
      setSearchQuery('');
      setOverrideBalance(false);
      setConflictError(null);
      setSelectedSlotId(null);
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

  // Pre-fill pickup location when a default pupil is selected and has a pickup address
  useEffect(() => {
    if (selectedPupil?.pickupAddress && !pickupLocation) {
      setPickupLocation(selectedPupil.pickupAddress);
    }
  }, [selectedPupil]);

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

      // If booking via a selected slot, only book the first date (no recurrence)
      const datesToBook = selectedSlotId ? [bookingDates[0]] : bookingDates;
      // Get the selected slot object if applicable
      const selectedSlot = selectedSlotId ? availableSlots.find(s => s.id === selectedSlotId) : null;

      for (const bookingDate of datesToBook) {
        const startAtUtc = selectedSlot
          ? selectedSlot.startAtUtc
          : moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        const endAtUtc = selectedSlot
          ? selectedSlot.endAtUtc
          : moment(`${bookingDate} ${startTime}`, 'YYYY-MM-DD HH:mm').add(durationHours * 60, 'minutes').utc().toISOString();

        if (!selectedSlot) {
          // Only run overlap check when NOT using a pre-defined slot
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
            if (s.status === 'blocked') return false;
            return newStart.isBefore(moment(s.endAtUtc)) && newEnd.isAfter(moment(s.startAtUtc));
          });

          if (overlapsBooking || overlapsSlot) {
            const reason = overlapsSlot ? 'an available slot (bookable by pupils)' : 'an existing booking';
            throw new Error(`Overlap on ${moment(bookingDate).format('ddd D MMM')} at ${startTime} — there is already ${reason} during this time. To fix this: go to your Calendar, remove or adjust the conflicting slot/booking, then try again.`);
          }
        }

        const slotDuration = selectedSlot
          ? moment(selectedSlot.endAtUtc).diff(moment(selectedSlot.startAtUtc), 'minutes') / 60
          : durationHours;
        const totalPriceEach = hourlyRate * slotDuration;

        const booking = await base44.entities.LessonBooking.create({
          instructorId: user.id,
          pupilId: selectedPupilId,
          startAtUtc,
          endAtUtc,
          durationHours: slotDuration,
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          pickupLocation,
          dropoffLocation: dropoffSameAsPickup ? pickupLocation : dropoffLocation,
          hourlyRateAtBookingGbp: hourlyRate,
          totalPriceGbp: totalPriceEach,
        });

        // If booked from a slot, mark it as confirmed and link it
        if (selectedSlot) {
          await base44.entities.BookableSlotInstance.update(selectedSlot.id, {
            status: 'confirmed',
            bookingId: booking.id,
            reservedByPupilId: selectedPupilId,
          });
        }

        if (totalPriceEach > 0) {
          await base44.entities.PaymentLedger.create({
            userId: selectedPupilId,
            bookingId: booking.id,
            type: 'charge',
            reason: 'lesson_confirmed_charge',
            amountGbp: totalPriceEach,
            hours: slotDuration,
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
            message: `Your instructor has booked a lesson for ${moment(bookingDate).format('ddd D MMM')} at ${moment(startAtUtc).local().format('HH:mm')}.`,
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
      queryClient.invalidateQueries({ queryKey: ['newLessonModalSlots'] });
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
      setConflictError(err.message);
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
      <DialogContent className="max-w-sm p-0 gap-0 flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>
        
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
                onChange={e => { setDate(e.target.value); setSelectedSlotId(null); }}
                className="text-sm"
              />

              {/* Available slots for selected date */}
              {date && (slotsLoading ? (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500">Your available slots on this day — tap to use:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSlots.map(slot => {
                      const slotStart = moment(slot.startAtUtc).local().format('HH:mm');
                      const slotEnd = moment(slot.endAtUtc).local().format('HH:mm');
                      const slotDuration = moment(slot.endAtUtc).diff(moment(slot.startAtUtc), 'minutes') / 60;
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setStartTime(slotStart);
                            setDurationHours(slotDuration);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected
                              ? 'bg-[#071739] text-white border-[#071739]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#071739] hover:bg-slate-50'
                          }`}
                        >
                          {slotStart} – {slotEnd}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null)}

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

            {/* Pickup + Dropoff + Recurrence */}
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dropoff-same"
                  checked={dropoffSameAsPickup}
                  onChange={e => setDropoffSameAsPickup(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="dropoff-same" className="text-xs text-slate-600 cursor-pointer">
                  Drop-off same as pickup
                </label>
              </div>

              {!dropoffSameAsPickup && (
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    value={dropoffLocation}
                    onChange={e => setDropoffLocation(e.target.value)}
                    placeholder="Drop-off address..."
                    className="pl-8 text-sm"
                  />
                </div>
              )}

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

        {/* Conflict Error Banner */}
        {conflictError && (
          <div className="mx-4 mb-2 rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700">
            <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Time conflict</p>
              <p className="leading-relaxed">{conflictError}</p>
            </div>
            <button onClick={() => setConflictError(null)} className="text-rose-400 hover:text-rose-600 shrink-0">✕</button>
          </div>
        )}

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