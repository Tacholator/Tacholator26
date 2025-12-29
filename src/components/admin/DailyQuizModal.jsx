import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search } from 'lucide-react';
import moment from 'moment';

export default function DailyQuizModal({ open, onClose, quiz, adminId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: moment().format('YYYY-MM-DD'),
    title: '',
    questionIds: [],
    status: 'draft',
    publishAt: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');

  const { data: allQuestions = [] } = useQuery({
    queryKey: ['mcqQuestions'],
    queryFn: () => base44.entities.McqQuestion.filter({ isActive: true }),
    enabled: open
  });

  useEffect(() => {
    if (quiz) {
      setFormData({
        date: quiz.date || moment().format('YYYY-MM-DD'),
        title: quiz.title || '',
        questionIds: quiz.questionIds || [],
        status: quiz.status || 'draft',
        publishAt: quiz.publishAt ? moment(quiz.publishAt).format('YYYY-MM-DDTHH:mm') : ''
      });
    } else {
      setFormData({
        date: moment().format('YYYY-MM-DD'),
        title: '',
        questionIds: [],
        status: 'draft',
        publishAt: ''
      });
    }
  }, [quiz, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyQuiz.create({
      ...data,
      createdByAdminId: adminId,
      publishAt: data.publishAt || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyQuizzes']);
      toast({ title: 'Quiz created' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to create quiz', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyQuiz.update(id, {
      ...data,
      publishAt: data.publishAt || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyQuizzes']);
      toast({ title: 'Quiz updated' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to update quiz', variant: 'destructive' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.date || !formData.title.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (formData.questionIds.length === 0) {
      toast({ title: 'Please select at least one question', variant: 'destructive' });
      return;
    }

    if (formData.questionIds.length > 20) {
      toast({ title: 'Maximum 20 questions per quiz', variant: 'destructive' });
      return;
    }

    if (quiz) {
      updateMutation.mutate({ id: quiz.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleQuestionToggle = (questionId) => {
    const newIds = formData.questionIds.includes(questionId)
      ? formData.questionIds.filter(id => id !== questionId)
      : [...formData.questionIds, questionId];
    setFormData({ ...formData, questionIds: newIds });
  };

  const filteredQuestions = allQuestions.filter(q => {
    const matchesSearch = !searchQuery || 
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topicLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = topicFilter === 'all' || q.topicId === topicFilter;
    return matchesSearch && matchesTopic;
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Edit Daily Quiz' : 'New Daily Quiz'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Legal Responsibilities Quiz"
              maxLength={120}
              required
            />
          </div>

          <div>
            <Label htmlFor="publishAt">Publish At (optional)</Label>
            <Input
              id="publishAt"
              type="datetime-local"
              value={formData.publishAt}
              onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
            />
          </div>

          <div>
            <Label>Select Questions ({formData.questionIds.length} selected, max 20)</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                    <SelectItem value="legal_responsibilities">Legal Responsibilities</SelectItem>
                    <SelectItem value="mirrors_signals_speed">Mirrors & Signals</SelectItem>
                    <SelectItem value="junctions_roundabouts">Junctions</SelectItem>
                    <SelectItem value="emergency_situations">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No questions found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredQuestions.map((question) => (
                      <div key={question.id} className="flex items-start gap-3 p-3 hover:bg-slate-50">
                        <Checkbox
                          checked={formData.questionIds.includes(question.id)}
                          onCheckedChange={() => handleQuestionToggle(question.id)}
                          disabled={!formData.questionIds.includes(question.id) && formData.questionIds.length >= 20}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{question.questionText}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {question.topicLabel} • {question.difficulty}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}