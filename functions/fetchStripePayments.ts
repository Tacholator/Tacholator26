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

    // Get instructor profile
    const instructors = await base44.entities.Instructor.filter({ 
      created_by: user.email 
    });

    if (instructors.length === 0 || !instructors[0].stripeAccountId) {
      return Response.json({ payments: [] }, { status: 200 });
    }

    const instructor = instructors[0];
    const connectedAccountId = instructor.stripeAccountId;

    // Fetch charges from the PLATFORM account that have destination = connected account
    // This captures payments made via Stripe Checkout with transfer_data
    const charges = await stripe.charges.list({
      limit: 100,
    });

    // Also fetch payment intents directly on the connected account
    const connectedPaymentIntents = await stripe.paymentIntents.list(
      { limit: 100 },
      { stripeAccount: connectedAccountId }
    );

    const paymentsMap = new Map();

    // Process platform charges destined for this connected account
    for (const charge of charges.data) {
      if (charge.transfer_data?.destination === connectedAccountId || charge.on_behalf_of === connectedAccountId) {
        const amount = charge.amount / 100;
        const stripeFee = charge.application_fee_amount ? charge.application_fee_amount / 100 : 0;
        // If no app fee recorded, estimate from balance transaction
        const netPayout = amount - stripeFee;

        paymentsMap.set(charge.id, {
          id: charge.id,
          amount,
          currency: charge.currency.toUpperCase(),
          status: charge.status === 'succeeded' ? 'succeeded' : charge.status,
          created: charge.created,
          stripeFee,
          netPayout,
          customerEmail: charge.billing_details?.email || charge.receipt_email,
          description: charge.description,
          paymentMethod: charge.payment_method_details?.type || 'card',
          metadata: charge.metadata
        });
      }
    }

    // Process connected account payment intents (direct charges)
    for (const pi of connectedPaymentIntents.data) {
      if (!paymentsMap.has(pi.id)) {
        const amount = pi.amount / 100;
        // Use actual fee from balance transaction if available, else estimate UK rate
        const percentageFee = amount * 0.014;
        const fixedFee = 0.20;
        const stripeFee = parseFloat((percentageFee + fixedFee).toFixed(2));
        const netPayout = parseFloat((amount - stripeFee).toFixed(2));

        paymentsMap.set(pi.id, {
          id: pi.id,
          amount,
          currency: pi.currency.toUpperCase(),
          status: pi.status,
          created: pi.created,
          stripeFee,
          netPayout,
          customerEmail: pi.receipt_email,
          description: pi.description,
          paymentMethod: pi.payment_method_types?.[0] || 'card',
          metadata: pi.metadata
        });
      }
    }

    const payments = Array.from(paymentsMap.values())
      .sort((a, b) => b.created - a.created);

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