import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Clock, CalendarDays, Coffee, Loader2 } from 'lucide-react';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import WorkingHoursModal from '@/components/booking/WorkingHoursModal';
import UnavailableModal from '@/components/booking/UnavailableModal';
import LunchBreakModal from '@/components/booking/LunchBreakModal';
import PendingBookingsPanel from '@/components/booking/PendingBookingsPanel';
import InstructorScheduleLessonModal from '@/components/booking/InstructorScheduleLessonModal';
import BookingDetailsModal from '@/components/booking/BookingDetailsModal';
import CreateBookableSlotModal from '@/components/booking/CreateBookableSlotModal';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function InstructorBookingCalendar() {
  const [viewMode, setViewMode] = useState('week');
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [showLunchModal, setShowLunchModal] = useState(false);
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [selectedSlotForSchedule, setSelectedSlotForSchedule] = useState(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [clickedSlotDateTime, setClickedSlotDateTime] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['calendarRules', user?.id],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['lessonBookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  // Filter out deleted bookings
  const bookings = allBookings.filter(b => !b.isDeleted);

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user?.id
  });

  const { data: slotInstances = [] } = useQuery({
    queryKey: ['slotInstances', user?.id],
    queryFn: () => base44.entities.BookableSlotInstance.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarRule.create({
      ...data,
      instructorId: user.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Rule saved successfully' });
      setShowWorkingHoursModal(false);
      setShowUnavailableModal(false);
      setShowLunchModal(false);
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const booking = bookings.find(b => b.id === bookingId);
      const pupil = pupils.find(p => p.id === booking.pupilId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      });
      
      // Create payment ledger entry
      await base44.entities.PaymentLedger.create({
        userId: booking.pupilId,
        bookingId: bookingId,
        type: 'charge',
        reason: 'lesson_confirmed_charge',
        amountGbp: booking.totalPriceGbp,
        hours: booking.durationHours,
        createdByRole: 'system',
        note: 'Charge applied on confirmation'
      });

      // Create notification for pupil using linkedUserId (user account ID)
      const notifyUserId = pupil?.linkedUserId;
      if (notifyUserId) {
        await base44.entities.Notification.create({
          userId: notifyUserId,
          title: 'Lesson Confirmed',
          message: `Your lesson on ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} has been confirmed.`,
          type: 'booking',
          linkTarget: 'LearnerMyBookings'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      toast({ title: 'Booking confirmed' });
    }
  });

  const declineBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      // Get the booking from local state (already loaded)
      const booking = bookings.find(b => b.id === bookingId);

      await base44.entities.LessonBooking.update(bookingId, {
        status: 'declined_by_instructor',
        cancelledAt: new Date().toISOString(),
        cancelledByRole: 'instructor',
        cancellationReason: reason
      });

      // Notify pupil via their linked user account
      if (booking?.pupilId) {
        // Fetch pupil fresh to guarantee linkedUserId is present
        const pupilResults = await base44.entities.Pupil.filter({ id: booking.pupilId });
        const pupil = pupilResults[0];
        if (pupil?.linkedUserId) {
          await base44.entities.Notification.create({
            userId: pupil.linkedUserId,
            title: 'Lesson Request Declined',
            message: `Your lesson request for ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} was declined.${reason ? ` Reason: ${reason}` : ''}`,
            type: 'booking',
            linkTarget: 'LearnerMyBookings'
          });
        }
      }

      // Release the slot if linked
      if (booking?.slotInstanceId) {
        await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
          status: 'available',
          reservedByPupilId: null,
          bookingId: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      toast({ title: 'Booking declined' });
    }
  });

  const pendingBookings = bookings.filter(b => b.status === 'reserved_pending_instructor');

  const handleSlotClick = (slotDateTime, slotInstance) => {
    if (typeof slotInstance === 'object' && slotInstance.status === 'available') {
      // Available slot clicked - open schedule modal
      setSelectedSlotForSchedule(slotInstance);
      setShowScheduleLessonModal(true);
    } else if (typeof slotInstance === 'string' || !slotInstance) {
      // Empty area clicked - open create slot modal
      setClickedSlotDateTime(slotDateTime);
      setShowCreateSlotModal(true);
    }
  };

  const handlePendingSlotClick = (booking, slotInstance) => {
    setSelectedBooking(booking);
    setSelectedSlotInstance(slotInstance);
    setShowBookingDetailsModal(true);
  };

  const createSlotMutation = useMutation({
    mutationFn: async (slotData) => {
      const { title, startDate, startTime, endTime, repeatWeekly, selectedDays, stopDate } = slotData;
      
      if (repeatWeekly) {
        // Create template
        const template = await base44.entities.BookableSlotTemplate.create({
          instructorId: user.id,
          title: title || 'Available Slot',
          daysOfWeek: selectedDays,
          startTimeLocal: startTime,
          endTimeLocal: endTime,
          startDate: startDate,
          endDate: stopDate || null,
          isActive: true
        });

        // Generate instances from template
        const instances = [];
        const start = moment(startDate);
        const end = stopDate ? moment(stopDate) : moment(startDate).add(12, 'weeks');
        
        while (start.isSameOrBefore(end)) {
          const dayOfWeek = start.format('ddd').toLowerCase();
          if (selectedDays.includes(dayOfWeek)) {
            const startAtUtc = moment(`${start.format('YYYY-MM-DD')} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
            const endAtUtc = moment(`${start.format('YYYY-MM-DD')} ${endTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
            
            instances.push({
              instructorId: user.id,
              templateId: template.id,
              startAtUtc,
              endAtUtc,
              status: 'available',
              title: title || 'Available Slot'
            });
          }
          start.add(1, 'day');
        }

        await Promise.all(instances.map(inst => base44.entities.BookableSlotInstance.create(inst)));
      } else {
        // Create single instance
        const startAtUtc = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        const endAtUtc = moment(`${startDate} ${endTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        
        await base44.entities.BookableSlotInstance.create({
          instructorId: user.id,
          startAtUtc,
          endAtUtc,
          status: 'available',
          title: title || 'Available Slot'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Bookable slot created successfully' });
      setShowCreateSlotModal(false);
      setClickedSlotDateTime(null);
    },
    onError: (error) => {
      toast({ title: 'Failed to create slot', description: error.message, variant: 'destructive' });
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async ({ booking, slotInstance }) => {
      if (booking) {
        // Fetch pupil fresh to get current (non-stale) balance
        const pupilResults = await base44.entities.Pupil.filter({ id: booking.pupilId });
        const pupil = pupilResults[0];
        
        // Soft delete the booking - mark as deleted
        await base44.entities.LessonBooking.update(booking.id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedByRole: 'instructor',
          status: 'deleted'
        });

        // Free up the slot instance if linked
        if (booking.slotInstanceId) {
          await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
            status: 'available',
            bookingId: null,
            reservedByPupilId: null
          });
        }

        // If booking was confirmed, refund the lesson cost to the pupil's balance
        const isConfirmed = booking.status === 'confirmed';
        const refundAmount = booking.totalPriceGbp || 0;
        if (isConfirmed && pupil && refundAmount > 0) {
          await base44.entities.Pupil.update(pupil.id, {
            bulkPaymentBalance: (pupil.bulkPaymentBalance || 0) + refundAmount
          });
          await base44.entities.PaymentLedger.create({
            userId: pupil.linkedUserId || pupil.id,
            bookingId: booking.id,
            type: 'refund',
            reason: 'refund_issued',
            amountGbp: refundAmount,
            hours: booking.durationHours || 0,
            createdByRole: 'instructor',
            note: `Refund issued: instructor cancelled confirmed lesson on ${moment(booking.startAtUtc).local().format('D MMM YYYY [at] HH:mm')}`
          });
        }

        // Notify pupil
        if (pupil?.linkedUserId) {
          const refundMsg = isConfirmed && refundAmount > 0
            ? ` £${refundAmount.toFixed(2)} has been refunded to your balance.`
            : '';
          await base44.entities.Notification.create({
            userId: pupil.linkedUserId,
            title: 'Lesson Cancelled by Instructor',
            message: `Your instructor has cancelled the lesson scheduled for ${moment(booking.startAtUtc).local().format('D MMM [at] HH:mm')}.${refundMsg}`,
            type: 'booking',
            linkTarget: 'LearnerBookingCalendar'
          });
        }
      }

      // Handle slot instance only deletions (no booking attached)
      if (slotInstance && !booking) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'available',
          bookingId: null,
          reservedByPupilId: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      queryClient.invalidateQueries(['pupils']);
      toast({ title: 'Booking cancelled successfully' });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: 'Cancel failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleDeleteBooking = (bookingOrSlot, state) => {
    const booking = bookingOrSlot.pupilId ? bookingOrSlot : null;
    const slotInstance = bookingOrSlot.slotInstanceId || bookingOrSlot.templateId ? bookingOrSlot : null;
    
    setDeleteTarget({ booking, slotInstance, state });
    setShowDeleteDialog(true);
  };

  // Build delete dialog description based on whether booking is confirmed
  const deleteDialogDescription = () => {
    const booking = deleteTarget?.booking;
    if (booking?.status === 'confirmed') {
      const escrowAmount = booking?.escrowAmountGbp || 0;
      const totalPrice = booking?.totalPriceGbp || 0;
      const refundAmount = escrowAmount > 0 ? escrowAmount : totalPrice;
      if (refundAmount > 0) {
        return `Are you sure you want to cancel this confirmed booking? The pupil will be notified and £${refundAmount.toFixed(2)} held in escrow will be returned to their balance immediately.`;
      }
      return 'Are you sure you want to cancel this confirmed booking? The pupil will be notified and the slot will become available again.';
    }
    return 'Are you sure you want to cancel this booking? The pupil will be notified and the slot will become available again.';
  };

  if (rulesLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Booking Calendar</h1>
          <p className="text-slate-500">Manage your availability and bookings</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={() => setShowWorkingHoursModal(true)}
            className="bg-teal-600 hover:bg-teal-700 gap-2"
          >
            <Clock className="w-4 h-4" />
            Set Working Hours
          </Button>
          <Button
            onClick={() => setShowUnavailableModal(true)}
            variant="outline"
            className="gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            Add Unavailable Block
          </Button>
          <Button
            onClick={() => setShowLunchModal(true)}
            variant="outline"
            className="gap-2"
          >
            <Coffee className="w-4 h-4" />
            Add Lunch Break
          </Button>
        </div>

        {/* Tabs for View Mode */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
          <TabsList>
            <TabsTrigger value="day">Day View</TabsTrigger>
            <TabsTrigger value="week">Week View</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <PendingBookingsPanel
              bookings={pendingBookings}
              pupils={pupils}
              onConfirm={(id) => confirmBookingMutation.mutate(id)}
              onDecline={(id, reason) => declineBookingMutation.mutate({ bookingId: id, reason })}
              isLoading={confirmBookingMutation.isPending || declineBookingMutation.isPending}
            />
          </div>
        )}

        {/* Calendar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Calendar24Hour
              viewMode={viewMode}
              rules={rules}
              bookings={bookings}
              slotInstances={slotInstances}
              availabilityMode="published_slots_only"
              isInstructor={true}
              onSlotClick={handleSlotClick}
              onPendingSlotClick={handlePendingSlotClick}
              onDeleteBooking={handleDeleteBooking}
              pupils={pupils}
            />
          </CardContent>
        </Card>

        {/* Modals */}
        <WorkingHoursModal
          open={showWorkingHoursModal}
          onOpenChange={setShowWorkingHoursModal}
          onSave={(data) => createRuleMutation.mutate({ ...data, ruleType: 'working_hours' })}
          isSaving={createRuleMutation.isPending}
        />

        <UnavailableModal
          open={showUnavailableModal}
          onOpenChange={setShowUnavailableModal}
          onSave={(data) => createRuleMutation.mutate({ ...data, ruleType: 'unavailable' })}
          isSaving={createRuleMutation.isPending}
        />

        <LunchBreakModal
          open={showLunchModal}
          onOpenChange={setShowLunchModal}
          onSave={(data) => createRuleMutation.mutate({ ...data, ruleType: 'lunch_break' })}
          isSaving={createRuleMutation.isPending}
        />

        <InstructorScheduleLessonModal
          open={showScheduleLessonModal}
          onOpenChange={setShowScheduleLessonModal}
          slotInstance={selectedSlotForSchedule}
        />

        <BookingDetailsModal
          open={showBookingDetailsModal}
          onOpenChange={setShowBookingDetailsModal}
          booking={selectedBooking}
          slotInstance={selectedSlotInstance}
          onConfirm={confirmBookingMutation.mutate}
          onDecline={(reason) => declineBookingMutation.mutate({ bookingId: selectedBooking?.id, reason })}
          isLoading={confirmBookingMutation.isPending || declineBookingMutation.isPending}
        />

        <CreateBookableSlotModal
          open={showCreateSlotModal}
          onOpenChange={setShowCreateSlotModal}
          onSave={(data) => createSlotMutation.mutate(data)}
          isSaving={createSlotMutation.isPending}
          slotDateTime={clickedSlotDateTime}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialogDescription()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBookingMutation.mutate(deleteTarget)}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Cancel Booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}