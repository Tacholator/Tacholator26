import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LessonTermsConsentModal({ open, onOpenChange, onAccept }) {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleViewTerms = () => {
    navigate(createPageUrl('LessonTermsAndConditions'));
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
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Confirm Lesson Terms
          </DialogTitle>
          <DialogDescription>
            Before booking your first lesson, please confirm you understand the key terms:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-2">
            <p>• Bookings must be confirmed by your instructor</p>
            <p>• <strong>Free cancellation</strong> if you cancel 48+ hours before</p>
            <p>• <strong>Full charge</strong> if you cancel within 48 hours or miss the lesson</p>
            <p>• Instructor cancellations are fully refunded</p>
          </div>

          <div className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg">
            <Checkbox 
              id="agree_lesson_terms" 
              checked={agreed}
              onCheckedChange={setAgreed}
            />
            <Label 
              htmlFor="agree_lesson_terms" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I agree to the <span className="font-semibold">Lesson Terms & Conditions</span> (including the 48-hour cancellation rule)
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleViewTerms}
          >
            View Full Lesson T&Cs
          </Button>
          <Button 
            onClick={onAccept}
            disabled={!agreed}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}