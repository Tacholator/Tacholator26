import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, MapPin, FileText, Save, Sparkles, Gauge } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import TopicDurationSelector from './TopicDurationSelector';

export default function BookingSummaryModal({ 
  open, 
  onOpenChange, 
  booking,
  pupil,
  readOnly = false
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
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [startMileage, setStartMileage] = useState('');
  const [endMileage, setEndMileage] = useState('');

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

  // Fetch existing lesson topic durations
  const { data: existingTopicDurations = [] } = useQuery({
    queryKey: ['lessonTopicDurations', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      return await base44.entities.LessonTopicDuration.filter({ lessonId: booking.id });
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
  }, [existingDiaryEntry?.id]);

  React.useEffect(() => {
    if (booking?.startMileage != null) {
      setStartMileage(String(booking.startMileage));
    }
    if (booking?.endMileage != null) {
      setEndMileage(String(booking.endMileage));
    }
  }, [booking?.startMileage, booking?.endMileage]);

  React.useEffect(() => {
    if (existingTopicDurations.length > 0) {
      setSelectedTopics(existingTopicDurations.map(td => ({
        topicId: td.topicId,
        topicName: td.topicName,
        durationMinutes: td.durationMinutes
      })));
    } else {
      setSelectedTopics([]);
    }
  }, [existingTopicDurations.length, booking?.id]);

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
    
    if (selectedTopics.length === 0) {
      toast({ 
        title: 'Topics required', 
        description: 'Please add at least one topic covered in this lesson', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate total duration matches lesson duration
    const totalMinutes = selectedTopics.reduce((sum, t) => sum + t.durationMinutes, 0);
    const lessonMinutes = (booking.durationHours || 0) * 60;
    if (totalMinutes !== lessonMinutes) {
      toast({ 
        title: 'Duration mismatch', 
        description: `Total topic duration (${totalMinutes} mins) must equal lesson duration (${lessonMinutes} mins)`, 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Use first topic as main topic for backward compatibility
      const mainTopicId = selectedTopics[0]?.topicId || '';

      const diaryData = {
        pupilId: booking.pupilId,
        instructorId: booking.instructorId,
        lessonId: booking.id,
        date: moment(booking.startAtUtc).format('YYYY-MM-DD'),
        mainTopic: mainTopicId,
        objective: summaryData.whatWasCovered,
        whatWentWell: summaryData.progressNotes,
        areasToImprove: summaryData.nextSteps,
        instructorComments: summaryData.instructorComments,
        aiSummary: summaryData.aiSummary,
        aiSummaryGeneratedAt: summaryData.aiSummary ? new Date().toISOString() : null
      };

      // Save diary entry
      let diaryEntryId;
      if (existingDiaryEntry) {
        await base44.entities.DiaryEntry.update(existingDiaryEntry.id, diaryData);
        diaryEntryId = existingDiaryEntry.id;
      } else {
        const newEntry = await base44.entities.DiaryEntry.create(diaryData);
        diaryEntryId = newEntry.id;
      }

      // Delete existing topic durations for this lesson
      if (existingTopicDurations.length > 0) {
        await Promise.all(
          existingTopicDurations.map(td => base44.entities.LessonTopicDuration.delete(td.id))
        );
      }

      // Save new topic durations
      await Promise.all(
        selectedTopics.map(topic =>
          base44.entities.LessonTopicDuration.create({
            lessonId: booking.id,
            diaryEntryId: diaryEntryId,
            pupilId: booking.pupilId,
            instructorId: booking.instructorId,
            topicId: topic.topicId,
            topicName: topic.topicName,
            durationMinutes: topic.durationMinutes
          })
        )
      );

      // Update pupil hours and deduct from bulk payment
      const updatedHours = (pupil.hoursCompleted || 0) + (booking.durationHours || 0);
      const lessonCost = (pupil.hourlyRate || 0) * (booking.durationHours || 0);
      const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
      
      await base44.entities.Pupil.update(pupil.id, {
        hoursCompleted: updatedHours,
        bulkPaymentBalance: newBalance
      });
      
      // Create payment ledger entry
      if (lessonCost > 0) {
        await base44.entities.PaymentLedger.create({
          userId: pupil.linkedUserId || pupil.id,
          bookingId: booking.id,
          type: 'charge',
          reason: 'lesson_confirmed_charge',
          amountGbp: lessonCost,
          hours: booking.durationHours || 0,
          createdByRole: 'instructor',
          note: `Lesson completed: ${(booking.durationHours || 0).toFixed(2)}h @ £${pupil.hourlyRate}/h`
        });
      }

      // Update topic hours log for each topic (aggregating by section ID)
      for (const topic of selectedTopics) {
        const topicHours = topic.durationMinutes / 60;
        const existingTopicLog = await base44.entities.TopicHoursLog.filter({
          pupilId: booking.pupilId,
          topicId: topic.topicId
        });

        if (existingTopicLog.length > 0) {
          const log = existingTopicLog[0];
          await base44.entities.TopicHoursLog.update(log.id, {
            totalHours: (log.totalHours || 0) + topicHours
          });
        } else {
          await base44.entities.TopicHoursLog.create({
            pupilId: booking.pupilId,
            instructorId: booking.instructorId,
            topicId: topic.topicId,
            topicName: topic.topicName,
            totalHours: topicHours
          });
        }
      }

      // Mark booking as completed and save mileage
      await base44.entities.LessonBooking.update(booking.id, {
        status: 'completed',
        startMileage: startMileage ? Number(startMileage) : null,
        endMileage: endMileage ? Number(endMileage) : null
      });

      queryClient.invalidateQueries(['diaryEntry', booking.id]);
      queryClient.invalidateQueries(['diaryEntries', booking.pupilId]);
      queryClient.invalidateQueries(['lessonTopicDurations', booking.id]);
      queryClient.invalidateQueries(['topicHoursLog']);
      queryClient.invalidateQueries(['pupils']);
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['lessonBookings']);
      
      toast({ 
        title: 'Lesson summary saved', 
        description: 'Hours updated and lesson marked complete' 
      });
      
      // Close this modal
      onOpenChange(false);
      
      // Also close parent modal if it exists (passed as a separate callback)
      if (typeof window !== 'undefined' && window.closeParentBookingModal) {
        window.closeParentBookingModal();
      }
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
          <DialogTitle>{readOnly ? 'Lesson Summary - View Only' : 'Lesson Summary'}</DialogTitle>
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

          {/* Mileage Tracking */}
          <Card className="border-teal-200 bg-teal-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="w-4 h-4 text-teal-600" />
                Lesson Mileage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startMileage" className="text-sm text-slate-600">Start Mileage (miles)</Label>
                  <Input
                    id="startMileage"
                    type="number"
                    value={startMileage}
                    onChange={(e) => setStartMileage(e.target.value)}
                    placeholder="e.g., 12345"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endMileage" className="text-sm text-slate-600">End Mileage (miles)</Label>
                  <Input
                    id="endMileage"
                    type="number"
                    value={endMileage}
                    onChange={(e) => setEndMileage(e.target.value)}
                    placeholder="e.g., 12385"
                    disabled={readOnly}
                  />
                </div>
              </div>
              {startMileage && endMileage && Number(endMileage) >= Number(startMileage) && (
                <p className="text-xs text-teal-600 mt-2">
                  Distance covered: {Number(endMileage) - Number(startMileage)} miles
                </p>
              )}
            </CardContent>
          </Card>

          {/* Summary Form */}
          <div className="space-y-4">
            {/* Topic Duration Selector */}
            {readOnly ? (
              <div>
                <Label>Topics Covered</Label>
                <div className="mt-2 space-y-2">
                  {selectedTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border rounded-md">
                      <span className="text-slate-700 font-medium">{topic.topicName}</span>
                      <span className="text-slate-600">{topic.durationMinutes} mins</span>
                    </div>
                  ))}
                  {selectedTopics.length === 0 && (
                    <div className="p-3 bg-slate-50 border rounded-md text-slate-500">
                      No topics recorded
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <TopicDurationSelector
                selectedTopics={selectedTopics}
                onChange={setSelectedTopics}
                totalLessonMinutes={(booking.durationHours || 0) * 60}
                disabled={readOnly}
              />
            )}

            <div>
              <Label htmlFor="whatWasCovered">What Was Covered</Label>
              <Textarea
                id="whatWasCovered"
                value={summaryData.whatWasCovered}
                onChange={(e) => setSummaryData({ ...summaryData, whatWasCovered: e.target.value })}
                placeholder="Topics, maneuvers, or skills practiced during the lesson..."
                rows={3}
                className="mt-2"
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                {!readOnly && (
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
                )}
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
                  disabled={readOnly}
                />
              </CardContent>
            )}
          </Card>
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}