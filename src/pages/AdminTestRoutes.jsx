import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Check, X, Plus, Trash2, Users, CreditCard, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function AdminTestRoutes() {
  const [creatingCity, setCreatingCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [deleteCityId, setDeleteCityId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: citiesData = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['testRouteCities'],
    queryFn: () => base44.entities.TestRouteCity.list()
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['adminTestRoutes'],
    queryFn: async () => {
      const allRoutes = await base44.entities.TestRoute.list();
      return allRoutes.filter(r => !r.centreId && r.city);
    }
  });

  const cities = citiesData.map(c => c.cityName).sort();
  const isLoading = citiesLoading || routesLoading;
  const totalWithVideo = routes.filter(r => r.youtubeVideoId).length;

  const createCityMutation = useMutation({
    mutationFn: (cityName) => base44.entities.TestRouteCity.create({ cityName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRouteCities'] });
      setNewCityName('');
      setCreatingCity(false);
      toast({ title: 'Success', description: 'City created. Click it to add routes.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create city.', variant: 'destructive' });
    }
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (city) => {
      const cityRoutes = routes.filter(r => r.city === city);
      await Promise.all(cityRoutes.map(r => base44.entities.TestRoute.delete(r.id)));
      const cityRecord = citiesData.find(c => c.cityName === city);
      if (cityRecord) await base44.entities.TestRouteCity.delete(cityRecord.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRouteCities'] });
      queryClient.invalidateQueries({ queryKey: ['adminTestRoutes'] });
      setDeleteCityId(null);
      toast({ title: 'Deleted', description: 'City and all its routes removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete city.', variant: 'destructive' });
    }
  });

  const handleCreateCity = () => {
    if (!newCityName.trim()) return;
    if (cities.includes(newCityName.trim())) {
      toast({ title: 'Error', description: 'City already exists.', variant: 'destructive' });
      return;
    }
    createCityMutation.mutate(newCityName.trim());
  };

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
          <p className="text-slate-600">Manage test routes, subscription plans and subscribers.</p>
        </div>

        <Tabs defaultValue="routes">
          <TabsList className="mb-6">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>

          {/* ── ROUTES TAB ── */}
          <TabsContent value="routes">
            <div className="flex gap-4 mb-6">
              <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">{citiesData.length} cities</Badge>
              <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">{routes.length} routes</Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">{totalWithVideo} with video</Badge>
            </div>

            {/* Create city */}
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
                      <Button onClick={handleCreateCity} disabled={createCityMutation.isPending || !newCityName.trim()} className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                        <Check className="w-4 h-4" /> Create
                      </Button>
                      <Button variant="outline" onClick={() => { setCreatingCity(false); setNewCityName(''); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button onClick={() => setCreatingCity(true)} className="gap-2 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]">
                  <Plus className="w-4 h-4" /> Create City
                </Button>
              )}
            </div>

            {/* Cities grid */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cities.map(city => {
                  const cityRoutes = routes.filter(r => r.city === city);
                  const videosCount = cityRoutes.filter(r => r.youtubeVideoId).length;
                  return (
                    <div key={city} className="relative group">
                      <Link to={`/AdminTestRouteCityDetail?city=${encodeURIComponent(city)}`}>
                        <div className="p-5 rounded-xl border-2 border-[#F7B602] bg-gradient-to-br from-[#F7B602]/10 to-white hover:shadow-lg transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-3">
                            <MapPin className="w-6 h-6 text-[#F7B602]" />
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#F7B602] transition-colors" />
                          </div>
                          <h2 className="text-lg font-bold text-[#071739] mb-3">{city}</h2>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-slate-100 text-slate-700 text-xs">{cityRoutes.length} routes</Badge>
                            <Badge className={videosCount === cityRoutes.length && cityRoutes.length > 0 ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
                              {videosCount}/{cityRoutes.length} videos
                            </Badge>
                          </div>
                        </div>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 text-rose-500 hover:bg-rose-50 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => { e.preventDefault(); setDeleteCityId(city); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── SUBSCRIPTION PLANS TAB ── */}
          <TabsContent value="plans">
            <Card>
              <CardContent className="py-16 text-center">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700 mb-2">Subscription Plans</p>
                <p className="text-slate-500">Subscription plan management coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SUBSCRIBERS TAB ── */}
          <TabsContent value="subscribers">
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700 mb-2">Subscribers</p>
                <p className="text-slate-500">Subscriber management coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete City Dialog */}
      <AlertDialog open={!!deleteCityId} onOpenChange={(open) => !open && setDeleteCityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteCityId}" and all its test routes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteCityMutation.mutate(deleteCityId)} disabled={deleteCityMutation.isPending} className="bg-rose-600 hover:bg-rose-700">
              {deleteCityMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}