import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import moment from 'npm:moment@2.30.1';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'noreply@mobrage.com';
const FROM_NAME = 'Mobrage Driving Academy';

function buildEmailHtml(subject, bodyHtml, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
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
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fb;border-top:1px solid #e8ecf0;padding:24px 40px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">Mobrage Driving Academy &bull; Professional Driving Instruction</p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">This is an automated email. Please do not reply directly to this message.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function lessonDetailsBlock(booking) {
  const start = moment(booking.startAtUtc).local();
  return `
    <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${start.format('dddd, D MMMM YYYY')}</td></tr>
        <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${start.format('HH:mm')}</td></tr>
        <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">${booking.durationHours} hour${booking.durationHours !== 1 ? 's' : ''}</td></tr>
        ${booking.pickupLocation ? `<tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Pickup</td><td style="padding:4px 0;color:#374151;font-size:15px;">${booking.pickupLocation}</td></tr>` : ''}
      </table>
    </div>`;
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send email');
  return data;
}

// ---- EMAIL BUILDERS ----

function buildBookingConfirmedPupil(pupilName, instructorName, booking) {
  const body = `
    <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Booking Confirmed!</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi ${pupilName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Great news! Your driving lesson with <strong>${instructorName}</strong> has been confirmed.
    </p>
    ${lessonDetailsBlock(booking)}
    <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="color:#065f46;font-size:14px;margin:0;"><strong>✓ What's next?</strong> You'll receive a reminder before your lesson. Please ensure you're ready at your pickup location on time.</p>
    </div>
    <p style="color:#374151;font-size:15px;line-height:1.6;">If you need to cancel, please do so at least 48 hours in advance to avoid any cancellation charges.</p>
    <p style="color:#374151;font-size:15px;margin:24px 0 0;">Best regards,<br/><strong style="color:#071739;">${instructorName}</strong><br/><span style="color:#6b7280;">Mobrage Driving Academy</span></p>`;
  return buildEmailHtml('Booking Confirmed – Mobrage Driving Academy', body, `Your lesson on ${moment(booking.startAtUtc).local().format('D MMM')} is confirmed!`);
}

function buildBookingConfirmedInstructor(instructorName, pupilName, pupilEmail, pupilPhone, booking) {
  const body = `
    <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">New Booking Confirmed</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi ${instructorName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      A lesson booking with <strong>${pupilName}</strong> has been confirmed.
    </p>
    ${lessonDetailsBlock(booking)}
    <div style="background:#f8f9fb;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;font-weight:600;">Pupil Contact</p>
      ${pupilEmail ? `<p style="margin:4px 0;font-size:14px;color:#374151;">Email: ${pupilEmail}</p>` : ''}
      ${pupilPhone ? `<p style="margin:4px 0;font-size:14px;color:#374151;">Phone: ${pupilPhone}</p>` : ''}
    </div>
    <p style="color:#374151;font-size:15px;margin:24px 0 0;">This is an automated notification from Tacholator.</p>`;
  return buildEmailHtml('Lesson Booking Confirmed – Tacholator', body);
}

function buildCancellationPupil(pupilName, instructorName, booking, cancelledByRole, isLate, chargesApplied) {
  const cancelledBy = cancelledByRole === 'pupil' ? 'you' : `your instructor (${instructorName})`;
  const chargeBlock = cancelledByRole === 'pupil' ? (isLate
    ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:24px 0;"><p style="color:#991b1b;font-size:14px;margin:0;"><strong>⚠ Late Cancellation Charge</strong><br/>This cancellation was made within 48 hours of the lesson. ${chargesApplied ? `A charge of <strong>£${(booking.penaltyAmountGbp || booking.totalPriceGbp || 0).toFixed(2)}</strong> has been applied to your account.` : 'No charge has been applied on this occasion.'}</p></div>`
    : `<div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin:24px 0;"><p style="color:#065f46;font-size:14px;margin:0;"><strong>✓ No Charge</strong><br/>This cancellation was made with more than 48 hours' notice. No charge has been applied to your account.</p></div>`
  ) : `<div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;padding:16px 20px;margin:24px 0;"><p style="color:#1e40af;font-size:14px;margin:0;"><strong>ℹ Instructor Cancellation</strong><br/>Your instructor has cancelled this lesson. No charge has been applied. Please contact your instructor to rebook.</p></div>`;

  const body = `
    <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Lesson Cancelled</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi ${pupilName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Your lesson has been cancelled by <strong>${cancelledBy}</strong>.
    </p>
    ${lessonDetailsBlock(booking)}
    ${chargeBlock}
    <p style="color:#374151;font-size:15px;line-height:1.6;">If you have any questions, please contact your instructor directly.</p>
    <p style="color:#374151;font-size:15px;margin:24px 0 0;">Best regards,<br/><strong style="color:#071739;">Mobrage Driving Academy</strong></p>`;
  return buildEmailHtml('Lesson Cancellation – Mobrage Driving Academy', body, `Your lesson on ${moment(booking.startAtUtc).local().format('D MMM')} has been cancelled`);
}

