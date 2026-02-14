import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.7.0';

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

    const { pupilId, amount, successUrl, cancelUrl } = await req.json();

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

    // Calculate platform fee (5% of total)
    const platformFeeAmount = Math.round(amount * 100 * 0.05);
    const totalAmount = Math.round(amount * 100);

    // Create Stripe checkout session with connected account
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Lesson Credits Top-Up',
              description: `Add £${amount.toFixed(2)} to your lesson balance`
            },
            unit_amount: totalAmount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: instructorAccount.stripeAccountId
        }
      },
      metadata: {
        pupilId: pupilId,
        userId: user.id,
        instructorId: instructorAccount.id,
        amount: amount.toString()
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});