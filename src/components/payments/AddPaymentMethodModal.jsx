import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import StripeAddCardModal from './StripeAddCardModal';

export default function AddPaymentMethodModal({ open, onOpenChange, userId }) {
  const [clientSecret, setClientSecret] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setupIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('stripeSetupIntent', {});
      return response.data;
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.status === 404 
          ? "We couldn't process your request. Please refresh and try again."
          : error.response?.status === 401
          ? "Your session expired. Please sign in again."
          : "Something went wrong. Please try again.",
        variant: 'destructive'
      });
    }
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries(['paymentMethods']);
    queryClient.invalidateQueries(['transactions']);
    toast({
      title: 'Success',
      description: 'Payment method added successfully'
    });
    setClientSecret(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setClientSecret(null);
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (open && !clientSecret) {
      setupIntentMutation.mutate();
    }
  }, [open]);

  if (clientSecret) {
    return (
      <StripeAddCardModal
        open={open}
        onOpenChange={onOpenChange}
        clientSecret={clientSecret}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        {setupIntentMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#F7B602] mb-4" />
            <p className="text-sm text-slate-600">Preparing payment form...</p>
          </div>
        ) : setupIntentMutation.isError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
            <p className="text-sm text-slate-600 mb-4">Failed to load payment form</p>
            <Button onClick={() => setupIntentMutation.mutate()}>
              Try Again
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}