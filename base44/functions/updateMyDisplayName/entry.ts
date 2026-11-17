import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const firstName = String(body.firstName ?? user.firstName ?? '').trim();
    const lastName = String(body.lastName ?? user.lastName ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    if (!fullName) {
      return Response.json({ error: 'A first or last name is required' }, { status: 400 });
    }

    // Keep the account display name in step with the profile name
    await base44.asServiceRole.entities.User.update(user.id, { full_name: fullName });

    // Refresh the copies of the instructor's name stored on their pupils, invoices and profile
    const instructorMatch = { $or: [{ instructorId: user.id }, { instructorEmail: user.email }] };

    await Promise.allSettled([
      base44.asServiceRole.entities.Pupil.updateMany(instructorMatch, { $set: { instructorName: fullName } }),
      base44.asServiceRole.entities.Invoice.updateMany(instructorMatch, { $set: { instructorName: fullName } }),
      base44.asServiceRole.entities.Instructor.updateMany({ created_by: user.email }, { $set: { name: fullName } })
    ]);

    return Response.json({ success: true, fullName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}