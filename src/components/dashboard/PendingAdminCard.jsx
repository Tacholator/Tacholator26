import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import moment from 'moment';

/**
 * Shows lessons/bookings that have ended but have NOT been marked as completed
 * (no completionOutcome and status not completed). Latest first.
 * Accepts a normalized `items` list (lessons + non-test bookings) where each
 * item has: { id, date, startTime, endTime, pupilId, status, completionOutcome }.
 * An item leaves this list once the instructor sets its outcome.
 */
// Bookings with these statuses are finished for admin purposes and must never
// be listed, even though they carry no completionOutcome.
const CLOSED_STATUSES = [
  'cancelled',
  'cancelled_by_pupil',
  'cancelled_late_by_pupil',
  'declined_by_instructor',
  'deleted'
];

export default function PendingAdminCard({ items = [], pupils = [], isLoading, onMarkLesson }) {
  const now = moment();
  const cutoff = moment('2026-10-01', 'YYYY-MM-DD').startOf('day');

  const pending = items
    .filter(item => {
      if (item.type !== 'booking') return false;
      if (!item.date || !item.endTime) return false;
      // Cancelled / declined / deleted bookings are not awaiting an outcome
      if (CLOSED_STATUSES.includes(item.status)) return false;
      const end = moment(`${item.date} ${item.endTime}`, 'YYYY-MM-DD HH:mm');
      // Only consider lessons from 1 Oct 2026 onwards
      if (end.isBefore(cutoff)) return false;
      // Ended and not yet marked complete (no outcome, status not completed)
      const ended = end.isBefore(now);
      const isCompleted = item.status === 'completed' || !!item.completionOutcome;
      return ended && !isCompleted;
    })
    .sort((a, b) => {
      const aEnd = moment(`${a.date} ${a.endTime}`, 'YYYY-MM-DD HH:mm');
      const bEnd = moment(`${b.date} ${b.endTime}`, 'YYYY-MM-DD HH:mm');
      return bEnd.diff(aEnd);
    });

  const pupilName = (pupilId) => {
    const p = pupils.find(p => p.id === pupilId);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown Pupil';
  };

  if (!isLoading && pending.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-rose-50 to-orange-100 border border-rose-200 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-rose-600" />
            Pending Admin
          </h3>
          {pending.length > 0 && (
            <Badge className="bg-rose-600 text-white">{pending.length} awaiting</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
          </div>
        ) : (
          <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin pr-1">
            {pending.map(item => {
              const start = moment(`${item.date} ${item.startTime}`, 'YYYY-MM-DD HH:mm');
              const end = moment(`${item.date} ${item.endTime}`, 'YYYY-MM-DD HH:mm');
              return (
                <div
                  key={item.id}
                  className="bg-white/80 rounded-lg p-3 border border-rose-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {pupilName(item.pupilId)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {start.format('ddd D MMM')} · {start.format('HH:mm')}–{end.format('HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link to={createPageUrl('PupilProfile') + `?id=${item.pupilId}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => onMarkLesson(item)}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}