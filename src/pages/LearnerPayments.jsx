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
import MakePaymentSection from '@/components/payments/MakePaymentSection';
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

  const { data: instructor } = useQuery({
    queryKey: ['learnerInstructor', pupil?.instructorId],
    queryFn: async () => {
      if (!pupil?.instructorId) return null;
      const all = await base44.entities.Instructor.list();
      // instructorId on pupil is the instructor's user ID (created_by_id), not the Instructor entity ID
      return all.find(i => i.id === pupil.instructorId || i.created_by_id === pupil.instructorId) || null;
    },
    enabled: !!pupil?.instructorId
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
  const hourlyRate = pupil.hourlyRate || 0;
  const hoursAvailable = hourlyRate > 0 ? (balance / hourlyRate).toFixed(1) : 0;
  const isNegative = balance < 0;

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
                  <h3 className="text-lg font-semibold text-[#071739]">Manage Cards</h3>
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

        {/* Balance Card */}
        {(() => {
          let bgGradient = 'from-slate-400 to-slate-500';
          if (balance > 0) bgGradient = 'from-emerald-500 to-emerald-600';
          else if (isNegative) bgGradient = 'from-rose-500 to-rose-600';

          return (
            <Card className={`border-0 shadow-sm bg-gradient-to-br ${bgGradient} text-white`}>
              <CardHeader>
                <CardTitle className="text-lg text-white/90">My Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">£{Math.abs(balance).toFixed(2)}</p>
                      <p className="text-white/80 text-sm">{isNegative ? 'Amount owed' : 'Credit balance'}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/80">Hours available</span>
                      <span className="text-lg font-semibold">{hoursAvailable}h</span>
                    </div>
                    {hourlyRate > 0 && (
                      <p className="text-xs text-white/70">Based on £{hourlyRate.toFixed(2)}/hour</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Make Payment */}
        <MakePaymentSection pupil={pupil} instructor={instructor} />

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