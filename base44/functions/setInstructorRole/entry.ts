import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Self-service instructor signup only. A user who is already an instructor
    // needs nothing here, and an existing learner must never be able to promote
    // themselves into the instructor/admin tier.
    if (user.role === 'admin') {
      return Response.json({ success: true, alreadyInstructor: true });
    }

    const linkedPupils = await base44.asServiceRole.entities.Pupil.filter({ linkedUserId: user.id });
    if (linkedPupils.length > 0) {
      return Response.json(
        { error: 'This account is registered as a learner and cannot become an instructor.' },
        { status: 403 }
      );
    }

    // Use service role to update the user's role to 'admin' (instructor)
    await base44.asServiceRole.entities.User.update(user.id, { role: 'admin' });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});