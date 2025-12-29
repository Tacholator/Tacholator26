import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function McqQuestionModal({ open, onClose, question }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    topicId: '',
    topicLabel: '',
    difficulty: 'medium',
    questionText: '',
    answers: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' }
    ],
    correctAnswerId: 'A',
    explanation: '',
    isActive: true
  });

  useEffect(() => {
    if (question) {
      setFormData({
        topicId: question.topicId || '',
        topicLabel: question.topicLabel || '',
        difficulty: question.difficulty || 'medium',
        questionText: question.questionText || '',
        answers: question.answers || [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correctAnswerId: question.correctAnswerId || 'A',
        explanation: question.explanation || '',
        isActive: question.isActive !== undefined ? question.isActive : true
      });
    } else {
      setFormData({
        topicId: '',
        topicLabel: '',
        difficulty: 'medium',
        questionText: '',
        answers: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correctAnswerId: 'A',
        explanation: '',
        isActive: true
      });
    }
  }, [question, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.McqQuestion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['mcqQuestions']);
      toast({ title: 'Question created' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to create question', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.McqQuestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['mcqQuestions']);
      toast({ title: 'Question updated' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to update question', variant: 'destructive' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.topicId.trim() || !formData.topicLabel.trim() || !formData.questionText.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (formData.answers.some(a => !a.text.trim())) {
      toast({ title: 'Please fill in all answer options', variant: 'destructive' });
      return;
    }

    if (question) {
      updateMutation.mutate({ id: question.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAnswerChange = (index, text) => {
    const newAnswers = [...formData.answers];
    newAnswers[index].text = text;
    setFormData({ ...formData, answers: newAnswers });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit Question' : 'New Question'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topicId">Topic ID *</Label>
              <Input
                id="topicId"
                value={formData.topicId}
                onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                placeholder="e.g., legal_responsibilities"
                required
              />
            </div>
            <div>
              <Label htmlFor="topicLabel">Topic Label *</Label>
              <Input
                id="topicLabel"
                value={formData.topicLabel}
                onChange={(e) => setFormData({ ...formData, topicLabel: e.target.value })}
                placeholder="e.g., Legal Responsibilities"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="questionText">Question *</Label>
            <Textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              placeholder="Enter the question text..."
              rows={3}
              maxLength={400}
              required
            />
            <p className="text-xs text-slate-500 mt-1">{formData.questionText.length}/400</p>
          </div>

          <div>
            <Label>Answer Options (A-D) *</Label>
            <div className="space-y-2 mt-2">
              {formData.answers.map((answer, index) => (
                <div key={answer.id} className="flex items-center gap-2">
                  <span className="w-8 font-semibold text-slate-700">{answer.id}.</span>
                  <Input
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={`Option ${answer.id}`}
                    maxLength={250}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="correctAnswerId">Correct Answer *</Label>
            <Select value={formData.correctAnswerId} onValueChange={(value) => setFormData({ ...formData, correctAnswerId: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="explanation">Explanation (shown after submission)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explain why this is the correct answer..."
              rows={3}
              maxLength={800}
            />
            <p className="text-xs text-slate-500 mt-1">{formData.explanation.length}/800</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-slate-500 mt-1">Active questions appear in the question bank</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
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