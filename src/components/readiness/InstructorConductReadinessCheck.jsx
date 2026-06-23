import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, AlertCircle, UserPlus } from 'lucide-react';
import moment from 'moment';
import {
  getEmptyReadinessForm,
  calculateReadiness,
  validateReadinessForm
} from './readinessLogic';
import { ReadinessFormSections } from './ReadinessFormSections';

export default function InstructorConductReadinessCheck({ open, onOpenChange, instructorId, instructorName }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(getEmptyReadinessForm());
  const [errors, setErrors] = useState({});
  const [selectedPupilId, setSelectedPupilId] = useState('');

  const { data: pupils = [] } = useQuery({
    queryKey: ['instructorPupilsForReadiness', instructorId],
    queryFn: () => base44.entities.Pupil.filter({ instructorId }),
    enabled: !!instructorId && open
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TestReadinessCheck.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReadinessChecks'] });
      toast({ title: 'Readiness check saved successfully' });
      handleClose();
    },
    onError: () => toast({ title: 'Failed to save readiness check', variant: 'destructive' })
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

  const handleClose = () => {
    setForm(getEmptyReadinessForm());
    setErrors({});
    setSelectedPupilId('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!selectedPupilId) {
      toast({ title: 'Please select a pupil', variant: 'destructive' });
      return;
    }
    const e = validateReadinessForm(form);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast({ title: 'Please complete all required fields', variant: 'destructive' });
      return;
    }
    const pupil = pupils.find(p => p.id === selectedPupilId);
    const { score, result } = calculateReadiness(form);
    const daysUntilTest = form.test_date
      ? moment(form.test_date).startOf('day').diff(moment().startOf('day'), 'days')
      : null;

    createMutation.mutate({
      ...form,
      learner_id: pupil.id,
      learner_name: `${pupil.firstName || ''} ${pupil.lastName || ''}`.trim(),
      instructor_id: instructorId,
      instructor_name: instructorName || form.instructor_name || null,
      mock_tests_passed_count: parseInt(form.mock_tests_passed_count) || 0,
      latest_mock_test_minor_faults: form.latest_mock_test_minor_faults ? parseInt(form.latest_mock_test_minor_faults) : null,
      days_until_test: daysUntilTest,
      readiness_result: result,
      readiness_score: score
    });
  };

  const previewScore = calculateReadiness(form);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#071739]">
            <UserPlus className="w-5 h-5 text-[#F7B602]" />
            Conduct Readiness Check for Pupil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pupil Selector */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Select Pupil *</Label>
            <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a pupil..." />
              </SelectTrigger>
              <SelectContent>
                {pupils.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPupilId && (
            <>
              {/* Live Score Preview */}
              {(form.independent_driving_status || form.safe_driving_status || form.mock_tests_passed_count) && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Live Readiness Score</span>
                    <span className="text-lg font-bold text-[#071739]">{previewScore.score}/100</span>
                  </div>
                  <Progress value={previewScore.score} className="h-2" />
                  <div className="mt-2">
                    {previewScore.result === 'Ready for Test' && <Badge className="bg-emerald-500 text-white">{previewScore.result}</Badge>}
                    {previewScore.result === 'Almost Ready' && <Badge className="bg-amber-500 text-white">{previewScore.result}</Badge>}
                    {previewScore.result === 'Not Ready Yet' && <Badge className="bg-rose-500 text-white">{previewScore.result}</Badge>}
                  </div>
                </div>
              )}

              {/* Form Sections */}
              <ReadinessFormSections
                form={form}
                setField={setField}
                toggleArrayItem={toggleArrayItem}
                errors={errors}
              />

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-[#071739] hover:bg-[#0d2a5e] text-white"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Readiness Check'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}