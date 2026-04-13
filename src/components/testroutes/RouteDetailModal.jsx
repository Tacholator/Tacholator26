import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Navigation, Save, Info, Upload, Plus, Minus, Clock, Navigation2 as RouteIcon } from 'lucide-react';
import RouteNavigationOverlay from './RouteNavigationOverlay';

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

export default function RouteDetailModal({ route, open, onOpenChange, onYouTubeChange, onGpsChange, isUpdating, isAdmin = true }) {
  const navigate = useNavigate();
  const [mapboxToken, setMapboxToken] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState(route?.youtubeUrl || '');
  const [gpsRouteType, setGpsRouteType] = useState(route?.gpsRouteType || 'gpx_url');
  const [gpsRouteUrl, setGpsRouteUrl] = useState(route?.gpsRouteUrl || '');
  const [uploading, setUploading] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);

  // Fetch Mapbox token
  useEffect(() => {
    base44.functions.invoke('getMapboxToken').then(({ data }) => {
      if (data?.token) {
        setMapboxToken(data.token);
      }
    }).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (route) {
      setYoutubeUrl(route.youtubeUrl || '');
      setGpsRouteType(route.gpsRouteType || 'gpx_url');
      setGpsRouteUrl(route.gpsRouteUrl || '');
    }
  }, [route]);

  // Track if changes have been made
  const hasVideoChanges = youtubeUrl !== (route?.youtubeUrl || '');
  const hasGpsChanges = gpsRouteType !== (route?.gpsRouteType || 'gpx_url') || 
                        gpsRouteUrl !== (route?.gpsRouteUrl || '');

  if (!route) return null;

  const videoId = extractYouTubeId(youtubeUrl);
  const routeGeoJson = route?.gpsGeoJson || null;
  const hasValidRoute = routeGeoJson?.geometry?.coordinates?.length > 0;

  // Calculate route center
  const getRouteCenter = () => {
    if (!routeGeoJson?.geometry?.coordinates) return { longitude: -1.5, latitude: 53.8 };
    const coords = routeGeoJson.geometry.coordinates;
    const avgLon = coords.reduce((sum, [lon]) => sum + lon, 0) / coords.length;
    const avgLat = coords.reduce((sum, [, lat]) => sum + lat, 0) / coords.length;
    return { longitude: avgLon, latitude: avgLat };
  };

  const routeCenter = getRouteCenter();

  // Route layer style
  const routeLayerStyle = {
    id: 'route-preview',
    type: 'line',
    paint: {
      'line-color': '#3B82F6',
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

  // Calculate route metrics
  const calculateRouteMetrics = () => {
    if (!routeGeoJson || !routeGeoJson.geometry || !routeGeoJson.geometry.coordinates) {
      return { distance: 0, duration: 0 };
    }

    const coords = routeGeoJson.geometry.coordinates;
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

    const distanceMi = (totalDistance / 1000 * 0.621371).toFixed(1);
    const durationMin = Math.round((totalDistance / 1000) / 0.5);

    return { distance: distanceMi, duration: durationMin };
  };

  const routeMetrics = calculateRouteMetrics();

  const handleSaveVideo = () => {
    onYouTubeChange(route.id, youtubeUrl);
  };

  const handleSaveGps = () => {
    onGpsChange(route.id, gpsRouteType, gpsRouteUrl);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setGpsRouteUrl(file_url);
    } catch (error) {
      alert('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#071739]">
              {route.routeName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Route Layout Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <Navigation className="w-5 h-5" />
                Route Layout
              </div>
              
              {/* Route Map Visualization */}
              <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative">
                {hasValidRoute && mapboxToken ? (
                  <>
                    <Map
                      mapboxAccessToken={mapboxToken}
                      initialViewState={{
                        ...routeCenter,
                        zoom: mapZoom
                      }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      style={{ width: '100%', height: '100%' }}
                      onZoom={(e) => setMapZoom(e.viewState.zoom)}
                      attributionControl={false}
                      onLoad={(e) => {
                        // Fit bounds to show entire route with responsive padding
                        if (routeGeoJson?.geometry?.coordinates?.length > 0) {
                          const coords = routeGeoJson.geometry.coordinates;
                          const lngs = coords.map(c => c[0]);
                          const lats = coords.map(c => c[1]);
                          
                          const bounds = [
                            [Math.min(...lngs), Math.min(...lats)],
                            [Math.max(...lngs), Math.max(...lats)]
                          ];
                          
                          // Responsive padding based on screen size
                          const padding = window.innerWidth < 768 ? 20 : 40;
                          e.target.fitBounds(bounds, { padding, duration: 0 });
                        }
                      }}
                    >
                      {routeGeoJson && (
                        <Source id="route-preview-source" type="geojson" data={routeGeoJson}>
                          <Layer {...routeLayerStyle} />
                        </Source>
                      )}
                    </Map>
                    {/* Zoom Controls */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                      <Button
                        onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
                        size="icon"
                        className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-900 shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
                        size="icon"
                        className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-900 shadow-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-slate-500">
                      {!mapboxToken ? 'Loading map...' : 'No route data available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Route Details & Start Button */}
              <div className="space-y-4 p-4 bg-white rounded-lg border">
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-xs text-slate-500">Route Type</p>
                    <p className="text-lg font-semibold text-[#071739]">Test Route {route.routeNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-lg font-semibold text-[#071739]">
                      {hasValidRoute ? 'Ready' : 'No GPS data'}
                    </p>
                  </div>
                  {hasValidRoute && routeMetrics.distance > 0 && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Distance</p>
                        <p className="text-lg font-semibold text-[#071739] flex items-center gap-1">
                          <RouteIcon className="w-4 h-4" />
                          {routeMetrics.distance} mi
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="text-lg font-semibold text-[#071739] flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          ~{routeMetrics.duration} min
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                {!hasValidRoute && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      GPS route data not available for this route. Navigation features are disabled.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  disabled={!hasValidRoute}
                  onClick={() => {
                    onOpenChange(false);
                    setNavigationOpen(true);
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Navigation
                </Button>
              </div>
            </div>

        </div>
      </DialogContent>
    </Dialog>

    {/* Navigation Overlay */}
    {navigationOpen && (
      <RouteNavigationOverlay
        route={route}
        onClose={() => {
          setNavigationOpen(false);
          onOpenChange(true);
        }}
      />
    )}
  </>
  );
}