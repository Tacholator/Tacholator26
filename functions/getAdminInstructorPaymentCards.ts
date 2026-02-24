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

    // Fetch all instructors
    const allInstructors = await base44.asServiceRole.entities.Instructor.filter({});
    
    // Filter instructors by search
    const instructors = allInstructors.filter(ins => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return ins.name?.toLowerCase().includes(searchLower) ||
             ins.created_by?.toLowerCase().includes(searchLower);
    });

    // Fetch all invoices and payment ledger
    const allInvoices = await base44.asServiceRole.entities.Invoice.filter({});
    const allLedger = await base44.asServiceRole.entities.PaymentLedger.filter({});

    // Build instructor cards
    const cards = instructors.map(instructor => {
      // The instructor's user email and ID
      const instructorEmail = instructor.created_by;
      const instructorUserId = instructor.created_by_id;
      
      // Filter invoices for this instructor (match by email or user ID)
      let instructorInvoices = allInvoices.filter(inv => 
        inv.instructorEmail === instructorEmail || inv.instructorId === instructorUserId
      );

      // Apply date filters
      if (fromDate) {
        const from = new Date(fromDate);
        instructorInvoices = instructorInvoices.filter(inv => 
          new Date(inv.created_date) >= from
        );
      }
      if (toDate) {
        const to = new Date(toDate);
        instructorInvoices = instructorInvoices.filter(inv => 
          new Date(inv.created_date) <= to
        );
      }

      // Apply status filter
      if (statusFilter !== 'ALL') {
        instructorInvoices = instructorInvoices.filter(inv => 
          inv.status === statusFilter
        );
      }

      // Apply method filter
      if (methodFilter !== 'ALL') {
        instructorInvoices = instructorInvoices.filter(inv => 
          inv.paymentMethod === methodFilter
        );
      }

      // Calculate metrics
      const revenue = instructorInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const pendingCount = instructorInvoices.filter(inv => inv.status === 'PENDING').length;
      const refundedCount = instructorInvoices.filter(inv => inv.status === 'REFUNDED').length;

      // Count transactions from payment ledger (ledger uses created_by field for instructor email)
      let instructorLedger = allLedger.filter(ledger => 
        ledger.created_by === instructorEmail && ledger.type === 'payment'
      );

      if (fromDate) {
        const from = new Date(fromDate);
        instructorLedger = instructorLedger.filter(ledger => 
          new Date(ledger.created_date) >= from
        );
      }
      if (toDate) {
        const to = new Date(toDate);
        instructorLedger = instructorLedger.filter(ledger => 
          new Date(ledger.created_date) <= to
        );
      }

      const txnCount = instructorLedger.length;

      return {
        id: instructorUserId,
        name: instructor.name,
        email: instructorEmail,
        revenue,
        txnCount,
        pendingCount,
        refundedCount
      };
    });

    // Sort by revenue descending
    cards.sort((a, b) => b.revenue - a.revenue);

    return Response.json(cards);
  } catch (error) {
    console.error('Error fetching instructor payment cards:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});