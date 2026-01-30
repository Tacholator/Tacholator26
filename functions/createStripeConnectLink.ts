import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
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

    // If account exists, check if it's valid, otherwise create new
    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId);
        console.log('Existing account status:', existingAccount.details_submitted, existingAccount.charges_enabled);
      } catch (error) {
        console.error('Failed to retrieve account, will create new:', error.message);
        accountId = null;
      }
    }

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_profile: {
          mcc: '8299',
          product_description: 'Driving lesson instruction services'
        },
        metadata: {
          instructor_id: instructor.id,
          user_email: user.email
        }
      });

      accountId = account.id;
      console.log('Created new Stripe account:', accountId);

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
      type: 'account_onboarding',
      collect: 'currently_due'
    });

    console.log('Created account link:', accountLink.url);
    return Response.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});