import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const CITY_VIDEO_PRICE_ID = 'price_1TK6JV2aulA4vtEcAODbLdGE';
const BASE_URL = Deno.env.get('PUBLIC_APP_BASE_URL') || 'http://localhost:5173';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cityId, cityName } = await req.json();
    if (!cityId) {
      return Response.json({ error: 'cityId is required' }, { status: 400 });
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
      line_items: [{ price: CITY_VIDEO_PRICE_ID, quantity: 1 }],
      success_url: `${BASE_URL}/VideoSubscription?subscribed=true&cityId=${cityId}`,
      cancel_url: `${BASE_URL}/VideoSubscription`,
      subscription_data: {
        metadata: { userId: user.id, cityId, cityName: cityName || '' }
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});