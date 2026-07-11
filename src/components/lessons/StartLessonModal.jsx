import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Clock, User, Gauge, Target } from 'lucide-react';
import moment from 'moment';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

export default function StartLessonModal({ open, onClose, bookingId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startMileage, setStartMileage] = useState('');
  const [lessonObjectives, setLessonObjectives] = useState('');

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.LessonBooking.filter({ id: bookingId });
      return bookings[0] || null;
    },
    enabled: open && !!bookingId
  });

  const { data: pupil } = useQuery({
    queryKey: ['pupil', booking?.pupilId],
    queryFn: () => base44.entities.Pupil.filter({ id: booking.pupilId }).then(p => p[0]),
    enabled: !!booking?.pupilId
  });

  useEffect(() => {
    if (open) {
      setStartMileage('');
      setLessonObjectives('');
    }
  }, [open]);

  const startLessonMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'in_progress',
        startMileage: startMileage ? Number(startMileage) : null,
        lessonObjectives: lessonObjectives || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['booking', bookingId]);
      queryClient.invalidateQueries(['instructorBookings']);
      queryClient.invalidateQueries(['myBookings']);
      toast({ title: 'Lesson started' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to start lesson', variant: 'destructive' });
    }
  });

  const handleSubmit = () => {
    if (!startMileage) {
      toast({ title: 'Please enter the start mileage', variant: 'destructive' });
      return;
    }
    startLessonMutation.mutate();
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-teal-600" />
            Start Lesson
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Lesson Info */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              {moment(booking.startAtUtc).local().format('DD MMM YYYY')}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              {moment(booking.startAtUtc).local().format('HH:mm')} – {moment(booking.endAtUtc).local().format('HH:mm')}
            </div>
            {pupil && (
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4" />
                {pupil.firstName} {pupil.lastName}
              </div>
            )}
          </div>

          {/* Start Mileage */}
          <div className="space-y-2">
            <Label htmlFor="startMileage" className="flex items-center gap-1">
              <Gauge className="w-4 h-4 text-teal-600" />
              Start Mileage (miles) *
            </Label>
            <Input
              id="startMileage"
              type="number"
              value={startMileage}
              onChange={(e) => setStartMileage(e.target.value)}
              placeholder="e.g., 12345"
            />
            <p className="text-xs text-slate-500">Enter the current odometer reading at the start of the lesson.</p>
          </div>

          {/* Lesson Objectives */}
          <div className="space-y-2">
            <Label htmlFor="lessonObjectives" className="flex items-center gap-1">
              <Target className="w-4 h-4 text-teal-600" />
              Lesson Objectives
            </Label>
            <Select
              value={lessonObjectives}
              onValueChange={(value) => setLessonObjectives(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select main topic..." />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={startLessonMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={startLessonMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {startLessonMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Lesson'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}