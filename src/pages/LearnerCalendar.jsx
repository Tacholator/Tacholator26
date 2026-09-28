import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  XCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import LessonDetailsDrawer from '@/components/calendar/LessonDetailsDrawer';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import PupilReserveLessonModal from '@/components/booking/PupilReserveLessonModal';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';

const VIEW_MODES = ['day', 'week'];

export default function LearnerCalendar() {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('week');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
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
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      if (user.email) {
        const byEmail = await base44.entities.Pupil.filter({ email: user.email });
        if (byEmail.length > 0) return byEmail[0];
      }
      return null;
    },
    enabled: !!user
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['myLessons', pupil?.id],
    queryFn: () => base44.entities.Lesson.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['instructorCalendarRules', pupil?.instructorId],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: pupil.instructorId }),
    enabled: !!pupil?.instructorId,
    refetchInterval: 60000
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['instructorBookings', pupil?.instructorId],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: pupil.instructorId }),
    enabled: !!pupil?.instructorId,
    refetchInterval: 15000
  });

  const { data: slotInstances = [] } = useQuery({
    queryKey: ['instructorSlotInstances', pupil?.instructorId],
    queryFn: () => base44.entities.BookableSlotInstance.filter({ instructorId: pupil.instructorId }),
    enabled: !!pupil?.instructorId,
    refetchInterval: 15000
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['myBookings', pupil?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const navigate = (direction) => {
    const unit = viewMode === 'day' ? 'day' : 'week';
    setCurrentDate(prev => moment(prev).add(direction, unit));
  };

  const getDaysToShow = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate.clone()];
    } else {
      const start = currentDate.clone().startOf('week');
      return Array.from({ length: 7 }, (_, i) => start.clone().add(i, 'days'));
    }
  }, [currentDate, viewMode]);

  const getLessonsForDay = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return lessons.filter(l => l.date === dateStr);
  };

  const openLessonDetails = (lesson) => {
    setSelectedLesson(lesson);
    setShowDetailsDrawer(true);
  };

  const reserveBookingMutation = useMutation({
    mutationFn: async ({ pickupLocation, dropoffLocation, notesFromPupil, firstTimeData }) => {
      const startMoment = selectedSlotInstance 
        ? moment(selectedSlotInstance.startAtUtc).local()
        : moment(selectedSlot);
      const endMoment = selectedSlotInstance
        ? moment(selectedSlotInstance.endAtUtc).local()
        : startMoment.clone().add(1, 'hours');
      const durationHours = endMoment.diff(startMoment, 'minutes') / 60;
      const totalPrice = (pupil.hourlyRate || 50) * durationHours;

      // Race condition check: verify slot is still available
      if (selectedSlotInstance?.id) {
        const freshSlots = await base44.entities.BookableSlotInstance.filter({ id: selectedSlotInstance.id });
        if (!freshSlots.length || freshSlots[0].status !== 'available') {
          throw new Error('This slot is no longer available. Please choose another time.');
        }
      }

      // Fetch fresh instructor profile to get latest requireBookingApproval setting
      const freshInstructorProfiles = await base44.entities.Instructor.filter({ created_by: pupil.instructorEmail });
      const freshInstructorProfile = freshInstructorProfiles[0] || null;
      // Global instructor setting: default true (approval required) unless explicitly set to false
      const requiresApproval = freshInstructorProfile?.requireBookingApproval !== false;
      const bookingStatus = requiresApproval ? 'reserved_pending_instructor' : 'confirmed';

      const booking = await base44.entities.LessonBooking.create({
        instructorId: pupil.instructorId,
        pupilId: pupil.id,
        startAtUtc: startMoment.utc().toISOString(),
        endAtUtc: endMoment.utc().toISOString(),
        durationHours,
        status: bookingStatus,
        confirmedAt: requiresApproval ? null : new Date().toISOString(),
        hourlyRateAtBookingGbp: pupil.hourlyRate || 50,
        totalPriceGbp: totalPrice,
        notesFromPupil: `Pickup: ${pickupLocation} | Dropoff: ${dropoffLocation}${notesFromPupil ? ' | ' + notesFromPupil : ''}${firstTimeData ? ` | First booking - Experience: ${firstTimeData.drivingExperience}, Transmission: ${firstTimeData.transmissionType}` : ''}`,
        requestedAt: new Date().toISOString(),
        slotInstanceId: selectedSlotInstance?.id || null
      });

      if (!requiresApproval) {
        // Deduct escrow amount from pupil's balance immediately
        const newBalance = (pupil.bulkPaymentBalance || 0) - totalPrice;
        await base44.entities.Pupil.update(pupil.id, { bulkPaymentBalance: newBalance });

        await base44.entities.PaymentLedger.create({
          userId: pupil.id,
          bookingId: booking.id,
          type: 'charge',
          reason: 'lesson_confirmed_charge',
          amountGbp: totalPrice,
          hours: durationHours,
          createdByRole: 'system',
          note: `Charge applied: £${totalPrice.toFixed(2)} deducted on booking confirmation`
        });
      }

      if (selectedSlotInstance?.id) {
        await base44.entities.BookableSlotInstance.update(selectedSlotInstance.id, {
          status: requiresApproval ? 'reserved_pending' : 'confirmed',
          reservedByPupilId: pupil.id,
          bookingId: booking.id
        });
      }

      await base44.entities.Notification.create({
        userId: pupil.instructorId,
        title: requiresApproval ? 'New Booking Request' : 'Lesson Booked',
        message: `${pupil.firstName} ${pupil.lastName} ${requiresApproval ? 'requested' : 'booked'} a lesson on ${startMoment.format('D MMM')} at ${startMoment.format('HH:mm')}${requiresApproval ? ' — awaiting your approval' : ' (auto-confirmed)'} | Pickup: ${pickupLocation}`,
        type: 'booking',
        linkTarget: 'Calendar'
      });

      if (pupil.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: requiresApproval ? 'Booking Request Sent' : 'Lesson Confirmed!',
          message: requiresApproval
            ? `Your lesson request for ${startMoment.format('D MMM')} at ${startMoment.format('HH:mm')} has been sent. Awaiting instructor approval.`
            : `Your lesson on ${startMoment.format('D MMM')} at ${startMoment.format('HH:mm')} is confirmed. £${totalPrice.toFixed(2)} has been deducted from your balance.`,
          type: 'booking',
          linkTarget: 'LearnerMyBookings'
        });
      }

      return booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      setShowReserveModal(false);
      setSelectedSlot(null);
      setSelectedSlotInstance(null);
      const isPending = booking?.status === 'reserved_pending_instructor';
      toast({ 
        title: isPending ? 'Booking request sent!' : 'Lesson confirmed!', 
        description: isPending ? 'Your request is awaiting instructor approval.' : 'Your lesson has been booked and confirmed instantly.'
      });
    },
    onError: (error) => {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, isLate }) => {
      const booking = myBookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: isLate ? 'cancelled_late_by_pupil' : 'cancelled_by_pupil',
        cancelledAt: new Date().toISOString(),
        cancelledByRole: 'pupil',
        lateCancellation: isLate,
        penaltyAmountGbp: isLate ? booking.totalPriceGbp : 0,
        penaltyHours: isLate ? booking.durationHours : 0
      });

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

      await base44.entities.Notification.create({
        userId: pupil.instructorId,
        title: isLate ? 'Late Cancellation' : 'Lesson Cancelled',
        message: `${pupil.firstName} ${pupil.lastName} cancelled a lesson${isLate ? ' within 48 hours. Full deduction applied.' : '.'}`,
        type: 'booking',
        linkTarget: 'Calendar'
      });
    },
    onSuccess: (_, { isLate }) => {
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['instructorBookings']);
      setShowLateCancelDialog(false);
      setCancellingBooking(null);
      toast({ 
        title: 'Lesson cancelled', 
        description: isLate ? 'Full deduction applied due to late cancellation' : 'No penalty applied'
      });
    }
  });

  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);

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

  if (lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (pupil && !pupil.instructorId) {
    return <NotLinkedBanner />;
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Linked</h2>
          <p className="text-slate-500">Your account hasn't been linked to a pupil profile yet.</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = myBookings.filter(b => 
    ['reserved_pending_instructor', 'confirmed'].includes(b.status) &&
    moment(b.startAtUtc).isAfter(moment())
  ).sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Book a Lesson</h1>
            <p className="text-slate-500 mt-1">View availability and schedule lessons</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-lg border shadow-sm p-1">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={() => setCurrentDate(moment())}>
            Today
          </Button>
          <Button variant="outline" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
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
                      <CalendarIcon className="w-4 h-4 text-slate-600" />
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

        {/* Calendar View */}
        {viewMode === 'day' ? (
          <CalendarDayView
            date={currentDate.format('YYYY-MM-DD')}
            lessons={getLessonsForDay(currentDate)}
            pupilMap={{}}
            onLessonClick={openLessonDetails}
            onSlotClick={() => {}}
            currentUser={user}
          />
        ) : (
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
        )}
      </div>

      <LessonDetailsDrawer
        lesson={selectedLesson}
        pupil={pupil}
        open={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedLesson(null);
        }}
        currentUser={user}
      />

      <PupilReserveLessonModal
        open={showReserveModal}
        onOpenChange={setShowReserveModal}
        onReserve={(data) => reserveBookingMutation.mutate(data)}
        isSaving={reserveBookingMutation.isPending}
        slotDateTime={selectedSlot}
        slotInstance={selectedSlotInstance}
        hourlyRate={pupil?.hourlyRate || 50}
      />

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
  );
}