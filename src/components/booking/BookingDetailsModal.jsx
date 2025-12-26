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
import { Loader2, User, Calendar, MapPin, FileText, PoundSterling, AlertCircle } from 'lucide-react';
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

  const { data: pupil } = useQuery({
    queryKey: ['pupil', booking?.pupilId],
    queryFn: () => base44.entities.Pupil.filter({ id: booking.pupilId }).then(p => p[0]),
    enabled: !!booking?.pupilId
  });

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

  if (!booking || !pupil) {
    return null;
  }

  const startMoment = moment(booking.startAtUtc).local();
  const endMoment = moment(booking.endAtUtc).local();
  const isPending = booking.status === 'reserved_pending_instructor';
  const isConfirmed = booking.status === 'confirmed';

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
    </>
  );
}