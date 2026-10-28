import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, CheckCircle, Clock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

export default function DiaryEntryModal({ open, onClose, pupilId, lessonId, existingEntry, onSave, lesson, pupil, readOnly = false }) {
  const [formData, setFormData] = useState(existingEntry || {
    date: lesson?.date || moment().format('YYYY-MM-DD'),
    objective: '',
    mainTopic: '',
    whatWentWell: '',
    areasToImprove: ''
  });
  const [topicDurations, setTopicDurations] = useState([]);
  const [visualViewport, setVisualViewport] = useState(null);
  // Tracks the "What was covered" text auto-filled from the selected topic, so
  // choosing a different topic updates it without wiping notes typed by hand.
  const [autoObjective, setAutoObjective] = useState(null);

  // On mobile the keyboard shrinks the visual viewport but the dialog is
  // positioned against the layout viewport, which leaves the focused field
  // (and its caret) sitting behind the keyboard. Track the visible area so the
  // dialog can stay centred above the keyboard.
  React.useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      if (window.innerWidth >= 768) {
        setVisualViewport(null);
        return;
      }
      setVisualViewport({ height: vv.height, offsetTop: vv.offsetTop });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [open]);

  const handleFieldFocus = (e) => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    // Wait for the keyboard animation before bringing the field into view.
    setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
  };

  // Fetch topic durations for this lesson to get all topics
  React.useEffect(() => {
    const fetchTopicDurations = async () => {
      if (existingEntry?.id) {
        const durations = await base44.entities.LessonTopicDuration.filter({ diaryEntryId: existingEntry.id });
        setTopicDurations(durations);
      } else if (lessonId) {
        const durations = await base44.entities.LessonTopicDuration.filter({ lessonId });
        setTopicDurations(durations);
      }
    };
    fetchTopicDurations();
  }, [lessonId, existingEntry?.id, open]);

  // Update formData only when the modal opens or the entry ID changes
  // (not on every parent re-render which would wipe user input)
  React.useEffect(() => {
    if (existingEntry) {
      setFormData(existingEntry);
      const topic = courseWorkTopics.find(t => t.topicId === existingEntry.mainTopic);
      setAutoObjective(topic && topic.title === existingEntry.objective ? topic.title : null);
    } else {
      setFormData({
        date: lesson?.date || moment().format('YYYY-MM-DD'),
        objective: '',
        mainTopic: '',
        whatWentWell: '',
        areasToImprove: ''
      });
      setAutoObjective(null);
    }
  }, [existingEntry?.id, open]);

  // Calculate lesson duration for display
  const lessonDuration = lesson ? (() => {
    const startMoment = moment(lesson.startTime, 'HH:mm');
    const endMoment = moment(lesson.endTime, 'HH:mm');
    return endMoment.diff(startMoment, 'minutes');
  })() : 0;
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Selecting a topic also fills "What was covered" with that topic's title.
  const handleTopicChange = (value) => {
    const title = courseWorkTopics.find(t => t.topicId === value)?.title || '';
    setFormData(prev => {
      const current = (prev.objective || '').trim();
      const shouldUpdate = current === '' || (autoObjective !== null && current === autoObjective);
      return { ...prev, mainTopic: value, objective: shouldUpdate ? title : prev.objective };
    });
    setAutoObjective(title);
  };

  const handleSubmit = async () => {
    if (!formData.mainTopic) {
      return;
    }
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
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={visualViewport ? {
          top: visualViewport.offsetTop + visualViewport.height / 2,
          maxHeight: visualViewport.height - 16,
        } : undefined}
        onFocusCapture={handleFieldFocus}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            {readOnly ? 'Lesson Feedback Details' : existingEntry ? 'Edit Lesson Feedback' : 'Lesson Feedback'}
          </DialogTitle>
        </DialogHeader>

        {/* Lesson Info Banner */}
        {lesson && pupil && (
          <div className="bg-slate-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{pupil.firstName} {pupil.lastName}</p>
                <p className="text-sm text-slate-500">{moment(lesson.date).format('ddd, D MMM YYYY')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-sm">{lesson.startTime} - {lesson.endTime}</span>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {lessonDuration} mins
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Lesson Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
           <Label htmlFor="mainTopic">{topicDurations.length > 1 ? 'Topics Covered' : 'Main Topic'} *</Label>
           {readOnly ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                {(() => {
                  if (topicDurations.length > 0) {
                    return topicDurations.map(td => {
                      const predefinedTopic = courseWorkTopics.find(t => t.topicId === td.topicId);
                      return predefinedTopic ? predefinedTopic.title : td.topicName;
                    }).join(', ');
                  }

                  // Fallback to main topic
                  const predefinedTopic = courseWorkTopics.find(t => t.topicId === formData.mainTopic);
                  if (predefinedTopic) return predefinedTopic.title;

                  const customTopic = topicDurations.find(td => td.topicId === formData.mainTopic);
                  if (customTopic) return customTopic.topicName;

                  return formData.mainTopic || 'Not specified';
                })()}
              </div>
            ) : (
              <Select 
                value={formData.mainTopic} 
                onValueChange={handleTopicChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select main topic covered..." />
                </SelectTrigger>
                <SelectContent>
                  {courseWorkTopics.map((topic) => (
                    <SelectItem key={topic.topicId} value={topic.topicId}>
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">What was covered</Label>
            {readOnly ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                {formData.objective || 'Not specified'}
              </div>
            ) : (
              <Textarea
                id="objective"
                value={formData.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
                placeholder="e.g., Roundabouts practice"
                rows={2}
                disabled={readOnly}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentWell">What Went Well</Label>
            {readOnly ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                {formData.whatWentWell || 'Not specified'}
              </div>
            ) : (
              <Textarea
                id="whatWentWell"
                value={formData.whatWentWell}
                onChange={(e) => handleChange('whatWentWell', e.target.value)}
                placeholder="Positive observations from the lesson..."
                rows={3}
                disabled={readOnly}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="areasToImprove">Areas to Improve</Label>
            {readOnly ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                {formData.areasToImprove || 'Not specified'}
              </div>
            ) : (
              <Textarea
                id="areasToImprove"
                value={formData.areasToImprove}
                onChange={(e) => handleChange('areasToImprove', e.target.value)}
                placeholder="Things to work on..."
                rows={3}
                disabled={readOnly}
              />
            )}
          </div>

        </div>

        <DialogFooter className="gap-2">
          {readOnly ? (
            <Button onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 gap-2 w-full sm:w-auto">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {lesson?.status === 'Scheduled' ? 'Save & Mark Completed' : 'Save Entry'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}