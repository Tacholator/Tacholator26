import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  ArrowLeft, 
  Download, 
  Eye,
  TrendingUp,
  CreditCard,
  Users
} from 'lucide-react';
import moment from 'moment';

export default function AdminPaymentsHub() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');

  // Build query params
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (fromDate) queryParams.set('from', fromDate);
  if (toDate) queryParams.set('to', toDate);
  if (status !== 'ALL') queryParams.set('status', status);
  if (method !== 'ALL') queryParams.set('method', method);

  // Fetch instructor payment cards
  const { data: instructorCards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['adminInstructorCards', search, fromDate, toDate, status, method],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAdminInstructorPaymentCards', queryParams.toString());
      return response.data || [];
    }
  });

  // Fetch global transactions
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ['adminGlobalTransactions', search, fromDate, toDate, status, method],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAdminGlobalTransactions', queryParams.toString());
      return response.data || { transactions: [], total: 0 };
    }
  });

  const transactions = transactionsData?.transactions || [];

  const handleInstructorClick = (instructorId, instructorName) => {
    navigate(createPageUrl('AdminInstructorPayments') + `?instructorId=${instructorId}&instructorName=${encodeURIComponent(instructorName)}`);
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await base44.functions.invoke('generateInvoicePdf', { invoiceId });
      
      if (!response?.data) {
        throw new Error('No invoice data received');
      }
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow pop-ups to view invoice');
      }
      printWindow.document.write(response.data);
      printWindow.document.close();
    } catch (error) {
      console.error('Invoice generation error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED': return 'bg-rose-100 text-rose-800';
      case 'VOID': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getMethodBadge = (method) => {
    switch(method) {
      case 'STRIPE_CARD': return 'bg-blue-100 text-blue-800';
      case 'CASH': return 'bg-green-100 text-green-800';
      case 'BACS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="inline-flex items-center gap-2 text-[#071739] hover:text-[#F7B602] mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Admin Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-[#071739]">Payments</h1>
          <p className="text-slate-600 mt-2">View instructor transactions and invoices</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Instructor, pupil, invoice..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                    <SelectItem value="VOID">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="STRIPE_CARD">Card</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BACS">BACS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructors Section */}
        <div>
          <h2 className="text-xl font-bold text-[#071739] mb-4">Instructors</h2>
          {loadingCards ? (
            <div className="text-center py-12 text-slate-500">Loading instructors...</div>
          ) : instructorCards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No instructors found
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructorCards.map((instructor) => (
                <Card
                  key={instructor.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-t-4 border-[#F7B602]"
                  onClick={() => handleInstructorClick(instructor.id, instructor.name)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-[#071739] flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#F7B602]" />
                      {instructor.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Revenue</span>
                        <span className="font-bold text-[#071739]">£{instructor.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Transactions</span>
                        <span className="font-medium">{instructor.txnCount}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-3">
                        {instructor.pendingCount > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending {instructor.pendingCount}
                          </Badge>
                        )}
                        {instructor.refundedCount > 0 && (
                          <Badge className="bg-rose-100 text-rose-800">
                            Refunds {instructor.refundedCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Global Transactions Section */}
        <div>
          <h2 className="text-xl font-bold text-[#071739] mb-4">All Transactions</h2>
          <Card>
            <CardContent className="pt-6">
              {loadingTransactions ? (
                <div className="text-center py-12 text-slate-500">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-slate-600">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Instructor</th>
                        <th className="pb-3 font-medium">Pupil</th>
                        <th className="pb-3 font-medium">Method</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Hours</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Invoice</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="text-sm">
                          <td className="py-3">{moment(tx.createdAt).format('DD MMM YYYY')}</td>
                          <td className="py-3">
                            <button
                              onClick={() => handleInstructorClick(tx.instructorId, tx.instructorName)}
                              className="text-[#F7B602] hover:underline"
                            >
                              {tx.instructorName}
                            </button>
                          </td>
                          <td className="py-3">{tx.pupilName}</td>
                          <td className="py-3">
                            <Badge className={getMethodBadge(tx.method)}>
                              {tx.method}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">£{tx.amount.toFixed(2)}</td>
                          <td className="py-3">{tx.hours}h</td>
                          <td className="py-3">
                            <Badge className={getStatusColor(tx.status)}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-[#F7B602]">{tx.invoiceNumber}</td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(tx.invoiceId, tx.invoiceNumber)}
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}