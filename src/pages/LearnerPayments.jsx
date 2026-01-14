import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CreditCard, Package, Receipt, AlertCircle, Plus } from 'lucide-react';
import moment from 'moment';

export default function LearnerPayments() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: paymentMethods = [], isLoading: loadingMethods } = useQuery({
    queryKey: ['paymentMethods', currentUser?.id],
    queryFn: () => base44.entities.PaymentMethod.filter({ userId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: () => base44.entities.Transaction.filter({ userId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ['packages', currentUser?.id],
    queryFn: () => base44.entities.Package.filter({ userId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', currentUser?.id],
    queryFn: () => base44.entities.Invoice.filter({ userId: currentUser.id }),
    enabled: !!currentUser?.id
  });

  const { data: pupil } = useQuery({
    queryKey: ['pupil', currentUser?.id],
    queryFn: async () => {
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: currentUser.id });
      return pupils[0] || null;
    },
    enabled: !!currentUser?.id
  });

  // Calculate summary data
  const outstandingBalance = pupil?.bulkPaymentBalance < 0 ? Math.abs(pupil.bulkPaymentBalance) : 0;
  const creditsBalance = pupil?.bulkPaymentBalance > 0 ? pupil.bulkPaymentBalance : 0;
  const activePackage = packages.find(p => p.status === 'active');

  const isLoading = loadingMethods || loadingTransactions || loadingPackages || loadingInvoices;

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
          <p className="text-slate-500 mt-1">Cards, invoices, packages and lesson charges</p>
        </div>

        {/* Error Banner */}
        {outstandingBalance > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment required</AlertTitle>
            <AlertDescription>
              You have an outstanding balance of £{outstandingBalance.toFixed(2)}. Update your payment method to avoid booking issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outstanding Balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding Balance</CardTitle>
                  <CardDescription>
                    {outstandingBalance > 0 ? 'Payment required' : 'No balance'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800 mb-4">
                    £{outstandingBalance.toFixed(2)}
                  </div>
                  <Button 
                    disabled={outstandingBalance <= 0}
                    className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  >
                    Pay Outstanding
                  </Button>
                </CardContent>
              </Card>

              {/* Credits */}
              <Card>
                <CardHeader>
                  <CardTitle>Credits Available</CardTitle>
                  <CardDescription>
                    {creditsBalance > 0 ? 'Will be applied automatically' : 'No credits'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600 mb-4">
                    £{creditsBalance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              {/* Active Package */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Package</CardTitle>
                  <CardDescription>Your lesson package</CardDescription>
                </CardHeader>
                <CardContent>
                  {activePackage ? (
                    <div>
                      <p className="text-lg font-medium text-slate-800">{activePackage.title}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {activePackage.lessonsRemaining} of {activePackage.lessonsTotal} lessons remaining
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500">No active package</p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab('packages')}
                  >
                    Buy Package
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Saved cards</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length > 0 ? (
                    <div className="space-y-2">
                      {paymentMethods.slice(0, 2).map(method => (
                        <div key={method.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">{method.brand} •••• {method.last4}</span>
                          </div>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No payment methods added</p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab('methods')}
                  >
                    Manage Cards
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No payment method yet</h3>
                    <p className="text-slate-500 mb-6">Add a card to pay for lessons and packages.</p>
                    <Button className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-800">
                              {method.brand} •••• {method.last4}
                            </p>
                            <p className="text-sm text-slate-500">
                              Exp {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {method.status === 'requires_action' && (
                            <Badge variant="destructive">Action needed</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
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
                <CardDescription>All your payment transactions</CardDescription>
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
                <CardTitle>Lesson Packages</CardTitle>
                <CardDescription>Your purchased packages</CardDescription>
              </CardHeader>
              <CardContent>
                {packages.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No packages yet</h3>
                    <p className="text-slate-500 mb-6">Buy a package to save on lessons.</p>
                    <Button className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                      Buy Package
                    </Button>
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
                        {pkg.expiresAt && (
                          <p className="text-xs text-slate-500">
                            Expires {moment(pkg.expiresAt).format('DD MMM YYYY')}
                          </p>
                        )}
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
                <CardTitle>Invoices & Receipts</CardTitle>
                <CardDescription>Download your invoices</CardDescription>
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
                            <Receipt className="w-4 h-4 mr-2" />
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
        </Tabs>
      </div>
    </div>
  );
}