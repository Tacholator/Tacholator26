import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get start of current month
    const startOfMonth = moment().startOf('month').toDate();

    // Fetch all invoices from this month
    const allInvoices = await base44.asServiceRole.entities.Invoice.filter({});
    const monthInvoices = allInvoices.filter(inv => 
      new Date(inv.created_date) >= startOfMonth
    );

    // Calculate KPIs
    const revenueThisMonth = monthInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const pendingCount = monthInvoices
      .filter(inv => inv.status === 'PENDING').length;

    const refundedCount = monthInvoices
      .filter(inv => inv.status === 'REFUNDED').length;

    // Fetch payment ledger for transaction count
    const allLedger = await base44.asServiceRole.entities.PaymentLedger.filter({});
    const txnThisMonth = allLedger.filter(ledger => 
      new Date(ledger.created_date) >= startOfMonth &&
      ledger.type === 'payment'
    ).length;

    return Response.json({
      revenueThisMonth,
      txnThisMonth,
      pendingCount,
      refundedCount
    });
  } catch (error) {
    console.error('Error fetching admin payments KPIs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});