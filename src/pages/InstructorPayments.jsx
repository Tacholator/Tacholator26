import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function InstructorPayments() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', currentUser?.id],
    queryFn: async () => {
      const instructors = await base44.entities.Instructor.list();
      return instructors.find(i => i.created_by === currentUser.id);
    },
    enabled: !!currentUser?.id
  });

  const { data: payouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ['payouts', currentUser?.id],
    queryFn: () => base44.entities.Payout.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: () => base44.entities.Transaction.list(),
    enabled: !!currentUser?.id
  });

  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ['packages', currentUser?.id],
    queryFn: () => base44.entities.Package.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', currentUser?.id],
    queryFn: () => base44.entities.Invoice.list(),
    enabled: !!currentUser?.id
  });

  const { data: disputes = [], isLoading: loadingDisputes } = useQuery({
    queryKey: ['disputes', currentUser?.id],
    queryFn: () => base44.entities.Dispute.list(),
    enabled: !!currentUser?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', currentUser?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  // Calculate summary data
  const thisMonth = moment().startOf('month');
  const paidTransactions = transactions.filter(t => t.status === 'paid' && moment(t.created_date).isAfter(thisMonth));
  const collectedThisMonth = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const outstandingFromPupils = transactions.filter(t => t.status === 'due').reduce((sum, t) => sum + t.amount, 0);
  
  const upcomingPayouts = payouts.filter(p => p.status === 'scheduled' && moment(p.expectedAt).isAfter(moment()));
  const nextPayout = upcomingPayouts.sort((a, b) => moment(a.expectedAt).diff(moment(b.expectedAt)))[0];
  
  const failedPaymentsCount = transactions.filter(t => t.status === 'failed').length;
  const openDisputesCount = disputes.filter(d => ['needs_response', 'under_review'].includes(d.status)).length;

  const createConnectAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('stripeConnectAccount', {
        action: 'create',
        instructorId: currentUser.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to setup payout details',
        variant: 'destructive'
      });
    }
  });

  const refreshConnectStatusMutation = useMutation({
    mutationFn: async () => {
      if (!instructor?.stripeConnectAccountId) return null;
      const response = await base44.functions.invoke('stripeConnectAccount', {
        action: 'status',
        accountId: instructor.stripeConnectAccountId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructor']);
      toast({
        title: 'Status Updated',
        description: 'Payout status has been refreshed'
      });
    }
  });

  const isLoading = loadingPayouts || loadingTransactions || loadingPackages || loadingInvoices || loadingDisputes;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manage Payments</h1>
          <p className="text-slate-500 mt-1">Payouts, lesson income, invoices and issues</p>
        </div>

        {/* Warning Banner */}
        {(failedPaymentsCount > 0 || openDisputesCount > 0) && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Issues require attention</AlertTitle>
            <AlertDescription>
              {failedPaymentsCount > 0 && `${failedPaymentsCount} failed payment(s). `}
              {openDisputesCount > 0 && `${openDisputesCount} open dispute(s).`}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payouts">Payout Settings</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="disputes">Disputes & Refunds</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collected This Month */}
              <Card>
                <CardHeader>
                  <CardTitle>Collected (this month)</CardTitle>
                  <CardDescription>Income</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-emerald-600">
                      £{collectedThisMonth.toFixed(2)}
                    </div>
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    From {paidTransactions.length} transaction(s)
                  </p>
                </CardContent>
              </Card>

              {/* Outstanding from Pupils */}
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding from Pupils</CardTitle>
                  <CardDescription>
                    {outstandingFromPupils > 0 ? 'Needs attention' : 'All good'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800 mb-4">
                    £{outstandingFromPupils.toFixed(2)}
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('upcoming')}
                    className="w-full"
                  >
                    View Upcoming
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Payout */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Payout</CardTitle>
                  <CardDescription>Next scheduled payout</CardDescription>
                </CardHeader>
                <CardContent>
                  {nextPayout ? (
                    <div>
                      <p className="text-lg font-medium text-slate-800">
                        {moment(nextPayout.expectedAt).format('DD MMM YYYY')}
                      </p>
                      <p className="text-2xl font-bold text-emerald-600 mt-2">
                        £{nextPayout.amount.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500">No upcoming payout</p>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('payouts')}
                    className="w-full mt-4"
                  >
                    Payout Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Issues</CardTitle>
                  <CardDescription>Payments & disputes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Failed payments</span>
                      <Badge variant={failedPaymentsCount > 0 ? 'destructive' : 'secondary'}>
                        {failedPaymentsCount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Open disputes</span>
                      <Badge variant={openDisputesCount > 0 ? 'destructive' : 'secondary'}>
                        {openDisputesCount}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('disputes')}
                    className="w-full mt-4"
                  >
                    View Disputes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout Method</CardTitle>
                <CardDescription>Manage how you receive payments</CardDescription>
              </CardHeader>
              <CardContent>
                {instructor?.connectStatus === 'verified' ? (
                  <Alert className="mb-6">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Payout Account Active</AlertTitle>
                    <AlertDescription>
                      Your bank account is connected and ready to receive payouts.
                    </AlertDescription>
                  </Alert>
                ) : instructor?.connectStatus === 'pending' ? (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Setup In Progress</AlertTitle>
                    <AlertDescription>
                      Complete your payout setup to start receiving payments.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payout Setup Required</AlertTitle>
                    <AlertDescription>
                      Add your bank details to receive payments from lessons.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={() => createConnectAccountMutation.mutate()}
                    disabled={createConnectAccountMutation.isPending}
                    className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  >
                    {createConnectAccountMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : instructor?.stripeConnectAccountId ? (
                      'Continue Setup'
                    ) : (
                      'Setup Payout Details'
                    )}
                  </Button>
                  
                  {instructor?.stripeConnectAccountId && (
                    <Button 
                      variant="outline"
                      onClick={() => refreshConnectStatusMutation.mutate()}
                      disabled={refreshConnectStatusMutation.isPending}
                    >
                      {refreshConnectStatusMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Refresh Status'
                      )}
                    </Button>
                  )}
                </div>

                {payouts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-slate-800 mb-4">Recent Payouts</h3>
                    <div className="space-y-3">
                      {payouts.slice(0, 5).map(payout => (
                        <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-800">
                                {moment(payout.expectedAt).format('DD MMM YYYY')}
                              </p>
                              <p className="text-sm text-slate-500">{payout.status}</p>
                            </div>
                          </div>
                          <p className="font-semibold text-slate-800">£{payout.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Lesson Payments</CardTitle>
                <CardDescription>Expected payments from pupils</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.filter(b => ['APPROVED', 'COMPLETED'].includes(b.status)).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No upcoming lesson payments
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.filter(b => ['APPROVED', 'COMPLETED'].includes(b.status)).map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">
                            {moment(booking.startAt).format('DD MMM YYYY HH:mm')}
                          </p>
                          <p className="text-sm text-slate-500">
                            {booking.pupil?.fullName || 'Pupil'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-800">
                            £{booking.totalPriceGbp?.toFixed(2) || '0.00'}
                          </p>
                          <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">
                            {moment(tx.created_date).format('DD MMM YYYY')} • {tx.type}
                          </p>
                          {tx.refId && (
                            <p className="text-sm text-slate-500">Ref: {tx.refId}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-800">£{tx.amount.toFixed(2)}</p>
                          <Badge variant={
                            tx.status === 'paid' ? 'default' : 
                            tx.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages">
            <Card>
              <CardHeader>
                <CardTitle>Packages</CardTitle>
                <CardDescription>Track packages sold to pupils</CardDescription>
              </CardHeader>
              <CardContent>
                {packages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No packages sold yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-800">{pkg.title}</h3>
                          <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                            {pkg.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {pkg.lessonsRemaining} of {pkg.lessonsTotal} lessons remaining
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Purchased {moment(pkg.purchasedAt).format('DD MMM YYYY')}
                          </span>
                          <span className="font-semibold text-slate-800">£{pkg.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Download invoices for your records</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No invoices yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">{invoice.number}</p>
                          <p className="text-sm text-slate-500">
                            {moment(invoice.issuedAt).format('DD MMM YYYY')} • {invoice.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-800">£{invoice.total.toFixed(2)}</p>
                          <Button variant="outline" size="sm" disabled={!invoice.pdfUrl}>
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Disputes</CardTitle>
                  <CardDescription>Payment disputes requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {disputes.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      No disputes
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {disputes.map(dispute => (
                        <div key={dispute.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-800">
                              {moment(dispute.openedAt).format('DD MMM YYYY')}
                            </p>
                            <Badge variant={
                              dispute.status === 'needs_response' ? 'destructive' :
                              dispute.status === 'won' ? 'default' :
                              'secondary'
                            }>
                              {dispute.status}
                            </Badge>
                          </div>
                          {dispute.reason && (
                            <p className="text-sm text-slate-600 mb-3">{dispute.reason}</p>
                          )}
                          {dispute.status === 'needs_response' && (
                            <Button variant="outline" size="sm">
                              Respond
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Issue Refund</CardTitle>
                  <CardDescription>Refund payments to pupils</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    You can issue full or partial refunds for eligible payments.
                  </p>
                  <Button variant="outline">
                    Refund a Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}