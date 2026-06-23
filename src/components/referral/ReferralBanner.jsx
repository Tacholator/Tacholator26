import React from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ReferralBanner({ pupilProfile }) {
  const { data: globalSetting } = useQuery({
    queryKey: ['appSetting', 'referral_program_enabled'],
    queryFn: async () => {
      const results = await base44.entities.AppSetting.filter({ key: 'referral_program_enabled' });
      return results[0] || null;
    },
  });

  const { data: instructorProfile, isLoading } = useQuery({
    queryKey: ['instructorProfileReferral', pupilProfile?.instructorEmail],
    queryFn: async () => {
      if (!pupilProfile?.instructorEmail) return null;
      const results = await base44.entities.Instructor.filter({ created_by: pupilProfile.instructorEmail });
      return results[0] || null;
    },
    enabled: !!pupilProfile?.instructorEmail,
  });

  const globalReferralEnabled = globalSetting ? globalSetting.value !== false : true;
  const heading = instructorProfile?.referralPromoHeading?.trim() || 'Refer a Friend & Earn Free Lessons!';
  const promoText = instructorProfile?.referralPromoText?.trim() || 'Bring a new pupil who commits to 10+ hours → Get a FREE 1.5-hour lesson!';

  if (!globalReferralEnabled || isLoading || !instructorProfile || instructorProfile?.referralProgramEnabled === false) {
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
          <p className="font-semibold text-white text-sm">{heading}</p>
          <p className="text-xs text-white/90">{promoText}</p>
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