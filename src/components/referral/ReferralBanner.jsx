import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ReferralBanner() {
  return (
    <div className="mb-6 bg-gradient-to-r from-[#F7B602]/10 to-[#071739]/10 border-l-4 border-[#F7B602] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#F7B602] mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-[#071739] mb-1">Refer a friend!</h3>
          <p className="text-sm text-slate-600">
            Bring a new pupil and get a free 1.5-hour lesson when they commit to 10+ hours of training.
          </p>
        </div>
      </div>
    </div>
  );
}