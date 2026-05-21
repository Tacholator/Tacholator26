import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Plus, Youtube, Navigation, Trash2, Globe, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import RouteCard from '@/components/testroutes/RouteCard';
import RouteDetailModal from '@/components/testroutes/RouteDetailModal';
import AddRouteModal from '@/components/testroutes/AddRouteModal';
import ConfigureRouteButton from '@/components/testroutes/ConfigureRouteButton';

export default function AdminTestRouteDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [showDeleteAreaDialog, setShowDeleteAreaDialog] = useState(false);
  const [isEditingMainCard, setIsEditingMainCard] = useState(false);
  const [editedCentreName, setEditedCentreName] = useState('');
  const [editedSubLocation, setEditedSubLocation] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const centreId = urlParams.get('centreId') || urlParams.get('centreid');

  const { data: centre, isLoading: centreLoading } = useQuery({
    queryKey: ['testRouteCentre', centreId],
    queryFn: async () => {
      const centres = await base44.entities.TestRouteCentre.filter({ id: centreId });
      return centres[0];
    },
    enabled: !!centreId
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['testRoutes', centreId],
    queryFn: () => base44.entities.TestRoute.filter({ centreId }),
    enabled: !!centreId
  });

  const createRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.TestRoute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRoutes', centreId] });
      setShowAddRouteModal(false);
      toast({
        title: 'Success',
        description: 'Route added successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add route',
        variant: 'destructive'
      });
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (routeId) => base44.entities.TestRoute.delete(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRoutes', centreId] });
      setRouteToDelete(null);
      setHasChanges(true);
      toast({
        title: 'Success',
        description: 'Route deleted successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete route',
        variant: 'destructive'
      });
    }
  });

  const deleteAreaMutation = useMutation({
    mutationFn: async () => {
      // Delete all routes first
      await Promise.all(routes.map(route => base44.entities.TestRoute.delete(route.id)));
      // Then delete the centre
      await base44.entities.TestRouteCentre.delete(centreId);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Test route area deleted successfully'
      });
      navigate(createPageUrl('AdminTestRouteConfiguration'));
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete test route area',
        variant: 'destructive'
      });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ published }) => 
      base44.entities.TestRouteCentre.update(centreId, { published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRouteCentre', centreId] });
      setHasChanges(false);
      toast({
        title: 'Success',
        description: 'Publication status updated'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update publication status',
        variant: 'destructive'
      });
    }
  });

  const updateCentreMutation = useMutation({
    mutationFn: (data) => base44.entities.TestRouteCentre.update(centreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRouteCentre', centreId] });
      setIsEditingMainCard(false);
      setHasChanges(true);
      toast({
        title: 'Success',
        description: 'Test route area updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update test route area',
        variant: 'destructive'
      });
    }
  });

  const handleAddRoute = (data) => {
    createRouteMutation.mutate({
      centreId,
      routeNumber: data.routeNumber,
      routeName: data.routeName
    });
  };

  const handleDeleteRoute = () => {
    if (routeToDelete) {
      deleteRouteMutation.mutate(routeToDelete.id);
    }
  };

  const handleDeleteArea = () => {
    deleteAreaMutation.mutate();
  };

  const handleEditMainCard = () => {
    setEditedCentreName(centre.centreName);
    setEditedSubLocation(centre.subLocation);
    setIsEditingMainCard(true);
  };

  const handleSaveMainCard = () => {
    if (!editedCentreName.trim() || !editedSubLocation.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }
    updateCentreMutation.mutate({
      centreName: editedCentreName,
      subLocation: editedSubLocation
    });
  };

  const handleCancelEdit = () => {
    setIsEditingMainCard(false);
    setEditedCentreName('');
    setEditedSubLocation('');
  };

  if (centreLoading || routesLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="max-w-2xl mx-auto mt-12">
            <CardContent className="py-12 text-center">
              <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Test route area not found</h3>
              <p className="text-slate-600 mb-6">
                This test route area may have been deleted or doesn't exist
              </p>
              <Button
                onClick={() => navigate(createPageUrl('AdminTestRouteConfiguration'))}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Configuration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sortedRoutes = [...routes].sort((a, b) => a.routeNumber - b.routeNumber);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('AdminTestRouteConfiguration'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configuration
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                {isEditingMainCard ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Test Centre Name</label>
                      <Input
                        value={editedCentreName}
                        onChange={(e) => setEditedCentreName(e.target.value)}
                        placeholder="Enter centre name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Sub-Location</label>
                      <Input
                        value={editedSubLocation}
                        onChange={(e) => setEditedSubLocation(e.target.value)}
                        placeholder="Enter sub-location"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-3xl">{centre.centreName}</CardTitle>
                      <Badge 
                        variant={centre.published ? "default" : "outline"}
                        className={centre.published ? "bg-green-100 text-green-800" : ""}
                      >
                        {centre.published ? (
                          <><Globe className="w-3 h-3 mr-1" /> Published</>
                        ) : (
                          'Draft'
                        )}
                      </Badge>
                    </div>
                    <CardDescription>{centre.subLocation}</CardDescription>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:min-w-[140px]">
                {isEditingMainCard ? (
                  <>
                    <Button
                      onClick={handleSaveMainCard}
                      className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                      disabled={updateCentreMutation.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={updateCentreMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleEditMainCard}
                      variant="outline"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Info
                    </Button>
                    <Button
                      onClick={() => {
                        if (centre.published && hasChanges) {
                          togglePublishMutation.mutate({ published: true });
                        } else {
                          togglePublishMutation.mutate({ published: !centre.published });
                        }
                      }}
                      variant={centre.published && !hasChanges ? "outline" : "default"}
                      className={!centre.published || hasChanges ? "bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]" : ""}
                      disabled={togglePublishMutation.isPending}
                    >
                      {centre.published && hasChanges ? 'Publish Changes' : centre.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteAreaDialog(true)}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Area
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#071739]">Routes</h2>
          <Button
            onClick={() => setShowAddRouteModal(true)}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        </div>

        {sortedRoutes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No routes yet</h3>
              <p className="text-slate-600">
                Click "Add Route" to create your first route
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedRoutes.map(route => (
              <div key={route.id} className="flex flex-col border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="flex-1">
                  <RouteCard
                    route={route}
                    onClick={() => {
                      setSelectedRoute(route);
                      setShowRouteModal(true);
                    }}
                  />
                </div>
                <div className="flex gap-2 p-3 border-t border-slate-100 bg-slate-50">
                  <div className="flex-1">
                    <ConfigureRouteButton
                      routeId={route.id}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['testRoutes', centreId] });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRouteToDelete(route);
                    }}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRoute && (
          <RouteDetailModal
            open={showRouteModal}
            onOpenChange={setShowRouteModal}
            route={selectedRoute}
            isAdmin={true}
          />
        )}

        <AddRouteModal
          open={showAddRouteModal}
          onOpenChange={setShowAddRouteModal}
          onSubmit={handleAddRoute}
          isLoading={createRouteMutation.isPending}
          existingRouteNumbers={routes.map(r => r.routeNumber)}
        />

        <AlertDialog open={!!routeToDelete} onOpenChange={() => setRouteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Route</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {routeToDelete?.routeName}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRoute}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteAreaDialog} onOpenChange={setShowDeleteAreaDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Test Route Area</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {centre.centreName}? This will also delete all {routes.length} route(s) within this area. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteArea}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Area
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}