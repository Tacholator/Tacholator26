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
  Loader2,
  Settings
} from 'lucide-react';
import LessonFormModal from '@/components/modals/LessonFormModal';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import LessonDetailsDrawer from '@/components/calendar/LessonDetailsDrawer';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import WorkingHoursModal from '@/components/booking/WorkingHoursModal';
import UnavailableModal from '@/components/booking/UnavailableModal';
import LunchBreakModal from '@/components/booking/LunchBreakModal';
import PendingBookingsPanel from '@/components/booking/PendingBookingsPanel';
import CalendarSettingsDrawer from '@/components/booking/CalendarSettingsDrawer';
import CreateBookableSlotModal from '@/components/booking/CreateBookableSlotModal';
import SlotDetailsModal from '@/components/booking/SlotDetailsModal';
import BookingDetailsModal from '@/components/booking/BookingDetailsModal';
import InstructorScheduleLessonModal from '@/components/booking/InstructorScheduleLessonModal';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import moment from 'moment';

const VIEW_MODES = ['day', 'week', 'month'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('week');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [showLunchModal, setShowLunchModal] = useState(false);
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [selectedSlotDateTime, setSelectedSlotDateTime] = useState(null);
  const [showSlotDetailsModal, setShowSlotDetailsModal] = useState(false);
  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);
  const [availabilityMode, setAvailabilityMode] = useState('published_slots_only');
  
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingSlotInstance, setSelectedBookingSlotInstance] = useState(null);
  
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [selectedSlotForSchedule, setSelectedSlotForSchedule] = useState(null);

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
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: currentUser.id }),
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

  const createLessonMutation = useMutation({
    mutationFn: (data) => base44.entities.Lesson.create(data),
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

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarRule.create({
      ...data,
      instructorId: currentUser.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Rule saved successfully' });
      setShowWorkingHoursModal(false);
      setShowUnavailableModal(false);
      setShowLunchModal(false);
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

  const saveLunchBreaksMutation = useMutation({
    mutationFn: async (rulesData) => {
      // Delete existing lunch break rules
      const existingLunchBreaks = rules.filter(r => r.ruleType === 'lunch_break');
      await Promise.all(existingLunchBreaks.map(r => base44.entities.CalendarRule.delete(r.id)));
      
      // Create new rules
      await Promise.all(rulesData.map(data => 
        base44.entities.CalendarRule.create({
          ...data,
          instructorId: currentUser.id,
          ruleType: 'lunch_break'
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Lunch breaks updated successfully' });
      setShowLunchModal(false);
      setShowSettingsModal(false);
    }
  });

  const saveUnavailableMutation = useMutation({
    mutationFn: async (rulesData) => {
      // Delete existing unavailable rules
      const existingUnavailable = rules.filter(r => r.ruleType === 'unavailable');
      await Promise.all(existingUnavailable.map(r => base44.entities.CalendarRule.delete(r.id)));
      
      // Create new rules
      await Promise.all(rulesData.map(data => 
        base44.entities.CalendarRule.create({
          ...data,
          instructorId: currentUser.id,
          ruleType: 'unavailable'
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendarRules']);
      toast({ title: 'Unavailable times updated successfully' });
      setShowUnavailableModal(false);
      setShowSettingsModal(false);
    }
  });

  const createBookableSlotMutation = useMutation({
    mutationFn: async (slotData) => {
      // If editing existing slot, update it
      if (slotData.slotId) {
        const startDateTime = moment(`${slotData.startDate} ${slotData.startTime}`, 'YYYY-MM-DD HH:mm');
        const endDateTime = moment(`${slotData.startDate} ${slotData.endTime}`, 'YYYY-MM-DD HH:mm');
        
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

            // Check for conflicts
            const hasConflict = bookings.some(b => {
              if (!['confirmed', 'completed'].includes(b.status)) return false;
              const bookingStart = moment(b.startAtUtc);
              const bookingEnd = moment(b.endAtUtc);
              return startDateTime.isBefore(bookingEnd) && endDateTime.isAfter(bookingStart);
            });

            if (!hasConflict && currentDate.isSameOrAfter(windowStart)) {
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
        message: `Your lesson request for ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} was declined.`,
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Calendar</h1>
            <p className="text-slate-500 mt-1">{currentDate.format('MMMM YYYY')}</p>
          </div>
          
          {/* Availability Mode Selector */}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-slate-600">Mode:</Label>
            <Select value={availabilityMode} onValueChange={setAvailabilityMode}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available_by_default">Available by default</SelectItem>
                <SelectItem value="published_slots_only">Published slots only</SelectItem>
              </SelectContent>
            </Select>
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
            
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => {
                setSelectedLesson(null);
                setSelectedSlot(null);
                setShowLessonModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Lesson
            </Button>
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

        {/* Calendar View */}
        {viewMode === 'day' ? (
          <CalendarDayView
            date={currentDate.format('YYYY-MM-DD')}
            lessons={getLessonsForDay(currentDate)}
            pupilMap={pupilMap}
            onLessonClick={openLessonDetails}
            onSlotClick={openNewLesson}
            currentUser={currentUser}
          />
        ) : viewMode === 'month' ? (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-sm font-medium text-slate-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getDaysToShow.map((day, idx) => {
                const dayLessons = getLessonsForDay(day);
                const isToday = day.isSame(moment(), 'day');
                const isCurrentMonth = day.isSame(currentDate, 'month');
                
                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 border-b border-r ${
                      !isCurrentMonth ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday 
                        ? 'w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center' 
                        : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      {day.date()}
                    </div>
                    <div className="space-y-1">
                      {dayLessons.slice(0, 3).map(lesson => {
                        const pupil = pupilMap[lesson.pupilId];
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => openEditLesson(lesson)}
                            className="text-xs p-1 rounded bg-teal-100 text-teal-700 truncate cursor-pointer hover:bg-teal-200 transition-colors"
                          >
                            {lesson.startTime} {pupil?.firstName}
                          </div>
                        );
                      })}
                      {dayLessons.length > 3 && (
                        <div className="text-xs text-slate-400">+{dayLessons.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Calendar24Hour
            viewMode={viewMode}
            rules={rules}
            bookings={bookings}
            slotInstances={slotInstances}
            availabilityMode={availabilityMode}
            isInstructor={true}
            pupils={pupils}
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
          />
        )}
      </div>

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

      <UnavailableModal
        open={showUnavailableModal}
        onOpenChange={setShowUnavailableModal}
        onSave={(data) => saveUnavailableMutation.mutate(data)}
        isSaving={saveUnavailableMutation.isPending}
        existingRules={rules}
      />

      <LunchBreakModal
        open={showLunchModal}
        onOpenChange={setShowLunchModal}
        onSave={(data) => saveLunchBreaksMutation.mutate(data)}
        isSaving={saveLunchBreaksMutation.isPending}
        existingRules={rules}
      />

      <CalendarSettingsDrawer
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        onOpenWorkingHours={() => setShowWorkingHoursModal(true)}
        onOpenLunch={() => setShowLunchModal(true)}
        onOpenUnavailable={() => setShowUnavailableModal(true)}
      />

      <CreateBookableSlotModal
        open={showCreateSlotModal}
        onOpenChange={(open) => {
          setShowCreateSlotModal(open);
          if (!open) {
            setSelectedSlotInstance(null);
            setSelectedSlotDateTime(null);
          }
        }}
        onSave={(data) => createBookableSlotMutation.mutate(data)}
        isSaving={createBookableSlotMutation.isPending}
        slotDateTime={selectedSlotDateTime}
        existingSlot={selectedSlotInstance}
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
    </div>
  );
}