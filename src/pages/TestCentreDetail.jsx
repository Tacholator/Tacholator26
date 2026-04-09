import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Play, CheckCircle, Loader2, MapPin, Video, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function TestCentreDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const centreId = urlParams.get('centreId');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: centre, isLoading: centreLoading } = useQuery({
    queryKey: ['testCentre', centreId],
    queryFn: async () => {
      const all = await base44.entities.NationalTestCentre.list();
      return all.find(c => c.id === centreId) || null;
    },
    enabled: !!centreId
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['testRoutes', centre?.name],
    queryFn: () => base44.entities.TestRoute.filter({ city: centre.name }),
    enabled: !!centre?.name
  });

  const { data: subscriptions = [], refetch: refetchSubs } = useQuery({
    queryKey: ['myTestCentreSubscriptions', user?.id],
    queryFn: () => base44.entities.CityVideoSubscription.filter({ userId: user.id }),
    enabled: !!user?.id
  });

  const subscription = subscriptions.find(s => s.cityId === centreId && s.status === 'active');
  const isSubscribed = !!subscription;

  const handleSubscribe = async () => {
    if (!centre?.stripePriceId) {
      toast({ title: 'Not available yet', description: 'This centre is not yet ready for subscription.', variant: 'destructive' });
      return;
    }
    setLoadingSubscribe(true);
    try {
      const res = await base44.functions.invoke('createTestCentreSubscription', {
        centreId: centre.id,
        centreName: centre.name,
        stripePriceId: centre.stripePriceId
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingSubscribe(false);
    }
  };

  if (centreLoading || routesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Test centre not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#071739] px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Test Routes
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7B602]/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#F7B602]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{centre.name}</h1>
              <p className="text-slate-400 text-sm">DVSA Test Centre</p>
            </div>
            {isSubscribed ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" /> Subscribed
              </Badge>
            ) : (
              <Badge className="bg-slate-700 text-slate-300">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Routes */}
        {routes.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Route videos coming soon</p>
            <p className="text-sm text-slate-400 mt-1">Check back later for this centre</p>
          </div>
        ) : (
          routes.map((route, idx) => (
            <div key={route.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-[#071739]">
                    {route.routeName || `Route ${route.routeNumber || idx + 1}`}
                  </p>
                  {route.routeNumber && (
                    <p className="text-xs text-slate-500">Route {route.routeNumber}</p>
                  )}
                </div>
                {isSubscribed ? (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    <Play className="w-3 h-3 mr-1" /> Unlocked
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 text-xs">
                    <Lock className="w-3 h-3 mr-1" /> Locked
                  </Badge>
                )}
              </div>

              {route.youtubeVideoId && (
                isSubscribed ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${route.youtubeVideoId}`}
                      title={route.routeName}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video relative bg-slate-900 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${route.youtubeVideoId}/hqdefault.jpg`}
                      alt="Route preview"
                      className="w-full h-full object-cover opacity-25"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Lock className="w-8 h-8 text-white" />
                      <p className="text-white text-sm font-semibold">Subscribe to watch</p>
                    </div>
                  </div>
                )
              )}
            </div>
          ))
        )}

        {/* Subscribe CTA */}
        {!isSubscribed && (
          <div className="bg-[#071739] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[#F7B602] text-xs font-semibold uppercase tracking-widest mb-1">Unlock Full Access</p>
              <p className="text-white font-bold text-xl">£20/month</p>
              <p className="text-slate-400 text-sm mt-0.5">Watch all {routes.length} route{routes.length !== 1 ? 's' : ''} for {centre.name}. Cancel anytime.</p>
            </div>
            <Button
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-bold gap-2 px-6 shrink-0"
              onClick={handleSubscribe}
              disabled={loadingSubscribe}
            >
              {loadingSubscribe ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loadingSubscribe ? 'Loading...' : 'Subscribe Now'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}