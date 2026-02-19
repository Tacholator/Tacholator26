import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = moment().toISOString();

    // Find pending SMS that are due
    const allPending = await base44.asServiceRole.entities.SmsNotification.filter({ 
      status: 'Pending' 
    });

    const dueSms = allPending.filter(sms => 
      moment(sms.sendAtUtc).isSameOrBefore(moment())
    ).slice(0, 50);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const sms of dueSms) {
      results.processed++;

      try {
        // Update to Sending
        await base44.asServiceRole.entities.SmsNotification.update(sms.id, {
          status: 'Sending'
        });

        // Send SMS
        const sendResult = await base44.asServiceRole.functions.invoke('sendSms', {
          toE164: sms.toE164,
          templateKey: sms.templateKey,
          variablesJson: sms.variablesJson
        });

        if (sendResult.data.success) {
          // Update to Sent
          await base44.asServiceRole.entities.SmsNotification.update(sms.id, {
            status: 'Sent',
            twilioMessageSid: sendResult.data.messageSid
          });
          results.sent++;
        } else {
          throw new Error(sendResult.data.error || 'Failed to send');
        }

      } catch (error) {
        // Update to Failed
        await base44.asServiceRole.entities.SmsNotification.update(sms.id, {
          status: 'Failed',
          lastError: error.message
        });
        results.failed++;
        results.errors.push({ smsId: sms.id, error: error.message });
      }
    }

    return Response.json({ 
      success: true,
      results 
    });

  } catch (error) {
    console.error('Process pending SMS error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});