import React, { useState } from 'react';
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
import { Youtube, Navigation, Save, Info } from 'lucide-react';

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
  const [youtubeUrl, setYoutubeUrl] = useState(route?.youtubeUrl || '');
  const [gpsRouteType, setGpsRouteType] = useState(route?.gpsRouteType || 'gpx_url');
  const [gpsRouteUrl, setGpsRouteUrl] = useState(route?.gpsRouteUrl || '');

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

  const handleSaveVideo = () => {
    onYouTubeChange(route.id, youtubeUrl);
  };

  const handleSaveGps = () => {
    onGpsChange(route.id, gpsRouteType, gpsRouteUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#071739]">
            {route.routeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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

          {/* GPS Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
              <Navigation className="w-5 h-5" />
              GPS Route
            </div>

            {isAdmin ? (
              <>
                <div>
                  <Label htmlFor="gpsRouteType">GPS Route Type</Label>
                  <Select value={gpsRouteType} onValueChange={setGpsRouteType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpx_url">GPX URL</SelectItem>
                      <SelectItem value="geojson_url">GeoJSON URL</SelectItem>
                      <SelectItem value="external_map_url">External Map Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gpsRouteUrl">GPS Route URL</Label>
                  <Input
                    id="gpsRouteUrl"
                    type="url"
                    placeholder="Paste GPX/GeoJSON URL or map link"
                    value={gpsRouteUrl}
                    onChange={(e) => setGpsRouteUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Route Requirements:</strong> Must start from the test centre (at least 100 yards from centre at the start) and return back to the test centre to finish.
                  </AlertDescription>
                </Alert>

                {gpsRouteUrl && (
                  <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
                    <p className="font-medium mb-2">GPS Route Preview:</p>
                    <p className="break-all">{gpsRouteUrl}</p>
                    <p className="mt-2 text-xs">Type: {gpsRouteType.replace('_', ' ').toUpperCase()}</p>
                  </div>
                )}

                {hasGpsChanges && (
                  <Button
                    onClick={handleSaveGps}
                    disabled={isUpdating}
                    className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Saving...' : 'Save GPS Route'}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    const url = `/test-route-viewer?routeid=${route.id}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Test Route
                </Button>
                {!gpsRouteUrl && (
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Using simulated route data for preview
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}