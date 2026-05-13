import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import moment from 'moment';

const LOGO_BLOCK = `
  <div style="display:inline-flex;align-items:center;gap:12px;">
    <div style="width:44px;height:44px;background:#F7B602;border-radius:10px;display:inline-block;vertical-align:middle;"></div>
    <span style="color:#ffffff;font-size:22px;font-weight:bold;vertical-align:middle;margin-left:12px;">Mobrage Driving Academy</span>
  </div>
  <p style="color:#F7B602;font-size:13px;margin:8px 0 0;letter-spacing:1px;text-transform:uppercase;">Training UK's Future Drivers</p>
`;

const SAMPLE_BOOKING = {
  startAtUtc: moment().add(2, 'days').hour(10).minute(0).toISOString(),
  durationHours: 1.5,
  pickupLocation: '123 High Street, London',
  totalPriceGbp: 45,
  penaltyAmountGbp: 45,
  lateCancellation: false,
  chargesApplied: false,
};

const SAMPLE_LATE_BOOKING = {
  ...SAMPLE_BOOKING,
  lateCancellation: true,
  chargesApplied: true,
};

const templates = [
  {
    key: 'booking_confirmed_pupil',
    label: 'Booking Confirmed (Pupil)',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    badge: 'To Pupil',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    subject: '✅ Booking Confirmed – Mobrage Driving Academy',
    description: 'Sent to the pupil when their instructor approves a booking.',
    getHtml: () => `
      <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Booking Confirmed!</h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi Alex Johnson,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Great news! Your driving lesson with <strong>Sarah Smith</strong> has been confirmed.</p>
      <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_BOOKING.startAtUtc).format('dddd, D MMMM YYYY')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_BOOKING.startAtUtc).format('HH:mm')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">1.5 hours</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Pickup</td><td style="padding:4px 0;color:#374151;font-size:15px;">123 High Street, London</td></tr>
        </table>
      </div>
      <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin:24px 0;">
        <p style="color:#065f46;font-size:14px;margin:0;"><strong>✓ What's next?</strong> You'll receive a reminder before your lesson. Please ensure you're ready at your pickup location on time.</p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;">If you need to cancel, please do so at least 48 hours in advance to avoid any cancellation charges.</p>
      <p style="color:#374151;font-size:15px;margin:24px 0 0;">Best regards,<br/><strong style="color:#071739;">Sarah Smith</strong><br/><span style="color:#6b7280;">Mobrage Driving Academy</span></p>
    `
  },
  {
    key: 'booking_confirmed_instructor',
    label: 'Booking Confirmed (Instructor)',
    icon: CheckCircle2,
    iconColor: 'text-blue-600',
    badge: 'To Instructor',
    badgeColor: 'bg-blue-100 text-blue-700',
    subject: '📅 Booking Confirmed: Alex Johnson',
    description: 'Sent to the instructor when they confirm a booking.',
    getHtml: () => `
      <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">New Booking Confirmed</h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi Sarah,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">A lesson booking with <strong>Alex Johnson</strong> has been confirmed.</p>
      <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_BOOKING.startAtUtc).format('dddd, D MMMM YYYY')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_BOOKING.startAtUtc).format('HH:mm')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">1.5 hours</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Pickup</td><td style="padding:4px 0;color:#374151;font-size:15px;">123 High Street, London</td></tr>
        </table>
      </div>
      <div style="background:#f8f9fb;border-radius:8px;padding:16px 20px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;font-weight:600;">Pupil Contact</p>
        <p style="margin:4px 0;font-size:14px;color:#374151;">Email: alex.johnson@example.com</p>
        <p style="margin:4px 0;font-size:14px;color:#374151;">Phone: 07700 900123</p>
      </div>
      <p style="color:#374151;font-size:15px;margin:24px 0 0;">This is an automated notification from Tacholator.</p>
    `
  },
  {
    key: 'cancelled_no_charge_pupil',
    label: 'Cancellation – No Charge (Pupil)',
    icon: XCircle,
    iconColor: 'text-slate-500',
    badge: 'To Pupil',
    badgeColor: 'bg-slate-100 text-slate-700',
    subject: '❌ Lesson Cancellation – Mobrage Driving Academy',
    description: 'Sent to the pupil when a lesson is cancelled with more than 48 hours notice.',
    getHtml: () => `
      <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Lesson Cancelled</h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi Alex Johnson,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Your lesson has been cancelled by <strong>you</strong>.</p>
      <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_BOOKING.startAtUtc).format('dddd, D MMMM YYYY')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_BOOKING.startAtUtc).format('HH:mm')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">1.5 hours</td></tr>
        </table>
      </div>
      <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin:24px 0;"><p style="color:#065f46;font-size:14px;margin:0;"><strong>✓ No Charge</strong><br/>This cancellation was made with more than 48 hours' notice. No charge has been applied to your account.</p></div>
      <p style="color:#374151;font-size:15px;line-height:1.6;">If you have any questions, please contact your instructor directly.</p>
      <p style="color:#374151;font-size:15px;margin:24px 0 0;">Best regards,<br/><strong style="color:#071739;">Mobrage Driving Academy</strong></p>
    `
  },
  {
    key: 'cancelled_late_charge_pupil',
    label: 'Late Cancellation – Charge Applied (Pupil)',
    icon: AlertTriangle,
    iconColor: 'text-rose-600',
    badge: 'To Pupil',
    badgeColor: 'bg-rose-100 text-rose-700',
    subject: '❌ Lesson Cancellation – Mobrage Driving Academy',
    description: 'Sent to the pupil when a lesson is cancelled within 48 hours (charge applies).',
    getHtml: () => `
      <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Lesson Cancelled</h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi Alex Johnson,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Your lesson has been cancelled by <strong>you</strong>.</p>
      <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_LATE_BOOKING.startAtUtc).format('dddd, D MMMM YYYY')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_LATE_BOOKING.startAtUtc).format('HH:mm')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">1.5 hours</td></tr>
        </table>
      </div>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:24px 0;"><p style="color:#991b1b;font-size:14px;margin:0;"><strong>⚠ Late Cancellation Charge</strong><br/>This cancellation was made within 48 hours of the lesson. A charge of <strong>£45.00</strong> has been applied to your account.</p></div>
      <p style="color:#374151;font-size:15px;line-height:1.6;">If you have any questions, please contact your instructor directly.</p>
      <p style="color:#374151;font-size:15px;margin:24px 0 0;">Best regards,<br/><strong style="color:#071739;">Mobrage Driving Academy</strong></p>
    `
  },
  {
    key: 'cancelled_instructor',
    label: 'Cancellation Notice (Instructor)',
    icon: XCircle,
    iconColor: 'text-blue-600',
    badge: 'To Instructor',
    badgeColor: 'bg-blue-100 text-blue-700',
    subject: '❌ Lesson Cancelled: Alex Johnson',
    description: 'Sent to the instructor when any lesson is cancelled.',
    getHtml: () => `
      <h2 style="color:#071739;font-size:22px;margin:0 0 8px;">Lesson Cancellation Notice</h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">Hi Sarah,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">A lesson with <strong>Alex Johnson</strong> has been cancelled by the pupil.</p>
      <div style="background:#f8f9fb;border-left:4px solid #F7B602;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Lesson Details</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;width:120px;">Date</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_LATE_BOOKING.startAtUtc).format('dddd, D MMMM YYYY')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Time</td><td style="padding:4px 0;color:#374151;font-size:15px;">${moment(SAMPLE_LATE_BOOKING.startAtUtc).format('HH:mm')}</td></tr>
          <tr><td style="padding:4px 0;color:#374151;font-size:15px;font-weight:600;">Duration</td><td style="padding:4px 0;color:#374151;font-size:15px;">1.5 hours</td></tr>
        </table>
      </div>
      <div style="background:#f8f9fb;border-radius:8px;padding:16px 20px;margin:24px 0;"><p style="color:#374151;font-size:14px;margin:0;"><strong>Late cancellation</strong> (within 48 hours). Charge of <strong>£45.00</strong> applied.</p></div>
      <p style="color:#374151;font-size:15px;margin:24px 0 0;">This is an automated notification from Tacholator.</p>
    `
  }
];

