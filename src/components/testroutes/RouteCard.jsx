import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function RouteCard({ route, onYouTubeChange, onGpsChange, isUpdating }) {
  const [youtubeUrl, setYoutubeUrl] = useState(route.youtubeUrl || '');
  const [gpsRouteType, setGpsRouteType] = useState(route.gpsRouteType || 'gpx_url');
  const [gpsRouteUrl, setGpsRouteUrl] = useState(route.gpsRouteUrl || '');

  const videoId = extractYouTubeId(youtubeUrl);

  const handleSaveVideo = () => {
    onYouTubeChange(route.id, youtubeUrl);
  };

  const handleSaveGps = () => {
    onGpsChange(route.id, gpsRouteType, gpsRouteUrl);
  };

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-[#071739]">
          {route.routeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Youtube className="w-4 h-4" />
            Route Video
          </div>
          <div>
            <Input
              type="url"
              placeholder="YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="text-sm"
            />
          </div>

          {videoId && (
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
          )}

          <Button
            onClick={handleSaveVideo}
            disabled={isUpdating}
            size="sm"
            className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            <Save className="w-3 h-3 mr-2" />
            Save Video
          </Button>
        </div>

        {/* GPS Section */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Navigation className="w-4 h-4" />
            GPS Route
          </div>
          <div>
            <Select value={gpsRouteType} onValueChange={setGpsRouteType}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpx_url">GPX URL</SelectItem>
                <SelectItem value="geojson_url">GeoJSON URL</SelectItem>
                <SelectItem value="external_map_url">External Map</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              type="url"
              placeholder="GPS Route URL"
              value={gpsRouteUrl}
              onChange={(e) => setGpsRouteUrl(e.target.value)}
              className="text-sm"
            />
          </div>

          <Button
            onClick={handleSaveGps}
            disabled={isUpdating}
            size="sm"
            className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            <Save className="w-3 h-3 mr-2" />
            Save GPS Route
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}