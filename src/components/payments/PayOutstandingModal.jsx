import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Stripe3DSecureModal from './Stripe3DSecureModal';

export default function PayOutstandingModal({ open, onOpenChange, amount, paymentMethods, userId }) {
  const [selectedMethodId, setSelectedMethodId] = useState(paymentMethods.find(m => m.isDefault)?.id || '');
  const [clientSecret, setClientSecret] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMethodId) {
        throw new Error('Please select a payment method');
      }
      
      const response = await base44.functions.invoke('stripePaymentIntentLesson', {
        amount: amount,
        paymentMethodId: selectedMethodId,
        lessonId: 'outstanding_balance'
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.requiresAction && data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.status === 'succeeded') {
        queryClient.invalidateQueries(['transactions']);
        queryClient.invalidateQueries(['pupil']);
        toast({
          title: 'Success',
          description: 'Payment processed successfully'
        });
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast({
        title: 'Payment failed',
        description: error.response?.status === 404 
          ? "We couldn't process your payment. Please try again."
          : error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : error.response?.status === 402
          ? "Payment was declined. Please try a different card."
          : "Something went wrong. Please try again.",
        variant: 'destructive'
      });
    }
  });

  const handle3DSecureSuccess = () => {
    queryClient.invalidateQueries(['transactions']);
    queryClient.invalidateQueries(['pupil']);
    toast({
      title: 'Success',
      description: 'Payment processed successfully'
    });
    setClientSecret(null);
    onOpenChange(false);
  };

  if (clientSecret) {
    return (
      <Stripe3DSecureModal
        open={open}
        onOpenChange={onOpenChange}
        clientSecret={clientSecret}
        onSuccess={handle3DSecureSuccess}
        onCancel={() => {
          setClientSecret(null);
          onOpenChange(false);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Outstanding Balance</DialogTitle>
          <DialogDescription>
            Complete payment for your outstanding balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Amount to pay</p>
            <p className="text-2xl font-bold text-slate-800">£{amount.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Payment method
            </label>
            <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {method.brand} •••• {method.last4}
                      {method.isDefault && ' (Default)'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={paymentMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending || !selectedMethodId}
              className="flex-1 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              {paymentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay £${amount.toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}