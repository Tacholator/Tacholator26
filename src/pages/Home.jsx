import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate(createPageUrl('InstructorDashboard'));
      } else {
        navigate(createPageUrl('LearnerDashboard'));
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
    </div>
  );
}