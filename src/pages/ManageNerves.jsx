import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import NerveContent from '@/components/nerves/NerveContent';
import {
  CHECKLIST_ITEMS, MAIN_WORRIES, CONFIDENCE_OPTIONS, getEmptyNerveForm
} from '@/components/nerves/nerveData';
import {
  Brain, Save, ClipboardList, HeartPulse, Sparkles, CheckCircle2,
  ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react';

export default function ManageNerves() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: pupilProfile } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byId.length > 0) return byId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id
  });

  const isInstructor = user?.role === 'admin';

  if (isInstructor) {
    return <InstructorView instructorId={user?.id} />;
  }

  return (
    <LearnerView pupilProfile={pupilProfile} />
  );
}

/* ============ LEARNER VIEW ============ */

function LearnerView({ pupilProfile }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pupilId = pupilProfile?.id;

  const [form, setForm] = useState(getEmptyNerveForm());
  const [planId, setPlanId] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: myPlan } = useQuery({
    queryKey: ['myNervePlan', pupilId],
    queryFn: async () => {
      const results = await base44.entities.NerveManagementPlan.filter({ pupilId });
      return results[0] || null;
    },
    enabled: !!pupilId
  });

  useEffect(() => {
    if (myPlan) {
      setForm({
        calm_plan: myPlan.calm_plan || '',
        checklist_items: myPlan.checklist_items || [],
        nerve_confidence_rating: myPlan.nerve_confidence_rating || 0,
        main_test_worries: myPlan.main_test_worries || [],
        nerve_control_plan: myPlan.nerve_control_plan || ''
      });
      setPlanId(myPlan.id);
    }
  }, [myPlan]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleArrayItem = (key, value) => {
    setForm(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pupilId,
        pupilName: pupilProfile ? `${pupilProfile.firstName || ''} ${pupilProfile.lastName || ''}`.trim() : '',
        instructorId: pupilProfile?.instructorId || null,
        ...form
      };
      if (planId) {
        return base44.entities.NerveManagementPlan.update(planId, payload);
      }
      return base44.entities.NerveManagementPlan.create(payload);
    },
    onSuccess: (data) => {
      if (!planId) setPlanId(data.id);
      queryClient.invalidateQueries({ queryKey: ['myNervePlan'] });
      queryClient.invalidateQueries({ queryKey: ['nerveManagementCard'] });
      setSaved(true);
      toast({ title: 'Your nerve management plan has been saved. Keep practising these techniques during your lessons so they feel natural on test day.' });
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' })
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h1 className="text-2xl font-bold text-[#071739]">Manage Nerves</h1>
          </div>
        </div>

        {/* Informational Content (Intro + Sections 1-8, 10) */}
        <NerveContent />

        {/* Section 11: Checklist */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <ClipboardList className="w-5 h-5 text-[#F7B602]" />
              Section 11: Tacholator Nerve Management Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-slate-600 mb-3">Before my test, I will:</p>
            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map(item => (
                <div key={item} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <Checkbox
                    id={`chk_${item}`}
                    checked={form.checklist_items.includes(item)}
                    onCheckedChange={() => toggleArrayItem('checklist_items', item)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`chk_${item}`} className="font-normal cursor-pointer text-sm text-slate-700">{item}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 12: Confidence Rating */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <HeartPulse className="w-5 h-5 text-[#F7B602]" />
              Section 12: My Confidence Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm font-medium text-slate-700 mb-4 block">How confident do you feel about managing your nerves?</Label>
            <div className="px-2">
              <Slider
                value={[form.nerve_confidence_rating]}
                min={1}
                max={5}
                step={1}
                onValueChange={(val) => setField('nerve_confidence_rating', val[0])}
                className="mb-3"
              />
              <div className="flex justify-between text-xs text-slate-500">
                {CONFIDENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setField('nerve_confidence_rating', opt.value)}
                    className={`flex flex-col items-center gap-1 transition ${form.nerve_confidence_rating === opt.value ? 'text-[#071739] font-bold' : ''}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${form.nerve_confidence_rating === opt.value ? 'bg-[#F7B602] text-[#071739]' : 'bg-slate-200 text-slate-500'}`}>{opt.value}</span>
                    <span className="text-center max-w-[60px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="pb-6">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !pupilId}
            className="w-full bg-[#071739] hover:bg-[#0d2a5e] text-white py-3 text-base font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save My Nerve Plan'}
          </Button>

          {saved && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Your nerve management plan has been saved. Keep practising these techniques during your lessons so they feel natural on test day.
              </p>
            </div>
          )}

          {!pupilId && (
            <p className="text-xs text-slate-500 text-center mt-2">Link your pupil profile to save your plan.</p>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-500 italic text-center mt-4">
            Tacholator's Manage Nerves page is a learner support tool. It does not replace professional advice from your driving instructor, medical advice, or official DVSA guidance. If anxiety is seriously affecting your wellbeing, consider speaking to a healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ INSTRUCTOR VIEW ============ */

function InstructorView({ instructorId }) {
  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h1 className="text-2xl font-bold text-[#071739]">Manage Nerves</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Review your pupils' nerve management plans and add personalised recommendations.
          </p>
        </div>

        {/* Informational Content (shared with learners) */}
        <NerveContent />

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 italic text-center pb-6">
          Tacholator's Manage Nerves page is a learner support tool. It does not replace professional advice from your driving instructor, medical advice, or official DVSA guidance. If anxiety is seriously affecting your wellbeing, consider speaking to a healthcare professional.
        </p>
      </div>
    </div>
  );
}