import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const BASE_URL = Deno.env.get('PUBLIC_APP_BASE_URL') || 'http://localhost:5173';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { centreId, centreName, stripePriceId } = await req.json();
    if (!centreId || !stripePriceId) {
      return Response.json({ error: 'centreId and stripePriceId are required' }, { status: 400 });
    }

    // Find or create Stripe customer
    let customerId;
    const existing = await stripe.customers.search({ query: `metadata['userId']:'${user.id}'`, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${BASE_URL}/TestRoutes?subscribed=true&centreId=${centreId}`,
      cancel_url: `${BASE_URL}/TestRoutes`,
      subscription_data: {
        metadata: { userId: user.id, cityId: centreId, cityName: centreName || '' }
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});