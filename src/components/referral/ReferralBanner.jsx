import React from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReferralBanner() {
  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-xl p-6 shadow-lg overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg mb-1">Refer a Friend & Earn Free Lessons!</h3>
            <p className="text-sm text-white/90">
              Bring a new pupil who commits to 10+ hours → Get a FREE 1.5-hour lesson!
            </p>
          </div>
        </div>
        <Button 
          className="shrink-0 bg-white text-orange-600 hover:bg-white/90 font-semibold"
        >
          Learn More <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}