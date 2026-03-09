import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Youtube, MapPin, Pencil, Check, X, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdminTestRouteVideos() {
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: centres = [], isLoading: centresLoading } = useQuery({
    queryKey: ['testRouteCentres'],
    queryFn: () => base44.entities.TestRouteCentre.list()
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['testRoutes'],
    queryFn: () => base44.entities.TestRoute.list()
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, youtubeUrl, youtubeVideoId }) =>
      base44.entities.TestRoute.update(id, { youtubeUrl, youtubeVideoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRoutes'] });
      setEditingRouteId(null);
      toast({ title: 'Saved', description: 'Video URL updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update video URL.', variant: 'destructive' });
    }
  });

  const extractVideoId = (url) => {
    if (!url) return '';
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const handleSave = (routeId) => {
    const videoId = extractVideoId(editUrl);
    updateRouteMutation.mutate({ id: routeId, youtubeUrl: editUrl, youtubeVideoId: videoId });
  };

  const handleEdit = (route) => {
    setEditingRouteId(route.id);
    setEditUrl(route.youtubeUrl || '');
  };

  const handleCancel = () => {
    setEditingRouteId(null);
    setEditUrl('');
  };

  const isLoading = centresLoading || routesLoading;

  // Group routes by centre
  const routesByCentre = centres.map(centre => ({
    centre,
    routes: routes
      .filter(r => r.centreId === centre.id)
      .sort((a, b) => (a.routeNumber || 0) - (b.routeNumber || 0))
  })).filter(group => group.routes.length > 0);

  // Also catch routes with no matching centre
  const orphanRoutes = routes.filter(r => !centres.find(c => c.id === r.centreId));

  const totalWithVideo = routes.filter(r => r.youtubeVideoId).length;
  const totalWithout = routes.filter(r => !r.youtubeVideoId).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl('AdminDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Route Videos</h1>
          <p className="text-slate-600">Manage YouTube video links for all test routes across every test centre.</p>
          <div className="flex gap-4 mt-4">
            <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">
              {totalWithVideo} with video
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {totalWithout} missing video
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading routes...</div>
        ) : routesByCentre.length === 0 && orphanRoutes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No test routes found. Add routes via Test Route Configuration first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {routesByCentre.map(({ centre, routes: centreRoutes }) => (
              <div key={centre.id}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-[#F7B602]" />
                  <h2 className="text-lg font-semibold text-[#071739]">{centre.centreName}</h2>
                  {centre.subLocation && (
                    <span className="text-sm text-slate-500">— {centre.subLocation}</span>
                  )}
                </div>
                <div className="space-y-3">
                  {centreRoutes.map(route => (
                    <Card key={route.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Thumbnail or placeholder */}
                          <div className="w-28 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {route.youtubeVideoId ? (
                              <img
                                src={`https://img.youtube.com/vi/${route.youtubeVideoId}/mqdefault.jpg`}
                                alt="thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Youtube className="w-6 h-6 text-slate-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">{route.routeName || `Route ${route.routeNumber}`}</span>
                                {route.youtubeVideoId ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">Video added</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-slate-500">No video</Badge>
                                )}
                              </div>
                              {route.youtubeVideoId && (
                                <a
                                  href={route.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" /> Watch
                                </a>
                              )}
                            </div>

                            {editingRouteId === route.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editUrl}
                                  onChange={e => setEditUrl(e.target.value)}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="text-sm"
                                />
                                <Button
                                  size="icon"
                                  className="bg-emerald-500 hover:bg-emerald-600 shrink-0"
                                  onClick={() => handleSave(route.id)}
                                  disabled={updateRouteMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="shrink-0"
                                  onClick={handleCancel}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 truncate flex-1">
                                  {route.youtubeUrl || 'No URL set'}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 gap-1"
                                  onClick={() => handleEdit(route)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  {route.youtubeUrl ? 'Edit' : 'Add URL'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}