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
import NotifyArrivalButton from '@/components/lessons/NotifyArrivalButton';

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
    queryKey: ['pupils', user?.id],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: user?.id }),
    enabled: !!user?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: user?.id }, '-startAtUtc'),
    enabled: !!user?.id
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

  // Bookings needing outcome (past bookings not marked as completed/cancelled/no_show)
  const lessonsNeedingOutcome = bookings.filter(b => {
    const endTime = moment(b.endAtUtc);
    return endTime.isBefore(now) && ['reserved_pending_instructor', 'confirmed'].includes(b.status);
  }).sort((a, b) => moment(b.endAtUtc).diff(moment(a.endAtUtc)));

  // Today's bookings that are upcoming or need outcome
  const todayBookings = bookings.filter(b => {
    const startTime = moment(b.startAtUtc);
    return startTime.isSame(today, 'day');
  });

  // Find closest lesson to current time (upcoming or ongoing)
  const nextRelevantBooking = todayBookings
    .filter(b => {
      const startTime = moment(b.startAtUtc);
      const endTime = moment(b.endAtUtc);
      const isUpcoming = startTime.isAfter(now);
      const isOngoing = startTime.isSameOrBefore(now) && endTime.isAfter(now);
      return (isUpcoming || isOngoing) && ['reserved_pending_instructor', 'confirmed'].includes(b.status);
    })
    .sort((a, b) => {
      // Sort by how close they are to current time
      const aStart = moment(a.startAtUtc);
      const bStart = moment(b.startAtUtc);
      return Math.abs(aStart.diff(now)) - Math.abs(bStart.diff(now));
    })[0];

  const upcomingTodayBookings = todayBookings.filter(b => {
    const startTime = moment(b.startAtUtc);
    // Exclude the next relevant booking from this list
    return startTime.isAfter(now) && 
           ['reserved_pending_instructor', 'confirmed'].includes(b.status) &&
           b.id !== nextRelevantBooking?.id;
  }).sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  const todayNeedingOutcome = todayBookings.filter(b => {
    const endTime = moment(b.endAtUtc);
    return endTime.isBefore(now) && ['reserved_pending_instructor', 'confirmed'].includes(b.status);
  }).sort((a, b) => moment(b.endAtUtc).diff(moment(a.endAtUtc)));

  const getStatusColor = (status) => {
    const colors = {
      reserved_pending_instructor: 'bg-purple-100 text-purple-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-slate-300 text-slate-700',
      cancelled: 'bg-rose-100 text-rose-700',
      cancelled_by_pupil: 'bg-rose-100 text-rose-700',
      cancelled_late_by_pupil: 'bg-rose-100 text-rose-700',
      cancelled_by_instructor: 'bg-rose-100 text-rose-700',
      declined_by_instructor: 'bg-rose-100 text-rose-700',
      no_show: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  // Context booking for quick action (ongoing or just finished within 3 hours)
  const contextBooking = todayBookings.find(b => {
    const startTime = moment(b.startAtUtc).local();
    const endTime = moment(b.endAtUtc).local();
    
    // Ongoing booking
    if (startTime.isSameOrBefore(now) && endTime.isAfter(now) && b.status === 'confirmed') {
      return true;
    }
    
    // Just finished within 3 hours
    if (endTime.isSameOrBefore(now) && now.diff(endTime, 'minutes') <= 180 && b.status === 'confirmed') {
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
        {/* Quick Action - Mark Booking (contextual) */}
        {contextBooking && (
          <div className="mb-4">
            <Button 
              onClick={() => handleMarkLesson(contextBooking.id)}
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
                You have {nextRelevantBooking ? upcomingTodayBookings.length + 1 : upcomingTodayBookings.length} upcoming lesson{(nextRelevantBooking ? upcomingTodayBookings.length + 1 : upcomingTodayBookings.length) !== 1 ? 's' : ''} today
                {nextRelevantBooking && ` • Next at ${moment(nextRelevantBooking.startAtUtc).local().format('HH:mm')}`}
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

              {/* Next Relevant Lesson */}
              <div className="bg-white/70 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Next Lesson</p>
                {nextRelevantBooking ? (
                  <>
                    <p className="text-lg font-semibold text-slate-800">
                      {moment(nextRelevantBooking.startAtUtc).local().format('HH:mm')} – {moment(nextRelevantBooking.endAtUtc).local().format('HH:mm')}
                    </p>
                    <p className="text-slate-700 mt-1">
                      {pupils.find(p => p.id === nextRelevantBooking.pupilId)?.firstName} {pupils.find(p => p.id === nextRelevantBooking.pupilId)?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(nextRelevantBooking.status)}>
                        {nextRelevantBooking.status === 'reserved_pending_instructor' ? 'Pending' : nextRelevantBooking.status}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {nextRelevantBooking.durationHours}h
                      </span>
                    </div>
                    {nextRelevantBooking.pickupLocation && (
                      <p className="text-sm text-slate-500 mt-1">{nextRelevantBooking.pickupLocation}</p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Link to={createPageUrl('Calendar')}>
                        <Button size="sm" variant="outline">View Lesson</Button>
                      </Link>
                      <NotifyArrivalButton 
                        lessonId={null}
                        bookingId={nextRelevantBooking.id}
                        pupilId={nextRelevantBooking.pupilId}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkLesson(nextRelevantBooking.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Set Outcome
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No more lessons today.</p>
                  </div>
                )}
              </div>

              {/* Upcoming Lessons Today */}
              {upcomingTodayBookings.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Upcoming Today</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {upcomingTodayBookings.map(booking => {
                      const pupil = pupils.find(p => p.id === booking.pupilId);
                      return (
                        <div key={booking.id} className="bg-white/70 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {moment(booking.startAtUtc).local().format('HH:mm')} • {pupil?.firstName} {pupil?.lastName}
                              </p>
                              <Badge className={`${getStatusColor(booking.status)} text-xs mt-1`}>
                                {booking.status === 'reserved_pending_instructor' ? 'Pending' : booking.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500">{booking.durationHours}h</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lessons Needing Outcome Today */}
              {todayNeedingOutcome.length > 0 && (
                <>
                  <div className="border-t my-4"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Needs Outcome (Today)</p>
                    <p className="text-xs text-slate-500 mb-3">Past lessons shown only if they need an outcome.</p>
                    <div className="space-y-2">
                      {todayNeedingOutcome.map(booking => {
                        const pupil = pupils.find(p => p.id === booking.pupilId);
                        return (
                          <div key={booking.id} className="bg-rose-50/70 rounded-lg p-3 border border-rose-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">
                                  {moment(booking.startAtUtc).local().format('HH:mm')}–{moment(booking.endAtUtc).local().format('HH:mm')} • {pupil?.firstName} {pupil?.lastName}
                                </p>
                                <p className="text-xs text-rose-600 mt-1">Needs outcome</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleMarkLesson(booking.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                Set Outcome
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
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
        bookingId={selectedLessonId}
      />
    </div>
  );
}