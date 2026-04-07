import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function AdminDeletionRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deletionRequests'],
    queryFn: () => base44.entities.DeletionRequest.list('-created_date')
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => base44.entities.DeletionRequest.update(id, { status: 'resolved' }),
    onSuccess: () => queryClient.invalidateQueries(['deletionRequests'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeletionRequest.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['deletionRequests'])
  });

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status === 'resolved');

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
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-slate-400 text-sm">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pending.map(req => (
                  <Card key={req.id} className="border border-rose-200 bg-rose-50/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{req.userName || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">{req.userEmail}</p>
                          <p className="text-sm text-slate-700 mt-2"><span className="font-medium">Reason:</span> {req.reason}</p>
                          {req.additionalInfo && (
                            <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Details:</span> {req.additionalInfo}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">{moment(req.created_date).format('D MMM YYYY, h:mm a')}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
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
                            className="border-rose-300 text-rose-700 hover:bg-rose-50"
                            onClick={() => deleteMutation.mutate(req.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {resolved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Resolved ({resolved.length})
              </h2>
              <div className="space-y-3">
                {resolved.map(req => (
                  <Card key={req.id} className="border border-slate-200 opacity-70">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800">{req.userName || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">{req.userEmail}</p>
                          <p className="text-sm text-slate-700 mt-1"><span className="font-medium">Reason:</span> {req.reason}</p>
                          <p className="text-xs text-slate-400 mt-2">{moment(req.created_date).format('D MMM YYYY, h:mm a')}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200">Resolved</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}