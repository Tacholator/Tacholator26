import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Car, BookOpen, CheckCircle2, Calendar, FileText, CheckSquare, Image, Video, Music, Link2, Paperclip, ChevronRight } from 'lucide-react';
import moment from 'moment';
import HomeworkViewer from '@/components/homework/HomeworkViewer';

const FORMAT_ICONS = {
  text: FileText,
  checklist: CheckSquare,
  image: Image,
  video: Video,
  audio: Music,
  link: Link2,
  attachment: Paperclip
};

export default function LearnerHomework() {
  const [selectedHomework, setSelectedHomework] = useState(null);
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
        const allPupils = await base44.entities.Pupil.list();
        const matchingPupil = allPupils.find(p => 
          p.email?.toLowerCase() === user.email.toLowerCase()
        );
        return matchingPupil || null;
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
    mutationFn: ({ id, data }) => base44.entities.HomeworkItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['myHomework', pupil?.id])
  });

  const toggleHomework = async (item) => {
    const newStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    await updateHomeworkMutation.mutateAsync({ id: item.id, data: { status: newStatus } });
  };

  const handleChecklistUpdate = async (items) => {
    if (!selectedHomework) return;
    const allCompleted = items.every(i => i.isCompleted);
    await updateHomeworkMutation.mutateAsync({
      id: selectedHomework.id,
      data: {
        formatPayload: { ...selectedHomework.formatPayload, items },
        status: allCompleted ? 'Completed' : (selectedHomework.status === 'Pending' ? 'Viewed' : selectedHomework.status)
      }
    });
    setSelectedHomework({ ...selectedHomework, formatPayload: { ...selectedHomework.formatPayload, items } });
  };

  const openHomework = async (item) => {
    setSelectedHomework(item);
    if (item.status === 'Pending') {
      await updateHomeworkMutation.mutateAsync({ id: item.id, data: { status: 'Viewed' } });
    }
  };

  const pendingHomework = homework.filter(h => h.status !== 'Completed');
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
              {pendingHomework.map((item, idx) => {
                const FormatIcon = FORMAT_ICONS[item.formatType] || FileText;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openHomework(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-amber-50">
                            <FormatIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-800">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              <span>Assigned {moment(item.created_date).format('D MMM YYYY')}</span>
                              {item.dueDate && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <Calendar className="w-3 h-3" />
                                  Due {moment(item.dueDate).format('D MMM')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={item.status === 'Viewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}>
                              {item.status === 'Viewed' ? 'In Progress' : 'New'}
                            </Badge>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
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
              {completedHomework.map((item, idx) => {
                const FormatIcon = FORMAT_ICONS[item.formatType] || FileText;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="border-0 shadow-sm bg-slate-50/50 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedHomework(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-emerald-50">
                            <FormatIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-500">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                            )}
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Homework Detail Modal */}
      <Dialog open={!!selectedHomework} onOpenChange={() => setSelectedHomework(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHomework?.title}</DialogTitle>
          </DialogHeader>
          {selectedHomework && (
            <div className="py-4">
              {selectedHomework.description && (
                <p className="text-slate-600 mb-4">{selectedHomework.description}</p>
              )}
              <HomeworkViewer 
                homework={selectedHomework}
                onChecklistUpdate={selectedHomework.formatType === 'checklist' ? handleChecklistUpdate : undefined}
              />
              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Assigned {moment(selectedHomework.created_date).format('D MMM YYYY')}
                </span>
                {selectedHomework.status !== 'Completed' && (
                  <Button
                    onClick={() => {
                      toggleHomework(selectedHomework);
                      setSelectedHomework(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}