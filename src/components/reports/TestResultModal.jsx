import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Trophy } from 'lucide-react';

export default function TestResultModal({ open, onClose, pupil, instructorId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    testDate: '',
    passed: '',
    dangerousFaults: 0,
    seriousFaults: 0,
    drivingFaults: 0,
    attemptNumber: 1,
    examinerName: '',
  });
  const [saved, setSaved] = useState(false);

  const { data: existing = [] } = useQuery({
    queryKey: ['practicalTestResult', pupil?.id],
    queryFn: () => base44.entities.PracticalTestResult.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id && open,
  });

  // Pre-fill form from existing result or pupil's practicalTestDate
  useEffect(() => {
    if (!open) { setSaved(false); return; }
    if (existing.length > 0) {
      const r = existing[0];
      setForm({
        testDate: r.testDate || '',
        passed: r.passed ? 'true' : 'false',
        dangerousFaults: r.dangerousFaults ?? 0,
        seriousFaults: r.seriousFaults ?? 0,
        drivingFaults: r.drivingFaults ?? 0,
        attemptNumber: r.attemptNumber ?? 1,
        examinerName: r.examinerName || '',
      });
      setSaved(true);
    } else {
      setForm(f => ({
        ...f,
        testDate: pupil?.practicalTestDate || '',
        passed: pupil?.practicalTestPassed ? 'true' : '',
      }));
      setSaved(false);
    }
  }, [open, existing, pupil]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existing.length > 0) {
        return base44.entities.PracticalTestResult.update(existing[0].id, data);
      }
      return base44.entities.PracticalTestResult.create(data);
    },
    onSuccess: async (_, variables) => {
      // If result is a Pass, stamp practicalTestPassDate on the Pupil record
      if (variables.passed && pupil?.id) {
        await base44.entities.Pupil.update(pupil.id, {
          practicalTestPassDate: variables.testDate,
        });
        queryClient.invalidateQueries({ queryKey: ['learnerPupilProfile'] });
        queryClient.invalidateQueries({ queryKey: ['pupil', pupil.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['practicalTestResult', pupil?.id] });
      queryClient.invalidateQueries({ queryKey: ['practicalTestResults', instructorId] });
      setSaved(true);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      pupilId: pupil.id,
      instructorId,
      pupilName: `${pupil.firstName} ${pupil.lastName}`,
      testDate: form.testDate,
      passed: form.passed === 'true',
      dangerousFaults: Number(form.dangerousFaults) || 0,
      seriousFaults: Number(form.seriousFaults) || 0,
      drivingFaults: Number(form.drivingFaults) || 0,
      attemptNumber: Number(form.attemptNumber) || 1,
      examinerName: form.examinerName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F7B602]" />
            Practical Test Result — {pupil?.firstName} {pupil?.lastName}
          </DialogTitle>
        </DialogHeader>

        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Result saved and visible in the Practical Test report tab.
          </div>
        )}

        <div className="space-y-4 py-1">
          <div>
            <Label>Test Date</Label>
            <Input type="date" value={form.testDate} onChange={e => setForm(f => ({ ...f, testDate: e.target.value }))} />
          </div>
          <div>
            <Label>Result</Label>
            <Select value={form.passed} onValueChange={v => setForm(f => ({ ...f, passed: v }))}>
              <SelectTrigger><SelectValue placeholder="Pass or Fail?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Pass ✅</SelectItem>
                <SelectItem value="false">Fail ❌</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Dangerous</Label>
              <Input type="number" min="0" value={form.dangerousFaults} onChange={e => setForm(f => ({ ...f, dangerousFaults: e.target.value }))} />
            </div>
            <div>
              <Label>Serious</Label>
              <Input type="number" min="0" value={form.seriousFaults} onChange={e => setForm(f => ({ ...f, seriousFaults: e.target.value }))} />
            </div>
            <div>
              <Label>Driving</Label>
              <Input type="number" min="0" value={form.drivingFaults} onChange={e => setForm(f => ({ ...f, drivingFaults: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Attempt Number</Label>
            <Input type="number" min="1" value={form.attemptNumber} onChange={e => setForm(f => ({ ...f, attemptNumber: e.target.value }))} />
          </div>
          <div>
            <Label>Examiner Name</Label>
            <Input placeholder="e.g. J. Smith" value={form.examinerName} onChange={e => setForm(f => ({ ...f, examinerName: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={handleSave}
            disabled={!form.testDate || form.passed === '' || saveMutation.isPending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {saveMutation.isPending ? 'Saving…' : saved ? 'Update Result' : 'Save Result'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}