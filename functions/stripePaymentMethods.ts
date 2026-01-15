import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('Stripe_secret_key'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const method = req.method;

    // GET - List payment methods
    if (method === 'GET') {
      const customerId = url.searchParams.get('customerId');
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      // Get customer to check default payment method
      const customer = await stripe.customers.retrieve(customerId);

      return Response.json({
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          isDefault: pm.id === customer.invoice_settings?.default_payment_method
        }))
      });
    }

    // POST - Set default payment method
    if (method === 'POST') {
      const { customerId, paymentMethodId } = await req.json();

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return Response.json({ success: true });
    }

    // DELETE - Remove payment method
    if (method === 'DELETE') {
      const pathParts = url.pathname.split('/');
      const paymentMethodId = pathParts[pathParts.length - 1];

      await stripe.paymentMethods.detach(paymentMethodId);

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Payment methods error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});