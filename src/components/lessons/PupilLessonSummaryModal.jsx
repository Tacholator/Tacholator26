import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, MessageSquare, Target, Loader2, Clock, User, CheckCircle, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import moment from 'moment';

export default function PupilLessonSummaryModal({ open, onClose, pupil, lastDiaryEntry, isGenerating, showNextSteps = true, booking, lesson, isEditMode = false }) {
  const [formData, setFormData] = useState({
    date: lesson?.date || booking?.startAtUtc?.split('T')[0] || moment().format('YYYY-MM-DD'),
    objective: '',
    mainTopic: '',
    whatWentWell: '',
    areasToImprove: '',
    instructorComments: '',
    homeworkSuggestions: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  if (!pupil) return null;

  // Load existing entry if available
  React.useEffect(() => {
    if (lastDiaryEntry && isEditMode) {
      setFormData({
        date: lastDiaryEntry.date || formData.date,
        objective: lastDiaryEntry.objective || '',
        mainTopic: lastDiaryEntry.mainTopic || '',
        whatWentWell: lastDiaryEntry.whatWentWell || '',
        areasToImprove: lastDiaryEntry.areasToImprove || '',
        instructorComments: lastDiaryEntry.instructorComments || '',
        homeworkSuggestions: lastDiaryEntry.homeworkSuggestions || '',
      });
    }
  }, [lastDiaryEntry, isEditMode, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.mainTopic) return;
    setIsSaving(true);
    try {
      const lessonId = lesson?.id || booking?.id;
      if (lastDiaryEntry?.id) {
        await base44.entities.DiaryEntry.update(lastDiaryEntry.id, {
          ...formData,
          pupilId: pupil.id
        });
      } else {
        await base44.entities.DiaryEntry.create({
          ...formData,
          pupilId: pupil.id,
          lessonId,
          instructorId: lesson?.instructorId || booking?.instructorId
        });
      }
      queryClient.invalidateQueries({ queryKey: ['diaryEntries'] });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const lessonDuration = lesson ? (() => {
    const startMoment = moment(lesson.startTime, 'HH:mm');
    const endMoment = moment(lesson.endTime, 'HH:mm');
    return endMoment.diff(startMoment, 'minutes');
  })() : (booking ? Math.round((moment(booking.endAtUtc).diff(moment(booking.startAtUtc), 'minutes'))) : 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            Lesson Summary: {pupil.firstName} {pupil.lastName}
          </DialogTitle>
        </DialogHeader>

        {/* Lesson/Booking Info Banner */}
        {(lesson || booking) && (
          <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{pupil.firstName} {pupil.lastName}</p>
                <p className="text-sm text-slate-500">
                  {lesson ? moment(lesson.date).format('ddd, D MMM YYYY') : moment(booking.startAtUtc).local().format('ddd, D MMM YYYY')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {lesson ? `${lesson.startTime} - ${lesson.endTime}` : `${moment(booking.startAtUtc).local().format('HH:mm')} - ${moment(booking.endAtUtc).local().format('HH:mm')}`}
                </span>
              </div>
              <Badge className="mt-1 bg-blue-100 text-blue-700">
                {lessonDuration} mins
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="mainTopic">Topics Covered *</Label>
            <Select value={formData.mainTopic} onValueChange={(value) => handleChange('mainTopic', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select topics covered..." />
              </SelectTrigger>
              <SelectContent>
                {courseWorkTopics.map((topic) => (
                  <SelectItem key={topic.topicId} value={topic.topicId}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">What was covered</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => handleChange('objective', e.target.value)}
              placeholder="e.g., Roundabouts practice, lane discipline..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentWell">Progress Notes / What Went Well</Label>
            <Textarea
              id="whatWentWell"
              value={formData.whatWentWell}
              onChange={(e) => handleChange('whatWentWell', e.target.value)}
              placeholder="Positive observations from the lesson..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="areasToImprove">Areas to Improve / Next Steps</Label>
            <Textarea
              id="areasToImprove"
              value={formData.areasToImprove}
              onChange={(e) => handleChange('areasToImprove', e.target.value)}
              placeholder="Things to work on in future lessons..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructorComments">Instructor Comments</Label>
            <Textarea
              id="instructorComments"
              value={formData.instructorComments}
              onChange={(e) => handleChange('instructorComments', e.target.value)}
              placeholder="Additional notes or observations..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.mainTopic} className="bg-teal-600 hover:bg-teal-700 gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}