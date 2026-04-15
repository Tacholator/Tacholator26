import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function LearnerOnboardingPopup({ open, onDismiss, pupilId }) {
  const handleDismiss = async () => {
    // We don't persist a dismiss flag for learners — the popup just won't show again
    // once the profile is complete. We just close it.
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#071739]">
            Welcome to Tacholator! 👋
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-slate-600 text-sm">
            Let's get your profile set up so your instructor has everything they need. It only takes a minute!
          </p>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="w-10 h-10 rounded-full bg-[#F7B602] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#071739]" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Complete Your Profile</p>
              <p className="text-xs text-slate-600 mt-1">
                Add your first name, last name and phone number so your instructor can contact you easily.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link to={createPageUrl('ProfileSettings')} onClick={handleDismiss}>
            <Button className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold gap-2">
              Go to Profile Settings
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleDismiss} className="w-full text-slate-500">
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}