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
import { ArrowLeft, MapPin, Check, X, Plus, Trash2, Users, CreditCard, ChevronRight, Flag } from 'lucide-react';
import NationalCentresList from '@/components/testroutes/NationalCentresList';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export default function AdminTestRoutes() {
  const [deleteCityId, setDeleteCityId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: citiesData = [] } = useQuery({
    queryKey: ['testRouteCities'],
    queryFn: () => base44.entities.TestRouteCity.list()
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['adminTestRoutes'],
    queryFn: async () => {
      const allRoutes = await base44.entities.TestRoute.list();
      return allRoutes.filter(r => !r.centreId && r.city);
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

        <Tabs defaultValue="national">
          <TabsList className="mb-6 bg-[#071739] p-1">
            <TabsTrigger value="national" className="text-slate-300 data-[state=active]:bg-[#F7B602] data-[state=active]:text-[#071739] data-[state=active]:font-semibold">National Centres</TabsTrigger>
            <TabsTrigger value="plans" className="text-slate-300 data-[state=active]:bg-[#F7B602] data-[state=active]:text-[#071739] data-[state=active]:font-semibold">Subscription Plans</TabsTrigger>
            <TabsTrigger value="subscribers" className="text-slate-300 data-[state=active]:bg-[#F7B602] data-[state=active]:text-[#071739] data-[state=active]:font-semibold">Subscribers</TabsTrigger>
          </TabsList>

          {/* ── NATIONAL CENTRES TAB ── */}
          <TabsContent value="national">
            <NationalCentresList />
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