import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LearnerDashboard from './LearnerDashboard';
import InstructorDashboard from './InstructorDashboard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  // Check if user is a learner by looking for a pupil record matching their email
  const { data: pupilRecords, isLoading: isPupilLoading } = useQuery({
    queryKey: ['userPupilRecord', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const pupils = await base44.entities.Pupil.filter({ email: user.email });
      return pupils.length > 0 ? pupils : null;
    },
    enabled: !!user?.email
  });

  if (isLoading || !user || isPupilLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  // Determine if user is an instructor or learner
  // Priority: If user has a pupil record, they're a learner regardless of role
  const isLearner = pupilRecords && pupilRecords.length > 0;
  const isInstructor = !isLearner && user.role === 'admin';
  
  if (isInstructor) {
    return <InstructorDashboard />;
  } else {
    return <LearnerDashboard />;
  }
}