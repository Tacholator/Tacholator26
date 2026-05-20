import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { CheckCircle, XCircle, Plus, Trash2, Award } from 'lucide-react';
import moment from 'moment';

const EMPTY_FORM = {
  pupilId: '',
  testDate: '',
  passed: '',
  dangerousFaults: 0,
  seriousFaults: 0,
  drivingFaults: 0,
  examinerName: '',
  notes: '',
};

export default function PracticalTestTab({ instructorId, pupils }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['practicalTestResults', instructorId],
    queryFn: () => base44.entities.PracticalTestResult.filter({ instructorId }),
    enabled: !!instructorId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PracticalTestResult.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practicalTestResults', instructorId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PracticalTestResult.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practicalTestResults', instructorId] });
      setDeleteId(null);
    },
  });

  const handleSubmit = () => {
    const pupil = pupils.find(p => p.id === form.pupilId);
    createMutation.mutate({
      ...form,
      instructorId,
      pupilName: pupil ? `${pupil.firstName} ${pupil.lastName}` : '',
      passed: form.passed === 'true',
      dangerousFaults: Number(form.dangerousFaults) || 0,
      seriousFaults: Number(form.seriousFaults) || 0,
      drivingFaults: Number(form.drivingFaults) || 0,
    });
  };

  const sorted = [...results].sort((a, b) => moment(b.testDate).diff(moment(a.testDate)));
  const totalTests = results.length;
  const totalPassed = results.filter(r => r.passed).length;
  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : null;



  return (
    <div className="space-y-6">
      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Total Tests</p>
            <p className="text-2xl font-bold text-[#071739]">{totalTests}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Passed</p>
            <p className="text-2xl font-bold text-emerald-600">{totalPassed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-500">{totalTests - totalPassed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-[#071739]">
          <CardContent className="p-5 flex items-center gap-3">
            <Award className="w-6 h-6 text-[#F7B602] shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Pass Rate</p>
              <p className="text-2xl font-bold text-white">{passRate !== null ? `${passRate}%` : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-600">Test Results</CardTitle>
          <Button size="sm" onClick={() => setShowModal(true)} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] gap-1.5">
            <Plus className="w-4 h-4" /> Add Result
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
              <Award className="w-8 h-8 opacity-30" />
              <p className="text-sm">No test results recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Pupil', 'Test Date', 'Result', 'Dangerous', 'Serious', 'Driving', 'Attempt', 'Examiner', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{r.pupilName || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{moment(r.testDate).format('DD MMM YYYY')}</td>
                      <td className="px-4 py-3">
                        {r.passed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle className="w-3 h-3" />Pass</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" />Fail</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${r.dangerousFaults > 0 ? 'text-red-600' : 'text-slate-400'}`}>{r.dangerousFaults ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${r.seriousFaults > 0 ? 'text-orange-500' : 'text-slate-400'}`}>{r.seriousFaults ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${r.drivingFaults > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{r.drivingFaults ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${
                            (() => {
                              const pupilResults = sorted.filter(x => x.pupilId === r.pupilId).sort((a,b) => moment(a.testDate).diff(moment(b.testDate)));
                              const attempt = pupilResults.findIndex(x => x.id === r.id) + 1;
                              return attempt >= 3 ? 'text-red-600' : attempt === 2 ? 'text-amber-500' : 'text-slate-400';
                            })()
                          }`}>
                            {sorted.filter(x => x.pupilId === r.pupilId).sort((a,b) => moment(a.testDate).diff(moment(b.testDate))).findIndex(x => x.id === r.id) + 1}
                          </span>
                        </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.examinerName || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteId(r.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Result Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Practical Test Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Pupil</Label>
              <Select value={form.pupilId} onValueChange={v => setForm(f => ({ ...f, pupilId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select pupil…" /></SelectTrigger>
                <SelectContent>
                  {pupils.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Date</Label>
              <Input type="date" value={form.testDate} onChange={e => setForm(f => ({ ...f, testDate: e.target.value }))} />
            </div>
            <div>
              <Label>Result</Label>
              <Select value={form.passed} onValueChange={v => setForm(f => ({ ...f, passed: v }))}>
                <SelectTrigger><SelectValue placeholder="Pass or Fail?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Pass</SelectItem>
                  <SelectItem value="false">Fail</SelectItem>
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
              <Label>Examiner Name</Label>
              <Input placeholder="e.g. J. Smith" value={form.examinerName} onChange={e => setForm(f => ({ ...f, examinerName: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.pupilId || !form.testDate || form.passed === '' || createMutation.isPending}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              {createMutation.isPending ? 'Saving…' : 'Save Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete this result?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}