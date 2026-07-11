import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProgressRing from '@/components/ui/ProgressRing';
import ArrivalBanner from '@/components/lessons/ArrivalBanner';
import ReferralBanner from '@/components/referral/ReferralBanner';
import ReferralPopup from '@/components/referral/ReferralPopup';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles,
  BookOpen,
  Target,
  ChevronRight,
  Loader2,
  Car,
  User,
  ClipboardList,
  FileText,
  MessageCircle,
  Bell,
  Award,
  TrendingUp,
  DollarSign,
  Lock,
  Mail,
  Phone,
  Users,
  Wallet,
  HelpCircle,
  NotebookPen
} from 'lucide-react';
import moment from 'moment';
import { drivingSkillsSections } from '@/components/progress/drivingSkillsData';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import PupilLessonSummaryModal from '@/components/lessons/PupilLessonSummaryModal';
import LearnerOnboardingPopup from '@/components/onboarding/LearnerOnboardingPopup';
import LearnerAppTour from '@/components/onboarding/LearnerAppTour';
import TestReadinessCard from '@/components/dashboard/TestReadinessCard';
import GoldenRuleCard from '@/components/dashboard/GoldenRuleCard';

export default function LearnerDashboard() {
  const queryClient = useQueryClient();
  const [summaryModalOpen, setSummaryModalOpen] = React.useState(false);
  const [showOnboardingPopup, setShowOnboardingPopup] = React.useState(false);
  const [showAppTour, setShowAppTour] = React.useState(false);
  const [checksbannerDismissed, setChecksBannerDismissed] = React.useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      // First try to find by linkedUserId
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      // Fallback to email match - fetch all pupils and match by email (case insensitive)
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

  // Fetch instructor profile from User entity
  const { data: instructor } = useQuery({
    queryKey: ['instructor', pupil?.instructorId],
    queryFn: async () => {
      if (!pupil?.instructorId) return null;
      const users = await base44.entities.User.filter({ id: pupil.instructorId });
      return users.length > 0 ? users[0] : null;
    },
    enabled: !!pupil?.instructorId
  });

  // Auto-link pupil record and track login timestamps
  const updatePupilMutation = useMutation({
    mutationFn: ({ pupilId, data }) => 
      base44.entities.Pupil.update(pupilId, data),
    onSuccess: () => queryClient.invalidateQueries(['myPupilProfile'])
  });

  // Show onboarding popup if profile is incomplete
  useEffect(() => {
    if (!pupil) return;
    const profileComplete = !!(pupil.firstName && pupil.lastName && pupil.phone);
    if (!profileComplete) {
      setShowOnboardingPopup(true);
    } else if (!pupil.onboardingProfileCompleted) {
      base44.entities.Pupil.update(pupil.id, { onboardingProfileCompleted: true });
    }
    // Show app tour on first login if not seen before, or if triggered from account menu
    if (profileComplete && (!pupil.appTourSeen || sessionStorage.getItem('openAppTour') === '1')) {
      sessionStorage.removeItem('openAppTour');
      setShowAppTour(true);
    }
  }, [pupil]);

  useEffect(() => {
    if (pupil?.firstLessonChecksBannerDismissed) {
      setChecksBannerDismissed(true);
    }
  }, [pupil?.firstLessonChecksBannerDismissed]);

  const handleTourClose = () => {
    setShowAppTour(false);
    if (pupil?.id && !pupil.appTourSeen) {
      base44.entities.Pupil.update(pupil.id, { appTourSeen: true });
    }
  };

  useEffect(() => {
    if (pupil && user) {
      const now = new Date().toISOString();
      const updates = {
        lastLoginTimestamp: now,
        lastActivityTimestamp: now,
        hasSignedUp: true,
        signupStatus: 'active_recently'
      };
      
      // If pupil exists but isn't linked yet, link it and set first login
      if (!pupil.linkedUserId && pupil.email?.toLowerCase() === user.email?.toLowerCase()) {
        updates.linkedUserId = user.id;
        updates.firstLoginTimestamp = now;
      } else if (!pupil.firstLoginTimestamp) {
        // First time login
        updates.firstLoginTimestamp = now;
      }
      
      updatePupilMutation.mutate({ pupilId: pupil.id, data: updates });
    }
  }, [pupil?.id, user?.id]);

  const { data: lessons = [] } = useQuery({
    queryKey: ['myLessons', pupil?.id],
    queryFn: () => base44.entities.Lesson.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['myBookings', pupil?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: diaryEntries = [] } = useQuery({
    queryKey: ['myDiaryEntries', pupil?.id],
    queryFn: async () => {
      const entries = await base44.entities.DiaryEntry.filter({ pupilId: pupil.id });
      return entries.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!pupil?.id
  });

  const { data: homework = [] } = useQuery({
    queryKey: ['myHomework', pupil?.id],
    queryFn: async () => {
      const items = await base44.entities.HomeworkItem.filter({ pupilId: pupil.id });
      return items.filter(h => h.status !== 'Completed').sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!pupil?.id
  });

  // Separate coursework assignments from regular homework
  // Coursework items have a formatPayload.url pointing to CourseWorkDetail
  const courseworkAssignments = homework.filter(h => 
    h.formatType === 'link' && h.formatPayload?.url?.includes('CourseWorkDetail')
  );
  const regularHomework = homework.filter(h => 
    !(h.formatType === 'link' && h.formatPayload?.url?.includes('CourseWorkDetail'))
  );

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ userId: user.id }, '-created_date', 10),
    enabled: !!user?.id
  });

  const { data: mcqAttempts = [] } = useQuery({
    queryKey: ['mcqAttempts', pupil?.id],
    queryFn: () => base44.entities.McqAttempt.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: drivingProgress = [] } = useQuery({
    queryKey: ['drivingProgress', pupil?.id],
    queryFn: () => base44.entities.DrivingSkillProgress.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', pupil?.id],
    queryFn: async () => {
      if (!pupil?.id) return [];
      const msgs = await base44.entities.Message.filter({ pupilId: pupil.id }, '-created_date', 20);
      return msgs;
    },
    enabled: !!pupil?.id
  });

  const arrivalNotification = notifications.find(n => n.type === 'lesson_arrival' && !n.acknowledged);
  const arrivalLesson = arrivalNotification 
    ? lessons.find(l => l.id === arrivalNotification.linkTargetId)
    : null;

  const now = moment();
  const nextLesson = bookings
    .filter(b => b.status === 'confirmed' && moment(b.startAtUtc).isAfter(now))
    .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)))[0];

  const latestDiary = diaryEntries[0];

  // Helper to get progress for a skill
  const getProgressForSkill = (skillId) => {
    return drivingProgress.find(p => p.skillId === skillId);
  };

  // Helper to calculate section progress
  const getSectionProgress = (section) => {
    const sectionSkills = [];
    const extractSkills = (items) => {
      items.forEach(item => {
        if (item.type === 'skill') {
          sectionSkills.push(item.id);
        } else if (item.subtopics) {
          extractSkills(item.subtopics);
        }
      });
    };
    extractSkills(section.topics);

    if (sectionSkills.length === 0) return { total: 0, completed: 0, percentage: 0, status: 'not_started' };

    const completed = sectionSkills.filter(skillId => {
      const progress = getProgressForSkill(skillId);
      return progress?.progressState === 'independent';
    }).length;

    const started = sectionSkills.some(skillId => {
      const progress = getProgressForSkill(skillId);
      return progress?.progressState;
    });

    const percentage = Math.round((completed / sectionSkills.length) * 100);
    
    let status = 'not_started';
    if (completed === sectionSkills.length) {
      status = 'completed';
    } else if (started) {
      status = 'in_progress';
    }

    return { total: sectionSkills.length, completed, percentage, status };
  };

  // Calculate overall progress - Based on 24 total parent cards/sections
  const overallProgress = React.useMemo(() => {
    const TOTAL_CARDS = 24;
    
    const completedCards = drivingSkillsSections.filter(section => {
      return getSectionProgress(section).status === 'completed';
    }).length;

    const percentage = Math.round((completedCards / TOTAL_CARDS) * 100);

    return percentage;
  }, [drivingProgress]);

  // Calculate total training mileage from all bookings
  const totalMileage = React.useMemo(() => {
    return bookings.reduce((total, b) => {
      if (b.startMileage != null && b.endMileage != null) {
        return total + (b.endMileage - b.startMileage);
      }
      return total;
    }, 0);
  }, [bookings]);

  // Find next focus topic (first skill that's not independent)
  const nextFocusTopic = React.useMemo(() => {
    const notCompleted = drivingProgress.find(s => s.progressState !== 'independent');
    return notCompleted ? { id: notCompleted.skillId, label: notCompleted.skillId.replace(/_/g, ' ') } : null;
  }, [drivingProgress]);

  // Messages/notifications summary
  const unreadMessages = messages.filter(m => !m.readAt && m.senderRole === 'instructor').length;
  const unreadNotifications = notifications.filter(n => !n.readAt).length;
  const latestMessage = messages.find(m => m.senderRole === 'instructor');

  // Fetch today's published daily quiz
  const { data: dailyQuiz } = useQuery({
    queryKey: ['todayDailyQuiz'],
    queryFn: async () => {
      const today = moment().format('YYYY-MM-DD');
      const quizzes = await base44.entities.DailyQuiz.filter({ 
        date: today,
        status: 'published'
      });
      return quizzes.length > 0 ? quizzes[0] : null;
    },
    enabled: !!pupil?.id
  });

  // Quiz visibility logic
  const quizVisibility = React.useMemo(() => {
    if (!dailyQuiz || !pupil?.id) return { visible: false };

    const today = moment().startOf('day');
    
    const quizQuestionIds = dailyQuiz.questionIds || [];
    const todayAttempts = mcqAttempts.filter(attempt => 
      quizQuestionIds.includes(attempt.mcqPackId) &&
      moment(attempt.submittedAt).isSame(today, 'day')
    );

    const completedToday = todayAttempts.length > 0 && todayAttempts.some(attempt => attempt.passed);
    
    if (completedToday) {
      return { visible: false, reason: 'completed' };
    }

    const inProgressAttempt = todayAttempts.find(attempt => !attempt.submittedAt);
    
    if (inProgressAttempt) {
      return {
        visible: true,
        badge: 'Quiz of the Day • In progress',
        buttonLabel: 'Continue Quiz',
        reason: 'in_progress'
      };
    }

    return {
      visible: true,
      badge: 'Quiz of the Day',
      buttonLabel: 'Start Quiz',
      reason: 'not_started'
    };
  }, [dailyQuiz, mcqAttempts, pupil?.id]);

  // Show loading while user is loading, or while pupil is being looked up (including when user just loaded)
  if (userLoading || pupilLoading || (user && pupil === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <Card className="max-w-md text-center p-8">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Not Authenticated</h2>
          <p className="text-slate-500 mb-4">
            Please log in to access the learner dashboard.
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#071739] to-[#0d2a5e] p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Car className="w-10 h-10 text-[#F7B602]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Tacholator!</h2>
              <p className="text-white/70 text-sm">You're almost ready to start your journey</p>
            </div>
            <CardContent className="p-8 text-center bg-white">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-[#F7B602]" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Not Linked Yet</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Your account hasn't been linked to a pupil profile yet. Please contact your instructor and they'll get you set up.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">What to do next</p>
                <p className="text-xs text-amber-700">Share your sign-up email address with your instructor so they can link your account to your pupil profile.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const getTimeOfDay = () => {
    const hour = moment().hour();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <LearnerOnboardingPopup
        open={showOnboardingPopup}
        onDismiss={() => setShowOnboardingPopup(false)}
        pupilId={pupil?.id}
      />
      <LearnerAppTour open={showAppTour} onClose={handleTourClose} />
      <ReferralPopup pupilProfile={pupil} />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Referral Banner */}
        <ReferralBanner pupilProfile={pupil} />

        {/* Congratulations Banner for Passed Pupils */}
        {pupil.status === 'Passed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="relative z-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Award className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight">
                  🎉 Congratulations! 🎉
                </h2>
                <p className="text-xl font-semibold">
                  You've passed your driving test!
                </p>
                <p className="text-white/90 text-lg max-w-2xl mx-auto">
                  This is an incredible achievement! All your hard work, dedication, and practice has paid off. 
                  You're now a qualified driver - drive safely and enjoy the freedom of the open road!
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-sm font-semibold">🚗 Licensed Driver</span>
                </div>
                <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-sm font-semibold">✨ Test Passed</span>
                </div>
                <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-sm font-semibold">🎯 Goal Achieved</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Golden Rule */}
        <GoldenRuleCard />

        {/* Arrival Notification Banner */}
        {arrivalNotification && (
          <ArrivalBanner notification={arrivalNotification} lesson={arrivalLesson} />
        )}

        {/* Test Readiness Card */}
        {pupil?.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <TestReadinessCard pupilId={pupil.id} />
          </motion.div>
        )}

        {/* First Lesson Checks Complete Banner */}
        {pupil.licenseChecked && pupil.eyeTestChecked && pupil.instructorDvlaVerified && !checksbannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-lg">✅</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 text-sm">First lesson checks complete</p>
              <p className="text-emerald-700 text-xs mt-0.5">Your licence, eye test and DVLA details have been verified by your instructor.</p>
            </div>
            <button
              onClick={() => {
                if (pupil?.id) {
                  base44.entities.Pupil.update(pupil.id, { firstLessonChecksBannerDismissed: true });
                }
                setChecksBannerDismissed(true);
              }}
              className="text-emerald-500 hover:text-emerald-700 transition-colors p-1 shrink-0"
              aria-label="Dismiss"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </motion.div>
        )}

        {/* Licence Reminder Banner - show if they have an upcoming first booking and haven't submitted DVLA details */}
        {(() => {
          const hasCompletedLesson = lessons.some(l => l.status === 'Completed');
          const hasUpcomingBooking = bookings.some(b => b.status === 'confirmed' && moment(b.startAtUtc).isAfter(now));
          const hasSubmittedDvla = !!pupil.dvlaCheckCode;
          const allChecksComplete = pupil.licenseChecked && pupil.eyeTestChecked && pupil.instructorDvlaVerified;
          if (!hasCompletedLesson && hasUpcomingBooking && !hasSubmittedDvla && !allChecksComplete) {
            return (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-lg">📋</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900 text-sm">Remember to bring your provisional licence!</p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Your instructor will need to check it at your first lesson. You can also share your DVLA check code with them in advance.
                  </p>
                  <Link to={createPageUrl('ProfileSettings')}>
                    <button className="mt-2 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900">
                      Share licence details →
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          }
          return null;
        })()}

        {/* 2. Quiz of the Day */}
        {quizVisibility.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <Badge className="mb-3 bg-purple-600 text-white">{quizVisibility.badge}</Badge>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{dailyQuiz.title}</h3>
                <p className="text-sm text-slate-600 mb-4">
                  {dailyQuiz.questionIds?.length || 0} questions • Test your knowledge
                </p>
                <Link to={createPageUrl('CourseWorkDetail') + `?quizId=${dailyQuiz.id}`}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    {quizVisibility.buttonLabel}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Test Countdown Card */}
        {(() => {
          const hasTheory = pupil.theoryTestDate && !pupil.theoryTestPassed && !pupil.theoryTestNotBooked;
          const hasPractical = pupil.practicalTestDate && !pupil.practicalTestPassed && !pupil.practicalTestNotBooked;
          const theoryDays = hasTheory ? moment(pupil.theoryTestDate).startOf('day').diff(moment().startOf('day'), 'days') : null;
          const practicalDays = hasPractical ? moment(pupil.practicalTestDate).startOf('day').diff(moment().startOf('day'), 'days') : null;

          const tests = [];
          if (hasTheory && theoryDays >= 0) tests.push({ type: 'Theory Test', date: pupil.theoryTestDate, days: theoryDays, centre: null, time: null });
          if (hasPractical && practicalDays >= 0) tests.push({ type: 'Practical Test', date: pupil.practicalTestDate, days: practicalDays, centre: pupil.practicalTestCentre, time: pupil.practicalTestTime });

          if (tests.length === 0) return null;

          return tests.map((test) => {
            const isUrgent = test.days <= 7;
            const isVeryUrgent = test.days <= 2;
            const gradientClass = isVeryUrgent
              ? 'from-rose-500 to-red-600'
              : isUrgent
              ? 'from-amber-500 to-orange-500'
              : 'from-blue-600 to-indigo-700';

            return (
              <motion.div
                key={test.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <Card className={`border-0 shadow-sm bg-gradient-to-br ${gradientClass} text-white`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <Badge className="bg-white/20 text-white border-0 text-xs font-semibold tracking-wide uppercase">
                          {test.type}
                        </Badge>
                        <p className="text-3xl font-bold mt-2">
                          {test.days === 0 ? 'Today!' : test.days === 1 ? 'Tomorrow!' : `${test.days} days to go`}
                        </p>
                        <p className="text-white/90 text-sm font-medium">
                          {moment(test.date).format('dddd, D MMMM YYYY')}
                        </p>
                        <p className="text-white/80 text-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {test.time && test.time.trim() ? test.time : 'Time not set'}
                        </p>
                        {test.centre && (
                          <p className="text-white/70 text-xs flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {test.centre}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-white/20 shrink-0">
                        <span className="text-4xl font-bold leading-none">{test.days}</span>
                        <span className="text-xs text-white/80 mt-1">{test.days === 1 ? 'day' : 'days'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          });
        })()}

        {/* 3. Next Lesson & Last Lesson Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-[#071739] to-[#0a2142] text-white">
              <CardHeader>
                <CardTitle className="text-lg text-white/90">Next Lesson & Hours Booked</CardTitle>
              </CardHeader>
              <CardContent>
                {nextLesson ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold">
                          {moment(nextLesson.startAtUtc).local().format('dddd, D MMMM')}
                        </p>
                        <p className="text-white/80">{moment(nextLesson.startAtUtc).fromNow()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-white/70" />
                        <span className="text-sm">{moment(nextLesson.startAtUtc).local().format('HH:mm')} - {moment(nextLesson.endAtUtc).local().format('HH:mm')}</span>
                      </div>
                      {nextLesson.pickupLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-white/70" />
                          <span className="truncate text-sm">{nextLesson.pickupLocation}</span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const futureBookings = bookings.filter(b => 
                        b.status === 'confirmed' && 
                        moment(b.startAtUtc).isAfter(now)
                      );
                      const totalHoursBooked = futureBookings.reduce((sum, b) => sum + (b.durationHours || 0), 0);
                      
                      return (
                        <div className="pt-3 border-t border-white/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/80">Total Hours Booked</span>
                            <span className="text-2xl font-bold">{totalHoursBooked.toFixed(1)}h</span>
                          </div>
                          <p className="text-xs text-white/70 mt-1">
                            {futureBookings.length} upcoming lesson{futureBookings.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Link to={createPageUrl('LearnerScheduledLessons')}>
                        <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                          View Lessons
                        </Button>
                      </Link>
                      <Link to={createPageUrl('LearnerChats')}>
                        <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-white/80 mb-2">You don't have a lesson booked</p>
                    {(() => {
                      const futureBookings = bookings.filter(b => 
                        b.status === 'confirmed' && 
                        moment(b.startAtUtc).isAfter(now)
                      );
                      const totalHoursBooked = futureBookings.reduce((sum, b) => sum + (b.durationHours || 0), 0);
                      
                      if (totalHoursBooked > 0) {
                        return (
                          <div className="mb-4 p-3 rounded-lg bg-white/10">
                            <span className="text-white/80 text-sm">{totalHoursBooked.toFixed(1)}h booked</span>
                            <p className="text-xs text-white/60 mt-1">
                              {futureBookings.length} upcoming lesson{futureBookings.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <Link to={createPageUrl('LearnerBookingCalendar')}>
                      <Button className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                        Book a Lesson
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Last Lesson Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestDiary ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Last Lesson</p>
                      <p className="text-sm font-semibold text-slate-800">{moment(latestDiary.date).format('DD MMM YYYY')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{moment(latestDiary.date).fromNow()}</p>
                    </div>
                    {latestDiary.mainTopic && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Topics Covered</p>
                        <p className="text-sm text-slate-700 line-clamp-2">{latestDiary.mainTopic}</p>
                      </div>
                    )}
                    {(latestDiary.whatWentWell || latestDiary.areasToImprove) && (
                      <div className="grid grid-cols-2 gap-3">
                        {latestDiary.whatWentWell && (
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-emerald-700 mb-1.5">✓ Went Well</p>
                            <p className="text-xs text-slate-600 line-clamp-3">{latestDiary.whatWentWell}</p>
                          </div>
                        )}
                        {latestDiary.areasToImprove && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-amber-700 mb-1.5">⚠ To Improve</p>
                            <p className="text-xs text-slate-600 line-clamp-3">{latestDiary.areasToImprove}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => setSummaryModalOpen(true)}
                      >
                        <Sparkles className="w-4 h-4" />
                        Full Summary
                      </Button>
                      <Link to={createPageUrl('LearnerDiary')} className="w-full">
                        <Button
                          className="w-full gap-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                          <NotebookPen className="w-4 h-4" />
                          View Diary
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                    <p className="text-sm text-slate-600">No lesson diary entries yet</p>
                    <p className="text-xs text-slate-500 mt-1">Your instructor will add notes after each lesson</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 4. My Balance & Overall Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {(() => {
              const balance = pupil.bulkPaymentBalance || 0;
              const hourlyRate = pupil.hourlyRate || 0;
              const hoursAvailable = hourlyRate > 0 ? (balance / hourlyRate).toFixed(1) : 0;
              
              const isPositive = balance > 0;
              const isZero = balance === 0;
              const isNegative = balance < 0;
              
              let bgGradient = 'from-slate-400 to-slate-500';
              let iconBg = 'bg-white/20';
              if (isPositive) {
                bgGradient = 'from-emerald-500 to-emerald-600';
                iconBg = 'bg-white/20';
              } else if (isNegative) {
                bgGradient = 'from-rose-500 to-rose-600';
                iconBg = 'bg-white/20';
              }
              
              return (
                <Card className={`border-0 shadow-sm bg-gradient-to-br ${bgGradient} text-white`}>
                  <CardHeader>
                    <CardTitle className="text-lg text-white/90">My Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            £{Math.abs(balance).toFixed(2)}
                          </p>
                          <p className="text-white/80 text-sm">
                            {isNegative ? 'Amount owed' : 'Credit balance'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80">Hours available</span>
                          <span className="text-lg font-semibold">{hoursAvailable}h</span>
                        </div>
                        {hourlyRate > 0 && (
                          <p className="text-xs text-white/70">
                            Based on £{hourlyRate.toFixed(2)}/hour
                          </p>
                        )}
                      </div>
                      <Link to={createPageUrl('LearnerPayments')}>
                        <Button className="w-full bg-white text-slate-800 hover:bg-white/90 font-semibold">
                          {isNegative ? 'Make Payment' : 'View Payments'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-100 to-amber-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Overall Driving Progress
                </CardTitle>
                <p className="text-sm text-slate-600">{drivingProgress.length} of 24 skills tracked</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-around py-2">
                  <div className="flex flex-col items-center gap-1">
                    <ProgressRing 
                      current={overallProgress} 
                      target={100} 
                      size={100} 
                      strokeWidth={8}
                      label="Progress"
                      displayValue={`${overallProgress}%`}
                      colorFrom="#f97316"
                      colorTo="#f59e0b"
                      uniqueId="progress-grad"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ProgressRing 
                      current={pupil.hoursCompleted || 0} 
                      target={pupil.targetHours || 45} 
                      size={100} 
                      strokeWidth={8}
                      label={`of ${pupil.targetHours || 45} hrs`}
                      colorFrom="#0d9488"
                      colorTo="#14b8a6"
                      uniqueId="hours-grad"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ProgressRing 
                      current={totalMileage} 
                      target={500} 
                      size={100} 
                      strokeWidth={8}
                      label="miles"
                      colorFrom="#3b82f6"
                      colorTo="#6366f1"
                      uniqueId="mileage-grad"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-600 mb-1">Next Focus</p>
                  <p className="text-sm font-medium text-slate-800">
                    {nextFocusTopic?.label || 'All skills completed! 🎉'}
                  </p>
                </div>
                <Link to={createPageUrl('LearnerProgress')}>
                  <Button className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                    <TrendingUp className="w-4 h-4" />
                    View Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 6. Homework & Notifications */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-100 to-yellow-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    Homework & Study Tasks
                  </CardTitle>
                </div>
                {(regularHomework.length + courseworkAssignments.length) > 0 && (
                  <Badge className="bg-amber-600 text-white">{regularHomework.length + courseworkAssignments.length} pending</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {(regularHomework.length > 0 || courseworkAssignments.length > 0) ? (
                  <>
                    {regularHomework.slice(0, 3).map(item => (
                      <Link key={item.id} to={createPageUrl('LearnerHomework')}>
                        <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg hover:bg-white cursor-pointer transition-colors">
                          <div className="p-2 rounded-lg bg-amber-200">
                            <FileText className="w-4 h-4 text-amber-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{item.title}</p>
                            {item.dueDate && (
                              <p className="text-xs text-amber-700">Due {moment(item.dueDate).format('D MMM')}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                    {courseworkAssignments.slice(0, 3).map(item => {
                      return (<Link key={item.id} to={item.formatPayload.url}>
                        <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg hover:bg-white cursor-pointer transition-colors">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{item.title.replace('Coursework: ', '').replace('Study: ', '').replace('Practice: ', '')}</p>
                            {item.dueDate && (
                              <p className="text-xs text-blue-600">Due {moment(item.dueDate).format('D MMM')}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </Link>);
                    })}
                    <Link to={createPageUrl('LearnerHomework')}>
                      <Button variant="outline" className="w-full gap-2 mt-2 bg-white/50 hover:bg-white/80 border-amber-200">
                        View All Homework <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-amber-300" />
                    <p className="text-sm text-slate-600">No homework assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-100 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    Recent Notifications
                  </CardTitle>
                  {unreadNotifications > 0 && (
                    <Badge className="bg-indigo-600 text-white">{unreadNotifications} unread</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.slice(0, 3).map(notification => (
                    <div 
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        notification.readAt ? 'bg-white/70' : 'bg-white border border-indigo-200'
                      }`}
                    >
                      <Bell className={`w-5 h-5 mt-0.5 ${notification.readAt ? 'text-slate-400' : 'text-indigo-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{moment(notification.created_date).fromNow()}</p>
                      </div>
                    </div>
                  ))}
                  <Link to={createPageUrl('LearnerNotifications')}>
                    <Button className="w-full gap-2 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                      View All Notifications <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* 8. Instructor Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {instructor && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Your Instructor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F7B602] to-[#d99f02] flex items-center justify-center text-2xl font-bold text-[#071739]">
                    {(instructor.firstName?.[0] || instructor.full_name?.[0] || 'I').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-slate-800">
                      {instructor.firstName && instructor.lastName 
                        ? `${instructor.firstName} ${instructor.lastName}` 
                        : instructor.full_name || instructor.email}
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-700 mt-1">ADI Approved</Badge>
                  </div>
                </div>
                {instructor.email && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${instructor.email}`} className="text-teal-600 hover:underline">
                      {instructor.email}
                    </a>
                  </div>
                )}
                {instructor.phone && (
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${instructor.phone}`} className="text-teal-600 hover:underline">
                      {instructor.phone}
                    </a>
                  </div>
                )}
                <Link to={createPageUrl('LearnerChats')}>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <PupilLessonSummaryModal
        open={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        pupil={pupil}
        lastDiaryEntry={latestDiary}
        showNextSteps={false}
      />
    </div>
  );
}