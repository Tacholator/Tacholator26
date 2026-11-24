import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment@2.30.1';
import { isInternalCall } from '../../shared/internalAuth.ts';

const ALLOWED_TEMPLATES = ['booking_confirmed', 'lesson_reminder_24h', 'lesson_reminder_1h', 'booking_cancelled'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));

    // Internal only: queues SMS to a pupil's phone. Called by the booking
    // handlers, which prove they are internal with the shared token.
    if (!isInternalCall(req, payload)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bookingId, templateKey, sendAtUtc, skipIfTooClose } = payload;

    if (!bookingId || !templateKey || !sendAtUtc) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ALLOWED_TEMPLATES.includes(templateKey)) {
      return Response.json({ error: 'Invalid template key' }, { status: 400 });
    }

    // Get booking details using service role
    const booking = await base44.asServiceRole.entities.LessonBooking.filter({ id: bookingId });
    if (booking.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // Get pupil details using service role
    const pupils = await base44.asServiceRole.entities.Pupil.filter({ id: bookingData.pupilId });
    if (pupils.length === 0 || !pupils[0].phone) {
      return Response.json({ error: 'Pupil phone not found' }, { status: 404 });
    }

    const pupil = pupils[0];

    // Never queue more than one of the same message for the same booking
    const alreadyQueued = await base44.asServiceRole.entities.SmsNotification.filter({
      bookingId,
      templateKey
    });
    if (alreadyQueued.length > 0) {
      return Response.json({ skipped: true, reason: 'Already queued' });
    }

    // Convert phone to E.164 format if needed
    let phoneE164 = pupil.phone.trim();
    if (phoneE164.startsWith('0')) {
      phoneE164 = '+44' + phoneE164.substring(1);
    } else if (!phoneE164.startsWith('+')) {
      phoneE164 = '+44' + phoneE164;
    }

    // Get instructor details using service role
    const instructorProfile = await base44.asServiceRole.entities.Instructor.filter({ id: bookingData.instructorId });
    const instructorName = instructorProfile.length > 0 ? instructorProfile[0].name : 'Your instructor';

    // Skip if too close to lesson time
    if (skipIfTooClose) {
      const sendTime = moment(sendAtUtc);
      const now = moment();
      if (sendTime.diff(now, 'minutes') < 10) {
        return Response.json({ skipped: true, reason: 'Too close to lesson time' });
      }
    }

    // Prepare template variables
    const startTime = moment(bookingData.startAtUtc);
    const baseUrl = Deno.env.get('PUBLIC_APP_BASE_URL');
    
    const variables = {
      date: startTime.format('ddd, MMM D'),
      time: startTime.format('h:mm A'),
      instructorName: instructorName,
      pickupShort: bookingData.pickupLocation ? 
        (bookingData.pickupLocation.length > 40 ? 
          bookingData.pickupLocation.substring(0, 37) + '...' : 
          bookingData.pickupLocation) : 
        'TBC',
      manageLink: `${baseUrl}/LearnerScheduledLessons`,
      supportLink: `${baseUrl}/LearnerMyInstructor`
    };

    // Enqueue SMS using service role
    const notification = await base44.asServiceRole.entities.SmsNotification.create({
      bookingId: bookingId,
      userId: bookingData.pupilId,
      toE164: phoneE164,
      templateKey: templateKey,
      variablesJson: variables,
      sendAtUtc: sendAtUtc,
      status: 'Pending'
    });

    return Response.json({ 
      success: true,
      notificationId: notification.id 
    });

  } catch (error) {
    console.error('Enqueue SMS error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});