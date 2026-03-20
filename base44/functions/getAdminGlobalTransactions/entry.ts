import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const statusFilter = searchParams.get('status') || 'ALL';
    const methodFilter = searchParams.get('method') || 'ALL';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch all invoices
    let invoices = await base44.asServiceRole.entities.Invoice.filter({});

    // Apply date filters
    if (fromDate) {
      const from = new Date(fromDate);
      invoices = invoices.filter(inv => new Date(inv.created_date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      invoices = invoices.filter(inv => new Date(inv.created_date) <= to);
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      invoices = invoices.filter(inv => inv.status === statusFilter);
    }

    // Apply method filter
    if (methodFilter !== 'ALL') {
      invoices = invoices.filter(inv => inv.paymentMethod === methodFilter);
    }

    // Fetch instructors and pupils for joining
    const allInstructors = await base44.asServiceRole.entities.Instructor.filter({});
    const allPupils = await base44.asServiceRole.entities.Pupil.filter({});

    // Create lookup maps
    const instructorMap = {};
    allInstructors.forEach(ins => {
      instructorMap[ins.created_by] = ins;
    });

    const pupilMap = {};
    allPupils.forEach(pupil => {
      pupilMap[pupil.id] = pupil;
    });

    // Build transaction rows
    let transactions = invoices.map(inv => {
      const instructor = instructorMap[inv.instructorId] || {};
      const pupil = pupilMap[inv.pupilId] || {};

      return {
        id: inv.id,
        createdAt: inv.created_date,
        instructorId: inv.instructorId,
        instructorName: instructor.name || 'Unknown',
        pupilId: inv.pupilId,
        pupilName: pupil.firstName && pupil.lastName 
          ? `${pupil.firstName} ${pupil.lastName}` 
          : pupil.firstName || pupil.lastName || 'Unknown',
        method: inv.paymentMethod,
        amount: inv.amount || 0,
        hours: inv.hours || 0,
        status: inv.status,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        pdfUrl: inv.pdfUrl || null
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(tx => 
        tx.instructorName?.toLowerCase().includes(searchLower) ||
        tx.pupilName?.toLowerCase().includes(searchLower) ||
        tx.invoiceNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = transactions.length;
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return Response.json({
      transactions: paginatedTransactions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching global transactions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});