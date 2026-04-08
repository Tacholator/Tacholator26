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
import { ArrowLeft, MapPin, Pencil, Check, X, PlayCircle, Plus, Trash2, Youtube } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function AdminTestRoutes() {
  const [creatingCity, setCreatingCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [creatingRoute, setCreatingRoute] = useState(null);
  const [newRouteName, setNewRouteName] = useState('');
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [expandedCityId, setExpandedCityId] = useState(null);
  const [deleteRouteId, setDeleteRouteId] = useState(null);
  const [deleteCityId, setDeleteCityId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['adminTestRoutes'],
    queryFn: async () => {
      const allRoutes = await base44.entities.TestRoute.list();
      return allRoutes.filter(r => !r.centreId && r.city).sort((a, b) => (a.routeNumber || 0) - (b.routeNumber || 0));
    }
  });

  const cities = Array.from(new Map(routes.map(r => [r.city, r.city])).values()).sort();
  const isLoading = routesLoading;

  const createCityMutation = useMutation({
    mutationFn: (city) => Promise.resolve({ success: true, city }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setNewCityName('');
      setCreatingCity(false);
      toast({ title: 'Success', description: 'City created. Add routes to it.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create city.', variant: 'destructive' });
    }
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (city) => {
      const cityRoutes = routes.filter(r => r.city === city);
      await Promise.all(cityRoutes.map(r => base44.entities.TestRoute.delete(r.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setDeleteCityId(null);
      toast({ title: 'Deleted', description: 'City and all its routes removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete city.', variant: 'destructive' });
    }
  });

  const createRouteMutation = useMutation({
    mutationFn: ({ name, city }) =>
      base44.entities.TestRoute.create({ routeName: name, city }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setNewRouteName('');
      setCreatingRoute(null);
      toast({ title: 'Success', description: 'Test route created.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create test route.', variant: 'destructive' });
    }
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, youtubeUrl, youtubeVideoId }) =>
      base44.entities.TestRoute.update(id, { youtubeUrl, youtubeVideoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setEditingRouteId(null);
      toast({ title: 'Saved', description: 'Video URL updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update video URL.', variant: 'destructive' });
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.TestRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setDeleteRouteId(null);
      toast({ title: 'Deleted', description: 'Test route removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete test route.', variant: 'destructive' });
    }
  });

  const extractVideoId = (url) => {
    if (!url) return '';
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const handleCreateCity = () => {
    if (!newCityName.trim()) return;
    if (cities.includes(newCityName.trim())) {
      toast({ title: 'Error', description: 'City already exists.', variant: 'destructive' });
      return;
    }
    createCityMutation.mutate(newCityName.trim());
  };

  const handleCreateRoute = (city) => {
    if (!newRouteName.trim()) return;
    createRouteMutation.mutate({ name: newRouteName.trim(), city });
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
          <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Routes</h1>
          <p className="text-slate-600">Organize test routes by city and manage video links.</p>
          <div className="flex gap-4 mt-4">
            <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">
              {cities.length} cities
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
              {routes.length} routes
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {totalWithVideo} with video
            </Badge>
          </div>
        </div>

        {/* Create city section */}
        <div className="mb-8">
          {creatingCity ? (
            <Card className="border-[#F7B602] border-2">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Input
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="Enter city name..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCity()}
                    autoFocus
                  />
                  <Button
                    onClick={handleCreateCity}
                    disabled={createCityMutation.isPending || !newCityName.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreatingCity(false);
                      setNewCityName('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setCreatingCity(true)}
              className="gap-2 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]"
            >
              <Plus className="w-4 h-4" />
              Create City
            </Button>
          )}
        </div>

        {/* Cities cards */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading cities...</div>
        ) : cities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No cities yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {cities.map(city => {
              const cityRoutes = routes.filter(r => r.city === city);
              return (
                <div key={city}>
                  <button
                    onClick={() => setExpandedCityId(expandedCityId === city ? null : city)}
                    className="w-full mb-4 p-4 rounded-lg border-2 border-[#F7B602] bg-gradient-to-r from-[#F7B602]/10 to-transparent hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-[#071739] group-hover:text-[#d99f02]">{city}</h2>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-slate-100 text-slate-700">{cityRoutes.length} route{cityRoutes.length !== 1 ? 's' : ''}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCityId(city);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </button>

                  {expandedCityId === city && (
                    <div className="space-y-4">
                      {creatingRoute === city && (
                        <Card className="border-[#F7B602] border-2 bg-slate-50">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <Input
                                value={newRouteName}
                                onChange={(e) => setNewRouteName(e.target.value)}
                                placeholder="Enter route name..."
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoute(city)}
                                autoFocus
                              />
                              <Button
                                onClick={() => handleCreateRoute(city)}
                                disabled={createRouteMutation.isPending || !newRouteName.trim()}
                                className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Create
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setCreatingRoute(null);
                                  setNewRouteName('');
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Button
                        onClick={() => setCreatingRoute(city)}
                        variant="outline"
                        className="gap-2 border-[#F7B602] text-[#F7B602] mb-3"
                        disabled={creatingRoute === city}
                      >
                        <Plus className="w-4 h-4" />
                        Add Route
                      </Button>

                      <div className="space-y-3">
                        {cityRoutes.map(route => (
                          <Card key={route.id} className="border border-slate-200 bg-white">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`w-28 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden ${route.youtubeVideoId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
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
                                        <PlayCircle className="w-7 h-7 text-white drop-shadow" />
                                      </div>
                                    </div>
                                  ) : (
                                    <Youtube className="w-6 h-6 text-slate-300" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-800">{route.routeName}</span>
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
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-rose-600 hover:bg-rose-50 h-8 w-8"
                                        onClick={() => setDeleteRouteId(route.id)}
                                      >
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete City Dialog */}
      <AlertDialog open={!!deleteCityId} onOpenChange={(open) => !open && setDeleteCityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteCityId} and all its test routes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCityMutation.mutate(deleteCityId)}
              disabled={deleteCityMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteCityMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Route Dialog */}
      <AlertDialog open={!!deleteRouteId} onOpenChange={(open) => !open && setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the test route. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRouteMutation.mutate(deleteRouteId)}
              disabled={deleteRouteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteRouteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}