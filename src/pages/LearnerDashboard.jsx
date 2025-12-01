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
  User
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
        lastLoginTimestamp: now
      };
      
      // If pupil exists but isn't linked yet, link it and set first login
      if (!pupil.linkedUserId && pupil.email?.toLowerCase() === user.email?.toLowerCase()) {
        updates.linkedUserId = user.id;
        updates.signupStatus = 'active';
        updates.firstLoginTimestamp = now;
      } else if (pupil.signupStatus === 'signed_up') {
        // If signed up but not active yet, mark as active
        updates.signupStatus = 'active';
      } else if (!pupil.signupStatus || pupil.signupStatus === 'not_signed_up') {
        // First time login
        updates.signupStatus = 'active';
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

  const today = moment().format('YYYY-MM-DD');
  const nextLesson = lessons
    .filter(l => l.date >= today && l.status === 'Scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const latestDiary = diaryEntries[0];

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
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
                <Link to={createPageUrl('LearnerProgress')} className="w-full mt-4">
                  <Button variant="outline" className="w-full gap-2">
                    View Skills <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
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
            <Card className="border-0 shadow-sm h-full bg-gradient-to-br from-teal-500 to-teal-600 text-white">
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

        {/* Instructor Info */}
        {pupil.instructorName && (
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
                    {pupil.instructorName?.[0] || 'I'}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Your Instructor</p>
                    <p className="text-xl font-semibold text-slate-800">{pupil.instructorName}</p>
                    {pupil.instructorEmail && (
                      <p className="text-sm text-slate-500">{pupil.instructorEmail}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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