import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Bell, Flag, MessageCircle, CheckCircle, Activity, PlusCircle, Sparkles, Plus, ClockIcon, UserCheck, HelpCircle, Phone } from 'lucide-react';
import moment from 'moment';
import LessonOutcomeModal from '@/components/lessons/LessonOutcomeModal';
import PupilLessonSummaryModal from '@/components/lessons/PupilLessonSummaryModal';
import NewLessonModal from '@/components/booking/NewLessonModal';
import DvlaVerificationCard from '@/components/dashboard/DvlaVerificationCard';
import TodayRevenueCard from '@/components/dashboard/TodayRevenueCard';
import NegativeBalancesCard from '@/components/dashboard/NegativeBalancesCard';
import PendingAdminCard from '@/components/dashboard/PendingAdminCard';
import OnboardingPopup from '@/components/onboarding/OnboardingPopup';
import InstructorAppTour from '@/components/onboarding/InstructorAppTour';

// Warm color palette - stable per section
const warmPalette = {
  card_greeting: 'bg-gradient-to-br from-blue-100 to-cyan-100',
  card_quiz_of_day: 'bg-gradient-to-br from-rose-100 to-pink-100',
  card_todays_schedule: 'bg-gradient-to-br from-green-100 to-emerald-100',
  card_upcoming_tests: 'bg-gradient-to-br from-orange-100 to-amber-100',
  card_notifications: 'bg-gradient-to-br from-amber-100 to-yellow-100',
  card_pupil_activities: 'bg-gradient-to-br from-indigo-100 to-purple-100'
};

