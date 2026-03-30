import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Navigation, Youtube } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AdminGpsRoutes() {
  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['publishedCentres'],
    queryFn: async () => {
      const all = await base44.entities.TestRouteCentre.list();
      return all.filter(c => c.published);
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#F7B602]/10 rounded-xl">
          <MapPin className="w-6 h-6 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071739]">GPS Routes</h1>
          <p className="text-sm text-slate-500">Published test route areas available to instructors</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : centres.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No published routes yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Publish routes in{' '}
              <Link to={createPageUrl('AdminTestRouteConfiguration')} className="text-[#F7B602] underline">
                Test Route Configuration
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {centres.map(centre => (
            <Link key={centre.id} to={createPageUrl(`AdminTestRouteDetail?centreId=${centre.id}`)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4 text-[#F7B602] flex-shrink-0" />
                      {centre.centreName}
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs whitespace-nowrap">
                      <Globe className="w-3 h-3 mr-1" />
                      Published
                    </Badge>
                  </div>
                  {centre.subLocation && (
                    <p className="text-sm text-slate-500">{centre.subLocation}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Youtube className="w-4 h-4" />
                      {centre.youtubeVideoId ? 'Video added' : 'No video'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      {centre.gpsGeoJson ? 'GPS added' : 'No GPS'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}