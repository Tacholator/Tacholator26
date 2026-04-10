import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Copy, Check, Gift, RefreshCw } from 'lucide-react';

function generateCode(name) {
  const prefix = name ? name.replace(/\s+/g, '').substring(0, 4).toUpperCase() : 'REF';
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${suffix}`;
}

export default function ReferAFriend() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: referral, isLoading } = useQuery({
    queryKey: ['myReferral', pupilProfile?.id],
    queryFn: async () => {
      const results = await base44.entities.Referral.filter({ pupilId: pupilProfile.id });
      return results[0] || null;
    },
    enabled: !!pupilProfile?.id,
  });

  const { mutate: createReferral, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const pupilName = `${pupilProfile.firstName} ${pupilProfile.lastName}`.trim();
      const code = generateCode(pupilName);
      return base44.entities.Referral.create({
        pupilId: pupilProfile.id,
        pupilName,
        pupilEmail: pupilProfile.email || user?.email,
        instructorId: pupilProfile.instructorId,
        code,
        status: 'active',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myReferral', pupilProfile?.id] }),
  });

  const handleCopy = () => {
    if (referral?.code) {
      navigator.clipboard.writeText(referral.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 p-6 lg:p-8">
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-slate-600"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F7B602]/10 rounded-2xl mb-4">
            <Gift className="w-8 h-8 text-[#F7B602]" />
          </div>
          <h1 className="text-2xl font-bold text-[#071739] mb-2">Refer a Friend</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Share your unique referral code with a friend. They can show it to their instructor when they sign up.
          </p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[#071739]" />
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#F7B602] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : referral ? (
              <div className="space-y-4">
                <div className="bg-[#071739] rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Your Code</p>
                  <p className="text-3xl font-bold text-[#F7B602] tracking-widest font-mono">{referral.code}</p>
                  {referral.status === 'redeemed' && (
                    <Badge className="mt-3 bg-green-500 text-white">Redeemed</Badge>
                  )}
                </div>

                <Button
                  onClick={handleCopy}
                  className="w-full bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>

                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 space-y-1">
                  <p className="font-medium text-slate-700">How it works:</p>
                  <p>1. Share your code with a friend who is learning to drive.</p>
                  <p>2. They show the code to their instructor when signing up.</p>
                  <p>3. The instructor logs it in the Referral Program.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <p className="text-slate-500 text-sm">You don't have a referral code yet.</p>
                {pupilProfile ? (
                  <Button
                    onClick={() => createReferral()}
                    disabled={isCreating}
                    className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold gap-2"
                  >
                    {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                    Generate My Code
                  </Button>
                ) : (
                  <p className="text-xs text-slate-400">You need to be linked to an instructor to generate a code.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}