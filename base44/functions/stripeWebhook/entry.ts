import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';
import { computeStripeFee } from '../../shared/stripeFees.ts';

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
    
    case 'customer.subscription.created':
      return await handleSubscriptionCreated(data, base44);
    
    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(data, base44);
    
    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(data, base44);
    
    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(data, base44);

    default:
      console.log(`Unhandled event type: ${eventType}`);
      return { success: true, message: 'Event type not handled' };
  }
}

async function handleCheckoutSessionCompleted(session, base44) {
  console.log('Processing checkout.session.completed:', session.id);

  // Instructor subscription checkouts are handled by the customer.subscription.* events.
  // Only one-off lesson top-ups create ledger entries / pupil invoices.
  if (session.mode !== 'payment') {
    console.log('Skipping non-payment checkout session:', session.id, session.mode);
    return { success: true, skipped: true };
  }

  const { id, amount_total, metadata } = session;
  const totalGbp = amount_total / 100;

  // Lesson credits (credited to balance) and card fee surcharge (not credited).
  // Fall back to the total if legacy sessions without the fee breakdown are received.
  const lessonAmount = metadata?.lessonAmount ? parseFloat(metadata.lessonAmount) : totalGbp;
  const cardFeeAmount = metadata?.cardFeeAmount ? parseFloat(metadata.cardFeeAmount) : 0;

  try {
    // Balance top-up ledger entry — lesson credits only (excludes card fee)
    const payment = await base44.asServiceRole.entities.PaymentLedger.create({
      userId: metadata?.pupilId || 'unknown',
      type: 'payment',
      reason: 'balance_top_up',
      amountGbp: lessonAmount,
      createdByRole: 'system',
      note: `Stripe card top-up - Session ${id}`
    });

    // Card fee surcharge ledger entry (not added to lesson balance)
    if (cardFeeAmount > 0) {
      await base44.asServiceRole.entities.PaymentLedger.create({
        userId: metadata?.pupilId || 'unknown',
        type: 'payment',
        reason: 'card_fee_surcharge',
        amountGbp: cardFeeAmount,
        createdByRole: 'system',
        note: `Stripe card processing fee - Session ${id}`
      });
    }

    // If there's a pupil ID in metadata, update their balance and create invoice
    if (metadata?.pupilId) {
      const pupils = await base44.asServiceRole.entities.Pupil.filter({ id: metadata.pupilId });
      
      if (pupils.length > 0) {
        const pupil = pupils[0];

        // Credit balance with the lesson amount ONLY (surcharge excluded)
        await base44.asServiceRole.entities.Pupil.update(pupil.id, {
          bulkAmountPaid: (pupil.bulkAmountPaid || 0) + lessonAmount,
          bulkPaymentBalance: (pupil.bulkPaymentBalance || 0) + lessonAmount
        });

        // Get instructor info for the invoice.
        // IMPORTANT: Invoice.instructorId must reference the instructor's USER id
        // (not the Instructor entity id stored in metadata) so the invoice passes
        // RLS and appears on the instructor's Invoices page.
        let instructorName = pupil.instructorName || '';
        let instructorEmail = pupil.instructorEmail || '';
        let instructorPhone = '';
        let instructorId = pupil.instructorId || '';

        if (instructorEmail) {
          const instructors = await base44.asServiceRole.entities.Instructor.filter({ created_by: instructorEmail });
          if (instructors.length > 0) {
            const inst = instructors[0];
            instructorName = inst.name || instructorName;
            instructorPhone = inst.phone || '';
          }
        }

        // Get or create invoice sequence for this instructor+year
        const currentYear = new Date().getFullYear();
        const sequences = await base44.asServiceRole.entities.InvoiceSequence.filter({
          instructorId,
          year: currentYear
        });

        let nextSeq = 1;
        if (sequences.length > 0) {
          nextSeq = sequences[0].nextSeq;
          await base44.asServiceRole.entities.InvoiceSequence.update(sequences[0].id, { nextSeq: nextSeq + 1 });
        } else {
          await base44.asServiceRole.entities.InvoiceSequence.create({ instructorId, year: currentYear, nextSeq: 2 });
        }

        const invoiceNumber = `${currentYear}${String(nextSeq).padStart(6, '0')}`;

        // Create a single invoice record visible to both instructor and pupil
        const invoiceDescription = cardFeeAmount > 0
          ? `Lesson credits top-up £${lessonAmount.toFixed(2)} + card processing fee £${cardFeeAmount.toFixed(2)}`
          : 'Lesson credits top-up (card payment)';
        await base44.asServiceRole.entities.Invoice.create({
          invoiceNumber,
          status: 'PAID',
          type: 'STRIPE_CARD',
          pupilId: pupil.id,
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          pupilEmail: pupil.email || '',
          instructorId,
          instructorName,
          instructorEmail,
          instructorPhone,
          amount: totalGbp,
          hours: 0,
          description: invoiceDescription,
          paymentMethod: 'STRIPE_CARD',
          paymentDate: new Date().toISOString(),
          stripePaymentIntentId: id,
          isLocked: true,
          sharedWithPupil: true
        });

        console.log(`Invoice ${invoiceNumber} created for card payment - Session ${id}`);
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
  
  const metadata = paymentIntent.metadata || {};
  const lessonAmount = metadata.lessonAmount ? parseFloat(metadata.lessonAmount) : null;
  const estimatedFee = metadata.cardFeeAmount ? parseFloat(metadata.cardFeeAmount) : null;

  // Only reconcile bulk top-ups that carry the fee breakdown in metadata
  if (lessonAmount == null || estimatedFee == null) {
    console.log('Payment intent succeeded, already processed via checkout session');
    return { success: true, skipped: true };
  }

  try {
    const chargeId = typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;
    if (!chargeId) return { success: true, skipped: true };

    const charge = await stripe.charges.retrieve(chargeId);
    const cardCountry = charge.payment_method_details?.card?.country;

    // UK card — the estimate already matches the actual fee, nothing to reconcile
    if (!cardCountry || cardCountry === 'GB') {
      return { success: true, reconciled: true, country: cardCountry || 'GB' };
    }

    const actualFee = computeStripeFee(lessonAmount, cardCountry);
    const difference = Math.round((actualFee - estimatedFee) * 100) / 100;

    if (Math.abs(difference) > 0.01) {
      await base44.asServiceRole.entities.PaymentLedger.create({
        userId: metadata.pupilId || 'unknown',
        type: 'adjustment',
        reason: 'manual_adjustment',
        amountGbp: difference, // positive = extra fee absorbed by instructor; negative = instructor received more
        createdByRole: 'system',
        note: `Card fee reconciliation — ${cardCountry} card. Estimated £${estimatedFee.toFixed(2)}, actual £${actualFee.toFixed(2)}. PI ${paymentIntent.id}`
      });
    }

    return { success: true, reconciled: true, country: cardCountry, difference };
  } catch (error) {
    console.error('Fee reconciliation error:', error);
    return { success: true, reconciled: false, error: error.message };
  }
}

async function handleInvoicePaid(invoice, base44) {
  console.log('Processing invoice.paid:', invoice.id);
  
  // Not currently used - Stripe invoices handled separately
  return { success: true, skipped: true };
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
      userId: payment.userId,
      type: 'refund',
      reason: 'refund_issued',
      amountGbp: -(charge.amount_refunded / 100),
      createdByRole: 'system',
      note: `Stripe refund - Charge ${charge.id}`
    });

    // Update pupil balance
    const pupils = await base44.asServiceRole.entities.Pupil.filter({
      id: payment.userId
    });
    
    if (pupils.length > 0) {
      const pupil = pupils[0];
      const refundAmount = charge.amount_refunded / 100;
      await base44.asServiceRole.entities.Pupil.update(pupil.id, {
        bulkPaymentBalance: Math.max(0, (pupil.bulkPaymentBalance || 0) - refundAmount)
      });
    }
  }

  return { success: true };
}

