import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Bell, Flag, MessageCircle, CheckCircle } from 'lucide-react';
import moment from 'moment';
import LessonOutcomeModal from '@/components/lessons/LessonOutcomeModal';

// Warm color palette - stable per section
const warmPalette = {
  card_greeting: 'bg-gradient-to-br from-blue-100 to-cyan-100',
  card_quiz_of_day: 'bg-gradient-to-br from-rose-100 to-pink-100',
  card_todays_schedule: 'bg-gradient-to-br from-green-100 to-emerald-100',
  card_upcoming_tests: 'bg-gradient-to-br from-orange-100 to-amber-100',
  card_notifications: 'bg-gradient-to-br from-amber-100 to-yellow-100'
};

export default function InstructorDashboard() {
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const instructors = await base44.entities.Instructor.filter({ created_by: user.id });
      return instructors[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list('-date')
  });

  const { data: dailyQuiz } = useQuery({
    queryKey: ['todayDailyQuiz'],
    queryFn: async () => {
      const today = moment().format('YYYY-MM-DD');
      const quizzes = await base44.entities.DailyQuiz.filter({ 
        date: today,
        status: 'published'
      });
      return quizzes.length > 0 ? quizzes[0] : null;
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ userId: user.id }, '-created_date', 20),
    enabled: !!user?.id
  });

  const today = moment().format('YYYY-MM-DD');
  const now = moment();

  const todayLessons = lessons
    .filter(l => l.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextLesson = todayLessons.find(l => {
    const lessonTime = moment(`${l.date} ${l.startTime}`, 'YYYY-MM-DD HH:mm');
    return lessonTime.isAfter(now) && l.status === 'Scheduled';
  });

  // Context lesson for quick action (ongoing or just finished within 3 hours)
  const contextLesson = todayLessons.find(l => {
    const startTime = moment(`${l.date} ${l.startTime}`, 'YYYY-MM-DD HH:mm');
    const endTime = moment(`${l.date} ${l.endTime}`, 'YYYY-MM-DD HH:mm');
    
    // Ongoing lesson
    if (startTime.isSameOrBefore(now) && endTime.isAfter(now) && l.status === 'Scheduled') {
      return true;
    }
    
    // Just finished within 3 hours
    if (endTime.isSameOrBefore(now) && now.diff(endTime, 'minutes') <= 180 && l.status === 'Scheduled') {
      return true;
    }
    
    return false;
  });

  const upcomingTests = pupils.filter(p =>
    p.practicalTestDate &&
    moment(p.practicalTestDate).isAfter(today) &&
    moment(p.practicalTestDate).diff(moment(), 'days') <= 30
  ).sort((a, b) => moment(a.practicalTestDate).diff(moment(b.practicalTestDate)));

  const unreadNotifications = notifications.filter(n => !n.readAt);

  const getTimeOfDay = () => {
    const hour = moment().hour();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const firstName = user.firstName || user.full_name?.split(' ')[0] || 'there';

  const handleMarkLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setOutcomeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Quick Action - Mark Lesson (contextual) */}
        {contextLesson && (
          <div className="mb-4">
            <Button 
              onClick={() => handleMarkLesson(contextLesson.id)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Lesson as Complete
            </Button>
          </div>
        )}

        {/* Fixed card order - cards show/hide in place */}
        <div className="space-y-4">
          
          {/* 1. Greeting Card */}
          <Card className={`${warmPalette.card_greeting} border-0 shadow-sm`}>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Good {getTimeOfDay()}, {firstName}
              </h2>
              <p className="text-slate-600">
                You have {todayLessons.length} lesson{todayLessons.length !== 1 ? 's' : ''} today
                {nextLesson && ` • Next lesson at ${nextLesson.startTime}`}
              </p>
            </CardContent>
          </Card>

          {/* 2. Quiz of the Day Card */}
          {dailyQuiz && (
            <Card className={`${warmPalette.card_quiz_of_day} border-0 shadow-sm`}>
              <CardContent className="p-6">
                <Badge className="mb-3 bg-purple-600 text-white">Quiz of the Day</Badge>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{dailyQuiz.title}</h3>
                <p className="text-sm text-slate-600 mb-4">
                  {dailyQuiz.questionIds?.length || 0} questions
                </p>
                <Link to={createPageUrl('InstructorQuizPreview') + `?quizId=${dailyQuiz.id}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Preview Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 3. Today's Schedule Card */}
          <Card className={`${warmPalette.card_todays_schedule} border-0 shadow-sm`}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Today's Schedule
              </h3>

              {/* Next Lesson */}
              {nextLesson ? (
                <div className="bg-white/70 rounded-lg p-4 mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Next Lesson</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {nextLesson.startTime} – {nextLesson.endTime}
                  </p>
                  <p className="text-slate-700 mt-1">
                    {pupils.find(p => p.id === nextLesson.pupilId)?.firstName} {pupils.find(p => p.id === nextLesson.pupilId)?.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    {nextLesson.durationMinutes / 60}h • {nextLesson.status}
                  </div>
                  {nextLesson.location && (
                    <p className="text-sm text-slate-500 mt-1">{nextLesson.location}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link to={createPageUrl('Calendar')}>
                      <Button size="sm" variant="outline">View Lesson</Button>
                    </Link>
                    <Link to={createPageUrl('InstructorChats')}>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 rounded-lg p-4 mb-4 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No lessons scheduled today</p>
                </div>
              )}

              {/* Today's Lessons List */}
              {todayLessons.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">All Lessons Today</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {todayLessons.map(lesson => {
                      const pupil = pupils.find(p => p.id === lesson.pupilId);
                      return (
                        <div key={lesson.id} className="bg-white/70 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {lesson.startTime} • {pupil?.firstName} {pupil?.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{lesson.status}</p>
                            </div>
                            <Badge variant="secondary">{lesson.durationMinutes / 60}h</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Upcoming Tests Card */}
          {upcomingTests.length > 0 && (
            <Card className={`${warmPalette.card_upcoming_tests} border-0 shadow-sm`}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-rose-600" />
                  Upcoming Tests
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {upcomingTests.map(pupil => {
                    const daysUntil = moment(pupil.practicalTestDate).diff(moment(), 'days');
                    return (
                      <Link
                        key={pupil.id}
                        to={createPageUrl('PupilProfile') + `?id=${pupil.id}`}
                        className="block"
                      >
                        <div className="bg-white/70 rounded-lg p-3 hover:bg-white transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">
                                {pupil.firstName} {pupil.lastName}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {moment(pupil.practicalTestDate).format('DD MMM YYYY')}
                                {pupil.practicalTestTime && ` at ${pupil.practicalTestTime}`}
                              </p>
                              {pupil.practicalTestCentre && (
                                <p className="text-xs text-slate-500">{pupil.practicalTestCentre}</p>
                              )}
                            </div>
                            <Badge className="bg-rose-100 text-rose-700">
                              In {daysUntil}d
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. Notifications Card */}
          {(unreadNotifications.length > 0 || notifications.length > 0) && (
            <Card className={`${warmPalette.card_notifications} border-0 shadow-sm`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-600" />
                    Notifications
                  </h3>
                  {unreadNotifications.length > 0 && (
                    <Badge className="bg-amber-600 text-white">
                      {unreadNotifications.length} unread
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.slice(0, 5).map(notif => (
                    <div
                      key={notif.id}
                      className={`bg-white/70 rounded-lg p-3 ${!notif.readAt ? 'border-l-2 border-l-amber-500' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                          {notif.message && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {moment(notif.created_date).fromNow()}
                          </p>
                        </div>
                        {!notif.readAt && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl('InstructorNotifications')}>
                  <Button variant="outline" className="w-full mt-4">
                    View All Notifications
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      <LessonOutcomeModal
        open={outcomeModalOpen}
        onClose={() => {
          setOutcomeModalOpen(false);
          setSelectedLessonId(null);
        }}
        lessonId={selectedLessonId}
      />
    </div>
  );
}