import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';
import { computeDefaultStripeFee } from '../../shared/stripeFees.ts';

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

    const { pupilId, amount, successUrl, cancelUrl, promoCode } = await req.json();

    if (!pupilId || !amount || amount < 10) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify pupil belongs to user
    const pupil = await base44.entities.Pupil.get(pupilId);
    if (!pupil || pupil.linkedUserId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get instructor's Stripe Connect account
    const instructor = await base44.asServiceRole.entities.Instructor.filter({
      created_by: pupil.instructorEmail
    });

    if (!instructor || instructor.length === 0) {
      return Response.json({ error: 'Instructor not found' }, { status: 404 });
    }

    const instructorAccount = instructor[0];
    
    // Check if instructor has connected Stripe account
    if (!instructorAccount.stripeAccountId || instructorAccount.stripeAccountStatus !== 'active') {
      return Response.json({ 
        error: 'Instructor payment account not set up. Please contact your instructor.' 
      }, { status: 400 });
    }

    const lessonAmount = Math.round(amount * 100) / 100;
    // Card country is unknown before payment — estimate using the UK domestic rate.
    // Reconciled against the actual card country in stripeWebhook (payment_intent.succeeded).
    const cardFeeAmount = computeDefaultStripeFee(lessonAmount);
    const totalAmount = Math.round((lessonAmount + cardFeeAmount) * 100);

    // Platform fee (5%) is on the lesson amount only — NOT on the card surcharge,
    // so the platform never takes a cut of the processing fee.
    const platformFeeAmount = Math.round(lessonAmount * 100 * 0.05);

    // Two line items so the invoice clearly shows credits vs. card fee.
    const lineItems = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Lesson Credits Top-Up',
            description: `Add £${lessonAmount.toFixed(2)} to your lesson balance`
          },
          unit_amount: Math.round(lessonAmount * 100)
        },
        quantity: 1
      },
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Card Processing Fee',
            description: 'Stripe card processing fee (UK card rate)'
          },
          unit_amount: Math.round(cardFeeAmount * 100)
        },
        quantity: 1
      }
    ];

    const sessionMetadata = {
      pupilId: pupilId,
      userId: user.id,
      instructorId: instructorAccount.id,
      lessonAmount: lessonAmount.toString(),
      cardFeeAmount: cardFeeAmount.toString(),
      feeEstimated: 'true'
    };

    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: instructorAccount.stripeAccountId
        },
        // Mirror metadata onto the PaymentIntent so the webhook can reconcile
        // the estimated fee against the actual card-country fee.
        metadata: sessionMetadata
      },
      metadata: sessionMetadata,
      ...(promoCode && { discounts: [{ coupon: promoCode }] })
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});