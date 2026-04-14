import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const pupilId = payload?.event?.entity_id;
    const pupilData = payload?.data;

    if (!pupilId || !pupilData?.dvlaCheckCode) {
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