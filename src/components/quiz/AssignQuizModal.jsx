import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function AssignQuizModal({ open, onClose, quiz, pupils, onAssign }) {
  const [selectedPupils, setSelectedPupils] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [attemptLimit, setAttemptLimit] = useState('0');
  const [required, setRequired] = useState(true);
  const [note, setNote] = useState('');

  const handlePupilToggle = (pupilId) => {
    setSelectedPupils(prev =>
      prev.includes(pupilId)
        ? prev.filter(id => id !== pupilId)
        : [...prev, pupilId]
    );
  };

  const handleAssign = () => {
    const dueAt = dueDate && dueTime
      ? new Date(`${dueDate}T${dueTime}`).toISOString()
      : null;

    onAssign({
      selectedPupils,
      dueAt,
      attemptLimit: parseInt(attemptLimit) || 0,
      required,
      note
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Practice Questions</DialogTitle>
          <DialogDescription>
            Assign "{quiz.title}" to your pupils
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select pupils */}
          <div>
            <Label className="mb-2 block">Select Pupils *</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {pupils.map(pupil => (
                <div key={pupil.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedPupils.includes(pupil.id)}
                    onCheckedChange={() => handlePupilToggle(pupil.id)}
                  />
                  <label className="text-sm cursor-pointer">
                    {pupil.firstName} {pupil.lastName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!dueDate}
              />
            </div>
          </div>

          {/* Attempt limit */}
          <div>
            <Label htmlFor="attemptLimit">
              Attempt Limit (0 = unlimited)
            </Label>
            <Input
              id="attemptLimit"
              type="number"
              min="0"
              value={attemptLimit}
              onChange={(e) => setAttemptLimit(e.target.value)}
            />
          </div>

          {/* Required */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={required}
              onCheckedChange={setRequired}
            />
            <Label>Mark as required</Label>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Note to Pupil (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a message for your pupils..."
              maxLength={300}
            />
            <p className="text-xs text-slate-500 mt-1">{note.length}/300</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedPupils.length === 0}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            Assign to {selectedPupils.length} {selectedPupils.length === 1 ? 'Pupil' : 'Pupils'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}