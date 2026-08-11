import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Clock, CalendarDays, Coffee, Loader2, Settings, Eye, Lock, Zap, Plus } from 'lucide-react';
import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import InstructorMonthCalendar from '@/components/booking/InstructorMonthCalendar';
import WorkingHoursModal from '@/components/booking/WorkingHoursModal';
import UnavailableModal from '@/components/booking/UnavailableModal';
import LunchBreakModal from '@/components/booking/LunchBreakModal';
import PendingBookingsPanel from '@/components/booking/PendingBookingsPanel';
import InstructorScheduleLessonModal from '@/components/booking/InstructorScheduleLessonModal';
import NewLessonModal from '@/components/booking/NewLessonModal';
import BookingDetailsModal from '@/components/booking/BookingDetailsModal';
import CreateBookableSlotModal from '@/components/booking/CreateBookableSlotModal';
import SlotDetailsModal from '@/components/booking/SlotDetailsModal';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function InstructorBookingCalendar() {
  const [viewMode, setViewMode] = useState('week');
  const [availabilityMode, setAvailabilityMode] = useState('published_slots_only');
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [showLunchModal, setShowLunchModal] = useState(false);
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [selectedSlotForSchedule, setSelectedSlotForSchedule] = useState(null);
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [clickedSlotDateTime, setClickedSlotDateTime] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showSlotDetailsModal, setShowSlotDetailsModal] = useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { hasValidSub } = useInstructorSubscription(user?.id);

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
    mutationFn: async (data) => {
      await base44.entities.CalendarRule.create({ ...data, instructorId: user.id });
      // Mark calendar onboarding step as complete when working hours are saved
      if (data.ruleType === 'working_hours') {
        const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
        if (instructors.length > 0 && !instructors[0].onboardingCalendarCompleted) {
          await base44.entities.Instructor.update(instructors[0].id, { onboardingCalendarCompleted: true });
          queryClient.invalidateQueries(['instructor']);
        }
      }
    },
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

  const [isConfirmingAll, setIsConfirmingAll] = useState(false);

  const handleConfirmAll = async () => {
    setIsConfirmingAll(true);
    try {
      await Promise.all(pendingBookings.map(async (booking) => {
        const pupil = pupils.find(p => p.id === booking.pupilId);
        await base44.entities.LessonBooking.update(booking.id, {
          status: 'confirmed',
          confirmedAt: new Date().toISOString()
        });
        await base44.entities.PaymentLedger.create({
          userId: booking.pupilId,
          bookingId: booking.id,
          type: 'charge',
          reason: 'lesson_confirmed_charge',
          amountGbp: booking.totalPriceGbp,
          hours: booking.durationHours,
          createdByRole: 'system',
          note: 'Charge applied on confirmation'
        });
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
      }));
      queryClient.invalidateQueries(['lessonBookings']);
      toast({ title: `${pendingBookings.length} bookings confirmed` });
    } finally {
      setIsConfirmingAll(false);
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'reserved_pending_instructor');

  const handleSlotClick = (slotDateTime, slotInstance) => {
    if (typeof slotInstance === 'object' && slotInstance.status === 'available') {
      // Available slot clicked - open slot details first
      setSelectedSlotDetails(slotInstance);
      setShowSlotDetailsModal(true);
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
      const { slotId, title, startDate, startTime, endTime, repeatWeekly, selectedDays, stopDate } = slotData;

      // Edit existing single slot
      if (slotId) {
        const startAtUtc = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        const endAtUtc = moment(`${startDate} ${endTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
        await base44.entities.BookableSlotInstance.update(slotId, {
          startAtUtc,
          endAtUtc,
          title: title || undefined
        });
        return;
      }

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
        // Fetch fresh booking data to ensure slotInstanceId is up to date
        const freshBookingResults = await base44.entities.LessonBooking.filter({ id: booking.id });
        const freshBooking = freshBookingResults[0] || booking;

        // Fetch pupil fresh to get current (non-stale) balance
        const pupilResults = await base44.entities.Pupil.filter({ id: freshBooking.pupilId });
        const pupil = pupilResults[0];
        
        // Soft delete the booking - mark as deleted
        await base44.entities.LessonBooking.update(freshBooking.id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedByRole: 'instructor',
          status: 'deleted'
        });

        // Free up the slot instance if linked
        if (freshBooking.slotInstanceId) {
          await base44.entities.BookableSlotInstance.update(freshBooking.slotInstanceId, {
            status: 'available',
            bookingId: null,
            reservedByPupilId: null
          });
        }

        // If booking was confirmed, refund the escrow (or total price) to the pupil's balance
        const isConfirmed = booking.status === 'confirmed';
        const escrowAmount = booking.escrowAmountGbp || 0;
        const refundAmount = escrowAmount > 0 ? escrowAmount : (booking.totalPriceGbp || 0);
        if (isConfirmed && pupil && refundAmount > 0) {
          await base44.entities.Pupil.update(pupil.id, {
            bulkPaymentBalance: (pupil.bulkPaymentBalance || 0) + refundAmount
          });
          // Clear escrow on the booking
          await base44.entities.LessonBooking.update(booking.id, { escrowAmountGbp: 0 });
          await base44.entities.PaymentLedger.create({
            userId: pupil.linkedUserId || pupil.id,
            bookingId: booking.id,
            type: 'refund',
            reason: 'refund_issued',
            amountGbp: refundAmount,
            hours: booking.durationHours || 0,
            createdByRole: 'instructor',
            note: `Refund issued: instructor cancelled confirmed lesson on ${moment(booking.startAtUtc).local().format('D MMM YYYY [at] HH:mm')}${escrowAmount > 0 ? ' (escrow returned)' : ''}`
          });
        }

        // Notify pupil
        if (pupil?.linkedUserId) {
          const refundMsg = isConfirmed && refundAmount > 0
            ? ` £${refundAmount.toFixed(2)} has been returned to your balance.`
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
        await base44.entities.BookableSlotInstance.delete(slotInstance.id);
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

  // Build delete dialog description based on whether it's a slot or booking
  const isSlotOnlyDelete = deleteTarget?.slotInstance && !deleteTarget?.booking;
  const deleteDialogDescription = () => {
    if (isSlotOnlyDelete) {
      return 'Are you sure you want to delete this available slot? It will be permanently removed from your calendar.';
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {!hasValidSub && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-amber-800 text-sm font-medium">To access full calendar controls, select a plan.</p>
            </div>
            <a href="/InstructorSubscription">
              <button className="flex items-center gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold text-sm px-4 py-2 rounded-lg transition-colors shrink-0">
                <Zap className="w-4 h-4" />
                Start Free Trial
              </button>
            </a>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-800 mb-0.5 sm:mb-2">Booking Calendar</h1>
            <p className="text-xs sm:text-sm text-slate-500">Manage your availability and bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors border-l ${viewMode !== 'month' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Schedule
              </button>
            </div>
            <Button
              onClick={() => setShowNewLessonModal(true)}
              className="bg-[#071739] hover:bg-[#0d2659] text-white gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Lesson</span>
            </Button>
          {/* Settings Icon - shown on all screen sizes */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Calendar Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={() => setShowWorkingHoursModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 gap-2 justify-start"
                >
                  <Clock className="w-4 h-4" />
                  Set Working Hours
                </Button>
                <Button
                  onClick={() => setShowUnavailableModal(true)}
                  variant="outline"
                  className="gap-2 justify-start"
                >
                  <CalendarDays className="w-4 h-4" />
                  Add Unavailable Block
                </Button>
                <Button
                  onClick={() => setShowLunchModal(true)}
                  variant="outline"
                  className="gap-2 justify-start"
                >
                  <Coffee className="w-4 h-4" />
                  Add Lunch Break
                </Button>
                {/* Mode toggle */}
                <div className="flex items-center justify-between px-4 py-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Published slots only</div>
                      <div className="text-xs text-slate-500">
                        {availabilityMode === 'published_slots_only'
                          ? 'Showing published bookable slots'
                          : 'Showing all working hours availability'}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={availabilityMode === 'published_slots_only'}
                    onCheckedChange={(checked) =>
                      setAvailabilityMode(checked ? 'published_slots_only' : 'working_hours')
                    }
                  />
                </div>

                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Colour Key</p>
                  <div className="flex flex-col gap-2 text-sm">
                    {[
                      { label: 'Available', color: '#B7F7C9' },
                      { label: 'Confirmed', color: '#87CEFA' },
                      { label: 'Practical Test', color: '#D2B48C' },
                      { label: 'Completed', color: '#CFCFCF' },
                      { label: 'Cancelled', color: '#FFCC80' },
                      { label: 'No Show', color: '#FF8A80' },
                      { label: 'Pending', color: '#B39DDB' },
                      { label: 'Lunch', color: '#F7B602' },
                      { label: 'Unavailable', color: '#FFB3B3' },
                      { label: 'Outside Hours', color: '#E8E8E8' },
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border border-slate-200 shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-slate-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>





        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <PendingBookingsPanel
              bookings={pendingBookings}
              pupils={pupils}
              onConfirm={(id) => confirmBookingMutation.mutate(id)}
              onDecline={(id, reason) => declineBookingMutation.mutate({ bookingId: id, reason })}
              onConfirmAll={handleConfirmAll}
              isLoading={confirmBookingMutation.isPending || declineBookingMutation.isPending || isConfirmingAll}
              isConfirmingAll={isConfirmingAll}
            />
          </div>
        )}

        {/* Calendar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 sm:p-6">
            {viewMode === 'month' ? (
              <InstructorMonthCalendar
                slotInstances={slotInstances}
                bookings={bookings}
                pupils={pupils}
                onSlotClick={handleSlotClick}
                onBookingClick={(booking) => handlePendingSlotClick(booking, null)}
                onCreateSlot={(dateStr) => {
                  setClickedSlotDateTime(dateStr);
                  setShowCreateSlotModal(true);
                }}
              />
            ) : (
              <Calendar24Hour
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                rules={rules}
                bookings={bookings}
                slotInstances={slotInstances}
                availabilityMode={availabilityMode}
                isInstructor={true}
                onSlotClick={handleSlotClick}
                onPendingSlotClick={handlePendingSlotClick}
                onDeleteBooking={handleDeleteBooking}
                pupils={pupils}
              />
            )}
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

        <NewLessonModal
          open={showNewLessonModal}
          onOpenChange={setShowNewLessonModal}
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

        <SlotDetailsModal
          open={showSlotDetailsModal}
          onOpenChange={setShowSlotDetailsModal}
          slotInstance={selectedSlotDetails}
          isInstructor={true}
          onBookForPupil={(slot) => {
            setSelectedSlotForSchedule(slot);
            setShowScheduleLessonModal(true);
          }}
          onEditSlot={(slot) => {
            setEditingSlot(slot);
            setClickedSlotDateTime(null);
            setShowCreateSlotModal(true);
          }}
          onDeleteSlot={({ slotInstanceId, sourceTemplateId, deleteOption, startAtUtc }) => {
            const slot = selectedSlotDetails;
            deleteBookingMutation.mutate({ booking: null, slotInstance: slot });
            setShowSlotDetailsModal(false);
          }}
          isDeleting={deleteBookingMutation.isPending}
        />

        <CreateBookableSlotModal
          open={showCreateSlotModal}
          onOpenChange={(val) => {
            setShowCreateSlotModal(val);
            if (!val) setEditingSlot(null);
          }}
          onSave={(data) => createSlotMutation.mutate(data)}
          isSaving={createSlotMutation.isPending}
          slotDateTime={clickedSlotDateTime}
          existingSlot={editingSlot}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>{isSlotOnlyDelete ? 'Delete Slot' : 'Cancel Booking'}</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialogDescription()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isSlotOnlyDelete ? 'Keep Slot' : 'Keep Booking'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBookingMutation.mutate(deleteTarget)}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {isSlotOnlyDelete ? 'Delete Slot' : 'Cancel Booking'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}