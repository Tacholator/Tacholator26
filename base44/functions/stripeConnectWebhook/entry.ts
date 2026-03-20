import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle account.updated event
    if (event.type === 'account.updated') {
      const account = event.data.object;
      
      // Find instructor with this account ID
      const instructors = await base44.asServiceRole.entities.Instructor.filter({
        stripeAccountId: account.id
      });

      if (instructors.length > 0) {
        const instructor = instructors[0];
        
        // Determine account status
        let status = 'pending';
        if (account.charges_enabled && account.payouts_enabled) {
          status = 'active';
        } else if (account.requirements?.disabled_reason) {
          status = 'restricted';
        }

        const updateData = {
          stripeAccountStatus: status
        };

        // If just became active, record completion time
        if (status === 'active' && instructor.stripeAccountStatus !== 'active') {
          updateData.stripeOnboardingCompletedAt = new Date().toISOString();
        }

        await base44.asServiceRole.entities.Instructor.update(instructor.id, updateData);

        console.log(`Updated instructor ${instructor.id} Stripe status to ${status}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});