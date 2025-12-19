import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Target, Calendar } from 'lucide-react';

export default function CourseWorkAssignmentModal({ open, onClose, topic, onAssign }) {
  const [includeStudyMaterial, setIncludeStudyMaterial] = useState(true);
  const [includePracticeQuestions, setIncludePracticeQuestions] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleAssign = () => {
    onAssign({
      includeStudyMaterial,
      includePracticeQuestions,
      dueDate,
      instructions
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {topic?.title} as Homework</DialogTitle>
          <p className="text-sm text-slate-500 mt-2">Choose what to assign to your pupils</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="study-material"
                checked={includeStudyMaterial}
                onCheckedChange={setIncludeStudyMaterial}
              />
              <label
                htmlFor="study-material"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Study Material
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="practice-questions"
                checked={includePracticeQuestions}
                onCheckedChange={setIncludePracticeQuestions}
              />
              <label
                htmlFor="practice-questions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  Practice Questions (MCQ)
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date (Optional)
            </Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Add any specific instructions or notes for your pupils..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!includeStudyMaterial && !includePracticeQuestions}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            Assign to Pupils
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}