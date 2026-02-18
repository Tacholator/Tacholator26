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
import { ArrowLeft, Plus, Youtube, Navigation, Trash2, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RouteCard from '@/components/testroutes/RouteCard';
import RouteDetailModal from '@/components/testroutes/RouteDetailModal';
import AddRouteModal from '@/components/testroutes/AddRouteModal';

export default function AdminTestRouteDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [showDeleteAreaDialog, setShowDeleteAreaDialog] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const centreId = urlParams.get('centreId');

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
          <div className="text-center py-12">Test route area not found</div>
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

        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#071739]">{centre.centreName}</h1>
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
              <p className="text-slate-600">{centre.subLocation}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => togglePublishMutation.mutate({ published: !centre.published })}
                variant={centre.published ? "outline" : "default"}
                className={!centre.published ? "bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]" : ""}
                disabled={togglePublishMutation.isPending}
              >
                {centre.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                onClick={() => setShowDeleteAreaDialog(true)}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Area
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#071739]">Routes</h2>
          <Button
            onClick={() => setShowAddRouteModal(true)}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
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
              <div key={route.id} className="relative">
                <RouteCard
                  route={route}
                  onClick={() => {
                    setSelectedRoute(route);
                    setShowRouteModal(true);
                  }}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRouteToDelete(route);
                  }}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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