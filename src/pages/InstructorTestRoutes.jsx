import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Youtube, Trash2, X } from 'lucide-react';
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

export default function InstructorTestRoutes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState({ centreName: '', subLocation: '' });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['myTestRouteCentres', user?.id],
    queryFn: () => base44.entities.TestRouteCentre.filter({ createdByInstructorId: user.id }),
    enabled: !!user?.id
  });

  const createCentreMutation = useMutation({
    mutationFn: (data) => base44.entities.TestRouteCentre.create({
      ...data,
      createdByInstructorId: user.id,
      published: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTestRouteCentres', user?.id]);
      setShowCreateForm(false);
      setFormData({ centreName: '', subLocation: '' });
      toast({ title: 'Test centre created' });
    }
  });

  const deleteCentreMutation = useMutation({
    mutationFn: async (centreId) => {
      const routes = await base44.entities.TestRoute.filter({ centreId });
      await Promise.all(routes.map(r => base44.entities.TestRoute.delete(r.id)));
      return base44.entities.TestRouteCentre.delete(centreId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myTestRouteCentres', user?.id]);
      setDeleteTargetId(null);
      toast({ title: 'Test centre deleted' });
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.centreName.trim() || !formData.subLocation.trim()) return;
    createCentreMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6 text-center py-12 text-slate-500">Loading test routes...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#071739] mb-1">Test Routes</h1>
            <p className="text-slate-600">Manage your test centres and route videos for pupils</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test Centre
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6 border-[#F7B602] border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>New Test Centre</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Test Centre Name</Label>
                    <Input
                      placeholder="e.g. Birmingham Test Centre"
                      value={formData.centreName}
                      onChange={(e) => setFormData({ ...formData, centreName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Area / Sub-location</Label>
                    <Input
                      placeholder="e.g. Kingstanding"
                      value={formData.subLocation}
                      onChange={(e) => setFormData({ ...formData, subLocation: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCentreMutation.isPending}
                    className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  >
                    {createCentreMutation.isPending ? 'Creating...' : 'Create Centre'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {centres.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No test centres yet</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Create a test centre and add YouTube videos for each route so your pupils can watch and prepare
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Test Centre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {centres.map(centre => (
              <Card key={centre.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-start gap-2 text-base">
                      <MapPin className="w-5 h-5 text-[#F7B602] mt-0.5 flex-shrink-0" />
                      <span>{centre.centreName}</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-slate-400 hover:text-rose-500 h-8 w-8"
                      onClick={() => setDeleteTargetId(centre.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription>{centre.subLocation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={createPageUrl(`InstructorTestRouteDetail?centreId=${centre.id}`)}>
                    <Button className="w-full bg-[#071739] hover:bg-[#0a2142] text-white" size="sm">
                      <Youtube className="w-4 h-4 mr-2" />
                      Manage Routes & Videos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Centre?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this test centre and all its routes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCentreMutation.mutate(deleteTargetId)}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={deleteCentreMutation.isPending}
            >
              {deleteCentreMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}