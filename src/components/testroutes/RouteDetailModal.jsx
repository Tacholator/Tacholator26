import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
import { Navigation, Info, Clock, Navigation2 as RouteIcon } from 'lucide-react';
import RouteNavigationOverlay from './RouteNavigationOverlay';

// Encode a polyline for Google Static Maps
function encodePolyline(coords) {
  let output = '';
  let prevLat = 0, prevLng = 0;
  for (const [lng, lat] of coords) {
    const encodePart = (val) => {
      let v = Math.round(val * 1e5);
      v = v < 0 ? ~(v << 1) : v << 1;
      let str = '';
      while (v >= 0x20) { str += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; }
      str += String.fromCharCode(v + 63);
      return str;
    };
    output += encodePart(lat - prevLat) + encodePart(lng - prevLng);
    prevLat = lat; prevLng = lng;
  }
  return output;
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

export default function RouteDetailModal({ route, open, onOpenChange, onYouTubeChange, onGpsChange, isUpdating, isAdmin = true }) {
  const navigate = useNavigate();
  const [googleMapsKey, setGoogleMapsKey] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState(route?.youtubeUrl || '');
  const [gpsRouteType, setGpsRouteType] = useState(route?.gpsRouteType || 'gpx_url');
  const [gpsRouteUrl, setGpsRouteUrl] = useState(route?.gpsRouteUrl || '');
  const [uploading, setUploading] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  // Fetch Google Maps key
  useEffect(() => {
    base44.functions.invoke('getGoogleMapsKey').then(({ data }) => {
      if (data?.key) setGoogleMapsKey(data.key);
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

  // Build Google Static Maps URL with the route polyline
  const getStaticMapUrl = () => {
    if (!hasValidRoute || !googleMapsKey) return null;
    const coords = routeGeoJson.geometry.coordinates;
    // Sample coords to keep URL under limits (max ~8000 chars)
    const step = Math.max(1, Math.floor(coords.length / 200));
    const sampled = coords.filter((_, i) => i % step === 0);
    const encoded = encodePolyline(sampled);
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&size=800x450&maptype=roadmap&path=color:0x3B82F6FF|weight:4|enc:${encodeURIComponent(encoded)}&key=${googleMapsKey}`;
  };

  const staticMapUrl = getStaticMapUrl();

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
                {staticMapUrl ? (
                  <img
                    src={staticMapUrl}
                    alt="Route map"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-slate-500">
                      {!googleMapsKey ? 'Loading map...' : 'No route data available'}
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