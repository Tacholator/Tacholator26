import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { accessId } = await req.json();
  if (!accessId) return Response.json({ error: 'accessId is required' }, { status: 400 });

  const accesses = await base44.entities.UserTestCentreAccess.filter({ userId: user.id });
  const access = accesses.find(a => a.id === accessId);

  if (!access) return Response.json({ error: 'Access record not found' }, { status: 404 });
  if (!access.stripeSubscriptionId) return Response.json({ error: 'No Stripe subscription found' }, { status: 400 });

  await stripe.subscriptions.update(access.stripeSubscriptionId, { cancel_at_period_end: true });

  await base44.entities.UserTestCentreAccess.update(accessId, {
    cancelAtPeriodEnd: true,
    cancelledAt: new Date().toISOString(),
  });

  return Response.json({ success: true });
});