import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Users, ChevronRight, CreditCard, CheckCircle, Clock, AlertTriangle, XCircle, Minus } from 'lucide-react';
import moment from 'moment';

function SubscriptionBadge({ status }) {
  const config = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    trialing: { label: 'Free Trial', className: 'bg-[#F7B602]/20 text-[#071739]', icon: Clock },
    past_due: { label: 'Past Due', className: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    grace: { label: 'Grace Period', className: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600', icon: XCircle },
    expired: { label: 'Expired', className: 'bg-red-100 text-red-700', icon: XCircle },
    none: { label: 'No Plan', className: 'bg-slate-100 text-slate-500', icon: Minus },
  };

  const c = config[status] || config.none;
  const Icon = c.icon;

  return (
    <Badge className={`${c.className} flex items-center gap-1 text-xs`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </Badge>
  );
}

export default function InstructorCard({ user, instructor, pupilCount, subscription, onClick }) {
  const name = instructor?.name || user.full_name || user.email;
  const subStatus = subscription?.status || 'none';
  const billingPeriod = subscription?.billingPeriod;
  const trialEndAt = subscription?.trialEndAt;
  const currentPeriodEndAt = subscription?.currentPeriodEndAt;

  return (
    <Card
      className="border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#F7B602]/50 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#F7B602]/20 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-[#071739]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#071739] truncate">{name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1 group-hover:text-[#F7B602] transition-colors" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <SubscriptionBadge status={subStatus} />
          {billingPeriod && subStatus !== 'none' && (
            <Badge variant="outline" className="text-xs capitalize">{billingPeriod}</Badge>
          )}
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />
            {pupilCount} pupil{pupilCount !== 1 ? 's' : ''}
          </Badge>
          {instructor?.stripeAccountStatus && instructor.stripeAccountStatus !== 'not_connected' && (
            <Badge className={`text-xs flex items-center gap-1 ${instructor.stripeAccountStatus === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
              <CreditCard className="w-3 h-3" />
              Stripe {instructor.stripeAccountStatus}
            </Badge>
          )}
        </div>

        {subStatus === 'trialing' && trialEndAt && (
          <p className="text-xs text-slate-400 mt-2">Trial ends {moment(trialEndAt).format('D MMM YYYY')}</p>
        )}
        {(subStatus === 'active' || subStatus === 'past_due') && currentPeriodEndAt && (
          <p className="text-xs text-slate-400 mt-2">Renews {moment(currentPeriodEndAt).format('D MMM YYYY')}</p>
        )}
        {subStatus === 'cancelled' && currentPeriodEndAt && (
          <p className="text-xs text-slate-400 mt-2">Access until {moment(currentPeriodEndAt).format('D MMM YYYY')}</p>
        )}
      </CardContent>
    </Card>
  );
}