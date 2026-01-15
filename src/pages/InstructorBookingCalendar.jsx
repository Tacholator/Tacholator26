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
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import { useMaintenance } from '@/components/maintenance/MaintenanceProvider';

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isMaintenanceError, handleMaintenanceError } = useMaintenance();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['calendarRules', user?.id],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['lessonBookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user?.id
  });

  const { data: slotInstances = [] } = useQuery({
    queryKey: ['slotInstances', user?.id],
    queryFn: () => base44.entities.BookableSlotInstance.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    refetchInterval: 5000
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
    },
    onError: (error) => {
      if (isMaintenanceError(error)) {
        handleMaintenanceError('createCalendarRule', (data) => createRuleMutation.mutate(data), null);
      } else {
        toast({ title: 'Failed to save rule', description: error.message, variant: 'destructive' });
      }
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const booking = bookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        startAt: booking.startAtUtc || booking.startAt,
        endAt: booking.endAtUtc || booking.endAt,
        instructorId: booking.instructorId
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

      // Create notification for pupil
      await base44.entities.Notification.create({
        userId: booking.pupilId,
        title: 'Lesson Confirmed',
        message: `Your lesson on ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} has been confirmed.`,
        type: 'booking',
        linkTarget: 'LearnerCalendar'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      toast({ title: 'Booking confirmed' });
    },
    onError: (error) => {
      if (isMaintenanceError(error)) {
        handleMaintenanceError('confirmBooking', () => confirmBookingMutation.mutate(), null);
      } else {
        toast({ title: 'Failed to confirm booking', description: error.message, variant: 'destructive' });
      }
    }
  });

  const declineBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const booking = bookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'declined_by_instructor',
        cancelledAt: new Date().toISOString(),
        cancelledByRole: 'instructor',
        cancellationReason: reason,
        startAt: booking.startAtUtc || booking.startAt,
        endAt: booking.endAtUtc || booking.endAt,
        instructorId: booking.instructorId
      });

      // Create notification for pupil
      await base44.entities.Notification.create({
        userId: booking.pupilId,
        title: 'Lesson Declined',
        message: `Your lesson request for ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} was declined.`,
        type: 'booking',
        linkTarget: 'LearnerCalendar'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      toast({ title: 'Booking declined' });
    },
    onError: (error) => {
      if (isMaintenanceError(error)) {
        handleMaintenanceError('declineBooking', (reason) => declineBookingMutation.mutate({ bookingId: booking?.id, reason }), null);
      } else {
        toast({ title: 'Failed to decline booking', description: error.message, variant: 'destructive' });
      }
    }
  });

  const pendingBookings = bookings.filter(b => b.status === 'reserved_pending_instructor');

  const handleSlotClick = (slotDateTime, slotInstance) => {
    if (typeof slotInstance === 'object' && slotInstance.status === 'available') {
      // Available slot clicked - open schedule modal
      setSelectedSlotForSchedule(slotInstance);
      setShowScheduleLessonModal(true);
    }
  };

  const handlePendingSlotClick = (booking, slotInstance) => {
    setSelectedBooking(booking);
    setSelectedSlotInstance(slotInstance);
    setShowBookingDetailsModal(true);
  };

  const deleteBookingMutation = useMutation({
    mutationFn: async ({ booking, slotInstance }) => {
      if (booking) {
        const pupil = pupils.find(p => p.id === booking.pupilId);
        
        // Hard delete the booking
        await base44.entities.LessonBooking.delete(booking.id);

        // Notify pupil
        if (pupil?.linkedUserId) {
          await base44.entities.Notification.create({
            userId: pupil.linkedUserId,
            title: 'Lesson Cancelled',
            message: `Your instructor has cancelled the lesson scheduled for ${moment(booking.startAtUtc).local().format('D MMM [at] HH:mm')}.`,
            type: 'booking',
            linkTarget: 'LearnerBookingCalendar'
          });
        }
      }

      if (slotInstance) {
        await base44.entities.BookableSlotInstance.update(slotInstance.id, {
          status: 'available',
          bookingId: null,
          startAtUtc: slotInstance.startAtUtc,
          endAtUtc: slotInstance.endAtUtc
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      toast({ title: 'Booking deleted successfully' });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      if (isMaintenanceError(error)) {
        handleMaintenanceError('deleteBooking', () => deleteBookingMutation.mutate(deleteTarget), deleteTarget);
      } else {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      }
    }
  });

  const handleDeleteBooking = (bookingOrSlot, state) => {
    const booking = bookingOrSlot.pupilId ? bookingOrSlot : null;
    const slotInstance = bookingOrSlot.slotInstanceId || bookingOrSlot.templateId ? bookingOrSlot : null;
    
    setDeleteTarget({ booking, slotInstance, state });
    setShowDeleteDialog(true);
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

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this booking? The pupil will be notified and the slot will become available again. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBookingMutation.mutate(deleteTarget)}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Delete Booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}