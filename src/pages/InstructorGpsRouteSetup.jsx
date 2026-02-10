import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Info, MapPin } from 'lucide-react';
import GpsFollowAlongMap from '@/components/gps/GpsFollowAlongMap';

export default function InstructorGpsRouteSetup() {
  const { centreId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [geoJsonText, setGeoJsonText] = useState('');
  const [validationError, setValidationError] = useState('');

  // Check if user is admin
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isMainAdmin = user?.email === 'fasobah@gmail.com';

  // Fetch centre data
  const { data: centre, isLoading } = useQuery({
    queryKey: ['testRouteCentre', centreId],
    queryFn: async () => {
      const centres = await base44.entities.TestRouteCentre.filter({ id: centreId });
      return centres[0] || null;
    },
    enabled: !!centreId
  });

  // Initialize GeoJSON text when centre loads
  React.useEffect(() => {
    if (centre?.gpsGeoJson) {
      setGeoJsonText(JSON.stringify(centre.gpsGeoJson, null, 2));
    }
  }, [centre]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (geoJson) => {
      await base44.entities.TestRouteCentre.update(centreId, {
        gpsGeoJson: geoJson
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testRouteCentre', centreId]);
      alert('GPS route saved successfully!');
    },
    onError: (error) => {
      alert('Failed to save GPS route: ' + error.message);
    }
  });

  const handleSave = () => {
    setValidationError('');
    
    // Parse and validate
    let parsed;
    try {
      parsed = JSON.parse(geoJsonText);
    } catch (e) {
      setValidationError('Invalid JSON format');
      return;
    }

    // Validate structure
    if (!parsed.type || parsed.type !== 'Feature') {
      setValidationError('GeoJSON must be a Feature object');
      return;
    }

    if (!parsed.geometry || parsed.geometry.type !== 'LineString') {
      setValidationError('Geometry must be a LineString');
      return;
    }

    if (!Array.isArray(parsed.geometry.coordinates) || parsed.geometry.coordinates.length < 20) {
      setValidationError('Route must have at least 20 coordinate points');
      return;
    }

    // Save
    saveMutation.mutate(parsed);
  };

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

  if (!isMainAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              Only administrators can configure GPS routes.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Route centre not found</p>
        </div>
      </div>
    );
  }

  // Parse current GeoJSON for preview
  let currentGeoJson = null;
  try {
    currentGeoJson = JSON.parse(geoJsonText);
  } catch (e) {
    // Invalid JSON, ignore
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
            <h1 className="text-3xl font-bold text-[#071739]">{centre.centreName}</h1>
            <p className="text-slate-600">{centre.subLocation}</p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>GPS Follow-Along Setup:</strong> Paste a GeoJSON Feature with LineString geometry. 
            Learners will see their live location overlaid on this route during practice. 
            Use a GPS recording app to capture the exact test route.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>GeoJSON Route Data</CardTitle>
              <CardDescription>
                Paste your GeoJSON Feature with LineString geometry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="geojson">GeoJSON (LineString)</Label>
                <Textarea
                  id="geojson"
                  value={geoJsonText}
                  onChange={(e) => setGeoJsonText(e.target.value)}
                  placeholder='{"type":"Feature","geometry":{"type":"LineString","coordinates":[[lng,lat],[lng,lat],...]}}'
                  className="mt-2 font-mono text-sm"
                  rows={20}
                />
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || !geoJsonText}
                className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save GPS Route'}
              </Button>

              <div className="text-xs text-slate-500 space-y-1">
                <p><strong>Format:</strong> GeoJSON Feature with LineString</p>
                <p><strong>Coordinates:</strong> [[longitude, latitude], ...]</p>
                <p><strong>Minimum points:</strong> 20</p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Route Preview</CardTitle>
              <CardDescription>
                Live preview of the GPS route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentGeoJson ? (
                <GpsFollowAlongMap geoJson={currentGeoJson} />
              ) : (
                <div className="h-96 bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Enter valid GeoJSON to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}