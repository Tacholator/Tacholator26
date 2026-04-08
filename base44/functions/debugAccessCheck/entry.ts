import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { instructorId, instructorEmail } = body;

    // Check subscription
    const subs = await base44.asServiceRole.entities.UserSubscription.filter({ userId: instructorId });
    const subscription = subs[0] || null;

    // Check instructor profile
    const instructorProfiles = await base44.asServiceRole.entities.Instructor.filter({ created_by: instructorEmail });
    const instructorProfile = instructorProfiles[0] || null;

    // Check access
    const hasValidAccess = !!(instructorProfile?.platformAccessOverride || (subscription?.status && ['trialing', 'active'].includes(subscription.status)));

    return Response.json({
      subscription: subscription ? { id: subscription.id, status: subscription.status } : null,
      instructorProfile: instructorProfile ? { id: instructorProfile.id, platformAccessOverride: instructorProfile.platformAccessOverride } : null,
      hasValidAccess
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});