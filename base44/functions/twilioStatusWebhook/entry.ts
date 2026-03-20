import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

function validateTwilioSignature(authToken, twilioSignature, url, params) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(twilioSignature)
  );
}

function mapTwilioStatus(twilioStatus) {
  const statusMap = {
    'queued': 'Sending',
    'sending': 'Sending',
    'sent': 'Sent',
    'delivered': 'Delivered',
    'undelivered': 'Failed',
    'failed': 'Failed'
  };
  return statusMap[twilioStatus] || 'Failed';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!authToken) {
      return Response.json({ error: 'Twilio auth token not configured' }, { status: 500 });
    }

    // Parse form data
    const formData = await req.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    // Validate Twilio signature
    const twilioSignature = req.headers.get('X-Twilio-Signature');
    const url = `${Deno.env.get('PUBLIC_APP_BASE_URL')}/api/functions/twilioStatusWebhook`;
    
    if (twilioSignature && !validateTwilioSignature(authToken, twilioSignature, url, params)) {
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;

    if (!messageSid || !messageStatus) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the SMS notification
    const notifications = await base44.asServiceRole.entities.SmsNotification.filter({ 
      twilioMessageSid: messageSid 
    });

    if (notifications.length === 0) {
      return Response.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notification = notifications[0];
    const newStatus = mapTwilioStatus(messageStatus);

    // Update status
    await base44.asServiceRole.entities.SmsNotification.update(notification.id, {
      status: newStatus
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});