function EmailPreview({ html }) {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#071739;padding:24px 36px;text-align:center;">
<table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 auto;">
<tr>
<td style="vertical-align:middle;padding-right:12px;">
<img src="https://media.base44.com/images/public/6928de5cfb626066705b29e3/0655e28f5_LOgo2048.png" alt="Mobrage Logo" width="48" height="48" style="display:block;border-radius:9px;" />
</td>
<td style="vertical-align:middle;text-align:left;">
<div style="color:#F7B602;font-size:18px;font-weight:900;letter-spacing:1px;line-height:1.1;font-family:Arial,sans-serif;">MOBRAGE</div>
<div style="color:#ffffff;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">DRIVING ACADEMY</div>
</td>
</tr>
</table>
<p style="color:#9ca3af;font-size:12px;margin:10px 0 0;letter-spacing:0.5px;font-style:italic;">Training UK's future drivers</p>
</td></tr>
<tr><td style="padding:32px 36px 28px;">${html}</td></tr>
<tr><td style="background:#f8f9fb;border-top:1px solid #e8ecf0;padding:20px 36px;text-align:center;">
<p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Mobrage Driving Academy &bull; Training UK's Future Drivers</p>
<p style="color:#9ca3af;font-size:11px;margin:0;">This is an automated email. Please do not reply directly to this message.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return (
    <iframe
      srcDoc={fullHtml}
      className="w-full rounded-lg border border-slate-200"
      style={{ height: '620px' }}
      title="Email Preview"
    />
  );
}

export default function AdminEmailTemplates() {
  const [activeTemplate, setActiveTemplate] = useState(templates[0].key);
  const current = templates.find(t => t.key === activeTemplate);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#071739] to-[#0d2659] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#F7B602]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#071739]">Email Templates</h1>
              <p className="text-sm text-slate-500">Preview all automated emails sent by Mobrage Driving Academy</p>
            </div>
          </div>
          <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Sent via Resend.com</strong> — these emails are sent automatically when bookings are confirmed or cancelled.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Templates ({templates.length})</p>
            {templates.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTemplate(t.key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeTemplate === t.key
                      ? 'bg-[#071739] border-[#071739] text-white shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${activeTemplate === t.key ? 'text-[#F7B602]' : t.iconColor}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${activeTemplate === t.key ? 'text-white' : 'text-slate-800'}`}>
                        {t.label}
                      </p>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${activeTemplate === t.key ? 'text-slate-300' : 'text-slate-500'}`}>
                        {t.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base text-[#071739]">{current.label}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{current.description}</p>
                  </div>
                  <Badge className={current.badgeColor}>{current.badge}</Badge>
                </div>
                <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400 font-medium">SUBJECT</p>
                  <p className="text-sm text-slate-700 font-medium mt-0.5">{current.subject}</p>
                </div>
              </CardHeader>
              <CardContent>
                <EmailPreview html={current.getHtml()} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}