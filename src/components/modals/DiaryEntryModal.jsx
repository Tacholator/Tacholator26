import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Save, CheckCircle, Clock, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';

export default function DiaryEntryModal({ open, onClose, pupilId, lessonId, existingEntry, onSave, lesson, pupil }) {
  const [formData, setFormData] = useState(existingEntry || {
    date: lesson?.date || moment().format('YYYY-MM-DD'),
    objective: '',
    whatWentWell: '',
    areasToImprove: '',
    instructorComments: '',
    homeworkSuggestions: '',
    aiSummary: ''
  });

  // Calculate lesson duration for display
  const lessonDuration = lesson ? (() => {
    const startMoment = moment(lesson.startTime, 'HH:mm');
    const endMoment = moment(lesson.endTime, 'HH:mm');
    return endMoment.diff(startMoment, 'minutes');
  })() : 0;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAiSummary = async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are a driving instructor's assistant. Create a friendly, encouraging summary for a learner driver based on this lesson feedback. Keep it concise (2-3 sentences) and suitable for sharing via WhatsApp.

Objective: ${formData.objective}
What went well: ${formData.whatWentWell}
Areas to improve: ${formData.areasToImprove}
Instructor comments: ${formData.instructorComments}
Homework suggestions: ${formData.homeworkSuggestions}

Write a warm, supportive summary that highlights progress and next steps.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' }
          }
        }
      });
      
      setFormData(prev => ({ 
        ...prev, 
        aiSummary: response.summary,
        aiSummaryGeneratedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        pupilId,
        lessonId
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            {existingEntry ? 'Edit Lesson Feedback' : 'Lesson Feedback'}
          </DialogTitle>
        </DialogHeader>

        {/* Lesson Info Banner */}
        {lesson && pupil && (
          <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{pupil.firstName} {pupil.lastName}</p>
                <p className="text-sm text-slate-500">{moment(lesson.date).format('ddd, D MMM YYYY')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{lesson.startTime} - {lesson.endTime}</span>
              </div>
              <Badge className="mt-1 bg-blue-100 text-blue-700">
                {lessonDuration} mins
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Lesson Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Lesson Objective</Label>
              <Input
                id="objective"
                value={formData.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
                placeholder="e.g., Roundabouts practice"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentWell">What Went Well</Label>
            <Textarea
              id="whatWentWell"
              value={formData.whatWentWell}
              onChange={(e) => handleChange('whatWentWell', e.target.value)}
              placeholder="Positive observations from the lesson..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="areasToImprove">Areas to Improve</Label>
            <Textarea
              id="areasToImprove"
              value={formData.areasToImprove}
              onChange={(e) => handleChange('areasToImprove', e.target.value)}
              placeholder="Things to work on..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructorComments">Instructor Comments</Label>
            <Textarea
              id="instructorComments"
              value={formData.instructorComments}
              onChange={(e) => handleChange('instructorComments', e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="homeworkSuggestions">Homework Suggestions</Label>
            <Textarea
              id="homeworkSuggestions"
              value={formData.homeworkSuggestions}
              onChange={(e) => handleChange('homeworkSuggestions', e.target.value)}
              placeholder="Practice exercises or study topics..."
              rows={2}
            />
          </div>

          <div className="border-t pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label>AI Summary</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAiSummary}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Summary
              </Button>
            </div>
            {formData.aiSummary && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <p className="text-sm text-purple-800">{formData.aiSummary}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {lesson?.status === 'Scheduled' ? 'Save & Mark Completed' : 'Save Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}