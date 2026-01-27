import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('Stripe_secret_key'), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { refreshUrl, returnUrl } = await req.json();

    // Get instructor profile
    const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
    let instructor = instructors[0];

    if (!instructor) {
      return Response.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    let accountId = instructor.stripeAccountId;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual'
      });

      accountId = account.id;

      // Update instructor with account ID
      await base44.entities.Instructor.update(instructor.id, {
        stripeAccountId: accountId,
        stripeAccountStatus: 'pending'
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return Response.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});