import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CalendarCheck,
  Loader2,
  Settings,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import LessonFormModal from '@/components/modals/LessonFormModal';
import NewLessonModal from '@/components/booking/NewLessonModal';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import LessonDetailsDrawer from '@/components/calendar/LessonDetailsDrawer';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import InstructorMonthCalendar from '@/components/booking/InstructorMonthCalendar';
import WorkingHoursModal from '@/components/booking/WorkingHoursModal';
import PendingBookingsPanel from '@/components/booking/PendingBookingsPanel';
import CalendarSettingsDrawer from '@/components/booking/CalendarSettingsDrawer';
import CreateBookableSlotModal from '@/components/booking/CreateBookableSlotModal';
import PersonalEventModal from '@/components/booking/PersonalEventModal';
import SlotDetailsModal from '@/components/booking/SlotDetailsModal';
import BookingDetailsModal from '@/components/booking/BookingDetailsModal';
import InstructorScheduleLessonModal from '@/components/booking/InstructorScheduleLessonModal';
import CloseDayModal from '@/components/booking/CloseDayModal';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import moment from 'moment';

const VIEW_MODES = ['day', 'week', 'month'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('month');
  const [showListView, setShowListView] = useState(() => {
    try { return localStorage.getItem('calendar_list_view') === 'true'; } catch { return false; }
  });
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [selectedSlotDateTime, setSelectedSlotDateTime] = useState(null);
  const [createSlotInitialType, setCreateSlotInitialType] = useState('personal');
  const [showSlotDetailsModal, setShowSlotDetailsModal] = useState(false);
  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);
  const [availabilityMode, setAvailabilityMode] = useState('published_slots_only');
  
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingSlotInstance, setSelectedBookingSlotInstance] = useState(null);
  
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [selectedSlotForSchedule, setSelectedSlotForSchedule] = useState(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState(null);
  const [showPersonalEventModal, setShowPersonalEventModal] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['calendarRules', currentUser?.id],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['lessonBookings', currentUser?.id],
    queryFn: async () => {
      const allBookings = await base44.entities.LessonBooking.filter({ instructorId: currentUser.id });
      // Filter out deleted bookings
      return allBookings.filter(b => !b.isDeleted);
    },
    enabled: !!currentUser?.id
  });

  const { data: slotInstances = [] } = useQuery({
    queryKey: ['slotInstances', currentUser?.id],
    queryFn: () => base44.entities.BookableSlotInstance.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: slotTemplates = [] } = useQuery({
    queryKey: ['slotTemplates', currentUser?.id],
    queryFn: () => base44.entities.BookableSlotTemplate.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendarEvents', currentUser?.id],
    queryFn: () => base44.entities.CalendarEvent.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const createLessonMutation = useMutation({
    mutationFn: (data) => base44.entities.Lesson.create({
      ...data,
      instructorId: currentUser?.id
    }),
    onSuccess: () => queryClient.invalidateQueries(['lessons'])
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lesson.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['lessons'])
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id) => base44.entities.Lesson.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['lessons'])
  });

  const createCalendarEventMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create({
      ...data,
      instructorId: currentUser.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents']);
      toast({ title: 'Personal event saved' });
      setShowCreateSlotModal(false);
    }
  });

  const createInstructorBookingMutation = useMutation({
    mutationFn: async (data) => {
      const pupil = pupils.find(p => p.id === data.pupilId);
      const hourlyRate = pupil?.hourlyRate || 0;
      const totalPriceGbp = hourlyRate * data.durationHours;

      const newStart = moment(data.startAtUtc);
      const newEnd = moment(data.endAtUtc);

      // Prevent clashes with existing confirmed/in-progress/completed bookings
      const clashingBooking = bookings.find(b => {
        if (!['confirmed', 'in_progress', 'completed'].includes(b.status)) return false;
        if (b.isDeleted) return false;
        const bStart = moment(b.startAtUtc);
        const bEnd = moment(b.endAtUtc);
        return newStart.isBefore(bEnd) && newEnd.isAfter(bStart);
      });
      if (clashingBooking) {
        throw new Error(`This time clashes with an existing lesson at ${moment(clashingBooking.startAtUtc).local().format('HH:mm')}.`);
      }

      // Prevent clashes with other available slot instances (unless it's the selected one)
      const clashingSlot = slotInstances.find(si => {
        if (si.status !== 'available') return false;
        if (si.id === data.slotInstanceId) return false;
        const sStart = moment(si.startAtUtc);
        const sEnd = moment(si.endAtUtc);
        return newStart.isBefore(sEnd) && newEnd.isAfter(sStart);
      });
      if (clashingSlot) {
        throw new Error('This time clashes with another available slot. Please pick an available time.');
      }

      const booking = await base44.entities.LessonBooking.create({
        instructorId: currentUser.id,
        pupilId: data.pupilId,
        slotInstanceId: data.slotInstanceId || undefined,
        startAtUtc: data.startAtUtc,
        endAtUtc: data.endAtUtc,
        durationHours: data.durationHours,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        hourlyRateAtBookingGbp: hourlyRate,
        totalPriceGbp,
        isPracticalTest: data.isPracticalTest || false,
        practicalTestTime: data.isPracticalTest ? data.practicalTestTime : undefined
      });

      if (data.slotInstanceId) {
        await base44.entities.BookableSlotInstance.update(data.slotInstanceId, {
          status: 'confirmed',
          bookingId: booking.id,
          reservedByPupilId: data.pupilId
        });
      }

      await base44.entities.PaymentLedger.create({
        userId: data.pupilId,
        bookingId: booking.id,
        type: 'charge',
        reason: 'lesson_confirmed_charge',
        amountGbp: totalPriceGbp,
        hours: data.durationHours,
        createdByRole: 'instructor',
        note: 'Charge applied on confirmation'
      });

      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Scheduled',
          message: `Your instructor has scheduled a lesson for ${moment(data.startAtUtc).local().format('D MMM')} at ${moment(data.startAtUtc).local().format('HH:mm')}.`,
          type: 'booking',
          linkTarget: 'LearnerCalendar'
        });
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      toast({ title: 'Lesson scheduled for pupil' });
      setShowCreateSlotModal(false);
      setSelectedSlotDateTime(null);
    },
    onError: (error) => {
      toast({ title: 'Booking not allowed', description: error.message, variant: 'destructive' });
    }
  });

  const updateCalendarEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents']);
      toast({ title: 'Personal event updated' });
      setShowPersonalEventModal(false);
    }
  });

  const deleteCalendarEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarEvents']);
      toast({ title: 'Personal event deleted' });
      setShowPersonalEventModal(false);
      setShowDeleteDialog(false);
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarRule.create({
      ...data,
      instructorId: currentUser.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Rule saved successfully' });
      setShowWorkingHoursModal(false);
      setShowSettingsModal(false);
    }
  });

  const saveWorkingHoursMutation = useMutation({
    mutationFn: async (rulesData) => {
      // Delete existing working hours rules
      const existingWorkingHours = rules.filter(r => r.ruleType === 'working_hours');
      await Promise.all(existingWorkingHours.map(r => base44.entities.CalendarRule.delete(r.id)));
      
      // Create new rules
      await Promise.all(rulesData.map(data => 
        base44.entities.CalendarRule.create({
          ...data,
          instructorId: currentUser.id,
          ruleType: 'working_hours'
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Working hours updated successfully' });
      setShowWorkingHoursModal(false);
      setShowSettingsModal(false);
    }
  });

  const closedRules = rules.filter(r => r.ruleType === 'closed');

  const createClosedRuleMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.CalendarRule.create({
        instructorId: currentUser.id,
        ruleType: 'closed',
        startTimeLocal: data.startTimeLocal,
        endTimeLocal: data.endTimeLocal,
        daysOfWeek: [data.dayOfWeek],
        isRecurring: data.recurring,
        specificDate: data.recurring ? null : data.specificDate,
        startDate: data.recurring ? data.specificDate : null,
        rrule: data.recurring ? 'FREQ=WEEKLY;INTERVAL=1' : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Calendar closed successfully' });
      setShowCloseDayModal(false);
    }
  });

  const deleteClosedRuleMutation = useMutation({
    mutationFn: (ruleId) => base44.entities.CalendarRule.delete(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Closure removed' });
    }
  });

  const createBookableSlotMutation = useMutation({
    mutationFn: async (slotData) => {
      // Overlap guard: a slot must not overlap an existing slot instance or an
      // active booking. Throw so the instructor gets a toast instead of a silent fail.
      const findOverlap = (start, end, excludeId) => {
        const clashingSlot = slotInstances.find(si => {
          if (si.id === excludeId) return false;
          const sStart = moment(si.startAtUtc);
          const sEnd = moment(si.endAtUtc);
          return start.isBefore(sEnd) && end.isAfter(sStart);
        });
        if (clashingSlot) {
          return `This time overlaps an existing slot at ${moment(clashingSlot.startAtUtc).local().format('HH:mm')}.`;
        }
        const clashingBooking = bookings.find(b => {
          if (!['confirmed', 'in_progress', 'completed'].includes(b.status)) return false;
          if (b.isDeleted) return false;
          const bStart = moment(b.startAtUtc);
          const bEnd = moment(b.endAtUtc);
          return start.isBefore(bEnd) && end.isAfter(bStart);
        });
        if (clashingBooking) {
          return `This time overlaps an existing lesson at ${moment(clashingBooking.startAtUtc).local().format('HH:mm')}.`;
        }
        return null;
      };

      // If editing existing slot, update it
      if (slotData.slotId) {
        const startDateTime = moment(`${slotData.startDate} ${slotData.startTime}`, 'YYYY-MM-DD HH:mm');
        const endDateTime = moment(`${slotData.startDate} ${slotData.endTime}`, 'YYYY-MM-DD HH:mm');
        
        const overlapError = findOverlap(startDateTime, endDateTime, slotData.slotId);
        if (overlapError) throw new Error(overlapError);
        
        await base44.entities.BookableSlotInstance.update(slotData.slotId, {
          startAtUtc: startDateTime.utc().format(),
          endAtUtc: endDateTime.utc().format()
        });
        return;
      }

      if (!slotData.repeatWeekly) {
        // Create single slot instance
        const startDateTime = moment(`${slotData.startDate} ${slotData.startTime}`, 'YYYY-MM-DD HH:mm');
        const endDateTime = moment(`${slotData.startDate} ${slotData.endTime}`, 'YYYY-MM-DD HH:mm');
        
        const overlapError = findOverlap(startDateTime, endDateTime);
        if (overlapError) throw new Error(overlapError);
        
        await base44.entities.BookableSlotInstance.create({
          instructorId: currentUser.id,
          startAtUtc: startDateTime.utc().format(),
          endAtUtc: endDateTime.utc().format(),
          status: 'available'
        });
      } else {
        // Create templates and generate instances
        const templates = await Promise.all(slotData.selectedDays.map(day =>
          base44.entities.BookableSlotTemplate.create({
            instructorId: currentUser.id,
            title: slotData.title || null,
            dayOfWeek: day,
            startTimeLocal: slotData.startTime,
            endTimeLocal: slotData.endTime,
            recurrence: 'weekly',
            interval: 1,
            startDate: slotData.startDate,
            endDate: slotData.stopDate,
            isActive: true
          })
        ));

        // Generate instances for next 12 weeks
        const horizonWeeks = 12;
        const windowStart = moment(slotData.startDate);
        const windowEnd = moment().add(horizonWeeks, 'weeks');

        for (const template of templates) {
          const dayIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(template.dayOfWeek);
          let currentDate = moment(template.startDate);
          
          // Find first occurrence
          while (currentDate.day() !== dayIndex) {
            currentDate.add(1, 'day');
          }

          // Generate instances
          while (currentDate.isSameOrBefore(windowEnd) && 
                 (!template.endDate || currentDate.isSameOrBefore(moment(template.endDate)))) {
            const startDateTime = moment(`${currentDate.format('YYYY-MM-DD')} ${template.startTimeLocal}`, 'YYYY-MM-DD HH:mm');
            const endDateTime = moment(`${currentDate.format('YYYY-MM-DD')} ${template.endTimeLocal}`, 'YYYY-MM-DD HH:mm');

            // Check for overlaps with existing slots or active bookings
            const overlapError = findOverlap(startDateTime, endDateTime);
            if (overlapError) {
              throw new Error(`${overlapError} (on ${currentDate.format('D MMM')})`);
            }

            if (currentDate.isSameOrAfter(windowStart)) {
              await base44.entities.BookableSlotInstance.create({
                instructorId: currentUser.id,
                sourceTemplateId: template.id,
                startAtUtc: startDateTime.utc().format(),
                endAtUtc: endDateTime.utc().format(),
                status: 'available'
              });
            }

            currentDate.add(1, 'week');
          }
        }
      }
    },
    onError: (error) => {
      toast({ title: 'Slot not created', description: error.message, variant: 'destructive' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['slotInstances']);
      queryClient.invalidateQueries(['slotTemplates']);
      toast({ title: variables.slotId ? 'Slot updated successfully' : 'Bookable slot(s) created successfully' });
      setShowCreateSlotModal(false);
      setSelectedSlotDateTime(null);
      setSelectedSlotInstance(null);
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const booking = bookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      });
      
      // Update slot instance if exists
      if (booking.slotInstanceId) {
        await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
          status: 'confirmed',
          bookingId: bookingId
        });
      }

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

      await base44.entities.Notification.create({
        userId: booking.pupilId,
        title: 'Lesson Confirmed',
        message: `Your lesson on ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} has been confirmed.`,
        type: 'booking',
        linkTarget: 'Calendar'
      });

      // Send confirmation emails and SMS (fire-and-forget, don't block on failure)
      base44.functions.invoke('handleBookingConfirmed', { ...booking, status: 'confirmed' }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
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

      // Release slot instance if exists
      if (booking.slotInstanceId) {
        await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
          status: 'available',
          reservedByPupilId: null,
          bookingId: null
        });
      }

      await base44.entities.Notification.create({
        userId: booking.pupilId,
        title: 'Lesson Declined',
        message: `Your lesson request for ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} was declined.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'booking',
        linkTarget: 'Calendar'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Booking declined' });
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async ({ slotInstanceId, sourceTemplateId, deleteOption, startAtUtc }) => {
      if (deleteOption === 'delete_single_instance') {
        await base44.entities.BookableSlotInstance.delete(slotInstanceId);
      } else if (deleteOption === 'delete_future_instances') {
        const futureSlotsToDelete = slotInstances.filter(si => 
          si.sourceTemplateId === sourceTemplateId &&
          moment(si.startAtUtc).isSameOrAfter(moment(startAtUtc)) &&
          si.status === 'available'
        );
        await Promise.all(futureSlotsToDelete.map(si => base44.entities.BookableSlotInstance.delete(si.id)));
      } else if (deleteOption === 'delete_entire_series') {
        await base44.entities.BookableSlotTemplate.update(sourceTemplateId, { isActive: false });
        const serieSlotsToDelete = slotInstances.filter(si => 
          si.sourceTemplateId === sourceTemplateId &&
          si.status === 'available'
        );
        await Promise.all(serieSlotsToDelete.map(si => base44.entities.BookableSlotInstance.delete(si.id)));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['slotInstances']);
      queryClient.invalidateQueries(['slotTemplates']);
      toast({ title: 'Slot deleted successfully' });
      setShowSlotDetailsModal(false);
      setSelectedSlotInstance(null);
    }
  });

  const pupilMap = pupils.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const handleSaveLesson = async (data) => {
    if (selectedLesson) {
      await updateLessonMutation.mutateAsync({ id: selectedLesson.id, data });
    } else {
      await createLessonMutation.mutateAsync(data);
    }
  };

  const handleStatusChangeToCompleted = async (pupilId, durationHours) => {
    const pupil = pupilMap[pupilId];
    if (pupil) {
      const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
      const lessonCost = (pupil.hourlyRate || 0) * durationHours;
      const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
      await base44.entities.Pupil.update(pupil.id, { 
        hoursCompleted: newHoursCompleted,
        bulkPaymentBalance: newBalance
      });
      queryClient.invalidateQueries(['pupils']);
    }
  };

  const handleDeleteLesson = async (id) => {
    await deleteLessonMutation.mutateAsync(id);
  };

  const openNewLesson = (date, time) => {
    setSelectedLesson(null);
    setSelectedSlot({ date, time });
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setSelectedSlot(null);
    setShowLessonModal(true);
  };

  const openCompleteLessonWithDiary = (lesson) => {
    setSelectedLesson(lesson);
    setSelectedSlot(null);
    setShowDiaryModal(true);
  };

  const openLessonDetails = (lesson) => {
    setSelectedLesson(lesson);
    setShowDetailsDrawer(true);
  };

  const handleSaveDiaryAndComplete = async (diaryData) => {
    if (!selectedLesson) return;
    
    // Create the diary entry
    await base44.entities.DiaryEntry.create({
      ...diaryData,
      pupilId: selectedLesson.pupilId,
      lessonId: selectedLesson.id,
      instructorId: selectedLesson.instructorId
    });

    // Calculate lesson duration in hours
    const startMoment = moment(selectedLesson.startTime, 'HH:mm');
    const endMoment = moment(selectedLesson.endTime, 'HH:mm');
    const durationHours = endMoment.diff(startMoment, 'minutes') / 60;

    // Update lesson status to Completed
    await base44.entities.Lesson.update(selectedLesson.id, { status: 'Completed' });

    // Update pupil's hoursCompleted and deduct from bulk payment
    const pupil = pupilMap[selectedLesson.pupilId];
    if (pupil) {
      const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
      const lessonCost = (pupil.hourlyRate || 0) * durationHours;
      const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
      await base44.entities.Pupil.update(pupil.id, { 
        hoursCompleted: newHoursCompleted,
        bulkPaymentBalance: newBalance
      });
      queryClient.invalidateQueries(['pupils']);
    }

    queryClient.invalidateQueries(['lessons']);
  };

  const navigate = (direction) => {
    const unit = viewMode === 'day' ? 'day' : viewMode === 'week' ? 'week' : 'month';
    setCurrentDate(prev => moment(prev).add(direction, unit));
  };

  const filteredBookings = useMemo(() => {
    let rangeStart, rangeEnd;
    if (viewMode === 'day') {
      rangeStart = currentDate.clone().startOf('day');
      rangeEnd = currentDate.clone().endOf('day');
    } else if (viewMode === 'week') {
      rangeStart = currentDate.clone().startOf('week');
      rangeEnd = currentDate.clone().endOf('week');
    } else {
      rangeStart = currentDate.clone().startOf('month');
      rangeEnd = currentDate.clone().endOf('month');
    }

    const inRange = (dateStr) => {
      if (!dateStr) return false;
      const m = moment(dateStr).local();
      return m.isSameOrAfter(rangeStart) && m.isSameOrBefore(rangeEnd);
    };

    // Map available slot instances into booking-like entries
    const availableSlots = slotInstances
      .filter(s => s.status === 'available' && inRange(s.startAtUtc))
      .map(s => ({
        ...s,
        isSlot: true,
        pupilId: null,
        durationHours: moment(s.endAtUtc).diff(moment(s.startAtUtc), 'minutes') / 60,
        pickupLocation: null,
      }));

    // Map closed rules into booking-like entries for the list view
    const closedEntries = [];
    rules.filter(r => r.ruleType === 'closed').forEach(rule => {
      const targetDay = currentDate.clone();
      // For one-time closures, check if the specific date is in range
      if (rule.isRecurring === false && rule.specificDate) {
        const ruleDate = moment(rule.specificDate);
        if (inRange(ruleDate.format('YYYY-MM-DDTHH:mm:ss'))) {
          const startMoment = ruleDate.clone().hour(0).minute(0);
          const endMoment = ruleDate.clone().hour(23).minute(59);
          closedEntries.push({
                id: `closed-${rule.id}`,
                isClosed: true,
                startAtUtc: startMoment.toISOString(),
                endAtUtc: endMoment.toISOString(),
                pupilId: null,
                pickupLocation: null,
                status: 'closed'
              });
        }
      } else if (rule.daysOfWeek) {
        // For recurring rules, find occurrences in the current view range
        const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
        let day = rangeStart.clone();
        while (day.isSameOrBefore(rangeEnd)) {
          if (rule.daysOfWeek.includes(day.format('ddd').toLowerCase())) {
            if (!rule.excludeDates?.includes(day.format('YYYY-MM-DD'))) {
              const [sh, sm] = rule.startTimeLocal.split(':').map(Number);
              const [eh, em] = rule.endTimeLocal.split(':').map(Number);
              const startMoment = day.clone().hour(sh).minute(sm);
              const endMoment = day.clone().hour(eh).minute(em);
              closedEntries.push({
                id: `closed-${rule.id}-${day.format('YYYY-MM-DD')}`,
                isClosed: true,
                startAtUtc: startMoment.toISOString(),
                endAtUtc: endMoment.toISOString(),
                pupilId: null,
                pickupLocation: null,
                status: 'closed'
              });
            }
          }
          day.add(1, 'day');
        }
      }
    });

    const matchingBookings = bookings.filter(b => inRange(b.startAtUtc));

    return [...matchingBookings, ...availableSlots, ...closedEntries]
      .sort((a, b) => new Date(a.startAtUtc) - new Date(b.startAtUtc));
  }, [bookings, slotInstances, rules, viewMode, currentDate]);

  const getDaysToShow = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate.clone()];
    } else if (viewMode === 'week') {
      const start = currentDate.clone().startOf('week');
      return Array.from({ length: 7 }, (_, i) => start.clone().add(i, 'days'));
    } else {
      const start = currentDate.clone().startOf('month').startOf('week');
      const end = currentDate.clone().endOf('month').endOf('week');
      const days = [];
      let day = start.clone();
      while (day.isSameOrBefore(end)) {
        days.push(day.clone());
        day.add(1, 'day');
      }
      return days;
    }
  }, [currentDate, viewMode]);

  const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00

  const getLessonsForDay = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return lessons.filter(l => l.date === dateStr);
  };

  const pendingBookings = bookings.filter(b => b.status === 'reserved_pending_instructor');

  const confirmAllBookingsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(pendingBookings.map(booking =>
        confirmBookingMutation.mutateAsync(booking.id)
      ));
    },
    onSuccess: () => {
      toast({ title: `All ${pendingBookings.length} bookings confirmed` });
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async ({ booking, slotInstance, state, blockType }) => {
      if (booking) {
        const pupil = pupils.find(p => p.id === booking.pupilId);
        
        // Mark booking as deleted
        await base44.entities.LessonBooking.update(booking.id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedByRole: 'instructor',
          status: 'deleted'
        });

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

        // If booking had a slot instance, restore it to available
        if (booking.slotInstanceId) {
          await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
            status: 'available',
            bookingId: null,
            reservedByPupilId: null
          });
        }
      } else if (slotInstance && blockType === 'slotInstance') {
        // Delete slot instance directly (for available slots without bookings)
        await base44.entities.BookableSlotInstance.delete(slotInstance.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['instructorSlotInstances']);
      queryClient.invalidateQueries(['myBookings']);
      toast({ title: 'Deleted successfully' });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleDeleteBooking = (bookingOrSlot, state, blockType) => {
    const booking = bookingOrSlot.pupilId ? bookingOrSlot : null;
    const slotInstance = (!booking && bookingOrSlot.instructorId) ? bookingOrSlot : null;
    
    setDeleteTarget({ booking, slotInstance, state, blockType });
    setShowDeleteDialog(true);
  };

  if (lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Calendar</h1>
              <p className="text-slate-500 mt-1">{currentDate.format('MMMM YYYY')}</p>
            </div>
            {/* Mobile: settings + new slot on the same line as the title, aligned right */}
            <div className="flex items-center gap-2 sm:hidden ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettingsModal(true)}
                className="bg-white shadow-md"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setSelectedSlotDateTime(null);
                  setSelectedSlotInstance(null);
                  setShowCreateSlotModal(true);
                }}
                className="bg-[#071739] hover:bg-[#0e2a5a] text-white shadow-md"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center bg-white rounded-lg border shadow-sm p-1">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* List View Toggle Switch */}
            <div className="flex items-center gap-2 bg-white rounded-lg border shadow-sm px-3 py-2">
              <span className={`text-sm font-medium ${showListView ? 'text-teal-700' : 'text-slate-600'}`}>List</span>
              <Switch
                checked={showListView}
                onCheckedChange={(checked) => {
                  setShowListView(checked);
                  try { localStorage.setItem('calendar_list_view', String(checked)); } catch {}
                }}
              />
            </div>

            {/* Available Only Filter — only relevant in List view */}
            {showListView && (
              <Button
                variant={availableOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAvailableOnly(prev => !prev)}
                className={availableOnly ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
              >
                <CalendarCheck className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Available</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettingsModal(true)}
              className="hidden sm:inline-flex"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => {
                setSelectedSlotDateTime(null);
                setSelectedSlotInstance(null);
                setShowCreateSlotModal(true);
              }}
              className="bg-[#071739] hover:bg-[#0e2a5a] text-white hidden sm:inline-flex"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Slot</span>
            </Button>
          </div>
        </div>

        {/* Pending Booking Request Button */}
        {pendingBookings.length > 0 && (
          <div className="mb-4">
            <Link to="/PendingBookingRequests">
              <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-md gap-2">
                <Clock className="w-4 h-4" />
                Pending Booking Request
                <Badge className="bg-white text-purple-700 ml-1">{pendingBookings.length}</Badge>
              </Button>
            </Link>
          </div>
        )}

        {/* Month Navigation — only in calendar (non-list) mode, except month view (InstructorMonthCalendar renders its own) */}
        {!showListView && viewMode !== 'month' && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => prev.clone().subtract(1, 'month'))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold text-slate-800 min-w-fit text-center px-2">
                {currentDate.format('MMMM')}
              </h3>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => prev.clone().add(1, 'month'))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {showListView ? (
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => prev.clone().subtract(1, 'month'))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center min-w-fit px-2">
                  <h3 className="text-lg font-semibold text-slate-800 capitalize leading-tight">
                    {currentDate.format('MMMM')}
                  </h3>
                  <span className="text-xs text-slate-400 capitalize">{viewMode}{availableOnly ? ' — Available Only' : ' — All Bookings'}</span>
                </div>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => prev.clone().add(1, 'month'))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(moment())} className="ml-1">
                  Today
                </Button>
              </div>
              <span className="text-sm text-slate-500">
                {(availableOnly ? filteredBookings.filter(b => b.isSlot) : filteredBookings).length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </span>
            </div>
            {(availableOnly ? filteredBookings.filter(b => b.isSlot) : filteredBookings).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarCheck className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No available slots found</p>
                <p className="text-xs text-slate-400 mt-1">Available slots for this {viewMode} will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(availableOnly ? filteredBookings.filter(b => b.isSlot) : filteredBookings).map(booking => {
                  const pupil = pupilMap[booking.pupilId];
                  const startMoment = moment(booking.startAtUtc).local();
                  const endMoment = moment(booking.endAtUtc).local();
                  const bookingDateKey = startMoment.format('YYYY-MM-DD');
                  const prevBooking = (availableOnly ? filteredBookings.filter(b => b.isSlot) : filteredBookings)[
                    (availableOnly ? filteredBookings.filter(b => b.isSlot) : filteredBookings).indexOf(booking) - 1
                  ];
                  const prevDateKey = prevBooking ? moment(prevBooking.startAtUtc).local().format('YYYY-MM-DD') : null;
                  const showDateHeader = !prevDateKey || prevDateKey !== bookingDateKey;
                  const isToday = startMoment.isSame(moment(), 'day');
                  const statusColors = {
                    available: 'bg-amber-50 text-amber-700',
                    closed: 'bg-lime-50 text-lime-700',
                    pending: 'bg-orange-50 text-orange-700',
                    reserved_pending_instructor: 'bg-yellow-50 text-yellow-700',
                    reserved_pending: 'bg-yellow-50 text-yellow-700',
                    confirmed: 'bg-lime-50 text-lime-700',
                    in_progress: 'bg-emerald-50 text-emerald-700',
                    completed: 'bg-stone-50 text-stone-600',
                    cancelled: 'bg-rose-50 text-rose-700',
                    cancelled_by_pupil: 'bg-red-50 text-red-700',
                    cancelled_late_by_pupil: 'bg-pink-50 text-pink-700',
                    declined_by_instructor: 'bg-rose-50 text-rose-800',
                    no_show: 'bg-red-50 text-red-800',
                  };
                  const statusBadgeColors = {
                    available: 'bg-amber-200 text-amber-800',
                    closed: 'bg-lime-200 text-lime-800',
                    pending: 'bg-orange-200 text-orange-800',
                    reserved_pending_instructor: 'bg-yellow-200 text-yellow-800',
                    reserved_pending: 'bg-yellow-200 text-yellow-800',
                    confirmed: 'bg-lime-200 text-lime-800',
                    in_progress: 'bg-emerald-200 text-emerald-800',
                    completed: 'bg-stone-200 text-stone-700',
                    cancelled: 'bg-rose-200 text-rose-800',
                    cancelled_by_pupil: 'bg-red-200 text-red-800',
                    cancelled_late_by_pupil: 'bg-pink-200 text-pink-800',
                    declined_by_instructor: 'bg-rose-200 text-rose-900',
                    no_show: 'bg-red-200 text-red-900',
                  };
                  const statusBorders = {
                    available: 'border-l-amber-400',
                    closed: 'border-l-lime-500',
                    pending: 'border-l-orange-400',
                    reserved_pending_instructor: 'border-l-yellow-400',
                    reserved_pending: 'border-l-yellow-400',
                    confirmed: 'border-l-lime-400',
                    in_progress: 'border-l-emerald-400',
                    completed: 'border-l-stone-400',
                    cancelled: 'border-l-rose-400',
                    cancelled_by_pupil: 'border-l-red-400',
                    cancelled_late_by_pupil: 'border-l-pink-400',
                    declined_by_instructor: 'border-l-rose-500',
                    no_show: 'border-l-red-500',
                  };
                  const statusStyle = statusColors[booking.status] || 'bg-slate-50 text-slate-600';
                  const badgeStyle = statusBadgeColors[booking.status] || 'bg-slate-200 text-slate-600';
                  const borderStyle = statusBorders[booking.status] || 'border-l-slate-300';
                  const statusLabel = booking.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                  return (
                    <React.Fragment key={booking.id}>
                      {showDateHeader && (
                        <div className="flex items-center gap-3 pt-2 pb-1">
                          <div className="flex flex-col items-center justify-center min-w-[48px]">
                            <span className="text-xs font-bold uppercase text-[#F7B602]">{startMoment.format('ddd')}</span>
                            <span className="text-xl font-bold text-[#071739]">{startMoment.format('DD')}</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                          <span className="text-xs font-medium text-slate-400 uppercase">{startMoment.format('MMMM YYYY')}</span>
                          {isToday && (
                            <Badge className="bg-[#F7B602] text-[#071739] text-xs">Today</Badge>
                          )}
                        </div>
                      )}
                      <div
                        onClick={() => {
                        if (booking.isClosed) {
                          setShowCloseDayModal(true);
                          return;
                        }
                        if (booking.isSlot) {
                          setSelectedSlotInstance(booking);
                          setShowSlotDetailsModal(true);
                        } else {
                          setSelectedBooking(booking);
                          setShowBookingDetailsModal(true);
                        }
                      }}
                      className={`flex items-center gap-4 p-3 rounded-xl border border-slate-100 border-l-4 ${borderStyle} ${statusStyle} hover:brightness-95 cursor-pointer transition-all`}
                    >
                      {/* Date block */}
                      <div className="flex flex-col items-center justify-center min-w-[56px]">
                        <span className="text-lg font-bold opacity-80">{startMoment.format('DD')}</span>
                        <span className="text-xs opacity-60 uppercase">{startMoment.format('MMM')}</span>
                      </div>

                      <div className="w-px h-10 bg-current opacity-20" />

                      {/* Time block */}
                      <div className="flex flex-col items-center justify-center min-w-[55px]">
                        <span className="text-sm font-bold opacity-90">{startMoment.format('HH:mm')}</span>
                        <span className="text-xs opacity-60">{endMoment.format('HH:mm')}</span>
                      </div>

                      <div className="w-px h-10 bg-current opacity-20" />

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {booking.isClosed ? 'Calendar Closed' : booking.isSlot ? 'Available Slot' : pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Unknown pupil'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {booking.durationHours && (
                            <span className="text-xs opacity-70">{Math.round(booking.durationHours * 10) / 10}h</span>
                          )}
                          {!booking.isSlot && booking.pickupLocation && (
                            <span className="text-xs opacity-70 truncate">{booking.pickupLocation}</span>
                          )}
                        </div>
                      </div>

                      <Badge className={`shrink-0 text-xs ${badgeStyle}`}>{statusLabel}</Badge>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        ) : viewMode === 'month' ? (
          <InstructorMonthCalendar
            slotInstances={slotInstances}
            bookings={bookings}
            pupils={pupils}
            personalEvents={calendarEvents}
            onSlotClick={(_, slotInstance) => {
              setSelectedSlotInstance(slotInstance);
              setShowSlotDetailsModal(true);
            }}
            onBookingClick={(booking) => {
              setSelectedBooking(booking);
              setSelectedBookingSlotInstance(null);
              setShowBookingDetailsModal(true);
            }}
            onPersonalEventClick={(personalEvent) => {
              setSelectedPersonalEvent(personalEvent);
              setShowPersonalEventModal(true);
            }}
            onCreateSlot={(dateStr) => {
              setSelectedSlotDateTime(dateStr);
              setSelectedSlotInstance(null);
              setShowCreateSlotModal(true);
            }}
          />
        ) : (
          <Calendar24Hour
            viewMode={viewMode}
            rules={rules}
            bookings={bookings}
            slotInstances={slotInstances}
            personalEvents={calendarEvents}
            availabilityMode={availabilityMode}
            isInstructor={true}
            pupils={pupils}
            syncedDate={currentDate}
            onSlotClick={(slotDateTime, slotData) => {
              if (availabilityMode === 'published_slots_only') {
                // If slotData is an object (slot instance), open slot details
                if (typeof slotData === 'object' && slotData.id) {
                  setSelectedSlotInstance(slotData);
                  setShowSlotDetailsModal(true);
                } else {
                  // Otherwise open create slot modal
                  setSelectedSlotDateTime(slotDateTime);
                  setSelectedSlotInstance(null);
                  setShowCreateSlotModal(true);
                }
              }
            }}
            onPendingSlotClick={(booking, slotInstance) => {
              setSelectedBooking(booking);
              setSelectedBookingSlotInstance(slotInstance);
              setShowBookingDetailsModal(true);
            }}
            onDeleteBooking={handleDeleteBooking}
            onPersonalEventClick={(personalEvent) => {
              setSelectedPersonalEvent(personalEvent);
              setShowPersonalEventModal(true);
            }}
          />
        )}
      </div>

      <CloseDayModal
        open={showCloseDayModal}
        onOpenChange={setShowCloseDayModal}
        onSave={(data) => createClosedRuleMutation.mutate(data)}
        isSaving={createClosedRuleMutation.isPending}
        defaultDate={currentDate}
        existingRules={closedRules}
        onDeleteRule={(ruleId) => deleteClosedRuleMutation.mutate(ruleId)}
      />

      <LessonFormModal
        open={showLessonModal}
        onClose={() => {
          setShowLessonModal(false);
          setSelectedLesson(null);
          setSelectedSlot(null);
        }}
        existingLesson={selectedLesson || (selectedSlot ? {
          date: selectedSlot.date,
          startTime: selectedSlot.time,
          endTime: moment(selectedSlot.time, 'HH:mm').add(1, 'hour').format('HH:mm'),
          status: 'Scheduled'
        } : null)}
        pupils={pupils}
        allLessons={lessons}
        currentUser={currentUser}
        onSave={handleSaveLesson}
        onDelete={handleDeleteLesson}
        onStatusChange={handleStatusChangeToCompleted}
      />

      <DiaryEntryModal
        open={showDiaryModal}
        onClose={() => {
          setShowDiaryModal(false);
          setSelectedLesson(null);
        }}
        pupilId={selectedLesson?.pupilId}
        lessonId={selectedLesson?.id}
        lesson={selectedLesson}
        pupil={selectedLesson ? pupilMap[selectedLesson.pupilId] : null}
        onSave={handleSaveDiaryAndComplete}
      />

      <LessonDetailsDrawer
        lesson={selectedLesson}
        pupil={selectedLesson ? pupilMap[selectedLesson.pupilId] : null}
        open={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedLesson(null);
        }}
        onEdit={openEditLesson}
        onDelete={handleDeleteLesson}
        onMarkCompleted={openCompleteLessonWithDiary}
        currentUser={currentUser}
      />

      {/* Calendar Settings Modals */}
      <WorkingHoursModal
        open={showWorkingHoursModal}
        onOpenChange={setShowWorkingHoursModal}
        onSave={(data) => saveWorkingHoursMutation.mutate(data)}
        isSaving={saveWorkingHoursMutation.isPending}
        existingRules={rules}
      />

      <CalendarSettingsDrawer
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        onOpenWorkingHours={() => setShowWorkingHoursModal(true)}
        onOpenCloseDay={() => setShowCloseDayModal(true)}
        onOpenCreateSlot={() => {
          setSelectedSlotInstance(null);
          setSelectedSlotDateTime(null);
          setCreateSlotInitialType('lesson');
          setShowCreateSlotModal(true);
        }}
        availabilityMode={availabilityMode}
        onAvailabilityModeChange={setAvailabilityMode}
      />

      <CreateBookableSlotModal
        open={showCreateSlotModal}
        defaultSlotType={createSlotInitialType}
        onOpenChange={(open) => {
          setShowCreateSlotModal(open);
          if (!open) {
            setSelectedSlotInstance(null);
            setSelectedSlotDateTime(null);
            setCreateSlotInitialType('personal');
          }
        }}
        onSave={(data) => {
          if (data.slotType === 'personal') return createCalendarEventMutation.mutate(data);
          if (data.slotType === 'lesson_booking') return createInstructorBookingMutation.mutate(data);
          return createBookableSlotMutation.mutate(data);
        }}
        isSaving={createBookableSlotMutation.isPending || createCalendarEventMutation.isPending || createInstructorBookingMutation.isPending}
        slotDateTime={selectedSlotDateTime}
        existingSlot={selectedSlotInstance}
        slotInstances={slotInstances}
      />

      <SlotDetailsModal
        open={showSlotDetailsModal}
        onOpenChange={setShowSlotDetailsModal}
        slotInstance={selectedSlotInstance}
        isInstructor={true}
        onDeleteSlot={(data) => deleteSlotMutation.mutate(data)}
        isDeleting={deleteSlotMutation.isPending}
        onBookForPupil={(slot) => {
          setSelectedSlotForSchedule(slot);
          setShowScheduleLessonModal(true);
        }}
        onEditSlot={(slot) => {
          setSelectedSlotInstance(slot);
          setShowCreateSlotModal(true);
        }}
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
        slotInstance={selectedBookingSlotInstance}
      />

      <PersonalEventModal
        open={showPersonalEventModal}
        onOpenChange={setShowPersonalEventModal}
        event={selectedPersonalEvent}
        onSave={({ id, ...data }) => updateCalendarEventMutation.mutate({ id, data })}
        onDelete={(event) => deleteCalendarEventMutation.mutate(event.id)}
        isSaving={updateCalendarEventMutation.isPending}
        isDeleting={deleteCalendarEventMutation.isPending}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.booking ? 'Booking' : 'Slot'}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.booking 
                ? 'Are you sure you want to delete this booking? The pupil will be notified and the slot will become available again. This action cannot be undone.'
                : 'Are you sure you want to delete this slot? This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBookingMutation.mutate(deleteTarget)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete {deleteTarget?.booking ? 'Booking' : 'Slot'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}