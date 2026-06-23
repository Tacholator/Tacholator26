import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, User, Calendar, MapPin, ChevronRight, ArrowLeft, UserPlus } from 'lucide-react';
import moment from 'moment';
import InstructorConductReadinessCheck from '@/components/readiness/InstructorConductReadinessCheck';

function ReadinessBadge({ result }) {
  if (!result) return <Badge variant="outline" className="text-slate-500">Not completed</Badge>;
  if (result === 'Ready for Test') return <Badge className="bg-emerald-500 text-white">Ready for Test</Badge>;
  if (result === 'Almost Ready') return <Badge className="bg-amber-500 text-white">Almost Ready</Badge>;
  return <Badge className="bg-rose-500 text-white">Not Ready Yet</Badge>;
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-800 text-right max-w-xs">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
    </div>
  );
}

export default function InstructorReadinessReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [conductOpen, setConductOpen] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: instructorProfile } = useQuery({
    queryKey: ['instructorProfileForReadiness', user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.Instructor.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email
  });

  const instructorName = instructorProfile
    ? `${instructorProfile.firstName || ''} ${instructorProfile.lastName || ''}`.trim()
    : user?.full_name || '';

  const { data: checks = [], isLoading } = useQuery({
    queryKey: ['allReadinessChecks'],
    queryFn: () => base44.entities.TestReadinessCheck.list('-created_date', 100)
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TestReadinessCheck.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReadinessChecks'] });
      toast({ title: 'Decision saved' });
      setSelected(prev => ({ ...prev, final_instructor_decision: decision, final_instructor_decision_notes: decisionNotes }));
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' })
  });

  const handleOpen = (check) => {
    setSelected(check);
    setDecision(check.final_instructor_decision || '');
    setDecisionNotes(check.final_instructor_decision_notes || '');
  };

  const handleSaveDecision = () => {
    if (!decision) return toast({ title: 'Please select a decision', variant: 'destructive' });
    saveMutation.mutate({ id: selected.id, data: { final_instructor_decision: decision, final_instructor_decision_notes: decisionNotes } });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#F7B602]" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#071739]">Test Readiness Reviews</h1>
            <p className="text-slate-500 text-sm">View and review learner readiness checker submissions</p>
          </div>
          <Button onClick={() => setConductOpen(true)} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold">
            <UserPlus className="w-4 h-4 mr-2" />
            Conduct Check
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading submissions...</div>
        ) : checks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No readiness checks submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Learner</th>
                      <th className="text-left p-3 font-semibold text-slate-700 hidden sm:table-cell">Test Centre</th>
                      <th className="text-left p-3 font-semibold text-slate-700 hidden md:table-cell">Test Date</th>
                      <th className="text-left p-3 font-semibold text-slate-700 hidden lg:table-cell">Mock Tests Passed</th>
                      <th className="text-left p-3 font-semibold text-slate-700 hidden md:table-cell">Instructor Confirmed</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Result</th>
                      <th className="text-left p-3 font-semibold text-slate-700 hidden lg:table-cell">Submitted</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checks.map(check => (
                      <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-800">{check.learner_name || '—'}</td>
                        <td className="p-3 text-slate-600 hidden sm:table-cell">{check.test_centre || '—'}</td>
                        <td className="p-3 text-slate-600 hidden md:table-cell">
                          {check.test_date ? moment(check.test_date).format('DD MMM YYYY') : '—'}
                        </td>
                        <td className="p-3 text-slate-600 hidden lg:table-cell">{check.mock_tests_passed_count ?? '—'}</td>
                        <td className="p-3 hidden md:table-cell">
                          {check.instructor_ready_confirmation === 'Yes'
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <XCircle className="w-4 h-4 text-rose-400" />}
                        </td>
                        <td className="p-3"><ReadinessBadge result={check.readiness_result} /></td>
                        <td className="p-3 text-slate-500 hidden lg:table-cell">{moment(check.created_date).format('DD MMM YYYY')}</td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" onClick={() => handleOpen(check)}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#F7B602]" />
              {selected?.learner_name || 'Readiness Check'}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Score */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <ReadinessBadge result={selected.readiness_result} />
                  <span className="text-sm font-semibold text-slate-700">Score: {selected.readiness_score}/100</span>
                </div>
                <Progress value={selected.readiness_score} className="h-2" />
              </div>

              {/* Key Details */}
              <div className="space-y-1">
                <DetailRow label="Independent Driving" value={selected.independent_driving_status} />
                <DetailRow label="Independent Driving Notes" value={selected.independent_driving_notes} />
                <DetailRow label="Safe Driving Status" value={selected.safe_driving_status} />
                <DetailRow label="Recent Faults" value={selected.recent_faults_notes} />
                <DetailRow label="Mock Tests Passed" value={selected.mock_tests_passed_count} />
                <DetailRow label="Latest Mock Date" value={selected.latest_mock_test_date ? moment(selected.latest_mock_test_date).format('DD MMM YYYY') : null} />
                <DetailRow label="Latest Mock Result" value={selected.latest_mock_test_result} />
                <DetailRow label="Minors in Latest Mock" value={selected.latest_mock_test_minor_faults} />
                <DetailRow label="Mock: Independent Driving" value={selected.mock_test_independent_driving} />
                <DetailRow label="Mock: Manoeuvres" value={selected.mock_test_manoeuvres} />
                <DetailRow label="Mock: Test Conditions" value={selected.mock_test_test_conditions} />
                <DetailRow label="Nerves Management Methods" value={selected.nerves_management_methods} />
                <DetailRow label="Nerves Management Plan" value={selected.nerves_management_plan} />
                <DetailRow label="Instructor Confirmation" value={selected.instructor_ready_confirmation} />
                <DetailRow label="Instructor Name" value={selected.instructor_name} />
                <DetailRow label="Instructor Confirmed Date" value={selected.instructor_confirmation_date ? moment(selected.instructor_confirmation_date).format('DD MMM YYYY') : null} />
                <DetailRow label="Instructor Comments" value={selected.instructor_comments} />
                <DetailRow label="Test Booked" value={selected.test_booked_status} />
                <DetailRow label="Test Date" value={selected.test_date ? moment(selected.test_date).format('DD MMM YYYY') : null} />
                <DetailRow label="Test Time" value={selected.test_time} />
                <DetailRow label="Test Centre" value={selected.test_centre} />
                <DetailRow label="Improvement Areas" value={selected.improvement_areas} />
                <DetailRow label="Extra Notes" value={selected.learner_extra_notes} />
                <DetailRow label="Submitted" value={moment(selected.created_date).format('DD MMM YYYY HH:mm')} />
              </div>

              {/* Instructor Override */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h3 className="font-semibold text-slate-800">Final Instructor Decision</h3>
                <RadioGroup value={decision} onValueChange={setDecision} className="space-y-2">
                  {['Ready', 'Not Ready', 'Needs More Practice'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`dec_${opt}`} />
                      <Label htmlFor={`dec_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Instructor notes (optional)</Label>
                  <Textarea value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} placeholder="Add any notes about your decision..." rows={2} />
                </div>
                <Button onClick={handleSaveDecision} disabled={saveMutation.isPending} className="w-full bg-[#071739] hover:bg-[#0d2a5e] text-white">
                  {saveMutation.isPending ? 'Saving...' : 'Save Decision'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conduct Check Dialog */}
      <InstructorConductReadinessCheck
        open={conductOpen}
        onOpenChange={setConductOpen}
        instructorId={user?.id}
        instructorName={instructorName}
      />
    </div>
  );
}