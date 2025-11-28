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
  Loader2
} from 'lucide-react';
import LessonFormModal from '@/components/modals/LessonFormModal';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import moment from 'moment';

const VIEW_MODES = ['day', 'week', 'month'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('week');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
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
    // If lesson is Scheduled, open diary form; otherwise open lesson form
    if (lesson.status === 'Scheduled') {
      setShowDiaryModal(true);
    } else {
      setShowLessonModal(true);
    }
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

    // Update pupil's hoursCompleted
    const pupil = pupilMap[selectedLesson.pupilId];
    if (pupil) {
      const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
      await base44.entities.Pupil.update(pupil.id, { hoursCompleted: newHoursCompleted });
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

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm

  const getLessonsForDay = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return lessons.filter(l => l.date === dateStr);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Calendar</h1>
            <p className="text-slate-500 mt-1">{currentDate.format('MMMM YYYY')}</p>
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

        {/* Calendar View */}
        {viewMode === 'month' ? (
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
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Day/Week Header */}
            <div className="grid" style={{ gridTemplateColumns: `60px repeat(${getDaysToShow.length}, 1fr)` }}>
              <div className="border-b border-r p-2" />
              {getDaysToShow.map((day, idx) => {
                const isToday = day.isSame(moment(), 'day');
                return (
                  <div key={idx} className={`border-b border-r p-3 text-center ${isToday ? 'bg-teal-50' : ''}`}>
                    <div className="text-xs text-slate-500">{day.format('ddd')}</div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-teal-600' : 'text-slate-700'}`}>
                      {day.date()}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Time Slots */}
            <div className="max-h-[600px] overflow-y-auto">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="grid" 
                  style={{ gridTemplateColumns: `60px repeat(${getDaysToShow.length}, 1fr)` }}
                >
                  <div className="border-r p-2 text-xs text-slate-400 text-right pr-3">
                    {hour}:00
                  </div>
                  {getDaysToShow.map((day, idx) => {
                    const dayLessons = getLessonsForDay(day);
                    const hourLessons = dayLessons.filter(l => {
                      const lessonHour = parseInt(l.startTime?.split(':')[0] || 0);
                      return lessonHour === hour;
                    });
                    
                    return (
                      <div
                        key={idx}
                        className="border-r border-b min-h-[60px] p-1 hover:bg-slate-50 cursor-pointer transition-colors relative"
                        onClick={() => openNewLesson(day.format('YYYY-MM-DD'), `${hour.toString().padStart(2, '0')}:00`)}
                      >
                        {hourLessons.map(lesson => {
                          const pupil = pupilMap[lesson.pupilId];
                          const statusColors = {
                            Scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
                            Completed: 'bg-emerald-100 border-emerald-300 text-emerald-800',
                            Cancelled: 'bg-rose-100 border-rose-300 text-rose-800'
                          };
                          return (
                            <motion.div
                              key={lesson.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditLesson(lesson);
                              }}
                              className={`rounded-lg p-2 text-xs border ${statusColors[lesson.status]} cursor-pointer hover:shadow-md transition-shadow`}
                            >
                              <div className="font-medium">{pupil?.firstName} {pupil?.lastName}</div>
                              <div className="opacity-70">{lesson.startTime} - {lesson.endTime}</div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
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
        onSave={handleSaveLesson}
        onDelete={handleDeleteLesson}
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
    </div>
  );
}