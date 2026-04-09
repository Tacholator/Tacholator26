import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Play, CheckCircle, Loader2, MapPin, Video } from 'lucide-react';

export default function TestCentreDetailModal({ centre, subscription, onSubscribe, isLoadingSubscribe, onClose }) {
  const isSubscribed = !!subscription;

  const { data: routes = [] } = useQuery({
    queryKey: ['testRoutes', centre?.id],
    queryFn: () => base44.entities.TestRoute.filter({ city: centre.name }),
    enabled: !!centre?.name
  });

  if (!centre) return null;

  return (
    <Dialog open={!!centre} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#071739] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#F7B602]" />
            </div>
            <div>
              <DialogTitle className="text-xl text-[#071739]">{centre.name}</DialogTitle>
              <p className="text-sm text-slate-500">DVSA Test Centre</p>
            </div>
            {isSubscribed ? (
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 border border-emerald-300">
                <CheckCircle className="w-3 h-3 mr-1" /> Subscribed
              </Badge>
            ) : (
              <Badge className="ml-auto bg-slate-100 text-slate-600">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Route Videos */}
          {routes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Video className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Route videos coming soon for this centre.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">{routes.length} route video{routes.length !== 1 ? 's' : ''} available</p>
              {routes.map((route, idx) => (
                <div key={route.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
                    <div>
                      <p className="font-medium text-[#071739] text-sm">
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

                  {/* Video area */}
                  {route.youtubeVideoId ? (
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
                          className="w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <Lock className="w-8 h-8 text-white" />
                          <p className="text-white text-sm font-semibold">Subscribe to watch</p>
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Subscribe CTA */}
          {!isSubscribed && (
            <div className="bg-[#071739] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div>
                <p className="text-[#F7B602] text-xs font-semibold uppercase tracking-widest mb-1">Unlock Full Access</p>
                <p className="text-white font-bold text-lg">£20/month</p>
                <p className="text-slate-400 text-xs mt-0.5">Cancel anytime</p>
              </div>
              <Button
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-bold gap-2 shrink-0"
                onClick={() => onSubscribe(centre)}
                disabled={isLoadingSubscribe}
              >
                {isLoadingSubscribe ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoadingSubscribe ? 'Loading...' : 'Subscribe Now'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}