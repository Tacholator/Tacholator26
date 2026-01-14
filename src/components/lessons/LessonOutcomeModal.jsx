import React, { useState, useEffect, useMemo } from 'react';
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

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.LessonBooking.filter({ id: bookingId });
      return bookings[0] || null;
    },
    enabled: open && !!bookingId
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
      setConfirmDialogOpen(false);
    }
  }, [open]);

  const updateOutcomeMutation = useMutation({
    mutationFn: async (data) => {
      const statusMap = {
        completed: 'Completed',
        cancelled: 'Cancelled',
        no_show: 'no_show'
      };

      // Apply charges logic first if needed (before updating status)
      const pupilId = lesson?.pupilId || booking?.pupilId;
      const pupil = pupils.find(p => p.id === pupilId);
      
      if (data.chargesApplied && data.completionOutcome === 'completed' && pupil) {
        let durationHours = 0;
        if (lesson) {
          const startMoment = moment(lesson.startTime, 'HH:mm');
          const endMoment = moment(lesson.endTime, 'HH:mm');
          durationHours = endMoment.diff(startMoment, 'minutes') / 60;
        } else if (booking) {
          durationHours = booking.durationHours || 0;
        }
        
        if (durationHours > 0) {
          const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
          
          // Calculate financial deduction
          const hourlyRate = pupil.hourlyRate || 0;
          const lessonCost = durationHours * hourlyRate;
          const currentBalance = pupil.bulkPaymentBalance || 0;
          const newBalance = currentBalance - lessonCost;
          
          // Update pupil with hours and new balance
          await base44.entities.Pupil.update(pupil.id, { 
            hoursCompleted: newHoursCompleted,
            bulkPaymentBalance: newBalance
          });
          
          // Create payment ledger entry if there's a cost
          if (lessonCost > 0) {
            await base44.entities.PaymentLedger.create({
              userId: pupil.linkedUserId || pupil.id,
              bookingId: bookingId || null,
              type: 'charge',
              reason: 'lesson_confirmed_charge',
              amountGbp: lessonCost,
              hours: durationHours,
              createdByRole: 'instructor',
              note: `Lesson completed: ${durationHours.toFixed(2)}h @ £${hourlyRate}/h`
            });
          }
        }
      }

      // Update lesson or booking
      if (lessonId && lesson) {
        const updateData = {
          status: statusMap[data.completionOutcome],
          completionOutcome: data.completionOutcome,
          chargesApplied: data.chargesApplied,
          completedAt: new Date().toISOString()
        };
        
        // Only include optional fields if they have values
        if (data.chargesDecisionReason) {
          updateData.chargesDecisionReason = data.chargesDecisionReason;
        }
        if (data.completionNote) {
          updateData.completionNote = data.completionNote;
        }
        
        await base44.entities.Lesson.update(lessonId, updateData);
      } else if (bookingId && booking) {
        const updateData = {
          instructorId: booking.instructorId,
          pupilId: booking.pupilId,
          startAt: booking.startAt,
          endAt: booking.endAt,
          status: data.completionOutcome === 'completed' ? 'COMPLETED' : 
                  data.completionOutcome === 'cancelled' ? 'CANCELLED' : 'NO_SHOW',
          chargesApplied: data.chargesApplied
        };
        
        // Only include optional fields if they have values
        if (data.chargesDecisionReason) {
          updateData.chargesDecisionReason = data.chargesDecisionReason;
        }
        if (data.completionNote) {
          updateData.completionNote = data.completionNote;
        }
        
        await base44.entities.LessonBooking.update(bookingId, updateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      queryClient.invalidateQueries(['lesson', lessonId]);
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['booking', bookingId]);
      queryClient.invalidateQueries(['pupils']);
      queryClient.invalidateQueries(['lessonBookings']);
      toast({ title: 'Lesson outcome saved', duration: 3000 });
      setConfirmDialogOpen(false);
      onClose();
    },
    onError: (error) => {
      setConfirmDialogOpen(false);
      toast({ 
        title: 'Failed to save outcome', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = () => {
    if (!formData.completionOutcome) {
      toast({ title: 'Please select an outcome', variant: 'destructive' });
      return;
    }

    // Prevent marking future lessons as completed or no show
    if (isFutureLesson && (formData.completionOutcome === 'completed' || formData.completionOutcome === 'no_show')) {
      toast({ 
        title: `Future lessons cannot be marked as ${formData.completionOutcome === 'completed' ? 'completed' : 'no show'}`, 
        variant: 'destructive' 
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    // Keep dialog open while saving, it will close on success/error
    updateOutcomeMutation.mutate(formData);
  };

  const handleOutcomeChange = (value) => {
    // Reset to cancelled if trying to select completed/no_show for future lesson
    if (isFutureLesson && (value === 'completed' || value === 'no_show')) {
      setFormData({
        ...formData,
        completionOutcome: 'cancelled',
        chargesApplied: formData.chargesApplied
      });
      return;
    }
    
    setFormData({
      ...formData,
      completionOutcome: value,
      chargesApplied: value === 'completed' ? true : formData.chargesApplied
    });
  };

  const currentRecord = lesson || booking;
  const pupilId = lesson?.pupilId || booking?.pupilId;
  const pupil = pupils.find(p => p.id === pupilId);
  const isCompleted = formData.completionOutcome === 'completed';
  const showChargesOptions = formData.completionOutcome === 'cancelled' || formData.completionOutcome === 'no_show';

  // Check if lesson is in the future
  const isFutureLesson = React.useMemo(() => {
    if (lesson) {
      const lessonDateTime = moment(`${lesson.date} ${lesson.startTime}`, 'YYYY-MM-DD HH:mm');
      return lessonDateTime.isAfter(moment());
    } else if (booking) {
      return moment(booking.startAtUtc).isAfter(moment());
    }
    return false;
  }, [lesson, booking]);

  const isLoading = updateOutcomeMutation.isPending;

  if (!currentRecord) {
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
                {lesson ? moment(lesson.date).format('DD MMM YYYY') : moment(booking.startAtUtc).local().format('DD MMM YYYY')}
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                {lesson ? `${lesson.startTime} – ${lesson.endTime}` : `${moment(booking.startAtUtc).local().format('HH:mm')} – ${moment(booking.endAtUtc).local().format('HH:mm')}`}
              </div>
              <p className="font-medium text-slate-800">
                {pupil?.firstName} {pupil?.lastName}
              </p>
            </div>

            {/* Outcome Selection */}
            <div className="space-y-2">
              <Label>Outcome *</Label>
              {isFutureLesson && (
                <p className="text-xs text-amber-600 mb-2">
                  ⚠️ This is a future lesson. Only cancellation is allowed.
                </p>
              )}
              <RadioGroup value={formData.completionOutcome} onValueChange={handleOutcomeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="completed" id="completed" disabled={isFutureLesson} />
                  <Label htmlFor="completed" className={`font-normal ${isFutureLesson ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer'}`}>
                    Completed {isFutureLesson && '(future lesson)'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cancelled" id="cancelled" />
                  <Label htmlFor="cancelled" className="font-normal cursor-pointer">
                    Cancelled
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_show" id="no_show" disabled={isFutureLesson} />
                  <Label htmlFor="no_show" className={`font-normal ${isFutureLesson ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer'}`}>
                    No show {isFutureLesson && '(future lesson)'}
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
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}