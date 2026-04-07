import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LearnerDashboard from './LearnerDashboard';
import InstructorDashboard from './InstructorDashboard';
import RoleSelection from './RoleSelection';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupilRecord, isLoading: isPupilLoading } = useQuery({
    queryKey: ['userPupilRecord', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id && !!user?.email
  });

  if (isLoading || !user || isPupilLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  const isLearner = !!pupilRecord;
  const isInstructor = !isLearner && user.role === 'admin';
  const needsRoleSelection = !isLearner && !isInstructor && !user.userType && user.email !== 'fasobah@gmail.com';

  if (needsRoleSelection) {
    return <RoleSelection />;
  }

  if (isInstructor) {
    return <InstructorDashboard />;
  }

  return <LearnerDashboard />;
}