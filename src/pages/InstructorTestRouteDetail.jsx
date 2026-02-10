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
import { MapPin, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RouteCard from '@/components/testroutes/RouteCard';

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

  const [editingRoute, setEditingRoute] = useState(null);

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

        {/* Route Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onYouTubeChange={handleYouTubeUrlChange}
              onGpsChange={handleGpsChange}
              isUpdating={updateRouteMutation.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}