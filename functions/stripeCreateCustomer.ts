import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('Stripe_secret_key'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      return Response.json({ customerId: user.stripeCustomerId });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: {
        userId: user.id
      }
    });

    // Update user with customer ID
    await base44.auth.updateMe({ stripeCustomerId: customer.id });

    return Response.json({ customerId: customer.id });
  } catch (error) {
    console.error('Create customer error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});