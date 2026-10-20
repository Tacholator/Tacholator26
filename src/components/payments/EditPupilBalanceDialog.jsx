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
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setHours('');
      setNote('');
    }
  }, [open, pupil?.id]);

  const currentBalance = pupil?.bulkPaymentBalance || 0;
  const currentHours = pupil?.hoursCompleted || 0;
  const rate = pupil?.hourlyRate || 0;

  const parsedAmount = parseFloat(amount);
  const amountValid = amount !== '' && !isNaN(parsedAmount) && parsedAmount !== 0;

  const parsedHours = parseFloat(hours);
  const hoursValid = hours !== '' && !isNaN(parsedHours) && parsedHours !== 0;

  const newBalance = amountValid ? currentBalance + parsedAmount : currentBalance;
  const newHours = hoursValid ? currentHours + parsedHours : currentHours;

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const updates = {};
      if (amountValid) {
        updates.bulkPaymentBalance = newBalance;
        if (parsedAmount > 0) {
          updates.bulkAmountPaid = (pupil.bulkAmountPaid || 0) + parsedAmount;
        }
      }
      if (hoursValid) {
        updates.hoursCompleted = newHours;
      }
      await base44.entities.Pupil.update(pupil.id, updates);

      if (amountValid) {
        await base44.entities.PaymentLedger.create({
          userId: pupil.linkedUserId || pupil.id,
          type: parsedAmount > 0 ? 'credit' : 'adjustment',
          reason: 'manual_adjustment',
          amountGbp: parsedAmount,
          hours: hoursValid ? parsedHours : undefined,
          createdByRole: 'instructor',
          note: note.trim() || `Manual balance adjustment: ${parsedAmount > 0 ? '+' : '-'}£${Math.abs(parsedAmount).toFixed(2)}`
        });
      }
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
            {pupil?.firstName} {pupil?.lastName} · Balance £{currentBalance.toFixed(2)} · {currentHours}h completed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Amount due (£)</Label>
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
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Hours completed</Label>
            <Input
              type="number"
              step="0.25"
              placeholder="e.g. 1.5 to add, -1.5 to deduct"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              {hoursValid && rate > 0
                ? `${Math.abs(parsedHours)}h at £${rate}/hr = £${(Math.abs(parsedHours) * rate).toFixed(2)}`
                : 'Use a minus sign for a negative amount'}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Note (optional)</Label>
            <Input
              placeholder="Reason for the adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {(amountValid || hoursValid) && (
            <div className="rounded-lg p-3 border bg-slate-50 space-y-1">
              {amountValid && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">New balance</span>
                  <span className={`font-bold ${
                    newBalance > 0 ? 'text-emerald-700' : newBalance < 0 ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    £{newBalance.toFixed(2)}
                  </span>
                </div>
              )}
              {hoursValid && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">New hours completed</span>
                  <span className="font-bold text-[#071739]">{newHours}h</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adjustMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => adjustMutation.mutate()}
            disabled={(!amountValid && !hoursValid) || adjustMutation.isPending}
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