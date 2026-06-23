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

        {/* Section 9: Test-day calm plan */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <Sparkles className="w-5 h-5 text-[#F7B602]" />
              Section 9: Create your test-day calm plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 mb-3">Before your test, write down your personal plan for managing nerves.</p>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">What will you do to stay calm before and during your test?</Label>
            <Textarea
              value={form.calm_plan}
              onChange={e => setField('calm_plan', e.target.value)}
              placeholder="Example: I will sleep early, avoid too much caffeine, arrive on time, take slow breaths, listen carefully, and focus only on safe driving."
              rows={4}
            />
          </CardContent>
        </Card>

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

        {/* Section 13: Main Worries */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <AlertTriangle className="w-5 h-5 text-[#F7B602]" />
              Section 13: My Main Worry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAIN_WORRIES.map(worry => (
                <div key={worry} className="flex items-center gap-2">
                  <Checkbox
                    id={`worry_${worry}`}
                    checked={form.main_test_worries.includes(worry)}
                    onCheckedChange={() => toggleArrayItem('main_test_worries', worry)}
                  />
                  <Label htmlFor={`worry_${worry}`} className="font-normal cursor-pointer text-sm text-slate-700">{worry}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 14: Nerve Control Plan */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <Brain className="w-5 h-5 text-[#F7B602]" />
              Section 14: My Nerve Control Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">What practical steps will you take to manage this worry?</Label>
            <Textarea
              value={form.nerve_control_plan}
              onChange={e => setField('nerve_control_plan', e.target.value)}
              placeholder="Example: I will practise more mock tests, ask my instructor to reduce prompts, use breathing techniques, and focus on one instruction at a time."
              rows={4}
            />
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedPupil, setExpandedPupil] = useState(null);
  const [recommendations, setRecommendations] = useState({});

  const { data: instructorPupils } = useQuery({
    queryKey: ['instructorPupilsForNerves', instructorId],
    queryFn: async () => {
      const results = await base44.entities.Pupil.filter({ instructorId });
      return results;
    },
    enabled: !!instructorId
  });

  const { data: pupilPlans } = useQuery({
    queryKey: ['instructorNervePlans', instructorId],
    queryFn: async () => {
      const results = await base44.entities.NerveManagementPlan.filter({ instructorId });
      return results;
    },
    enabled: !!instructorId
  });

  const handleSaveRecommendation = async (planId) => {
    try {
      await base44.entities.NerveManagementPlan.update(planId, {
        instructorRecommendations: recommendations[planId] ?? ''
      });
      queryClient.invalidateQueries({ queryKey: ['instructorNervePlans'] });
      toast({ title: 'Recommendation saved' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

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

        {/* Pupil Plans */}
        <div>
          <h2 className="text-lg font-bold text-[#071739] mb-3">Pupil Nerve Plans</h2>
          {instructorPupils?.length === 0 && (
            <Card className="border border-slate-200">
              <CardContent className="py-10 text-center">
                <Brain className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">No pupils found.</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {instructorPupils?.map(pupil => {
              const plan = pupilPlans?.find(p => p.pupilId === pupil.id);
              const isExpanded = expandedPupil === pupil.id;
              return (
                <Card key={pupil.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <button
                      onClick={() => setExpandedPupil(isExpanded ? null : pupil.id)}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        <div className="text-left">
                          <p className="font-semibold text-[#071739]">{pupil.firstName} {pupil.lastName}</p>
                          <p className="text-xs text-slate-500">
                            {plan ? 'Plan completed' : 'No plan yet'}
                          </p>
                        </div>
                      </div>
                      {plan && (
                        <div className="flex items-center gap-2">
                          {plan.nerve_confidence_rating > 0 && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              {CONFIDENCE_OPTIONS.find(c => c.value === plan.nerve_confidence_rating)?.label || `Rating: ${plan.nerve_confidence_rating}`}
                            </Badge>
                          )}
                          {plan.instructorRecommendations && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Reviewed</Badge>
                          )}
                        </div>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {plan ? (
                          <>
                            {plan.nerve_confidence_rating > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Confidence Rating</p>
                                <Badge className="bg-amber-100 text-amber-800 text-xs">
                                  {CONFIDENCE_OPTIONS.find(c => c.value === plan.nerve_confidence_rating)?.label}
                                </Badge>
                              </div>
                            )}
                            {plan.main_test_worries?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Main Worries</p>
                                <div className="flex flex-wrap gap-2">
                                  {plan.main_test_worries.map(w => (
                                    <Badge key={w} className="bg-rose-100 text-rose-700 text-xs">{w}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {plan.calm_plan && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Test-day Calm Plan</p>
                                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{plan.calm_plan}</p>
                              </div>
                            )}
                            {plan.nerve_control_plan && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Nerve Control Plan</p>
                                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{plan.nerve_control_plan}</p>
                              </div>
                            )}
                            {plan.checklist_items?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Checklist Items</p>
                                <div className="flex flex-wrap gap-2">
                                  {plan.checklist_items.map(item => (
                                    <Badge key={item} className="bg-blue-100 text-blue-700 text-xs">{item}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Your Recommendations</Label>
                              <Textarea
                                value={recommendations[plan.id] ?? plan.instructorRecommendations ?? ''}
                                onChange={e => setRecommendations(prev => ({ ...prev, [plan.id]: e.target.value }))}
                                placeholder="Add tips and encouragement for managing test-day nerves..."
                                rows={3}
                              />
                              <Button
                                size="sm"
                                className="mt-2 bg-[#071739] hover:bg-[#0d2a5e] text-white"
                                onClick={() => handleSaveRecommendation(plan.id)}
                              >
                                <Save className="w-3.5 h-3.5 mr-1" />
                                Save Recommendation
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-slate-500 italic">This pupil hasn't created a nerve management plan yet.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 italic text-center pb-6">
          Tacholator's Manage Nerves page is a learner support tool. It does not replace professional advice from your driving instructor, medical advice, or official DVSA guidance. If anxiety is seriously affecting your wellbeing, consider speaking to a healthcare professional.
        </p>
      </div>
    </div>
  );
}