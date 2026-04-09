import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      return Response.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    // Update in DB
    const subs = await base44.asServiceRole.entities.CityVideoSubscription.filter({ stripeSubscriptionId: subscriptionId, userId: user.id });
    if (subs.length > 0) {
      await base44.asServiceRole.entities.CityVideoSubscription.update(subs[0].id, { cancelAtPeriodEnd: true });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});