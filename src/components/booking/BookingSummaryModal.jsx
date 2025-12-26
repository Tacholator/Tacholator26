import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock, MapPin, FileText, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

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
    whatWasCovered: '',
    progressNotes: '',
    nextSteps: '',
    homeworkAssigned: '',
    instructorComments: ''
  });

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
        whatWasCovered: existingDiaryEntry.objective || '',
        progressNotes: existingDiaryEntry.whatWentWell || '',
        nextSteps: existingDiaryEntry.areasToImprove || '',
        homeworkAssigned: existingDiaryEntry.homeworkSuggestions || '',
        instructorComments: existingDiaryEntry.instructorComments || ''
      });
    } else {
      setSummaryData({
        whatWasCovered: '',
        progressNotes: '',
        nextSteps: '',
        homeworkAssigned: '',
        instructorComments: ''
      });
    }
  }, [existingDiaryEntry, booking]);

  const handleSave = async () => {
    if (!booking) return;
    
    setIsSaving(true);
    try {
      const diaryData = {
        pupilId: booking.pupilId,
        instructorId: booking.instructorId,
        lessonId: booking.id,
        date: moment(booking.startAtUtc).format('YYYY-MM-DD'),
        objective: summaryData.whatWasCovered,
        whatWentWell: summaryData.progressNotes,
        areasToImprove: summaryData.nextSteps,
        homeworkSuggestions: summaryData.homeworkAssigned,
        instructorComments: summaryData.instructorComments
      };

      if (existingDiaryEntry) {
        await base44.entities.DiaryEntry.update(existingDiaryEntry.id, diaryData);
      } else {
        await base44.entities.DiaryEntry.create(diaryData);
      }

      queryClient.invalidateQueries(['diaryEntry', booking.id]);
      queryClient.invalidateQueries(['diaryEntries', booking.pupilId]);
      
      toast({ 
        title: 'Lesson summary saved', 
        description: 'Your notes have been recorded successfully' 
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
              <Label htmlFor="homeworkAssigned">Homework Assigned</Label>
              <Textarea
                id="homeworkAssigned"
                value={summaryData.homeworkAssigned}
                onChange={(e) => setSummaryData({ ...summaryData, homeworkAssigned: e.target.value })}
                placeholder="Practice tasks, theory review, or preparation for next lesson..."
                rows={2}
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