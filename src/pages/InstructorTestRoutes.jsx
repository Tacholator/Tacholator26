import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Youtube, Plus, Trash2, Users, Video, ExternalLink, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
    /youtube\.com\/embed\/([^&?/]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

export default function InstructorTestRoutes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoute, setNewRoute] = useState({ routeName: '', youtubeUrl: '' });
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingUrl, setEditingUrl] = useState({});
  const [editingName, setEditingName] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['myTestRoutes', user?.id],
    queryFn: () => base44.entities.TestRoute.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['myPupils', user?.id],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const activePupils = pupils.filter(p => p.status === 'Active');

  const addRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.TestRoute.create({
      ...data,
      instructorId: user.id,
      youtubeVideoId: extractYouTubeId(data.youtubeUrl)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTestRoutes', user?.id]);
      setShowAddForm(false);
      setNewRoute({ routeName: '', youtubeUrl: '' });
      toast({ title: 'Route video added' });
    }
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TestRoute.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTestRoutes', user?.id]);
      toast({ title: 'Route updated' });
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.TestRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTestRoutes', user?.id]);
      setDeleteTargetId(null);
      toast({ title: 'Route deleted' });
    }
  });

  const togglePupilAccessMutation = useMutation({
    mutationFn: ({ pupilId, enabled }) => base44.entities.Pupil.update(pupilId, { testRoutesAccessEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPupils', user?.id]);
    }
  });

  const handleSaveUrl = (routeId) => {
    const url = editingUrl[routeId] ?? '';
    updateRouteMutation.mutate({
      id: routeId,
      data: { youtubeUrl: url, youtubeVideoId: extractYouTubeId(url) }
    });
    setEditingUrl(prev => {
      const updated = { ...prev };
      delete updated[routeId];
      return updated;
    });
  };

  const handleSaveName = (routeId) => {
    const name = editingName[routeId]?.trim();
    if (!name) return;
    updateRouteMutation.mutate({ id: routeId, data: { routeName: name } });
    setEditingName(prev => {
      const updated = { ...prev };
      delete updated[routeId];
      return updated;
    });
  };

  const handleAddRoute = (e) => {
    e.preventDefault();
    if (!newRoute.routeName.trim()) return;
    addRouteMutation.mutate(newRoute);
  };

  const enabledCount = activePupils.filter(p => p.testRoutesAccessEnabled).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#071739] mb-1">Test Route Videos</h1>
            <p className="text-sm sm:text-base text-slate-600">Add YouTube videos for your test routes and control which pupils can see them</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        </div>

        {/* Add Route Form */}
        {showAddForm && (
          <Card className="border-[#F7B602] border-2">
            <CardHeader>
              <CardTitle className="text-base">Add New Route Video</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRoute} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Route Name</Label>
                    <Input
                      placeholder="e.g. Birmingham Route 1"
                      value={newRoute.routeName}
                      onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>YouTube URL</Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={newRoute.youtubeUrl}
                      onChange={(e) => setNewRoute({ ...newRoute, youtubeUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    disabled={addRouteMutation.isPending}
                    className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  >
                    {addRouteMutation.isPending ? 'Adding...' : 'Add Route'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Routes Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#071739] mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#F7B602]" />
            Route Videos ({routes.length})
          </h2>

          {routesLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : routes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Youtube className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No route videos yet</p>
                <p className="text-sm text-slate-400 mt-1">Click "Add Route" to add your first test route video</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {routes.map(route => {
                const isEditingThis = editingUrl[route.id] !== undefined;
                const currentUrl = isEditingThis ? editingUrl[route.id] : (route.youtubeUrl || '');
                const videoId = extractYouTubeId(currentUrl) || route.youtubeVideoId;

                return (
                  <Card key={route.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Thumbnail */}
                        <div className="w-full md:w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          {videoId ? (
                            <img
                              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                              alt={route.routeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Youtube className="w-8 h-8 text-slate-300" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            {editingName[route.id] !== undefined ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editingName[route.id]}
                                  onChange={(e) => setEditingName(prev => ({ ...prev, [route.id]: e.target.value }))}
                                  className="h-8 text-sm font-semibold"
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(route.id); if (e.key === 'Escape') setEditingName(prev => { const u = {...prev}; delete u[route.id]; return u; }); }}
                                />
                                <Button size="sm" onClick={() => handleSaveName(route.id)} disabled={updateRouteMutation.isPending} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] h-8">Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingName(prev => { const u = {...prev}; delete u[route.id]; return u; })} className="h-8">Cancel</Button>
                              </div>
                            ) : (
                              <h3 className="font-semibold text-[#071739]">
                                {route.routeName}
                              </h3>
                            )}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {videoId && (
                                <a href={route.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#071739]">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#F7B602]" onClick={() => setEditingName(prev => ({ ...prev, [route.id]: route.routeName }))}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500" onClick={() => setDeleteTargetId(route.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs text-slate-500">YouTube URL</Label>
                              <Input
                                placeholder="https://youtube.com/watch?v=..."
                                value={currentUrl}
                                onChange={(e) => setEditingUrl(prev => ({ ...prev, [route.id]: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            {isEditingThis && (
                              <Button size="sm" onClick={() => handleSaveUrl(route.id)} disabled={updateRouteMutation.isPending} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] h-8">
                                Save
                              </Button>
                            )}
                          </div>

                          {!videoId && (
                            <p className="text-xs text-amber-600">No video URL set yet</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pupil Access Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#071739] mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F7B602]" />
            Pupil Access
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {enabledCount} of {activePupils.length} pupils have access · Toggle to grant or revoke access to your route videos
          </p>

          {activePupils.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-400 text-sm">
                No active pupils found
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {activePupils.map(pupil => (
                    <div key={pupil.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                          {pupil.firstName?.[0]}{pupil.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{pupil.firstName} {pupil.lastName}</p>
                          <p className="text-xs text-slate-400">{pupil.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {pupil.testRoutesAccessEnabled && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Access granted</Badge>
                        )}
                        <Switch
                          checked={!!pupil.testRoutesAccessEnabled}
                          onCheckedChange={(checked) => togglePupilAccessMutation.mutate({ pupilId: pupil.id, enabled: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>This route video will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRouteMutation.mutate(deleteTargetId)}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={deleteRouteMutation.isPending}
            >
              {deleteRouteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}