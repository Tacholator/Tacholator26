import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TestRoutesSection({ pupilId, isInstructorView = true }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    routeNumber: 1,
    routeDetails: '',
    comments: ''
  });

  const { data: testRoutes = [] } = useQuery({
    queryKey: ['testRoutes', pupilId],
    queryFn: () => base44.entities.TestRoute.filter({ pupilId }).then(r => r.sort((a, b) => a.routeNumber - b.routeNumber)),
    enabled: !!pupilId
  });

  const saveRouteMutation = useMutation({
    mutationFn: (data) => {
      if (editingRoute) {
        return base44.entities.TestRoute.update(editingRoute.id, data);
      }
      return base44.entities.TestRoute.create({ ...data, pupilId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testRoutes', pupilId]);
      setShowModal(false);
      setEditingRoute(null);
      toast({ title: 'Test route saved' });
    }
  });

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      routeNumber: route.routeNumber,
      routeDetails: route.routeDetails || '',
      comments: route.comments || ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    const nextRouteNumber = testRoutes.length > 0 ? Math.max(...testRoutes.map(r => r.routeNumber)) + 1 : 1;
    setEditingRoute(null);
    setFormData({
      routeNumber: nextRouteNumber,
      routeDetails: '',
      comments: ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    saveRouteMutation.mutate(formData);
  };

  return (
    <>
      <div className="space-y-4">
        {isInstructorView && (
          <Button onClick={handleAddNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Test Route
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testRoutes.map((route) => (
            <Card key={route.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-800">Route {route.routeNumber}</h4>
                  </div>
                  {isInstructorView && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(route)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {route.routeDetails && (
                  <p className="text-sm text-slate-600 mb-2">{route.routeDetails}</p>
                )}
                {route.comments && (
                  <p className="text-xs text-slate-500 italic">{route.comments}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Edit' : 'Add'} Test Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Route Number</Label>
              <input
                type="number"
                value={formData.routeNumber}
                onChange={(e) => setFormData({ ...formData, routeNumber: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <Label>Route Details</Label>
              <Textarea
                value={formData.routeDetails}
                onChange={(e) => setFormData({ ...formData, routeDetails: e.target.value })}
                placeholder="Describe the test route..."
                rows={4}
              />
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveRouteMutation.isPending}>
              {saveRouteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}