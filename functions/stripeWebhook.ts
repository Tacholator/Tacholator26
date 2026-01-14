import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object;
        console.log('Setup intent succeeded:', setupIntent.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { lessonId, userId } = paymentIntent.metadata;

        // Update transaction status
        const transactions = await base44.asServiceRole.entities.Transaction.filter({
          stripePaymentIntentId: paymentIntent.id
        });

        if (transactions.length > 0) {
          await base44.asServiceRole.entities.Transaction.update(transactions[0].id, {
            status: 'paid'
          });
        }

        // Update lesson status if applicable
        if (lessonId) {
          await base44.asServiceRole.entities.Lesson.update(lessonId, {
            status: 'Completed'
          });
        }

        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;

        // Update transaction status
        const transactions = await base44.asServiceRole.entities.Transaction.filter({
          stripePaymentIntentId: paymentIntent.id
        });

        if (transactions.length > 0) {
          await base44.asServiceRole.entities.Transaction.update(transactions[0].id, {
            status: 'failed'
          });
        }

        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Charge refunded:', charge.id);
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        
        const status = account.charges_enabled ? 'verified' : 
                       account.requirements?.currently_due?.length > 0 ? 'pending' : 
                       'restricted';

        // Update instructor status
        const instructors = await base44.asServiceRole.entities.Instructor.filter({
          stripeConnectAccountId: account.id
        });

        if (instructors.length > 0) {
          await base44.asServiceRole.entities.Instructor.update(instructors[0].id, {
            connectStatus: status
          });
        }

        console.log('Account updated:', account.id);
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});