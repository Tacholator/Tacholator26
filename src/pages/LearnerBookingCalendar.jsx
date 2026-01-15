import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Clock, Calendar, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import PupilReserveLessonModal from '@/components/booking/PupilReserveLessonModal';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function LearnerBookingCalendar() {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showLateCancelDialog, setShowLateCancelDialog] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!user?.id
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['instructorCalendarRules', pupil?.instructorId],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: pupil.instructorId }),
    enabled: !!pupil?.instructorId,
    refetchInterval: 5000 // Poll every 5 seconds for real-time updates
  });

  const { data: allInstructorBookings = [] } = useQuery({
    queryKey: ['instructorBookings', pupil?.instructorId],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: pupil.instructorId }),
    enabled: !!pupil?.instructorId,
    refetchInterval: 5000 // Poll every 5 seconds for real-time updates
  });

  // Filter out deleted bookings
  const bookings = allInstructorBookings.filter(b => !b.isDeleted);

  const { data: slotInstances = [] } = useQuery({
    queryKey: ['instructorSlotInstances', pupil?.instructorId],
    queryFn: () => base44.entities.BookableSlotInstance.filter({ instructorId: pupil.instructorId }),
    enabled: !!pupil?.instructorId,
    refetchInterval: 5000 // Poll every 5 seconds for real-time updates
  });

  const { data: allMyBookings = [] } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  // Filter out deleted bookings
  const myBookings = allMyBookings.filter(b => !b.isDeleted);

  const reserveBookingMutation = useMutation({
    mutationFn: async ({ pickupLocation, dropoffLocation, notesFromPupil, firstTimeData }) => {
      // Use slot instance times as source of truth
      const startMoment = selectedSlotInstance 
        ? moment(selectedSlotInstance.startAtUtc).local()
        : moment(selectedSlot);
      const endMoment = selectedSlotInstance
        ? moment(selectedSlotInstance.endAtUtc).local()
        : startMoment.clone().add(1, 'hours');
      const durationHours = endMoment.diff(startMoment, 'minutes') / 60;
      const booking = await base44.entities.LessonBooking.create({
        instructorId: pupil.instructorId,
        pupilId: pupil.id,
        startAtUtc: startMoment.utc().format(),
        endAtUtc: endMoment.utc().format(),
        durationHours,
        status: 'reserved_pending_instructor',
        hourlyRateAtBookingGbp: pupil.hourlyRate || 50,
        totalPriceGbp: (pupil.hourlyRate || 50) * durationHours,
        notesFromPupil: `Pickup: ${pickupLocation} | Dropoff: ${dropoffLocation}${notesFromPupil ? ' | ' + notesFromPupil : ''}${firstTimeData ? ` | First booking - Experience: ${firstTimeData.drivingExperience}, Transmission: ${firstTimeData.transmissionType}` : ''}`,
        requestedAt: new Date().toISOString(),
        slotInstanceId: selectedSlotInstance?.id || null
      });

      // Update slot instance if linked
      if (selectedSlotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(selectedSlotInstance.id, {
          status: 'reserved_pending',
          reservedByPupilId: pupil.id,
          bookingId: booking.id
        });
      }

      // Notify instructor
      await base44.entities.Notification.create({
        userId: pupil.instructorId,
        title: 'New Lesson Request',
        message: `${pupil.firstName} ${pupil.lastName} requested a lesson on ${startMoment.format('D MMM')} at ${startMoment.format('HH:mm')} | Pickup: ${pickupLocation}`,
        type: 'booking',
        linkTarget: 'InstructorBookingCalendar'
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      setShowReserveModal(false);
      setSelectedSlot(null);
      setSelectedSlotInstance(null);
      toast({ title: 'Booking request sent', description: 'Awaiting instructor confirmation' });
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, isLate }) => {
      const booking = myBookings.find(b => b.id === bookingId);
      const updates = {
        status: isLate ? 'cancelled_late_by_pupil' : 'cancelled_by_pupil',
        cancelledAt: new Date().toISOString(),
        cancelledByRole: 'pupil',
        lateCancellation: isLate,
        penaltyAmountGbp: isLate ? booking.totalPriceGbp : 0,
        penaltyHours: isLate ? booking.durationHours : 0
      };

      await base44.entities.LessonBooking.update(bookingId, updates);

      if (isLate) {
        await base44.entities.PaymentLedger.create({
          userId: pupil.id,
          bookingId: bookingId,
          type: 'charge',
          reason: 'late_cancellation_penalty',
          amountGbp: booking.totalPriceGbp,
          hours: booking.durationHours,
          createdByRole: 'system',
          note: 'Full deduction applied due to late cancellation (<48h)'
        });
      }

      // Notify instructor
      await base44.entities.Notification.create({
        userId: pupil.instructorId,
        title: isLate ? 'Late Cancellation' : 'Lesson Cancelled',
        message: `${pupil.firstName} ${pupil.lastName} cancelled a lesson${isLate ? ' within 48 hours. Full deduction applied.' : '.'}`,
        type: 'booking',
        linkTarget: 'InstructorBookingCalendar'
      });
    },
    onSuccess: (_, { isLate }) => {
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      setShowLateCancelDialog(false);
      setCancellingBooking(null);
      toast({ 
        title: 'Lesson cancelled', 
        description: isLate ? 'Full deduction applied due to late cancellation' : 'No penalty applied'
      });
    },
    onError: (error) => {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleSlotClick = (slotDateTime, slotInstance) => {
    setSelectedSlot(slotDateTime);
    setSelectedSlotInstance(slotInstance);
    setShowReserveModal(true);
  };

  const handleCancelClick = (booking) => {
    const hoursUntilStart = moment(booking.startAtUtc).diff(moment(), 'hours', true);
    
    if (hoursUntilStart < 48) {
      setCancellingBooking(booking);
      setShowLateCancelDialog(true);
    } else {
      cancelBookingMutation.mutate({ bookingId: booking.id, isLate: false });
    }
  };

  const upcomingBookings = myBookings.filter(b => 
    ['reserved_pending_instructor', 'confirmed'].includes(b.status) &&
    moment(b.startAtUtc).isAfter(moment())
  ).sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <Card className="max-w-md text-center p-8">
          <p className="text-slate-500">Pupil profile not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link to={createPageUrl('LearnerDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Book a Lesson</h1>
          <p className="text-slate-500">Click on available slots to request a lesson</p>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Upcoming Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-slate-700">
                        {moment(booking.startAtUtc).local().format('ddd, D MMM YYYY')}
                      </span>
                      <Badge className={
                        booking.status === 'confirmed' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }>
                        {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {moment(booking.startAtUtc).local().format('HH:mm')} - {moment(booking.endAtUtc).local().format('HH:mm')}
                        {' '}({booking.durationHours}h)
                      </span>
                    </div>
                    <div className="text-sm font-medium text-emerald-700">
                      £{booking.totalPriceGbp.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelClick(booking)}
                    disabled={cancelBookingMutation.isPending}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Calendar24Hour
              viewMode="week"
              rules={rules}
              bookings={bookings}
              slotInstances={slotInstances}
              availabilityMode="published_slots_only"
              onSlotClick={handleSlotClick}
              isInstructor={false}
              currentPupilId={pupil?.id}
              pupils={[]}
            />
          </CardContent>
        </Card>

        {/* Reserve Lesson Modal */}
        <PupilReserveLessonModal
          open={showReserveModal}
          onOpenChange={setShowReserveModal}
          onReserve={(data) => reserveBookingMutation.mutate(data)}
          isSaving={reserveBookingMutation.isPending}
          slotDateTime={selectedSlot}
          slotInstance={selectedSlotInstance}
          hourlyRate={pupil.hourlyRate || 50}
        />

        {/* Late Cancellation Dialog */}
        <AlertDialog open={showLateCancelDialog} onOpenChange={setShowLateCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Late Cancellation
              </AlertDialogTitle>
              <AlertDialogDescription>
                This lesson starts in less than 48 hours. Cancelling now will deduct the full lesson price (£{cancellingBooking?.totalPriceGbp.toFixed(2)}) from your balance. Do you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Lesson</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cancelBookingMutation.mutate({ bookingId: cancellingBooking?.id, isLate: true })}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Cancel Lesson (Full Deduction)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}