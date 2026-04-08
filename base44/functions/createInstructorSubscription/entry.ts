import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

const PRICE_IDS = {
  monthly: 'price_1TJfuF2aulA4vtEcDoXVjjjN',
  yearly: 'price_1TJfuF2aulA4vtEcBLRSlsWC'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { billingPeriod } = await req.json();

    if (!billingPeriod || !PRICE_IDS[billingPeriod]) {
      return Response.json({ error: 'Invalid billing period. Use "monthly" or "yearly".' }, { status: 400 });
    }

    const priceId = PRICE_IDS[billingPeriod];
    const baseUrl = Deno.env.get('PUBLIC_APP_BASE_URL') || 'http://localhost:5173';

    // Check for existing subscription record to reuse Stripe customer
    const existingSubs = await base44.asServiceRole.entities.UserSubscription.filter({ userId: user.id });
    let stripeCustomerId = existingSubs[0]?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || user.email,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe Checkout Session with 3-day free trial
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 3,
        metadata: { userId: user.id, billingPeriod }
      },
      payment_method_collection: 'always',
      success_url: `${baseUrl}/InstructorSubscription?subscribed=true`,
      cancel_url: `${baseUrl}/InstructorSubscription`
    });

    // Save/update the UserSubscription record with the Stripe customer ID
    if (existingSubs.length > 0) {
      await base44.asServiceRole.entities.UserSubscription.update(existingSubs[0].id, {
        stripeCustomerId,
        billingPeriod
      });
    } else {
      await base44.asServiceRole.entities.UserSubscription.create({
        userId: user.id,
        billingPeriod,
        status: 'none',
        stripeCustomerId
      });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createInstructorSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});