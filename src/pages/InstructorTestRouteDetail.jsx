import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, ArrowLeft, Info, Navigation, Clock, Route } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/,
    /youtube\.com\/embed\/([^&\?\/]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

export default function InstructorTestRouteDetail() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const centreId = params.get('centreid') || params.get('centreId');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isMainAdmin = user?.email === 'fasobah@gmail.com';

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
      // If no routes exist, create 10 default routes
      if (existingRoutes.length === 0) {
        const newRoutes = [];
        for (let i = 1; i <= 10; i++) {
          const route = await base44.entities.TestRoute.create({
            centreId,
            routeNumber: i,
            routeName: `Route ${i}`,
            youtubeUrl: '',
            youtubeVideoId: '',
            gpsRouteType: 'gpx_url',
            gpsRouteUrl: ''
          });
          newRoutes.push(route);
        }
        return newRoutes;
      }
      return existingRoutes.sort((a, b) => a.routeNumber - b.routeNumber);
    },
    enabled: !!centreId
  });

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const updateRouteMutation = useMutation({
    mutationFn: async ({ routeId, data }) => {
      return await base44.entities.TestRoute.update(routeId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testRoutes', centreId]);
      toast({ title: 'Route saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save route', variant: 'destructive' });
    }
  });

  const handleYouTubeUrlChange = (routeId, url) => {
    const videoId = extractYouTubeId(url);
    updateRouteMutation.mutate({
      routeId,
      data: { youtubeUrl: url, youtubeVideoId: videoId }
    });
  };

  const handleGpsChange = (routeId, gpsRouteType, gpsRouteUrl) => {
    updateRouteMutation.mutate({
      routeId,
      data: { gpsRouteType, gpsRouteUrl }
    });
  };

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
          onClick={() => navigate(createPageUrl('InstructorTestRoutes'))}
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

        {!isMainAdmin && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Test routes are read-only. Only administrators can edit route information.
            </AlertDescription>
          </Alert>
        )}

        {/* Route Metrics */}
        {centreMetrics && (
          <Card className="mb-6 border-[#F7B602] border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#F7B602]" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#F7B602]" />
                  <span className="font-medium">{centreMetrics.distance} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F7B602]" />
                  <span className="font-medium">~{centreMetrics.duration} min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
          onYouTubeChange={handleYouTubeUrlChange}
          onGpsChange={handleGpsChange}
          isUpdating={updateRouteMutation.isPending}
          isAdmin={isMainAdmin}
        />
      </div>
    </div>
  );
}