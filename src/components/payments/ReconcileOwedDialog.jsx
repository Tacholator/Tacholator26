import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { HandCoins, Loader2 } from 'lucide-react';

export default function ReconcileOwedDialog({ open, onOpenChange, pupil }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');

  const currentBalance = pupil?.bulkPaymentBalance || 0;
  const owed = currentBalance < 0 ? Math.abs(currentBalance) : 0;

  useEffect(() => {
    if (open) {
      setAmount(owed > 0 ? owed.toFixed(2) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pupil?.id]);

  const parsedAmount = parseFloat(amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const newBalance = amountValid ? currentBalance + parsedAmount : currentBalance;

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      // Credit the reconciliation amount against the owed balance
      await base44.entities.Pupil.update(pupil.id, {
        bulkPaymentBalance: newBalance,
        bulkAmountPaid: (pupil.bulkAmountPaid || 0) + parsedAmount,
      });

      // Log the reconciliation as a manual adjustment in the ledger
      await base44.entities.PaymentLedger.create({
        userId: pupil.linkedUserId || pupil.id,
        type: 'adjustment',
        reason: 'manual_adjustment',
        amountGbp: parsedAmount,
        createdByRole: 'instructor',
        note: `Reconciliation: £${parsedAmount.toFixed(2)} owed settled by instructor`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pupil', pupil.id]);
      queryClient.invalidateQueries(['instructorPupils']);
      queryClient.invalidateQueries(['allPaymentLedger']);
      queryClient.invalidateQueries(['pupilLedger', pupil.id]);
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[#F7B602]" />
            Reconcile Amount Owed
          </DialogTitle>
          <DialogDescription>
            {pupil?.firstName} {pupil?.lastName} · Owed £{owed.toFixed(2)} · Balance £{currentBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Amount owed (£)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">£</span>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount to reconcile"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          </div>

          {amountValid && (
            <div className="rounded-lg p-3 border bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">New balance</span>
                <span className={`font-bold ${
                  newBalance > 0 ? 'text-emerald-700' : newBalance < 0 ? 'text-rose-700' : 'text-slate-600'
                }`}>
                  £{newBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reconcileMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => reconcileMutation.mutate()}
            disabled={!amountValid || reconcileMutation.isPending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {reconcileMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <HandCoins className="w-4 h-4 mr-1" />
            )}
            {reconcileMutation.isPending ? 'Reconciling...' : 'Reconcile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}