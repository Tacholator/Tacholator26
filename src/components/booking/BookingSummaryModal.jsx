import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, CheckCircle } from 'lucide-react';
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
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [summaryData, setSummaryData] = useState({
    mainTopic: '',
    whatWasCovered: '',
    progressNotes: '',
    nextSteps: ''
  });
  const [selectedTopics, setSelectedTopics] = useState([]);
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
    if (!open) return;
    if (existingDiaryEntry) {
      setSummaryData({
        mainTopic: existingDiaryEntry.mainTopic || '',
        whatWasCovered: existingDiaryEntry.objective || '',
        progressNotes: existingDiaryEntry.whatWentWell || '',
        nextSteps: existingDiaryEntry.areasToImprove || ''
      });
    } else {
      setSummaryData({
        mainTopic: '',
        whatWasCovered: '',
        progressNotes: '',
        nextSteps: ''
      });
    }
  }, [existingDiaryEntry?.id, open]);

  React.useEffect(() => {
    if (booking?.startMileage != null) {
      setStartMileage(String(booking.startMileage));
    }
    if (booking?.endMileage != null) {
      setEndMileage(String(booking.endMileage));
    }
  }, [booking?.startMileage, booking?.endMileage]);

  React.useEffect(() => {
    if (!open) return;
    if (existingTopicDurations.length > 0) {
      setSelectedTopics(existingTopicDurations.map(td => ({
        topicId: td.topicId,
        topicName: td.topicName,
        durationMinutes: td.durationMinutes
      })));
    } else {
      setSelectedTopics([]);
    }
  }, [existingTopicDurations, booking?.id, open]);

  const handleSaveDraft = async () => {
    if (!booking || !pupil) return;

    setIsSavingDraft(true);
    try {
      const mainTopicId = selectedTopics[0]?.topicId || '';

      const diaryData = {
        pupilId: booking.pupilId,
        instructorId: booking.instructorId,
        lessonId: booking.id,
        date: moment(booking.startAtUtc).format('YYYY-MM-DD'),
        mainTopic: mainTopicId,
        objective: summaryData.whatWasCovered,
        whatWentWell: summaryData.progressNotes,
        areasToImprove: summaryData.nextSteps
      };

      let diaryEntryId;
      if (existingDiaryEntry) {
        await base44.entities.DiaryEntry.update(existingDiaryEntry.id, diaryData);
        diaryEntryId = existingDiaryEntry.id;
      } else {
        const newEntry = await base44.entities.DiaryEntry.create(diaryData);
        diaryEntryId = newEntry.id;
      }

      if (existingTopicDurations.length > 0) {
        await Promise.all(
          existingTopicDurations.map(td => base44.entities.LessonTopicDuration.delete(td.id))
        );
      }

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

      await base44.entities.LessonBooking.update(booking.id, {
        startMileage: startMileage ? Number(startMileage) : null,
        endMileage: endMileage ? Number(endMileage) : null
      });

      queryClient.invalidateQueries(['diaryEntry', booking.id]);
      queryClient.invalidateQueries(['diaryEntries', booking.pupilId]);
      queryClient.invalidateQueries(['lessonTopicDurations', booking.id]);
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['lessonBookings']);

      toast({
        title: 'Draft saved',
        description: 'You can come back and complete this later'
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to save draft',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSavingDraft(false);
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
        areasToImprove: summaryData.nextSteps
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? 'Lesson Summary - View Only' : 'Lesson Summary'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          </div>
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
                disabled={isSaving || isSavingDraft}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit & Complete
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