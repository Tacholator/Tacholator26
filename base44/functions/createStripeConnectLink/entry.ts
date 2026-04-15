import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const refreshUrl = body.refreshUrl;
    const returnUrl = body.returnUrl;

    if (!refreshUrl || !returnUrl) {
      return Response.json({ error: 'Missing refreshUrl or returnUrl' }, { status: 400 });
    }

    // Get instructor profile
    const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
    let instructor = instructors[0];

    if (!instructor) {
      return Response.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    let accountId = instructor.stripeAccountId;

    // Verify account exists on Stripe or create new one
    let accountExists = false;
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
        accountExists = true;
        console.log('Existing Stripe account found:', accountId);
      } catch (error) {
        console.log('Stored account does not exist on Stripe, creating new one');
        accountId = null;
      }
    }

    // Create new account if none exists or previous was invalid
    if (!accountExists) {
      const nameParts = (user.full_name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          first_name: firstName,
          last_name: lastName
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual'
            }
          }
        }
      });

      accountId = account.id;
      console.log('Created new Stripe account:', accountId);

      // Update instructor with new account ID
      await base44.asServiceRole.entities.Instructor.update(instructor.id, {
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

    if (!accountLink.url) {
      throw new Error('Failed to generate Stripe onboarding URL');
    }

    return Response.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create Stripe connection' 
    }, { status: 500 });
  }
});