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
    mutationFn: async (option) => {
      const now = new Date().toISOString();
      await base44.entities.Notification.update(notification.id, {
        acknowledged: true,
        acknowledgedAt: now,
        readAt: now,
        acknowledgementOption: option
      });
      if (lesson) {
        await base44.entities.Lesson.update(lesson.id, {
          pupilAcknowledged: true,
          pupilAcknowledgedAt: now,
          pupilAcknowledgementOption: option
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['lessons']);
    }
  });

  if (notification.acknowledged) {
    const responseText = notification.acknowledgementOption === 'on_my_way' ? "I'm on my way" : 'Got it';
    return (
      <Card className="bg-emerald-50 border-emerald-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">Response Sent</p>
            <p className="text-xs text-emerald-700">
              You responded "{responseText}" at {moment(notification.acknowledgedAt).format('h:mm a')}
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
          <div className="flex gap-2">
            <Button
              onClick={() => acknowledgeMutation.mutate('on_my_way')}
              disabled={acknowledgeMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
              size="sm"
            >
              {acknowledgeMutation.isPending ? 'Sending...' : "I'm on my way"}
            </Button>
            <Button
              onClick={() => acknowledgeMutation.mutate('got_it')}
              disabled={acknowledgeMutation.isPending}
              variant="outline"
              className="border-teal-600 text-teal-700 hover:bg-teal-50"
              size="sm"
            >
              {acknowledgeMutation.isPending ? 'Sending...' : 'Got it'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}