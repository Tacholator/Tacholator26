import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import UserManagement from '@/components/admin/UserManagement';
import {
  Users, Calendar, Clock, BookOpen, AlertTriangle, ChevronRight, Plus,
  UserPlus, ClipboardList, MessageCircle, Bell, Search, X, MapPin,
  CreditCard, Flag, Loader2
} from 'lucide-react';
import moment from 'moment';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [diaryModalOpen, setDiaryModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [dismissedActions, setDismissedActions] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [], isLoading: pupilsLoading } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list('-date')
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Message.filter({ instructorId: user.id }, '-created_date', 50);
    },
    enabled: !!user?.id
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter({ userId: user.id }, '-created_date', 20),
    enabled: !!user?.id
  });

  const { data: drivingProgress = [] } = useQuery({
    queryKey: ['allDrivingProgress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.DrivingSkillProgress.filter({ instructorId: user.id });
    },
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

  const activePupils = pupils.filter(p => p.status === 'Active').length;
  const totalHoursToday = todayLessons.reduce((sum, l) => sum + (l.durationMinutes / 60), 0);

  const upcomingTests = pupils.filter(p =>
    p.practicalTestDate &&
    moment(p.practicalTestDate).isAfter(today) &&
    moment(p.practicalTestDate).diff(moment(), 'days') <= 30
  ).sort((a, b) => moment(a.practicalTestDate).diff(moment(b.practicalTestDate)));

  // Action Center Items
  const actionCenterItems = useMemo(() => {
    const actions = [];

    const unreadThreads = {};
    messages.filter(m => !m.readAt && m.senderRole === 'pupil').forEach(msg => {
      const key = msg.pupilId;
      if (!unreadThreads[key]) {
        const pupil = pupils.find(p => p.id === msg.pupilId);
        unreadThreads[key] = { pupilId: msg.pupilId, pupilName: pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Pupil' };
      }
    });

    if (Object.keys(unreadThreads).length > 0) {
      actions.push({
        id: 'unread_messages',
        priority: 'high',
        category: 'messages',
        title: 'Unread messages',
        description: `${Object.keys(unreadThreads).length} conversation(s) waiting`,
        ctaLabel: 'Open Chats',
        ctaRoute: createPageUrl('InstructorChats')
      });
    }

    const completedLessons = lessons.filter(l =>
      l.status === 'Completed' &&
      moment(l.date).isAfter(moment().subtract(3, 'days'))
    );

    completedLessons.forEach(lesson => {
      const pupil = pupils.find(p => p.id === lesson.pupilId);
      if (pupil) {
        const pupilProgress = drivingProgress.filter(dp => dp.pupilId === pupil.id);
        const lastProgressUpdate = pupilProgress.length > 0
          ? Math.max(...pupilProgress.map(p => moment(p.lastUpdated).valueOf()))
          : 0;
        const lessonDate = moment(lesson.date).valueOf();

        if (lastProgressUpdate < lessonDate) {
          actions.push({
            id: `progress_${pupil.id}`,
            priority: 'medium',
            category: 'progress_update',
            title: `Update progress for ${pupil.firstName} ${pupil.lastName}`,
            description: 'Recent lesson completed — update progress levels',
            ctaLabel: 'Update Progress',
            ctaRoute: createPageUrl('PupilProfile') + `?id=${pupil.id}`
          });
        }
      }
    });

    pupils.filter(p => p.status === 'Active').forEach(pupil => {
      const hoursRemaining = (pupil.targetHours || 45) - (pupil.hoursCompleted || 0);
      if (hoursRemaining <= 3 || (pupil.bulkPaymentBalance || 0) < 100) {
        actions.push({
          id: `payment_${pupil.id}`,
          priority: 'high',
          category: 'payments',
          title: `Follow-up: ${pupil.firstName} ${pupil.lastName}`,
          description: hoursRemaining <= 3 ? 'Low hours remaining' : 'Low balance',
          ctaLabel: 'View Pupil',
          ctaRoute: createPageUrl('PupilProfile') + `?id=${pupil.id}`
        });
      }

      const upcomingLessons = lessons.filter(l =>
        l.pupilId === pupil.id &&
        l.status === 'Scheduled' &&
        moment(l.date).isAfter(now) &&
        moment(l.date).diff(now, 'days') <= 14
      );

      if (upcomingLessons.length === 0) {
        actions.push({
          id: `booking_${pupil.id}`,
          priority: 'medium',
          category: 'booking',
          title: `Schedule lesson for ${pupil.firstName} ${pupil.lastName}`,
          description: 'No lesson in next 14 days',
          ctaLabel: 'Schedule',
          ctaRoute: createPageUrl('Calendar')
        });
      }
    });

    return actions
      .filter(a => !dismissedActions.includes(a.id))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 8);
  }, [messages, pupils, lessons, drivingProgress, dismissedActions, now]);

  // Filtered Pupils
  const filteredPupils = useMemo(() => {
    return pupils
      .filter(p => p.status === statusFilter)
      .filter(p => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          (p.firstName + ' ' + p.lastName).toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const aHasUnread = messages.some(m => m.pupilId === a.id && !m.readAt && m.senderRole === 'pupil');
        const bHasUnread = messages.some(m => m.pupilId === b.id && !m.readAt && m.senderRole === 'pupil');
        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;
        if (a.practicalTestDate && b.practicalTestDate) {
          return moment(a.practicalTestDate).diff(moment(b.practicalTestDate));
        }
        if (a.practicalTestDate) return -1;
        if (b.practicalTestDate) return 1;
        return (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName);
      });
  }, [pupils, statusFilter, searchQuery, messages]);

  // Message Threads
  const messageThreads = useMemo(() => {
    const threads = {};
    messages.forEach(msg => {
      const key = msg.pupilId;
      if (!threads[key]) {
        const pupil = pupils.find(p => p.id === msg.pupilId);
        threads[key] = {
          pupilId: msg.pupilId,
          pupilName: pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Unknown',
          unreadCount: 0,
          latestMessage: null,
          latestMessageAt: null
        };
      }
      if (!msg.readAt && msg.senderRole === 'pupil') {
        threads[key].unreadCount++;
      }
      if (!threads[key].latestMessageAt || moment(msg.created_date).isAfter(moment(threads[key].latestMessageAt))) {
        threads[key].latestMessage = msg.messageText;
        threads[key].latestMessageAt = msg.created_date;
      }
    });
    return Object.values(threads)
      .sort((a, b) => b.unreadCount - a.unreadCount || moment(b.latestMessageAt).diff(moment(a.latestMessageAt)))
      .slice(0, 5);
  }, [messages, pupils]);

  const recentNotifications = notifications.slice(0, 5);

  const getPupilProgress = (pupilId) => {
    const pupilSkills = drivingProgress.filter(dp => dp.pupilId === pupilId);
    if (pupilSkills.length === 0) return 0;
    const progressValues = { full_talk_through: 33, prompted: 66, independent: 100 };
    const totalProgress = pupilSkills.reduce((sum, skill) => {
      return sum + (progressValues[skill.progressState] || 0);
    }, 0);
    return Math.round(totalProgress / pupilSkills.length);
  };

  const getPupilHasUnreadMessages = (pupilId) => {
    return messages.some(m => m.pupilId === pupilId && !m.readAt && m.senderRole === 'pupil');
  };

  const handleDismissAction = (actionId) => {
    setDismissedActions(prev => [...prev, actionId]);
  };

  const handleSaveDiaryAndComplete = async (diaryData) => {
    if (!selectedLesson) return;

    await base44.entities.DiaryEntry.create({
      ...diaryData,
      pupilId: selectedLesson.pupilId,
      lessonId: selectedLesson.id,
      instructorId: selectedLesson.instructorId
    });

    const startMoment = moment(selectedLesson.startTime, 'HH:mm');
    const endMoment = moment(selectedLesson.endTime, 'HH:mm');
    const durationHours = endMoment.diff(startMoment, 'minutes') / 60;

    await base44.entities.Lesson.update(selectedLesson.id, { status: 'Completed' });

    const pupil = pupils.find(p => p.id === selectedLesson.pupilId);
    if (pupil) {
      const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
      await base44.entities.Pupil.update(pupil.id, { hoursCompleted: newHoursCompleted });
    }

    queryClient.invalidateQueries(['lessons']);
    queryClient.invalidateQueries(['pupils']);
    setDiaryModalOpen(false);
    setSelectedLesson(null);
  };

  if (pupilsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today</p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <Card className="mb-6 border-l-4 border-l-[#F7B602]">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Link to={createPageUrl('PupilList')}>
                <Button size="sm" className="gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                  <UserPlus className="w-4 h-4" />
                  Add Pupil
                </Button>
              </Link>
              <Link to={createPageUrl('Calendar')}>
                <Button size="sm" variant="secondary" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Lesson
                </Button>
              </Link>
              <Link to={createPageUrl('HomeworkLibrary')}>
                <Button size="sm" variant="secondary" className="gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Assign Homework
                </Button>
              </Link>
              <Link to={createPageUrl('Calendar')}>
                <Button size="sm" variant="ghost" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Start Lesson Diary
                </Button>
              </Link>
              <Link to={createPageUrl('InstructorChats')}>
                <Button size="sm" variant="ghost" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Open Chats
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F7B602]" />
              Today's Schedule
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Your next lesson and today's timeline (24-hour format)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextLesson ? (
              <div className="bg-gradient-to-br from-[#071739] to-[#0a2142] text-white rounded-lg p-4">
                <p className="text-sm text-white/70 mb-2">Next Lesson</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-semibold">{nextLesson.startTime} – {nextLesson.endTime}</p>
                      <p className="text-white/80">
                        {pupils.find(p => p.id === nextLesson.pupilId)?.firstName} {pupils.find(p => p.id === nextLesson.pupilId)?.lastName}
                      </p>
                    </div>
                    <Badge className="bg-[#F7B602] text-[#071739]">{nextLesson.durationMinutes / 60}h</Badge>
                  </div>
                  {nextLesson.location && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <MapPin className="w-4 h-4" />
                      {nextLesson.location}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedLesson(nextLesson);
                        setDiaryModalOpen(true);
                      }}
                      className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Start Diary
                    </Button>
                    <Link to={createPageUrl('InstructorChats')}>
                      <Button size="sm" variant="secondary">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No upcoming lessons today</p>
              </div>
            )}

            {todayLessons.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Today's Timeline</p>
                <div className="space-y-2">
                  {todayLessons.map(lesson => {
                    const pupil = pupils.find(p => p.id === lesson.pupilId);
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <p className="text-sm font-mono font-medium text-slate-700">{lesson.startTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">
                            {pupil?.firstName} {pupil?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {lesson.location || 'Pickup TBC'} • {lesson.durationMinutes / 60}h
                          </p>
                        </div>
                        <Badge>{lesson.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Center */}
        {actionCenterItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Action Center
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">What needs your attention right now</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionCenterItems.map(action => (
                <div key={action.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <Badge variant={action.priority === 'high' ? 'destructive' : 'default'}>
                        {action.priority}
                      </Badge>
                      <p className="text-sm font-medium text-slate-700">{action.title}</p>
                    </div>
                    {action.description && <p className="text-xs text-slate-500">{action.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => navigate(action.ctaRoute)} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                      {action.ctaLabel}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDismissAction(action.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> Keep Driving Progress updated after lessons so pupils' dashboards stay aligned.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-l-4 border-l-[#F7B602]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Pupils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{activePupils}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{totalHoursToday.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today's Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{todayLessons.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pupils Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F7B602]" />
              Pupils Overview
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Search and filter your pupil list</p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['Active', 'OnHold', 'Passed', 'Stopped'].map(status => (
                  <Button
                    key={status}
                    size="sm"
                    variant={statusFilter === status ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'OnHold' ? 'On Hold' : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPupils.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No pupils found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPupils.slice(0, 10).map(pupil => {
                  const progress = getPupilProgress(pupil.id);
                  const hasUnread = getPupilHasUnreadMessages(pupil.id);
                  const hoursRemaining = (pupil.targetHours || 45) - (pupil.hoursCompleted || 0);
                  const testSoon = pupil.practicalTestDate &&
                    moment(pupil.practicalTestDate).diff(moment(), 'days') <= 14 &&
                    moment(pupil.practicalTestDate).diff(moment(), 'days') >= 0;

                  return (
                    <div
                      key={pupil.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => navigate(createPageUrl('PupilProfile') + `?id=${pupil.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-slate-700">{pupil.firstName} {pupil.lastName}</p>
                          <div className="flex gap-1 flex-wrap">
                            {hasUnread && (
                              <Badge variant="default" className="text-xs">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Unread
                              </Badge>
                            )}
                            {hoursRemaining <= 3 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low hours
                              </Badge>
                            )}
                            {(pupil.bulkPaymentBalance || 0) < 100 && (
                              <Badge variant="destructive" className="text-xs">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Payment
                              </Badge>
                            )}
                            {testSoon && (
                              <Badge variant="secondary" className="text-xs">
                                <Flag className="w-3 h-3 mr-1" />
                                Test soon
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500">
                          {pupil.hoursCompleted || 0}h done • {hoursRemaining}h left
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-[#F7B602]">{progress}%</p>
                        <p className="text-xs text-slate-500">Progress</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {filteredPupils.length > 10 && (
              <Link to={createPageUrl('PupilList')} className="block mt-4">
                <Button variant="outline" className="w-full gap-2">
                  View All Pupils <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Communications Hub */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Communications Hub
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Unread messages and recent notifications</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Messages</h3>
                {messageThreads.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-lg">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No messages</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messageThreads.map(thread => (
                      <div
                        key={thread.pupilId}
                        className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => navigate(createPageUrl('InstructorChats'))}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-slate-700 text-sm">{thread.pupilName}</p>
                          {thread.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">{thread.unreadCount} new</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{thread.latestMessage || '—'}</p>
                        <p className="text-xs text-slate-400 mt-1">{moment(thread.latestMessageAt).fromNow()}</p>
                      </div>
                    ))}
                    <Link to={createPageUrl('InstructorChats')}>
                      <Button variant="outline" size="sm" className="w-full mt-2">Open All Chats</Button>
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Notifications</h3>
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-lg">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => navigate(createPageUrl('InstructorNotifications'))}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-slate-700 text-sm">{notif.title}</p>
                          {!notif.readAt && <Badge variant="default" className="text-xs">New</Badge>}
                        </div>
                        {notif.message && <p className="text-xs text-slate-500 line-clamp-1">{notif.message}</p>}
                        <p className="text-xs text-slate-400 mt-1">{moment(notif.created_date).fromNow()}</p>
                      </div>
                    ))}
                    <Link to={createPageUrl('InstructorNotifications')}>
                      <Button variant="outline" size="sm" className="w-full mt-2">View Notifications</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {upcomingTests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upcoming Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTests.map(pupil => (
                  <Link
                    key={pupil.id}
                    to={createPageUrl('PupilProfile') + `?id=${pupil.id}`}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors block"
                  >
                    <div>
                      <p className="font-medium text-slate-700">{pupil.firstName} {pupil.lastName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{moment(pupil.practicalTestDate).format('D MMM YYYY')}</Badge>
                        <span className="text-sm text-slate-500">{moment(pupil.practicalTestDate).fromNow()}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user?.email === 'fasobah@gmail.com' && (
          <div className="mt-6">
            <UserManagement />
          </div>
        )}
      </div>

      <DiaryEntryModal
        open={diaryModalOpen}
        onClose={() => {
          setDiaryModalOpen(false);
          setSelectedLesson(null);
        }}
        pupilId={selectedLesson?.pupilId}
        lessonId={selectedLesson?.id}
        lesson={selectedLesson}
        pupil={selectedLesson ? pupils.find(p => p.id === selectedLesson.pupilId) : null}
        onSave={handleSaveDiaryAndComplete}
      />
    </div>
  );
}