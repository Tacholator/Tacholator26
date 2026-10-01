import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support admin proxy: if instructorId is passed, fetch that instructor's payments
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const proxyInstructorId = body.instructorId || null;

    let instructor;
    if (proxyInstructorId && user.role === 'admin') {
      // Admin viewing another instructor's payments
      const all = await base44.asServiceRole.entities.Instructor.list();
      instructor = all.find(i => i.created_by_id === proxyInstructorId || i.id === proxyInstructorId);
    } else {
      const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      instructor = instructors[0] || null;
    }

    if (!instructor || !instructor.stripeAccountId) {
      return Response.json({ payments: [] }, { status: 200 });
    }

    const connectedAccountId = instructor.stripeAccountId;

    // Fetch charges from the connected account directly — this captures all
    // payments that landed in this instructor's Stripe account, whether via
    // checkout/transfer or direct charge.
    const charges = await stripe.charges.list(
      { limit: 100 },
      { stripeAccount: connectedAccountId }
    );

    // Connected-account charges carry no pupilId metadata (createStripeCheckout
    // puts pupilId on the platform PaymentIntent, not the connected charge), so
    // the card-payments tab can't attribute a pupil from Stripe alone. Resolve
    // the pupil via the Invoice record the webhook creates — matching by amount
    // and closest payment timestamp.
    const invoiceInstructorIds = [proxyInstructorId || user.id, instructor.id].filter(Boolean);
    const invoicesByAmount: Record<number, any[]> = {};
    for (const iid of invoiceInstructorIds) {
      let invs: any[] = [];
      try {
        invs = await base44.asServiceRole.entities.Invoice.filter({ instructorId: iid, type: 'STRIPE_CARD' });
      } catch (_) {}
      for (const inv of invs) {
        if (!inv.paymentDate) continue;
        const amt = Math.round((inv.amount || 0) * 100);
        if (!invoicesByAmount[amt]) invoicesByAmount[amt] = [];
        invoicesByAmount[amt].push(inv);
      }
    }

    const findInvoiceForCharge = (amount: number, createdMs: number) => {
      const amt = Math.round(amount * 100);
      const candidates = invoicesByAmount[amt] || [];
      if (candidates.length === 0) return null;
      const sorted = [...candidates].sort((a, b) =>
        Math.abs(new Date(a.paymentDate).getTime() - createdMs) -
        Math.abs(new Date(b.paymentDate).getTime() - createdMs)
      );
      const best = sorted[0];
      const gapMs = Math.abs(new Date(best.paymentDate).getTime() - createdMs);
      if (gapMs > 2 * 60 * 60 * 1000) return null; // > 2h — not a confident match
      return best;
    };

    const payments = charges.data.map(charge => {
      const amount = charge.amount / 100;
      // application_fee_amount is the platform fee taken out
      const appFee = charge.application_fee_amount ? charge.application_fee_amount / 100 : 0;
      // Estimate Stripe's processing fee (1.4% + £0.20 for UK cards)
      const estimatedStripeFee = parseFloat((amount * 0.014 + 0.20).toFixed(2));
      const netPayout = parseFloat((amount - appFee - estimatedStripeFee).toFixed(2));

      // Enrich metadata with pupil info from the matching invoice when the
      // charge itself carries none.
      let metadata = charge.metadata || {};
      if (!metadata.pupilId) {
        const inv = findInvoiceForCharge(amount, charge.created * 1000);
        if (inv) {
          metadata = {
            ...metadata,
            pupilId: inv.pupilId,
            pupilName: inv.pupilName,
            pupilEmail: inv.pupilEmail
          };
        }
      }

      return {
        id: charge.id,
        amount,
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        created: charge.created,
        stripeFee: estimatedStripeFee,
        appFee,
        netPayout,
        customerEmail: charge.billing_details?.email || charge.receipt_email,
        description: charge.description,
        paymentMethod: charge.payment_method_details?.type || 'card',
        metadata
      };
    });

    payments.sort((a, b) => b.created - a.created);

    return Response.json({ 
      payments,
      accountId: connectedAccountId
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching Stripe payments:', error);
    return Response.json({ 
      error: error.message,
      payments: []
    }, { status: 500 });
  }
});