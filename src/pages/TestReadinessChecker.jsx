import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Car, CheckCircle2, XCircle, AlertCircle, ClipboardList,
  Brain, Trophy, Calendar, User, MapPin, Target, ChevronRight,
  AlertTriangle, Info, Shield
} from 'lucide-react';
import moment from 'moment';

const NERVES_OPTIONS = [
  'Breathing techniques',
  'Mock test practice',
  'Practising difficult routes',
  'Positive self-talk',
  'Knowing what to expect on test day',
  'Other'
];

const IMPROVEMENT_AREAS = [
  'Junctions', 'Roundabouts', 'Manoeuvres', 'Mirrors', 'Meeting traffic',
  'Dual carriageways', 'Speed control', 'Planning and awareness', 'Parking',
  'Independent driving', 'Show me/tell me questions', 'Other'
];

function calculateReadiness(form) {
  let score = 0;

  // Independent driving: 20 points
  if (form.independent_driving_status === 'Yes') score += 20;
  else if (form.independent_driving_status === 'Sometimes') score += 10;

  // No serious mistakes: 25 points
  if (form.safe_driving_status === 'Yes, I am not making serious or dangerous mistakes') score += 25;
  else if (form.safe_driving_status === 'Not sure') score += 10;

  // Mock tests passed: 25 points
  const mocks = parseInt(form.mock_tests_passed_count) || 0;
  if (mocks >= 2) score += 25;
  else if (mocks === 1) score += 10;

  // Nerves management plan: 10 points
  if (form.nerves_management_plan?.trim()) score += 10;

  // Instructor confirmation: 20 points
  if (form.instructor_ready_confirmation === 'Yes') score += 20;

  // Determine result
  const isReady =
    form.independent_driving_status === 'Yes' &&
    form.safe_driving_status === 'Yes, I am not making serious or dangerous mistakes' &&
    mocks >= 2 &&
    form.instructor_ready_confirmation === 'Yes' &&
    form.nerves_management_plan?.trim();

  const isNotReady =
    mocks < 2 ||
    form.instructor_ready_confirmation === 'No' ||
    form.instructor_ready_confirmation === 'Not yet discussed' ||
    form.safe_driving_status === 'No, I still make serious or dangerous mistakes' ||
    form.independent_driving_status === 'No';

  let result = 'Almost Ready';
  if (isReady) result = 'Ready for Test';
  else if (isNotReady) result = 'Not Ready Yet';

  return { score, result };
}

