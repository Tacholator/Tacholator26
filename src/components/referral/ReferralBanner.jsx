import React from 'react';
import { Gift } from 'lucide-react';

export default function ReferralBanner() {
  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-lg p-4 shadow-md overflow-hidden relative inline-flex items-center gap-3">
      {/* Background accent */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Refer a Friend & Earn Free Lessons!</p>
          <p className="text-xs text-white/90">
            Bring a new pupil who commits to 10+ hours → Get a FREE 1.5-hour lesson!
          </p>
        </div>
      </div>
    </div>
  );
}