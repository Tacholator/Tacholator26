import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, BookOpen, Calendar, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

export default function HomeworkSection({ pupilId, instructorId, homework = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeworkItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['homework', pupilId]);
      setShowModal(false);
      setFormData({ title: '', description: '', dueDate: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeworkItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['homework', pupilId])
  });

  const handleSubmit = () => {
    createMutation.mutate({
      pupilId,
      instructorId,
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate || undefined,
      status: 'Pending'
    });
  };

  const pendingHomework = homework.filter(h => h.status === 'Pending');
  const completedHomework = homework.filter(h => h.status === 'Completed');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          Homework
        </h3>
        <Button onClick={() => setShowModal(true)} size="sm" className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-1" />
          Add Homework
        </Button>
      </div>

      {homework.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No homework assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingHomework.map(item => (
            <Card key={item.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>Assigned {moment(item.created_date).format('D MMM')}</span>
                      {item.dueDate && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Calendar className="w-3 h-3" />
                          Due {moment(item.dueDate).format('D MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {completedHomework.map(item => (
            <Card key={item.id} className="border-0 shadow-sm bg-slate-50/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-500 line-through">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Done
                    </Badge>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Practice mirror checks"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Homework'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}