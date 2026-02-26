import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, ArrowLeft, Info, Navigation, Clock, Navigation2 } from 'lucide-react';
import RouteCard from '@/components/testroutes/RouteCard';
import RouteDetailModal from '@/components/testroutes/RouteDetailModal';

// Calculate route distance and duration from GeoJSON
function calculateRouteMetrics(gpsGeoJson) {
  if (!gpsGeoJson || !gpsGeoJson.geometry || !gpsGeoJson.geometry.coordinates) {
    return { distance: 0, duration: 0 };
  }

  const coords = gpsGeoJson.geometry.coordinates;
  let totalDistance = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDistance += R * c;
  }

  const distanceKm = (totalDistance / 1000).toFixed(1);
  const durationMin = Math.round((totalDistance / 1000) / 0.5); // Assume 30 km/h average

  return { distance: distanceKm, duration: durationMin };
}

export default function LearnerTestRouteDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const centreId = params.get('centreid') || params.get('centreId');

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: centre, isLoading } = useQuery({
    queryKey: ['testRouteCentre', centreId],
    queryFn: async () => {
      const centres = await base44.entities.TestRouteCentre.filter({ id: centreId });
      return centres[0] || null;
    },
    enabled: !!centreId
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['testRoutes', centreId],
    queryFn: async () => {
      const existingRoutes = await base44.entities.TestRoute.filter({ centreId });
      return existingRoutes.sort((a, b) => a.routeNumber - b.routeNumber);
    },
    enabled: !!centreId
  });

  const handleRouteClick = (route) => {
    setSelectedRoute(route);
    setModalOpen(true);
  };

  // Calculate metrics for the centre's GPS route
  const centreMetrics = centre?.gpsGeoJson ? calculateRouteMetrics(centre.gpsGeoJson) : null;

  if (isLoading || routesLoading) {
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

        <div className="flex items-start gap-3 mb-8">
          <MapPin className="w-8 h-8 text-[#F7B602] mt-1" />
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">{centre.centreName}</h1>
            <p className="text-slate-600">Area: {centre.subLocation}</p>
          </div>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Test routes are read-only. Only administrators can edit route information.
          </AlertDescription>
        </Alert>

        {/* GPS Follow-Along */}
        <Card className="mb-6 border-[#F7B602] border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#F7B602]" />
              GPS Follow-Along
            </CardTitle>
            <CardDescription>
              Practice following the exact test route with live GPS tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {centreMetrics && (
              <div className="flex items-center gap-6 text-sm text-slate-600 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#F7B602]" />
                  <span className="font-medium">{centreMetrics.distance} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F7B602]" />
                  <span className="font-medium">{centreMetrics.duration} min</span>
                </div>
              </div>
            )}
            <Button
              onClick={() => navigate(createPageUrl('LearnerGpsFollowAlong') + `?centreid=${centreId}`)}
              className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Start GPS Follow-Along
            </Button>
          </CardContent>
        </Card>

        {/* Route Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onClick={handleRouteClick}
            />
          ))}
        </div>

        {/* Route Detail Modal */}
        <RouteDetailModal
          route={selectedRoute}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onYouTubeChange={() => {}}
          onGpsChange={() => {}}
          isUpdating={false}
          isAdmin={false}
        />
      </div>
    </div>
  );
}