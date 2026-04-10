import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subscriptions = await base44.entities.UserSubscription.filter({ userId: user.id });
        const subscription = subscriptions[0];

        if (!subscription || !subscription.stripeCustomerId) {
            return Response.json({ error: 'No subscription or Stripe customer found.' }, { status: 404 });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${Deno.env.get("PUBLIC_APP_BASE_URL")}/InstructorSubscription`,
        });

        return Response.json({ url: portalSession.url });
    } catch (error) {
        console.error("Error creating Stripe Customer Portal session:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});