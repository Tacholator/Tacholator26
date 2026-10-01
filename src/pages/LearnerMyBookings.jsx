import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, FileText, AlertCircle, CheckCircle, XCircle, Loader2, MessageCircleQuestion } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  reserved_pending_instructor: { label: 'Awaiting Confirmation', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'In Progress', color: 'bg-teal-100 text-teal-800' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700' },
  cancelled_by_pupil: { label: 'Cancelled by You', color: 'bg-rose-100 text-rose-700' },
  cancelled_late_by_pupil: { label: 'Late Cancellation', color: 'bg-orange-100 text-orange-800' },
  declined_by_instructor: { label: 'Declined', color: 'bg-rose-100 text-rose-700' },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-700' },
  deleted: { label: 'Deleted', color: 'bg-gray-100 text-gray-500' },
};

function BookingCard({ booking }) {
  const [showReason, setShowReason] = useState(false);
  const statusConf = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
  const isCancelledOrDeclined = ['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor', 'no_show', 'deleted'].includes(booking.status);
  const isDeclined = booking.status === 'declined_by_instructor';
  const declineReason = booking.cancellationReason;

  return (
    <Card className={`mb-3 ${isDeclined ? 'border-rose-200 bg-rose-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Date & Time */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                {moment(booking.startAtUtc).local().format('ddd D MMM YYYY')}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                {moment(booking.startAtUtc).local().format('HH:mm')} – {moment(booking.endAtUtc).local().format('HH:mm')}
                <span className="text-slate-400">({booking.durationHours}h)</span>
              </div>
            </div>

            {/* Price */}
            {booking.totalPriceGbp != null && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">£{booking.totalPriceGbp.toFixed(2)}</span>
                {booking.hourlyRateAtBookingGbp && (
                  <span className="text-slate-400 ml-1">@ £{booking.hourlyRateAtBookingGbp}/hr</span>
                )}
              </div>
            )}

            {/* Pickup location */}
            {booking.pickupLocation && (
              <div className="flex items-start gap-1.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                {booking.pickupLocation}
              </div>
            )}

            {/* Notes from pupil */}
            {booking.notesFromPupil && (
              <div className="flex items-start gap-1.5 text-sm text-slate-600">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span><span className="font-medium">Your notes:</span> {booking.notesFromPupil}</span>
              </div>
            )}

            {/* Main topic */}
            {booking.mainTopic && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">Topic:</span> {booking.mainTopic}
              </div>
            )}

            {/* Completion note */}
            {booking.completionNote && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">Instructor note:</span> {booking.completionNote}
              </div>
            )}

            {/* Cancellation reason (inline for non-declined cancellations) */}
            {isCancelledOrDeclined && !isDeclined && booking.cancellationReason && (
              <div className="flex items-start gap-1.5 text-sm text-rose-700 bg-rose-50 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span><span className="font-medium">Reason:</span> {booking.cancellationReason}</span>
              </div>
            )}

            {/* View Reason button for declined bookings */}
            {isDeclined && declineReason && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReason(true)}
                className="text-rose-700 border-rose-300 hover:bg-rose-100 hover:text-rose-800"
              >
                <MessageCircleQuestion className="w-4 h-4 mr-1.5" />
                View Reason
              </Button>
            )}

            {/* Late cancellation penalty */}
            {booking.penaltyAmountGbp > 0 && (
              <div className="text-sm text-orange-700 bg-orange-50 rounded-lg p-2">
                <span className="font-medium">Late cancellation penalty:</span> £{booking.penaltyAmountGbp.toFixed(2)}
              </div>
            )}

            {/* Practical test info */}
            {booking.isPracticalTest && (
              <div className="text-sm text-purple-700 bg-purple-50 rounded-lg px-2 py-1 inline-block">
                🚗 Practical Test — {booking.practicalTestTime}
              </div>
            )}
          </div>

          <Badge className={`shrink-0 ${statusConf.color} border-0`}>
            {statusConf.label}
          </Badge>
        </div>
      </CardContent>

      {/* Decline reason popup */}
      <Dialog open={showReason} onOpenChange={setShowReason}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              Booking Declined
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              Your instructor declined this booking request.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">
            {declineReason || 'No reason was provided.'}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReason(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function LearnerMyBookings() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pupilProfile, isLoading: pupilLoading } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      if (user?.email) {
        const byEmail = await base44.entities.Pupil.filter({ email: user.email });
        if (byEmail.length > 0) return byEmail[0];
      }
      return null;
    },
    enabled: !!user?.id,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings', pupilProfile?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ pupilId: pupilProfile.id }),
    enabled: !!pupilProfile?.id,
  });

  const now = moment();
  const activeStatuses = ['reserved_pending_instructor', 'pending', 'confirmed', 'in_progress'];

  // Declined bookings with a future date show in Upcoming so the learner sees the decline reason.
  const isUpcoming = (b) => (activeStatuses.includes(b.status) || b.status === 'declined_by_instructor') && moment(b.startAtUtc).isAfter(now);

  const upcoming = bookings
    .filter(isUpcoming)
    .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  const past = bookings
    .filter(b => !isUpcoming(b))
    .sort((a, b) => moment(b.startAtUtc).diff(moment(a.startAtUtc)));

  const isLoading = pupilLoading || bookingsLoading;

  if (!isLoading && pupilProfile && !pupilProfile.instructorId) {
    return <NotLinkedBanner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">My Bookings</h1>
        <p className="text-slate-500 text-sm mb-6">View all your upcoming and past lessons</p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="upcoming" className="flex-1">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Past ({past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No upcoming lessons</p>
                </div>
              ) : (
                upcoming.map(b => <BookingCard key={b.id} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="past">
              {past.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No past lessons</p>
                </div>
              ) : (
                past.map(b => <BookingCard key={b.id} booking={b} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}