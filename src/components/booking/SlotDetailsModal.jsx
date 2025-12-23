import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, Clock, AlertTriangle, Loader2, UserPlus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import moment from 'moment';

export default function SlotDetailsModal({
  open,
  onOpenChange,
  slotInstance,
  isInstructor,
  onDeleteSlot,
  isDeleting,
  onBookForPupil
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteOption, setDeleteOption] = useState('delete_single_instance');

  if (!slotInstance) return null;

  const startMoment = moment(slotInstance.startAtUtc).local();
  const endMoment = moment(slotInstance.endAtUtc).local();
  const isRecurring = !!slotInstance.sourceTemplateId;
  const canDelete = slotInstance.status === 'available';

  const handleDeleteClick = () => {
    if (!canDelete) return;
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDeleteSlot({
      slotInstanceId: slotInstance.id,
      sourceTemplateId: slotInstance.sourceTemplateId,
      deleteOption,
      startAtUtc: slotInstance.startAtUtc
    });
  };

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    reserved_pending: 'bg-purple-100 text-purple-800',
    confirmed: 'bg-blue-100 text-blue-800',
    blocked: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    available: 'Available',
    reserved_pending: 'Pending',
    confirmed: 'Confirmed',
    blocked: 'Blocked'
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Slot Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">{startMoment.format('dddd, D MMMM YYYY')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Time</p>
                <p className="font-medium">{startMoment.format('HH:mm')} - {endMoment.format('HH:mm')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge className={statusColors[slotInstance.status]}>
                  {statusLabels[slotInstance.status]}
                </Badge>
              </div>
            </div>

            {isRecurring && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  📅 This slot is part of a recurring series
                </p>
              </div>
            )}

            {!canDelete && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This slot has an active booking and cannot be deleted. Cancel the booking first.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isInstructor && slotInstance.status === 'available' && onBookForPupil && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onBookForPupil(slotInstance);
                }}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Book for Pupil
              </Button>
            )}
            {isInstructor && canDelete && (
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Slot
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you want to delete this slot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <RadioGroup value={deleteOption} onValueChange={setDeleteOption}>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg mb-2">
                <RadioGroupItem value="delete_single_instance" id="single" />
                <Label htmlFor="single" className="cursor-pointer flex-1">
                  <div className="font-medium">Delete this slot only</div>
                  <div className="text-xs text-slate-500">
                    Only {startMoment.format('D MMM YYYY')} will be deleted
                  </div>
                </Label>
              </div>

              {isRecurring && (
                <>
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg mb-2">
                    <RadioGroupItem value="delete_future_instances" id="future" />
                    <Label htmlFor="future" className="cursor-pointer flex-1">
                      <div className="font-medium">Delete this and future slots</div>
                      <div className="text-xs text-slate-500">
                        All available slots from {startMoment.format('D MMM')} onwards
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                    <RadioGroupItem value="delete_entire_series" id="series" />
                    <Label htmlFor="series" className="cursor-pointer flex-1">
                      <div className="font-medium">Delete entire series</div>
                      <div className="text-xs text-slate-500">
                        Delete all available slots in this recurring series
                      </div>
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}