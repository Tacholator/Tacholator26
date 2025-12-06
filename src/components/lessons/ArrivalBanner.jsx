import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import moment from 'moment';

export default function ArrivalBanner({ notification, lesson }) {
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      await base44.entities.Notification.update(notification.id, {
        acknowledged: true,
        acknowledgedAt: now,
        readAt: now
      });
      if (lesson) {
        await base44.entities.Lesson.update(lesson.id, {
          pupilAcknowledged: true,
          pupilAcknowledgedAt: now
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['lessons']);
    }
  });

  if (notification.acknowledged) {
    return (
      <Card className="bg-emerald-50 border-emerald-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">Arrival Acknowledged</p>
            <p className="text-xs text-emerald-700">
              You acknowledged your instructor's arrival at {moment(notification.acknowledgedAt).format('h:mm a')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-teal-50 border-teal-200 p-4 mb-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-teal-600 rounded-full p-2">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-teal-900 mb-1">Your instructor has arrived</h3>
          <p className="text-sm text-teal-800 mb-2">
            Your Mobrage instructor has arrived for your lesson. Please get ready.
          </p>
          <div className="flex items-center gap-2 text-xs text-teal-700 mb-3">
            <Clock className="w-3 h-3" />
            {moment(notification.created_date).fromNow()}
          </div>
          <Button
            onClick={() => acknowledgeMutation.mutate()}
            disabled={acknowledgeMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
            size="sm"
          >
            {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
          </Button>
        </div>
      </div>
    </Card>
  );
}