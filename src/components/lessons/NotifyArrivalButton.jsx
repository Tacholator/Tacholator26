import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import moment from 'moment';

export default function NotifyArrivalButton({ lesson, pupil, lessonId, bookingId, pupilId }) {
  const queryClient = useQueryClient();

  const { data: fetchedLesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const lessons = await base44.entities.Lesson.filter({ id: lessonId });
      return lessons[0] || null;
    },
    enabled: !!lessonId && !lesson
  });

  const { data: fetchedBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const bookings = await base44.entities.LessonBooking.filter({ id: bookingId });
      return bookings[0] || null;
    },
    enabled: !!bookingId && !lesson
  });

  const { data: fetchedPupil } = useQuery({
    queryKey: ['pupil', pupilId || lesson?.pupilId || fetchedLesson?.pupilId || fetchedBooking?.pupilId],
    queryFn: async () => {
      const id = pupilId || lesson?.pupilId || fetchedLesson?.pupilId || fetchedBooking?.pupilId;
      if (!id) return null;
      const pupils = await base44.entities.Pupil.filter({ id });
      return pupils[0] || null;
    },
    enabled: !!(pupilId || lesson?.pupilId || fetchedLesson?.pupilId || fetchedBooking?.pupilId) && !pupil
  });

  const currentLesson = lesson || fetchedLesson;
  const currentBooking = fetchedBooking;
  const currentPupil = pupil || fetchedPupil;

  const notifyArrivalMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const targetLesson = lesson || fetchedLesson;
      const targetBooking = fetchedBooking;
      const targetPupil = pupil || fetchedPupil;
      
      // Update lesson or booking
      if (targetLesson) {
        await base44.entities.Lesson.update(targetLesson.id, {
          arrivalNotified: true,
          arrivalNotifiedAt: now
        });
      } else if (targetBooking) {
        await base44.entities.LessonBooking.update(targetBooking.id, {
          arrivalNotified: true,
          arrivalNotifiedAt: now
        });
      }

      // Create notification for pupil
      if (targetPupil?.linkedUserId) {
        const { createNotificationIfAllowed } = await import('@/components/notifications/notificationHelper');
        const startTime = targetLesson?.startTime || moment(targetBooking?.startAtUtc).local().format('HH:mm');
        await createNotificationIfAllowed({
          userId: targetPupil.linkedUserId,
          title: 'Your instructor has arrived',
          message: `Your Mobrage instructor has arrived for your lesson scheduled at ${startTime}.`,
          type: 'lesson_arrival',
          linkTarget: 'LearnerDashboard',
          linkTargetType: targetLesson ? 'lesson' : 'booking',
          linkTargetId: targetLesson?.id || targetBooking?.id
        }, false); // false = pupil is recipient
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      queryClient.invalidateQueries(['bookings']);
    }
  });

  const record = currentLesson || currentBooking;
  if (!record) return null;

  // Show status if already notified
  if (record.arrivalNotified) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Bell className="w-3 h-3" />
          <span>Notified at {moment(record.arrivalNotifiedAt).format('h:mm a')}</span>
        </div>
        {record.pupilAcknowledged ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            <span>
              Responded: {record.pupilAcknowledgementOption === 'on_my_way' ? "I'm on my way" : 'Got it'} at {moment(record.pupilAcknowledgedAt).format('h:mm a')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            <span>Waiting for pupil response...</span>
          </div>
        )}
      </div>
    );
  }

  // Show notify button
  return (
    <Button
      onClick={() => notifyArrivalMutation.mutate()}
      disabled={notifyArrivalMutation.isPending}
      size="sm"
      className="bg-teal-600 hover:bg-teal-700"
    >
      <Bell className="w-4 h-4 mr-2" />
      {notifyArrivalMutation.isPending ? 'Notifying...' : 'Notify Arrival'}
    </Button>
  );
}