import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, User, Calendar, CreditCard, Rocket } from 'lucide-react';

const steps = [
  {
    key: 'onboardingProfileCompleted',
    label: 'Personal & Business Info',
    description: 'Add your name, phone, and business details',
    page: 'ProfileSettings',
    icon: User,
  },
  {
    key: 'onboardingCalendarCompleted',
    label: 'Set Up Your Calendar',
    description: 'Configure your working hours and availability',
    page: 'InstructorBookingCalendar',
    icon: Calendar,
  },
  {
    key: 'onboardingStripeCompleted',
    label: 'Connect Stripe Payout',
    description: 'Link your Stripe account to receive payments',
    page: 'InstructorStripeConnect',
    icon: CreditCard,
  },
];

export default function OnboardingProgressCard({ instructor }) {
  if (!instructor) return null;

  // For profile step: also check actual field values as fallback for existing instructors
  // whose onboardingProfileCompleted flag was never set despite having filled profiles
  const isProfileComplete = instructor.onboardingProfileCompleted || !!(instructor.name && instructor.phone);

  const stepCompletion = {
    onboardingProfileCompleted: isProfileComplete,
    onboardingCalendarCompleted: !!instructor.onboardingCalendarCompleted,
    onboardingStripeCompleted: !!instructor.onboardingStripeCompleted,
  };

  const completedCount = steps.filter(s => stepCompletion[s.key]).length;
  const totalCount = steps.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // Hide when fully complete
  if (percentage === 100) return null;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-[#071739] to-[#0e2a5a] overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7B602]/20 flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-[#F7B602]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Complete Your Setup</h3>
              <p className="text-sm text-slate-300">{completedCount} of {totalCount} steps done</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-bold text-[#F7B602]">{percentage}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-5">
          <div
            className="bg-[#F7B602] h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const done = !!stepCompletion[step.key];
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className="shrink-0">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-slate-400 truncate">{step.description}</p>
                  )}
                </div>
                {!done && (
                  <Link to={createPageUrl(step.page)} className="shrink-0">
                    <Button
                      size="sm"
                      className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] text-xs font-semibold"
                    >
                      Go
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}