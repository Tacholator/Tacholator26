import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Youtube, Navigation } from 'lucide-react';

export default function LearnerTestRoutes() {
  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['testRouteCentres'],
    queryFn: () => base44.entities.TestRouteCentre.list()
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading test routes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Routes</h1>
          <p className="text-slate-600">
            View test centre routes with videos and GPS recordings
          </p>
        </div>

        {centres.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No test routes available</h3>
              <p className="text-slate-600">
                Your instructor hasn't added any test routes yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {centres.map(centre => (
              <Link key={centre.id} to={createPageUrl(`LearnerTestRouteDetail?centreId=${centre.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-[#F7B602] mt-0.5 flex-shrink-0" />
                      <span>{centre.centreName}</span>
                    </CardTitle>
                    <CardDescription>{centre.subLocation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Youtube className="w-4 h-4" />
                        <span>{centre.youtubeVideoId ? 'Video available' : 'No video'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="w-4 h-4" />
                        <span>{centre.gpsRouteUrl ? 'GPS available' : 'No GPS'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}