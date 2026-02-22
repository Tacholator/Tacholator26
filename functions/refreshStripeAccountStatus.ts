import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
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

    if (instructors.length === 0) {
      return Response.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const instructor = instructors[0];

    if (!instructor.stripeAccountId) {
      return Response.json({ error: 'No Stripe account connected' }, { status: 400 });
    }

    const account = await stripe.accounts.retrieve(instructor.stripeAccountId);

    let status = 'pending';
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active';
    } else if (account.requirements?.disabled_reason) {
      status = 'restricted';
    }

    const updateData = { stripeAccountStatus: status };

    if (status === 'active' && instructor.stripeAccountStatus !== 'active') {
      updateData.stripeOnboardingCompletedAt = new Date().toISOString();
    }

    await base44.asServiceRole.entities.Instructor.update(instructor.id, updateData);

    return Response.json({ 
      success: true, 
      status: status,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      disabledReason: account.requirements?.disabled_reason
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});