function buildCancellationInstructor(instructorName, pupilName, booking, cancelledByRole, isLate, chargesApplied) {
  const body = `
    <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Lesson Cancellation Notice</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi ${instructorName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      A lesson with <strong>${pupilName}</strong> has been ${cancelledByRole === 'instructor' ? 'cancelled by you' : 'cancelled by the pupil'}.
    </p>
    ${lessonDetailsBlock(booking)}
    <div style="background:#f8f9fb;border-radius:8px;padding:16px 20px;margin:24px 0;">
      ${cancelledByRole === 'pupil' && isLate
        ? `<p style="color:#374151;font-size:14px;margin:0;"><strong>Late cancellation</strong> (within 48 hours). ${chargesApplied ? `Charge of <strong>£${(booking.penaltyAmountGbp || booking.totalPriceGbp || 0).toFixed(2)}</strong> applied.` : 'No charge applied.'}</p>`
        : `<p style="color:#374151;font-size:14px;margin:0;">No charge applied.</p>`
      }
    </div>
    <p style="color:#374151;font-size:15px;margin:24px 0 0;">This is an automated notification from Tacholator.</p>`;
  return buildEmailHtml('Lesson Cancellation – Tacholator', body);
}

// ---- MAIN HANDLER ----

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, bookingId } = await req.json();

    if (!type || !bookingId) {
      return Response.json({ error: 'Missing type or bookingId' }, { status: 400 });
    }

    // Fetch booking
    const booking = await base44.asServiceRole.entities.LessonBooking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Fetch pupil
    const pupil = await base44.asServiceRole.entities.Pupil.get(booking.pupilId);
    if (!pupil) return Response.json({ error: 'Pupil not found' }, { status: 404 });

    // Resolve instructor email from User entity
    const instructorUser = await base44.asServiceRole.entities.User.get(booking.instructorId);
    const instructorEmail = instructorUser?.email;

    // Fetch instructor profile using their email (created_by stores email)
    const instructors = instructorEmail
      ? await base44.asServiceRole.entities.Instructor.filter({ created_by: instructorEmail })
      : [];
    const instructor = instructors[0];
    const instructorName = instructor?.name || 'Your Instructor';

    const pupilName = `${pupil.firstName} ${pupil.lastName}`;
    const pupilEmail = pupil.email;

    const results = [];

    if (type === 'booking_confirmed') {
      // Email to pupil
      if (pupilEmail) {
        const html = buildBookingConfirmedPupil(pupilName, instructorName, booking);
        const r = await sendEmail(pupilEmail, '✅ Booking Confirmed – Mobrage Driving Academy', html);
        results.push({ to: 'pupil', email: pupilEmail, result: r });
      }
      // Email to instructor
      if (instructorEmail) {
        const html = buildBookingConfirmedInstructor(instructorName, pupilName, pupilEmail, pupil.phone, booking);
        const r = await sendEmail(instructorEmail, `📅 Booking Confirmed: ${pupilName}`, html);
        results.push({ to: 'instructor', email: instructorEmail, result: r });
      }
    }

    if (type === 'booking_cancelled') {
      const cancelledByRole = booking.cancelledByRole || 'pupil';
      const isLate = booking.lateCancellation === true;
      const chargesApplied = booking.chargesApplied !== false;

      // Email to pupil
      if (pupilEmail) {
        const html = buildCancellationPupil(pupilName, instructorName, booking, cancelledByRole, isLate, chargesApplied);
        const r = await sendEmail(pupilEmail, '❌ Lesson Cancellation – Mobrage Driving Academy', html);
        results.push({ to: 'pupil', email: pupilEmail, result: r });
      }
      // Email to instructor
      if (instructorEmail) {
        const html = buildCancellationInstructor(instructorName, pupilName, booking, cancelledByRole, isLate, chargesApplied);
        const r = await sendEmail(instructorEmail, `❌ Lesson Cancelled: ${pupilName}`, html);
        results.push({ to: 'instructor', email: instructorEmail, result: r });
      }
    }

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('sendBookingEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});