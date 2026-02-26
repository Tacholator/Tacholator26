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

  // Check if user is a learner by looking for a pupil record
  const { data: pupilRecord, isLoading: isPupilLoading } = useQuery({
    queryKey: ['userPupilRecord', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return null;
      const allPupils = await base44.entities.Pupil.list();
      
      // First try to match by linkedUserId (most reliable)
      let matchingPupil = allPupils.find(p => p.linkedUserId === user.id);
      
      // Fallback to case-insensitive email match if no linkedUserId match
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

  // Determine if user is an instructor or learner
  // Priority: If user has a pupil record, they're a learner regardless of role
  const isLearner = !!pupilRecord;
  const isInstructor = !isLearner && user.role === 'admin';
  
  // Debug logging
  console.log('🔍 Home Dashboard Debug:', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    hasPupilRecord: !!pupilRecord,
    pupilRecordId: pupilRecord?.id,
    pupilRecordEmail: pupilRecord?.email,
    pupilLinkedUserId: pupilRecord?.linkedUserId,
    isLearner,
    isInstructor,
    renderingDashboard: isInstructor ? 'InstructorDashboard' : 'LearnerDashboard'
  });
  
  if (isInstructor) {
    return <InstructorDashboard />;
  } else {
    return <LearnerDashboard />;
  }
}