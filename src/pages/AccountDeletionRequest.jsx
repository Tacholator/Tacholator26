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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AccountDeletionRequest() {
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleConfirmDelete = async () => {
    setErrorMsg('');
    setIsDeleting(true);
    try {
      const res = await base44.functions.invoke('deleteOwnAccount', {
        reason,
        additionalInfo
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setConfirmOpen(false);
      setDone(true);
      // Session is now invalid — clear it and return to login
      setTimeout(() => {
        base44.auth.logout();
      }, 2500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      setErrorMsg(
        error?.message?.includes('Unauthorized')
          ? 'Your session has expired. Please log in again and retry.'
          : 'Something went wrong deleting your account. Please try again.'
      );
      setConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Deleted</h2>
            <p className="text-slate-600 mb-6">
              Your account and associated data have been permanently removed. You'll be signed out shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
      <div className="max-w-2xl mx-auto py-8">
        <Link to={createPageUrl('ProfileSettings')} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">
          ← Back to settings
        </Link>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-800">Delete Your Account</CardTitle>
            <CardDescription>
              Permanently delete your Tacholator account and all associated data — no admin approval required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-rose-800">Warning: This action is permanent and immediate</p>
                <p className="text-sm text-rose-700">Once you confirm, your account will be deleted right away. All your data including lessons, progress, and homework will be permanently removed. This cannot be undone.</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.full_name || ''}
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

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-300 text-rose-700 text-sm rounded-lg p-3">
                  {errorMsg}
                </div>
              )}
              <Button
                type="submit"
                disabled={!reason || isDeleting || !user?.id}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  'Delete My Account Now'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !isDeleting && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately and permanently delete <strong>{user?.email}</strong> and remove all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
              ) : 'Yes, Delete My Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}