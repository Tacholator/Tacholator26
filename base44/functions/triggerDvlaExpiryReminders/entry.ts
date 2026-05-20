import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled/admin function — verify admin or service role
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all pupils that have a DVLA code and are not yet verified
    const allPupils = await base44.asServiceRole.entities.Pupil.filter({
      instructorDvlaVerified: false
    });

    const expiredPupils = allPupils.filter(p => {
      if (!p.dvlaCheckCode || !p.dvlaExpiryDate) return false;
      const expiry = new Date(p.dvlaExpiryDate);
      if (expiry >= now) return false; // Not expired yet

      // Skip if a reminder was sent within the last 7 days
      if (p.dvlaReminderSentDate) {
        const lastSent = new Date(p.dvlaReminderSentDate);
        if (lastSent > sevenDaysAgo) return false;
      }

      return true;
    });

    const results = [];

    for (const pupil of expiredPupils) {
      // Only notify if the pupil has a linked user account
      if (!pupil.linkedUserId) continue;

      // Create an in-app notification for the learner
      await base44.asServiceRole.entities.Notification.create({
        userId: pupil.linkedUserId,
        title: 'DVLA Check Code Expired',
        message: 'Your DVLA check code has expired. Please generate a new code at check.driving-licence.service.gov.uk and share it with your instructor.',
        type: 'dvla_expired',
        readAt: null
      });

      // Update dvlaReminderSentDate on the pupil record
      await base44.asServiceRole.entities.Pupil.update(pupil.id, {
        dvlaReminderSentDate: now.toISOString()
      });

      results.push({ pupilId: pupil.id, name: `${pupil.firstName} ${pupil.lastName}` });
    }

    return Response.json({
      processed: results.length,
      pupils: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});