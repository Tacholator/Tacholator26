import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function MakePaymentSection({ pupil, instructor }) {
  const { toast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState('50');
  const [activeTab, setActiveTab] = useState('card');
  const [copied, setCopied] = useState('');

  const quickAmounts = [25, 50, 100, 200];

  const createPaymentMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await base44.functions.invoke('createStripeCheckout', {
        pupilId: pupil.id,
        amount: parseFloat(amount),
        successUrl: `${window.location.origin}${window.location.pathname}?payment=success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}`
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: 'Payment Error', description: 'Unable to create checkout session', variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({
        title: 'Payment Failed',
        description: error?.response?.data?.error || error.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  });

  const handleCardPay = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 1) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    createPaymentMutation.mutate(amount);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const canPayByCard = instructor?.stripeAccountStatus === 'active';
  const canPayByBankTransfer = instructor?.bankTransferEnabled &&
    instructor?.bankSortCode && instructor?.bankAccountNumber;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#071739]">Make Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab buttons */}
        <div className="flex gap-2 border-b border-slate-200 pb-0">
          {canPayByCard && (
            <button
              onClick={() => setActiveTab('card')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'card'
                  ? 'border-[#F7B602] text-[#071739]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Card Payment
            </button>
          )}
          {canPayByBankTransfer && (
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bank'
                  ? 'border-[#F7B602] text-[#071739]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Bank Transfer
            </button>
          )}
        </div>

        {/* Card Payment Tab */}
        {activeTab === 'card' && canPayByCard && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map(amount => (
                <Button
                  key={amount}
                  variant={topUpAmount === String(amount) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTopUpAmount(String(amount))}
                  className={topUpAmount === String(amount) ? 'bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]' : ''}
                >
                  £{amount}
                </Button>
              ))}
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1 max-w-xs">
                <Label className="text-sm">Custom amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <Button
                onClick={handleCardPay}
                disabled={createPaymentMutation.isPending}
                className="bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {createPaymentMutation.isPending ? 'Redirecting...' : 'Pay Now'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">Secure payment powered by Stripe</p>
          </div>
        )}

        {/* Bank Transfer Tab */}
        {activeTab === 'bank' && canPayByBankTransfer && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-slate-600">Transfer directly to your instructor's bank account using the details below:</p>
            <div className="bg-slate-50 rounded-lg border divide-y divide-slate-200">
              {instructor.bankName && (
                <BankRow label="Bank" value={instructor.bankName} onCopy={() => copyToClipboard(instructor.bankName, 'bank')} copied={copied === 'bank'} />
              )}
              {instructor.bankAccountName && (
                <BankRow label="Account Name" value={instructor.bankAccountName} onCopy={() => copyToClipboard(instructor.bankAccountName, 'name')} copied={copied === 'name'} />
              )}
              <BankRow label="Sort Code" value={instructor.bankSortCode} onCopy={() => copyToClipboard(instructor.bankSortCode, 'sort')} copied={copied === 'sort'} />
              <BankRow label="Account Number" value={instructor.bankAccountNumber} onCopy={() => copyToClipboard(instructor.bankAccountNumber, 'acc')} copied={copied === 'acc'} />
              {instructor.bankPaymentReference && (
                <BankRow label="Reference" value={instructor.bankPaymentReference} onCopy={() => copyToClipboard(instructor.bankPaymentReference, 'ref')} copied={copied === 'ref'} highlight />
              )}
            </div>
            {instructor.bankTransferNote && (
              <div className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium text-amber-800 mb-1">Note from your instructor:</p>
                <p>{instructor.bankTransferNote}</p>
              </div>
            )}
          </div>
        )}

        {/* No payment methods available */}
        {!canPayByCard && !canPayByBankTransfer && (
          <div className="text-center py-6 text-slate-400 text-sm">
            Your instructor hasn't set up payment methods yet. Please contact them directly.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BankRow({ label, value, onCopy, copied, highlight }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${highlight ? 'bg-amber-50' : ''}`}>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`font-semibold text-sm ${highlight ? 'text-amber-800' : 'text-slate-800'}`}>{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="text-slate-400 hover:text-slate-700 transition-colors p-1"
        title="Copy"
      >
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}