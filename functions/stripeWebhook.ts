import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia'
});

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature) {
      console.error('Missing Stripe signature');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature (async for Deno)
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

    // Check for duplicate events (idempotency)
    const existingEvents = await base44.asServiceRole.entities.WebhookEvent.filter({
      stripeEventId: event.id
    });

    if (existingEvents.length > 0) {
      console.log(`Duplicate event ${event.id}, skipping processing`);
      return Response.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Log webhook receipt
    const webhookLog = await base44.asServiceRole.entities.WebhookEvent.create({
      stripeEventId: event.id,
      type: event.type,
      stripeCreatedAt: new Date(event.created * 1000).toISOString(),
      receivedAt: new Date().toISOString(),
      status: 'received',
      relatedObjectId: event.data.object.id,
      rawPayload: {
        type: event.type,
        objectId: event.data.object.id,
        // Store minimal payload to avoid bloat
        amount: event.data.object.amount,
        currency: event.data.object.currency,
        status: event.data.object.status
      }
    });

    // Process the event
    let processResult;
    try {
      processResult = await processWebhookEvent(event, base44);
      
      // Update webhook log to processed
      await base44.asServiceRole.entities.WebhookEvent.update(webhookLog.id, {
        status: 'processed'
      });
      
      console.log(`Successfully processed ${event.type} event ${event.id}`);
    } catch (processingError) {
      // Update webhook log to failed
      await base44.asServiceRole.entities.WebhookEvent.update(webhookLog.id, {
        status: 'failed',
        errorMessage: processingError.message
      });
      
      console.error(`Failed to process ${event.type}:`, processingError);
      // Still return 200 so Stripe doesn't retry
    }

    return Response.json({ 
      received: true, 
      eventId: event.id,
      type: event.type,
      processed: processResult?.success || false
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook handler error:', error);
    // Return 500 for unexpected errors
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processWebhookEvent(event, base44) {
  const eventType = event.type;
  const data = event.data.object;

  switch (eventType) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(data, base44);
    
    case 'payment_intent.succeeded':
      return await handlePaymentIntentSucceeded(data, base44);
    
    case 'invoice.paid':
      return await handleInvoicePaid(data, base44);
    
    case 'charge.refunded':
      return await handleChargeRefunded(data, base44);
    
    case 'refund.updated':
      return await handleRefundUpdated(data, base44);
    
    default:
      console.log(`Unhandled event type: ${eventType}`);
      return { success: true, message: 'Event type not handled' };
  }
}

async function handleCheckoutSessionCompleted(session, base44) {
  console.log('Processing checkout.session.completed:', session.id);
  
  // Extract relevant data
  const {
    id,
    payment_intent,
    customer,
    customer_email,
    amount_total,
    currency,
    metadata
  } = session;

  // Create a payment ledger entry
  try {
    const payment = await base44.asServiceRole.entities.PaymentLedger.create({
      stripePaymentIntentId: payment_intent,
      stripeCheckoutSessionId: id,
      stripeCustomerId: customer,
      customerEmail: customer_email,
      amount: amount_total / 100, // Convert from cents
      currency: currency,
      status: 'completed',
      paymentMethod: 'stripe_checkout',
      metadata: metadata || {},
      paidAt: new Date().toISOString()
    });

    // If there's a pupil ID in metadata, update their balance
    if (metadata?.pupilId) {
      const pupils = await base44.asServiceRole.entities.Pupil.filter({
        id: metadata.pupilId
      });
      
      if (pupils.length > 0) {
        const pupil = pupils[0];
        const newBalance = (pupil.bulkPaymentBalance || 0) + (amount_total / 100);
        await base44.asServiceRole.entities.Pupil.update(pupil.id, {
          bulkAmountPaid: (pupil.bulkAmountPaid || 0) + (amount_total / 100),
          bulkPaymentBalance: newBalance
        });
      }
    }

    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error('Error handling checkout session:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent, base44) {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id);
  
  // Update existing payment ledger entry or create new one
  const existingPayments = await base44.asServiceRole.entities.PaymentLedger.filter({
    stripePaymentIntentId: paymentIntent.id
  });

  if (existingPayments.length > 0) {
    // Update existing
    await base44.asServiceRole.entities.PaymentLedger.update(existingPayments[0].id, {
      status: 'completed',
      paidAt: new Date().toISOString()
    });
    return { success: true, updated: true };
  } else {
    // Create new entry
    await base44.asServiceRole.entities.PaymentLedger.create({
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      paidAt: new Date().toISOString()
    });
    return { success: true, created: true };
  }
}

async function handleInvoicePaid(invoice, base44) {
  console.log('Processing invoice.paid:', invoice.id);
  
  // Log the invoice payment
  await base44.asServiceRole.entities.PaymentLedger.create({
    stripeInvoiceId: invoice.id,
    stripeCustomerId: invoice.customer,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'completed',
    paymentMethod: 'stripe_invoice',
    paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
  });

  return { success: true };
}

async function handleChargeRefunded(charge, base44) {
  console.log('Processing charge.refunded:', charge.id);
  
  // Find the original payment
  const payments = await base44.asServiceRole.entities.PaymentLedger.filter({
    stripePaymentIntentId: charge.payment_intent
  });

  if (payments.length > 0) {
    const payment = payments[0];
    
    // Create refund entry
    await base44.asServiceRole.entities.PaymentLedger.create({
      stripeChargeId: charge.id,
      stripePaymentIntentId: charge.payment_intent,
      amount: -(charge.amount_refunded / 100), // Negative for refund
      currency: charge.currency,
      status: 'refunded',
      paymentMethod: 'stripe_refund',
      paidAt: new Date().toISOString(),
      metadata: { originalPaymentId: payment.id }
    });

    // Update pupil balance if applicable
    if (payment.metadata?.pupilId) {
      const pupils = await base44.asServiceRole.entities.Pupil.filter({
        id: payment.metadata.pupilId
      });
      
      if (pupils.length > 0) {
        const pupil = pupils[0];
        const refundAmount = charge.amount_refunded / 100;
        await base44.asServiceRole.entities.Pupil.update(pupil.id, {
          bulkPaymentBalance: Math.max(0, (pupil.bulkPaymentBalance || 0) - refundAmount)
        });
      }
    }
  }

  return { success: true };
}

async function handleRefundUpdated(refund, base44) {
  console.log('Processing refund.updated:', refund.id);
  
  // Log refund status change
  // Can be extended based on specific business logic
  
  return { success: true };
}