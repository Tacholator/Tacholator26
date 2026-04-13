import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Play, CheckCircle, Loader2, MapPin, Video, ArrowLeft, Navigation, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

// Build a Google Static Maps URL from a route's GeoJSON or GPS URL
function buildStaticMapUrl(route, apiKey) {
  if (!apiKey) return null;
  if (route.gpsGeoJson?.geometry?.coordinates?.length) {
    const coords = route.gpsGeoJson.geometry.coordinates;
    // Encode path: sample up to 100 points for URL length
    const step = Math.max(1, Math.floor(coords.length / 100));
    const path = coords.filter((_, i) => i % step === 0)
      .map(([lng, lat]) => `${lat},${lng}`)
      .join('|');
    return `https://maps.googleapis.com/maps/api/staticmap?size=640x360&maptype=roadmap&path=color:0x071739ff|weight:4|${path}&key=${apiKey}`;
  }
  // Fallback: show a map centred on the GPS URL host (no preview possible)
  return null;
}

export default function TestCentreDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [activeTab, setActiveTab] = useState({}); // routeId -> 'video' | 'gps'

  const { data: mapsKey } = useQuery({
    queryKey: ['googleMapsKey'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getGoogleMapsKey', {});
      return res.data?.key || null;
    }
  });

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
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Back + Title */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-[#071739] transition-colors mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Test Routes
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#F7B602]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#071739]">{centre.name}</h1>
              <p className="text-slate-500 text-sm">DVSA Test Centre</p>
            </div>
            {isSubscribed ? (
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                <CheckCircle className="w-3 h-3 mr-1" /> Subscribed
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Plans CTA */}
        {!isSubscribed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Videos Only */}
            <Card className="border-2 border-slate-200 overflow-hidden">
              <div className="bg-slate-700 px-5 py-4">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1"><Video className="w-3 h-3" /> Videos Only</p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-extrabold text-white">£20</span>
                  <span className="text-slate-400 mb-0.5 text-sm">/month</span>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <ul className="space-y-1.5">
                  {['Route videos by real local instructors', 'Watch all routes for this centre', 'Cancel anytime'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold" onClick={handleSubscribe} disabled={loadingSubscribe}>
                  {loadingSubscribe ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Subscribe — £20/mo
                </Button>
              </CardContent>
            </Card>

            {/* Videos + GPS */}
            <Card className="border-2 border-[#F7B602] overflow-hidden relative">
              <div className="absolute top-3 right-3">
                <Badge className="bg-[#F7B602] text-[#071739] font-bold text-xs">BEST VALUE</Badge>
              </div>
              <div className="bg-[#071739] px-5 py-4">
                <p className="text-[#F7B602] text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1"><Navigation className="w-3 h-3" /> Videos + GPS</p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-extrabold text-white">£30</span>
                  <span className="text-slate-400 mb-0.5 text-sm">/month</span>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <ul className="space-y-1.5">
                  {['Everything in Videos Only', 'GPS routes by real local instructors', 'Turn-by-turn navigation for every route', 'Cancel anytime'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-bold" onClick={handleSubscribe} disabled={loadingSubscribe}>
                  {loadingSubscribe ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Subscribe — £30/mo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Routes */}
        {routes.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Route videos coming soon</p>
            <p className="text-sm text-slate-400 mt-1">Check back later for this centre</p>
          </div>
        ) : (
          routes.map((route, idx) => {
            const tab = activeTab[route.id] || 'video';
            const hasGps = !!route.gpsRouteUrl;
            return (
              <div key={route.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Route header */}
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

                {/* Tab switcher (only if both video and GPS exist) */}
                {route.youtubeVideoId && hasGps && (
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setActiveTab(prev => ({ ...prev, [route.id]: 'video' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === 'video' ? 'border-b-2 border-[#071739] text-[#071739] bg-slate-50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Video className="w-4 h-4" /> Video
                    </button>
                    <button
                      onClick={() => setActiveTab(prev => ({ ...prev, [route.id]: 'gps' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === 'gps' ? 'border-b-2 border-[#071739] text-[#071739] bg-slate-50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Navigation className="w-4 h-4" /> GPS Route
                    </button>
                  </div>
                )}

                {/* Video panel */}
                {(tab === 'video' || !hasGps) && route.youtubeVideoId && (
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

                {/* GPS panel */}
                {tab === 'gps' && hasGps && (() => {
                  const mapUrl = buildStaticMapUrl(route, mapsKey);
                  return isSubscribed ? (
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      {mapUrl ? (
                        <img src={mapUrl} alt="Route map" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <Navigation className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-end justify-between">
                        <p className="text-white text-sm font-semibold">GPS Route Preview</p>
                        <a
                          href={route.gpsRouteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7B602] text-[#071739] text-xs font-bold hover:bg-[#d99f02] transition-colors"
                        >
                          <Navigation className="w-3 h-3" /> Open Route
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      {mapUrl ? (
                        <img src={mapUrl} alt="Route map preview" className="w-full h-full object-cover opacity-25 blur-sm" />
                      ) : (
                        <div className="w-full h-full bg-slate-800" />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-white" />
                        <p className="text-white text-sm font-semibold">Subscribe to access GPS routes</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}


      </div>
    </div>
  );
}