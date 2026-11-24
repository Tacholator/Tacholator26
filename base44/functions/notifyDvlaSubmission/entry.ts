import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));

    const pupilId = payload?.event?.entity_id;
    if (!pupilId) {
      return Response.json({ skipped: true });
    }

    // Read the pupil from the database rather than trusting the request body
    const pupilData = await base44.asServiceRole.entities.Pupil
      .get(pupilId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));

    if (!pupilData?.dvlaCheckCode) {
      return Response.json({ skipped: true });
    }

    // Get the instructor's user ID from instructorId field
    const instructorUserId = pupilData.instructorId;
    if (!instructorUserId) {
      return Response.json({ skipped: true, reason: 'no instructorId' });
    }

    const pupilName = `${pupilData.firstName || ''} ${pupilData.lastName || ''}`.trim();

    await base44.asServiceRole.entities.Notification.create({
      userId: instructorUserId,
      title: 'DVLA Verification Needed',
      message: `${pupilName} has submitted their DVLA details and is waiting for your verification.`,
      type: 'system',
      linkTarget: 'PupilProfile',
      linkParams: `id=${pupilId}&tab=checks`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});