import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, TrendingUp, TrendingDown, Wallet, Calendar, Clock, AlertCircle } from 'lucide-react';
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
        successUrl: window.location.href,
        cancelUrl: window.location.href
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

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

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{balance.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mt-1">
                ≈ {availableHours.toFixed(1)} hours @ £{hourlyRate}/hr
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{upcomingBookings.length}</div>
              <div className="text-sm text-slate-500 mt-1">
                Total cost: £{upcomingCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                After Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${effectiveBalance < 0 ? 'text-rose-600' : 'text-[#071739]'}`}>
                £{effectiveBalance.toFixed(2)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Remaining after scheduled
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Balance Warning */}
        {effectiveBalance < hourlyRate && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900">Low Balance Warning</div>
                <div className="text-sm text-amber-800 mt-1">
                  Your balance after scheduled lessons may not be sufficient for booking additional lessons. 
                  Consider topping up to avoid booking issues.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                          {!['lesson_confirmed_charge', 'late_cancellation_penalty', 'manual_adjustment'].includes(entry.reason) && entry.reason}
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