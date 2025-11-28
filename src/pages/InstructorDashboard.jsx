import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatCard from '@/components/ui/StatCard';
import LessonCard from '@/components/lessons/LessonCard';
import UserManagement from '@/components/admin/UserManagement';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import { 
  Users, 
  Clock, 
  Calendar, 
  Trophy,
  ChevronRight,
  Car,
  Loader2,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function InstructorDashboard() {
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const queryClient = useQueryClient();
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [], isLoading: pupilsLoading } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list('-date')
  });

  const activePupils = pupils;
  const today = moment().format('YYYY-MM-DD');
  const todayLessons = lessons.filter(l => l.date === today && l.status === 'Scheduled');
  
  const weekStart = moment().startOf('week');
  const weekEnd = moment().endOf('week');
  const weekLessons = lessons.filter(l => {
    const lessonDate = moment(l.date);
    return lessonDate.isBetween(weekStart, weekEnd, null, '[]') && l.status === 'Completed';
  });
  const hoursThisWeek = weekLessons.reduce((sum, l) => sum + (l.durationMinutes || 60) / 60, 0);

  const upcomingTests = pupils.filter(p => {
    if (!p.practicalTestDate) return false;
    const testDate = moment(p.practicalTestDate);
    return testDate.isAfter(moment()) && testDate.isBefore(moment().add(30, 'days'));
  });

  const pupilMap = pupils.reduce((acc, p) => {
    acc[p.id] = `${p.firstName} ${p.lastName}`;
    return acc;
  }, {});

  const pupilFullMap = pupils.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

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

    const pupil = pupilFullMap[selectedLesson.pupilId];
    if (pupil) {
      const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
      await base44.entities.Pupil.update(pupil.id, { hoursCompleted: newHoursCompleted });
    }

    queryClient.invalidateQueries(['lessons']);
    queryClient.invalidateQueries(['pupils']);
  };

  if (pupilsLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const quickNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'InstructorDashboard', active: true },
    { name: 'Calendar', icon: Calendar, page: 'Calendar' },
    { name: 'Pupils', icon: Users, page: 'PupilList' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Quick Nav Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6"
        >
          {quickNavItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome, {currentUser?.firstName || currentUser?.full_name?.split(' ')[0] || 'Instructor'}!
          </h1>
          <p className="text-slate-500 mt-1">{moment().format('dddd, D MMMM YYYY')}</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Active Pupils"
            value={activePupils.length}
            icon={Users}
            color="teal"
          />
          <StatCard
            title="Hours This Week"
            value={hoursThisWeek.toFixed(1)}
            icon={Clock}
            color="navy"
          />
          <StatCard
            title="Today's Lessons"
            value={todayLessons.length}
            icon={Calendar}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Lessons */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800">Today's Lessons</CardTitle>
                <Link to={createPageUrl('Calendar')}>
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
                    View Calendar <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {todayLessons.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No lessons scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayLessons.map(lesson => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        pupilName={pupilMap[lesson.pupilId]}
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowDiaryModal(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Tests */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">Upcoming Tests</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingTests.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tests in the next 30 days</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingTests.map(pupil => (
                      <Link 
                        key={pupil.id} 
                        to={createPageUrl('PupilProfile') + `?id=${pupil.id}`}
                        className="block"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">
                                {pupil.firstName} {pupil.lastName}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                {moment(pupil.practicalTestDate).format('ddd, D MMM')}
                              </p>
                            </div>
                            <Badge className="bg-rose-100 text-rose-700">
                              {moment(pupil.practicalTestDate).fromNow()}
                            </Badge>
                          </div>
                          {pupil.practicalTestCentre && (
                            <p className="text-xs text-slate-400 mt-2">{pupil.practicalTestCentre}</p>
                          )}
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin User Management - Only for main admin */}
        {currentUser?.email === 'fasobah@gmail.com' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <UserManagement />
          </motion.div>
        )}
      </div>

      <DiaryEntryModal
        open={showDiaryModal}
        onClose={() => {
          setShowDiaryModal(false);
          setSelectedLesson(null);
        }}
        pupilId={selectedLesson?.pupilId}
        lessonId={selectedLesson?.id}
        lesson={selectedLesson}
        pupil={selectedLesson ? pupilFullMap[selectedLesson.pupilId] : null}
        onSave={handleSaveDiaryAndComplete}
      />
    </div>
  );
}