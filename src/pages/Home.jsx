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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  // Render the appropriate dashboard based on role
  const isInstructor = user.role === 'admin';
  
  if (isInstructor) {
    return <InstructorDashboard />;
  } else {
    return <LearnerDashboard />;
  }
}