import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, GraduationCap } from 'lucide-react';
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
  existingSlot,
  slotInstances = []
}) {
  const slotMoment = slotDateTime ? moment(slotDateTime) : (() => {
    // Snap "now" to the 15-min grid so generated slots align with the calendar grid
    const now = moment();
    now.minutes(Math.floor(now.minutes() / 15) * 15);
    now.seconds(0);
    now.milliseconds(0);
    return now;
  })();
  const dayOfWeek = slotMoment.format('ddd').toLowerCase();

  // Lesson tab state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(slotMoment.format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(slotMoment.format('HH:mm'));
  const [endTime, setEndTime] = useState(slotMoment.clone().add(1, 'hour').format('HH:mm'));
  const [lessonDuration, setLessonDuration] = useState(60);
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

  // Lesson booking-for-pupil state
  const [lessonMode, setLessonMode] = useState('bookable'); // 'bookable' | 'booking'
  const [selectedPupilId, setSelectedPupilId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffSameAsPickup, setDropoffSameAsPickup] = useState(false);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pupilSearch, setPupilSearch] = useState('');
  const [isPracticalTest, setIsPracticalTest] = useState(false);
  const [practicalTestTime, setPracticalTestTime] = useState('');
  const [selectedSlotInstanceId, setSelectedSlotInstanceId] = useState('');

  // Available (unbooked) slots for the Booking-for-Pupil mode, filtered by picked date
  const availableSlots = React.useMemo(() => {
    if (!startDate) return [];
    const start = moment(startDate).startOf('day');
    const end = moment(startDate).endOf('day');
    return slotInstances
      .filter(s => {
        const sStart = moment(s.startAtUtc).local();
        return s.status === 'available' && sStart.isSameOrAfter(moment()) && sStart.isBetween(start, end, null, '[]');
      })
      .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));
  }, [slotInstances, startDate]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['createSlotPupils', user?.id, user?.email, open],
    queryFn: async () => {
      if (!user?.id || !user?.email) return [];
      const [byId, byEmail] = await Promise.all([
        base44.entities.Pupil.filter({ instructorId: user.id }),
        base44.entities.Pupil.filter({ instructorEmail: user.email }),
      ]);
      const map = {};
      for (const p of [...byId, ...byEmail]) map[p.id] = p;
      return Object.values(map)
        .filter(p => p.status === 'Active' || p.status === 'Stopped')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    },
    enabled: !!user?.id && !!user?.email && open && slotType === 'lesson' && lessonMode === 'booking'
  });

  const selectedPupil = pupils.find(p => p.id === selectedPupilId);

  // Auto-fill pickup from pupil profile
  React.useEffect(() => {
    if (selectedPupilId) {
      setPickupLocation(selectedPupil?.pickupAddress || '');
    }
  }, [selectedPupilId, selectedPupil?.pickupAddress]);

  const filteredPupils = pupils.filter(p => {
    if (!pupilSearch.trim()) return true;
    const q = pupilSearch.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
      || (p.email || '').toLowerCase().includes(q)
      || (p.phone || '').toLowerCase().includes(q);
  });

  // Pre-fill form when editing existing slot
  React.useEffect(() => {
    if (existingSlot && open) {
      const slotStart = moment(existingSlot.startAtUtc).local();
      const slotEnd = moment(existingSlot.endAtUtc).local();

      setStartDate(slotStart.format('YYYY-MM-DD'));
      setStartTime(slotStart.format('HH:mm'));
      setEndTime(slotEnd.format('HH:mm'));
      const existingMinutes = slotEnd.diff(slotStart, 'minutes');
      const matchOpt = DURATION_OPTIONS.find(o => o.value === existingMinutes);
      setLessonDuration(matchOpt ? matchOpt.value : 60);
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
      setLessonDuration(60);
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
      setLessonMode('bookable');
      setSelectedPupilId('');
      setPickupLocation('');
      setDropoffSameAsPickup(false);
      setDropoffLocation('');
      setPupilSearch('');
      setIsPracticalTest(false);
      setPracticalTestTime('');
      setSelectedSlotInstanceId('');
    }
  }, [existingSlot, open, slotDateTime, dayOfWeek]);

  const handleSelectAvailableSlot = (slot) => {
    if (selectedSlotInstanceId === slot.id) {
      setSelectedSlotInstanceId('');
      return;
    }
    const startLocal = moment(slot.startAtUtc).local();
    const endLocal = moment(slot.endAtUtc).local();
    const durationMin = endLocal.diff(startLocal, 'minutes');
    const matchOpt = DURATION_OPTIONS.find(o => o.value === durationMin);
    setSelectedSlotInstanceId(slot.id);
    setStartDate(startLocal.format('YYYY-MM-DD'));
    setStartTime(startLocal.format('HH:mm'));
    setLessonDuration(matchOpt ? matchOpt.value : 60);
  };

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
    } else if (lessonMode === 'booking') {
      const startLocal = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
      const endLocal = startLocal.clone().add(lessonDuration, 'minutes');
      onSave({
        slotType: 'lesson_booking',
        pupilId: selectedPupilId,
        slotInstanceId: selectedSlotInstanceId || undefined,
        startAtUtc: startLocal.toISOString(),
        endAtUtc: endLocal.toISOString(),
        durationHours: lessonDuration / 60,
        pickupLocation,
        dropoffLocation: pickupLocation,
        isPracticalTest,
        practicalTestTime: isPracticalTest ? practicalTestTime : undefined
      });
    } else {
      const startLocal = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
      const endLocal = startLocal.clone().add(lessonDuration, 'minutes');
      onSave({
        slotId: existingSlot?.id,
        slotType: 'lesson',
        title,
        startDate,
        startTime,
        endTime: endLocal.format('HH:mm'),
        repeatWeekly,
        selectedDays,
        stopDate: stopDate || null
      });
    }
  };

  const isPersonalValid = personalTitle.trim().length > 0;
  const isLessonBookableValid = !repeatWeekly || selectedDays.length > 0;
  const isLessonBookingValid = !!selectedPupilId
    && pickupLocation.trim().length > 0
    && (!isPracticalTest || !!practicalTestTime);
  const isLessonValid = lessonMode === 'bookable' ? isLessonBookableValid : isLessonBookingValid;

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
            {!existingSlot && (
              <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-full w-fit mx-auto">
                <button
                  type="button"
                  onClick={() => setLessonMode('bookable')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    lessonMode === 'bookable'
                      ? 'bg-[#071739] text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Bookable Slot
                </button>
                <button
                  type="button"
                  onClick={() => setLessonMode('booking')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    lessonMode === 'booking'
                      ? 'bg-[#071739] text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Booking for Pupil
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Label>{lessonMode === 'booking' ? 'Date' : 'Start Date'}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {lessonMode === 'booking' && availableSlots.length > 0 && (
              <div className="space-y-2">
                <Label className="text-teal-700">Available Times</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map(slot => {
                    const startLocal = moment(slot.startAtUtc).local();
                    const endLocal = moment(slot.endAtUtc).local();
                    const isSelected = selectedSlotInstanceId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSelectAvailableSlot(slot)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                        }`}
                      >
                        {startLocal.format('HH:mm')}–{endLocal.format('HH:mm')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lesson Duration</Label>
                <Select value={String(lessonDuration)} onValueChange={(v) => setLessonDuration(Number(v))}>
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

            {lessonMode === 'bookable' && (
              <>
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
              </>
            )}

            {lessonMode === 'booking' && (
              <>
                <div className="space-y-2">
                  <Label>Select Pupil <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={pupilSearch}
                      onChange={(e) => setPupilSearch(e.target.value)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a pupil..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="max-h-[240px] overflow-y-auto">
                        {filteredPupils.length === 0 ? (
                          <div className="p-2 text-sm text-slate-500 text-center">No pupils found</div>
                        ) : (
                          filteredPupils.map(pupil => (
                            <SelectItem key={pupil.id} value={pupil.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{pupil.firstName} {pupil.lastName}</span>
                                {(pupil.email || pupil.phone) && (
                                  <span className="text-xs text-slate-500">{pupil.email || pupil.phone}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pickup Location <span className="text-rose-500">*</span></Label>
                  <Input
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter pickup address..."
                  />
                </div>

                <div className={`rounded-lg border p-3 transition-colors ${isPracticalTest ? 'border-amber-700 bg-amber-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <GraduationCap className={`w-5 h-5 ${isPracticalTest ? 'text-amber-700' : 'text-slate-500'}`} />
                      <div>
                        <Label htmlFor="practical-test" className="text-sm font-medium cursor-pointer">
                          This is a practical driving test
                        </Label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isPracticalTest ? 'Will be highlighted in brown on the calendar' : 'Enable to mark as test day'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isPracticalTest}
                      onCheckedChange={(checked) => {
                        setIsPracticalTest(checked);
                        if (!checked) setPracticalTestTime('');
                      }}
                    />
                  </div>

                  {isPracticalTest && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-amber-200">
                      <Label htmlFor="test-time">Test Time <span className="text-rose-500">*</span></Label>
                      <Input
                        id="test-time"
                        type="time"
                        value={practicalTestTime}
                        onChange={(e) => setPracticalTestTime(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  )}
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
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (existingSlot ? 'Update Slot' : (slotType === 'lesson' && lessonMode === 'booking' ? 'Schedule Lesson' : 'Save Slot'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}