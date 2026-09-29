import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Search, Eye, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import moment from 'moment';

export default function LearnerInvoices() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['myInvoices', pupil?.id],
    queryFn: async () => {
      if (!pupil?.id) return [];
      const allInvoices = await base44.entities.Invoice.filter(
        { pupilId: pupil.id },
        '-created_date',
        100
      );
      // Show only invoices the instructor has shared, plus system-generated card payments
      return allInvoices.filter(inv =>
        inv.sharedWithPupil === true &&
        (inv.type === 'STRIPE_CARD' ||
          inv.type === 'MANUAL_CASH' ||
          inv.type === 'MANUAL_BACS')
      );
    },
    enabled: !!pupil?.id
  });

  const { data: instructorProfile } = useQuery({
    queryKey: ['instructorProfile', selectedInvoice?.instructorEmail],
    queryFn: async () => {
      if (!selectedInvoice?.instructorEmail) return null;
      const profiles = await base44.entities.Instructor.filter({ created_by: selectedInvoice.instructorEmail });
      return profiles[0] || null;
    },
    enabled: !!selectedInvoice?.instructorEmail
  });

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await base44.functions.invoke('generateInvoicePdf', { invoiceId });
      
      if (!response?.data) {
        throw new Error('No invoice data received');
      }
      
      // Open HTML invoice in new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow pop-ups to view invoice');
      }
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

  const filteredInvoices = invoices.filter(inv =>
    !searchQuery ||
    inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to={createPageUrl('LearnerPayments')} className="inline-flex items-center gap-2 text-[#071739] hover:text-[#F7B602] mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Payments</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#071739]">My Invoices</h1>
          <p className="text-slate-600 mt-2">View and download your payment invoices</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{invoices.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardContent className="pt-6">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                {searchQuery ? 'No invoices found' : 'No invoices yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-[#F7B602]/10">
                        <FileText className="w-5 h-5 text-[#F7B602]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#071739]">{invoice.invoiceNumber}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {moment(invoice.created_date).format('DD MMM YYYY')} • {invoice.hours}h lesson
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#071739]">
                          £{(invoice.amount || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">{invoice.paymentMethod}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Detail Modal */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                {/* Business Letterhead */}
                {instructorProfile && (
                  <div className="text-center pb-4 border-b border-[#F7B602]">
                    {instructorProfile.businessLogoUrl && (
                      <img 
                        src={instructorProfile.businessLogoUrl} 
                        alt="Business Logo" 
                        className="h-8 mx-auto mb-3 object-contain"
                      />
                    )}
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
                      <div className="flex items-center justify-center gap-3 mt-2">
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
      </div>
    </div>
  );
}