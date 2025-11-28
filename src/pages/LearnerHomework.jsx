import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Car, BookOpen, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

export default function LearnerHomework() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      if (user.email) {
        const byEmail = await base44.entities.Pupil.filter({ email: user.email });
        return byEmail[0] || null;
      }
      return null;
    },
    enabled: !!user
  });

  const { data: homework = [], isLoading } = useQuery({
    queryKey: ['myHomework', pupil?.id],
    queryFn: async () => {
      const items = await base44.entities.HomeworkItem.filter({ pupilId: pupil.id });
      return items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!pupil?.id
  });

  const updateHomeworkMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.HomeworkItem.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['myHomework', pupil?.id])
  });

  const toggleHomework = async (item) => {
    const newStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    await updateHomeworkMutation.mutateAsync({ id: item.id, status: newStatus });
  };

  const pendingHomework = homework.filter(h => h.status === 'Pending');
  const completedHomework = homework.filter(h => h.status === 'Completed');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <Card className="max-w-md text-center p-8">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Linked</h2>
          <p className="text-slate-500">
            Your account hasn't been linked to a pupil profile yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('LearnerDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Homework</h1>
          <p className="text-slate-500 mt-1">Practice exercises from your instructor</p>
        </motion.div>

        {/* Pending */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            To Do ({pendingHomework.length})
          </h2>
          
          {pendingHomework.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All caught up! No pending homework.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingHomework.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => toggleHomework(item)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Added {moment(item.created_date).format('D MMM YYYY')}
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        {completedHomework.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Completed ({completedHomework.length})
            </h2>
            <div className="space-y-3">
              {completedHomework.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm bg-slate-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => toggleHomework(item)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-500 line-through">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                          )}
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">Done</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}