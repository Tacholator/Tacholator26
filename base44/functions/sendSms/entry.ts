import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { isInternalCall } from '../../shared/internalAuth.ts';

const TEMPLATES = {
  booking_confirmed: "✅ Lesson confirmed: {{date}} {{time}} with {{instructorName}}. Pickup: {{pickupShort}}. Manage: {{manageLink}}",
  lesson_reminder_24h: "⏰ Reminder: lesson in 24h — {{date}} {{time}}. Pickup: {{pickupShort}}. Reply HELP for support.",
  lesson_reminder_1h: "🚗 Lesson in 1 hour — {{time}}. Pickup: {{pickupShort}}. See details: {{manageLink}}",
  booking_cancelled: "❌ Lesson cancelled: {{date}} {{time}}. If this wasn't you, contact support: {{supportLink}}"
};

function renderTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));

    // Internal only: this sends SMS on the app's Twilio account, so it must never
    // be callable from the internet. Only processPendingSms (another backend
    // function) calls it, and it proves that with the internal token.
    if (!isInternalCall(req, payload)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { toE164, templateKey, variablesJson } = payload;

    if (typeof toE164 !== 'string' || !/^\+[1-9]\d{6,14}$/.test(toE164)) {
      return Response.json({ error: 'Invalid destination number' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

    if (!accountSid || !authToken || !messagingServiceSid) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Render template
    const template = TEMPLATES[templateKey];
    if (!template) {
      return Response.json({ error: 'Invalid template key' }, { status: 400 });
    }

    const messageBody = renderTemplate(template, variablesJson || {}).slice(0, 1000);

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append('To', toE164);
    formData.append('MessagingServiceSid', messagingServiceSid);
    formData.append('Body', messageBody);
    formData.append('StatusCallback', `${Deno.env.get('PUBLIC_APP_BASE_URL')}/api/functions/twilioStatusWebhook`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    const result = await response.json();

    return Response.json({
      success: true,
      messageSid: result.sid,
      status: result.status
    });

  } catch (error) {
    console.error('SMS send error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});