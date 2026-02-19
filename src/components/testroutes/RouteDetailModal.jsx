import React, { useState } from 'react';
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
import { Youtube, Navigation, Save, Info, Upload } from 'lucide-react';
import RouteNavigationOverlay from './RouteNavigationOverlay';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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
  const [youtubeUrl, setYoutubeUrl] = useState(route?.youtubeUrl || '');
  const [gpsRouteType, setGpsRouteType] = useState(route?.gpsRouteType || 'gpx_url');
  const [gpsRouteUrl, setGpsRouteUrl] = useState(route?.gpsRouteUrl || '');
  const [uploading, setUploading] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

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
      'line-color': '#F7B602',
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

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
              <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden pointer-events-none">
                {hasValidRoute && MAPBOX_TOKEN ? (
                  <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    initialViewState={{
                      ...routeCenter,
                      zoom: 13
                    }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    style={{ width: '100%', height: '100%' }}
                    interactive={false}
                    attributionControl={false}
                    dragPan={false}
                    scrollZoom={false}
                    boxZoom={false}
                    dragRotate={false}
                    keyboard={false}
                    doubleClickZoom={false}
                    touchZoomRotate={false}
                  >
                    {routeGeoJson && (
                      <Source id="route-preview-source" type="geojson" data={routeGeoJson}>
                        <Layer {...routeLayerStyle} />
                      </Source>
                    )}
                  </Map>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-slate-500">
                      {!MAPBOX_TOKEN ? 'Mapbox token not configured' : 'No route data available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Route Details & Start Button */}
              <div className="space-y-4 p-4 bg-white rounded-lg border">
                <div className="flex gap-6">
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
                  onClick={() => setNavigationOpen(true)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Navigation
                </Button>
              </div>
            </div>

          {/* Video Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
              <Youtube className="w-5 h-5" />
              Route Video
            </div>
            
            {isAdmin && (
              <>
                <div>
                  <Label htmlFor="youtubeUrl">YouTube URL</Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {!videoId && youtubeUrl && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Invalid YouTube URL. Please check the format.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {videoId ? (
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={route.routeName}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No video available for this route yet.
              </p>
            )}

            {isAdmin && hasVideoChanges && (
              <Button
                onClick={handleSaveVideo}
                disabled={isUpdating}
                className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Video'}
              </Button>
            )}
          </div>


        </div>
      </DialogContent>
    </Dialog>

    {/* Navigation Overlay */}
    {navigationOpen && (
      <RouteNavigationOverlay
        route={route}
        onClose={() => setNavigationOpen(false)}
      />
    )}
  </>
  );
}