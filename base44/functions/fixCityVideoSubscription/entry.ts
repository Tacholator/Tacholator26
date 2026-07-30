import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stripeSubscriptionId } = await req.json();
    if (!stripeSubscriptionId) {
      return Response.json({ error: 'stripeSubscriptionId is required' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const userId = subscription.metadata?.userId;
    const cityId = subscription.metadata?.cityId;
    if (!userId || !cityId) {
      return Response.json({ error: 'Subscription has no cityId/userId metadata', found: false }, { status: 200 });
    }

    const statusMap = { trialing: 'active', active: 'active', past_due: 'past_due', canceled: 'inactive', cancelled: 'inactive' };
    const status = statusMap[subscription.status] || 'active';
    const cityName = subscription.metadata?.cityName || '';
    const currentPeriodEndAt = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
    const stripePriceId = subscription.items?.data?.[0]?.price?.id || null;

    const data = {
      userId,
      cityId,
      cityName,
      status,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      currentPeriodEndAt,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    };

    const existing = await base44.asServiceRole.entities.CityVideoSubscription.filter({
      userId,
      stripeSubscriptionId: subscription.id
    });
    let record;
    if (existing.length > 0) {
      record = await base44.asServiceRole.entities.CityVideoSubscription.update(existing[0].id, data);
    } else {
      record = await base44.asServiceRole.entities.CityVideoSubscription.create(data);
    }

    // Remove the erroneously-created instructor UserSubscription for this city video subscription
    const wrongUserSubs = await base44.asServiceRole.entities.UserSubscription.filter({ stripeSubscriptionId: subscription.id });
    let cleanedUp = 0;
    for (const us of wrongUserSubs) {
      if (!us.planId && !us.currentPeriodStartAt) {
        await base44.asServiceRole.entities.UserSubscription.delete(us.id);
        cleanedUp++;
      }
    }

    return Response.json({ success: true, cityVideoSubscription: record, cleanedUpWrongUserSubs: cleanedUp });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});