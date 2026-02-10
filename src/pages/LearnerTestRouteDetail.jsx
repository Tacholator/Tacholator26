import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Youtube, Navigation, Info, ArrowLeft } from 'lucide-react';

export default function LearnerTestRouteDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const centreId = params.get('centreId');

  const { data: centre, isLoading } = useQuery({
    queryKey: ['testRouteCentre', centreId],
    queryFn: async () => {
      const centres = await base44.entities.TestRouteCentre.filter({ id: centreId });
      return centres[0] || null;
    },
    enabled: !!centreId
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Test route not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('LearnerTestRoutes'))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Test Routes
        </Button>

        <div className="flex items-start gap-3">
          <MapPin className="w-8 h-8 text-[#F7B602] mt-1" />
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">{centre.centreName}</h1>
            <p className="text-slate-600">Area: {centre.subLocation}</p>
          </div>
        </div>

        {/* Video Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5" />
              Route Video (YouTube)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {centre.youtubeVideoId ? (
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${centre.youtubeVideoId}`}
                  title="Test Route Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Your instructor hasn't added a route video yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* GPS Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Recorded GPS Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {centre.gpsRouteUrl ? (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This route starts from the test centre and returns back to finish. Use it to familiarize yourself with the test area.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
                  <p className="font-medium mb-2">GPS Route:</p>
                  <a
                    href={centre.gpsRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F7B602] hover:underline break-all"
                  >
                    {centre.gpsRouteUrl}
                  </a>
                  <p className="mt-2 text-xs">Type: {centre.gpsRouteType?.replace('_', ' ').toUpperCase()}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Your instructor hasn't added a GPS route yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}