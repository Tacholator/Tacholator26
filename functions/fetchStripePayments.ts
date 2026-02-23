import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get instructor profile
    const instructors = await base44.entities.Instructor.filter({ 
      created_by: user.email 
    });

    if (instructors.length === 0 || !instructors[0].stripeAccountId) {
      return Response.json({ 
        error: 'No Stripe account connected',
        payments: []
      }, { status: 200 });
    }

    const instructor = instructors[0];
    
    // Fetch payment intents from the connected account
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      stripeAccount: instructor.stripeAccountId
    });

    // Transform the data to include fee calculations
    const payments = paymentIntents.data.map(pi => {
      const amount = pi.amount / 100; // Convert from cents
      const currency = pi.currency.toUpperCase();
      
      // Calculate Stripe fees (2.9% + 30p for cards in UK)
      const percentageFee = amount * 0.029;
      const fixedFee = 0.30;
      const totalFee = percentageFee + fixedFee;
      const netAmount = amount - totalFee;

      return {
        id: pi.id,
        amount: amount,
        currency: currency,
        status: pi.status,
        created: pi.created,
        stripeFee: totalFee,
        netPayout: netAmount,
        customerEmail: pi.receipt_email,
        description: pi.description,
        paymentMethod: pi.payment_method_types?.[0] || 'card',
        metadata: pi.metadata
      };
    });

    // Sort by created date (most recent first)
    payments.sort((a, b) => b.created - a.created);

    return Response.json({ 
      payments,
      accountId: instructor.stripeAccountId
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching Stripe payments:', error);
    return Response.json({ 
      error: error.message,
      payments: []
    }, { status: 500 });
  }
});