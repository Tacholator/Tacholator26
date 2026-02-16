import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, MapPin, FileText, Save, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

export default function BookingSummaryModal({ 
  open, 
  onOpenChange, 
  booking,
  pupil
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [summaryData, setSummaryData] = useState({
    mainTopic: '',
    whatWasCovered: '',
    progressNotes: '',
    nextSteps: '',
    instructorComments: '',
    aiSummary: ''
  });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Check if there's an existing diary entry for this booking
  const { data: existingDiaryEntry } = useQuery({
    queryKey: ['diaryEntry', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return null;
      const entries = await base44.entities.DiaryEntry.filter({ lessonId: booking.id });
      return entries[0] || null;
    },
    enabled: !!booking?.id && open
  });

  React.useEffect(() => {
    if (existingDiaryEntry) {
      setSummaryData({
        mainTopic: existingDiaryEntry.mainTopic || '',
        whatWasCovered: existingDiaryEntry.objective || '',
        progressNotes: existingDiaryEntry.whatWentWell || '',
        nextSteps: existingDiaryEntry.areasToImprove || '',
        instructorComments: existingDiaryEntry.instructorComments || '',
        aiSummary: existingDiaryEntry.aiSummary || ''
      });
    } else {
      setSummaryData({
        mainTopic: '',
        whatWasCovered: '',
        progressNotes: '',
        nextSteps: '',
        instructorComments: '',
        aiSummary: ''
      });
    }
  }, [existingDiaryEntry, booking]);

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const prompt = `Write a brief lesson summary directly to the pupil using second person (you/your). Maximum 120 words, 1 short paragraph.

What was covered: ${summaryData.whatWasCovered || 'Not provided'}
What went well: ${summaryData.progressNotes || 'Not provided'}
Next steps: ${summaryData.nextSteps || 'Not provided'}
Instructor notes: ${summaryData.instructorComments || 'Not provided'}

Requirements:
- Address the pupil directly using "you" and "your"
- NEVER use "the student", "the pupil", "the learner", "student showed", "pupil demonstrated"
- Keep it brief, clear, and supportive
- Focus on: what you worked on, what you did well, and next steps
- Maximum 120 words, one paragraph`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setSummaryData({ ...summaryData, aiSummary: response });
      toast({ 
        title: 'AI summary generated', 
        description: 'Review and edit as needed before saving' 
      });
    } catch (error) {
      toast({ 
        title: 'Failed to generate summary', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSave = async () => {
    if (!booking || !pupil) return;
    
    if (!summaryData.mainTopic) {
      toast({ 
        title: 'Main topic required', 
        description: 'Please select the main topic covered in this lesson', 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const diaryData = {
        pupilId: booking.pupilId,
        instructorId: booking.instructorId,
        lessonId: booking.id,
        date: moment(booking.startAtUtc).format('YYYY-MM-DD'),
        mainTopic: summaryData.mainTopic,
        objective: summaryData.whatWasCovered,
        whatWentWell: summaryData.progressNotes,
        areasToImprove: summaryData.nextSteps,
        instructorComments: summaryData.instructorComments,
        aiSummary: summaryData.aiSummary,
        aiSummaryGeneratedAt: summaryData.aiSummary ? new Date().toISOString() : null
      };

      // Save diary entry
      if (existingDiaryEntry) {
        await base44.entities.DiaryEntry.update(existingDiaryEntry.id, diaryData);
      } else {
        await base44.entities.DiaryEntry.create(diaryData);
      }

      // Update pupil hours
      const updatedHours = (pupil.hoursCompleted || 0) + (booking.durationHours || 0);
      await base44.entities.Pupil.update(pupil.id, {
        hoursCompleted: updatedHours
      });

      // Mark booking as completed
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'completed'
      });

      queryClient.invalidateQueries(['diaryEntry', booking.id]);
      queryClient.invalidateQueries(['diaryEntries', booking.pupilId]);
      queryClient.invalidateQueries(['pupils']);
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      
      toast({ 
        title: 'Lesson summary saved', 
        description: 'Hours updated and lesson marked complete' 
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: 'Failed to save', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!booking || !pupil) {
    return null;
  }

  const startMoment = moment(booking.startAtUtc).local();
  const endMoment = moment(booking.endAtUtc).local();

  // Parse locations from notes
  const parseLocations = () => {
    const notes = booking.notesFromPupil || '';
    const pickupMatch = notes.match(/Pickup:\s*([^|]+)/);
    const dropoffMatch = notes.match(/Dropoff:\s*([^|]+)/);
    return {
      pickup: pickupMatch ? pickupMatch[1].trim() : 'Not specified',
      dropoff: dropoffMatch ? dropoffMatch[1].trim() : 'Not specified'
    };
  };

  const locations = parseLocations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lesson Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lesson Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Lesson Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-600">Date:</span>
                  <p className="font-medium text-slate-800">
                    {startMoment.format('dddd, D MMMM YYYY')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Time:</span>
                  <p className="font-medium text-slate-800">
                    {startMoment.format('HH:mm')} – {endMoment.format('HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Duration:</span>
                  <p className="font-medium text-slate-800">
                    {booking.durationHours} hour{booking.durationHours !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Pupil:</span>
                  <p className="font-medium text-slate-800">
                    {pupil.firstName} {pupil.lastName}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="mb-2">
                  <span className="text-slate-600">Pickup:</span>
                  <p className="font-medium text-slate-800">{locations.pickup}</p>
                </div>
                <div>
                  <span className="text-slate-600">Drop-off:</span>
                  <p className="font-medium text-slate-800">{locations.dropoff}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="mainTopic">Main Topic *</Label>
              <Select 
                value={summaryData.mainTopic} 
                onValueChange={(value) => setSummaryData({ ...summaryData, mainTopic: value })}
              >
                <SelectTrigger className="mt-2">
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
            </div>

            <div>
              <Label htmlFor="whatWasCovered">What Was Covered</Label>
              <Textarea
                id="whatWasCovered"
                value={summaryData.whatWasCovered}
                onChange={(e) => setSummaryData({ ...summaryData, whatWasCovered: e.target.value })}
                placeholder="Topics, maneuvers, or skills practiced during the lesson..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="progressNotes">Progress Notes / What Went Well</Label>
              <Textarea
                id="progressNotes"
                value={summaryData.progressNotes}
                onChange={(e) => setSummaryData({ ...summaryData, progressNotes: e.target.value })}
                placeholder="Strengths demonstrated, improvements made..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="nextSteps">Areas to Improve / Next Steps</Label>
              <Textarea
                id="nextSteps"
                value={summaryData.nextSteps}
                onChange={(e) => setSummaryData({ ...summaryData, nextSteps: e.target.value })}
                placeholder="Skills to work on, areas that need more practice..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="instructorComments">Instructor Comments</Label>
              <Textarea
                id="instructorComments"
                value={summaryData.instructorComments}
                onChange={(e) => setSummaryData({ ...summaryData, instructorComments: e.target.value })}
                placeholder="Additional notes or observations..."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>

          {/* AI Summary Section */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI-Generated Summary
                </CardTitle>
                <Button
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingSummary}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {summaryData.aiSummary && (
              <CardContent>
                <p className="text-xs text-purple-600 mb-2">This summary is written directly to the pupil and kept brief.</p>
                <Textarea
                  value={summaryData.aiSummary}
                  onChange={(e) => setSummaryData({ ...summaryData, aiSummary: e.target.value })}
                  placeholder="Click 'Generate Summary' to create an AI-powered lesson summary based on your notes..."
                  rows={4}
                  className="bg-white"
                />
              </CardContent>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Summary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}