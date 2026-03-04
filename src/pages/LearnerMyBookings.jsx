import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, FileText, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import moment from 'moment';

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
  const statusConf = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
  const isCancelledOrDeclined = ['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor', 'no_show', 'deleted'].includes(booking.status);

  return (
    <Card className="mb-3">
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

            {/* Cancellation reason */}
            {isCancelledOrDeclined && booking.cancellationReason && (
              <div className="flex items-start gap-1.5 text-sm text-rose-700 bg-rose-50 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span><span className="font-medium">Reason:</span> {booking.cancellationReason}</span>
              </div>
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
      const allPupils = await base44.entities.Pupil.list();
      let match = allPupils.find(p => p.linkedUserId === user.id);
      if (!match) match = allPupils.find(p => p.email?.toLowerCase() === user.email?.toLowerCase());
      return match || null;
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
  const pastStatuses = ['completed', 'cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor', 'no_show', 'deleted'];

  const upcoming = bookings
    .filter(b => activeStatuses.includes(b.status) && moment(b.startAtUtc).isAfter(now))
    .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  const past = bookings
    .filter(b => pastStatuses.includes(b.status) || moment(b.startAtUtc).isBefore(now))
    .sort((a, b) => moment(b.startAtUtc).diff(moment(a.startAtUtc)));

  const isLoading = pupilLoading || bookingsLoading;

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