import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Calendar, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function PendingBookingsPanel({ 
  bookings = [], 
  pupils = [], 
  onConfirm, 
  onDecline,
  isLoading 
}) {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const getPupilName = (pupilId) => {
    const pupil = pupils.find(p => p.id === pupilId);
    return pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Unknown Pupil';
  };

  const handleDeclineClick = (booking) => {
    setSelectedBooking(booking);
    setShowDeclineDialog(true);
  };

  const handleDeclineConfirm = () => {
    onDecline(selectedBooking.id, declineReason);
    setShowDeclineDialog(false);
    setDeclineReason('');
    setSelectedBooking(null);
  };

  if (bookings.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Pending Booking Requests</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No pending requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Pending Booking Requests</span>
            <Badge className="bg-purple-100 text-purple-700">{bookings.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-800">
                      {getPupilName(booking.pupilId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{moment(booking.startAtUtc).local().format('ddd, D MMM YYYY')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {moment(booking.startAtUtc).local().format('HH:mm')} - {moment(booking.endAtUtc).local().format('HH:mm')}
                      {' '}({booking.durationHours}h)
                    </span>
                  </div>
                  <div className="text-sm font-medium text-emerald-700">
                    £{booking.totalPriceGbp.toFixed(2)}
                  </div>
                  {booking.notesFromPupil && (
                    <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3 mt-2">
                      "{booking.notesFromPupil}"
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    Requested {moment(booking.requestedAt || booking.created_date).fromNow()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => onConfirm(booking.id)}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineClick(booking)}
                    disabled={isLoading}
                    className="text-rose-600 hover:text-rose-700 gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this booking request. The pupil will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason <span className="text-rose-500">*</span></Label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., Slot no longer available"
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleDeclineConfirm}
              disabled={!declineReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Decline Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}