export default function InstructorDashboard() {
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedPupilForSummary, setSelectedPupilForSummary] = useState(null);
  const [newLessonModalOpen, setNewLessonModalOpen] = useState(false);
  const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
  const [showAppTour, setShowAppTour] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Guard: reuse the same query key as layout so it hits the cache (no extra network call)
  const { data: pupilCheck, isLoading: isPupilCheckLoading } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id && !!user?.email
  });

  // Redirect learners away from instructor dashboard
  useEffect(() => {
    if (!isPupilCheckLoading && pupilCheck) {
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [pupilCheck, isPupilCheckLoading, navigate]);

  const { data: calendarRules = [] } = useQuery({
    queryKey: ['calendarRules', user?.id],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: user.id }),
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      let instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      
      if (instructors.length === 0) {
        const allInstructors = await base44.entities.Instructor.list();
        instructors = allInstructors.filter(i => i.created_by === user.email);
      }
      
      if (instructors.length > 0) {
        return instructors[0];
      }
      
      if (user.role === 'admin') {
        const newInstructor = await base44.entities.Instructor.create({
          name: user.full_name || user.email,
          phone: '',
          calendarDefaultView: 'week',
          lessonDurationDefaultMinutes: 60,
          timeZone: 'Europe/London'
        });
        return newInstructor;
      }
      return null;
    },
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  // Auto-backfill onboarding flags for existing instructors whose steps are done but flags were never set
  useEffect(() => {
    if (!instructor || !user) return;
    const updates = {};
    // Profile is complete if the instructor has a name AND either instructor.phone or user.phone is set
    const hasName = !!instructor.name;
    const hasPhone = !!(instructor.phone || user.phone);
    if (!instructor.onboardingProfileCompleted && hasName && hasPhone) {
      updates.onboardingProfileCompleted = true;
    }
    if (!instructor.onboardingCalendarCompleted && calendarRules.length > 0) {
      updates.onboardingCalendarCompleted = true;
    }
    if (!instructor.onboardingStripeCompleted && (instructor.stripeAccountId || instructor.stripeAccountStatus === 'active' || instructor.stripeAccountStatus === 'pending')) {
      updates.onboardingStripeCompleted = true;
    }
    if (Object.keys(updates).length > 0) {
      base44.entities.Instructor.update(instructor.id, updates);
    }
  }, [instructor?.id, user?.id, calendarRules.length]);

  // Show app tour if triggered from account menu
  useEffect(() => {
    if (instructor && sessionStorage.getItem('openInstructorAppTour') === '1') {
      sessionStorage.removeItem('openInstructorAppTour');
      setShowAppTour(true);
    }
  }, [instructor?.id]);

  // Show onboarding popup once instructor data is loaded
  useEffect(() => {
    if (instructor && !instructor.onboardingPopupDismissed) {
      const profileComplete = instructor.onboardingProfileCompleted || !!(instructor.name && (instructor.phone || user?.phone));
      const calendarComplete = instructor.onboardingCalendarCompleted || calendarRules.length > 0;
      const stripeComplete = instructor.onboardingStripeCompleted || !!instructor.stripeAccountId || instructor.stripeAccountStatus === 'active' || instructor.stripeAccountStatus === 'pending';
      const allDone = profileComplete && calendarComplete && stripeComplete;
      if (!allDone) setShowOnboardingPopup(true);
    }
  }, [instructor?.id]);

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils', instructor?.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const allPupils = await base44.entities.Pupil.filter({ instructorEmail: user.email });
      if (allPupils.length > 0) return allPupils;
      if (instructor?.id) {
        return await base44.entities.Pupil.filter({ instructorId: instructor.id });
      }
      return [];
    },
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const allBookings = await base44.entities.LessonBooking.filter({ instructorId: user.id }, '-startAtUtc');
      const activeBookings = allBookings.filter(b => !b.isDeleted);
      const uniqueBookings = [];
      const seen = new Set();
      for (const booking of activeBookings) {
        const key = `${booking.pupilId}_${booking.startAtUtc}_${booking.endAtUtc}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueBookings.push(booking);
        }
      }
      return uniqueBookings;
    },
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Lesson.filter({ instructorId: user.id }, '-date');
    },
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendarEvents', user?.id],
    queryFn: () => base44.entities.CalendarEvent.filter({ instructorId: user.id }),
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const { data: dailyQuiz } = useQuery({
    queryKey: ['todayDailyQuiz'],
    queryFn: async () => {
      const today = moment().format('YYYY-MM-DD');
      const quizzes = await base44.entities.DailyQuiz.filter({ date: today, status: 'published' });
      return quizzes.length > 0 ? quizzes[0] : null;
    },
    enabled: !isPupilCheckLoading && !pupilCheck
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Notification.filter({ userId: user.id }, '-created_date', 20);
    },
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const { data: pupilActivities = [] } = useQuery({
    queryKey: ['pupilActivities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Run all 3 queries in parallel
      const [recentHomework, recentMcqAttempts, recentDiaries] = await Promise.all([
        base44.entities.HomeworkItem.filter({ instructorId: user.id, status: 'Completed' }, '-updated_date', 10),
        base44.entities.McqAttempt.filter({ instructorId: user.id }, '-submittedAt', 10),
        base44.entities.DiaryEntry.filter({ instructorId: user.id }, '-created_date', 10)
      ]);
      const activities = [];
      recentHomework.forEach(hw => {
        const pupil = pupils.find(p => p.id === hw.pupilId);
        if (pupil) activities.push({
          type: 'homework',
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          message: `Completed homework: ${hw.title}`,
          timestamp: hw.updated_date,
          icon: CheckCircle
        });
      });
      recentMcqAttempts.forEach(attempt => {
        const pupil = pupils.find(p => p.id === attempt.pupilId);
        if (pupil) activities.push({
          type: 'mcq',
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          message: `${attempt.passed ? 'Passed' : 'Attempted'} MCQ: ${attempt.topicId.replace(/_/g, ' ')} (${attempt.score}/${attempt.totalQuestions})`,
          timestamp: attempt.submittedAt,
          icon: MessageCircle
        });
      });
      recentDiaries.forEach(diary => {
        const pupil = pupils.find(p => p.id === diary.pupilId);
        if (pupil) activities.push({
          type: 'diary',
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          message: `New lesson diary entry`,
          timestamp: diary.created_date,
          icon: Calendar
        });
      });
      return activities.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp))).slice(0, 10);
    },
    enabled: !!user?.id && pupils.length > 0 && !isPupilCheckLoading && !pupilCheck
  });

  const subscriptionEnabled = !!user?.id && !isPupilCheckLoading && !pupilCheck;
  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ['userSubscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.UserSubscription.filter({ userId: user.id });
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: subscriptionEnabled
  });
  const isSubscriptionReady = subscriptionEnabled && !isSubscriptionLoading;

  const { data: availableSlotsToday = [] } = useQuery({
    queryKey: ['availableSlotsToday', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const slots = await base44.entities.BookableSlotInstance.filter({
        instructorId: user.id,
        status: 'available'
      });
      const startOfDay = moment().startOf('day').toISOString();
      const endOfDay = moment().endOf('day').toISOString();
      return slots.filter(slot =>
        moment(slot.startAtUtc).isBetween(startOfDay, endOfDay, null, '[]')
      );
    },
    enabled: !!user?.id && !isPupilCheckLoading && !pupilCheck
  });

  const today = moment().format('YYYY-MM-DD');
  const now = moment();

  const todayLessons = lessons.filter(l => l.date === today).map(l => ({
    ...l,
    type: 'lesson',
    startAtUtc: moment(`${l.date} ${l.startTime}`, 'YYYY-MM-DD HH:mm').toISOString(),
    endAtUtc: moment(`${l.date} ${l.endTime}`, 'YYYY-MM-DD HH:mm').toISOString(),
    durationHours: moment(l.endTime, 'HH:mm').diff(moment(l.startTime, 'HH:mm'), 'minutes') / 60
  }));

  const todayBookings = bookings.filter(b => {
    if (!b.startAtUtc) return false;
    return moment(b.startAtUtc).local().isSame(today, 'day');
  }).map(b => ({ ...b, type: 'booking' }));

  const todayPersonalEvents = calendarEvents.filter(e => {
    if (!e.startAtUtc) return false;
    return moment(e.startAtUtc).local().isSame(today, 'day');
  }).map(e => ({
    ...e,
    type: 'personal',
    durationHours: e.durationMinutes ? e.durationMinutes / 60 : moment(e.endAtUtc).diff(moment(e.startAtUtc), 'hours', true)
  }));

  const todaySchedule = [...todayLessons, ...todayBookings, ...todayPersonalEvents];

  const nextRelevantBooking = todaySchedule
    .filter(item => {
      if (!item.startAtUtc || !item.endAtUtc) return false;
      const startTime = moment(item.startAtUtc).local();
      const endTime = moment(item.endAtUtc).local();
      const isUpcoming = startTime.isAfter(now);
      const isOngoing = startTime.isSameOrBefore(now) && endTime.isAfter(now);
      const validStatus = item.type === 'personal' || item.status === 'Scheduled' || ['pending', 'confirmed', 'in_progress'].includes(item.status);
      return (isUpcoming || isOngoing) && validStatus;
    })
    .sort((a, b) => Math.abs(moment(a.startAtUtc).local().diff(now)) - Math.abs(moment(b.startAtUtc).local().diff(now)))[0];

  const upcomingTodayBookings = todaySchedule.filter(item => {
    if (!item.startAtUtc) return false;
    const startTime = moment(item.startAtUtc).local();
    const validStatus = item.type === 'personal' || item.status === 'Scheduled' || ['pending', 'confirmed', 'in_progress'].includes(item.status);
    return startTime.isAfter(now) && validStatus && item.id !== nextRelevantBooking?.id;
  }).sort((a, b) => moment(a.startAtUtc).local().diff(moment(b.startAtUtc).local()));

  const todayNeedingOutcome = todaySchedule.filter(item => {
    if (!item.endAtUtc) return false;
    const endTime = moment(item.endAtUtc).local();
    const validStatus = item.status === 'Scheduled' || ['pending', 'confirmed', 'in_progress'].includes(item.status);
    return endTime.isBefore(now) && validStatus;
  }).sort((a, b) => moment(b.endAtUtc).local().diff(moment(a.endAtUtc).local()));

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      reserved_pending_instructor: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-slate-300 text-slate-700',
      cancelled: 'bg-rose-100 text-rose-700',
      cancelled_by_pupil: 'bg-rose-100 text-rose-700',
      cancelled_late_by_pupil: 'bg-red-100 text-red-700',
      declined_by_instructor: 'bg-slate-200 text-slate-700',
      no_show: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getCategoryBadge = (item) => {
    if (item?.type === 'personal') return { label: 'Personal', className: 'bg-yellow-100 text-yellow-800' };
    if (item?.type === 'booking' && item?.isPracticalTest) return { label: 'Driving Test', className: 'bg-violet-100 text-violet-700' };
    return { label: 'Lesson', className: 'bg-emerald-100 text-emerald-700' };
  };

  const upcomingTests = pupils.filter(p =>
    p.practicalTestDate &&
    moment(p.practicalTestDate).isAfter(today) &&
    moment(p.practicalTestDate).diff(moment(), 'days') <= 30
  ).sort((a, b) => moment(a.practicalTestDate).diff(moment(b.practicalTestDate)));

  const unreadNotifications = notifications.filter(n => !n.readAt);

  const nextPupil = nextRelevantBooking ? pupils.find(p => p.id === nextRelevantBooking.pupilId) : null;
  const { data: lastDiaryEntry } = useQuery({
    queryKey: ['lastDiaryEntry', nextPupil?.id],
    queryFn: async () => {
      if (!nextPupil?.id) return null;
      const diaries = await base44.entities.DiaryEntry.filter({ pupilId: nextPupil.id }, '-date', 1);
      return diaries.length > 0 ? diaries[0] : null;
    },
    enabled: !!nextPupil?.id
  });

  const getTimeOfDay = () => {
    const hour = moment().hour();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Show loading while checking if user is a learner
  if (!user || isPupilCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Don't render instructor content if user is a learner (redirect is happening)
  if (pupilCheck) {
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

  const handleViewSummary = (pupil) => {
    setSelectedPupilForSummary(pupil);
    setSummaryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-4">

          {/* Subscription Upgrade Card - Show if no active subscription */}
          {isSubscriptionReady && (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing' && subscription.status !== 'grace')) ? (
            <Card className="bg-gradient-to-r from-[#F7B602] to-amber-500 border-0 shadow-md overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#071739] mb-2">Unlock Full Access</h3>
                    <p className="text-sm text-[#071739]/80 mb-4">
                      Subscribe to a plan to get access to all premium features including pupil management, lesson tracking, and more.
                    </p>
                    <Link to={createPageUrl('InstructorSubscription')}>
                      <Button className="bg-[#071739] hover:bg-[#0e2a5a] text-white">
                        <Sparkles className="w-4 h-4 mr-2" />
                        View Plans
                      </Button>
                    </Link>
                  </div>
                  <Sparkles className="w-12 h-12 text-[#071739]/30 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* 2. Quiz of the Day Card */}
          {dailyQuiz && (
            <Card className={`${warmPalette.card_quiz_of_day} border-0 shadow-sm overflow-hidden`}>
              <CardContent className="p-6">
                <Badge className="mb-3 bg-purple-600 text-white">Quiz of the Day</Badge>
                <h3 className="text-xl font-semibold text-slate-800 mb-2 line-clamp-2">{dailyQuiz.title}</h3>
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
          <Card className={`${warmPalette.card_todays_schedule} border-0 shadow-sm overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Today's Schedule
                </h3>
              </div>

              <div className="bg-white/70 rounded-lg p-4 mb-4 relative">
                {nextRelevantBooking && nextPupil?.phone && (
                  <a href={`tel:${nextPupil.phone.replace(/\s+/g, '')}`} className="sm:hidden absolute top-3 right-3">
                    <span className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                      <Phone className="w-5 h-5" />
                    </span>
                  </a>
                )}
                <p className="text-xs font-medium text-slate-500 mb-2">Next Event</p>
                {nextRelevantBooking ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-800">
                        {moment(nextRelevantBooking.startAtUtc).local().format('HH:mm')} – {moment(nextRelevantBooking.endAtUtc).local().format('HH:mm')}
                      </p>
                      <p className="text-slate-700 mt-1 truncate">
                        {nextRelevantBooking.type === 'personal'
                          ? nextRelevantBooking.title
                          : `${pupils.find(p => p.id === nextRelevantBooking.pupilId)?.firstName || ''} ${pupils.find(p => p.id === nextRelevantBooking.pupilId)?.lastName || ''}`.trim()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCategoryBadge(nextRelevantBooking).className}>
                          {getCategoryBadge(nextRelevantBooking).label}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {nextRelevantBooking.durationHours}h
                        </span>
                      </div>
                      {nextRelevantBooking.pickupLocation && (
                        <p className="text-sm text-slate-500 mt-1 truncate">{nextRelevantBooking.pickupLocation}</p>
                      )}
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        {nextRelevantBooking.type !== 'personal' && nextRelevantBooking.pupilId && (
                          <Link to={createPageUrl('PupilProfile') + `?id=${nextRelevantBooking.pupilId}`} className="w-full sm:flex-1">
                            <Button size="sm" className="w-full bg-[#071739] hover:bg-[#0e2a5a] text-white">
                              View Pupil Profile
                            </Button>
                          </Link>
                        )}
                        {nextPupil?.phone && (
                          <a href={`tel:${nextPupil.phone.replace(/\s+/g, '')}`} className="hidden sm:block sm:flex-1">
                            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </Button>
                          </a>
                        )}
                        <Link to={createPageUrl('InstructorSchedule')} className="w-full sm:flex-1">
                          <Button size="sm" className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                            View Schedule
                          </Button>
                        </Link>
                      </div>
                    </div>

</div>
                ) : availableSlotsToday.length > 0 ? (
                  <div className="text-center py-4">
                    <PlusCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm text-slate-700 font-medium">Available slots found!</p>
                    <p className="text-xs text-slate-500 mb-3">
                      You have {availableSlotsToday.length} free slot{availableSlotsToday.length !== 1 ? 's' : ''} today.
                    </p>
                    <Link to={createPageUrl('InstructorBookingCalendar')}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        View Available Slots
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No more lessons today.</p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* 3a. Revenue Cards (Today / Week / Month / Negative Balances) */}
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 snap-x">
            <div className="shrink-0 snap-start w-[76vw] sm:w-[20rem] lg:w-[22rem]">
              <TodayRevenueCard userId={user?.id} disabled={isPupilCheckLoading || !!pupilCheck} range="today" />
            </div>
            <div className="shrink-0 snap-start w-[76vw] sm:w-[20rem] lg:w-[22rem]">
              <TodayRevenueCard userId={user?.id} disabled={isPupilCheckLoading || !!pupilCheck} range="week" />
            </div>
            <div className="shrink-0 snap-start w-[76vw] sm:w-[20rem] lg:w-[22rem]">
              <TodayRevenueCard userId={user?.id} disabled={isPupilCheckLoading || !!pupilCheck} range="month" />
            </div>
            <div className="shrink-0 snap-start w-[76vw] sm:w-[20rem] lg:w-[22rem]">
              <NegativeBalancesCard pupils={pupils} isLoading={isPupilCheckLoading} />
            </div>
          </div>

          {/* 3a. Pending Admin — lessons awaiting completion */}
          <PendingAdminCard
            lessons={lessons}
            pupils={pupils}
            isLoading={isPupilCheckLoading}
            onMarkLesson={handleMarkLesson}
          />

          {/* 3b. DVLA Verification Card */}
          <DvlaVerificationCard pupils={pupils} />

          {/* 3c. Pending Bookings Card */}
          {(() => {
            const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'reserved_pending_instructor');
            if (pendingBookings.length === 0) return null;
            return (
              <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-violet-600" />
                      Pending Bookings
                    </h3>
                    <Badge className="bg-violet-600 text-white">{pendingBookings.length} pending</Badge>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {pendingBookings
                      .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)))
                      .map(booking => {
                        const pupil = pupils.find(p => p.id === booking.pupilId);
                        return (
                          <Link
                            key={booking.id}
                            to={createPageUrl('InstructorBookingCalendar')}
                            className="block"
                          >
                            <div className="bg-white/80 rounded-lg p-3 hover:bg-white transition-colors border border-violet-100">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <UserCheck className="w-4 h-4 text-violet-600 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                      {pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Unknown Pupil'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {moment(booking.startAtUtc).local().format('ddd D MMM')} · {moment(booking.startAtUtc).local().format('HH:mm')}–{moment(booking.endAtUtc).local().format('HH:mm')}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status === 'reserved_pending_instructor' ? 'Awaiting Approval' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                  <Link to={createPageUrl('InstructorBookingCalendar')}>
                    <Button variant="outline" className="w-full mt-4 border-violet-300 text-violet-800 hover:bg-violet-50">
                      Manage Bookings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}

          {/* 4. Upcoming Tests Card */}
          {upcomingTests.length > 0 && (
            <Card className={`${warmPalette.card_upcoming_tests} border-0 shadow-sm overflow-hidden`}>
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">
                                {pupil.firstName} {pupil.lastName}
                              </p>
                              <p className="text-sm text-slate-600 mt-1 break-words">
                                {moment(pupil.practicalTestDate).format('DD MMM YYYY')}
                                {pupil.practicalTestTime && ` at ${pupil.practicalTestTime}`}
                              </p>
                              {pupil.practicalTestCentre && (
                                <p className="text-xs text-slate-500 truncate">{pupil.practicalTestCentre}</p>
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

          {/* Pupil Activities */}
          <div>
            {pupilActivities.length > 0 && (
              <Card className={`${warmPalette.card_pupil_activities} border-0 shadow-sm overflow-hidden`}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Pupil Activities
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pupilActivities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={`${activity.type}-${index}`}
                          className="bg-white/70 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2">
                            <Icon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {activity.pupilName}
                              </p>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2 break-words">
                                {activity.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {moment(activity.timestamp).fromNow()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>

      <InstructorAppTour open={showAppTour} onClose={() => setShowAppTour(false)} />

      {instructor && (
        <OnboardingPopup
          instructor={instructor}
          open={showOnboardingPopup}
          onDismiss={() => setShowOnboardingPopup(false)}
        />
      )}

      <LessonOutcomeModal
        open={outcomeModalOpen}
        onClose={() => {
          setOutcomeModalOpen(false);
          setSelectedLessonId(null);
        }}
        lessonId={(() => {
          if (!selectedLessonId) return null;
          // Pending admin lessons are Lesson entities
          if (lessons.some(l => l.id === selectedLessonId)) return selectedLessonId;
          if (nextRelevantBooking?.type === 'lesson' && nextRelevantBooking.id === selectedLessonId) return selectedLessonId;
          return null;
        })()}
        bookingId={(() => {
          if (!selectedLessonId) return null;
          if (lessons.some(l => l.id === selectedLessonId)) return null;
          if (nextRelevantBooking?.type === 'booking' && nextRelevantBooking.id === selectedLessonId) return selectedLessonId;
          if (todayNeedingOutcome.find(item => item.id === selectedLessonId)?.type === 'booking') return selectedLessonId;
          return null;
        })()}
      />

      <PupilLessonSummaryModal
        open={summaryModalOpen}
        onClose={() => {
          setSummaryModalOpen(false);
          setSelectedPupilForSummary(null);
        }}
        pupil={selectedPupilForSummary}
        lastDiaryEntry={selectedPupilForSummary?.id === nextPupil?.id ? lastDiaryEntry : null}
      />

      <NewLessonModal
        open={newLessonModalOpen}
        onOpenChange={setNewLessonModalOpen}
      />
    </div>
  );
}