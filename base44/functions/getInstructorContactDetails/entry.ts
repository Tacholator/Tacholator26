import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Returns the contact and bank-transfer details a pupil needs for their own
 * instructor. Those fields are hidden on the Instructor record itself, so this
 * is the only way a learner sees them — and only for the instructor they are
 * actually linked to.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instructorId } = await req.json().catch(() => ({}));
    if (!instructorId) {
      return Response.json({ error: 'instructorId is required' }, { status: 400 });
    }

    const instructor = await base44.asServiceRole.entities.Instructor
      .get(instructorId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!instructor) {
      return Response.json({ error: 'Instructor not found' }, { status: 404 });
    }

    let allowed = instructor.created_by_id === user.id;

    if (!allowed) {
      const byLinkedId = await base44.asServiceRole.entities.Pupil.filter({ linkedUserId: user.id });
      let pupil = byLinkedId[0] || null;
      if (!pupil) {
        const byEmail = await base44.asServiceRole.entities.Pupil.filter({ email: user.email });
        pupil = byEmail[0] || null;
      }
      allowed = !!pupil && pupil.instructorId === instructorId;
    }

    if (!allowed) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json({
      phone: instructor.phone || '',
      businessPhone: instructor.businessPhone || '',
      bankTransferEnabled: !!instructor.bankTransferEnabled,
      bankName: instructor.bankName || '',
      bankAccountName: instructor.bankAccountName || '',
      bankSortCode: instructor.bankSortCode || '',
      bankAccountNumber: instructor.bankAccountNumber || '',
      bankPaymentReference: instructor.bankPaymentReference || '',
      bankTransferNote: instructor.bankTransferNote || ''
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});