import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Lock } from 'lucide-react';

export default function LockedContentDialog({ open, onOpenChange }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-full">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <AlertDialogTitle>Locked Content</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            This content is locked until your instructor assigns it to you. Please ask your instructor to grant you access to this topic's Study Material and Practice Questions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-[#071739] hover:bg-[#071739]/90">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}