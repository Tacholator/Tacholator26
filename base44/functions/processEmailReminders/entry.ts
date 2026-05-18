import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = moment();
    const windowEnd = moment().add(6, 'minutes').toISOString(); // 5-min poll + 1 min buffer

    // Fetch all pending reminders due now
    const pending = await base44.asServiceRole.entities.EmailReminder.filter({ status: 'pending' });

    const due = pending.filter(r => moment(r.sendAtUtc).isBefore(windowEnd));

    if (due.length === 0) {
      return Response.json({ success: true, processed: 0 });
    }

    const results = [];

    for (const reminder of due) {
      try {
        // Mark as sent first to prevent duplicate sends
        await base44.asServiceRole.entities.EmailReminder.update(reminder.id, {
          status: 'sent',
          sentAt: now.toISOString()
        });

        const emailResult = await base44.asServiceRole.functions.invoke('sendBookingEmail', {
          type: reminder.templateKey,
          bookingId: reminder.bookingId
        });

        results.push({ reminderId: reminder.id, bookingId: reminder.bookingId, result: emailResult.data });
      } catch (error) {
        // Mark as failed
        await base44.asServiceRole.entities.EmailReminder.update(reminder.id, { status: 'failed' });
        results.push({ reminderId: reminder.id, error: error.message });
      }
    }

    return Response.json({ success: true, processed: results.length, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});