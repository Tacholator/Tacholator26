import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { MapPin, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function TestRouteSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null); // access record to cancel

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: accesses = [], isLoading } = useQuery({
    queryKey: ['userTestCentreAccesses', user?.id],
    queryFn: () => base44.entities.UserTestCentreAccess.filter({ userId: user.id }),
    enabled: !!user?.id,
  });

  const { data: centres = [] } = useQuery({
    queryKey: ['allNationalCentres'],
    queryFn: () => base44.entities.NationalTestCentre.list(),
  });

  const centreMap = Object.fromEntries(centres.map(c => [c.id, c]));

  const handleCancel = async (access) => {
    setCancellingId(access.id);
    const res = await base44.functions.invoke('cancelTestCentreSubscription', {
      accessId: access.id,
    });
    setCancellingId(null);
    if (res.data?.success) {
      toast({ title: 'Subscription cancelled', description: 'Your access will remain until the end of the current period.' });
      queryClient.invalidateQueries(['userTestCentreAccesses']);
    } else {
      toast({ title: 'Error', description: res.data?.error || 'Failed to cancel subscription.', variant: 'destructive' });
    }
    setConfirmCancel(null);
  };

  const statusBadge = (access) => {
    if (access.cancelAtPeriodEnd) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Cancels at period end</Badge>;
    if (access.status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
    if (access.status === 'expired') return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Expired</Badge>;
    if (access.status === 'cancelled') return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/TestRoutes">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#071739]">Test Route Subscriptions</h1>
            <p className="text-slate-500 text-sm">Manage your subscribed test centre routes</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#071739]" />
          </div>
        )}

        {!isLoading && accesses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No active subscriptions</p>
            <p className="text-slate-400 text-sm mt-1">Visit Test Routes to subscribe to a test centre.</p>
            <Link to="/TestRoutes">
              <Button className="mt-4 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-bold">Browse Test Routes</Button>
            </Link>
          </div>
        )}

        {!isLoading && accesses.length > 0 && (
          <div className="space-y-4">
            {accesses.map(access => {
              const centre = centreMap[access.testCentreId];
              return (
                <div key={access.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-[#071739]" />
                      <span className="font-semibold text-[#071739]">{centre?.name || 'Unknown Centre'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">{statusBadge(access)}</div>
                    {access.currentPeriodEndAt && (
                      <p className="text-slate-400 text-xs mt-2">
                        {access.cancelAtPeriodEnd ? 'Access ends' : 'Renews'}: {format(new Date(access.currentPeriodEndAt), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                  {access.status === 'active' && !access.cancelAtPeriodEnd && (
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => setConfirmCancel(access)}
                      disabled={cancellingId === access.id}
                    >
                      {cancellingId === access.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Subscription'}
                    </Button>
                  )}
                  {access.cancelAtPeriodEnd && (
                    <span className="text-xs text-amber-600 font-medium shrink-0">Cancelled — access until period end</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription to <strong>{centreMap[confirmCancel?.testCentreId]?.name}</strong>? You will retain access until the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleCancel(confirmCancel)}
              disabled={!!cancellingId}
            >
              {cancellingId ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}