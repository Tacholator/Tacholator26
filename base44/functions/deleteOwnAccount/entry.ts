import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const reason = body.reason || 'Self-service deletion';
    const additionalInfo = body.additionalInfo || '';
    const userId = user.id;
    const role = user.role === 'admin' ? 'instructor' : 'learner';

    // Audit log (service role so RLS cannot block it)
    try {
      await base44.asServiceRole.entities.DeletionRequest.create({
        userId,
        userEmail: user.email,
        userName: user.full_name,
        role,
        reason,
        additionalInfo,
        status: 'resolved'
      });
    } catch (_) {}

    // Permanently delete the account (service role bypasses user RLS)
    await base44.asServiceRole.entities.User.delete(userId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}