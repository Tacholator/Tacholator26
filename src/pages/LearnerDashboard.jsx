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
  Lock
} from 'lucide-react';
import moment from 'moment';

export default function LearnerDashboard() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ userId: user.id }, '-created_date', 10),
    enabled: !!user?.id
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

  const today = moment().format('YYYY-MM-DD');
  const nextLesson = lessons
    .filter(l => l.date >= today && l.status === 'Scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const latestDiary = diaryEntries[0];

  // Calculate overall progress from driving skills
  const overallProgress = React.useMemo(() => {
    if (!drivingProgress.length) return 0;
    const progressValues = { full_talk_through: 33, prompted: 66, independent: 100 };
    const totalProgress = drivingProgress.reduce((sum, skill) => {
      return sum + (progressValues[skill.progressState] || 0);
    }, 0);
    return Math.round(totalProgress / drivingProgress.length);
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

  if (pupilLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">
            Hello, {user?.firstName || pupil.firstName}! 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Keep up the great work on your driving journey
          </p>
        </motion.div>

        {/* Arrival Notification Banner */}
        {arrivalNotification && (
          <ArrivalBanner notification={arrivalNotification} lesson={arrivalLesson} />
        )}

        {/* Overall Driving Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-sm border-l-4 border-l-[#F7B602]">
            <CardHeader>
              <CardTitle className="text-lg">Driving Progress Overview</CardTitle>
              <p className="text-sm text-slate-500">Your progress is updated by your instructor</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                  <span className="text-sm font-bold text-[#F7B602]">{overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#F7B602] to-[#d99f02] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Next Focus</p>
                  <p className="text-sm font-medium text-slate-700">
                    {nextFocusTopic?.label || 'Awaiting instructor update'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-slate-700">
                    {drivingProgress.length > 0 ? moment(drivingProgress[0].lastUpdated).fromNow() : '—'}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('LearnerProgress')} className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  <TrendingUp className="w-4 h-4" />
                  View Full Driving Progress
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lesson Hours Progress */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-0 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg">Lesson Hours</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ProgressRing
                  current={pupil.hoursCompleted || 0}
                  target={pupil.targetHours || 45}
                  size={140}
                />
                <p className="text-sm text-slate-500 mt-4 text-center">
                  {pupil.targetHours - (pupil.hoursCompleted || 0)} hours remaining
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Lesson Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-sm h-full bg-gradient-to-br from-[#071739] to-[#0a2142] text-white">
              <CardHeader>
                <CardTitle className="text-lg text-white/90">Next Lesson</CardTitle>
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
                          {moment(nextLesson.date).format('dddd, D MMMM')}
                        </p>
                        <p className="text-white/80">{moment(nextLesson.date).fromNow()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-white/70" />
                        <span>{nextLesson.startTime} - {nextLesson.endTime}</span>
                      </div>
                      {nextLesson.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-white/70" />
                          <span className="truncate">{nextLesson.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-white/80">No upcoming lessons scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Latest Lesson Summary */}
        {latestDiary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Latest Lesson Summary</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    {moment(latestDiary.date).format('dddd, D MMMM YYYY')}
                  </p>
                </div>
                {latestDiary.aiSummary && (
                  <Badge className="bg-purple-100 text-purple-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Summary
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {latestDiary.objective && (
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-teal-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Objective</p>
                      <p className="text-slate-700">{latestDiary.objective}</p>
                    </div>
                  </div>
                )}
                
                {latestDiary.aiSummary && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-purple-800">{latestDiary.aiSummary}</p>
                  </div>
                )}
                
                {latestDiary.homeworkSuggestions && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">Homework</span>
                    </div>
                    <p className="text-amber-800">{latestDiary.homeworkSuggestions}</p>
                  </div>
                )}

                <Link to={createPageUrl('LearnerLessons')}>
                  <Button variant="outline" className="w-full gap-2 mt-2">
                    View All Lessons <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Homework & Learning Hub + Payments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Quick Access Homework */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  Homework & Learning
                </CardTitle>
                {homework.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700">{homework.length}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {homework.length > 0 ? (
                  <>
                    {homework.slice(0, 4).map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                        onClick={() => window.location.href = createPageUrl('LearnerHomework')}
                      >
                        <div className="p-2 rounded-lg bg-amber-100">
                          <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 truncate">{item.title}</p>
                          {item.dueDate && (
                            <p className="text-xs text-amber-600">Due {moment(item.dueDate).format('D MMM')}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    ))}
                    <Link to={createPageUrl('LearnerHomework')}>
                      <Button variant="outline" className="w-full gap-2">
                        View All Homework <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">No pending homework</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payments & Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            <Card className="border-0 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Payments & Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-700">{pupil.hoursCompleted || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Hours Done</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-700">
                      {Math.max(0, (pupil.targetHours || 45) - (pupil.hoursCompleted || 0))}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">Remaining</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">£{pupil.hourlyRate || 50}</p>
                    <p className="text-xs text-blue-600 mt-1">Per Hour</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Block Booking Balance</span>
                    <span className="font-semibold text-slate-700">
                      £{pupil.bulkPaymentBalance || 0}
                    </span>
                  </div>
                  {pupil.bulkAmountPaid > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Paid</span>
                      <span className="font-semibold text-slate-700">
                        £{pupil.bulkAmountPaid}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Messages & Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="mt-6"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Messages & Notifications</CardTitle>
              <p className="text-sm text-slate-500">Stay connected with your instructor</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{unreadMessages}</p>
                    <p className="text-xs text-blue-600">Unread Messages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Bell className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{unreadNotifications}</p>
                    <p className="text-xs text-purple-600">Notifications</p>
                  </div>
                </div>
              </div>
              {latestMessage && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Latest message</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{latestMessage.messageText}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    From {latestMessage.senderName} • {moment(latestMessage.created_date).fromNow()}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Link to={createPageUrl('LearnerChats')} className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Open Chats
                  </Button>
                </Link>
                <Link to={createPageUrl('LearnerNotifications')} className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructor Info */}
        {(pupil.instructorName || pupil.instructorEmail) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6"
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Your Instructor</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {pupil.instructorName || 'Your Instructor'}
                    </p>
                    {pupil.instructorEmail && (
                      <p className="text-sm text-slate-500">{pupil.instructorEmail}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Milestones & Motivation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mt-6"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F7B602]" />
                Milestones
              </CardTitle>
              <p className="text-sm text-slate-500">Small wins add up — keep going!</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <Award className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700">First Lesson</p>
                    <p className="text-xs text-emerald-600">Completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Lock className="w-6 h-6 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">10 Hours</p>
                    <p className="text-xs text-slate-500">Locked</p>
                  </div>
                </div>
                {pupil.theoryTestPassed && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Award className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Theory Test</p>
                      <p className="text-xs text-blue-600">Passed!</p>
                    </div>
                  </div>
                )}
                {pupil.practicalTestPassed && (
                  <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                    <Award className="w-6 h-6 text-rose-600" />
                    <div>
                      <p className="text-sm font-medium text-rose-700">Practical Test</p>
                      <p className="text-xs text-rose-600">Passed!</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-xs font-medium text-blue-700 mb-1">💡 Tip for this week</p>
                <p className="text-sm text-blue-800">
                  Complete any assigned study material before your next lesson to make faster progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Test Dates */}
        {(pupil.theoryTestDate || pupil.practicalTestDate) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {pupil.theoryTestDate && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 border-blue-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Theory Test</p>
                      <p className="text-xl font-semibold text-blue-800">
                        {moment(pupil.theoryTestDate).format('D MMM YYYY')}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        {moment(pupil.theoryTestDate).fromNow()}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-200 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {pupil.practicalTestDate && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100 border-rose-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-rose-600">Practical Test</p>
                      <p className="text-xl font-semibold text-rose-800">
                        {moment(pupil.practicalTestDate).format('D MMM YYYY')}
                      </p>
                      <p className="text-sm text-rose-600 mt-1">
                        {moment(pupil.practicalTestDate).fromNow()}
                      </p>
                      {pupil.practicalTestCentre && (
                        <p className="text-xs text-rose-500 mt-1">{pupil.practicalTestCentre}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-200 flex items-center justify-center">
                      <Car className="w-6 h-6 text-rose-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}