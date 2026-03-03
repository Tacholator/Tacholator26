import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PoundSterling,
  Save,
  Plus,
} from 'lucide-react';
import moment from 'moment';

export default function InstructorPupilPayments() {
  const urlParams = new URLSearchParams(window.location.search);
  const pupilId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [hourlyRateInput, setHourlyRateInput] = useState('');
  const [addAmountInput, setAddAmountInput] = useState('');
  const [addAmountNote, setAddAmountNote] = useState('');

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['pupil', pupilId],
    queryFn: async () => {
      const pupils = await base44.entities.Pupil.filter({ id: pupilId });
      return pupils[0];
    },
    enabled: !!pupilId
  });

  const { data: ledgerEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['pupilLedger', pupilId],
    queryFn: async () => {
      const entries = await base44.entities.PaymentLedger.list('-created_date', 200);
      return entries.filter(e => e.userId === pupil?.linkedUserId || e.userId === pupilId);
    },
    enabled: !!pupil
  });

  const updateHourlyRateMutation = useMutation({
    mutationFn: (rate) => base44.entities.Pupil.update(pupilId, { hourlyRate: rate }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pupil', pupilId]);
      setHourlyRateInput('');
    }
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ amount, note }) => {
      const newBalance = (pupil.bulkPaymentBalance || 0) + amount;
      await base44.entities.Pupil.update(pupilId, {
        bulkPaymentBalance: newBalance,
        bulkAmountPaid: (pupil.bulkAmountPaid || 0) + amount
      });
      await base44.entities.PaymentLedger.create({
        userId: pupil.linkedUserId || pupilId,
        type: 'credit',
        reason: 'bulk_payment_credit',
        amountGbp: amount,
        createdByRole: 'instructor',
        note: note || `Manual top-up: £${amount.toFixed(2)}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pupil', pupilId]);
      queryClient.invalidateQueries(['pupilLedger', pupilId]);
      setAddAmountInput('');
      setAddAmountNote('');
    }
  });

  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ['pupilConfirmedBookings', pupilId],
    queryFn: async () => {
      const bookings = await base44.entities.LessonBooking.filter({ pupilId, status: 'confirmed' });
      return bookings.sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));
    },
    enabled: !!pupilId
  });

  if (pupilLoading || ledgerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Pupil not found</div>
      </div>
    );
  }

  const now = moment();
  const upcomingBookings = confirmedBookings.filter(b => moment(b.startAtUtc).isAfter(now));
  const totalEscrow = upcomingBookings.reduce((sum, b) => sum + (b.escrowAmountGbp || 0), 0);
  const availableBalance = pupil.bulkPaymentBalance || 0;
  const totalBalance = availableBalance + totalEscrow;

  const totalPaid = ledgerEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + (e.amountGbp || 0), 0);
  const totalCharged = ledgerEntries.filter(e => e.type === 'charge').reduce((sum, e) => sum + (e.amountGbp || 0), 0);

  const reasonLabel = (reason) => {
    const map = {
      lesson_confirmed_charge: 'Lesson Charge',
      late_cancellation_penalty: 'Late Cancellation',
      manual_adjustment: 'Manual Adjustment',
      bulk_payment_credit: 'Payment Received',
      no_show_penalty: 'No-Show Penalty',
      refund: 'Refund',
    };
    return map[reason] || reason || 'Transaction';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back */}
        <Link to={createPageUrl('InstructorPayments')}>
          <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Payment Management
          </Button>
        </Link>

        {/* Pupil Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white ${
                availableBalance > 0 ? 'bg-emerald-600' : availableBalance < 0 ? 'bg-rose-600' : 'bg-slate-400'
              }`}>
                {pupil.firstName?.[0]}{pupil.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#071739]">{pupil.firstName} {pupil.lastName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={{
                    'Active': 'bg-emerald-100 text-emerald-700',
                    'OnHold': 'bg-amber-100 text-amber-700',
                    'Passed': 'bg-blue-100 text-blue-700',
                    'Stopped': 'bg-purple-100 text-purple-700'
                  }[pupil.status || 'Active']}>
                    {pupil.status === 'OnHold' ? 'On Hold' : pupil.status || 'Active'}
                  </Badge>
                  {pupil.hourlyRate > 0 && (
                    <span className="text-sm text-slate-500">@ £{pupil.hourlyRate}/hr</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className={`${availableBalance > 0 ? 'border-emerald-300 bg-emerald-50' : availableBalance < 0 ? 'border-rose-300 bg-rose-50' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500 font-medium">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${availableBalance > 0 ? 'text-emerald-700' : availableBalance < 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                £{availableBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500 font-medium">Held in Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">£{totalEscrow.toFixed(2)}</div>
              {upcomingBookings.length > 0 && (
                <div className="text-xs text-amber-600">{upcomingBookings.length} lesson{upcomingBookings.length !== 1 ? 's' : ''}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Hours */}
        {((pupil.auditNoShowHours || 0) > 0 || (pupil.auditLateCancellationHours || 0) > 0) && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Audit Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {(pupil.auditNoShowHours || 0) > 0 && (
                  <div>
                    <div className="text-xs text-amber-600">No-Show</div>
                    <div className="text-xl font-bold text-amber-900">{pupil.auditNoShowHours.toFixed(1)}h</div>
                  </div>
                )}
                {(pupil.auditLateCancellationHours || 0) > 0 && (
                  <div>
                    <div className="text-xs text-amber-600">Late Cancellation</div>
                    <div className="text-xl font-bold text-amber-900">{pupil.auditLateCancellationHours.toFixed(1)}h</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Booked Lessons */}
        {upcomingBookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-[#F7B602]" />
                Upcoming Booked Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingBookings.map(booking => {
                  const start = moment(booking.startAtUtc).local();
                  const cost = booking.escrowAmountGbp || (booking.durationHours * (pupil.hourlyRate || 0));
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="font-medium text-sm text-slate-800">{start.format('ddd, D MMM YYYY')}</div>
                          <div className="text-xs text-slate-500">{start.format('HH:mm')} · {booking.durationHours}h</div>
                        </div>
                      </div>
                      {cost > 0 && (
                        <div className="text-sm font-semibold text-amber-700">£{cost.toFixed(2)} held</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manage Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PoundSterling className="w-4 h-4 text-[#F7B602]" />
              Manage Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hourly Rate */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Hourly Rate</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">£</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.50"
                    placeholder={pupil.hourlyRate > 0 ? pupil.hourlyRate.toString() : '0.00'}
                    value={hourlyRateInput}
                    onChange={(e) => setHourlyRateInput(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <span className="text-sm text-slate-400">per hour</span>
                <Button
                  size="sm"
                  onClick={() => updateHourlyRateMutation.mutate(parseFloat(hourlyRateInput))}
                  disabled={!hourlyRateInput || isNaN(parseFloat(hourlyRateInput)) || updateHourlyRateMutation.isPending}
                  className="bg-[#071739] hover:bg-[#071739]/90 text-white"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
              {pupil.hourlyRate > 0 && (
                <p className="text-xs text-slate-400 mt-1">Current rate: £{pupil.hourlyRate}/hr</p>
              )}
            </div>

            {/* Add Money */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Add Money to Balance</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">£</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addAmountInput}
                    onChange={(e) => setAddAmountInput(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <Input
                  placeholder="Note (optional)"
                  value={addAmountNote}
                  onChange={(e) => setAddAmountNote(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => addBalanceMutation.mutate({ amount: parseFloat(addAmountInput), note: addAmountNote })}
                  disabled={!addAmountInput || isNaN(parseFloat(addAmountInput)) || parseFloat(addAmountInput) <= 0 || addBalanceMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-4 h-4 text-[#F7B602]" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ledgerEntries.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No transactions yet</div>
            ) : (
              <div className="space-y-2">
                {ledgerEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${entry.type === 'charge' ? 'bg-green-100' : entry.type === 'credit' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        {entry.type === 'charge' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800">{reasonLabel(entry.reason)}</div>
                        {entry.note && <div className="text-xs text-slate-500">{entry.note}</div>}
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {moment(entry.created_date).format('DD MMM YYYY, HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${entry.type === 'charge' ? 'text-green-600' : entry.type === 'credit' ? 'text-blue-600' : 'text-slate-600'}`}>
                        {entry.type === 'credit' ? '+' : '-'}£{Math.abs(entry.amountGbp || 0).toFixed(2)}
                      </div>
                      {entry.hours && <div className="text-xs text-slate-400">{entry.hours}h</div>}
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