import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, TrendingUp, TrendingDown, Wallet, Calendar, Clock, AlertCircle, DollarSign, FileText, PoundSterling } from 'lucide-react';
import moment from 'moment';

export default function LearnerPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState('50');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: ledgerEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['myPaymentLedger', pupil?.id],
    queryFn: () => base44.entities.PaymentLedger.filter({ userId: pupil.id }, '-created_date', 100),
    enabled: !!pupil?.id
  });

  const { data: upcomingBookings = [] } = useQuery({
    queryKey: ['myUpcomingBookings', pupil?.id],
    queryFn: async () => {
      if (!pupil?.id) return [];
      const bookings = await base44.entities.LessonBooking.filter({
        pupilId: pupil.id,
        status: 'confirmed'
      });
      return bookings.filter(b => moment(b.startAtUtc).isAfter(moment()));
    },
    enabled: !!pupil?.id
  });

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
        toast({
          title: 'Payment Error',
          description: 'Unable to create checkout session',
          variant: 'destructive'
        });
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

  // Handle payment success redirect
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      toast({
        title: '✓ Payment Successful',
        description: 'Your balance has been updated.',
        duration: 5000,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['myPupilProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myPaymentLedger'] });
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, queryClient]);

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 10) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount (minimum £10)',
        variant: 'destructive'
      });
      return;
    }
    createPaymentMutation.mutate(amount);
  };

  if (pupilLoading || ledgerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading payment information...</div>
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">No pupil profile found</div>
      </div>
    );
  }

  const balance = pupil.bulkPaymentBalance || 0;
  const hourlyRate = pupil.hourlyRate || 50;
  const availableHours = balance / hourlyRate;

  // Calculate upcoming costs
  const upcomingCost = upcomingBookings.reduce((sum, b) => sum + (b.totalPriceGbp || 0), 0);
  const effectiveBalance = balance - upcomingCost;

  const quickTopUpAmounts = [25, 50, 100, 200];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#071739]">Payments</h1>
          <p className="text-slate-600 mt-2">Manage your lesson credits and payment history</p>
        </div>

        {/* Payment Methods & Invoices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={createPageUrl('PaymentMethods')}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-[#F7B602]" />
                  <h3 className="text-lg font-semibold text-[#071739]">Payment Methods</h3>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('LearnerInvoices')}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#F7B602]" />
                  <h3 className="text-lg font-semibold text-[#071739]">Invoices</h3>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Top Up Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Top Up Balance
            </CardTitle>
            <CardDescription>
              Add credits to your account to book lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickTopUpAmounts.map(amount => (
                <Button
                  key={amount}
                  variant={topUpAmount === String(amount) ? 'default' : 'outline'}
                  onClick={() => setTopUpAmount(String(amount))}
                  className={topUpAmount === String(amount) ? 'bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]' : ''}
                >
                  £{amount}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min="10"
                  step="5"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="text-lg"
                />
                <div className="text-xs text-slate-500 mt-1">
                  ≈ {(parseFloat(topUpAmount || 0) / hourlyRate).toFixed(1)} hours @ £{hourlyRate}/hr
                </div>
              </div>
              <Button
                onClick={handleTopUp}
                disabled={createPaymentMutation.isPending}
                className="bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] px-8"
                size="lg"
              >
                {createPaymentMutation.isPending ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>

            <div className="text-xs text-slate-500">
              Secure payment powered by Stripe. Minimum top-up: £10
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Your recent transactions and balance changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ledgerEntries.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-2">
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        entry.type === 'charge' ? 'bg-rose-100' : 'bg-green-100'
                      }`}>
                        {entry.type === 'charge' ? (
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {entry.reason === 'lesson_confirmed_charge' && 'Lesson Charge'}
                          {entry.reason === 'late_cancellation_penalty' && 'Late Cancellation Penalty'}
                          {entry.reason === 'manual_adjustment' && 'Balance Adjustment'}
                          {entry.reason === 'refund_issued' && 'Refund'}
                          {entry.reason === 'balance_top_up' && 'Balance Top Up'}
                          {!['lesson_confirmed_charge', 'late_cancellation_penalty', 'manual_adjustment', 'refund_issued', 'balance_top_up'].includes(entry.reason) && entry.reason}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {moment(entry.created_date).format('DD MMM YYYY, HH:mm')}
                        </div>
                        {entry.note && (
                          <div className="text-xs text-slate-500 mt-1">{entry.note}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        entry.type === 'charge' ? 'text-rose-600' : 'text-green-600'
                      }`}>
                        {entry.type === 'charge' ? '-' : '+'}£{Math.abs(entry.amountGbp || 0).toFixed(2)}
                      </div>
                      {entry.hours && (
                        <div className="text-xs text-slate-500">{entry.hours}h</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}