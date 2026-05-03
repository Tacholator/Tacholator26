import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, User } from 'lucide-react';
import moment from 'moment';

const STATUS_CONFIG = {
  completed:   { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700' },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700' },
  cancelled:   { label: 'Cancelled',   color: 'bg-orange-100 text-orange-700' },
  cancelled_by_pupil:      { label: 'Cancelled by Pupil',      color: 'bg-orange-100 text-orange-700' },
  cancelled_late_by_pupil: { label: 'Late Cancellation',       color: 'bg-red-100 text-red-700' },
  declined_by_instructor:  { label: 'Declined',                color: 'bg-slate-100 text-slate-600' },
  no_show:     { label: 'No Show',     color: 'bg-red-100 text-red-700' },
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
}

export default function PupilLessonHistory({ pupils, instructorId }) {
  const [selectedPupilId, setSelectedPupilId] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['pupilLessonHistoryBookings', instructorId],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId, isDeleted: false }),
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = selectedPupilId === 'all'
    ? bookings
    : bookings.filter(b => b.pupilId === selectedPupilId);

  const sorted = [...filtered].sort((a, b) =>
    moment(b.startAtUtc).diff(moment(a.startAtUtc))
  );

  const pupilMap = Object.fromEntries(pupils.map(p => [p.id, p]));

  const stats = {
    total: sorted.length,
    completed: sorted.filter(b => b.status === 'completed').length,
    cancelled: sorted.filter(b => ['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil'].includes(b.status)).length,
    noShow: sorted.filter(b => b.status === 'no_show').length,
    totalHours: sorted.filter(b => b.status === 'completed').reduce((s, b) => s + (b.durationHours || 0), 0),
    totalEarned: sorted.filter(b => b.status === 'completed').reduce((s, b) => s + (b.totalPriceGbp || 0), 0),
  };

  return (
    <div className="space-y-5">
      {/* Pupil selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">Filter by pupil:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedPupilId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPupilId === 'all'
                ? 'bg-[#071739] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Pupils
          </button>
          {pupils.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPupilId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedPupilId === p.id
                  ? 'bg-[#F7B602] text-[#071739]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.firstName} {p.lastName}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Lessons', value: stats.total, color: 'text-slate-700' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-orange-600' },
          { label: 'No Shows', value: stats.noShow, color: 'text-red-600' },
          { label: 'Total Hours', value: `${stats.totalHours.toFixed(1)}h`, color: 'text-blue-600' },
          { label: 'Total Earned', value: `£${stats.totalEarned.toFixed(0)}`, color: 'text-[#071739]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lesson list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-600">
            Lesson History {sorted.length > 0 && <span className="text-slate-400 font-normal">({sorted.length} lessons)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading lessons…</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Clock className="w-8 h-8 opacity-30" />
              <p className="text-sm">No lessons found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {sorted.map(b => {
                const pupil = pupilMap[b.pupilId];
                const sc = getStatusConfig(b.status);
                const isExpanded = expandedId === b.id;
                return (
                  <div key={b.id} className="border border-slate-100 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : b.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">
                            {moment(b.startAtUtc).format('ddd DD MMM YYYY')}
                          </span>
                          <span className="text-xs text-slate-500">
                            {moment(b.startAtUtc).format('HH:mm')} – {moment(b.endAtUtc).format('HH:mm')}
                          </span>
                          {selectedPupilId === 'all' && pupil && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <User className="w-3 h-3" />
                              {pupil.firstName} {pupil.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                        <span className="text-sm font-semibold text-slate-700">
                          {b.durationHours ? `${b.durationHours}h` : ''}
                        </span>
                        {b.status === 'completed' && (
                          <span className="text-sm font-bold text-emerald-600">£{(b.totalPriceGbp || 0).toFixed(0)}</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 pt-0 border-t border-slate-100 bg-white grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-600">
                        {b.mainTopic && (
                          <div><span className="text-slate-400">Topic:</span> <span className="font-medium">{b.mainTopic}</span></div>
                        )}
                        {b.pickupLocation && (
                          <div><span className="text-slate-400">Pickup:</span> <span className="font-medium">{b.pickupLocation}</span></div>
                        )}
                        {b.dropoffLocation && (
                          <div><span className="text-slate-400">Drop-off:</span> <span className="font-medium">{b.dropoffLocation}</span></div>
                        )}
                        {b.hourlyRateAtBookingGbp && (
                          <div><span className="text-slate-400">Rate:</span> <span className="font-medium">£{b.hourlyRateAtBookingGbp}/hr</span></div>
                        )}
                        {b.completionNote && (
                          <div className="col-span-2 sm:col-span-3"><span className="text-slate-400">Note:</span> <span className="font-medium">{b.completionNote}</span></div>
                        )}
                        {b.cancellationReason && (
                          <div className="col-span-2 sm:col-span-3"><span className="text-slate-400">Cancellation reason:</span> <span className="font-medium">{b.cancellationReason}</span></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}