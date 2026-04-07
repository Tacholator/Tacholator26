import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Trash2, CheckCircle2, Loader2, Clock, UserX, History, UserMinus } from 'lucide-react';
import moment from 'moment';

export default function AdminDeletionRequests() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(null); // stores the request to delete

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deletionRequests'],
    queryFn: () => base44.entities.DeletionRequest.list('-created_date')
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => base44.entities.DeletionRequest.update(id, { status: 'resolved' }),
    onSuccess: () => queryClient.invalidateQueries(['deletionRequests'])
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.DeletionRequest.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['deletionRequests'])
  });

  // Delete the user AND resolve/remove the deletion request
  const deleteUserMutation = useMutation({
    mutationFn: async ({ requestId, userId }) => {
      if (userId) {
        await base44.entities.User.delete(userId);
      }
      await base44.entities.DeletionRequest.update(requestId, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deletionRequests']);
      setConfirmDelete(null);
    }
  });

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status === 'resolved');

  const RequestCard = ({ req, showActions }) => (
    <Card className={`border ${req.status === 'pending' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800">{req.userName || 'Unknown'}</p>
              <Badge className={req.status === 'pending' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-green-100 text-green-700 border-green-200'}>
                {req.status === 'pending' ? 'Pending' : 'Resolved'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{req.userEmail}</p>
            {req.userId && <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {req.userId}</p>}
            <p className="text-sm text-slate-700 mt-2"><span className="font-medium">Reason:</span> {req.reason}</p>
            {req.additionalInfo && (
              <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Details:</span> {req.additionalInfo}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {moment(req.created_date).format('D MMM YYYY, h:mm a')}
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => resolveMutation.mutate(req.id)}
                disabled={resolveMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-rose-500 text-rose-700 hover:bg-rose-50 font-medium"
                onClick={() => setConfirmDelete(req)}
              >
                <UserMinus className="w-4 h-4 mr-1" />
                Delete User
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-rose-500"
                onClick={() => deleteRequestMutation.mutate(req.id)}
                disabled={deleteRequestMutation.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#071739]">Account Deletion Requests</h1>
        <p className="text-slate-500 mt-1">Users who have requested their accounts to be deleted</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#F7B602]" />
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserX className="w-4 h-4" />
              Pending
              {pending.length > 0 && (
                <Badge className="ml-1 bg-rose-500 text-white text-xs px-1.5 h-4">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Resolved ({resolved.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Log History ({requests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pending.map(req => <RequestCard key={req.id} req={req} showActions={true} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            {resolved.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">No resolved requests yet.</p>
            ) : (
              <div className="space-y-3">
                {resolved.map(req => <RequestCard key={req.id} req={req} showActions={false} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-1">
              {requests.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">No requests recorded yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-4 pl-10">
                    {requests.map((req) => (
                      <div key={req.id} className="relative">
                        <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-white mt-1 ${req.status === 'pending' ? 'bg-rose-400' : 'bg-green-400'}`} />
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-800">{req.userName || 'Unknown'}</span>
                            <Badge className={req.status === 'pending' ? 'bg-rose-100 text-rose-700 border-rose-200 text-xs' : 'bg-green-100 text-green-700 border-green-200 text-xs'}>
                              {req.status === 'pending' ? 'Pending' : 'Resolved'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{req.userEmail}</p>
                          <p className="text-sm text-slate-700"><span className="font-medium">Reason:</span> {req.reason}</p>
                          {req.additionalInfo && (
                            <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Notes:</span> {req.additionalInfo}</p>
                          )}
                          <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            Submitted {moment(req.created_date).fromNow()} — {moment(req.created_date).format('D MMM YYYY, h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Confirm Delete User Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{confirmDelete?.userName || confirmDelete?.userEmail}</strong>'s account from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate({ requestId: confirmDelete.id, userId: confirmDelete.userId })}
              disabled={deleteUserMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteUserMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
              ) : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}