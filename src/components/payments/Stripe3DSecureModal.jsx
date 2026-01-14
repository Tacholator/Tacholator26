import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const STRIPE_KEY = import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_PUBLISHABLE_KEY || 'pk_test_51QPf7Z04n7pXnZlA4C1qzfHw9AoqxG3fQRNF5kOkN3OIXu2lW3o4dQPaVZkW3C7Yc5eJ8bMt9qMz6rXh2pKm5qZ000dHq3J8yL';
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

function SecurePaymentForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || processing}
          className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Payment'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function Stripe3DSecureModal({ open, onOpenChange, clientSecret, onSuccess }) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#F7B602',
        colorBackground: '#ffffff',
        colorText: '#071739'
      }
    }
  };

  if (!stripePromise) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration Error</DialogTitle>
            <DialogDescription>
              Stripe is not configured. Please contact support.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure Payment Verification</DialogTitle>
          <DialogDescription>
            Complete the payment verification to proceed
          </DialogDescription>
        </DialogHeader>

        {clientSecret && (
          <Elements stripe={stripePromise} options={options}>
            <SecurePaymentForm 
              onSuccess={onSuccess} 
              onCancel={() => onOpenChange(false)} 
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}