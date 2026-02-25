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
  Wallet
} from 'lucide-react';
import moment from 'moment';
import { drivingSkillsSections } from '@/components/progress/drivingSkillsData';

export default function LearnerDashboard() {
  const queryClient = useQueryClient();

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
  const courseworkAssignments = homework.filter(h => h.formatType === 'link' && h.formatPayload?.topicId);
  const regularHomework = homework.filter(h => !(h.formatType === 'link' && h.formatPayload?.topicId));

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

  if (userLoading || pupilLoading) {
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
        <Card className="max-w-md text-center p-8">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Linked</h2>
          <p className="text-slate-500">
            Your account hasn't been linked to a pupil profile yet. Please contact your instructor.
          </p>
        </Card>
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
      <div className="max-w-4xl mx-auto space-y-6">
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

        {/* 1. Personal Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-slate-800">
            Good {getTimeOfDay()}, {user?.firstName || pupil.firstName}
          </h1>
          <p className="text-slate-500 mt-2">
            {pupil.status === 'Passed' 
              ? 'Welcome back, qualified driver! 🚗✨' 
              : "Let's keep you moving towards test success 🚗"}
          </p>
        </motion.div>

        {/* Arrival Notification Banner */}
        {arrivalNotification && (
          <ArrivalBanner notification={arrivalNotification} lesson={arrivalLesson} />
        )}

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

        {/* 3. Next Lesson & My Balance */}
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
                        <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                          {isNegative ? 'Make Payment' : 'View Payments'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        </div>

        {/* 4. Overall Progress & Last Lesson Summary */}
        <div className="grid md:grid-cols-2 gap-6">
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
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Progress</span>
                    <span className="text-sm font-bold text-orange-600">{overallProgress}%</span>
                  </div>
                  <div className="w-full bg-white/70 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Next Focus</p>
                    <p className="text-sm font-medium text-slate-800">
                      {nextFocusTopic?.label || 'All skills completed! 🎉'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Hours Completed</p>
                    <p className="text-sm font-medium text-slate-800">
                      {pupil.hoursCompleted || 0} / {pupil.targetHours || 45}
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl('LearnerProgress')}>
                  <Button variant="outline" className="w-full gap-2 bg-white/50 hover:bg-white/80 border-orange-200">
                    <TrendingUp className="w-4 h-4" />
                    View Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
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
                    <Link to={createPageUrl('LearnerLessons')}>
                      <Button variant="outline" className="w-full gap-2 bg-white/50 hover:bg-white/80 border-purple-200">
                        <FileText className="w-4 h-4" />
                        View All Lessons
                      </Button>
                    </Link>
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

        {/* 5. Assigned Coursework */}
        {courseworkAssignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Assigned Coursework
                  </CardTitle>
                </div>
                <Badge className="bg-blue-600 text-white">{courseworkAssignments.length} topics</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {courseworkAssignments.slice(0, 3).map(item => (
                  <Link key={item.id} to={createPageUrl('CourseWorkDetail') + `?topicId=${item.formatPayload.topicId}`}>
                    <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg hover:bg-white cursor-pointer transition-colors">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700 truncate">{item.title.replace('Coursework: ', '')}</p>
                        {item.dueDate && (
                          <p className="text-xs text-blue-600">Due {moment(item.dueDate).format('D MMM')}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </Link>
                ))}
                {courseworkAssignments.length > 3 && (
                  <Link to={createPageUrl('LearnerHomework')}>
                    <Button variant="outline" className="w-full gap-2 mt-2">
                      View All ({courseworkAssignments.length}) <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                {regularHomework.length > 0 && (
                  <Badge className="bg-amber-600 text-white">{regularHomework.length} pending</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {regularHomework.length > 0 ? (
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
                    <Button variant="outline" className="w-full gap-2 mt-2 bg-white/50 hover:bg-white/80 border-indigo-200">
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
    </div>
  );
}