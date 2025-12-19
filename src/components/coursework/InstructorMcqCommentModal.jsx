import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Sparkles } from 'lucide-react';

export default function InstructorMcqCommentModal({ open, onClose, pupilName, topicTitle, onSaveComment, existingComment }) {
  const [comment, setComment] = useState(existingComment || '');

  const handleSave = () => {
    onSaveComment(comment);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F7B602]" />
            Acknowledge {pupilName}'s Achievement
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-2">
            {pupilName} passed <span className="font-medium">{topicTitle}</span>. Leave an encouraging message!
          </p>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Great work on passing this topic! Keep up the excellent effort..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!comment.trim()}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Save Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}