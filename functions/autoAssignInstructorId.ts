import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process create events
    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    const pupilId = event.entity_id;
    const instructorEmail = data?.instructorEmail;

    if (!instructorEmail) {
      return Response.json({ success: true });
    }

    // Find the instructor user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: instructorEmail });
    if (users.length === 0) {
      return Response.json({ success: true });
    }

    const instructorId = users[0].id;

    // Update the pupil with the instructor ID
    await base44.asServiceRole.entities.Pupil.update(pupilId, {
      instructorId
    });

    return Response.json({ success: true, instructorId });
  } catch (error) {
    console.error('Error in autoAssignInstructorId:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});