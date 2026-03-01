import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const REFERRAL_POPUP_KEY = 'referralPopupDismissed';

export default function ReferralPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(REFERRAL_POPUP_KEY);
    if (!isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(REFERRAL_POPUP_KEY, 'true');
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F7B602]" />
            <DialogTitle>Earn a Free Lesson!</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Refer a new pupil and get a free 1.5-hour lesson when they commit to 10+ hours of training.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-slate-600 mb-4">
            Share this opportunity with your friends and earn rewards for every successful referral!
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
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

        <Button 
          onClick={handleDismiss}
          className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold"
        >
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
}