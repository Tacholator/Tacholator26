import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const colorOptions = [
  { value: 'auto', label: 'Auto', class: 'bg-gradient-to-r from-slate-200 to-slate-300' },
  { value: 'sunny', label: 'Sunny', class: 'bg-gradient-to-br from-yellow-100 to-amber-100' },
  { value: 'sky', label: 'Sky', class: 'bg-gradient-to-br from-blue-100 to-cyan-100' },
  { value: 'mint', label: 'Mint', class: 'bg-gradient-to-br from-green-100 to-emerald-100' },
  { value: 'lavender', label: 'Lavender', class: 'bg-gradient-to-br from-purple-100 to-violet-100' },
  { value: 'peach', label: 'Peach', class: 'bg-gradient-to-br from-orange-100 to-pink-100' },
  { value: 'slate', label: 'Slate', class: 'bg-gradient-to-br from-slate-100 to-gray-100' }
];

export default function NoteEditorModal({ open, onClose, note, pupilId, instructorId, createdByRole = 'pupil' }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    cardColor: 'auto',
    instructorAccessLevel: 'full'
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        cardColor: note.cardColor || 'auto',
        instructorAccessLevel: note.instructorAccessLevel || 'full'
      });
    } else {
      setFormData({
        title: '',
        content: '',
        cardColor: 'auto',
        instructorAccessLevel: 'full'
      });
    }
  }, [note, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Note.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotes']);
      queryClient.invalidateQueries(['pupilNotes']);
      toast({ title: 'Note created' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to create note', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Note.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotes']);
      queryClient.invalidateQueries(['pupilNotes']);
      toast({ title: 'Note updated' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to update note', variant: 'destructive' });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const { data: user } = await base44.auth.me();

    if (note) {
      updateMutation.mutate({
        id: note.id,
        data: formData
      });
    } else {
      createMutation.mutate({
        ...formData,
        ownerPupilId: pupilId,
        assignedInstructorId: instructorId,
        createdByRole: createdByRole,
        createdByUserId: user.id
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Mirrors & Signals"
              maxLength={80}
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Note *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your notes here..."
              rows={8}
              required
            />
          </div>

          <div>
            <Label>Card Colour</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, cardColor: color.value })}
                  className={`${color.class} p-4 rounded-lg border-2 ${
                    formData.cardColor === color.value ? 'border-slate-700' : 'border-transparent'
                  } transition-all hover:scale-105`}
                >
                  <span className="text-xs font-medium text-slate-700">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {createdByRole === 'pupil' && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="access">Instructor access</Label>
                <p className="text-xs text-slate-500 mt-1">
                  Turn off to restrict your instructor from viewing this note
                </p>
              </div>
              <Switch
                id="access"
                checked={formData.instructorAccessLevel === 'full'}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, instructorAccessLevel: checked ? 'full' : 'restricted' })
                }
              />
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}