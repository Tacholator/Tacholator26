import React from 'react';
import { Star, CheckCircle, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Basic',
    price: '£0',
    period: '/month',
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
    name: 'Pro',
    price: '£19',
    period: '/month',
    description: 'Everything you need to grow your business',
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

export default function InstructorSubscription() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Star className="w-7 h-7 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#071739]">Subscription Plans</h1>
          <p className="text-slate-500 mt-2">Choose the plan that works best for your teaching business</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
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

        {/* Features callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'Instant Activation', desc: 'Upgrade and get access immediately — no waiting.' },
            { icon: Shield, title: 'Cancel Anytime', desc: 'No long-term contracts. Cancel with one click.' },
            { icon: Star, title: 'Dedicated Support', desc: 'Pro and Enterprise plans include priority support.' }
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center p-4">
              <div className="flex justify-center mb-2">
                <Icon className="w-6 h-6 text-[#F7B602]" />
              </div>
              <h3 className="font-semibold text-[#071739] text-sm">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}