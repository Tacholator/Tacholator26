import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

const STATUS_CONFIG = {
  AVAILABLE: { accent: 'border-l-blue-500 bg-blue-50/30', badge: 'bg-blue-100 text-blue-700' },
  PENDING: { accent: 'border-l-amber-500 bg-amber-50/30', badge: 'bg-amber-100 text-amber-700' },
  APPROVED: { accent: 'border-l-green-500 bg-green-50/30', badge: 'bg-green-100 text-green-700' },
  COMPLETED: { accent: 'border-l-slate-500 bg-slate-50/30', badge: 'bg-slate-100 text-slate-700' },
  CANCELLED: { accent: 'border-l-orange-500 bg-orange-50/30', badge: 'bg-orange-100 text-orange-700' },
  NO_SHOW: { accent: 'border-l-red-500 bg-red-50/30', badge: 'bg-red-100 text-red-700' },
};

export default function BookingCard({ booking }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState(null);

  const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.AVAILABLE;

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      return await base44.entities.LessonBooking.update(booking.id, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setActionBusy(false);
    },
    onError: (error) => {
      setActionError('Unable to update booking status.');
      setActionBusy(false);
    },
  });

  const handleApprove = async () => {
    setActionBusy(true);
    setActionError(null);
    await updateStatusMutation.mutateAsync('APPROVED');
  };

  const handleCancel = async () => {
    setActionBusy(true);
    setActionError(null);
    await updateStatusMutation.mutateAsync('CANCELLED');
  };

  const dateLabel = booking.dateLabel || moment(booking.startAt).format('ddd D MMM YYYY');
  const timeLabel = booking.timeLabel || `${moment(booking.startAt).format('HH:mm')} - ${moment(booking.endAt).format('HH:mm')}`;

  const showPupil = booking.status !== 'AVAILABLE' && booking.pupil?.fullName;
  const showLocation = (booking.status === 'APPROVED' || booking.status === 'COMPLETED') && booking.location;
  const showCancelReason = booking.status === 'CANCELLED' && booking.cancellationReason;

  return (
    <Card className={`border-l-4 ${config.accent} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 space-y-3">
        {/* Header: Date/Time + Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">{dateLabel}</h3>
            <p className="text-sm text-slate-600">{timeLabel}</p>
          </div>
          <Badge className={config.badge}>{booking.status}</Badge>
        </div>

        {/* Pupil (if not AVAILABLE) */}
        {showPupil && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User className="w-4 h-4" />
            <span>Pupil: {booking.pupil.fullName}</span>
          </div>
        )}

        {/* Location (APPROVED/COMPLETED only) */}
        {showLocation && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin className="w-4 h-4" />
              <span>{booking.location.name || 'Location'}</span>
            </div>
            {(booking.location.addressLine1 || booking.location.postcode) && (
              <p className="text-xs text-slate-500 ml-6">
                {[booking.location.addressLine1, booking.location.postcode].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        )}

        {/* Cancellation Reason */}
        {showCancelReason && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Info className="w-4 h-4 mt-0.5" />
            <span>Reason: {booking.cancellationReason}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {booking.status === 'AVAILABLE' && (
            <Button
              onClick={() => navigate(createPageUrl('InstructorScheduleLessonModal', `?bookingId=${booking.id}`))}
              disabled={actionBusy}
            >
              Book Slot
            </Button>
          )}

          {booking.status === 'PENDING' && (
            <>
              <Button onClick={handleApprove} disabled={actionBusy}>
                Approve
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={actionBusy}>
                Cancel
              </Button>
            </>
          )}

          {booking.status === 'APPROVED' && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('EditBooking', `?bookingId=${booking.id}`))}
                disabled={actionBusy}
              >
                Edit
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={actionBusy}>
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}