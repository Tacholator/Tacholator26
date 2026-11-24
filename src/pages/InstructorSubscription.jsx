import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CheckCircle, Zap, Shield, Calendar, CreditCard, Loader2, Star, Clock, AlertTriangle } from 'lucide-react';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£9.99',
    period: '/month',
    annualEquivalent: '£119.88/year',
    priceNote: 'Billed monthly',
    badge: null,
  },
  {
    id: 'yearly',
    name: 'Annual',
    price: '£99.99',
    period: '/year',
    annualEquivalent: 'Save £19.89 vs monthly',
    priceNote: 'Billed annually',
    badge: 'Best Value',
  },
];

const FEATURES = [
  'Unlimited pupils',
  'Advanced calendar & availability',
  'Automated booking & approvals',
  'Payment management & invoicing',
  'Coursework & homework tools',
  'Progress tracking & reports',
  'Messaging with pupils',
  'Priority support',
];

function daysUntil(dateStr) {
  if (!dateStr) return 0;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InstructorSubscription() {
  const navigate = useNavigate();
  const [subscribing, setSubscribing] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirming, setConfirming] = useState(
    new URLSearchParams(window.location.search).get('subscribed') === 'true'
  );

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: subscription, isLoading: isSubLoading, refetch: refetchSub } = useQuery({
    queryKey: ['instructorSubscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ userId: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id,
    refetchInterval: confirming ? 3000 : false,
  });

  useEffect(() => {
    if (confirming && ['trialing', 'active'].includes(subscription?.status)) {
      setConfirming(false);
      setSuccessMessage('Welcome! Your subscription is active. You can explore all features now.');
      window.history.replaceState({}, '', '/InstructorSubscription');
    }
  }, [confirming, subscription?.status]);

  // Don't leave the instructor stuck on the confirming screen if the webhook is delayed
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => {
      setConfirming(false);
      setErrorMessage('We could not confirm your subscription yet. If you completed payment, refresh in a moment, otherwise try again.');
    }, 20000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const handleStartTrial = async (billingPeriod) => {
    setErrorMessage('');
    setSubscribing(billingPeriod);
    try {
      const res = await base44.functions.invoke('createInstructorSubscription', { billingPeriod });
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      setErrorMessage(res.data?.error || 'Checkout could not be started. Please try again.');
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'Checkout could not be started. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const handleUpgrade = async () => {
    setErrorMessage('');
    setUpgrading(true);
    try {
      const res = await base44.functions.invoke('upgradeInstructorSubscription', {});
      if (res.data?.success) {
        await refetchSub();
        setSuccessMessage('You have been upgraded to the Annual plan (£99.99/year).');
      } else {
        setErrorMessage(res.data?.error || 'The upgrade could not be completed.');
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'The upgrade could not be completed.');
    } finally {
      setUpgrading(false);
      setShowUpgradeDialog(false);
    }
  };

  const handleCancel = async () => {
    setErrorMessage('');
    setCancelling(true);
    try {
      const res = await base44.functions.invoke('cancelInstructorSubscription', {});
      if (res.data?.success) {
        await refetchSub();
      } else {
        setErrorMessage(res.data?.error || 'The subscription could not be cancelled.');
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'The subscription could not be cancelled.');
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const handleManagePayment = async () => {
    setErrorMessage('');
    setOpeningPortal(true);
    try {
      const res = await base44.functions.invoke('createStripeCustomerPortalSession', {});
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      setErrorMessage(res.data?.error || 'The billing portal could not be opened.');
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'The billing portal could not be opened.');
    } finally {
      setOpeningPortal(false);
    }
  };

  // If status is still 'trialing' but trial has ended, treat it as active (webhook may have been delayed)
  const trialHasEnded = subscription?.trialEndAt && new Date(subscription.trialEndAt) < new Date();
  const isTrialing = subscription?.status === 'trialing' && !trialHasEnded;
  const isActive = subscription?.status === 'active' || (subscription?.status === 'trialing' && trialHasEnded);
  const isMonthly = subscription?.billingPeriod === 'monthly';
  const canUpgrade = (isActive || isTrialing) && isMonthly;
  const isCancelled = subscription?.status === 'cancelled';
  const isPastDue = subscription?.status === 'past_due';
  const hasValidSub = isTrialing || isActive;
  const trialDaysLeft = daysUntil(subscription?.trialEndAt);
  const nextBillingDate = formatDate(subscription?.currentPeriodEndAt);

  if (isSubLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Back to Payment Management */}
        <Link to={createPageUrl('InstructorPayments')} className="inline-flex items-center gap-2 text-[#071739] hover:text-[#F7B602] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Payment Management</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-[#F7B602]/20 p-3 rounded-full">
              <Star className="w-7 h-7 text-[#F7B602]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#071739]">Instructor Subscription</h1>
          <p className="text-slate-500 mt-2">Access all Tacholator features for your driving school</p>
        </div>

        {/* Success banner */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">You're all set!</p>
              <p className="text-emerald-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800">That didn't work</p>
              <p className="text-rose-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Active subscription status banner */}
        {hasValidSub && (
          <div className="mb-8">
            <Card className={`border-2 ${isTrialing ? 'border-[#F7B602]' : 'border-emerald-400'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isTrialing ? 'bg-[#F7B602]/20' : 'bg-emerald-100'}`}>
                    {isTrialing
                      ? <Clock className="w-7 h-7 text-[#F7B602]" />
                      : <CheckCircle className="w-7 h-7 text-emerald-600" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-[#071739]">
                        {isTrialing ? 'Free Trial Active' : 'Subscription Active'}
                      </h2>
                      {!isTrialing && (
                        <Badge className="bg-emerald-500 text-white">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">
                      {subscription?.billingPeriod === 'yearly' ? 'Annual Plan — £99.99/year' : 'Monthly Plan — £9.99/month'}
                    </p>
                    {isTrialing && (
                      <p className="text-[#F7B602] font-semibold text-sm mt-1">
                        {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining in your trial
                      </p>
                    )}
                    {isActive && (
                      <p className="text-slate-500 text-sm mt-1">
                        Next billing: {nextBillingDate}
                        {subscription?.cancelAtPeriodEnd && (
                          <span className="ml-2 text-amber-600 font-medium">(Cancels on this date)</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {isTrialing && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-amber-50 rounded-lg p-3">
                    <p className="text-amber-800 text-sm">
                      <strong>How it works:</strong> Your card will be charged on{' '}
                      <strong>{formatDate(subscription?.trialEndAt)}</strong> when the trial ends.
                      Cancel before then and you won't be charged at all.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Past due warning */}
        {isPastDue && (
          <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Payment Failed</p>
              <p className="text-amber-700 text-sm">Your last payment didn't go through. Please update your payment method to continue.</p>
            </div>
          </div>
        )}

        {/* Trial banner — only when no active sub */}
        {!hasValidSub && !confirming && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-[#F7B602]/10 border border-[#F7B602]/30 rounded-full px-4 py-2 text-[#071739] font-semibold text-sm mb-4">
              <Zap className="w-4 h-4 text-[#F7B602]" />
              3-Day Free Trial on all plans — no charge until trial ends
            </div>
            {isCancelled && (
              <p className="text-slate-500 text-sm">Your subscription has ended. Choose a plan to reactivate.</p>
            )}
          </div>
        )}

        {/* Confirming checkout */}
        {confirming && !hasValidSub && (
          <Card className="mb-8 border-2 border-[#F7B602]">
            <CardContent className="p-8 flex flex-col items-center text-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
              <h2 className="text-lg font-bold text-[#071739]">Confirming your subscription</h2>
              <p className="text-slate-500 text-sm">
                This usually takes a few seconds. Please don't start a second checkout.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Plan cards */}
        {!confirming && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {PLANS.map((plan) => {
            const isCurrentPlan = hasValidSub && subscription?.billingPeriod === plan.id;
            const isYearlyUpgrade = plan.id === 'yearly' && canUpgrade;
            const isDowngradeBlocked = hasValidSub && plan.id === 'monthly' && subscription?.billingPeriod === 'yearly';

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isCurrentPlan
                    ? 'border-[#F7B602] border-2 shadow-lg'
                    : plan.badge && !hasValidSub
                    ? 'border-[#F7B602] border-2 shadow-lg'
                    : 'border-slate-200'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {isCurrentPlan ? (
                    <Badge className="bg-emerald-500 text-white font-semibold px-3 py-1">Current Plan</Badge>
                  ) : plan.badge && !hasValidSub ? (
                    <Badge className="bg-[#F7B602] text-[#071739] font-semibold px-3 py-1">{plan.badge}</Badge>
                  ) : null}
                </div>

                <CardHeader className="pb-2 pt-6">
                  <CardTitle className="text-lg text-[#071739]">{plan.name}</CardTitle>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-4xl font-bold text-[#071739]">{plan.price}</span>
                    <span className="text-slate-500 mb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-400">{plan.priceNote}</p>
                  <p className="text-xs text-emerald-600 font-medium">{plan.annualEquivalent}</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4 pt-2">
                  <ul className="space-y-2 flex-1">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full mt-2 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <CheckCircle className="w-4 h-4 mr-2" /> Current Plan
                    </Button>
                  ) : isYearlyUpgrade ? (
                    <Button
                      onClick={() => setShowUpgradeDialog(true)}
                      className="w-full mt-2 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] font-semibold"
                    >
                      <Star className="w-4 h-4 mr-1" /> Upgrade Now
                    </Button>
                  ) : isDowngradeBlocked ? (
                    <Button disabled className="w-full mt-2 bg-slate-100 text-slate-400 cursor-not-allowed">
                      Not Available
                    </Button>
                  ) : !hasValidSub ? (
                    <Button
                      onClick={() => handleStartTrial(plan.id)}
                      disabled={!!subscribing}
                      className={`w-full mt-2 ${plan.badge ? 'bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]' : 'bg-[#071739] text-white hover:bg-[#0a1f4e]'}`}
                    >
                      {subscribing === plan.id
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting to Stripe...</>
                        : 'Start 3-Day Free Trial'
                      }
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}

        {/* Management actions */}
        {hasValidSub && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button variant="outline" onClick={() => navigate('/')} className="border-[#071739] text-[#071739]">
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={handleManagePayment}
              disabled={openingPortal}
              className="border-[#071739] text-[#071739]"
            >
              {openingPortal
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening...</>
                : <><CreditCard className="w-4 h-4 mr-2" />Manage Payment Method</>
              }
            </Button>
            {!subscription?.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                {isTrialing ? 'Cancel Trial' : 'Cancel Plan'}
              </Button>
            )}
          </div>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Cancel Anytime', desc: 'Cancel during your trial and pay nothing. No questions asked.' },
            { icon: CreditCard, title: 'Secure Payments', desc: 'Payments processed securely. Your card details are never stored by us.' },
            { icon: Calendar, title: 'Instant Access', desc: 'Get full access to all features immediately after starting your trial.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center p-4 border-slate-200">
              <div className="flex justify-center mb-2">
                <Icon className="w-6 h-6 text-[#F7B602]" />
              </div>
              <h3 className="font-semibold text-[#071739] text-sm">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </Card>
          ))}
        </div>

      </div>

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade to Annual Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll switch from £9.99/month to £99.99/year — saving £19.89. The change takes effect immediately and any unused days on your current cycle will be prorated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={upgrading}>Keep Monthly</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpgrade}
              disabled={upgrading}
              className="bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]"
            >
              {upgrading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upgrading...</> : 'Yes, Upgrade to Annual'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isTrialing ? 'Cancel your free trial?' : 'Cancel your subscription?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isTrialing
                ? 'Your trial will end immediately and you will not be charged. You can resubscribe at any time.'
                : `Your subscription will remain active until ${nextBillingDate}, then it will not renew.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {cancelling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</> : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}