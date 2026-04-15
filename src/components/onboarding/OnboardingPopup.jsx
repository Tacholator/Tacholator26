import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Calendar, CreditCard, ArrowRight, Rocket } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const steps = [
  {
    icon: User,
    label: 'Personal & Business Info',
    description: 'Add your name, phone number, and business details so your pupils know who you are.',
    page: 'ProfileSettings',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Calendar,
    label: 'Set Up Your Calendar',
    description: 'Configure your working hours and availability for bookings.',
    page: 'InstructorBookingCalendar',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: CreditCard,
    label: 'Connect Stripe Payout',
    description: 'Link your Stripe account to receive lesson payments directly.',
    page: 'InstructorStripeConnect',
    color: 'bg-amber-100 text-amber-700',
  },
];

export default function OnboardingPopup({ instructor, open, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    await base44.entities.Instructor.update(instructor.id, { onboardingPopupDismissed: true });
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-[#071739] flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-[#F7B602]" />
            </div>
            <DialogTitle className="text-xl text-[#071739]">Welcome! Let's get you set up</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            Complete these 3 steps to get the most out of Tacholator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.page}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${step.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{index + 1}. {step.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                </div>
                <Link to={createPageUrl(step.page)} onClick={handleDismiss} className="shrink-0">
                  <Button size="sm" variant="outline" className="gap-1 text-xs border-slate-300">
                    Go <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700"
            onClick={handleDismiss}
            disabled={dismissing}
          >
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}