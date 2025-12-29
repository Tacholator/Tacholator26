import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock } from 'lucide-react';
import moment from 'moment';

export default function NoteDetailModal({ open, onClose, note }) {
  if (!note) return null;

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex-1">{note.title}</DialogTitle>
            <Badge variant="secondary">
              {note.instructorAccessLevel === 'full' ? (
                <><Unlock className="w-3 h-3 mr-1" /> Instructor Access</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" /> Restricted</>
              )}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-slate-700">
              {stripHtml(note.content)}
            </div>
          </div>

          <div className="pt-4 border-t text-xs text-slate-500 space-y-1">
            <p>Created: {moment(note.created_date).format('D MMM YYYY, HH:mm')}</p>
            <p>Updated: {moment(note.updated_date).format('D MMM YYYY, HH:mm')}</p>
            {note.createdByRole && (
              <p>Created by: {note.createdByRole === 'instructor' ? 'Instructor' : 'You'}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}