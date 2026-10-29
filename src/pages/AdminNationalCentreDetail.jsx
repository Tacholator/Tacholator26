import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { buildExitDirectionGroups } from '@/lib/routeGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Pencil, Check, X, PlayCircle, Plus, Trash2, Youtube, Navigation, Upload, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const extractVideoId = (url) => {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : '';
};

export default function AdminNationalCentreDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const centreName = urlParams.get('centre') || '';

  const [creatingRoute, setCreatingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteUrl, setNewRouteUrl] = useState('');
  const [newExitDirection, setNewExitDirection] = useState('left');
  const [newGpsType, setNewGpsType] = useState('gpx_url');
  const [newGpsUrl, setNewGpsUrl] = useState('');
  const [newGpsUploading, setNewGpsUploading] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [editGpsType, setEditGpsType] = useState('gpx_url');
  const [editGpsUrl, setEditGpsUrl] = useState('');
  const [editGpsUploading, setEditGpsUploading] = useState(false);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editName, setEditName] = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [deleteRouteId, setDeleteRouteId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['nationalCentreRoutes', centreName],
    queryFn: async () => {
      const allRoutes = await base44.entities.TestRoute.list();
      return allRoutes
        .filter(r => r.city === centreName && !r.centreId)
        .sort((a, b) => (a.routeNumber || 0) - (b.routeNumber || 0));
    },
    enabled: !!centreName
  });

  const handleGpsFileUpload = async (file, setter, setUploading) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setter(file_url);
    setUploading(false);
  };

  const createRouteMutation = useMutation({
    mutationFn: ({ name, youtubeUrl, youtubeVideoId, gpsRouteType, gpsRouteUrl, exitDirection }) =>
      base44.entities.TestRoute.create({ routeName: name, city: centreName, exitDirection, youtubeUrl, youtubeVideoId, gpsRouteType: gpsRouteUrl ? gpsRouteType : undefined, gpsRouteUrl: gpsRouteUrl || undefined }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['nationalCentreRoutes', centreName] });
      queryClient.refetchQueries({ queryKey: ['nationalTestCentres'] });
      queryClient.refetchQueries({ queryKey: ['allTestRoutes'] });
      setNewRouteName('');
      setNewRouteUrl('');
      setNewExitDirection('left');
      setNewGpsType('gpx_url');
      setNewGpsUrl('');
      setCreatingRoute(false);
      toast({ title: 'Success', description: 'Route created.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create route.', variant: 'destructive' })
  });

  const updateDirectionMutation = useMutation({
    mutationFn: ({ id, exitDirection }) =>
      base44.entities.TestRoute.update(id, { exitDirection: exitDirection || null }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['nationalCentreRoutes', centreName] });
      queryClient.refetchQueries({ queryKey: ['allTestRoutes'] });
      toast({ title: 'Saved', description: 'Route category updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update route category.', variant: 'destructive' })
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ id, routeName }) =>
      base44.entities.TestRoute.update(id, { routeName }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['nationalCentreRoutes', centreName] });
      setEditingNameId(null);
      toast({ title: 'Saved', description: 'Route name updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update route name.', variant: 'destructive' })
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, youtubeUrl, youtubeVideoId, gpsRouteType, gpsRouteUrl }) =>
      base44.entities.TestRoute.update(id, { youtubeUrl, youtubeVideoId, gpsRouteType: gpsRouteUrl ? gpsRouteType : undefined, gpsRouteUrl: gpsRouteUrl || undefined }),
    onSuccess: (_, variables) => {
      queryClient.refetchQueries({ queryKey: ['nationalCentreRoutes', centreName] });
      queryClient.refetchQueries({ queryKey: ['allTestRoutes'] });
      setEditingRouteId(null);
      toast({ title: 'Saved', description: 'Route updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update video URL.', variant: 'destructive' })
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.TestRoute.delete(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['nationalCentreRoutes', centreName] });
      queryClient.refetchQueries({ queryKey: ['allTestRoutes'] });
      setDeleteRouteId(null);
      toast({ title: 'Deleted', description: 'Route removed.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete route.', variant: 'destructive' })
  });

  const totalWithVideo = routes.filter(r => r.youtubeVideoId).length;

  const routeGroups = buildExitDirectionGroups(routes);

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
            <h1 className="text-3xl font-bold text-[#071739]">{centreName}</h1>
          </div>
          <p className="text-slate-600">Manage test route videos for {centreName}.</p>
          <div className="flex gap-4 mt-4">
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">{routes.length} routes</Badge>
            <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">{totalWithVideo} with video</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">{routes.length - totalWithVideo} missing video</Badge>
          </div>
        </div>

        {/* Add route */}
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
                  placeholder="YouTube URL (optional)"
                />
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Leaving the test centre</Label>
                  <Select value={newExitDirection} onValueChange={setNewExitDirection}>
                    <SelectTrigger className="h-8 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left from Test centre</SelectItem>
                      <SelectItem value="right">Right turn from Test centre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* GPS Route Section */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Navigation className="w-3.5 h-3.5" /> GPS Route (optional)</Label>
                  <Select value={newGpsType} onValueChange={setNewGpsType}>
                    <SelectTrigger className="h-8 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpx_url">GPX File URL</SelectItem>
                      <SelectItem value="geojson_url">GeoJSON File URL</SelectItem>
                      <SelectItem value="external_map_url">External Map URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      value={newGpsUrl}
                      onChange={(e) => setNewGpsUrl(e.target.value)}
                      placeholder={newGpsType === 'external_map_url' ? 'https://...' : 'Paste URL or upload file below'}
                      className="text-sm h-8 bg-white"
                    />
                    {newGpsType !== 'external_map_url' && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept={newGpsType === 'gpx_url' ? '.gpx' : '.geojson,.json'}
                          className="hidden"
                          onChange={(e) => handleGpsFileUpload(e.target.files[0], setNewGpsUrl, setNewGpsUploading)}
                        />
                        <div className={`h-8 px-3 flex items-center gap-1 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-100 transition-colors ${newGpsUploading ? 'opacity-50' : ''}`}>
                          <Upload className="w-3.5 h-3.5" />
                          {newGpsUploading ? 'Uploading...' : 'Upload'}
                        </div>
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const videoId = extractVideoId(newRouteUrl);
                      createRouteMutation.mutate({ name: newRouteName.trim(), youtubeUrl: newRouteUrl, youtubeVideoId: videoId, gpsRouteType: newGpsType, gpsRouteUrl: newGpsUrl, exitDirection: newExitDirection });
                    }}
                    disabled={createRouteMutation.isPending || !newRouteName.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                  >
                    <Check className="w-4 h-4" /> Save Route
                  </Button>
                  <Button variant="outline" onClick={() => { setCreatingRoute(false); setNewRouteName(''); setNewRouteUrl(''); setNewExitDirection('left'); setNewGpsUrl(''); setNewGpsType('gpx_url'); }}>
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setCreatingRoute(true)} className="gap-2 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]">
              <Plus className="w-4 h-4" /> Add Route
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
          <div className="space-y-8">
            {routeGroups.map(group => group.routes.length === 0 ? null : (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <h2 className="text-lg font-semibold text-[#071739]">{group.label}</h2>
                  <Badge className="bg-slate-200 text-slate-700 text-xs">{group.routes.length}</Badge>
                </div>
                <div className="space-y-4">
            {group.routes.map(route => (
              <Card key={route.id} className="border border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-32 h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden ${route.youtubeVideoId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      onClick={() => route.youtubeVideoId && setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                    >
                      {route.youtubeVideoId ? (
                        <div className="relative w-full h-full">
                          <img
                            src={`https://img.youtube.com/vi/${route.youtubeVideoId}/hqdefault.jpg`}
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
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {editingNameId === route.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="text-sm h-8"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') updateNameMutation.mutate({ id: route.id, routeName: editName.trim() });
                                  if (e.key === 'Escape') { setEditingNameId(null); setEditName(''); }
                                }}
                              />
                              <Button size="icon" className="bg-emerald-500 hover:bg-emerald-600 h-8 w-8 shrink-0" onClick={() => updateNameMutation.mutate({ id: route.id, routeName: editName.trim() })} disabled={updateNameMutation.isPending || !editName.trim()}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => { setEditingNameId(null); setEditName(''); }}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-800 text-base truncate">{route.routeName}</span>
                              <button onClick={() => { setEditingNameId(route.id); setEditName(route.routeName || ''); }} className="text-slate-400 hover:text-[#071739] transition-colors shrink-0">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {!editingNameId && (
                            route.youtubeVideoId ? (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs shrink-0">Video added</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-slate-500 shrink-0">No video</Badge>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={route.exitDirection || 'none'}
                            onValueChange={(value) => updateDirectionMutation.mutate({ id: route.id, exitDirection: value === 'none' ? null : value })}
                          >
                            <SelectTrigger className="h-7 w-[108px] text-xs bg-white">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="none">Not set</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <div className="space-y-2">
                          <Input
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="text-sm"
                            autoFocus
                          />
                          {/* GPS Route Edit */}
                          <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Navigation className="w-3.5 h-3.5" /> GPS Route (optional)</Label>
                            <Select value={editGpsType} onValueChange={setEditGpsType}>
                              <SelectTrigger className="h-8 text-sm bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gpx_url">GPX File URL</SelectItem>
                                <SelectItem value="geojson_url">GeoJSON File URL</SelectItem>
                                <SelectItem value="external_map_url">External Map URL</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Input
                                value={editGpsUrl}
                                onChange={e => setEditGpsUrl(e.target.value)}
                                placeholder={editGpsType === 'external_map_url' ? 'https://...' : 'Paste URL or upload file below'}
                                className="text-sm h-8 bg-white"
                              />
                              {editGpsType !== 'external_map_url' && (
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept={editGpsType === 'gpx_url' ? '.gpx' : '.geojson,.json'}
                                    className="hidden"
                                    onChange={(e) => handleGpsFileUpload(e.target.files[0], setEditGpsUrl, setEditGpsUploading)}
                                  />
                                  <div className={`h-8 px-3 flex items-center gap-1 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-100 transition-colors ${editGpsUploading ? 'opacity-50' : ''}`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    {editGpsUploading ? 'Uploading...' : 'Upload'}
                                  </div>
                                </label>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 gap-1" onClick={() => {
                              const videoId = extractVideoId(editUrl);
                              updateRouteMutation.mutate({ id: route.id, youtubeUrl: editUrl, youtubeVideoId: videoId, gpsRouteType: editGpsType, gpsRouteUrl: editGpsUrl });
                            }} disabled={updateRouteMutation.isPending}>
                              <Check className="w-4 h-4" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditingRouteId(null); setEditUrl(''); setEditGpsUrl(''); setEditGpsType('gpx_url'); }}>
                              <X className="w-4 h-4" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-500 truncate block">{route.youtubeUrl || 'No URL set'}</span>
                            {route.gpsRouteUrl && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><Navigation className="w-3 h-3" /> GPS route configured</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1"
                            onClick={() => { setEditingRouteId(route.id); setEditUrl(route.youtubeUrl || ''); setEditGpsType(route.gpsRouteType || 'gpx_url'); setEditGpsUrl(route.gpsRouteUrl || ''); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {route.youtubeUrl ? 'Edit' : 'Add'}
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