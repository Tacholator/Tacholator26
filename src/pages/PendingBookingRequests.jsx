import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PendingBookingsPanel from '@/components/booking/PendingBookingsPanel';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function PendingBookingRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lessonBookings', currentUser?.id],
    queryFn: async () => {
      const all = await base44.entities.LessonBooking.filter({ instructorId: currentUser.id });
      return all.filter(b => !b.isDeleted);
    },
    enabled: !!currentUser?.id,
    refetchInterval: 15000
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const pendingBookings = bookings.filter(b => b.status === 'reserved_pending_instructor');

  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const booking = bookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      });

      if (booking?.slotInstanceId) {
        await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
          status: 'confirmed',
          bookingId: bookingId
        });
      }

      await base44.entities.PaymentLedger.create({
        userId: booking.pupilId,
        bookingId: bookingId,
        type: 'charge',
        reason: 'lesson_confirmed_charge',
        amountGbp: booking.totalPriceGbp,
        hours: booking.durationHours,
        createdByRole: 'system',
        note: 'Charge applied on confirmation'
      });

      const pupil = pupils.find(p => p.id === booking.pupilId);
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Confirmed',
          message: `Your lesson on ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} has been confirmed.`,
          type: 'booking',
          linkTarget: 'Calendar'
        });
      }

      base44.functions.invoke('handleBookingConfirmed', { ...booking, status: 'confirmed' }).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Booking confirmed' });
    }
  });

  const declineBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const booking = bookings.find(b => b.id === bookingId);
      await base44.entities.LessonBooking.update(bookingId, {
        status: 'declined_by_instructor',
        cancelledAt: new Date().toISOString(),
        cancelledByRole: 'instructor',
        cancellationReason: reason
      });

      if (booking?.slotInstanceId) {
        await base44.entities.BookableSlotInstance.update(booking.slotInstanceId, {
          status: 'available',
          reservedByPupilId: null,
          bookingId: null
        });
      }

      const pupil = pupils.find(p => p.id === booking.pupilId);
      if (pupil?.linkedUserId) {
        await base44.entities.Notification.create({
          userId: pupil.linkedUserId,
          title: 'Lesson Declined',
          message: `Your lesson request for ${moment(booking.startAtUtc).local().format('D MMM')} at ${moment(booking.startAtUtc).local().format('HH:mm')} was declined.${reason ? ` Reason: ${reason}` : ''}`,
          type: 'booking',
          linkTarget: 'Calendar'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessonBookings']);
      queryClient.invalidateQueries(['slotInstances']);
      toast({ title: 'Booking declined' });
    }
  });

  const confirmAllBookingsMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(pendingBookings.map(booking =>
        confirmBookingMutation.mutateAsync(booking.id)
      ));
      return {
        total: pendingBookings.length,
        failed: results.filter(r => r.status === 'rejected').length
      };
    },
    onSuccess: ({ total, failed }) => {
      if (failed === 0) {
        toast({ title: `All ${total} bookings confirmed` });
      } else {
        toast({
          title: `${total - failed} of ${total} bookings confirmed`,
          description: `${failed} could not be confirmed — please try again.`,
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Could not confirm bookings',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/Calendar')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Pending Booking Requests</h1>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <p className="text-slate-500">No pending booking requests right now.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/Calendar')}>
              Back to Calendar
            </Button>
          </div>
        ) : (
          <PendingBookingsPanel
            bookings={pendingBookings}
            pupils={pupils}
            onConfirm={(id) => confirmBookingMutation.mutate(id)}
            onDecline={(id, reason) => declineBookingMutation.mutate({ bookingId: id, reason })}
            onConfirmAll={() => confirmAllBookingsMutation.mutate()}
            isLoading={confirmBookingMutation.isPending || declineBookingMutation.isPending}
            isConfirmingAll={confirmAllBookingsMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}