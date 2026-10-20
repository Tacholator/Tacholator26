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
import { Save } from 'lucide-react';

export default function EditPupilBalanceDialog({ open, onOpenChange, pupil }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setNote('');
    }
  }, [open, pupil?.id]);

  const currentBalance = pupil?.bulkPaymentBalance || 0;
  const parsed = parseFloat(amount);
  const isValid = amount !== '' && !isNaN(parsed) && parsed !== 0;
  const newBalance = isValid ? currentBalance + parsed : currentBalance;

  const adjustMutation = useMutation({
    mutationFn: async ({ value, noteText }) => {
      await base44.entities.Pupil.update(pupil.id, {
        bulkPaymentBalance: currentBalance + value,
        ...(value > 0 ? { bulkAmountPaid: (pupil.bulkAmountPaid || 0) + value } : {})
      });
      await base44.entities.PaymentLedger.create({
        userId: pupil.linkedUserId || pupil.id,
        type: value > 0 ? 'credit' : 'adjustment',
        reason: 'manual_adjustment',
        amountGbp: value,
        createdByRole: 'instructor',
        note: noteText || `Manual balance adjustment: ${value > 0 ? '+' : '-'}£${Math.abs(value).toFixed(2)}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorPupils']);
      queryClient.invalidateQueries(['allPaymentLedger']);
      queryClient.invalidateQueries(['pupil', pupil.id]);
      queryClient.invalidateQueries(['pupilLedger', pupil.id]);
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Balance</DialogTitle>
          <DialogDescription>
            {pupil?.firstName} {pupil?.lastName} · Current balance £{currentBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">£</span>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 40 to add, -60 to deduct"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Use a minus sign for a negative amount</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Note (optional)</Label>
            <Input
              placeholder="Reason for the adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {isValid && (
            <div className={`rounded-lg p-3 border flex items-center justify-between ${
              newBalance > 0
                ? 'bg-emerald-50 border-emerald-200'
                : newBalance < 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-sm text-slate-600">New balance</span>
              <span className={`font-bold ${
                newBalance > 0 ? 'text-emerald-700' : newBalance < 0 ? 'text-rose-700' : 'text-slate-600'
              }`}>
                £{newBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adjustMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => adjustMutation.mutate({ value: parsed, noteText: note.trim() })}
            disabled={!isValid || adjustMutation.isPending}
            className="bg-[#071739] hover:bg-[#071739]/90 text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            {adjustMutation.isPending ? 'Saving...' : 'Save Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}