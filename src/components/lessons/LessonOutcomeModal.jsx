import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import { Loader2, Calendar, Clock, Gauge } from 'lucide-react';
import moment from 'moment';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

export default function LessonOutcomeModal({ open, onClose, lessonId, bookingId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    completionOutcome: 'completed',
    chargesApplied: true,
    chargesDecisionReason: '',
    mainTopic: '',
    completionNote: '',
    startMileage: '',
    endMileage: ''
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
        mainTopic: '',
        completionNote: '',
    startMileage: '',
    endMileage: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (open && booking?.startMileage != null) {
      setFormData(prev => ({ ...prev, startMileage: String(booking.startMileage) }));
    }
  }, [open, booking?.startMileage]);

  const [insufficientBalanceData, setInsufficientBalanceData] = React.useState(null);

  const updateOutcomeMutation = useMutation({
    mutationFn: async (data) => {
      const statusMap = {
        completed: 'Completed',
        cancelled: 'Cancelled',
        no_show: 'no_show'
      };

      // Update lesson or booking
      if (lessonId && lesson) {
        await base44.entities.Lesson.update(lessonId, {
          status: statusMap[data.completionOutcome],
          completionOutcome: data.completionOutcome,
          chargesApplied: data.chargesApplied,
          chargesDecisionReason: data.chargesDecisionReason || null,
          mainTopic: data.mainTopic || null,
          completionNote: data.completionNote || null,
          startMileage: data.startMileage ? Number(data.startMileage) : null,
          endMileage: data.endMileage ? Number(data.endMileage) : null,
          completedAt: new Date().toISOString()
        });
      } else if (bookingId && booking) {
        await base44.entities.LessonBooking.update(bookingId, {
          status: data.completionOutcome,
          completionOutcome: data.completionOutcome,
          chargesApplied: data.chargesApplied,
          chargesDecisionReason: data.chargesDecisionReason || null,
          mainTopic: data.mainTopic || null,
          completionNote: data.completionNote || null,
          startMileage: data.startMileage ? Number(data.startMileage) : null,
          endMileage: data.endMileage ? Number(data.endMileage) : null,
          completedAt: new Date().toISOString()
        });
      }

      // Apply charges and update hours logic
      const pupilId = lesson?.pupilId || booking?.pupilId;
      const pupil = pupils.find(p => p.id === pupilId);
      
      if (pupil) {
        let durationHours = 0;
        if (lesson) {
          const startMoment = moment(lesson.startTime, 'HH:mm');
          const endMoment = moment(lesson.endTime, 'HH:mm');
          durationHours = endMoment.diff(startMoment, 'minutes') / 60;
        } else if (booking) {
          durationHours = booking.durationHours || 0;
        }
        
        const hourlyRate = pupil.hourlyRate || 0;
        const lessonCost = durationHours * hourlyRate;
        
        // Check if this booking had escrow (was auto-confirmed with balance deduction)
        const hasEscrow = bookingId && (booking?.escrowAmountGbp || 0) > 0;

        // Handle COMPLETED lessons
        if (data.completionOutcome === 'completed') {
          // Always add to actual lesson hours
          const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;

          if (hasEscrow) {
            // Balance was already deducted at booking time via escrow - just release escrow
            await base44.entities.LessonBooking.update(bookingId, {
              escrowAmountGbp: 0,
              escrowReleasedAt: new Date().toISOString()
            });
            await base44.entities.Pupil.update(pupil.id, { hoursCompleted: newHoursCompleted });

            if (lessonCost > 0) {
              await base44.entities.PaymentLedger.create({
                userId: pupil.linkedUserId || pupil.id,
                bookingId: bookingId,
                type: 'charge',
                reason: 'lesson_confirmed_charge',
                amountGbp: 0, // already charged at booking
                hours: durationHours,
                createdByRole: 'instructor',
                note: `Escrow released - lesson completed: ${durationHours.toFixed(2)}h @ £${hourlyRate}/h`
              });
            }
          } else if (data.chargesApplied) {
            // No escrow (manually scheduled lesson) - deduct now
            const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
            await base44.entities.Pupil.update(pupil.id, { 
              hoursCompleted: newHoursCompleted,
              bulkPaymentBalance: newBalance
            });
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
          } else {
            // No charges waived
            await base44.entities.Pupil.update(pupil.id, { hoursCompleted: newHoursCompleted });
          }
        } 
        // Handle NO_SHOW lessons
        else if (data.completionOutcome === 'no_show') {
          const newAuditNoShowHours = (pupil.auditNoShowHours || 0) + durationHours;
          
          if (hasEscrow) {
            // Balance already deducted via escrow - just release escrow & track audit
            await base44.entities.LessonBooking.update(bookingId, {
              escrowAmountGbp: 0,
              escrowReleasedAt: new Date().toISOString()
            });
            await base44.entities.Pupil.update(pupil.id, { auditNoShowHours: newAuditNoShowHours });
            await base44.entities.PaymentLedger.create({
              userId: pupil.linkedUserId || pupil.id,
              bookingId: bookingId,
              type: 'charge',
              reason: 'late_cancellation_penalty',
              amountGbp: 0,
              hours: durationHours,
              createdByRole: 'instructor',
              note: `Escrow retained - no show: ${durationHours.toFixed(2)}h`
            });
          } else if (data.chargesApplied) {
            const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
            await base44.entities.Pupil.update(pupil.id, { 
              auditNoShowHours: newAuditNoShowHours,
              bulkPaymentBalance: newBalance
            });
            if (lessonCost > 0) {
              await base44.entities.PaymentLedger.create({
                userId: pupil.linkedUserId || pupil.id,
                bookingId: bookingId || null,
                type: 'charge',
                reason: 'late_cancellation_penalty',
                amountGbp: lessonCost,
                hours: durationHours,
                createdByRole: 'instructor',
                note: `No show penalty: ${durationHours.toFixed(2)}h @ £${hourlyRate}/h`
              });
            }
          } else {
            await base44.entities.Pupil.update(pupil.id, { auditNoShowHours: newAuditNoShowHours });
          }
        }
        // Handle CANCELLED lessons
        else if (data.completionOutcome === 'cancelled') {
          if (hasEscrow) {
            const escrowAmount = booking.escrowAmountGbp || 0;
            if (data.chargesApplied) {
              // Instructor keeps the escrow as a cancellation charge — just release it, no refund
              await base44.entities.LessonBooking.update(bookingId, { escrowAmountGbp: 0, escrowReleasedAt: new Date().toISOString() });
              await base44.entities.PaymentLedger.create({
                userId: pupil.linkedUserId || pupil.id,
                bookingId: bookingId,
                type: 'charge',
                reason: 'late_cancellation_penalty',
                amountGbp: 0, // already deducted from balance at booking
                hours: durationHours,
                createdByRole: 'instructor',
                note: `Escrow retained - cancellation charge: ${durationHours.toFixed(2)}h`
              });
            } else {
              // No charges — clear escrow but do NOT credit pupil (money stays neutral until instructor decides)
              await base44.entities.LessonBooking.update(bookingId, { escrowAmountGbp: 0 });
            }
          } else if (data.chargesApplied) {
            const newAuditLateCancellationHours = (pupil.auditLateCancellationHours || 0) + durationHours;
            const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
            await base44.entities.Pupil.update(pupil.id, { 
              auditLateCancellationHours: newAuditLateCancellationHours,
              bulkPaymentBalance: newBalance
            });
            if (lessonCost > 0) {
              await base44.entities.PaymentLedger.create({
                userId: pupil.linkedUserId || pupil.id,
                bookingId: bookingId || null,
                type: 'charge',
                reason: 'late_cancellation_penalty',
                amountGbp: lessonCost,
                hours: durationHours,
                createdByRole: 'instructor',
                note: `Late cancellation penalty: ${durationHours.toFixed(2)}h @ £${hourlyRate}/h`
              });
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      queryClient.invalidateQueries(['lesson', lessonId]);
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['booking', bookingId]);
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

    if (formData.completionOutcome === 'completed' && !formData.mainTopic) {
      toast({ title: 'Please select a main topic for completed lessons', variant: 'destructive' });
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

    // Check for insufficient balance before confirming
    if (formData.chargesApplied && pupil) {
      let durationHours = 0;
      if (lesson) {
        const startMoment = moment(lesson.startTime, 'HH:mm');
        const endMoment = moment(lesson.endTime, 'HH:mm');
        durationHours = endMoment.diff(startMoment, 'minutes') / 60;
      } else if (booking) {
        durationHours = booking.durationHours || 0;
      }
      
      const hourlyRate = pupil.hourlyRate || 0;
      const lessonCost = durationHours * hourlyRate;
      const currentBalance = pupil.bulkPaymentBalance || 0;
      const newBalance = currentBalance - lessonCost;
      
      if (newBalance < 0) {
        setInsufficientBalanceData({
          currentBalance,
          lessonCost,
          newBalance,
          durationHours,
          hourlyRate
        });
        return;
      }
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    setConfirmDialogOpen(false);
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
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                {lesson ? moment(lesson.date).format('DD MMM YYYY') : moment(booking.startAtUtc).local().format('DD MMM YYYY')}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                {lesson ? `${lesson.startTime} – ${lesson.endTime}` : `${moment(booking.startAtUtc).local().format('HH:mm')} – ${moment(booking.endAtUtc).local().format('HH:mm')}`}
              </div>
              <p className="font-medium text-slate-800">
                {pupil?.firstName} {pupil?.lastName}
              </p>
              {(booking || lesson) && (() => {
                // Extract pickup/dropoff from notesFromPupil if available
                let pickup = booking?.pickupLocation || lesson?.location;
                let dropoff = null;
                let otherNotes = booking?.notesFromPupil;
                
                if (booking?.notesFromPupil) {
                  const pickupMatch = booking.notesFromPupil.match(/Pickup:\s*([^|]+)/i);
                  const dropoffMatch = booking.notesFromPupil.match(/Dropoff:\s*([^|]+)/i);
                  
                  if (pickupMatch) {
                    pickup = pickupMatch[1].trim();
                  }
                  if (dropoffMatch) {
                    dropoff = dropoffMatch[1].trim();
                  }
                  
                  // Remove pickup/dropoff from other notes
                  otherNotes = booking.notesFromPupil
                    .replace(/Pickup:\s*[^|]+\s*\|?\s*/gi, '')
                    .replace(/Dropoff:\s*[^|]+\s*\|?\s*/gi, '')
                    .trim();
                  
                  if (otherNotes.startsWith('|')) otherNotes = otherNotes.substring(1).trim();
                  if (otherNotes.endsWith('|')) otherNotes = otherNotes.substring(0, otherNotes.length - 1).trim();
                }
                
                return (
                  <>
                    {pickup && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Pickup:</p>
                        <p className="text-slate-700">{pickup}</p>
                      </div>
                    )}
                    {dropoff && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Dropoff:</p>
                        <p className="text-slate-700">{dropoff}</p>
                      </div>
                    )}
                    {otherNotes && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Notes:</p>
                        <p className="text-slate-700 text-xs">{otherNotes}</p>
                      </div>
                    )}
                  </>
                );
              })()}
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

            {/* Main Topic (required for completed lessons) */}
            {formData.completionOutcome === 'completed' && (
              <div className="space-y-2">
                <Label htmlFor="mainTopic">Main Topic *</Label>
                <Select 
                  value={formData.mainTopic} 
                  onValueChange={(value) => setFormData({ ...formData, mainTopic: value })}
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
              </div>
            )}

            {/* What Was Covered / Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">What Was Covered (optional)</Label>
              <Textarea
                id="notes"
                value={formData.completionNote}
                onChange={(e) => setFormData({ ...formData, completionNote: e.target.value })}
                placeholder="Add any notes about what was covered in the lesson..."
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

      {/* Insufficient Balance Warning */}
      <AlertDialog open={!!insufficientBalanceData} onOpenChange={() => setInsufficientBalanceData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Insufficient Balance</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>The pupil's balance is insufficient to cover this lesson. Continuing will result in a negative balance.</p>
              
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Balance:</span>
                  <span className="font-medium">£{insufficientBalanceData?.currentBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Lesson Cost:</span>
                  <span className="font-medium text-rose-600">
                    -£{insufficientBalanceData?.lessonCost.toFixed(2)}
                    <span className="text-xs text-slate-500 ml-1">
                      ({insufficientBalanceData?.durationHours.toFixed(2)}h @ £{insufficientBalanceData?.hourlyRate}/h)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">New Balance:</span>
                  <span className="font-bold text-rose-600">£{insufficientBalanceData?.newBalance.toFixed(2)}</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-600">Do you want to proceed with a negative balance?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setInsufficientBalanceData(null);
                setConfirmDialogOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Confirm & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}