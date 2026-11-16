import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

const YEARLY_PRICE_ID = 'price_1TJfuF2aulA4vtEcBLRSlsWC';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subs = await base44.asServiceRole.entities.UserSubscription.filter({ userId: user.id });
    const subRecord = subs[0];

    if (!subRecord?.stripeSubscriptionId) {
      return Response.json({ error: 'No active subscription found.' }, { status: 400 });
    }

    if (subRecord.billingPeriod === 'yearly') {
      return Response.json({ error: 'Already on the annual plan.' }, { status: 400 });
    }

    // Retrieve the current Stripe subscription to get the subscription item ID
    const stripeSub = await stripe.subscriptions.retrieve(subRecord.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0]?.id;

    if (!itemId) {
      return Response.json({ error: 'Could not find subscription item.' }, { status: 400 });
    }

    // Upgrade: switch price to yearly and start the new yearly cycle now, prorating the change.
    // Do not pass trial_end here — an already-running trial must stay as it is, and a past
    // timestamp is rejected by Stripe (that was breaking every upgrade attempt).
    await stripe.subscriptions.update(subRecord.stripeSubscriptionId, {
      items: [{ id: itemId, price: YEARLY_PRICE_ID }],
      proration_behavior: 'create_prorations',
      billing_cycle_anchor: 'now'
    });

    // Update the local record
    await base44.asServiceRole.entities.UserSubscription.update(subRecord.id, {
      billingPeriod: 'yearly'
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('upgradeInstructorSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});