import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CheckCircle, Video, MapPin, Loader2, Star, AlertTriangle, Play } from 'lucide-react';

const PRICE_ID = 'price_1TK6JV2aulA4vtEcAODbLdGE';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VideoSubscription() {
  const queryClient = useQueryClient();
  const [subscribing, setSubscribing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const justSubscribed = urlParams.get('subscribed') === 'true';
  const returnCityId = urlParams.get('cityId');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['testRouteCities'],
    queryFn: () => base44.entities.TestRouteCity.list(),
  });

  const { data: mySubscriptions = [], isLoading: subsLoading, refetch: refetchSubs } = useQuery({
    queryKey: ['cityVideoSubscriptions', user?.id],
    queryFn: () => base44.entities.CityVideoSubscription.filter({ userId: user.id }),
    enabled: !!user?.id,
    refetchInterval: justSubscribed ? 3000 : false,
  });

  useEffect(() => {
    if (justSubscribed) {
      setSuccessMessage('Your subscription is now active! You can access all test route videos for this city.');
      window.history.replaceState({}, '', '/VideoSubscription');
      refetchSubs();
    }
  }, [justSubscribed]);

  const getSubForCity = (cityId) => mySubscriptions.find(s => s.cityId === cityId && (s.status === 'active'));

  const handleSubscribe = async (city) => {
    setSubscribing(city.id);
    const res = await base44.functions.invoke('createCityVideoSubscription', {
      cityId: city.id,
      cityName: city.cityName
    });
    if (res.data?.url) window.location.href = res.data.url;
    setSubscribing(null);
  };

  const handleCancel = async () => {
    const sub = showCancelDialog;
    setCancelling(sub.stripeSubscriptionId);
    await base44.functions.invoke('cancelCityVideoSubscription', {
      subscriptionId: sub.stripeSubscriptionId
    });
    await refetchSubs();
    setCancelling(null);
    setShowCancelDialog(null);
  };

  if (citiesLoading || subsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-[#F7B602]/20 p-3 rounded-full">
              <Video className="w-7 h-7 text-[#F7B602]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#071739]">Test Route Videos</h1>
          <p className="text-slate-500 mt-2">Subscribe to a city to access all its driving test route videos</p>
        </div>

        {/* Success banner */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Subscribed!</p>
              <p className="text-emerald-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Plan info banner */}
        <div className="mb-8 bg-[#071739] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-5 h-5 text-[#F7B602]" />
              <span className="font-bold text-lg">City Video Access — £20/month</span>
            </div>
            <p className="text-slate-300 text-sm">Get unlimited access to all test route videos for a chosen city. Cancel anytime.</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-[#F7B602]">£20</p>
            <p className="text-slate-400 text-sm">/month per city</p>
          </div>
        </div>

        {/* What's included */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Video, text: 'Full video walkthroughs for all routes in the city' },
            { icon: MapPin, text: 'City-specific test routes selected by admin' },
            { icon: CheckCircle, text: 'Cancel anytime, no long-term commitment' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-100">
              <Icon className="w-5 h-5 text-[#F7B602] shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{text}</p>
            </div>
          ))}
        </div>

        {/* City cards */}
        <h2 className="text-lg font-bold text-[#071739] mb-4">Select a City</h2>
        {cities.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No cities available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cities.map((city) => {
              const activeSub = getSubForCity(city.id);
              const isLoading = subscribing === city.id;

              return (
                <Card
                  key={city.id}
                  className={`relative border-2 ${activeSub ? 'border-emerald-400' : 'border-slate-200 hover:border-[#F7B602]/50'} transition-all`}
                >
                  {activeSub && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-emerald-500 text-white font-semibold px-3 py-1">Active</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-5">
                    <CardTitle className="flex items-center gap-2 text-[#071739]">
                      <MapPin className="w-5 h-5 text-[#F7B602]" />
                      {city.cityName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeSub ? (
                      <>
                        <div className="text-sm text-slate-600">
                          <p className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Access active
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            Renews: {formatDate(activeSub.currentPeriodEndAt)}
                            {activeSub.cancelAtPeriodEnd && (
                              <span className="ml-2 text-amber-600">(Cancels on this date)</span>
                            )}
                          </p>
                        </div>
                        {!activeSub.cancelAtPeriodEnd && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
                            onClick={() => setShowCancelDialog(activeSub)}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                        {activeSub.cancelAtPeriodEnd && (
                          <p className="text-xs text-center text-slate-400">Cancellation scheduled</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500">£20/month — full video access for {city.cityName}</p>
                        <Button
                          onClick={() => handleSubscribe(city)}
                          disabled={!!subscribing}
                          className="w-full bg-[#071739] text-white hover:bg-[#0a1f4e]"
                        >
                          {isLoading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
                            : <><Star className="w-4 h-4 mr-2" /> Subscribe — £20/month</>
                          }
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={!!showCancelDialog} onOpenChange={() => setShowCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {showCancelDialog?.cityName} subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your access will continue until {formatDate(showCancelDialog?.currentPeriodEndAt)}, then it will not renew.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!cancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!!cancelling}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {cancelling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling...</> : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}