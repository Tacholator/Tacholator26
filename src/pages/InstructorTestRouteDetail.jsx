import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Youtube, Navigation, Save, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const centreId = params.get('centreId');

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

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [gpsRouteType, setGpsRouteType] = useState('gpx_url');
  const [gpsRouteUrl, setGpsRouteUrl] = useState('');

  useEffect(() => {
    if (centre) {
      setYoutubeUrl(centre.youtubeUrl || '');
      setYoutubeVideoId(centre.youtubeVideoId || '');
      setGpsRouteType(centre.gpsRouteType || 'gpx_url');
      setGpsRouteUrl(centre.gpsRouteUrl || '');
    }
  }, [centre]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.TestRouteCentre.update(centreId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testRouteCentre', centreId]);
      queryClient.invalidateQueries(['testRouteCentres']);
      toast({ title: 'Test route saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  });

  const handleYouTubeUrlChange = (url) => {
    setYoutubeUrl(url);
    const videoId = extractYouTubeId(url);
    setYoutubeVideoId(videoId);
  };

  const handleSave = () => {
    updateMutation.mutate({
      youtubeUrl,
      youtubeVideoId,
      gpsRouteType,
      gpsRouteUrl,
      createdByInstructorId: centre?.createdByInstructorId || user?.id
    });
  };

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
            <CardDescription>
              Add a 30–40 minute route video. Learners can view/play (read-only).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
                value={youtubeUrl}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                className="mt-1"
              />
            </div>

            {youtubeVideoId && (
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                  title="Test Route Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {!youtubeVideoId && youtubeUrl && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Invalid YouTube URL. Please check the format.
                </AlertDescription>
              </Alert>
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
            <CardDescription>
              Add a GPS route that starts at the test centre (min 100 yards from centre at the start) and returns to the test centre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Test Route'}
        </Button>
      </div>
    </div>
  );
}