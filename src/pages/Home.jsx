import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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

  // Check if user is a learner by looking for a pupil record
  const { data: pupilRecord, isLoading: isPupilLoading } = useQuery({
    queryKey: ['userPupilRecord', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return null;
      const allPupils = await base44.entities.Pupil.list();
      let matchingPupil = allPupils.find(p => p.linkedUserId === user.id);
      if (!matchingPupil) {
        matchingPupil = allPupils.find(
          p => p.email && p.email.toLowerCase() === user.email.toLowerCase()
        );
      }
      return matchingPupil || null;
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

  // Priority: If user has a pupil record, they're a learner regardless of role
  const isLearner = !!pupilRecord;
  const isInstructor = !isLearner && user.role === 'admin';

  // New users who haven't selected a role yet (no pupil record, not admin)
  // Skip role selection for the main admin account
  const needsRoleSelection = !isLearner && !isInstructor && !user.userType && user.email !== 'fasobah@gmail.com';

  if (needsRoleSelection) {
    return <RoleSelection />;
  }

  if (isInstructor || user.userType === 'instructor') {
    return <InstructorDashboard />;
  } else {
    return <LearnerDashboard />;
  }
}