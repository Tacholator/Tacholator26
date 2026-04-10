import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const REFERRAL_POPUP_KEY = 'referralPopupDismissed';

export default function ReferralPopup({ pupilProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const { data: instructorProfile, isLoading } = useQuery({
    queryKey: ['instructorProfilePopup', pupilProfile?.instructorId],
    queryFn: async () => {
      if (!pupilProfile?.instructorId) return null;
      const results = await base44.entities.Instructor.filter({ id: pupilProfile.instructorId });
      return results[0] || null;
    },
    enabled: !!pupilProfile?.instructorId,
  });

  useEffect(() => {
    if (isLoading) return;
    if (instructorProfile?.referralProgramEnabled === false) {
      setIsOpen(false);
      return;
    }
    const isDismissed = localStorage.getItem(REFERRAL_POPUP_KEY);
    if (!isDismissed) {
      setIsOpen(true);
    }
  }, [instructorProfile?.referralProgramEnabled, isLoading]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(REFERRAL_POPUP_KEY, 'true');
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DialogContent className="max-w-md overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 -m-6 mb-4 p-6 text-white">
            <div className="flex items-center justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-1">Earn a Free Lesson!</h2>
            <p className="text-sm text-white/90 text-center">
              Refer a friend and unlock exclusive rewards
            </p>
          </div>

          <DialogHeader className="text-left">
            <DialogTitle className="text-lg">How It Works</DialogTitle>
          </DialogHeader>

          {/* Benefits List */}
          <div className="space-y-3 py-2">
            {[
              { step: '1', title: 'Refer a Friend', desc: 'Share the referral opportunity with someone interested in driving lessons' },
              { step: '2', title: 'They Commit', desc: 'They book and commit to 10+ hours of training' },
              { step: '3', title: 'You Earn', desc: 'Get a FREE 1.5-hour lesson as your reward!' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-gradient-to-r from-orange-50 to-rose-50 rounded-lg border border-orange-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-2 my-4 pt-2 border-t">
            <Checkbox 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <label 
              htmlFor="dontShowAgain" 
              className="text-sm text-slate-600 cursor-pointer hover:text-slate-700"
            >
              Don't show this again
            </label>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={() => { handleDismiss(); window.location.href = createPageUrl('ReferAFriend'); }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 h-10 gap-2"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full text-slate-500 hover:text-slate-700 h-9 text-sm"
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}