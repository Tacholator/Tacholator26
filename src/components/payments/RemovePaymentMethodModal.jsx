import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function RemovePaymentMethodModal({ open, onOpenChange, method, hasOutstanding }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PaymentMethod.delete(method.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paymentMethods']);
      toast({
        title: 'Success',
        description: 'Payment method removed'
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.status === 404 
          ? "Payment method not found. It may have been removed already."
          : error.response?.status === 409
          ? "This payment method cannot be removed. It may be in use."
          : "Failed to remove payment method. Please try again.",
        variant: 'destructive'
      });
    }
  });

  if (!method) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasOutstanding ? (
              <span className="text-red-600 font-medium">
                Warning: You cannot remove this payment method while you have an outstanding balance. Please pay your balance first or add another payment method.
              </span>
            ) : (
              `Remove ${method.brand} •••• ${method.last4}? This action cannot be undone.`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending || hasOutstanding}
            className="bg-red-600 hover:bg-red-700"
          >
            {removeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}