function ResultCard({ result, score, form, onReset }) {
  const isReady = result === 'Ready for Test';
  const isAlmost = result === 'Almost Ready';

  const resultConfig = {
    'Ready for Test': {
      color: 'bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-500 text-white',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      message: "Your answers suggest that you may be ready for your practical driving test. You have passed at least 2 mock tests, your instructor has confirmed you are ready, and you appear to meet the main readiness checks. Continue practising safely and follow your instructor's final advice.",
      actions: [
        "Speak with your instructor about final preparation.",
        "Keep practising your test routes and independent driving.",
        "Review show me/tell me questions.",
        "Practise managing your nerves."
      ]
    },
    'Almost Ready': {
      color: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-500 text-white',
      icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
      message: "You are close, but there are still areas to strengthen before your test. Review the areas highlighted below and speak with your instructor before deciding whether to take your test.",
      actions: [
        "Book another mock test.",
        "Review your recent faults with your instructor.",
        "Practise the areas you selected for improvement.",
        "Create a test-day nerves plan."
      ]
    },
    'Not Ready Yet': {
      color: 'bg-rose-50 border-rose-200',
      badge: 'bg-rose-500 text-white',
      icon: <XCircle className="w-8 h-8 text-rose-500" />,
      message: "Your answers suggest that you may not be ready for your practical driving test yet. To qualify as ready in Tacholator, you should have passed at least 2 mock tests and your instructor should have confirmed that you are ready. Keep practising and use your instructor's feedback to prepare safely.",
      actions: [
        "Do not rush your test.",
        "Work with your instructor on the areas highlighted.",
        "Aim to pass at least 2 mock tests.",
        "Wait until your instructor confirms you are ready."
      ]
    }
  };

  const cfg = resultConfig[result];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className={`border-2 ${cfg.color}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {cfg.icon}
            <div>
              <Badge className={`${cfg.badge} text-sm px-3 py-1`}>{result}</Badge>
              <p className="text-slate-600 text-sm mt-1">Readiness Score: {score}/100</p>
            </div>
          </div>
          <div className="mb-4">
            <Progress value={score} className="h-3" />
          </div>
          <p className="text-slate-700 leading-relaxed">{cfg.message}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Suggested Next Actions</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {cfg.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <ChevronRight className="w-4 h-4 text-[#F7B602] shrink-0 mt-0.5" />
                {action}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Your Summary</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SummaryRow label="Independent Driving" value={form.independent_driving_status} />
          <SummaryRow label="Avoiding Serious Mistakes" value={form.safe_driving_status} />
          <SummaryRow label="Mock Tests Passed" value={form.mock_tests_passed_count} />
          <SummaryRow label="Instructor Confirmation" value={form.instructor_ready_confirmation} />
          <SummaryRow label="Test Booked" value={form.test_booked_status} />
          {form.test_date && <SummaryRow label="Test Date" value={moment(form.test_date).format('DD MMM YYYY')} />}
          {form.improvement_areas?.length > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Areas to Improve</span>
              <span className="text-slate-800 text-right max-w-xs">{form.improvement_areas.join(', ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500 italic text-center">
        Tacholator's Test Readiness Checker is a support tool only. It does not replace professional driving instruction, DVSA guidance, or your instructor's judgement. Passing this checker does not guarantee that you will pass your practical driving test.
      </p>

      <Button onClick={onReset} variant="outline" className="w-full">Start a New Check</Button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-100">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-800">{value ?? '—'}</span>
    </div>
  );
}

export default function TestReadinessChecker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    independent_driving_status: '',
    independent_driving_notes: '',
    safe_driving_status: '',
    recent_faults_notes: '',
    mock_tests_passed_count: '',
    latest_mock_test_date: '',
    latest_mock_test_result: '',
    latest_mock_test_minor_faults: '',
    mock_test_independent_driving: '',
    mock_test_manoeuvres: '',
    mock_test_test_conditions: '',
    nerves_management_methods: [],
    nerves_management_plan: '',
    instructor_ready_confirmation: '',
    instructor_name: '',
    instructor_confirmation_date: '',
    instructor_comments: '',
    test_booked_status: '',
    test_date: '',
    test_time: '',
    test_centre: '',
    improvement_areas: [],
    learner_extra_notes: ''
  });

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      const byId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byId.length > 0) return byId[0];
      const all = await base44.entities.Pupil.list();
      return all.find(p => p.email?.toLowerCase() === user.email?.toLowerCase()) || null;
    },
    enabled: !!user?.id
  });

  const daysUntilTest = form.test_date
    ? moment(form.test_date).startOf('day').diff(moment().startOf('day'), 'days')
    : null;

  const saveMutation = useMutation({
    mutationFn: async (data) => base44.entities.TestReadinessCheck.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReadinessChecks'] });
      setSubmitted(true);
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' })
  });

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const toggleArrayItem = (key, value) => {
    setForm(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.independent_driving_status) e.independent_driving_status = 'Please select an option';
    if (!form.safe_driving_status) e.safe_driving_status = 'Please select an option';
    if (form.mock_tests_passed_count === '' || isNaN(parseInt(form.mock_tests_passed_count))) e.mock_tests_passed_count = 'Please enter a number';
    if (parseInt(form.mock_tests_passed_count) < 0) e.mock_tests_passed_count = 'Cannot be negative';
    if (!form.instructor_ready_confirmation) e.instructor_ready_confirmation = 'Please select an option';
    if (!form.test_booked_status) e.test_booked_status = 'Please select an option';
    if (form.test_booked_status === 'Yes') {
      if (!form.test_date) e.test_date = 'Please enter your test date';
      if (!form.test_time) e.test_time = 'Please enter your test time';
      if (!form.test_centre) e.test_centre = 'Please enter your test centre';
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast({ title: 'Please complete all required fields', variant: 'destructive' });
      return;
    }
    const { score, result } = calculateReadiness(form);
    setFinalResult(result);
    setFinalScore(score);
    saveMutation.mutate({
      learner_id: pupil?.id || user?.id,
      learner_name: pupil ? `${pupil.firstName || ''} ${pupil.lastName || ''}`.trim() : user?.full_name,
      instructor_id: pupil?.instructorId || null,
      instructor_name: form.instructor_name || null,
      ...form,
      mock_tests_passed_count: parseInt(form.mock_tests_passed_count) || 0,
      latest_mock_test_minor_faults: form.latest_mock_test_minor_faults ? parseInt(form.latest_mock_test_minor_faults) : null,
      days_until_test: daysUntilTest,
      readiness_result: result,
      readiness_score: score
    });
  };

  if (submitted && finalResult) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#071739]">Your Readiness Result</h1>
          </div>
          <ResultCard result={finalResult} score={finalScore} form={form} onReset={() => { setSubmitted(false); setFinalResult(null); setForm({ independent_driving_status: '', independent_driving_notes: '', safe_driving_status: '', recent_faults_notes: '', mock_tests_passed_count: '', latest_mock_test_date: '', latest_mock_test_result: '', latest_mock_test_minor_faults: '', mock_test_independent_driving: '', mock_test_manoeuvres: '', mock_test_test_conditions: '', nerves_management_methods: [], nerves_management_plan: '', instructor_ready_confirmation: '', instructor_name: '', instructor_confirmation_date: '', instructor_comments: '', test_booked_status: '', test_date: '', test_time: '', test_centre: '', improvement_areas: [], learner_extra_notes: '' }); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h1 className="text-2xl font-bold text-[#071739]">Test Readiness Checker</h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Use this checker to review whether you are ready for your practical driving test. This is based on the DVSA Ready to Pass guidance and helps you reflect on your independence, safety, mock test performance, nerves, and your instructor's feedback.
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Disclaimer:</strong> This checker is a guide only. It does not guarantee that you will pass your driving test. Always follow your instructor's professional advice before taking your test.
            </p>
          </div>
        </div>

        {/* Section 1: Independent Driving */}
        <SectionCard icon={<Car className="w-5 h-5 text-[#F7B602]" />} title="Section 1: Independent Driving">
          <FormField label="Can you drive consistently, confidently and independently without prompts from your instructor?" required error={errors.independent_driving_status}>
            <RadioGroup value={form.independent_driving_status} onValueChange={v => setField('independent_driving_status', v)} className="space-y-2 mt-2">
              {['Yes', 'No', 'Sometimes'].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`idrive_${opt}`} />
                  <Label htmlFor={`idrive_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
          <FormField label="Give an example of when you drove independently without help." className="mt-4">
            <Textarea value={form.independent_driving_notes} onChange={e => setField('independent_driving_notes', e.target.value)} placeholder="Describe a time you drove independently..." rows={2} />
          </FormField>
        </SectionCard>

        {/* Section 2: Serious Mistakes */}
        <SectionCard icon={<Shield className="w-5 h-5 text-[#F7B602]" />} title="Section 2: Serious or Dangerous Mistakes">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">To be test ready, you should not be making serious or dangerous faults. One serious or dangerous fault can result in a driving test fail.</p>
          </div>
          <FormField label="Are you currently avoiding serious or dangerous mistakes during lessons?" required error={errors.safe_driving_status}>
            <RadioGroup value={form.safe_driving_status} onValueChange={v => setField('safe_driving_status', v)} className="space-y-2 mt-2">
              {[
                'Yes, I am not making serious or dangerous mistakes',
                'No, I still make serious or dangerous mistakes',
                'Not sure'
              ].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`safe_${opt}`} />
                  <Label htmlFor={`safe_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
          <FormField label="List any serious, dangerous or repeated faults your instructor has recently mentioned." className="mt-4">
            <Textarea value={form.recent_faults_notes} onChange={e => setField('recent_faults_notes', e.target.value)} placeholder="e.g. pulling out at junctions without checking..." rows={2} />
          </FormField>
        </SectionCard>

        {/* Section 3: Mock Tests */}
        <SectionCard icon={<Trophy className="w-5 h-5 text-[#F7B602]" />} title="Section 3: Mock Test Results">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="How many mock driving tests have you passed?" required error={errors.mock_tests_passed_count}>
              <Input type="number" min={0} value={form.mock_tests_passed_count} onChange={e => setField('mock_tests_passed_count', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Date of most recent mock test">
              <Input type="date" value={form.latest_mock_test_date} onChange={e => setField('latest_mock_test_date', e.target.value)} />
            </FormField>
            <FormField label="Result of most recent mock test">
              <RadioGroup value={form.latest_mock_test_result} onValueChange={v => setField('latest_mock_test_result', v)} className="flex gap-4 mt-1">
                {['Pass', 'Fail'].map(opt => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`mock_result_${opt}`} />
                    <Label htmlFor={`mock_result_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormField>
            <FormField label="Number of driving faults/minors in most recent mock">
              <Input type="number" min={0} value={form.latest_mock_test_minor_faults} onChange={e => setField('latest_mock_test_minor_faults', e.target.value)} placeholder="0" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <YesNoField label="Did the mock include independent driving?" value={form.mock_test_independent_driving} onChange={v => setField('mock_test_independent_driving', v)} fieldId="mock_idrive" />
            <YesNoField label="Did the mock include manoeuvres?" value={form.mock_test_manoeuvres} onChange={v => setField('mock_test_manoeuvres', v)} fieldId="mock_man" />
            <YesNoField label="Did the mock use test-style conditions?" value={form.mock_test_test_conditions} onChange={v => setField('mock_test_test_conditions', v)} fieldId="mock_cond" />
          </div>
        </SectionCard>

        {/* Section 4: Nerves */}
        <SectionCard icon={<Brain className="w-5 h-5 text-[#F7B602]" />} title="Section 4: Managing Nerves">
          <FormField label="Have you practised ways to manage your nerves before and during the test?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {NERVES_OPTIONS.map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox id={`nerve_${opt}`} checked={form.nerves_management_methods.includes(opt)} onCheckedChange={() => toggleArrayItem('nerves_management_methods', opt)} />
                  <Label htmlFor={`nerve_${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                </div>
              ))}
            </div>
          </FormField>
          <FormField label="What is your plan for staying calm and focused during the test?" className="mt-4">
            <Textarea value={form.nerves_management_plan} onChange={e => setField('nerves_management_plan', e.target.value)} placeholder="Describe your nerves management plan..." rows={2} />
          </FormField>
        </SectionCard>

        {/* Section 5: Instructor Confirmation */}
        <SectionCard icon={<User className="w-5 h-5 text-[#F7B602]" />} title="Section 5: Instructor Confirmation">
          <FormField label="Has your driving instructor told you that you are ready for your practical driving test?" required error={errors.instructor_ready_confirmation}>
            <RadioGroup value={form.instructor_ready_confirmation} onValueChange={v => setField('instructor_ready_confirmation', v)} className="space-y-2 mt-2">
              {['Yes', 'No', 'Not yet discussed'].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`instr_${opt}`} />
                  <Label htmlFor={`instr_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <FormField label="Instructor name (optional)">
              <Input value={form.instructor_name} onChange={e => setField('instructor_name', e.target.value)} placeholder="Your instructor's name" />
            </FormField>
            <FormField label="Date instructor confirmed readiness (optional)">
              <Input type="date" value={form.instructor_confirmation_date} onChange={e => setField('instructor_confirmation_date', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Instructor comments (optional)" className="mt-4">
            <Textarea value={form.instructor_comments} onChange={e => setField('instructor_comments', e.target.value)} placeholder="Any comments from your instructor..." rows={2} />
          </FormField>
        </SectionCard>

        {/* Section 6: Test Booking */}
        <SectionCard icon={<Calendar className="w-5 h-5 text-[#F7B602]" />} title="Section 6: Test Booking Details">
          <FormField label="Do you already have a practical test booked?" required error={errors.test_booked_status}>
            <RadioGroup value={form.test_booked_status} onValueChange={v => setField('test_booked_status', v)} className="flex gap-6 mt-2">
              {['Yes', 'No'].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`booked_${opt}`} />
                  <Label htmlFor={`booked_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
          {form.test_booked_status === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField label="Test date" required error={errors.test_date}>
                <Input type="date" value={form.test_date} onChange={e => setField('test_date', e.target.value)} />
              </FormField>
              <FormField label="Test time" required error={errors.test_time}>
                <Input type="time" value={form.test_time} onChange={e => setField('test_time', e.target.value)} />
              </FormField>
              <FormField label="Test centre" required error={errors.test_centre} className="sm:col-span-2">
                <Input value={form.test_centre} onChange={e => setField('test_centre', e.target.value)} placeholder="e.g. Birmingham (Kings Heath)" />
              </FormField>
              {daysUntilTest !== null && daysUntilTest >= 0 && (
                <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">
                    📅 {daysUntilTest === 0 ? 'Your test is today!' : daysUntilTest === 1 ? '1 day until your test!' : `${daysUntilTest} days until your test`}
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Section 7: Reflection */}
        <SectionCard icon={<Target className="w-5 h-5 text-[#F7B602]" />} title="Section 7: Learner Reflection">
          <FormField label="What areas do you still feel you need to improve before your test?">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {IMPROVEMENT_AREAS.map(area => (
                <div key={area} className="flex items-center gap-2">
                  <Checkbox id={`imp_${area}`} checked={form.improvement_areas.includes(area)} onCheckedChange={() => toggleArrayItem('improvement_areas', area)} />
                  <Label htmlFor={`imp_${area}`} className="font-normal cursor-pointer text-sm">{area}</Label>
                </div>
              ))}
            </div>
          </FormField>
          <FormField label="Add any extra notes about your test preparation." className="mt-4">
            <Textarea value={form.learner_extra_notes} onChange={e => setField('learner_extra_notes', e.target.value)} placeholder="Any additional thoughts or notes..." rows={3} />
          </FormField>
        </SectionCard>

        {/* Live Score Preview */}
        {(form.independent_driving_status || form.safe_driving_status || form.mock_tests_passed_count) && (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Readiness Score (so far)</p>
                <span className="text-lg font-bold text-[#071739]">{calculateReadiness(form).score}/100</span>
              </div>
              <Progress value={calculateReadiness(form).score} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="pb-6">
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="w-full bg-[#071739] hover:bg-[#0d2a5e] text-white py-3 text-base font-semibold"
          >
            {saveMutation.isPending ? 'Saving...' : 'Submit & See My Result'}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3 italic">
            Tacholator's Test Readiness Checker is a support tool only. It does not replace professional driving instruction, DVSA guidance, or your instructor's judgement. Passing this checker does not guarantee that you will pass your practical driving test.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FormField({ label, required, error, children, className }) {
  return (
    <div className={className}>
      <Label className={`text-sm font-medium text-slate-700 mb-1 block ${required ? "after:content-['*'] after:text-rose-500 after:ml-1" : ''}`}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

function YesNoField({ label, value, onChange, fieldId }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 block mb-1">{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        {['Yes', 'No'].map(opt => (
          <div key={opt} className="flex items-center gap-2">
            <RadioGroupItem value={opt} id={`${fieldId}_${opt}`} />
            <Label htmlFor={`${fieldId}_${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}