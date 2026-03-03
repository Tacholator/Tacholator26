import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Clock,
  Search,
  DollarSign,
  Wallet,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import moment from 'moment';

export default function InstructorPayments({ adminProxyInstructorId = null }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Determine which instructor ID to use (admin proxy or current user)
  const effectiveInstructorId = adminProxyInstructorId || user?.id;

  const { data: instructor } = useQuery({
    queryKey: ['instructorProfile', effectiveInstructorId, adminProxyInstructorId],
    queryFn: async () => {
      if (!effectiveInstructorId) return null;
      
      // If admin proxy, fetch by ID directly
      if (adminProxyInstructorId) {
        const instructors = await base44.asServiceRole.entities.Instructor.filter({ created_by: adminProxyInstructorId });
        return instructors.length > 0 ? instructors[0] : null;
      }
      
      // Otherwise, fetch current user's instructor profile
      const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      
      if (instructors.length > 0) {
        return instructors[0];
      }
      
      // Auto-create instructor profile for admin users
      if (user.role === 'admin') {
        const newInstructor = await base44.entities.Instructor.create({
          name: user.full_name || user.email,
          phone: '',
          stripeAccountStatus: 'not_connected'
        });
        return newInstructor;
      }
      
      return null;
    },
    enabled: !!effectiveInstructorId
  });

  const { data: pupils = [], isLoading: pupilsLoading } = useQuery({
    queryKey: ['instructorPupils', effectiveInstructorId, adminProxyInstructorId],
    queryFn: () => {
      if (adminProxyInstructorId) {
        return base44.asServiceRole.entities.Pupil.filter({ instructorId: adminProxyInstructorId });
      }
      return base44.entities.Pupil.filter({ instructorId: effectiveInstructorId });
    },
    enabled: !!effectiveInstructorId
  });

  const { data: allLedgerEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['allPaymentLedger', instructor?.id, adminProxyInstructorId],
    queryFn: async () => {
      if (!instructor?.id) return [];
      const pupilIds = pupils.map(p => p.id);
      if (pupilIds.length === 0) return [];
      
      // Fetch ledger entries for all pupils
      const fetchFn = adminProxyInstructorId 
        ? base44.asServiceRole.entities.PaymentLedger.list 
        : base44.entities.PaymentLedger.list;
      const entries = await fetchFn('-created_date', 500);
      return entries.filter(e => pupilIds.includes(e.userId));
    },
    enabled: !!instructor?.id && pupils.length > 0
  });

  const { data: stripePayments = [], isLoading: stripePaymentsLoading } = useQuery({
    queryKey: ['stripePayments', instructor?.stripeAccountId, adminProxyInstructorId],
    queryFn: async () => {
      const response = await base44.functions.invoke('fetchStripePayments', {
        instructorId: adminProxyInstructorId || null
      });
      return response.data.payments || [];
    },
    enabled: !!instructor?.stripeAccountId,
    refetchInterval: 30000
  });

  if (pupilsLoading || ledgerLoading || stripePaymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading payment information...</div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">No instructor profile found</div>
      </div>
    );
  }

  // Calculate statistics
  const totalRevenue = allLedgerEntries
    .filter(e => e.type === 'charge')
    .reduce((sum, e) => sum + (e.amountGbp || 0), 0);

  const thisMonthRevenue = allLedgerEntries
    .filter(e => e.type === 'charge' && moment(e.created_date).isSame(moment(), 'month'))
    .reduce((sum, e) => sum + (e.amountGbp || 0), 0);

  const activePupils = pupils.filter(p => p.status === 'Active');
  const totalBalances = activePupils.reduce((sum, p) => sum + (p.bulkPaymentBalance || 0), 0);

  // Filter pupils by search
  const filteredPupils = pupils.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Get recent activity
  const recentActivity = allLedgerEntries.slice(0, 20).map(entry => {
    const pupil = pupils.find(p => p.id === entry.userId);
    return { ...entry, pupil };
  });

  // Calculate Stripe payment summaries
  const totalCardPayments = stripePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalStripeFees = stripePayments.reduce((sum, p) => sum + p.stripeFee, 0);
  const totalPayoutAmount = stripePayments.reduce((sum, p) => sum + p.netPayout, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {!adminProxyInstructorId && (
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">Payment Management</h1>
            <p className="text-slate-600 mt-2">Track pupil balances and payment activity</p>
          </div>
        )}

        {/* Payment Methods & Invoices (only show for non-admin view) */}
        {!adminProxyInstructorId && (
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

            <Link to={createPageUrl('Invoices')}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-[#F7B602]" />
                    <h3 className="text-lg font-semibold text-[#071739]">Invoices</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Summary Cards - Revenue & Card Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue Card */}
          <Card className="border-[#071739]/20">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold text-[#071739] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#F7B602]" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="pr-4">
                  <div className="text-xs text-slate-500 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-[#071739]">£{totalRevenue.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 mt-1">All time</div>
                </div>
                <div className="px-4">
                  <div className="text-xs text-slate-500 mb-1">This Month</div>
                  <div className="text-2xl font-bold text-[#071739]">£{thisMonthRevenue.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 mt-1">{moment().format('MMM YYYY')}</div>
                </div>
                <div className="pl-4">
                  <div className="text-xs text-slate-500 mb-1">Pupil Balances</div>
                  <div className="text-2xl font-bold text-[#071739]">£{totalBalances.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 mt-1">Combined</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Payments Card */}
          <Card className="border-emerald-200">
            <CardHeader className="pb-3 border-b border-emerald-100">
              <CardTitle className="text-base font-semibold text-emerald-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Card Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 divide-x divide-emerald-100">
                <div className="pr-4">
                  <div className="text-xs text-emerald-700 mb-1">Total Received</div>
                  <div className="text-2xl font-bold text-emerald-800">£{totalCardPayments.toFixed(2)}</div>
                  <div className="text-xs text-emerald-500 mt-1">{stripePayments.length} transactions</div>
                </div>
                <div className="px-4">
                  <div className="text-xs text-emerald-700 mb-1">Payout Amount</div>
                  <div className="text-2xl font-bold text-emerald-800">£{totalPayoutAmount.toFixed(2)}</div>
                  <div className="text-xs text-emerald-500 mt-1">After fees</div>
                </div>
                <div className="pl-4">
                  <div className="text-xs text-red-500 mb-1">Stripe Charges</div>
                  <div className="text-2xl font-bold text-red-600">£{totalStripeFees.toFixed(2)}</div>
                  <div className="text-xs text-red-400 mt-1">Processing fees</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pupils" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pupils">Pupil Balances</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="card-payments">Latest Card Payments</TabsTrigger>
          </TabsList>

          {/* Pupil Balances Tab */}
          <TabsContent value="pupils">
            <Card>
              <CardHeader>
                <CardTitle>Pupil Balances</CardTitle>
                <CardDescription>
                  Showing {activePupils.filter(p => {
                    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                    return fullName.includes(searchQuery.toLowerCase());
                  }).length} of {activePupils.length} active pupils
                </CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search active pupils..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activePupils.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No active pupils found
                  </div>
                ) : activePupils.filter(p => {
                  const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                  return fullName.includes(searchQuery.toLowerCase());
                }).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No active pupils match your search
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activePupils
                      .filter(p => {
                        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
                        return fullName.includes(searchQuery.toLowerCase());
                      })
                      .map((pupil) => {
                        const balance = pupil.bulkPaymentBalance || 0;
                        const hourlyRate = pupil.hourlyRate || 50;
                        const availableHours = balance / hourlyRate;

                        return (
                          <Link 
                            key={pupil.id}
                            to={createPageUrl('InstructorPupilPayments') + `?id=${pupil.id}`}
                          >
                            <Card className={`hover:shadow-lg transition-all cursor-pointer h-full aspect-square flex flex-col ${
                              balance > 0 
                                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 hover:shadow-emerald-200' 
                                : balance < 0 
                                ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-300 hover:shadow-rose-200' 
                                : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
                            }`}>
                              <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div className="space-y-4">
                                  <div className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-md ${
                                      balance > 0 
                                        ? 'bg-emerald-600 text-white' 
                                        : balance < 0 
                                        ? 'bg-rose-600 text-white' 
                                        : 'bg-slate-400 text-white'
                                    }`}>
                                      {pupil.firstName[0]}{pupil.lastName[0]}
                                    </div>
                                    <div className="font-bold text-slate-900 mt-3 text-lg">
                                      {pupil.firstName} {pupil.lastName}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="text-center py-3 border-t border-b">
                                    <div className="text-xs text-slate-600 mb-1">Balance</div>
                                    <div className={`text-4xl font-bold ${
                                      balance > 0 ? 'text-emerald-700' : balance < 0 ? 'text-rose-700' : 'text-slate-500'
                                    }`}>
                                      £{balance.toFixed(2)}
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-xs text-slate-600">Available Hours</div>
                                    <div className={`text-sm font-semibold ${
                                      balance > 0 ? 'text-emerald-700' : balance < 0 ? 'text-rose-700' : 'text-slate-500'
                                    }`}>
                                      {balance > 0 ? `≈ ${availableHours.toFixed(1)}h` : balance < 0 ? `${Math.abs(availableHours).toFixed(1)}h debt` : '0h'}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest payment transactions across all pupils</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentActivity.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            entry.type === 'charge' ? 'bg-green-100' : 'bg-rose-100'
                          }`}>
                            {entry.type === 'charge' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {entry.pupil ? `${entry.pupil.firstName} ${entry.pupil.lastName}` : 'Unknown Pupil'}
                            </div>
                            <div className="text-sm text-slate-600">
                              {entry.reason === 'lesson_confirmed_charge' && 'Lesson Charge'}
                              {entry.reason === 'late_cancellation_penalty' && 'Late Cancellation Penalty'}
                              {entry.reason === 'manual_adjustment' && 'Balance Adjustment'}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" />
                              {moment(entry.created_date).format('DD MMM YYYY, HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            entry.type === 'charge' ? 'text-green-600' : 'text-rose-600'
                          }`}>
                            {entry.type === 'charge' ? '+' : '-'}£{Math.abs(entry.amountGbp || 0).toFixed(2)}
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
          </TabsContent>

          {/* Latest Card Payments Tab */}
          <TabsContent value="card-payments">
            <Card>
              <CardHeader>
                <CardTitle>Latest Card Payments</CardTitle>
                <CardDescription>
                  Card payments processed through Stripe (showing fees and net payouts)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!instructor?.stripeAccountId ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connect your Stripe account to view card payment details.{' '}
                      <Link to={createPageUrl('PaymentMethods')} className="text-[#F7B602] hover:underline">
                        Set up payments
                      </Link>
                    </AlertDescription>
                  </Alert>
                ) : stripePayments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No card payments yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stripePayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full mt-1 ${
                              payment.status === 'succeeded' 
                                ? 'bg-green-100' 
                                : payment.status === 'pending' 
                                ? 'bg-yellow-100' 
                                : 'bg-slate-100'
                            }`}>
                              {payment.status === 'succeeded' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : payment.status === 'pending' ? (
                                <Clock className="w-5 h-5 text-yellow-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">
                                  {payment.currency} {payment.amount.toFixed(2)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {payment.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {payment.paymentMethod}
                                </Badge>
                              </div>
                              {payment.customerEmail && (
                                <div className="text-sm text-slate-600">
                                  {payment.customerEmail}
                                </div>
                              )}
                              {payment.description && (
                                <div className="text-sm text-slate-600">
                                  {payment.description}
                                </div>
                              )}
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-2">
                                <Clock className="w-3 h-3" />
                                {moment.unix(payment.created).format('DD MMM YYYY, HH:mm')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fee Breakdown */}
                        <div className="ml-11 pt-3 border-t space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Payment Amount</span>
                            <span className="font-medium text-slate-900">
                              £{payment.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Stripe Processing Fee</span>
                            <span className="font-medium text-rose-600">
                              -£{payment.stripeFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-base font-bold border-t pt-2">
                            <span className="text-slate-900">Net Payout to You</span>
                            <span className="text-green-600">
                              £{payment.netPayout.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}