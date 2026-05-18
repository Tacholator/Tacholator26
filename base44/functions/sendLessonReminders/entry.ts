import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import moment from 'npm:moment@2.30.1';
import 'npm:moment-timezone@0.5.45';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'noreply@mobragedrivingacademy.com';
const FROM_NAME = 'Mobrage Driving Academy';

function buildReminderEmail(pupilName, instructorName, booking) {
  const start = moment(booking.startAtUtc).tz('Europe/London');
  const timeStr = start.format('HH:mm');
  const dateStr = start.format('dddd, D MMMM YYYY');

  const body = `
    <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Lesson Reminder 🚗</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi ${pupilName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Just a friendly reminder that you have a driving lesson <strong>tomorrow</strong> with <strong>${instructorName}</strong>.
    </p>
    <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${dateStr}</td></tr>
        <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${timeStr}</td></tr>
        <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">${booking.durationHours} hour${booking.durationHours !== 1 ? 's' : ''}</td></tr>
        ${booking.pickupLocation ? `<tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Pickup</td><td style="padding:4px 0;color:#374151;font-size:15px;">${booking.pickupLocation}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="color:#065f46;font-size:14px;margin:0;"><strong>✓ Checklist for tomorrow:</strong><br/>
      • Bring your provisional driving licence<br/>
      • Be ready at your pickup location on time<br/>
      • If you need to cancel, please contact your instructor immediately</p>
    </div>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Good luck tomorrow! 🎉</p>
    <p style="color:#374151;font-size:15px;margin:24px 0 0;">Best regards,<br/><strong style="color:#071739;">${instructorName}</strong><br/><span style="color:#6b7280;">Mobrage Driving Academy</span></p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Lesson Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Your lesson is tomorrow at ${timeStr} – see you then!</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#071739;padding:28px 40px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                    <tr>
                      <td style="vertical-align:middle;padding-right:14px;">
                        <img src="https://media.base44.com/images/public/6928de5cfb626066705b29e3/0655e28f5_LOgo2048.png" alt="Mobrage Logo" width="52" height="52" style="display:block;border-radius:10px;" />
                      </td>
                      <td style="vertical-align:middle;text-align:left;">
                        <div style="color:#F7B602;font-size:20px;font-weight:900;letter-spacing:1px;line-height:1.1;font-family:Arial,sans-serif;">MOBRAGE</div>
                        <div style="color:#ffffff;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">DRIVING ACADEMY</div>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;letter-spacing:0.5px;font-style:italic;">Training UK's future drivers</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#071739;border-top:1px solid #0d2659;padding:24px 40px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">Mobrage Driving Academy &bull; Training UK's Future Drivers</p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">This is an automated email. Please do not reply directly to this message.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return html;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Define "tomorrow" in UK time
    const nowUK = moment().tz('Europe/London');
    const tomorrowStart = nowUK.clone().add(1, 'day').startOf('day').utc().toISOString();
    const tomorrowEnd = nowUK.clone().add(1, 'day').endOf('day').utc().toISOString();

    // Fetch all confirmed bookings starting tomorrow
    const bookings = await base44.asServiceRole.entities.LessonBooking.filter({ status: 'confirmed' });
    const tomorrowBookings = bookings.filter(b =>
      b.startAtUtc >= tomorrowStart && b.startAtUtc <= tomorrowEnd
    );

    const results = [];

    for (const booking of tomorrowBookings) {
      const pupil = await base44.asServiceRole.entities.Pupil.get(booking.pupilId);
      if (!pupil?.email) continue;

      const instructorUser = await base44.asServiceRole.entities.User.get(booking.instructorId);
      const instructorEmail = instructorUser?.email;
      const instructors = instructorEmail
        ? await base44.asServiceRole.entities.Instructor.filter({ created_by: instructorEmail })
        : [];
      const instructorName = instructors[0]?.name || 'Your Instructor';

      const pupilName = `${pupil.firstName} ${pupil.lastName}`;
      const html = buildReminderEmail(pupilName, instructorName, booking);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [pupil.email],
          subject: `🚗 Lesson Reminder – Tomorrow at ${moment(booking.startAtUtc).tz('Europe/London').format('HH:mm')}`,
          html
        })
      });

      const data = await res.json();
      results.push({ bookingId: booking.id, pupilEmail: pupil.email, success: res.ok, result: data });
    }

    return Response.json({ success: true, remindersSent: results.length, results });

  } catch (error) {
    console.error('sendLessonReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});