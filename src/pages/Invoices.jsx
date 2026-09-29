import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Plus, Search, Calendar, DollarSign, CreditCard, Banknote, Eye, ArrowLeft, Share2, CheckCircle, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [shareDialogInvoice, setShareDialogInvoice] = useState(null);
  const [sharing, setSharing] = useState(false);

  // Manual invoice form state
  const [manualForm, setManualForm] = useState({
    pupilId: '',
    amount: '',
    hours: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const allInvoices = await base44.entities.Invoice.filter(
        { instructorId: user.id },
        '-created_date',
        200
      );
      return allInvoices;
    },
    enabled: !!user?.id
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['instructorPupils', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Pupil.filter({ instructorId: user.id }, 'firstName');
    },
    enabled: !!user?.id
  });

  const { data: instructorProfile } = useQuery({
    queryKey: ['instructorProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.Instructor.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.id
  });

  const createManualInvoiceMutation = useMutation({
    mutationFn: async (data) => {
    const response = await base44.functions.invoke('createManualInvoice', data);
    return response.data;
    },
    onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    setShowManualDialog(false);
    setManualForm({
      pupilId: '',
      amount: '',
      hours: '',
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
    toast({
      title: 'Invoice Created',
      description: 'Manual invoice has been created successfully'
    });
    // Open the invoice preview with the Share action
    setSelectedInvoice(data.invoice || data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to create invoice',
        variant: 'destructive'
      });
    }
  });

  const handleShareInvoice = async (invoice) => {
    setSharing(true);
    try {
      await base44.entities.Invoice.update(invoice.id, { sharedWithPupil: true });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShareDialogInvoice(null);
      toast({
        title: 'Invoice Shared',
        description: 'The invoice is now visible to the pupil'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to share invoice',
        variant: 'destructive'
      });
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await base44.functions.invoke('generateInvoicePdf', { invoiceId });
      
      if (!response.data) {
        throw new Error('No invoice data received');
      }
      
      // Open HTML invoice in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data);
      printWindow.document.close();
      
      toast({
        title: 'Success',
        description: 'Invoice opened - use browser print to save as PDF'
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice',
        variant: 'destructive'
      });
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.pupilName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.pupilEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0),
    thisMonth: invoices.filter(i => 
      i.status === 'PAID' && 
      moment(i.created_date).isSame(moment(), 'month')
    ).reduce((sum, i) => sum + (i.amount || 0), 0),
    paidCount: invoices.filter(i => i.status === 'PAID').length,
    pendingCount: invoices.filter(i => i.status === 'PENDING').length
  };

  // Group invoices by type
  const stripeInvoices = filteredInvoices.filter(i => i.type === 'STRIPE_CARD');
  const manualInvoices = filteredInvoices.filter(i => i.type === 'MANUAL_CASH' || i.type === 'MANUAL_BACS');

  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED': return 'bg-rose-100 text-rose-800';
      case 'VOID': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'STRIPE_CARD') return <CreditCard className="w-4 h-4" />;
    if (type === 'MANUAL_CASH') return <Banknote className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const InvoiceTable = ({ invoices }) => (
    <div className="space-y-2">
      {invoices.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          No invoices found
        </div>
      ) : (
        invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-[#F7B602]/10 shrink-0">
                {getTypeIcon(invoice.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#071739]">{invoice.invoiceNumber}</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {invoice.pupilName} • {moment(invoice.created_date).format('DD MMM YYYY')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-[#071739]">
                  £{(invoice.amount || 0).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">
                  {invoice.hours}h • {invoice.paymentMethod}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!invoice.sharedWithPupil && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareDialogInvoice(invoice)}
                  className="gap-2 border-[#F7B602] text-[#F7B602] hover:bg-[#F7B602]/10"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}
              {invoice.sharedWithPupil && (
                <Badge className="bg-emerald-100 text-emerald-800">Shared</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(invoice)}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <Link to={createPageUrl('InstructorPayments')} className="inline-flex items-center gap-2 text-[#071739] hover:text-[#F7B602] mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Payments</span>
            </Link>
            <h1 className="text-3xl font-bold text-[#071739]">Invoices</h1>
            <p className="text-slate-600 mt-2">Manage payment invoices and receipts</p>
          </div>
          <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Manual Invoice</DialogTitle>
                <DialogDescription>
                  Record a cash or BACS payment and generate an invoice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pupil</Label>
                  <Select
                    value={manualForm.pupilId}
                    onValueChange={(value) => setManualForm({...manualForm, pupilId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pupil" />
                    </SelectTrigger>
                    <SelectContent>
                      {pupils.map(pupil => (
                        <SelectItem key={pupil.id} value={pupil.id}>
                          {pupil.firstName} {pupil.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={manualForm.amount}
                      onChange={(e) => setManualForm({...manualForm, amount: e.target.value})}
                      placeholder="50.00"
                    />
                  </div>
                  <div>
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={manualForm.hours}
                      onChange={(e) => setManualForm({...manualForm, hours: e.target.value})}
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={manualForm.paymentMethod}
                    onValueChange={(value) => setManualForm({...manualForm, paymentMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BACS">BACS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={manualForm.paymentDate}
                    onChange={(e) => setManualForm({...manualForm, paymentDate: e.target.value})}
                  />
                </div>

                {manualForm.paymentMethod === 'BACS' && (
                  <div>
                    <Label>Reference</Label>
                    <Input
                      value={manualForm.reference}
                      onChange={(e) => setManualForm({...manualForm, reference: e.target.value})}
                      placeholder="e.g., JSMITHFEB"
                    />
                  </div>
                )}

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({...manualForm, notes: e.target.value})}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createManualInvoiceMutation.mutate(manualForm)}
                    disabled={!manualForm.pupilId || !manualForm.amount || !manualForm.hours || createManualInvoiceMutation.isPending}
                    className="flex-1 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]"
                  >
                    {createManualInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-emerald-400 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{stats.totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mt-1">All time</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-400 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{stats.thisMonth.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mt-1">{moment().format('MMMM YYYY')}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#071739] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#071739] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Paid Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{stats.paidCount}</div>
              <div className="text-sm text-slate-500 mt-1">Completed</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#F7B602] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#d99f02] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.pendingCount}</div>
              <div className="text-sm text-slate-500 mt-1">Awaiting payment</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by invoice number, pupil name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="VOID">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex overflow-x-auto scrollbar-thin sm:w-auto p-1.5 gap-1.5 bg-slate-100">
            <TabsTrigger
              value="all"
              className="gap-2 shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg bg-[#071739] text-white shadow-sm hover:bg-[#071739]/90 data-[state=active]:ring-2 data-[state=active]:ring-[#F7B602] data-[state=active]:ring-offset-1 data-[state=active]:ring-offset-slate-100"
            >
              <FileText className="w-4 h-4" />
              All Invoices ({filteredInvoices.length})
            </TabsTrigger>
            <TabsTrigger
              value="stripe"
              className="gap-2 shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-600/90 data-[state=active]:ring-2 data-[state=active]:ring-[#F7B602] data-[state=active]:ring-offset-1 data-[state=active]:ring-offset-slate-100"
            >
              <CreditCard className="w-4 h-4" />
              Card Payments ({stripeInvoices.length})
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="gap-2 shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg bg-[#F7B602] text-[#071739] shadow-sm hover:bg-[#d99f02] data-[state=active]:ring-2 data-[state=active]:ring-[#071739] data-[state=active]:ring-offset-1 data-[state=active]:ring-offset-slate-100"
            >
              <Banknote className="w-4 h-4" />
              Manual ({manualInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="pt-6">
                <InvoiceTable invoices={filteredInvoices} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stripe">
            <Card>
              <CardContent className="pt-6">
                <InvoiceTable invoices={stripeInvoices} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardContent className="pt-6">
                <InvoiceTable invoices={manualInvoices} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invoice Detail / Preview Modal */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            {selectedInvoice && !selectedInvoice.sharedWithPupil && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-sm text-amber-800">
                  This invoice hasn't been shared with the pupil yet.
                </div>
                <Button
                  size="sm"
                  onClick={() => setShareDialogInvoice(selectedInvoice)}
                  className="gap-2 w-full sm:w-auto bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]"
                >
                  <Share2 className="w-4 h-4" />
                  Share with pupil
                </Button>
              </div>
            )}
            {selectedInvoice && (
              <div className="space-y-4">
                {/* Business Letterhead */}
                {instructorProfile && (
                  <div className="text-left pb-4 border-b border-[#F7B602]">
                    <div className="text-xl font-bold text-[#071739]">
                      {instructorProfile.businessName || selectedInvoice.instructorName}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                      {instructorProfile.businessAddress && (
                        <div>{instructorProfile.businessAddress}</div>
                      )}
                      {(instructorProfile.businessCity || instructorProfile.businessPostcode) && (
                        <div>
                          {[instructorProfile.businessCity, instructorProfile.businessPostcode].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {(instructorProfile.usePersonalEmailForBusiness ? selectedInvoice.instructorEmail : instructorProfile.businessEmail) && (
                          <span>
                            {instructorProfile.usePersonalEmailForBusiness ? selectedInvoice.instructorEmail : instructorProfile.businessEmail}
                          </span>
                        )}
                        {(instructorProfile.usePersonalPhoneForBusiness ? selectedInvoice.instructorPhone : instructorProfile.businessPhone) && (
                          <span>
                            • {instructorProfile.usePersonalPhoneForBusiness ? selectedInvoice.instructorPhone : instructorProfile.businessPhone}
                          </span>
                        )}
                      </div>
                      {instructorProfile.businessRegistration && (
                        <div className="text-xs text-slate-500 mt-1">Reg: {instructorProfile.businessRegistration}</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <div className="text-2xl font-bold text-[#071739]">{selectedInvoice.invoiceNumber}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {moment(selectedInvoice.created_date).format('DD MMMM YYYY')}
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedInvoice.status)} className="text-sm px-3 py-1">
                    {selectedInvoice.status}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">Billed To</div>
                  <div className="font-medium">{selectedInvoice.pupilName}</div>
                  <div className="text-sm text-slate-600">{selectedInvoice.pupilEmail}</div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 grid grid-cols-4 gap-4 text-sm font-medium text-slate-700">
                    <div>Description</div>
                    <div>Hours</div>
                    <div>Rate</div>
                    <div className="text-right">Amount</div>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-4 gap-4">
                    <div className="text-sm">{selectedInvoice.description || 'Driving lessons'}</div>
                    <div className="text-sm">{selectedInvoice.hours}</div>
                    <div className="text-sm">£{((selectedInvoice.amount || 0) / (selectedInvoice.hours || 1)).toFixed(2)}</div>
                    <div className="text-sm font-medium text-right">£{(selectedInvoice.amount || 0).toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-lg font-semibold">Total</div>
                  <div className="text-2xl font-bold text-[#071739]">£{(selectedInvoice.amount || 0).toFixed(2)}</div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment Method:</span>
                    <span className="font-medium">{selectedInvoice.paymentMethod}</span>
                  </div>
                  {selectedInvoice.paymentDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paid On:</span>
                      <span className="font-medium">{moment(selectedInvoice.paymentDate).format('DD MMM YYYY')}</span>
                    </div>
                  )}
                  {selectedInvoice.manualReference && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Reference:</span>
                      <span className="font-medium">{selectedInvoice.manualReference}</span>
                    </div>
                  )}
                  {selectedInvoice.notes && (
                    <div className="pt-2 border-t">
                      <span className="text-slate-600">Notes:</span>
                      <div className="mt-1">{selectedInvoice.notes}</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                    className="flex-1 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Share Invoice Dialog */}
        <Dialog open={!!shareDialogInvoice} onOpenChange={(open) => !sharing && setShareDialogInvoice(open ? shareDialogInvoice : null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share invoice with pupil?</DialogTitle>
              <DialogDescription>
                {shareDialogInvoice?.pupilName ? `${shareDialogInvoice.pupilName} will be able to view this invoice in their My Invoices page.` : 'The pupil will be able to view this invoice in their My Invoices page.'}
              </DialogDescription>
            </DialogHeader>
            {shareDialogInvoice && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Invoice:</span>
                  <span className="font-medium">{shareDialogInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pupil:</span>
                  <span className="font-medium">{shareDialogInvoice.pupilName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-medium">£{(shareDialogInvoice.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShareDialogInvoice(null)}
                disabled={sharing}
                className="flex-1"
              >
                Not now
              </Button>
              <Button
                onClick={() => shareDialogInvoice && handleShareInvoice(shareDialogInvoice)}
                disabled={sharing}
                className="flex-1 bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] gap-2"
              >
                {sharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Share invoice
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}