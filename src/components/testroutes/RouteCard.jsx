import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Youtube, Navigation, CheckCircle2 } from 'lucide-react';

export default function RouteCard({ route, onClick }) {
  const hasVideo = route.youtubeVideoId;
  const hasGps = route.gpsRouteUrl;

  return (
    <Card 
      className="border-0 shadow-none cursor-pointer hover:bg-slate-50 transition-all"
      onClick={() => onClick(route)}
    >
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-[#071739] mb-4">
            {route.routeName}
          </h3>
          <div className="flex justify-center gap-4 text-sm">
            <div className={`flex items-center gap-1 ${hasVideo ? 'text-green-600' : 'text-slate-400'}`}>
              {hasVideo ? <CheckCircle2 className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
              <span>Video</span>
            </div>
            <div className={`flex items-center gap-1 ${hasGps ? 'text-green-600' : 'text-slate-400'}`}>
              {hasGps ? <CheckCircle2 className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
              <span>GPS</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}