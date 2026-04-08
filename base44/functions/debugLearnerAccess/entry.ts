import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    // Find pupil linked to this user
    const pupils = await base44.asServiceRole.entities.Pupil.filter({ linkedUserId: user.id });
    if (pupils.length === 0) {
      return Response.json({ error: 'No pupil record found' }, { status: 404 });
    }
    const pupil = pupils[0];

    // Get instructor
    const instructors = await base44.asServiceRole.entities.Instructor.filter({ created_by: pupil.instructorEmail });
    const instructor = instructors.length > 0 ? instructors[0] : null;

    // Get subscription
    let subscription = null;
    if (instructor) {
      const subs = await base44.asServiceRole.entities.UserSubscription.filter({ userId: instructor.created_by });
      subscription = subs.length > 0 ? subs[0] : null;
    }

    return Response.json({
      user: { id: user.id, email: user.email, role: user.role },
      pupil: {
        id: pupil.id,
        firstName: pupil.firstName,
        lastName: pupil.lastName,
        instructorEmail: pupil.instructorEmail,
        instructorId: pupil.instructorId,
        linkedUserId: pupil.linkedUserId
      },
      instructor: instructor ? {
        id: instructor.id,
        name: instructor.name,
        created_by: instructor.created_by,
        platformAccessOverride: instructor.platformAccessOverride
      } : null,
      subscription: subscription ? {
        userId: subscription.userId,
        status: subscription.status,
        billingPeriod: subscription.billingPeriod,
        currentPeriodEndAt: subscription.currentPeriodEndAt,
        stripeSubscriptionId: subscription.stripeSubscriptionId
      } : null,
      hasValidAccess: subscription?.status === 'active' || subscription?.status === 'trialing' || instructor?.platformAccessOverride || false
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});