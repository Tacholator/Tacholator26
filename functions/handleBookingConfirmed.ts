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

    // Only process confirmed bookings
    if (booking.status !== 'confirmed') {
      return Response.json({ skipped: true, reason: 'Not confirmed' });
    }

    const results = [];

    // 1. Enqueue immediate confirmation SMS
    try {
      const confirmResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
        bookingId: booking.id,
        templateKey: 'booking_confirmed',
        sendAtUtc: moment().toISOString(),
        skipIfTooClose: false
      });
      results.push({ type: 'booking_confirmed', result: confirmResult.data });
    } catch (error) {
      results.push({ type: 'booking_confirmed', error: error.message });
    }

    // 2. Enqueue 24h reminder (skip if lesson is less than 6h away)
    const startTime = moment(booking.startAtUtc);
    const now = moment();
    const hoursUntilLesson = startTime.diff(now, 'hours', true);

    if (hoursUntilLesson >= 6) {
      try {
        const reminder24hResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
          bookingId: booking.id,
          templateKey: 'lesson_reminder_24h',
          sendAtUtc: startTime.subtract(24, 'hours').toISOString(),
          skipIfTooClose: true
        });
        results.push({ type: 'lesson_reminder_24h', result: reminder24hResult.data });
      } catch (error) {
        results.push({ type: 'lesson_reminder_24h', error: error.message });
      }
    }

    // 3. Enqueue 1h reminder (skip if lesson is less than 10 minutes away)
    if (hoursUntilLesson >= 0.17) { // 10 minutes
      try {
        const reminder1hResult = await base44.asServiceRole.functions.invoke('enqueueSms', {
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