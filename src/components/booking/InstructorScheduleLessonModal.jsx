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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Loader2, Search } from 'lucide-react';
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['activePupils', user?.id],
    queryFn: async () => {
      const allPupils = await base44.entities.Pupil.filter({ 
        instructorId: user.id,
        status: 'Active'
      });
      return allPupils.sort((a, b) => 
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

      // Create booking
      const booking = await base44.entities.LessonBooking.create({
        instructorId: user.id,
        pupilId: selectedPupilId,
        slotInstanceId: slotInstance.id,
        startAtUtc: slotInstance.startAtUtc,
        endAtUtc: slotInstance.endAtUtc,
        pickupLocation,
        dropoffLocation: dropoffSameAsPickup ? pickupLocation : dropoffLocation,
        notesForInstructor: notes,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        durationHours: moment(slotInstance.endAtUtc).diff(moment(slotInstance.startAtUtc), 'hours', true)
      });

      // Update slot instance
      await base44.entities.BookableSlotInstance.update(slotInstance.id, {
        status: 'confirmed',
        bookingId: booking.id
      });

      // Create notification for pupil
      const pupil = pupils.find(p => p.id === selectedPupilId);
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
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Lesson scheduled successfully' });
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
                        <div className="flex flex-col">
                          <span className="font-medium">{pupil.firstName} {pupil.lastName}</span>
                          {(pupil.email || pupil.phone) && (
                            <span className="text-xs text-slate-500">
                              {pupil.email || pupil.phone}
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