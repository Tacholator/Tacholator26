import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Loader2
} from 'lucide-react';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import LessonDetailsDrawer from '@/components/calendar/LessonDetailsDrawer';
import moment from 'moment';

const VIEW_MODES = ['day', 'week'];

export default function LearnerCalendar() {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('week');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const queryClient = useQueryClient();

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
        const allPupils = await base44.entities.Pupil.list();
        const matchingPupil = allPupils.find(p => 
          p.email?.toLowerCase() === user.email.toLowerCase()
        );
        return matchingPupil || null;
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

  if (lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Lessons</h1>
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
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            {getDaysToShow.map((day, idx) => (
              <CalendarDayView
                key={idx}
                date={day.format('YYYY-MM-DD')}
                lessons={getLessonsForDay(day)}
                pupilMap={{}}
                onLessonClick={openLessonDetails}
                onSlotClick={() => {}}
                currentUser={user}
              />
            ))}
          </div>
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
    </div>
  );
}