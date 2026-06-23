import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Brain, Save, ChevronDown, ChevronRight, HeartPulse, Sparkles, CheckCircle2
} from 'lucide-react';
import { NERVES_OPTIONS } from '@/components/readiness/readinessLogic';

const TECHNIQUE_DESCRIPTIONS = {
  'Breathing techniques': 'Slow, deep breaths to calm your nervous system before and during the test.',
  'Mock test practice': 'Simulating test conditions to build familiarity and reduce anxiety.',
  'Practising difficult routes': 'Driving the test routes repeatedly until they feel natural.',
  'Positive self-talk': 'Replacing negative thoughts with encouraging, confidence-building statements.',
  'Knowing what to expect on test day': 'Understanding the test format, so there are no surprises.',
  'Other': 'Any other technique that helps you stay calm and focused.'
};

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
  const pupilId = pupilProfile?.id;
  const instructorId = isInstructor ? user?.id : null;

  // For learners: fetch their own plan
  const { data: myPlan } = useQuery({
    queryKey: ['myNervePlan', pupilId],
    queryFn: async () => {
      const results = await base44.entities.NerveManagementPlan.filter({ pupilId });
      return results[0] || null;
    },
    enabled: !isInstructor && !!pupilId
  });

  // For instructors: fetch all their pupils' plans
  const { data: instructorPupils } = useQuery({
    queryKey: ['instructorPupilsForNerves', instructorId],
    queryFn: async () => {
      const results = await base44.entities.Pupil.filter({ instructorId });
      return results;
    },
    enabled: isInstructor && !!instructorId
  });

  const { data: pupilPlans, refetch: refetchPupilPlans } = useQuery({
    queryKey: ['instructorNervePlans', instructorId],
    queryFn: async () => {
      const results = await base44.entities.NerveManagementPlan.filter({ instructorId });
      return results;
    },
    enabled: isInstructor && !!instructorId
  });

  // Learner form state
  const [techniques, setTechniques] = useState([]);
  const [personalPlan, setPersonalPlan] = useState('');
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    if (myPlan) {
      setTechniques(myPlan.selectedTechniques || []);
      setPersonalPlan(myPlan.personalPlan || '');
      setPlanId(myPlan.id);
    }
  }, [myPlan]);

  const toggleTechnique = (tech) => {
    setTechniques(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pupilId,
        pupilName: pupilProfile ? `${pupilProfile.firstName || ''} ${pupilProfile.lastName || ''}`.trim() : '',
        instructorId: pupilProfile?.instructorId || null,
        selectedTechniques: techniques,
        personalPlan
      };
      if (planId) {
        return base44.entities.NerveManagementPlan.update(planId, payload);
      }
      return base44.entities.NerveManagementPlan.create(payload);
    },
    onSuccess: (data) => {
      if (!planId) setPlanId(data.id);
      queryClient.invalidateQueries({ queryKey: ['myNervePlan'] });
      toast({ title: 'Nerves plan saved successfully' });
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' })
  });

  // Instructor view
  const [expandedPupil, setExpandedPupil] = useState(null);
  const [recommendations, setRecommendations] = useState({});

  const handleSaveRecommendation = async (planId) => {
    try {
      await base44.entities.NerveManagementPlan.update(planId, {
        instructorRecommendations: recommendations[planId] ?? ''
      });
      await refetchPupilPlans();
      toast({ title: 'Recommendation saved' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  if (isInstructor) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#F7B602]" />
              </div>
              <h1 className="text-2xl font-bold text-[#071739]">Manage Nerves</h1>
            </div>
            <p className="text-slate-600 text-sm">
              View your pupils' test-day nerves management plans and add personalised recommendations.
            </p>
          </div>

          {instructorPupils?.length === 0 && (
            <Card className="border border-slate-200">
              <CardContent className="py-10 text-center">
                <Brain className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">No pupils found.</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
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
                            {plan ? `${(plan.selectedTechniques || []).length} technique(s) selected` : 'No plan yet'}
                          </p>
                        </div>
                      </div>
                      {plan?.instructorRecommendations && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Reviewed</Badge>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {plan ? (
                          <>
                            {plan.selectedTechniques?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-2">Techniques Practised</p>
                                <div className="flex flex-wrap gap-2">
                                  {plan.selectedTechniques.map(t => (
                                    <Badge key={t} className="bg-amber-100 text-amber-800 text-xs">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {plan.personalPlan && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Pupil's Personal Plan</p>
                                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{plan.personalPlan}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                                Your Recommendations
                              </Label>
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
                          <p className="text-sm text-slate-500 italic">This pupil hasn't created a nerves management plan yet.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Learner view
  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h1 className="text-2xl font-bold text-[#071739]">Manage Nerves</h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Feeling nervous before your driving test is completely normal. Select the techniques you've practised and create a personal plan to help you stay calm and focused on test day.
          </p>
        </div>

        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <HeartPulse className="w-5 h-5 text-[#F7B602]" />
              Techniques You Practise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {NERVES_OPTIONS.map(opt => (
                <div key={opt} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <Checkbox
                    id={`nerve_${opt}`}
                    checked={techniques.includes(opt)}
                    onCheckedChange={() => toggleTechnique(opt)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor={`nerve_${opt}`} className="font-medium cursor-pointer text-sm text-slate-800">{opt}</Label>
                    <p className="text-xs text-slate-500 mt-0.5">{TECHNIQUE_DESCRIPTIONS[opt]}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
              <Sparkles className="w-5 h-5 text-[#F7B602]" />
              Your Personal Nerves Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={personalPlan}
              onChange={e => setPersonalPlan(e.target.value)}
              placeholder="Write your step-by-step plan for managing nerves on test day. For example: '1. Arrive 10 minutes early. 2. Take 3 deep breaths before starting the engine. 3. Remind myself I've passed 2 mock tests...'"
              rows={6}
            />
          </CardContent>
        </Card>

        {myPlan?.instructorRecommendations && (
          <Card className="border border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Instructor's Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-900 whitespace-pre-wrap">{myPlan.instructorRecommendations}</p>
            </CardContent>
          </Card>
        )}

        <div className="pb-6">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !pupilId}
            className="w-full bg-[#071739] hover:bg-[#0d2a5e] text-white py-3 text-base font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save My Nerves Plan'}
          </Button>
          {!pupilId && (
            <p className="text-xs text-slate-500 text-center mt-2">Link your pupil profile to save your plan.</p>
          )}
        </div>
      </div>
    </div>
  );
}