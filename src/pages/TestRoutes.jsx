import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, CheckCircle, Lock, Loader2, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TestRoutes() {
  const [search, setSearch] = useState('');
  const [loadingCentreId, setLoadingCentreId] = useState(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: centres = [], isLoading: centresLoading } = useQuery({
    queryKey: ['publishedTestCentres'],
    queryFn: async () => {
      const all = await base44.entities.NationalTestCentre.list();
      return all.filter(c => c.isPublished);
    }
  });

  const { data: subscriptions = [], refetch: refetchSubs } = useQuery({
    queryKey: ['myTestCentreSubscriptions', user?.id],
    queryFn: () => base44.entities.CityVideoSubscription.filter({ userId: user.id }),
    enabled: !!user?.id
  });

  const filtered = centres
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const getSubscription = (centreId) =>
    subscriptions.find(s => s.cityId === centreId && s.status === 'active');

  const handleSubscribe = async (centre) => {
    if (!centre.stripePriceId) {
      toast({ title: 'Not available yet', description: 'This centre is not yet ready for subscription.', variant: 'destructive' });
      return;
    }
    setLoadingCentreId(centre.id);
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
      setLoadingCentreId(null);
    }
  };

  if (centresLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h1 className="text-3xl font-bold text-[#071739]">Test Routes</h1>
          </div>
          <p className="text-slate-600 ml-13">
            Watch video walkthroughs of official DVSA driving test routes. Subscribe to unlock full access.
          </p>
        </div>

        {/* Pricing info */}
        <div className="bg-[#071739] rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#F7B602] text-xs font-semibold uppercase tracking-widest mb-1">Premium Access</p>
            <p className="text-white text-lg font-bold">£20/month per test centre</p>
            <p className="text-slate-400 text-sm mt-1">Watch all route videos for your chosen centre. Cancel anytime.</p>
          </div>
          <Badge className="bg-[#F7B602] text-[#071739] font-semibold text-sm px-4 py-1.5">
            {subscriptions.filter(s => s.status === 'active').length} active {subscriptions.filter(s => s.status === 'active').length === 1 ? 'subscription' : 'subscriptions'}
          </Badge>
        </div>

        {/* Search */}
        {centres.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search test centres..."
              className="pl-9"
            />
          </div>
        )}

        {/* Centre List */}
        {centres.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-700 mb-2">Coming Soon</p>

            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(centre => {
              const sub = getSubscription(centre.id);
              const isLoading = loadingCentreId === centre.id;

              return (
                <div
                  key={centre.id}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border-2 bg-white transition-all ${
                    sub ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-[#071739]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {sub ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#071739] truncate">{centre.name}</p>
                      {sub ? (
                        <p className="text-xs text-emerald-600 font-medium">Subscribed — full access</p>
                      ) : (
                        <p className="text-xs text-slate-500">Subscribe to unlock route videos</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {sub ? (
                      <Button size="sm" variant="outline" className="gap-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50">
                        <Play className="w-3.5 h-3.5" /> Watch Routes
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-[#071739] hover:bg-[#0a1f4d] text-white gap-2"
                        onClick={() => handleSubscribe(centre)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {isLoading ? 'Loading...' : 'Subscribe £20/mo'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-slate-500 py-8">No results for "{search}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}