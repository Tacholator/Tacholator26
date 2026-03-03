import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Save, CheckCircle2 } from 'lucide-react';

export default function BankTransferDetailsSection({ instructor, queryClient, toast }) {
  const [form, setForm] = useState({
    bankTransferEnabled: false,
    bankName: '',
    bankAccountName: '',
    bankSortCode: '',
    bankAccountNumber: '',
    bankPaymentReference: '',
    bankTransferNote: '',
  });

  useEffect(() => {
    if (instructor) {
      setForm({
        bankTransferEnabled: instructor.bankTransferEnabled || false,
        bankName: instructor.bankName || '',
        bankAccountName: instructor.bankAccountName || '',
        bankSortCode: instructor.bankSortCode || '',
        bankAccountNumber: instructor.bankAccountNumber || '',
        bankPaymentReference: instructor.bankPaymentReference || '',
        bankTransferNote: instructor.bankTransferNote || '',
      });
    }
  }, [instructor]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Instructor.update(instructor.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInstructorProfile'] });
      toast({ title: 'Saved', description: 'Bank transfer details updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save details.', variant: 'destructive' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#F7B602]" />
          Bank Transfer Details
        </CardTitle>
        <CardDescription>
          Provide your bank details so pupils can pay you directly via bank transfer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
          <div>
            <p className="font-medium text-slate-800 text-sm">Enable bank transfer payments</p>
            <p className="text-xs text-slate-500">Pupils will see your bank details in the Make Payment section</p>
          </div>
          <Switch
            checked={form.bankTransferEnabled}
            onCheckedChange={(val) => setForm(f => ({ ...f, bankTransferEnabled: val }))}
          />
        </div>

        {form.bankTransferEnabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  placeholder="e.g. Lloyds Bank"
                  value={form.bankName}
                  onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  placeholder="e.g. John Smith"
                  value={form.bankAccountName}
                  onChange={(e) => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Sort Code</Label>
                <Input
                  placeholder="e.g. 12-34-56"
                  value={form.bankSortCode}
                  onChange={(e) => setForm(f => ({ ...f, bankSortCode: e.target.value }))}
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  placeholder="e.g. 12345678"
                  value={form.bankAccountNumber}
                  onChange={(e) => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Payment Reference for Pupils</Label>
              <Input
                placeholder="e.g. Pupil's full name"
                value={form.bankPaymentReference}
                onChange={(e) => setForm(f => ({ ...f, bankPaymentReference: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">Tell pupils what reference to use when making a transfer</p>
            </div>
            <div>
              <Label>Additional Note (optional)</Label>
              <Textarea
                placeholder="Any extra instructions for pupils..."
                value={form.bankTransferNote}
                onChange={(e) => setForm(f => ({ ...f, bankTransferNote: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        )}

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-[#071739] hover:bg-[#071739]/90 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Details'}
        </Button>
      </CardContent>
    </Card>
  );
}