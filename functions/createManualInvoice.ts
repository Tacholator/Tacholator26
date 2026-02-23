import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow instructors (admins) to create manual invoices
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only instructors can create manual invoices' }, { status: 403 });
    }

    const { pupilId, amount, hours, paymentMethod, paymentDate, reference, notes } = await req.json();

    // Validate inputs
    if (!pupilId || !amount || !hours || !paymentMethod) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0 || hours <= 0) {
      return Response.json({ error: 'Invalid amount or hours' }, { status: 400 });
    }

    // Get pupil
    const pupil = await base44.asServiceRole.entities.Pupil.get(pupilId);
    if (!pupil) {
      return Response.json({ error: 'Pupil not found' }, { status: 404 });
    }

    // Verify pupil belongs to this instructor
    if (pupil.instructorId !== user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get instructor profile
    const instructors = await base44.asServiceRole.entities.Instructor.filter({ id: user.id });
    const instructor = instructors.length > 0 ? instructors[0] : null;

    // Get or create invoice sequence for this year
    const currentYear = new Date().getFullYear();
    const sequences = await base44.asServiceRole.entities.InvoiceSequence.filter({
      instructorId: user.id,
      year: currentYear
    });

    let sequence;
    let nextSeq;

    if (sequences.length > 0) {
      sequence = sequences[0];
      nextSeq = sequence.nextSeq;
      // Update sequence
      await base44.asServiceRole.entities.InvoiceSequence.update(sequence.id, {
        nextSeq: nextSeq + 1
      });
    } else {
      // Create new sequence
      nextSeq = 1;
      await base44.asServiceRole.entities.InvoiceSequence.create({
        instructorId: user.id,
        year: currentYear,
        nextSeq: 2
      });
    }

    // Generate invoice number
    const invoiceNumber = `MDA-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

    // Create invoice
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoiceNumber,
      status: 'PAID',
      type: paymentMethod === 'CASH' ? 'MANUAL_CASH' : 'MANUAL_BACS',
      pupilId: pupil.id,
      pupilName: `${pupil.firstName} ${pupil.lastName}`,
      pupilEmail: pupil.email || '',
      instructorId: user.id,
      instructorName: instructor?.name || user.full_name || user.email,
      instructorEmail: user.email,
      instructorPhone: instructor?.phone || '',
      amount: parseFloat(amount),
      hours: parseFloat(hours),
      description: 'Driving lessons',
      paymentMethod: paymentMethod,
      paymentDate: paymentDate || new Date().toISOString(),
      manualReference: reference || '',
      notes: notes || '',
      isLocked: false
    });

    // Update pupil's payment ledger
    await base44.asServiceRole.entities.PaymentLedger.create({
      userId: pupil.id,
      type: 'payment',
      amountGbp: parseFloat(amount),
      hours: parseFloat(hours),
      reason: 'balance_top_up',
      createdByRole: 'instructor',
      note: `Manual payment - Invoice ${invoiceNumber}`
    });

    // Update pupil balance
    const currentBalance = pupil.bulkPaymentBalance || 0;
    await base44.asServiceRole.entities.Pupil.update(pupil.id, {
      bulkPaymentBalance: currentBalance + parseFloat(amount),
      bulkAmountPaid: (pupil.bulkAmountPaid || 0) + parseFloat(amount)
    });

    return Response.json({
      success: true,
      invoice: invoice
    });

  } catch (error) {
    console.error('Create manual invoice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});