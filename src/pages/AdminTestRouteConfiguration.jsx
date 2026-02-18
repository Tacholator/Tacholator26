import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Youtube, Navigation, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CreateTestRouteAreaModal from '@/components/testroutes/CreateTestRouteAreaModal';

export default function AdminTestRouteConfiguration() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['testRouteCentres'],
    queryFn: () => base44.entities.TestRouteCentre.list()
  });

  const createCentreMutation = useMutation({
    mutationFn: (data) => base44.entities.TestRouteCentre.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRouteCentres'] });
      setShowCreateModal(false);
      toast({
        title: 'Success',
        description: 'Test route area created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create test route area',
        variant: 'destructive'
      });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }) => 
      base44.entities.TestRouteCentre.update(id, { published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRouteCentres'] });
      toast({
        title: 'Success',
        description: 'Publication status updated'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update publication status',
        variant: 'destructive'
      });
    }
  });

  const handleCreateArea = (data) => {
    createCentreMutation.mutate(data);
  };

  const handleTogglePublish = (e, centre) => {
    e.preventDefault();
    e.stopPropagation();
    togglePublishMutation.mutate({
      id: centre.id,
      published: !centre.published
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading test routes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Route Configuration</h1>
              <p className="text-slate-600">
                Configure test centre routes, upload videos and manage GPS data before publishing
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Test Route Area
            </Button>
          </div>
        </div>

        {centres.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No test route areas yet</h3>
              <p className="text-slate-600 mb-6">
                Click "Add Test Route Area" to create your first test centre
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {centres.map(centre => (
              <Link key={centre.id} to={createPageUrl(`InstructorTestRouteDetail?centreId=${centre.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="flex items-start gap-2 flex-1">
                        <MapPin className="w-5 h-5 text-[#F7B602] mt-0.5 flex-shrink-0" />
                        <span>{centre.centreName}</span>
                      </CardTitle>
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Youtube className="w-4 h-4" />
                          <span>{centre.youtubeVideoId ? 'Video added' : 'No video'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          <span>{centre.gpsRouteUrl ? 'GPS added' : 'No GPS'}</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => handleTogglePublish(e, centre)}
                        variant={centre.published ? "outline" : "default"}
                        className={!centre.published ? "w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]" : "w-full"}
                        disabled={togglePublishMutation.isPending}
                      >
                        {centre.published ? 'Unpublish' : 'Publish'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <CreateTestRouteAreaModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={handleCreateArea}
          isLoading={createCentreMutation.isPending}
        />
      </div>
    </div>
  );
}