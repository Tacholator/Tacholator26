import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import moment from 'moment';

export default function NotifyArrivalButton({ lesson, pupil }) {
  const queryClient = useQueryClient();

  const notifyArrivalMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      
      // Update lesson
      await base44.entities.Lesson.update(lesson.id, {
        arrivalNotified: true,
        arrivalNotifiedAt: now
      });

      // Create notification for pupil
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Your instructor has arrived',
          message: `Your Mobrage instructor has arrived for your lesson scheduled at ${lesson.startTime}.`,
          type: 'lesson_arrival',
          linkTarget: 'LearnerDashboard',
          linkTargetType: 'lesson',
          linkTargetId: lesson.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
    }
  });

  // Show status if already notified
  if (lesson.arrivalNotified) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Bell className="w-3 h-3" />
          <span>Notified at {moment(lesson.arrivalNotifiedAt).format('h:mm a')}</span>
        </div>
        {lesson.pupilAcknowledged ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            <span>Acknowledged at {moment(lesson.pupilAcknowledgedAt).format('h:mm a')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            <span>Waiting for acknowledgement...</span>
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