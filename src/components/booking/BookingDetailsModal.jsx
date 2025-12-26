import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Calendar, MapPin, FileText, PoundSterling, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function BookingDetailsModal({ 
  open, 
  onOpenChange, 
  booking,
  slotInstance
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showRemovePupilDialog, setShowRemovePupilDialog] = useState(false);
  const [showDeleteBookingDialog, setShowDeleteBookingDialog] = useState(false);
  const [selectedNewPupilId, setSelectedNewPupilId] = useState('');
  const [pupilSearchQuery, setPupilSearchQuery] = useState('');

  const { data: pupil } = useQuery({
    queryKey: ['pupil', booking?.pupilId],
    queryFn: () => base44.entities.Pupil.filter({ id: booking.pupilId }).then(p => p[0]),
    enabled: !!booking?.pupilId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allPupils = [] } = useQuery({
    queryKey: ['activePupils', user?.id],
    queryFn: async () => {
      const pupils = await base44.entities.Pupil.filter({ 
        instructorId: user.id,
        status: 'Active'
      });
      return pupils.sort((a, b) => 
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    },
    enabled: !!user?.id
  });

  const filteredPupils = React.useMemo(() => {
    if (!pupilSearchQuery.trim()) return allPupils;
    const query = pupilSearchQuery.toLowerCase();
    return allPupils.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const email = p.email?.toLowerCase() || '';
      const phone = p.phone?.toLowerCase() || '';
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [allPupils, pupilSearchQuery]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      // Update booking status
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      });

      // Update slot instance status if exists
      if (slotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'confirmed'
        });
      }

      // Notify pupil
      await base44.entities.Notification.create({
        userId: pupil.linkedUserId,
        title: 'Lesson Confirmed',
        message: `Your lesson on ${moment(booking.startAtUtc).format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} has been confirmed`,
        type: 'booking',
        linkTarget: 'LearnerBookingCalendar'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      toast({ title: 'Booking confirmed', description: 'The pupil has been notified' });
      setIsProcessing(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Confirmation failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
    }
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      // Update booking status
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'declined_by_instructor'
      });

      // Release slot instance if exists
      if (slotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'available',
          reservedByPupilId: null,
          bookingId: null
        });
      }

      // Notify pupil
      await base44.entities.Notification.create({
        userId: pupil.linkedUserId,
        title: 'Lesson Request Declined',
        message: `Your lesson request for ${moment(booking.startAtUtc).format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} was declined`,
        type: 'booking',
        linkTarget: 'LearnerBookingCalendar'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Booking declined', description: 'The pupil has been notified' });
      setIsProcessing(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Decline failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      // Create refund ledger entry for confirmed bookings
      if (booking.status === 'confirmed' && booking.totalPriceGbp > 0) {
        await base44.entities.PaymentLedger.create({
          userId: booking.pupilId,
          bookingId: booking.id,
          type: 'refund',
          reason: 'lesson_cancelled_by_instructor',
          amountGbp: booking.totalPriceGbp,
          hours: booking.durationHours,
          createdByRole: 'instructor',
          note: 'Refund applied - lesson cancelled by instructor'
        });
      }

      // Update booking status
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'cancelled_by_instructor',
        cancelledAt: new Date().toISOString()
      });

      // Release slot instance if exists - make it available again
      if (slotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'available',
          bookingId: null
        });
      }

      // Notify pupil
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Cancelled',
          message: `Your instructor has cancelled the lesson scheduled for ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')}. Please book another slot.`,
          type: 'booking',
          linkTarget: 'LearnerBookingCalendar'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Lesson cancelled successfully', description: 'The pupil has been notified' });
      setIsProcessing(false);
      setShowCancelDialog(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Cancellation failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  });

  const reassignMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const oldPupilId = booking.pupilId;
      const newPupil = allPupils.find(p => p.id === selectedNewPupilId);

      // Update booking with new pupil
      await base44.entities.LessonBooking.update(booking.id, {
        pupilId: selectedNewPupilId
      });

      // Notify old pupil
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Updated',
          message: `Your lesson has been reassigned and is no longer scheduled under your account.`,
          type: 'booking',
          linkTarget: 'LearnerScheduledLessons'
        });
      }

      // Notify new pupil
      if (newPupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: newPupil.linkedUserId,
          title: 'New Lesson Scheduled',
          message: `A lesson has been scheduled for you on ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')}.`,
          type: 'booking',
          linkTarget: 'LearnerScheduledLessons'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Booking reassigned successfully' });
      setIsProcessing(false);
      setShowReassignDialog(false);
      setSelectedNewPupilId('');
      setPupilSearchQuery('');
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Reassignment failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
    }
  });

  const removePupilMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);

      // If booking was confirmed, create refund ledger entry
      if (booking.status === 'confirmed' && booking.totalPriceGbp > 0) {
        await base44.entities.PaymentLedger.create({
          userId: booking.pupilId,
          bookingId: booking.id,
          type: 'refund',
          reason: 'lesson_cancelled_by_instructor',
          amountGbp: booking.totalPriceGbp,
          hours: booking.durationHours,
          createdByRole: 'instructor',
          note: 'Refund applied - pupil removed by instructor'
        });
      }

      // Cancel booking
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'cancelled_by_instructor',
        cancelledAt: new Date().toISOString()
      });

      // Restore slot to available
      if (slotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'available',
          reservedByPupilId: null,
          bookingId: null
        });
      }

      // Notify pupil
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Cancelled',
          message: `Your instructor has removed you from a booking. The slot has been released.`,
          type: 'booking',
          linkTarget: 'LearnerScheduledLessons'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Pupil removed and slot restored to available' });
      setIsProcessing(false);
      setShowRemovePupilDialog(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Operation failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
      setShowRemovePupilDialog(false);
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);

      // If booking was confirmed, create refund ledger entry
      if (booking.status === 'confirmed' && booking.totalPriceGbp > 0) {
        await base44.entities.PaymentLedger.create({
          userId: booking.pupilId,
          bookingId: booking.id,
          type: 'refund',
          reason: 'lesson_cancelled_by_instructor',
          amountGbp: booking.totalPriceGbp,
          hours: booking.durationHours,
          createdByRole: 'instructor',
          note: 'Refund applied - booking deleted by instructor'
        });
      }

      // Cancel booking
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'cancelled_by_instructor',
        cancelledAt: new Date().toISOString()
      });

      // Restore slot to available
      if (slotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'available',
          reservedByPupilId: null,
          bookingId: null
        });
      }

      // Notify pupil
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Cancelled',
          message: `Your instructor has cancelled a booking. Please book another slot.`,
          type: 'booking',
          linkTarget: 'LearnerBookingCalendar'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Booking deleted and slot restored to available' });
      setIsProcessing(false);
      setShowDeleteBookingDialog(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Deletion failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
      setShowDeleteBookingDialog(false);
    }
  });

  if (!booking || !pupil) {
    return null;
  }

  const startMoment = moment(booking.startAtUtc).local();
  const endMoment = moment(booking.endAtUtc).local();
  const isPending = booking.status === 'reserved_pending_instructor';
  const isConfirmed = booking.status === 'confirmed';
  const canManage = isPending || isConfirmed;

  // Parse locations from notes
  const parseLocations = () => {
    const notes = booking.notesFromPupil || '';
    const pickupMatch = notes.match(/Pickup:\s*([^|]+)/);
    const dropoffMatch = notes.match(/Dropoff:\s*([^|]+)/);
    return {
      pickup: pickupMatch ? pickupMatch[1].trim() : 'Not specified',
      dropoff: dropoffMatch ? dropoffMatch[1].trim() : 'Not specified'
    };
  };

  const locations = parseLocations();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isPending ? 'Booking Request' : 'Booking Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pupil Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Pupil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-medium">{pupil.firstName} {pupil.lastName}</span>
              </div>
              {pupil.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-medium">{pupil.phone}</span>
                </div>
              )}
              {pupil.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium">{pupil.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slot Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Lesson Slot (Read-only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Date:</span>
                  <p className="font-medium text-slate-700">
                    {startMoment.format('dddd, D MMMM YYYY')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Time:</span>
                  <p className="font-medium text-slate-700">
                    {startMoment.format('HH:mm')} – {endMoment.format('HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span>
                  <p className="font-medium text-slate-700">{booking.durationHours} hour{booking.durationHours !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Pickup:</span>
                <p className="font-medium text-slate-700">{locations.pickup}</p>
              </div>
              <div>
                <span className="text-slate-500">Drop-off:</span>
                <p className="font-medium text-slate-700">{locations.dropoff}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pupil Notes */}
          {booking.notesFromPupil && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Pupil Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {booking.notesFromPupil.replace(/Pickup:.*?\|.*?Dropoff:.*?\|/, '').trim() || 'No additional notes provided'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Summary */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PoundSterling className="w-4 h-4 text-emerald-600" />
                Payment / Balance Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Lesson Price:</span>
                <span className="text-lg font-bold text-emerald-700">£{booking.totalPriceGbp.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {pupil.bulkPaymentBalance > 0 
                  ? 'Will be deducted from pupil\'s prepaid balance on confirmation' 
                  : 'Payment will be applied on confirmation'}
              </p>
            </CardContent>
          </Card>

          {/* Warning for pending */}
          {isPending && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Action Required</p>
                <p className="text-amber-700 mt-1">
                  Please confirm or decline this booking request. The pupil is waiting for your response.
                </p>
              </div>
            </div>
          )}

          {/* Booking Management Actions */}
          {canManage && (
            <Card className="border-slate-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Manage Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-600 mb-3">
                  You can reassign this booking to another pupil, remove the pupil to restore the slot to available, or delete the booking entirely.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReassignDialog(true)}
                    disabled={isProcessing}
                    className="w-full justify-start"
                  >
                    Reassign to another pupil
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRemovePupilDialog(true)}
                    disabled={isProcessing}
                    className="w-full justify-start border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Remove pupil (restore slot to available)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteBookingDialog(true)}
                    disabled={isProcessing}
                    className="w-full justify-start border-rose-300 text-rose-600 hover:bg-rose-50"
                  >
                    Delete booking (restore slot to available)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {isPending ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => declineMutation.mutate()}
                disabled={isProcessing}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decline'}
              </Button>
              <Button 
                onClick={() => confirmMutation.mutate()}
                disabled={isProcessing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
              </Button>
            </>
          ) : isConfirmed ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button 
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={isProcessing}
              >
                Cancel Lesson
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Confirmed Lesson</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this confirmed lesson? The pupil will be notified and the slot will become available again. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>No, Keep Lesson</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => cancelMutation.mutate()}
            disabled={isProcessing}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel Lesson'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Reassign Dialog */}
    <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Reassign Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slot Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Slot (Read-only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-medium">{startMoment.format('dddd, D MMMM YYYY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time:</span>
                <span className="font-medium">{startMoment.format('HH:mm')} – {endMoment.format('HH:mm')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pupil Selection */}
          <div className="space-y-2">
            <Label>Select new pupil *</Label>
            <div className="relative mb-2">
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={pupilSearchQuery}
                onChange={(e) => setPupilSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <Select value={selectedNewPupilId} onValueChange={setSelectedNewPupilId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pupil..." />
              </SelectTrigger>
              <SelectContent>
                <div className="max-h-[280px] overflow-y-auto">
                  {filteredPupils.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">
                      No pupils found
                    </div>
                  ) : (
                    filteredPupils.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.firstName} {p.lastName}</span>
                          {(p.email || p.phone) && (
                            <span className="text-xs text-slate-500">
                              {p.email || p.phone}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setShowReassignDialog(false);
            setSelectedNewPupilId('');
            setPupilSearchQuery('');
          }} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!selectedNewPupilId) {
                toast({ title: 'Please select a pupil', variant: 'destructive' });
                return;
              }
              reassignMutation.mutate();
            }}
            disabled={isProcessing || !selectedNewPupilId}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reassign Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Remove Pupil Dialog */}
    <AlertDialog open={showRemovePupilDialog} onOpenChange={setShowRemovePupilDialog}>
      <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Pupil</AlertDialogTitle>
          <AlertDialogDescription>
            Remove the pupil from this booking and restore the slot to available? The pupil will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>No, Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removePupilMutation.mutate()}
            disabled={isProcessing}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Remove Pupil'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Booking Dialog */}
    <AlertDialog open={showDeleteBookingDialog} onOpenChange={setShowDeleteBookingDialog}>
      <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Delete this booking entirely and restore the slot to available? The pupil will be notified. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>No, Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteBookingMutation.mutate()}
            disabled={isProcessing}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete Booking'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}