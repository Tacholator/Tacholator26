import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Navigation, Clock, MapPin, Route } from 'lucide-react';
import GpsFollowAlongMap from '@/components/gps/GpsFollowAlongMap';
import { length } from '@turf/turf';

// Fake test route data for simulation (around London Peckham test centre area)
const FAKE_ROUTE_GEOJSON = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [
      [-0.0639, 51.4742], // Start - Peckham test centre
      [-0.0641, 51.4738],
      [-0.0645, 51.4735],
      [-0.0652, 51.4732],
      [-0.0658, 51.4729],
      [-0.0665, 51.4727],
      [-0.0672, 51.4725],
      [-0.0680, 51.4724],
      [-0.0688, 51.4723],
      [-0.0695, 51.4722],
      [-0.0702, 51.4722],
      [-0.0710, 51.4723],
      [-0.0717, 51.4725],
      [-0.0723, 51.4727],
      [-0.0728, 51.4730],
      [-0.0732, 51.4734],
      [-0.0735, 51.4738],
      [-0.0736, 51.4743],
      [-0.0735, 51.4748],
      [-0.0733, 51.4753],
      [-0.0729, 51.4757],
      [-0.0724, 51.4760],
      [-0.0718, 51.4762],
      [-0.0711, 51.4763],
      [-0.0704, 51.4763],
      [-0.0697, 51.4762],
      [-0.0690, 51.4760],
      [-0.0684, 51.4757],
      [-0.0679, 51.4753],
      [-0.0675, 51.4749],
      [-0.0672, 51.4745],
      [-0.0670, 51.4741],
      [-0.0668, 51.4738],
      [-0.0665, 51.4735],
      [-0.0661, 51.4733],
      [-0.0656, 51.4732],
      [-0.0651, 51.4733],
      [-0.0646, 51.4735],
      [-0.0642, 51.4738],
      [-0.0639, 51.4742]  // End - back to test centre
    ]
  },
  properties: {
    name: "Test Route Simulation"
  }
};

export default function TestRouteViewer() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const routeId = params.get('routeid') || params.get('routeId');
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);

  // Fetch route data
  const { data: route, isLoading } = useQuery({
    queryKey: ['testRoute', routeId],
    queryFn: async () => {
      if (!routeId) return null;
      const routes = await base44.entities.TestRoute.filter({ id: routeId });
      return routes[0] || null;
    },
    enabled: !!routeId
  });

  // Calculate route statistics
  useEffect(() => {
    try {
      // Calculate distance using Turf.js
      const distanceKm = length(FAKE_ROUTE_GEOJSON, { units: 'kilometers' });
      const distanceMiles = distanceKm * 0.621371;
      setRouteDistance(distanceMiles);

      // Estimate duration (assuming average 20 mph in test conditions)
      const durationHours = distanceMiles / 20;
      const durationMinutes = Math.round(durationHours * 60);
      setRouteDuration(durationMinutes);
    } catch (error) {
      console.error('Error calculating route stats:', error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7B602] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading route...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Route not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">{route.routeName}</h1>
            <p className="text-slate-600">Test Route Preview</p>
          </div>
        </div>

        {/* Simulation Notice */}
        <Alert className="border-[#F7B602] bg-[#F7B602]/10">
          <Navigation className="h-4 w-4" />
          <AlertDescription>
            <strong>Simulation Mode:</strong> This is a simulated test route for demonstration purposes. 
            The route shown represents a typical driving test path in the Peckham area.
          </AlertDescription>
        </Alert>

        {/* Route Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Route className="w-4 h-4" />
                Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">
                {routeDistance.toFixed(2)} mi
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(routeDistance * 1.60934).toFixed(2)} km
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">
                {routeDuration} min
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estimated at 20 mph average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Waypoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">
                {FAKE_ROUTE_GEOJSON.geometry.coordinates.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                GPS coordinates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Route Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#F7B602]" />
              Route Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GpsFollowAlongMap geoJson={FAKE_ROUTE_GEOJSON} />
            
            <div className="mt-4 p-4 bg-slate-100 rounded-lg space-y-2">
              <h3 className="font-semibold text-slate-700">Route Information</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Starts and ends at the test centre</li>
                <li>• Includes variety of road types and maneuvers</li>
                <li>• Typical duration: {routeDuration} minutes</li>
                <li>• Total distance: {routeDistance.toFixed(2)} miles</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}