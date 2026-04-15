import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Search, CheckCircle, Clock, Gift, Sparkles, Save, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

const DEFAULT_HEADING = 'Refer a Friend & Earn Free Lessons!';
const DEFAULT_TEXT = 'Bring a new pupil who commits to 10+ hours → Get a FREE 1.5-hour lesson!';

function countWords(str) {
  return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
}

export default function InstructorReferralProgram() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [redeemingId, setRedeemingId] = useState(null);
  const [redeemName, setRedeemName] = useState('');
  const [promoHeading, setPromoHeading] = useState('');
  const [promoText, setPromoText] = useState('');
  const [promoSaved, setPromoSaved] = useState(false);
  const [useCustomMessage, setUseCustomMessage] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: instructorProfile } = useQuery({
    queryKey: ['instructorProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.Instructor.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['instructorReferrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Referrals store instructorId as the instructor's User ID (not Instructor entity ID)
      return base44.entities.Referral.filter({ instructorId: user.id });
    },
    enabled: !!user?.id,
  });

  // Sync promo fields when instructor profile loads
  useEffect(() => {
    if (instructorProfile) {
      setPromoHeading(instructorProfile.referralPromoHeading || '');
      setPromoText(instructorProfile.referralPromoText || '');
      setUseCustomMessage(!!(instructorProfile.referralPromoHeading || instructorProfile.referralPromoText));
    }
  }, [instructorProfile]);

  const { mutate: savePromo, isPending: isSavingPromo } = useMutation({
    mutationFn: async () => {
      if (!instructorProfile?.id) throw new Error('Instructor profile not found');
      return base44.entities.Instructor.update(instructorProfile.id, {
        referralPromoHeading: useCustomMessage ? (promoHeading.trim() || null) : null,
        referralPromoText: useCustomMessage ? (promoText.trim() || null) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorProfile', user?.email] });
      setPromoSaved(true);
      setTimeout(() => setPromoSaved(false), 2500);
    },
  });

  const headingWordCount = countWords(promoHeading);
  const textWordCount = countWords(promoText);
  const headingOverLimit = headingWordCount > 8;
  const textOverLimit = textWordCount > 16;
  const savedIsCustom = !!(instructorProfile?.referralPromoHeading || instructorProfile?.referralPromoText);
  const promoChanged = useCustomMessage !== savedIsCustom || promoHeading !== (instructorProfile?.referralPromoHeading || '') || promoText !== (instructorProfile?.referralPromoText || '');

  const { mutate: toggleReferralProgram, isPending: isTogglingProgram } = useMutation({
    mutationFn: async (enabled) => {
      if (!instructorProfile?.id) throw new Error('Instructor profile not found');
      return base44.entities.Instructor.update(instructorProfile.id, { referralProgramEnabled: enabled });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructorProfile', user?.email] }),
  });

  const { mutate: markRedeemed, isPending } = useMutation({
    mutationFn: async ({ id }) => {
      return base44.entities.Referral.update(id, {
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
        redeemedByName: redeemName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorReferrals'] });
      setRedeemingId(null);
      setRedeemName('');
    },
  });

  const filtered = referrals.filter(r =>
    r.pupilName?.toLowerCase().includes(search.toLowerCase()) ||
    r.code?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = referrals.filter(r => r.status === 'active').length;
  const redeemedCount = referrals.filter(r => r.status === 'redeemed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-16 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#071739]">Referral Program</h1>
              <p className="text-slate-500 text-xs">Track and redeem referral codes generated by your pupils.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md">
            <span className="text-sm font-medium text-[#071739]">Show to Pupils</span>
            <Switch
              checked={instructorProfile?.referralProgramEnabled === true}
              onCheckedChange={(checked) => toggleReferralProgram(checked)}
              disabled={isTogglingProgram}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#071739]">{activeCount}</p>
              <p className="text-xs text-slate-500 font-medium">Active Codes</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#071739]">{redeemedCount}</p>
              <p className="text-xs text-slate-500 font-medium">Redeemed</p>
            </div>
          </div>
        </div>

        {/* Promo Message Editor */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="bg-[#071739] px-6 py-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#F7B602]" />
            <span className="text-white font-semibold text-sm">Promo Message for Learners</span>
          </div>
          <div className="p-6 space-y-4">
            {/* Default message always visible */}
            <div className="bg-[#d4f74e] border border-[#b8e030] rounded-xl p-4">
              <p className="text-xs text-[#3a5c00] font-semibold uppercase tracking-wider mb-2">Default message</p>
              <p className="font-bold text-[#1a3300] text-sm">{DEFAULT_HEADING}</p>
              <p className="text-[#2d4d00] text-xs mt-1 leading-relaxed">{DEFAULT_TEXT}</p>
            </div>

            {/* Toggle between default and custom */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#071739]">Use custom message</p>
                <p className="text-xs text-slate-400">Override the default with your own text</p>
              </div>
              <Switch
                checked={useCustomMessage}
                onCheckedChange={setUseCustomMessage}
              />
            </div>

            {/* Custom message editor — only shown when toggled on */}
            {useCustomMessage && (
              <>
                {/* Heading */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#071739]">Heading</label>
                    <span className={`text-xs font-medium ${headingOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
                      {headingWordCount}/8 words
                    </span>
                  </div>
                  <Input
                    value={promoHeading}
                    onChange={e => setPromoHeading(e.target.value)}
                    placeholder="Enter custom heading..."
                    className={`rounded-xl border ${headingOverLimit ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200'}`}
                  />
                  {headingOverLimit && (
                    <p className="text-xs text-red-500">Heading cannot exceed 8 words.</p>
                  )}
                </div>

                {/* Body text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#071739]">Body Text</label>
                    <span className={`text-xs font-medium ${textOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
                      {textWordCount}/16 words
                    </span>
                  </div>
                  <Textarea
                    value={promoText}
                    onChange={e => setPromoText(e.target.value)}
                    placeholder="Enter custom body text..."
                    rows={3}
                    className={`rounded-xl border resize-none ${textOverLimit ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200'}`}
                  />
                  {textOverLimit && (
                    <p className="text-xs text-red-500">Body text cannot exceed 16 words.</p>
                  )}
                </div>

                {/* Preview */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <p className="text-xs text-sky-600 font-semibold uppercase tracking-wider mb-1">Preview</p>
                  <p className="font-bold text-[#071739] text-sm">{promoHeading.trim() || DEFAULT_HEADING}</p>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">{promoText.trim() || DEFAULT_TEXT}</p>
                </div>
              </>
            )}

            <Button
              onClick={() => savePromo()}
              disabled={isSavingPromo || headingOverLimit || textOverLimit || !promoChanged}
              className="bg-[#071739] hover:bg-[#0a2050] text-white rounded-xl gap-2"
            >
              <Save className="w-4 h-4" />
              {promoSaved ? 'Saved!' : isSavingPromo ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by pupil name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white border-0 shadow-md rounded-xl h-11"
          />
        </div>

        {/* Referrals List */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="bg-[#071739] px-6 py-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F7B602]" />
            <span className="text-white font-semibold text-sm">All Referral Codes</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#F7B602] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-400" />
              </div>
              <p className="font-semibold text-[#071739] mb-1">No referral codes yet</p>
              <p className="text-sm text-slate-400">Codes appear here when your pupils generate them from the app.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((referral) => (
                <div key={referral.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#071739] truncate">{referral.pupilName || 'Unknown Pupil'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{referral.pupilEmail}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-[#071739] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-1 rounded-lg tracking-wider">
                        {referral.code}
                      </span>
                      <Badge className={
                        referral.status === 'redeemed'
                          ? 'bg-green-100 text-green-700 border-0'
                          : 'bg-blue-100 text-blue-700 border-0'
                      }>
                        {referral.status === 'redeemed' ? '✓ Redeemed' : '● Active'}
                      </Badge>
                    </div>
                    {referral.status === 'redeemed' && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        Used by <strong className="text-slate-600">{referral.redeemedByName || 'Unknown'}</strong>
                        {referral.redeemedAt && ` · ${format(new Date(referral.redeemedAt), 'd MMM yyyy')}`}
                      </p>
                    )}
                    <p className="text-xs text-slate-300 mt-1">
                      Generated {referral.created_date ? format(new Date(referral.created_date), 'd MMM yyyy') : ''}
                    </p>
                  </div>

                  {referral.status === 'active' && (
                    <div className="shrink-0">
                      {redeemingId === referral.id ? (
                        <div className="flex flex-col gap-2 items-end">
                          <Input
                            placeholder="Referee's name"
                            value={redeemName}
                            onChange={e => setRedeemName(e.target.value)}
                            className="w-36 text-sm h-9"
                          />
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => markRedeemed({ id: referral.id })}
                              disabled={isPending || !redeemName.trim()}
                              className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs rounded-lg"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setRedeemingId(null); setRedeemName(''); }}
                              className="h-8 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setRedeemingId(referral.id)}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs rounded-lg h-8 font-semibold"
                        >
                          Mark Redeemed
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 px-4">
          Mark a code as redeemed when a referred pupil commits to 10+ hours of training.
        </p>
      </div>
    </div>
  );
}