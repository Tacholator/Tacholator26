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

    // Create Stripe checkout session
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
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        pupilId: pupilId,
        userId: user.id,
        amount: amount.toString()
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});