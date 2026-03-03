import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Save, Pencil, CheckCircle2 } from 'lucide-react';

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || <span className="text-slate-400 italic">Not set</span>}</p>
    </div>
  );
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Determine if there are already saved bank details
  const hasSavedDetails = !!(instructor?.bankSortCode || instructor?.bankAccountNumber);

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
      // If details already exist, start in view mode
      if (instructor.bankSortCode || instructor.bankAccountNumber) {
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    }
  }, [instructor]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Instructor.update(instructor.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInstructorProfile'] });
      toast({ title: 'Saved', description: 'Bank transfer details updated.' });
      setSaved(true);
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save details.', variant: 'destructive' });
    }
  });

  const handleToggle = (val) => {
    setForm(f => ({ ...f, bankTransferEnabled: val }));
    setSaved(false);
    // Immediately persist the toggle change
    base44.entities.Instructor.update(instructor.id, { ...form, bankTransferEnabled: val })
      .then(() => queryClient.invalidateQueries({ queryKey: ['myInstructorProfile'] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F7B602]" />
              Bank Transfer Details
            </CardTitle>
            <CardDescription className="mt-1">
              Provide your bank details so pupils can pay you directly via bank transfer.
            </CardDescription>
          </div>
          {!isEditing && hasSavedDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsEditing(true); setSaved(false); }}
              className="flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Update Details
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
          <div>
            <p className="font-medium text-slate-800 text-sm">Enable bank transfer payments</p>
            <p className="text-xs text-slate-500">Pupils will see your bank details in the Make Payment section</p>
          </div>
          <Switch
            checked={form.bankTransferEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {form.bankTransferEnabled && (
          <>
            {/* View mode */}
            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4 bg-slate-50 rounded-lg border">
                <InfoRow label="Bank Name" value={form.bankName} />
                <InfoRow label="Account Holder Name" value={form.bankAccountName} />
                <InfoRow label="Sort Code" value={form.bankSortCode} />
                <InfoRow label="Account Number" value={form.bankAccountNumber} />
                <InfoRow label="Payment Reference" value={form.bankPaymentReference} />
                {form.bankTransferNote && (
                  <div className="sm:col-span-2">
                    <InfoRow label="Additional Note" value={form.bankTransferNote} />
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode */
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

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || saved}
                    className="bg-[#071739] hover:bg-[#071739]/90 text-white"
                  >
                    {saved ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? 'Saving...' : 'Save Details'}</>
                    )}
                  </Button>
                  {hasSavedDetails && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form to saved instructor values
                        setForm({
                          bankTransferEnabled: instructor.bankTransferEnabled || false,
                          bankName: instructor.bankName || '',
                          bankAccountName: instructor.bankAccountName || '',
                          bankSortCode: instructor.bankSortCode || '',
                          bankAccountNumber: instructor.bankAccountNumber || '',
                          bankPaymentReference: instructor.bankPaymentReference || '',
                          bankTransferNote: instructor.bankTransferNote || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}