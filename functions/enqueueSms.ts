import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { bookingId, templateKey, sendAtUtc, skipIfTooClose } = await req.json();

    if (!bookingId || !templateKey || !sendAtUtc) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get booking details
    const booking = await base44.entities.LessonBooking.filter({ id: bookingId });
    if (booking.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // Get pupil details
    const pupils = await base44.entities.Pupil.filter({ id: bookingData.pupilId });
    if (pupils.length === 0 || !pupils[0].phone) {
      return Response.json({ error: 'Pupil phone not found' }, { status: 404 });
    }

    const pupil = pupils[0];
    
    // Convert phone to E.164 format if needed
    let phoneE164 = pupil.phone.trim();
    if (phoneE164.startsWith('0')) {
      phoneE164 = '+44' + phoneE164.substring(1);
    } else if (!phoneE164.startsWith('+')) {
      phoneE164 = '+44' + phoneE164;
    }

    // Get instructor details
    const instructors = await base44.entities.User.filter({ id: bookingData.instructorId });
    const instructorName = instructors.length > 0 ? instructors[0].full_name : 'Your instructor';

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
      manageLink: `${baseUrl}${bookingData.pupilId ? '/learner' : ''}/booking/${bookingId}`,
      supportLink: `${baseUrl}/support`
    };

    // Enqueue SMS
    const notification = await base44.entities.SmsNotification.create({
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