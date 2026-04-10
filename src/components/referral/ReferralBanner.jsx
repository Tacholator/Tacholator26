import React from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ReferralBanner({ pupilProfile }) {
  const { data: instructorProfile, isLoading } = useQuery({
    queryKey: ['instructorProfileReferral', pupilProfile?.instructorId],
    queryFn: async () => {
      if (!pupilProfile?.instructorId) return null;
      const results = await base44.entities.Instructor.filter({ id: pupilProfile.instructorId });
      return results[0] || null;
    },
    enabled: !!pupilProfile?.instructorId,
  });

  if (isLoading || instructorProfile?.referralProgramEnabled === false) {
    return null;
  }
  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-lg p-4 shadow-md overflow-hidden relative flex items-center gap-3 w-full">
      {/* Background accent */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">Refer a Friend & Earn Free Lessons!</p>
          <p className="text-xs text-white/90">
              Bring a new pupil who commits to 10+ hours \u2192 Get a FREE 1.5-hour lesson!
          </p>
          <button
            onClick={() => window.location.href = createPageUrl('ReferAFriend')}
            className="mt-1.5 text-xs text-white font-semibold underline underline-offset-2 flex items-center gap-1 hover:text-white/80 transition-colors"
          >
            Learn more <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}