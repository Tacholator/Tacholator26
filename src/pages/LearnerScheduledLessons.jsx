import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';

export default function LearnerScheduledLessons() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      if (user.email) {
        const allPupils = await base44.entities.Pupil.list();
        const matchingPupil = allPupils.find(p => 
          p.email?.toLowerCase() === user.email.toLowerCase()
        );
        return matchingPupil || null;
      }
      return null;
    },
    enabled: !!user
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings', pupil?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const now = moment();
  
  const upcomingBookings = bookings
    .filter(b => 
      (b.status === 'confirmed' || b.status === 'reserved_pending_instructor') && 
      moment(b.endAtUtc).isAfter(now)
    )
    .sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  const pastBookings = bookings
    .filter(b => 
      (b.status === 'completed' || b.status === 'cancelled' || b.status === 'declined_by_instructor') || 
      moment(b.endAtUtc).isBefore(now)
    )
    .sort((a, b) => moment(b.startAtUtc).diff(moment(a.startAtUtc)));

  const handleBookingClick = (booking) => {
    // Navigate to calendar with booking details
    navigate(createPageUrl('LearnerCalendar'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (pupil && !pupil.instructorId) {
    return <NotLinkedBanner />;
  }

  const renderBookingCard = (booking) => {
    const startMoment = moment(booking.startAtUtc).local();
    const endMoment = moment(booking.endAtUtc).local();
    const duration = endMoment.diff(startMoment, 'hours', true);

    const statusColors = {
      confirmed: 'bg-emerald-100 text-emerald-700',
      reserved_pending_instructor: 'bg-amber-100 text-amber-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-slate-100 text-slate-700',
      declined_by_instructor: 'bg-rose-100 text-rose-700'
    };

    const statusLabels = {
      confirmed: 'Confirmed',
      reserved_pending_instructor: 'Pending Confirmation',
      completed: 'Completed',
      cancelled: 'Cancelled',
      declined_by_instructor: 'Declined'
    };

    return (
      <Card 
        key={booking.id}
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleBookingClick(booking)}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  {startMoment.format('dddd, D MMMM YYYY')}
                </p>
                <p className="text-sm text-slate-500">
                  {startMoment.format('HH:mm')} – {endMoment.format('HH:mm')}
                </p>
              </div>
            </div>
            <Badge className={statusColors[booking.status]}>
              {statusLabels[booking.status]}
            </Badge>
          </div>

          <div className="space-y-2 mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{duration} hour{duration !== 1 ? 's' : ''}</span>
            </div>
            {booking.pickupLocation && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{booking.pickupLocation}</span>
              </div>
            )}
            {booking.totalPriceGbp && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-slate-600">Lesson cost</span>
                <span className="font-semibold text-slate-800">£{booking.totalPriceGbp}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Scheduled Lessons</h1>
          <p className="text-slate-500">View your upcoming and past lessons</p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => renderBookingCard(booking))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No upcoming lessons</p>
                  <p className="text-sm text-slate-400 mt-1">Book a lesson to see it here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length > 0 ? (
              pastBookings.map(booking => renderBookingCard(booking))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No past lessons</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}