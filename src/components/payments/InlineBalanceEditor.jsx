import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';

export default function InlineBalanceEditor({ pupil }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const balance = pupil.bulkPaymentBalance || 0;
  const balanceColor = balance > 0 ? 'text-emerald-700' : balance < 0 ? 'text-rose-700' : 'text-slate-500';

  const saveMutation = useMutation({
    mutationFn: async (newBalance) => {
      const delta = Number((newBalance - balance).toFixed(2));
      await base44.entities.Pupil.update(pupil.id, { bulkPaymentBalance: newBalance });
      if (delta !== 0) {
        await base44.entities.PaymentLedger.create({
          userId: pupil.linkedUserId || pupil.id,
          type: delta > 0 ? 'credit' : 'adjustment',
          reason: 'manual_adjustment',
          amountGbp: delta,
          createdByRole: 'instructor',
          note: `Balance edited to £${newBalance.toFixed(2)} (${delta > 0 ? '+' : '-'}£${Math.abs(delta).toFixed(2)})`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorPupils']);
      queryClient.invalidateQueries(['allPaymentLedger']);
      queryClient.invalidateQueries(['pupil', pupil.id]);
      queryClient.invalidateQueries(['pupilLedger', pupil.id]);
      setEditing(false);
    }
  });

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const startEditing = (e) => {
    stop(e);
    setValue(balance.toFixed(2));
    setEditing(true);
  };

  const commit = (e) => {
    stop(e);
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    saveMutation.mutate(Number(parsed.toFixed(2)));
  };

  if (editing) {
    return (
      <div className="text-center py-3 border-t border-b">
        <div className="text-xs text-slate-600 mb-1">Balance</div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-slate-500 font-medium">£</span>
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onClick={stop}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(e);
              if (e.key === 'Escape') {
                stop(e);
                setEditing(false);
              }
            }}
            className="h-9 w-28 text-center text-lg font-bold"
            autoFocus
          />
          <button
            type="button"
            onClick={commit}
            disabled={saveMutation.isPending}
            className="p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            title="Save balance"
            aria-label="Save balance"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setEditing(false);
            }}
            disabled={saveMutation.isPending}
            className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50"
            title="Cancel"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-3 border-t border-b">
      <div className="text-xs text-slate-600 mb-1">Balance</div>
      <button
        type="button"
        onClick={startEditing}
        className="group inline-flex items-center justify-center gap-1.5 max-w-full"
        title="Edit balance"
        aria-label={`Edit balance for ${pupil.firstName} ${pupil.lastName}`}
      >
        <span className={`text-4xl font-bold ${balanceColor}`}>£{balance.toFixed(2)}</span>
        <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#071739] shrink-0" />
      </button>
    </div>
  );
}