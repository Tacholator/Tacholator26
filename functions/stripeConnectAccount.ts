import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, instructorId, accountId } = await req.json();

    // Create Connect account
    if (action === 'create') {

      // Get instructor data
      const instructors = await base44.asServiceRole.entities.Instructor.list();
      const instructor = instructors.find(i => i.created_by === instructorId);

      if (!instructor) {
        return Response.json({ error: 'Instructor not found' }, { status: 404 });
      }

      // Check if already has account
      if (instructor.stripeConnectAccountId) {
        const accountLink = await stripe.accountLinks.create({
          account: instructor.stripeConnectAccountId,
          refresh_url: `${url.origin}/InstructorPayments`,
          return_url: `${url.origin}/InstructorPayments`,
          type: 'account_onboarding'
        });

        return Response.json({
          accountId: instructor.stripeConnectAccountId,
          onboardingUrl: accountLink.url
        });
      }

      // Create new Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          instructorId
        }
      });

      // Update instructor with account ID
      await base44.asServiceRole.entities.Instructor.update(instructor.id, {
        stripeConnectAccountId: account.id,
        connectStatus: 'pending'
      });

      // Create account link
      const url = new URL(req.url);
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${url.origin}/InstructorPayments`,
        return_url: `${url.origin}/InstructorPayments`,
        type: 'account_onboarding'
      });

      return Response.json({
        accountId: account.id,
        onboardingUrl: accountLink.url
      });
    }

    // Create onboarding link
    if (action === 'onboarding') {

      const url = new URL(req.url);
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${url.origin}/InstructorPayments`,
        return_url: `${url.origin}/InstructorPayments`,
        type: 'account_onboarding'
      });

      return Response.json({ onboardingUrl: accountLink.url });
    }

    // Check account status
    if (action === 'status') {

      const account = await stripe.accounts.retrieve(accountId);

      const status = account.charges_enabled ? 'verified' : 
                     account.requirements?.currently_due?.length > 0 ? 'pending' : 
                     'restricted';

      // Update instructor status
      const instructors = await base44.asServiceRole.entities.Instructor.filter({
        stripeConnectAccountId: accountId
      });

      if (instructors.length > 0) {
        await base44.asServiceRole.entities.Instructor.update(instructors[0].id, {
          connectStatus: status
        });
      }

      return Response.json({
        status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirementsDue: account.requirements?.currently_due || []
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Connect account error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});