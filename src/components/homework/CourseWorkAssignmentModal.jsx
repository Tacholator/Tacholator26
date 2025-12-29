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
import { BookOpen, Target, Calendar, Users } from 'lucide-react';

export default function CourseWorkAssignmentModal({ open, onClose, topic, topics = [], onAssign, pupils = [], singlePupil = false }) {
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [includeStudyMaterial, setIncludeStudyMaterial] = useState(true);
  const [includePracticeQuestions, setIncludePracticeQuestions] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedPupilIds, setSelectedPupilIds] = useState([]);

  const currentTopic = topic || topics.find(t => t.topicId === selectedTopicId);

  const handleAssign = () => {
    if (singlePupil) {
      onAssign({
        topicId: currentTopic.topicId,
        topicTitle: currentTopic.title,
        includeStudyMaterial,
        includePracticeQuestions,
        dueDate,
        instructions
      });
    } else {
      onAssign({
        includeStudyMaterial,
        includePracticeQuestions,
        dueDate,
        instructions,
        pupilIds: selectedPupilIds,
        topicId: currentTopic?.topicId,
        topicTitle: currentTopic?.title
      });
    }
    onClose();
    setSelectedPupilIds([]);
    setSelectedTopicId('');
  };

  const togglePupil = (pupilId) => {
    setSelectedPupilIds(prev => 
      prev.includes(pupilId) 
        ? prev.filter(id => id !== pupilId)
        : [...prev, pupilId]
    );
  };

  const toggleAll = () => {
    if (selectedPupilIds.length === activePupils.length) {
      setSelectedPupilIds([]);
    } else {
      setSelectedPupilIds(activePupils.map(p => p.id));
    }
  };

  const activePupils = pupils.filter(p => p.status === 'Active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {currentTopic?.title || 'Coursework'} as Homework</DialogTitle>
          <p className="text-sm text-slate-500 mt-2">{singlePupil ? 'Choose what to assign' : 'Choose what to assign to your pupils'}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!topic && topics.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Select Topic
              </Label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Choose a topic...</option>
                {topics.map(t => (
                  <option key={t.topicId} value={t.topicId}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          {!singlePupil && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Pupils ({selectedPupilIds.length} selected)
              </Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-slate-50">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                <Checkbox
                  checked={selectedPupilIds.length === activePupils.length && activePupils.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium text-slate-700">Select All</span>
              </div>
              {activePupils.map(pupil => (
                <div key={pupil.id} className="flex items-center gap-2 py-1.5">
                  <Checkbox
                    checked={selectedPupilIds.includes(pupil.id)}
                    onCheckedChange={() => togglePupil(pupil.id)}
                  />
                  <span className="text-sm text-slate-700">
                    {pupil.firstName} {pupil.lastName}
                  </span>
                </div>
              ))}
              {activePupils.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">No active pupils</p>
              )}
            </div>
            </div>
          )}

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
            disabled={(!includeStudyMaterial && !includePracticeQuestions) || (!singlePupil && selectedPupilIds.length === 0) || (!topic && !selectedTopicId)}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {singlePupil ? 'Assign Coursework' : `Assign to ${selectedPupilIds.length} Pupil${selectedPupilIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}