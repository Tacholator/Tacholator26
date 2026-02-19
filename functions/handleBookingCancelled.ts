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

    // Only process cancelled bookings
    if (!['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil', 'declined_by_instructor'].includes(booking.status)) {
      return Response.json({ skipped: true, reason: 'Not cancelled' });
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

    // 2. Enqueue cancellation notification
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

  } catch (error) {
    console.error('Handle booking cancelled error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});