import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CalendarDays, Coffee, Loader2 } from 'lucide-react';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import WorkingHoursModal from '@/components/booking/WorkingHoursModal';
import UnavailableModal from '@/components/booking/UnavailableModal';
import LunchBreakModal from '@/components/booking/LunchBreakModal';
import PendingBookingsPanel from '@/components/booking/PendingBookingsPanel';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function InstructorBookingCalendar() {
  const [viewMode, setViewMode] = useState('week');
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [showLunchModal, setShowLunchModal] = useState(false);
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

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['lessonBookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
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
    }
  });

  const declineBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const booking = bookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'declined_by_instructor',
        cancelledAt: new Date().toISOString(),
        cancelledByRole: 'instructor',
        cancellationReason: reason
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
    }
  });

  const pendingBookings = bookings.filter(b => b.status === 'reserved_pending_instructor');

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
              isInstructor={true}
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
      </div>
    </div>
  );
}