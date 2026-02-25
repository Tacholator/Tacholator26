import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Loader2, Search, GraduationCap } from 'lucide-react';
import moment from 'moment';

export default function InstructorScheduleLessonModal({ 
  open, 
  onOpenChange, 
  slotInstance 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPupilId, setSelectedPupilId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffSameAsPickup, setDropoffSameAsPickup] = useState(true);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPracticalTest, setIsPracticalTest] = useState(false);
  const [practicalTestTime, setPracticalTestTime] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['bookablePupils', user?.id],
    queryFn: async () => {
      const allPupils = await base44.entities.Pupil.filter({ 
        instructorId: user.id
      });
      // Include both Active and Stopped (one-off) pupils
      const bookablePupils = allPupils.filter(p => 
        p.status === 'Active' || p.status === 'Stopped'
      );
      return bookablePupils.sort((a, b) => 
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    },
    enabled: !!user?.id
  });

  const filteredPupils = React.useMemo(() => {
    if (!searchQuery.trim()) return pupils;
    const query = searchQuery.toLowerCase();
    return pupils.filter(pupil => {
      const fullName = `${pupil.firstName} ${pupil.lastName}`.toLowerCase();
      const email = pupil.email?.toLowerCase() || '';
      const phone = pupil.phone?.toLowerCase() || '';
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [pupils, searchQuery]);

  const scheduleLessonMutation = useMutation({
    mutationFn: async () => {
      // Validate slot is still available
      if (slotInstance.status !== 'available') {
        throw new Error('This slot is no longer available');
      }

      const pupil = pupils.find(p => p.id === selectedPupilId);
      const durationHours = moment(slotInstance.endAtUtc).diff(moment(slotInstance.startAtUtc), 'hours', true);
      const hourlyRate = pupil?.hourlyRate || 0;
      const totalPriceGbp = hourlyRate * durationHours;

      // Build notes with pickup/dropoff
      const finalDropoff = dropoffSameAsPickup ? pickupLocation : dropoffLocation;
      let notesFromPupil = `Pickup: ${pickupLocation} | Dropoff: ${finalDropoff}`;
      if (notes) {
        notesFromPupil += ` | ${notes}`;
      }

      // Create booking
      const booking = await base44.entities.LessonBooking.create({
        instructorId: user.id,
        pupilId: selectedPupilId,
        slotInstanceId: slotInstance.id,
        startAtUtc: slotInstance.startAtUtc,
        endAtUtc: slotInstance.endAtUtc,
        pickupLocation,
        notesFromPupil,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        durationHours,
        hourlyRateAtBookingGbp: hourlyRate,
        totalPriceGbp,
        isPracticalTest,
        practicalTestTime: isPracticalTest ? practicalTestTime : undefined
      });

      // Update slot instance
      await base44.entities.BookableSlotInstance.update(slotInstance.id, {
        status: 'confirmed',
        bookingId: booking.id
      });

      // Create payment ledger entry
      await base44.entities.PaymentLedger.create({
        userId: selectedPupilId,
        bookingId: booking.id,
        type: 'charge',
        reason: 'lesson_confirmed_charge',
        amountGbp: totalPriceGbp,
        hours: durationHours,
        createdByRole: 'instructor',
        note: 'Charge applied on confirmation'
      });

      // Create notification for pupil
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Scheduled',
          message: `Your instructor has scheduled a lesson for ${moment(slotInstance.startAtUtc).local().format('D MMM')} at ${moment(slotInstance.startAtUtc).local().format('HH:mm')}.`,
          type: 'booking',
          linkTarget: 'LearnerCalendar'
        });
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessonBookings'] });
      queryClient.invalidateQueries({ queryKey: ['slotInstances'] });
      queryClient.invalidateQueries({ queryKey: ['instructorBookings'] });
      queryClient.invalidateQueries({ queryKey: ['instructorSlotInstances'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast({ 
        title: 'Lesson Scheduled! ✓', 
        description: 'The lesson has been successfully added to your calendar.',
        duration: 4000
      });
      handleClose();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to schedule lesson', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleClose = () => {
    setSelectedPupilId('');
    setPickupLocation('');
    setDropoffSameAsPickup(true);
    setDropoffLocation('');
    setNotes('');
    setSearchQuery('');
    setIsPracticalTest(false);
    setPracticalTestTime('');
    onOpenChange(false);
  };

  const handleSchedule = () => {
    if (!selectedPupilId || !pickupLocation) {
      toast({ 
        title: 'Missing information', 
        description: 'Please select a pupil and enter a pickup location',
        variant: 'destructive'
      });
      return;
    }

    if (!dropoffSameAsPickup && !dropoffLocation) {
      toast({ 
        title: 'Missing information', 
        description: 'Please enter a drop-off location',
        variant: 'destructive'
      });
      return;
    }

    if (isPracticalTest && !practicalTestTime) {
      toast({ 
        title: 'Missing information', 
        description: 'Please enter the practical test time',
        variant: 'destructive'
      });
      return;
    }

    scheduleLessonMutation.mutate();
  };

  if (!slotInstance) return null;

  const startMoment = moment(slotInstance.startAtUtc).local();
  const endMoment = moment(slotInstance.endAtUtc).local();
  const duration = endMoment.diff(startMoment, 'hours', true);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Lesson</DialogTitle>
          <DialogDescription>
            Assign this slot to a pupil and create a confirmed lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Slot Summary */}
          <div className="bg-slate-50 rounded-lg p-4 border">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Selected Slot</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{startMoment.format('dddd, D MMMM YYYY')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{startMoment.format('HH:mm')} – {endMoment.format('HH:mm')}</span>
                <span className="text-slate-500">({duration} hour{duration !== 1 ? 's' : ''})</span>
              </div>
            </div>
          </div>

          {/* Pupil Selection */}
          <div className="space-y-2">
            <Label htmlFor="pupil">Select Pupil *</Label>
            <div className="relative">
              <Input
                id="pupil-search"
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
              <SelectTrigger id="pupil">
                <SelectValue placeholder="Choose a pupil..." />
              </SelectTrigger>
              <SelectContent>
                <div className="max-h-[280px] overflow-y-auto">
                  {filteredPupils.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">
                      No pupils found
                    </div>
                  ) : (
                    filteredPupils.map(pupil => (
                      <SelectItem key={pupil.id} value={pupil.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{pupil.firstName} {pupil.lastName}</span>
                            {(pupil.email || pupil.phone) && (
                              <span className="text-xs text-slate-500">
                                {pupil.email || pupil.phone}
                              </span>
                            )}
                          </div>
                          {pupil.status === 'Stopped' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                              One Off
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Location *</Label>
            <Input
              id="pickup"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Enter pickup address..."
            />
          </div>

          {/* Drop-off Same as Pickup */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dropoffSame"
              checked={dropoffSameAsPickup}
              onCheckedChange={setDropoffSameAsPickup}
            />
            <Label htmlFor="dropoffSame" className="cursor-pointer">
              Drop-off same as pickup
            </Label>
          </div>

          {/* Drop-off Location */}
          {!dropoffSameAsPickup && (
            <div className="space-y-2">
              <Label htmlFor="dropoff">Drop-off Location *</Label>
              <Input
                id="dropoff"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="Enter drop-off address..."
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for this lesson..."
              rows={3}
            />
          </div>

          {/* Practical Test Toggle */}
          <div className={`rounded-lg border p-4 transition-colors ${isPracticalTest ? 'border-amber-700 bg-amber-50' : 'bg-slate-50'}`}>
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
                id="practical-test"
                checked={isPracticalTest}
                onCheckedChange={(checked) => {
                  setIsPracticalTest(checked);
                  if (!checked) setPracticalTestTime('');
                }}
              />
            </div>
            
            {isPracticalTest && (
              <div className="space-y-2 mt-3 pt-3 border-t border-amber-200">
                <Label htmlFor="test-time">Test Time *</Label>
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={scheduleLessonMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule}
            disabled={scheduleLessonMutation.isPending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {scheduleLessonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Schedule Lesson
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}