async function handleRefundUpdated(refund, base44) {
  console.log('Processing refund.updated:', refund.id);
  return { success: true };
}

async function upsertCityVideoSubscription(subscription, base44, userId, cityId) {
  const statusMap = { trialing: 'active', active: 'active', past_due: 'past_due', canceled: 'inactive', cancelled: 'inactive' };
  const status = statusMap[subscription.status] || 'active';
  const cityName = subscription.metadata?.cityName || '';
  const currentPeriodEndAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const stripePriceId = subscription.items?.data?.[0]?.price?.id || null;

  const data = {
    userId,
    cityId,
    cityName,
    status,
    stripeSubscriptionId: subscription.id,
    stripePriceId,
    currentPeriodEndAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  };

  const existing = await base44.asServiceRole.entities.CityVideoSubscription.filter({
    userId,
    stripeSubscriptionId: subscription.id
  });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.CityVideoSubscription.update(existing[0].id, data);
  } else {
    await base44.asServiceRole.entities.CityVideoSubscription.create(data);
  }
  return { success: true };
}

async function handleSubscriptionCreated(subscription, base44) {
  console.log('Processing customer.subscription.created:', subscription.id);
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.warn('No userId in subscription metadata, skipping');
    return { success: true };
  }

  const cityId = subscription.metadata?.cityId;
  if (cityId) {
    return await upsertCityVideoSubscription(subscription, base44, userId, cityId);
  }

  const statusMap = { trialing: 'trialing', active: 'active', past_due: 'past_due', canceled: 'cancelled' };
  const status = statusMap[subscription.status] || 'active';
  const billingPeriod = subscription.metadata?.billingPeriod || 'monthly';

  const toIso = (ts) => (ts != null ? new Date(ts * 1000).toISOString() : null);

  // When trialing, the paid period hasn't started yet.
  // currentPeriodStart should be when the trial ends (i.e. when billing begins).
  let currentPeriodStartAt, currentPeriodEndAt;
  if (status === 'trialing' && subscription.trial_end) {
    const trialEndDate = new Date(subscription.trial_end * 1000);
    currentPeriodStartAt = trialEndDate.toISOString();
    // Calculate period end based on billing period
    const periodEnd = new Date(trialEndDate);
    if (billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
    currentPeriodEndAt = periodEnd.toISOString();
  } else {
    currentPeriodStartAt = toIso(subscription.current_period_start);
    currentPeriodEndAt = toIso(subscription.current_period_end);
  }

  const data = {
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    status,
    billingPeriod,
    trialStartAt: toIso(subscription.trial_start),
    trialEndAt: toIso(subscription.trial_end),
    currentPeriodStartAt,
    currentPeriodEndAt,
  };

  const existing = await base44.asServiceRole.entities.UserSubscription.filter({ userId });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, data);
  } else {
    await base44.asServiceRole.entities.UserSubscription.create(data);
  }
  return { success: true };
}

