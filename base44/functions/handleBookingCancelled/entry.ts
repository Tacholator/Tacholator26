import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data } = await req.json();

    if (event?.type !== 'update' || !data) {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const booking = data;

    // Only process cancelled or deleted bookings
    const isCancelled = ['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor'].includes(booking.status);
    const isDeleted = booking.status === 'deleted' || booking.isDeleted === true;
    if (!isCancelled && !isDeleted) {
      return Response.json({ skipped: true, reason: 'Not cancelled or deleted' });
    }

    // Silent instructor delete (from the booking details modal): cancel pending SMS
    // and release the slot, but do NOT send cancellation emails or SMS to either party.
    const isSilentDelete = booking.isDeleted === true && booking.deletedByRole === 'instructor';

    // 0. Restore slot instance to available — try slotInstanceId first, then search by bookingId as fallback
    const slotInstanceId = booking.slotInstanceId;
    if (slotInstanceId) {
      await base44.asServiceRole.entities.BookableSlotInstance.update(slotInstanceId, {
        status: 'available',
        bookingId: null,
        reservedByPupilId: null
      });
    } else {
      // Fallback: find any slot instance that references this booking
      const linkedSlots = await base44.asServiceRole.entities.BookableSlotInstance.filter({ bookingId: booking.id });
      for (const slot of linkedSlots) {
        await base44.asServiceRole.entities.BookableSlotInstance.update(slot.id, {
          status: 'available',
          bookingId: null,
          reservedByPupilId: null
        });
      }
    }

    // 1. Cancel all pending SMS for this booking
    const pendingSms = await base44.asServiceRole.entities.SmsNotification.filter({ 
      bookingId: booking.id,
      status: 'Pending'
    });

    for (const sms of pendingSms) {
      await base44.asServiceRole.entities.SmsNotification.update(sms.id, {
        status: 'Cancelled'
      });
    }

    // 2. Send cancellation emails via Resend (skipped for silent instructor deletes)
    if (!isSilentDelete) {
      try {
        await base44.asServiceRole.functions.invoke('sendBookingEmail', {
          type: 'booking_cancelled',
          bookingId: booking.id
        });
      } catch (error) {
        console.error('Email send error:', error.message);
      }

      // 3. Enqueue cancellation SMS notification
      try {
        const cancelResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
          bookingId: booking.id,
          templateKey: 'booking_cancelled',
          sendAtUtc: moment().toISOString(),
          skipIfTooClose: false
        });

        return Response.json({ 
          success: true,
          cancelledCount: pendingSms.length,
          cancellationNotification: cancelResult.data
        });
      } catch (error) {
        return Response.json({ 
          success: true,
          cancelledCount: pendingSms.length,
          cancellationNotificationError: error.message
        });
      }
    }

    return Response.json({
      success: true,
      cancelledCount: pendingSms.length,
      silentDelete: isSilentDelete
    });

  } catch (error) {
    console.error('Handle booking cancelled error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});