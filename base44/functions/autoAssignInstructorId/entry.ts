import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const { event } = payload;

    // Only process create/update events
    if (event?.type !== 'create' && event?.type !== 'update') {
      return Response.json({ success: true });
    }

    const pupilId = event.entity_id;
    if (!pupilId) {
      return Response.json({ error: 'Missing pupil id' }, { status: 400 });
    }

    // Read the pupil from the database rather than trusting the request body
    const pupil = await base44.asServiceRole.entities.Pupil
      .get(pupilId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!pupil) {
      return Response.json({ success: true });
    }

    const instructorEmail = pupil.instructorEmail;

    if (!instructorEmail) {
      return Response.json({ success: true });
    }

    // Find the instructor user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: instructorEmail });
    if (users.length === 0) {
      return Response.json({ success: true });
    }

    const instructorId = users[0].id;

    // Update the pupil with the instructor ID if it's different
    await base44.asServiceRole.entities.Pupil.update(pupilId, {
      instructorId
    });

    return Response.json({ success: true, instructorId });
  } catch (error) {
    console.error('Error in autoAssignInstructorId:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});