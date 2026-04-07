import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

export default function AccountDeletionRequest() {
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setIsSending(true);
    try {
      await base44.entities.DeletionRequest.create({
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.full_name,
        reason,
        additionalInfo,
        status: 'pending'
      });
      await base44.integrations.Core.SendEmail({
        to: 'fasobah@gmail.com',
        subject: 'Account Deletion Request - Mobrage Tacholator',
        body: `Account Deletion Request\n\n` +
              `Name: ${user?.full_name || 'N/A'}\n` +
              `Email: ${user?.email}\n` +
              `User ID: ${user?.id}\n\n` +
              `Reason for Deletion: ${reason}\n\n` +
              `Additional Information:\n${additionalInfo || 'None provided'}\n\n` +
              `Request Date: ${moment().format('D MMM YYYY, h:mm a')}`
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to send deletion request:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted</h2>
            <p className="text-slate-600 mb-6">
              Your account deletion request has been sent to the admin. You will be contacted shortly regarding your request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-800">Account Deletion Request</CardTitle>
            <CardDescription>
              Submit a request to permanently delete your Tacholator account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-rose-800">Warning: This action is permanent</p>
                <p className="text-sm text-rose-700">Once your account is deleted, all your data including lessons, progress, and homework will be permanently removed.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={user?.full_name || ''} 
                  disabled 
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason for Deletion <span className="text-rose-500">*</span></Label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No longer using the service">No longer using the service</SelectItem>
                    <SelectItem value="Created a duplicate account">Created a duplicate account</SelectItem>
                    <SelectItem value="Privacy concerns">Privacy concerns</SelectItem>
                    <SelectItem value="Prefer a different driving instructor">Prefer a different driving instructor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Additional Information (Optional)</Label>
                <Textarea 
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Provide any additional details..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                disabled={!reason || isSending}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  'Submit Deletion Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}