import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment@2.30.1';
import { INTERNAL_TOKEN } from '../../shared/internalAuth.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Never trust the request body for booking state: only take the id and read
    // the authoritative record from the database.
    const bookingId = body?.data?.id || body?.id || body?.event?.entity_id;
    if (!bookingId) {
      return Response.json({ error: 'Invalid booking data' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.LessonBooking
      .get(bookingId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only process confirmed bookings
    if (booking.status !== 'confirmed') {
      return Response.json({ skipped: true, reason: 'Not confirmed' });
    }

    // Idempotent: don't re-send for a booking that already has its confirmation SMS
    const alreadyQueued = await base44.asServiceRole.entities.SmsNotification.filter({
      bookingId: booking.id,
      templateKey: 'booking_confirmed'
    });
    if (alreadyQueued.length > 0) {
      return Response.json({ skipped: true, reason: 'Already confirmed — notifications sent' });
    }

    const results = [];

    // 1. Enqueue immediate confirmation SMS
    try {
      const confirmResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
        _internalToken: INTERNAL_TOKEN,
        bookingId: booking.id,
        templateKey: 'booking_confirmed',
        sendAtUtc: moment().toISOString(),
        skipIfTooClose: false
      });
      results.push({ type: 'booking_confirmed', result: confirmResult.data });
    } catch (error) {
      results.push({ type: 'booking_confirmed', error: error.message });
    }

    // 2. Enqueue 24h reminder (skip if lesson is less than 25h away)
    const startTime = moment(booking.startAtUtc);
    const now = moment();
    const hoursUntilLesson = startTime.diff(now, 'hours', true);

    if (hoursUntilLesson >= 25) {
      try {
        const reminder24Time = moment(booking.startAtUtc).subtract(24, 'hours');
        const reminder24hResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
          _internalToken: INTERNAL_TOKEN,
          bookingId: booking.id,
          templateKey: 'lesson_reminder_24h',
          sendAtUtc: reminder24Time.toISOString(),
          skipIfTooClose: true
        });
        results.push({ type: 'lesson_reminder_24h', result: reminder24hResult.data });
      } catch (error) {
        results.push({ type: 'lesson_reminder_24h', error: error.message });
      }
    }

    // 3. Enqueue 1h reminder (skip if lesson is less than 1.2h away)
    if (hoursUntilLesson >= 1.2) { // 1.2 hours = 72 minutes
      try {
        const reminder1hResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
          _internalToken: INTERNAL_TOKEN,
          bookingId: booking.id,
          templateKey: 'lesson_reminder_1h',
          sendAtUtc: moment(booking.startAtUtc).subtract(1, 'hour').toISOString(),
          skipIfTooClose: true
        });
        results.push({ type: 'lesson_reminder_1h', result: reminder1hResult.data });
      } catch (error) {
        results.push({ type: 'lesson_reminder_1h', error: error.message });
      }
    }

    // Send confirmation emails via Resend
    try {
      const emailResult = await base44.asServiceRole.functions.invoke('sendBookingEmail', {
        _internalToken: INTERNAL_TOKEN,
        type: 'booking_confirmed',
        bookingId: booking.id
      });
      results.push({ type: 'email_booking_confirmed', result: emailResult.data });
    } catch (error) {
      results.push({ type: 'email_booking_confirmed', error: error.message });
    }

    return Response.json({ 
      success: true,
      results 
    });

  } catch (error) {
    console.error('Handle booking confirmed error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});