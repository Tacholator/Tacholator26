import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Building2, Copy, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

export default function MakePaymentSection({ pupil, instructor }) {
  const { toast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState('50');
  const [copied, setCopied] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const quickAmounts = [25, 50, 100, 200];

  const canPayByCard = instructor?.stripeAccountStatus === 'active';
  const canPayByBankTransfer = instructor?.bankTransferEnabled &&
    instructor?.bankSortCode && instructor?.bankAccountNumber;

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

  if (!canPayByCard && !canPayByBankTransfer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#071739]">Make Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-slate-400 text-sm">
            Your instructor hasn't set up payment methods yet. Please contact them directly.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#071739]">Make Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Card Payment Option */}
        {canPayByCard && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowCardForm(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#071739] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#F7B602]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">Pay by Card</p>
                  <p className="text-xs text-slate-500">Secure payment via Stripe</p>
                </div>
              </div>
              {showCardForm ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showCardForm && (
              <div className="px-4 py-4 space-y-4 border-t">
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
                    <Label className="text-sm">Amount</Label>
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
                    {createPaymentMutation.isPending ? 'Redirecting...' : 'Make Payment'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bank Transfer Option */}
        {canPayByBankTransfer && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowBankDetails(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#071739] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#F7B602]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">Pay by Bank Transfer</p>
                  <p className="text-xs text-slate-500">View instructor's bank details</p>
                </div>
              </div>
              {showBankDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showBankDetails && (
              <div className="border-t">
                <p className="px-4 pt-3 pb-1 text-sm text-slate-600">Transfer directly to your instructor's bank account:</p>
                <div className="divide-y divide-slate-100">
                  {instructor.bankName && (
                    <BankRow label="Bank" value={instructor.bankName} onCopy={() => copyToClipboard(instructor.bankName, 'bank')} copied={copied === 'bank'} />
                  )}
                  {instructor.bankAccountName && (
                    <BankRow label="Account Name" value={instructor.bankAccountName} onCopy={() => copyToClipboard(instructor.bankAccountName, 'name')} copied={copied === 'name'} />
                  )}
                  <BankRow label="Sort Code" value={instructor.bankSortCode} onCopy={() => copyToClipboard(instructor.bankSortCode, 'sort')} copied={copied === 'sort'} />
                  <BankRow label="Account Number" value={instructor.bankAccountNumber} onCopy={() => copyToClipboard(instructor.bankAccountNumber, 'acc')} copied={copied === 'acc'} />
                  {instructor.bankPaymentReference && (
                    <BankRow label="Reference to Use" value={instructor.bankPaymentReference} onCopy={() => copyToClipboard(instructor.bankPaymentReference, 'ref')} copied={copied === 'ref'} highlight />
                  )}
                </div>
                {instructor.bankTransferNote && (
                  <div className="mx-4 mb-4 mt-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="font-medium text-amber-800 mb-1">Note from your instructor:</p>
                    <p>{instructor.bankTransferNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}