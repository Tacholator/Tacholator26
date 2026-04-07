import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subs = await base44.asServiceRole.entities.UserSubscription.filter({ userId: user.id });
    const sub = subs[0];

    if (!sub?.stripeSubscriptionId) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (sub.status === 'trialing') {
      // Cancel immediately during trial — no charge applied
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      await base44.asServiceRole.entities.UserSubscription.update(sub.id, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelAtPeriodEnd: false
      });
      return Response.json({ success: true, message: 'Trial cancelled. You will not be charged.' });
    } else {
      // Cancel at end of current billing period
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      await base44.asServiceRole.entities.UserSubscription.update(sub.id, {
        cancelAtPeriodEnd: true
      });
      return Response.json({ success: true, message: 'Subscription will cancel at end of billing period.' });
    }
  } catch (error) {
    console.error('cancelInstructorSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});