async function handleSubscriptionUpdated(subscription, base44) {
  console.log('Processing customer.subscription.updated:', subscription.id);
  const cityId = subscription.metadata?.cityId;
  if (cityId) {
    const userId = subscription.metadata?.userId;
    if (userId) return await upsertCityVideoSubscription(subscription, base44, userId, cityId);
    const existingCity = await base44.asServiceRole.entities.CityVideoSubscription.filter({ stripeSubscriptionId: subscription.id });
    if (existingCity.length > 0) {
      const cityStatusMap = { trialing: 'active', active: 'active', past_due: 'past_due', canceled: 'inactive', cancelled: 'inactive' };
      await base44.asServiceRole.entities.CityVideoSubscription.update(existingCity[0].id, {
        status: cityStatusMap[subscription.status] || 'active',
        currentPeriodEndAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      });
    }
    return { success: true };
  }

  const statusMap = { trialing: 'trialing', active: 'active', past_due: 'past_due', canceled: 'cancelled' };
  const status = statusMap[subscription.status] || 'active';

  const existing = await base44.asServiceRole.entities.UserSubscription.filter({ stripeSubscriptionId: subscription.id });
  if (existing.length === 0) {
    // Fall back to userId if available
    const userId = subscription.metadata?.userId;
    if (userId) return await handleSubscriptionCreated(subscription, base44);
    return { success: true };
  }

  const billingPeriod = existing[0].billingPeriod || 'monthly';
  let currentPeriodStartAt, currentPeriodEndAt;
  if (status === 'trialing' && subscription.trial_end) {
    const trialEndDate = new Date(subscription.trial_end * 1000);
    currentPeriodStartAt = trialEndDate.toISOString();
    const periodEnd = new Date(trialEndDate);
    if (billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
    currentPeriodEndAt = periodEnd.toISOString();
  } else {
    currentPeriodStartAt = new Date(subscription.current_period_start * 1000).toISOString();
    currentPeriodEndAt = new Date(subscription.current_period_end * 1000).toISOString();
  }

  await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, {
    status,
    trialEndAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    currentPeriodStartAt,
    currentPeriodEndAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  });
  return { success: true };
}

async function handleSubscriptionDeleted(subscription, base44) {
  console.log('Processing customer.subscription.deleted:', subscription.id);
  const cityId = subscription.metadata?.cityId;
  if (cityId) {
    const existingCity = await base44.asServiceRole.entities.CityVideoSubscription.filter({ stripeSubscriptionId: subscription.id });
    if (existingCity.length > 0) {
      await base44.asServiceRole.entities.CityVideoSubscription.update(existingCity[0].id, {
        status: 'inactive',
        cancelAtPeriodEnd: false,
      });
    }
    return { success: true };
  }

  const existing = await base44.asServiceRole.entities.UserSubscription.filter({ stripeSubscriptionId: subscription.id });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelAtPeriodEnd: false
    });
  }
  return { success: true };
}

async function handleInvoicePaymentFailed(invoice, base44) {
  console.log('Processing invoice.payment_failed:', invoice.id);
  if (!invoice.subscription) return { success: true };
  const existing = await base44.asServiceRole.entities.UserSubscription.filter({ stripeSubscriptionId: invoice.subscription });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.UserSubscription.update(existing[0].id, {
      status: 'past_due',
      lastPaymentStatus: 'failed',
      lastPaymentAt: new Date().toISOString()
    });
  }
  return { success: true };
}