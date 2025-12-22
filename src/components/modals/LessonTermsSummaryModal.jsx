import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LessonTermsSummaryModal({ open, onOpenChange, onContinue }) {
  const navigate = useNavigate();

  const handleReadFull = () => {
    navigate(createPageUrl('LessonTermsAndConditions'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Lesson Terms (Summary)
          </DialogTitle>
          <DialogDescription>
            Before you book your first lesson, please note:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-teal-50 rounded-lg p-4 text-sm text-slate-700 space-y-3">
            <p>• Bookings are requested by pupils and must be confirmed by the instructor.</p>
            <p>• You can cancel for free if you cancel <strong>48 hours or more</strong> before the lesson start time.</p>
            <p>• If you cancel <strong>within 48 hours</strong> (or do not attend), the full lesson price will be deducted.</p>
            <p>• Instructor cancellations are fully refunded/restored.</p>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            You can read the full Lesson Terms & Conditions at any time in <strong>Lesson T&Cs</strong>.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleReadFull}
          >
            Read Full Lesson T&Cs
          </Button>
          <Button 
            onClick={onContinue}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}