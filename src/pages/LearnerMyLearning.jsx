import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PupilClassNotes from '@/components/classnotes/PupilClassNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Award, TrendingUp, Clock, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LearnerMyLearning() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id
  });

  // Fetch instructor for subscription check
  const { data: instructor } = useQuery({
    queryKey: ['instructor', pupilProfile?.instructorId],
    queryFn: async () => {
      if (!pupilProfile?.instructorId) return null;
      const users = await base44.entities.User.filter({ id: pupilProfile.instructorId });
      return users.length > 0 ? users[0] : null;
    },
    enabled: !!pupilProfile?.instructorId
  });

  // Fetch instructor subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['instructorSubscription', instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return null;
      const subs = await base44.entities.UserSubscription.filter({ userId: instructor.id });
      return subs[0] || null;
    },
    enabled: !!instructor?.id
  });

  // Fetch instructor profile
  const { data: instructorProfile, isLoading: instructorProfileLoading } = useQuery({
    queryKey: ['instructorProfileForAccess', instructor?.email],
    queryFn: async () => {
      if (!instructor?.email) return null;
      const results = await base44.entities.Instructor.filter({ created_by: instructor.email });
      return results[0] || null;
    },
    enabled: !!instructor?.email
  });

  // Check if instructor has valid access
  const instructorHasValidAccess = !!(instructorProfile?.platformAccessOverride || (subscription?.status && ['trialing', 'active'].includes(subscription.status)));

  // Show loading while fetching instructor access data
  if (pupilProfile && (subscriptionLoading || instructorProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show restriction message if instructor doesn't have active plan and profile is loaded
  if (pupilProfile && !instructorHasValidAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
              <p className="text-white/70 text-sm">My Learning tab is unavailable</p>
            </div>
            <CardContent className="p-8 text-center bg-white">
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                Your instructor's subscription is not active or has not been granted full platform access.
              </p>
              <p className="text-slate-600 text-sm mb-6">
                This area requires an active instructor subscription. Please contact your instructor to activate their account.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-red-800 mb-2">Next Steps</p>
                <p className="text-xs text-red-700">Ask your instructor to activate their subscription plan so you can access all learning materials.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739]">My Learning</h1>
          <p className="text-slate-600 mt-2">Track your learning progress and achievements</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Learning Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Your learning statistics and progress will appear here
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-[#F7B602]" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Track your milestones and achievements
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                View your overall learning progress
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-purple-600" />
                Study Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Track your study hours and practice time
              </p>
            </CardContent>
          </Card>

          {/* Class Notes card — visible on all screens, acts as nav shortcut on mobile */}
          <Link to="/LearnerClassNotes" className="block lg:hidden">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  Class Notes
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  View whiteboard notes saved by your instructor
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Class Notes Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#071739] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Class Notes
            </h2>
            <p className="text-slate-500 text-sm mt-1">Whiteboard notes saved by your instructor during lessons</p>
          </div>
          {pupilProfile ? (
            <PupilClassNotes pupilId={pupilProfile.id} />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No class notes yet — your instructor will add them during lessons</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}