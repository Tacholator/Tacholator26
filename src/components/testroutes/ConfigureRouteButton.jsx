import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ConfigureRouteButton({ routeId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleConfigure = async () => {
    if (!file) {
      setError('Please select a GPX file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Upload the GPX file to get a public URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const response = await base44.functions.invoke('configureTestRoute', {
        routeId,
        gpsDataUrl: file_url
      });

      setResult(response.data);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setOpen(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Configure GPS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Route GPS Data</DialogTitle>
          <DialogDescription>
            Upload GPS tracking data to enable navigation features for this route
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gpxFile">GPX File</Label>
            <Input
              id="gpxFile"
              type="file"
              accept=".gpx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <p className="text-xs text-slate-500">
              Select a .gpx file exported from your GPS device or app
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <p className="font-semibold">{result.message}</p>
                  <p className="text-xs">
                    {result.pointsProcessed} GPS points processed • {result.stepsGenerated} navigation steps generated
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleConfigure}
            disabled={loading || !file}
            className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Configure Route
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}