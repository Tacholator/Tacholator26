import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Gift, RefreshCw, Star, Users, Sparkles, Share2 } from 'lucide-react';

function generateCode(name) {
  const prefix = name ? name.replace(/\s+/g, '').substring(0, 4).toUpperCase() : 'REF';
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${suffix}`;
}

const DEFAULT_PROMO_HEADING = 'You Both Win';
const DEFAULT_PROMO_TEXT = 'Once they commit to 10+ hours, you receive a FREE 1.5-hour driving lesson!';

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

  const { data: instructorProfile } = useQuery({
    queryKey: ['referralInstructorProfile', pupilProfile?.instructorId],
    queryFn: async () => {
      const results = await base44.entities.Instructor.filter({ created_by: pupilProfile.instructorEmail });
      return results[0] || null;
    },
    enabled: !!pupilProfile?.instructorEmail,
  });

  const promoHeading = instructorProfile?.referralPromoHeading?.trim() || DEFAULT_PROMO_HEADING;
  const promoText = instructorProfile?.referralPromoText?.trim() || DEFAULT_PROMO_TEXT;

  const steps = [
    { number: '1', emoji: '👋', title: 'Share Your Code', desc: 'Send your unique referral code to a friend who wants to start driving lessons.' },
    { number: '2', emoji: '📋', title: 'They Sign Up', desc: 'Your friend shows the code to their instructor when booking their first lessons.' },
    { number: '3', emoji: '🎉', title: promoHeading, desc: promoText },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="max-w-lg mx-auto px-6 pt-6 pb-16 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#071739]">Refer a Friend</h1>
            <p className="text-slate-500 text-xs">Earn FREE lessons for every friend you refer</p>
          </div>
        </div>

        {/* Code Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-[#071739] px-6 py-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F7B602]" />
            <span className="text-white font-semibold text-sm">Your Unique Referral Code</span>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-[#F7B602] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : referral ? (
              <div className="space-y-4">
                {/* Code Display */}
                <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest mb-2">Share This Code</p>
                  <p className="text-4xl font-black text-[#071739] tracking-widest font-mono">{referral.code}</p>
                  {referral.status === 'redeemed' && (
                    <Badge className="mt-3 bg-green-500 text-white px-4 py-1">✓ Redeemed</Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCopy}
                    className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-bold gap-2 rounded-xl h-12"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: 'My Referral Code', text: `Use my referral code ${referral.code} when booking driving lessons!` });
                      } else {
                        handleCopy();
                      }
                    }}
                    className="border-[#071739]/20 text-[#071739] font-semibold gap-2 rounded-xl h-12"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-[#071739] mb-1">No code yet!</p>
                  <p className="text-slate-500 text-sm">Generate your unique referral code and start sharing.</p>
                </div>
                {pupilProfile ? (
                  <Button
                    onClick={() => createReferral()}
                    disabled={isCreating}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold gap-2 rounded-xl px-8 h-12"
                  >
                    {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate My Code
                  </Button>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                    You need to be linked to an instructor to generate a referral code.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-[#071739] text-base">How It Works</h2>
          </div>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {step.number}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold text-[#071739] text-sm">{step.emoji} {step.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 px-4">
          Rewards are subject to confirmation by your instructor. Code must be presented at time of sign-up.
        </p>
      </div>
    </div>
  );
}