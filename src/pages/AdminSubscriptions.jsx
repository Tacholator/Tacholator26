import React, { useEffect, useRef } from 'react';
import { Star, CheckCircle, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const learnerPlans = [
  {
    name: 'Basic',
    price: '£0',
    period: '/month',
    description: 'Get started for free',
    badge: null,
    features: [
      'Lesson booking',
      'Basic progress tracking',
      'Messaging with instructor',
      'Lesson history',
    ],
    cta: 'Current Plan',
    disabled: true,
    variant: 'outline'
  },
  {
    name: 'Learner Pro',
    price: '£5',
    period: '/month',
    description: 'Accelerate your learning journey',
    badge: 'Most Popular',
    features: [
      'Everything in Basic',
      'Full course work access',
      'Theory test preparation',
      'Practice MCQ quizzes',
      'Study materials & resources',
      'Mock test tracking',
      'Priority booking',
    ],
    cta: 'Upgrade to Pro',
    disabled: false,
    variant: 'default'
  },
  {
    name: 'Intensive',
    price: '£12',
    period: '/month',
    description: 'For learners on a fast track to passing',
    badge: null,
    features: [
      'Everything in Learner Pro',
      'Unlimited mock tests',
      'GPS route walkthroughs',
      'AI-powered lesson summaries',
      'Personalised study plan',
      'Badge & achievement tracking',
    ],
    cta: 'Get Intensive',
    disabled: false,
    variant: 'outline'
  }
];

const instructorPlans = [
  {
    name: 'Basic',
    monthlyPrice: '£0',
    yearlyPrice: '£0',
    description: 'Get started with essential features',
    badge: null,
    features: [
      'Up to 5 pupils',
      'Basic calendar',
      'Lesson scheduling',
      'Basic messaging',
    ],
    cta: 'Current Plan',
    disabled: true,
    variant: 'outline'
  },
  {
    name: 'Standard',
    monthlyPrice: '£9.99',
    yearlyPrice: '£83.92',
    description: 'Grow your business with advanced tools',
    badge: null,
    features: [
      'Up to 20 pupils',
      'Advanced calendar & availability',
      'Automated booking approvals',
      'Payment management',
      'Basic homework tools',
      'Progress tracking',
    ],
    cta: 'Upgrade to Standard',
    disabled: false,
    variant: 'outline'
  },
  {
    name: 'Pro',
    monthlyPrice: '£14.99',
    yearlyPrice: '£125.92',
    description: 'Everything you need to scale your business',
    badge: 'Most Popular',
    features: [
      'Unlimited pupils',
      'Advanced calendar & availability',
      'Automated booking approvals',
      'Payment management & invoicing',
      'Course work & homework tools',
      'Whiteboard editor',
      'Progress tracking',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    disabled: false,
    variant: 'default'
  },
];

export default function AdminSubscriptions() {
  const [billingPeriod, setBillingPeriod] = React.useState('monthly');
  const learnerRef = useRef(null);
  const instructorRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section === 'learner' && learnerRef.current) {
      learnerRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'instructor' && instructorRef.current) {
      instructorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#071739]">Subscription Management</h1>
          <p className="text-slate-600 mt-2">View and manage learner and instructor subscription plans</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <ToggleGroup type="single" value={billingPeriod} onValueChange={setBillingPeriod} className="bg-slate-100 p-1 rounded-lg">
            <ToggleGroupItem value="monthly" className="rounded px-4">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="yearly" className="rounded px-4">Yearly (Save 30%)</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Learners Section */}
        <div className="mb-12" ref={learnerRef}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#071739]">Learner Plans</h2>
            <p className="text-slate-600 mt-1">Subscription options available to learners</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learnerPlans.map((plan) => (
              <Card
                key={`learner-${plan.name}`}
                className={`relative flex flex-col ${plan.badge ? 'border-[#F7B602] border-2 shadow-lg' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#F7B602] text-[#071739] font-semibold px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-[#071739]">{plan.name}</CardTitle>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-4xl font-bold text-[#071739]">{plan.price}</span>
                    <span className="text-slate-500 mb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.variant}
                    disabled={plan.disabled}
                    className={`w-full mt-4 ${plan.badge ? 'bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]' : ''}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instructors Section */}
        <div ref={instructorRef}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#071739]">Instructor Plans</h2>
            <p className="text-slate-600 mt-1">Subscription options available to instructors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {instructorPlans.map((plan) => (
              <Card
                key={`instructor-${plan.name}`}
                className={`relative flex flex-col ${plan.badge ? 'border-[#F7B602] border-2 shadow-lg' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#F7B602] text-[#071739] font-semibold px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-[#071739]">{plan.name}</CardTitle>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-4xl font-bold text-[#071739]">{plan.price}</span>
                    <span className="text-slate-500 mb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.variant}
                    disabled={plan.disabled}
                    className={`w-full mt-4 ${plan.badge ? 'bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]' : ''}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}