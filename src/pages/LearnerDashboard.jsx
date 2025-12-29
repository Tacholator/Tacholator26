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
  Users
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

  const now = moment();
  const nextLesson = bookings
    .filter(b => b.status === 'confirmed' && moment(b.startAtUtc).isAfter(now))
    .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)))[0];

  const latestDiary = diaryEntries[0];

  // Calculate overall progress from driving skills - Based on 24 total DVSA skills
  const overallProgress = React.useMemo(() => {
    const TOTAL_SKILLS = 24;
    if (!drivingProgress.length) return 0;
    const progressValues = { full_talk_through: 33, prompted: 66, independent: 100 };
    const totalProgress = drivingProgress.reduce((sum, skill) => {
      return sum + (progressValues[skill.progressState] || 0);
    }, 0);
    return Math.round(totalProgress / TOTAL_SKILLS);
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

  const getTimeOfDay = () => {
    const hour = moment().hour();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Quiz of the Day - stable daily quiz selection
  const quizOfTheDay = React.useMemo(() => {
    const dayOfYear = moment().dayOfYear();
    const quizzes = [
      { id: '1', title: 'Legal Responsibilities', topicId: 'legal_responsibilities' },
      { id: '2', title: 'Mirrors, Signals & Speed', topicId: 'mirrors_signals_speed' },
      { id: '3', title: 'Junctions & Roundabouts', topicId: 'junctions_roundabouts' },
      { id: '4', title: 'Emergency Situations', topicId: 'emergency_situations' }
    ];
    return quizzes[dayOfYear % quizzes.length];
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
            Let's keep you moving towards test success 🚗
          </p>
        </motion.div>

        {/* Arrival Notification Banner */}
        {arrivalNotification && (
          <ArrivalBanner notification={arrivalNotification} lesson={arrivalLesson} />
        )}

        {/* 2. Quiz of the Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <Badge className="mb-3 bg-purple-600 text-white">Quiz of the Day</Badge>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">{quizOfTheDay.title}</h3>
              <p className="text-sm text-slate-600 mb-4">Test your knowledge with today's quick quiz</p>
              <Link to={createPageUrl('CourseWorkDetail') + `?topicId=${quizOfTheDay.topicId}`}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Start Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Next Lesson */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#071739] to-[#0a2142] text-white">
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
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Link to={createPageUrl('LearnerScheduledLessons')}>
                      <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                        View Lesson
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
                  <p className="text-white/80 mb-4">You don't have a lesson booked</p>
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

        {/* 4. Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm border-l-4 border-l-[#F7B602]">
            <CardHeader>
              <CardTitle className="text-lg">Overall Driving Progress</CardTitle>
              <p className="text-sm text-slate-500">{drivingProgress.length} of 24 skills tracked</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
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
                    {nextFocusTopic?.label || 'All skills completed! 🎉'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Hours Completed</p>
                  <p className="text-sm font-medium text-slate-700">
                    {pupil.hoursCompleted || 0} / {pupil.targetHours || 45}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('LearnerProgress')}>
                <Button variant="outline" className="w-full gap-2">
                  <TrendingUp className="w-4 h-4" />
                  View Progress
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* 5. Homework & Study Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  Homework & Study Tasks
                </CardTitle>
              </div>
              {homework.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700">{homework.length} pending</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {homework.length > 0 ? (
                <>
                  {homework.slice(0, 3).map(item => (
                    <Link key={item.id} to={createPageUrl('LearnerHomework')}>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
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
                    </Link>
                  ))}
                  <Link to={createPageUrl('LearnerHomework')}>
                    <Button variant="outline" className="w-full gap-2 mt-2">
                      View All Homework <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">No homework assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-500" />
                Recent Notifications
              </CardTitle>
              {unreadNotifications > 0 && (
                <Badge className="bg-purple-100 text-purple-700">{unreadNotifications} unread</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length > 0 ? (
                <>
                  {notifications.slice(0, 3).map(notification => (
                    <div 
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        notification.readAt ? 'bg-slate-50' : 'bg-purple-50 border border-purple-100'
                      }`}
                    >
                      <Bell className={`w-5 h-5 mt-0.5 ${notification.readAt ? 'text-slate-400' : 'text-purple-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{notification.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{moment(notification.created_date).fromNow()}</p>
                      </div>
                    </div>
                  ))}
                  <Link to={createPageUrl('LearnerNotifications')}>
                    <Button variant="outline" className="w-full gap-2 mt-2">
                      View All Notifications <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">No notifications yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 7. Instructor Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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