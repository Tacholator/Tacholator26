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

    const instructors = await base44.entities.Instructor.filter({ 
      created_by: user.email 
    });

    if (instructors.length === 0 || !instructors[0].stripeAccountId) {
      return Response.json({ payments: [] }, { status: 200 });
    }

    const instructor = instructors[0];
    const connectedAccountId = instructor.stripeAccountId;

    // Fetch payment intents from the platform account - these are the ones created
    // via Stripe Checkout with transfer_data.destination to the connected account
    const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });

    const payments = [];

    for (const pi of paymentIntents.data) {
      // Check if this payment intent is destined for this instructor's connected account
      const transferDest = pi.transfer_data?.destination;
      if (transferDest !== connectedAccountId) continue;

      const amount = pi.amount / 100;
      const appFee = pi.application_fee_amount ? pi.application_fee_amount / 100 : 0;
      // Strip fee is the remainder of app_fee that goes to Stripe (not platform)
      // Estimate actual Stripe fee: 1.4% + 0.20 for UK cards
      const estimatedStripeFee = parseFloat((amount * 0.014 + 0.20).toFixed(2));
      const netPayout = parseFloat((amount - appFee - estimatedStripeFee).toFixed(2));

      // Get customer email from charges if available
      let customerEmail = pi.receipt_email;
      if (!customerEmail && pi.latest_charge) {
        try {
          const charge = await stripe.charges.retrieve(pi.latest_charge);
          customerEmail = charge.billing_details?.email || charge.receipt_email;
        } catch (_) { /* ignore */ }
      }

      payments.push({
        id: pi.id,
        amount,
        currency: pi.currency.toUpperCase(),
        status: pi.status,
        created: pi.created,
        stripeFee: estimatedStripeFee,
        appFee,
        netPayout,
        customerEmail,
        description: pi.description,
        paymentMethod: pi.payment_method_types?.[0] || 'card',
        metadata: pi.metadata
      });
    }

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