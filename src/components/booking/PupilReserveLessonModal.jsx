import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, PoundSterling } from 'lucide-react';
import moment from 'moment';

const DURATION_OPTIONS = [
  { value: 0.5, label: '30 minutes' },
  { value: 1.0, label: '1 hour' },
  { value: 1.5, label: '1.5 hours' },
  { value: 2.0, label: '2 hours' }
];

export default function PupilReserveLessonModal({ 
  open, 
  onOpenChange, 
  onReserve, 
  isSaving, 
  slotDateTime, 
  hourlyRate 
}) {
  const [durationHours, setDurationHours] = useState(1.0);
  const [notes, setNotes] = useState('');

  const handleReserve = () => {
    onReserve({
      durationHours,
      notesFromPupil: notes
    });
  };

  const totalPrice = (hourlyRate || 50) * durationHours;
  const slotMoment = slotDateTime ? moment(slotDateTime) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a Lesson</DialogTitle>
          <DialogDescription>
            Reserve this slot - pending instructor confirmation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {slotMoment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">
                  {slotMoment.format('dddd, D MMMM YYYY')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-slate-600">
                  Starting at {slotMoment.format('HH:mm')}
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={durationHours.toString()} onValueChange={(v) => setDurationHours(parseFloat(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What would you like to focus on?"
              rows={3}
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PoundSterling className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">Total Price</span>
              </div>
              <span className="text-lg font-bold text-emerald-700">
                £{totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Charged upon instructor confirmation
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleReserve} 
            disabled={isSaving}
            className="bg-[#071739] hover:bg-[#071739]/90"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reserve (Pending Confirmation)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}