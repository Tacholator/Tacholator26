import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Pencil, Check, X, PlayCircle, Plus, Trash2, Youtube } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function AdminTestRouteCityDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get('city') || '';

  const [creatingRoute, setCreatingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteUrl, setNewRouteUrl] = useState('');
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [deleteRouteId, setDeleteRouteId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['cityRoutes', city],
    queryFn: async () => {
      const allRoutes = await base44.entities.TestRoute.list();
      return allRoutes
        .filter(r => !r.centreId && r.city === city)
        .sort((a, b) => (a.routeNumber || 0) - (b.routeNumber || 0));
    },
    enabled: !!city
  });

  const createRouteMutation = useMutation({
    mutationFn: ({ name, youtubeUrl, youtubeVideoId }) =>
      base44.entities.TestRoute.create({ routeName: name, city, youtubeUrl, youtubeVideoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cityRoutes', city] });
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setNewRouteName('');
      setNewRouteUrl('');
      setCreatingRoute(false);
      toast({ title: 'Success', description: 'Route created.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create route.', variant: 'destructive' })
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, youtubeUrl, youtubeVideoId }) =>
      base44.entities.TestRoute.update(id, { youtubeUrl, youtubeVideoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cityRoutes', city] });
      setEditingRouteId(null);
      toast({ title: 'Saved', description: 'Video URL updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update video URL.', variant: 'destructive' })
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.TestRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cityRoutes', city] });
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setDeleteRouteId(null);
      toast({ title: 'Deleted', description: 'Route removed.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete route.', variant: 'destructive' })
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

  const totalWithVideo = routes.filter(r => r.youtubeVideoId).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl('AdminTestRoutes')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Test Routes
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-7 h-7 text-[#F7B602]" />
            <h1 className="text-3xl font-bold text-[#071739]">{city}</h1>
          </div>
          <p className="text-slate-600">Manage test routes and video links for {city}.</p>
          <div className="flex gap-4 mt-4">
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">{routes.length} routes</Badge>
            <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">{totalWithVideo} with video</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">{routes.length - totalWithVideo} missing video</Badge>
          </div>
        </div>

        {/* Add route button */}
        <div className="mb-6">
          {creatingRoute ? (
            <Card className="border-[#F7B602] border-2">
              <CardContent className="p-4 space-y-3">
                <Input
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="Route name (e.g. Route 1 - Town Centre)..."
                  autoFocus
                />
                <Input
                  value={newRouteUrl}
                  onChange={(e) => setNewRouteUrl(e.target.value)}
                  placeholder="YouTube URL (optional, e.g. https://www.youtube.com/watch?v=...)"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const videoId = extractVideoId(newRouteUrl);
                      createRouteMutation.mutate({ name: newRouteName.trim(), youtubeUrl: newRouteUrl, youtubeVideoId: videoId });
                    }}
                    disabled={createRouteMutation.isPending || !newRouteName.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                  >
                    <Check className="w-4 h-4" /> Save Route
                  </Button>
                  <Button variant="outline" onClick={() => { setCreatingRoute(false); setNewRouteName(''); setNewRouteUrl(''); }}>
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setCreatingRoute(true)} className="gap-2 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]">
              <Plus className="w-4 h-4" />
              Add Route
            </Button>
          )}
        </div>

        {/* Routes list */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading routes...</div>
        ) : routes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No routes yet. Add one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {routes.map(route => (
              <Card key={route.id} className="border border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div
                      className={`w-32 h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden ${route.youtubeVideoId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      onClick={() => route.youtubeVideoId && setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                    >
                      {route.youtubeVideoId ? (
                        <div className="relative w-full h-full">
                          <img
                            src={`https://img.youtube.com/vi/${route.youtubeVideoId}/mqdefault.jpg`}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <PlayCircle className="w-8 h-8 text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <Youtube className="w-7 h-7 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-base">{route.routeName}</span>
                          {route.youtubeVideoId ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Video added</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-slate-500">No video</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {route.youtubeVideoId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-blue-600 gap-1 h-7 px-2"
                              onClick={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              {expandedRouteId === route.id ? 'Hide' : 'Watch'}
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50 h-8 w-8" onClick={() => setDeleteRouteId(route.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {editingRouteId === route.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="text-sm"
                            autoFocus
                          />
                          <Button size="icon" className="bg-emerald-500 hover:bg-emerald-600 shrink-0" onClick={() => handleSave(route.id)} disabled={updateRouteMutation.isPending}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="shrink-0" onClick={() => { setEditingRouteId(null); setEditUrl(''); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 truncate flex-1">{route.youtubeUrl || 'No URL set'}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1"
                            onClick={() => { setEditingRouteId(route.id); setEditUrl(route.youtubeUrl || ''); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {route.youtubeUrl ? 'Edit URL' : 'Add URL'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedRouteId === route.id && route.youtubeVideoId && (
                    <div className="mt-4 rounded-lg overflow-hidden w-full relative" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${route.youtubeVideoId}?autoplay=1`}
                        title={route.routeName}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteRouteId} onOpenChange={(open) => !open && setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this test route. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRouteMutation.mutate(deleteRouteId)} disabled={deleteRouteMutation.isPending} className="bg-rose-600 hover:bg-rose-700">
              {deleteRouteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}