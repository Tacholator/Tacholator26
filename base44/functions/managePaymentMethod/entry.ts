import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';
import { resolveUserName } from '../../shared/userName.ts';

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

    const { action, paymentMethodId, cardId } = await req.json();

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: resolveUserName(user, user.email),
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
      
      // Save to user profile
      await base44.asServiceRole.entities.User.update(user.id, {
        stripeCustomerId: customer.id
      });
    }

    if (action === 'attach') {
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Get payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      // Save to database
      const cardData = {
        userId: user.id,
        stripePaymentMethodId: paymentMethodId,
        cardholderName: user.full_name,
        lastFourDigits: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        expiryMonth: String(paymentMethod.card.exp_month).padStart(2, '0'),
        expiryYear: String(paymentMethod.card.exp_year).slice(-2),
        isDefault: false
      };

      const savedCard = await base44.asServiceRole.entities.PaymentCard.create(cardData);

      // Set as default if it's the first card
      const existingCards = await base44.entities.PaymentCard.filter({ userId: user.id });
      if (existingCards.length === 1) {
        await base44.asServiceRole.entities.PaymentCard.update(savedCard.id, { isDefault: true });
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId }
        });
      }

      return Response.json({ success: true, card: savedCard });
    }

    if (action === 'setDefault') {
      // Update all cards to not default
      const allCards = await base44.entities.PaymentCard.filter({ userId: user.id });
      for (const card of allCards) {
        await base44.asServiceRole.entities.PaymentCard.update(card.id, { isDefault: false });
      }

      // Set selected card as default
      const card = await base44.entities.PaymentCard.filter({ id: cardId });
      if (card.length > 0 && card[0].stripePaymentMethodId) {
        await base44.asServiceRole.entities.PaymentCard.update(cardId, { isDefault: true });
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: card[0].stripePaymentMethodId }
        });
      }

      return Response.json({ success: true });
    }

    if (action === 'delete') {
      const cards = await base44.entities.PaymentCard.filter({ id: cardId });
      if (cards.length > 0 && cards[0].stripePaymentMethodId) {
        // Detach from Stripe
        await stripe.paymentMethods.detach(cards[0].stripePaymentMethodId);
        // Delete from database
        await base44.asServiceRole.entities.PaymentCard.delete(cardId);
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Payment method error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});