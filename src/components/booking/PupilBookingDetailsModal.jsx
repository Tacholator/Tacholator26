import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import moment from 'moment';

export default function PupilBookingDetailsModal({
  open,
  onOpenChange,
  booking,
  onCancel,
  isCancelling
}) {
  if (!booking) return null;

  const isPending = booking.status === 'reserved_pending_instructor';
  const isConfirmed = booking.status === 'confirmed';
  const startMoment = moment(booking.startAtUtc).local();
  const endMoment = moment(booking.endAtUtc).local();
  const hoursUntilStart = startMoment.diff(moment(), 'hours', true);
  // Pending bookings (not yet approved by instructor) can always be cancelled without penalty
  const isLateCancellation = !isPending && hoursUntilStart < 48;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lesson Details</DialogTitle>
          <DialogDescription>
            {isPending ? 'Awaiting instructor approval' : 'Confirmed lesson booking'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div>
            <Badge className={isPending ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
              {isPending ? 'Pending Approval' : 'Confirmed'}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{startMoment.format('dddd, D MMMM YYYY')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4" />
              <span>
                {startMoment.format('HH:mm')} - {endMoment.format('HH:mm')}
                {' '}({booking.durationHours}h)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-sm text-slate-600">Total Price</div>
            <div className="text-2xl font-bold text-slate-800">£{booking.totalPriceGbp.toFixed(2)}</div>
          </div>

          {/* Locations */}
          {(booking.pickupLocation || booking.dropoffLocation) && (
            <div className="space-y-2 bg-slate-50 rounded-lg p-3">
              {booking.pickupLocation && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500">Pickup: </span>
                    <span className="font-medium text-slate-700">{booking.pickupLocation}</span>
                  </div>
                </div>
              )}
              {booking.dropoffLocation && booking.dropoffLocation !== booking.pickupLocation && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500">Drop-off: </span>
                    <span className="font-medium text-slate-700">{booking.dropoffLocation}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {booking.notesFromPupil && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-700">Notes</div>
              <div className="text-sm text-slate-600 bg-slate-50 rounded p-2">
                {booking.notesFromPupil}
              </div>
            </div>
          )}

          {/* Late Cancellation Warning */}
          {isLateCancellation && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Late cancellation policy:</strong> Cancelling within 48 hours will deduct the full lesson price (£{booking.totalPriceGbp.toFixed(2)}) from your balance.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          {(isPending || isConfirmed) && (
            <Button
              variant="destructive"
              onClick={() => onCancel(booking, isLateCancellation)}
              disabled={isCancelling}
              className="w-full sm:w-auto"
            >
              {isCancelling ? 'Cancelling...' : isPending ? 'Cancel Pending Booking' : isLateCancellation ? 'Cancel (Full Deduction)' : 'Cancel Booking'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}