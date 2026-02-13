import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
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

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { pupilId, userId, amount } = session.metadata;

      if (!pupilId || !userId || !amount) {
        console.error('Missing metadata in session:', session.id);
        return Response.json({ error: 'Invalid session metadata' }, { status: 400 });
      }

      // Update pupil balance using service role
      const pupil = await base44.asServiceRole.entities.Pupil.get(pupilId);
      const currentBalance = pupil.bulkPaymentBalance || 0;
      const newBalance = currentBalance + parseFloat(amount);

      await base44.asServiceRole.entities.Pupil.update(pupilId, {
        bulkPaymentBalance: newBalance,
        bulkAmountPaid: (pupil.bulkAmountPaid || 0) + parseFloat(amount)
      });

      // Create ledger entry
      await base44.asServiceRole.entities.PaymentLedger.create({
        userId: pupilId,
        type: 'payment',
        reason: 'balance_top_up',
        amountGbp: parseFloat(amount),
        createdByRole: 'system',
        note: `Top-up payment via Stripe (Session: ${session.id})`
      });

      // Notify instructor
      await base44.asServiceRole.entities.Notification.create({
        userId: pupil.instructorId,
        title: 'Payment Received',
        message: `${pupil.firstName} ${pupil.lastName} topped up their balance by £${parseFloat(amount).toFixed(2)}`,
        type: 'payment'
      });

      console.log('Payment processed successfully:', session.id);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});