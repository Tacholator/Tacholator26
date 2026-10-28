import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export default function EditTestInfoModal({ open, onClose, pupil }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open && pupil) {
      setForm({
        theoryTestPassed: !!pupil.theoryTestPassed,
        theoryTestNotBooked: !!pupil.theoryTestNotBooked,
        theoryTestDate: pupil.theoryTestDate || '',
        practicalTestPassed: !!pupil.practicalTestPassed,
        practicalTestNotBooked: !!pupil.practicalTestNotBooked,
        practicalTestDate: pupil.practicalTestDate || '',
        practicalTestTime: pupil.practicalTestTime || '',
        practicalTestCentre: pupil.practicalTestCentre || '',
      });
    }
  }, [open, pupil]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        theoryTestPassed: form.theoryTestPassed,
        theoryTestNotBooked: form.theoryTestNotBooked,
        theoryTestDate: form.theoryTestNotBooked ? null : (form.theoryTestDate || null),
        practicalTestPassed: form.practicalTestPassed,
        practicalTestNotBooked: form.practicalTestNotBooked,
        practicalTestDate: form.practicalTestNotBooked ? null : (form.practicalTestDate || null),
        practicalTestTime: form.practicalTestNotBooked ? '' : form.practicalTestTime,
        practicalTestCentre: form.practicalTestNotBooked ? '' : form.practicalTestCentre,
      };
      await base44.entities.Pupil.update(pupil.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pupil', pupil.id]);
      queryClient.invalidateQueries(['instructorPupils']);
      onClose();
    },
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Test Information</DialogTitle>
          <DialogDescription>
            Update theory and practical test details for {pupil?.firstName} {pupil?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Theory Test */}
          <div className="space-y-3 p-3 rounded-lg border bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">Theory Test</p>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!form.theoryTestNotBooked}
                onCheckedChange={(c) => set('theoryTestNotBooked', !!c)}
              />
              <Label className="text-sm font-normal cursor-pointer">Not booked yet</Label>
            </div>

            {!form.theoryTestNotBooked && (
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Test Date</Label>
                <Input
                  type="date"
                  value={form.theoryTestDate || ''}
                  onChange={(e) => set('theoryTestDate', e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!form.theoryTestPassed}
                onCheckedChange={(c) => set('theoryTestPassed', !!c)}
              />
              <Label className="text-sm font-normal cursor-pointer">Theory test passed</Label>
            </div>
          </div>

          {/* Practical Test */}
          <div className="space-y-3 p-3 rounded-lg border bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">Practical Test</p>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!form.practicalTestNotBooked}
                onCheckedChange={(c) => set('practicalTestNotBooked', !!c)}
              />
              <Label className="text-sm font-normal cursor-pointer">Not booked yet</Label>
            </div>

            {!form.practicalTestNotBooked && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Test Date</Label>
                    <Input
                      type="date"
                      value={form.practicalTestDate || ''}
                      onChange={(e) => set('practicalTestDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Time</Label>
                    <Input
                      type="time"
                      step="900"
                      value={form.practicalTestTime || ''}
                      onChange={(e) => set('practicalTestTime', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Test Centre</Label>
                  <Input
                    value={form.practicalTestCentre || ''}
                    onChange={(e) => set('practicalTestCentre', e.target.value)}
                    placeholder="e.g. Mitcham"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!form.practicalTestPassed}
                onCheckedChange={(c) => set('practicalTestPassed', !!c)}
              />
              <Label className="text-sm font-normal cursor-pointer">Practical test passed</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}