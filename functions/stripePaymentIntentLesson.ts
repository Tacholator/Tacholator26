import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, customerId, paymentMethodId } = await req.json();

    // Get lesson details
    const lesson = await base44.entities.Lesson.filter({ id: lessonId });
    if (!lesson || lesson.length === 0) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const lessonData = lesson[0];
    const pupil = await base44.entities.Pupil.filter({ id: lessonData.pupilId });
    const amount = Math.round((pupil[0]?.hourlyRate || 30) * (lessonData.durationMinutes / 60) * 100); // Amount in pence

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        lessonId,
        userId: user.id
      }
    });

    // Create transaction record
    await base44.asServiceRole.entities.Transaction.create({
      userId: user.id,
      type: 'lesson',
      refId: lessonId,
      amount: amount / 100,
      currency: 'GBP',
      status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      paymentMethodId,
      stripePaymentIntentId: paymentIntent.id
    });

    return Response.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      requiresAction: paymentIntent.status === 'requires_action',
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});