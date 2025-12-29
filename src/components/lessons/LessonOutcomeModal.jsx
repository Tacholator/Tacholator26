import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Clock } from 'lucide-react';
import moment from 'moment';

export default function LessonOutcomeModal({ open, onClose, lessonId, bookingId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    completionOutcome: 'completed',
    chargesApplied: true,
    chargesDecisionReason: '',
    completionNote: ''
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const lessons = await base44.entities.Lesson.filter({ id: lessonId });
      return lessons[0] || null;
    },
    enabled: open && !!lessonId
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: open
  });

  useEffect(() => {
    if (open) {
      setFormData({
        completionOutcome: 'completed',
        chargesApplied: true,
        chargesDecisionReason: '',
        completionNote: ''
      });
    }
  }, [open]);

  const updateOutcomeMutation = useMutation({
    mutationFn: async (data) => {
      const statusMap = {
        completed: 'Completed',
        cancelled: 'Cancelled',
        no_show: 'no_show'
      };

      // Update lesson
      await base44.entities.Lesson.update(lessonId, {
        status: statusMap[data.completionOutcome],
        completionOutcome: data.completionOutcome,
        chargesApplied: data.chargesApplied,
        chargesDecisionReason: data.chargesDecisionReason || null,
        completionNote: data.completionNote || null,
        completedAt: new Date().toISOString()
      });

      // Apply charges logic if needed
      if (data.chargesApplied && lesson) {
        const pupil = pupils.find(p => p.id === lesson.pupilId);
        if (pupil) {
          const startMoment = moment(lesson.startTime, 'HH:mm');
          const endMoment = moment(lesson.endTime, 'HH:mm');
          const durationHours = endMoment.diff(startMoment, 'minutes') / 60;
          
          const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
          await base44.entities.Pupil.update(pupil.id, { 
            hoursCompleted: newHoursCompleted 
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      queryClient.invalidateQueries(['lesson', lessonId]);
      queryClient.invalidateQueries(['pupils']);
      toast({ title: 'Lesson updated' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to update lesson', variant: 'destructive' });
    }
  });

  const handleSubmit = () => {
    if (!formData.completionOutcome) {
      toast({ title: 'Please select an outcome', variant: 'destructive' });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    setConfirmDialogOpen(false);
    updateOutcomeMutation.mutate(formData);
  };

  const handleOutcomeChange = (value) => {
    setFormData({
      ...formData,
      completionOutcome: value,
      chargesApplied: value === 'completed' ? true : formData.chargesApplied
    });
  };

  const pupil = lesson ? pupils.find(p => p.id === lesson.pupilId) : null;
  const isCompleted = formData.completionOutcome === 'completed';
  const showChargesOptions = formData.completionOutcome === 'cancelled' || formData.completionOutcome === 'no_show';

  const isLoading = updateOutcomeMutation.isPending;

  if (!lesson) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Lesson Outcome</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Lesson Info */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Calendar className="w-4 h-4" />
                {moment(lesson.date).format('DD MMM YYYY')}
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                {lesson.startTime} – {lesson.endTime}
              </div>
              <p className="font-medium text-slate-800">
                {pupil?.firstName} {pupil?.lastName}
              </p>
            </div>

            {/* Outcome Selection */}
            <div className="space-y-2">
              <Label>Outcome *</Label>
              <RadioGroup value={formData.completionOutcome} onValueChange={handleOutcomeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="completed" id="completed" />
                  <Label htmlFor="completed" className="font-normal cursor-pointer">
                    Completed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cancelled" id="cancelled" />
                  <Label htmlFor="cancelled" className="font-normal cursor-pointer">
                    Cancelled
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_show" id="no_show" />
                  <Label htmlFor="no_show" className="font-normal cursor-pointer">
                    No show
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Charges Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="charges">Apply lesson charges?</Label>
                <p className="text-xs text-slate-500 mt-1">
                  {isCompleted 
                    ? 'Completed lessons always apply charges' 
                    : 'Toggle off to waive charges'}
                </p>
              </div>
              <Switch
                id="charges"
                checked={formData.chargesApplied}
                onCheckedChange={(checked) => setFormData({ ...formData, chargesApplied: checked })}
                disabled={isCompleted}
              />
            </div>

            {/* Reason (for cancelled/no show) */}
            {showChargesOptions && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Select 
                  value={formData.chargesDecisionReason} 
                  onValueChange={(value) => setFormData({ ...formData, chargesDecisionReason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pupil_cancelled_late">Pupil cancelled late</SelectItem>
                    <SelectItem value="pupil_cancelled_in_advance">Pupil cancelled in advance</SelectItem>
                    <SelectItem value="instructor_unavailable">Instructor unavailable</SelectItem>
                    <SelectItem value="weather">Weather / road conditions</SelectItem>
                    <SelectItem value="vehicle_issue">Vehicle issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.completionNote}
                onChange={(e) => setFormData({ ...formData, completionNote: e.target.value })}
                placeholder="Add any notes about the outcome..."
                rows={3}
                maxLength={800}
              />
              <p className="text-xs text-slate-500">{formData.completionNote.length}/800</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Outcome'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm lesson outcome?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the lesson status{formData.chargesApplied ? ' and apply charges' : ' without applying charges'}. 
              This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}