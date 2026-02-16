import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RestrictedAccessMessage from '@/components/access/RestrictedAccessMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StickyNote, Plus, Search, Lock, Unlock, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NoteEditorModal from '@/components/notes/NoteEditorModal';
import NoteDetailModal from '@/components/notes/NoteDetailModal';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

const colorClasses = {
  sunny: 'bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-200',
  sky: 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200',
  mint: 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-200',
  lavender: 'bg-gradient-to-br from-purple-100 to-violet-100 border-purple-200',
  peach: 'bg-gradient-to-br from-orange-100 to-pink-100 border-orange-200',
  slate: 'bg-gradient-to-br from-slate-100 to-gray-100 border-slate-200'
};

export default function LearnerNotes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return byLinkedId.length > 0 ? byLinkedId[0] : null;
    },
    enabled: !!user?.id
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['myNotes', pupil?.id],
    queryFn: async () => {
      const allNotes = await base44.entities.Note.filter({ ownerPupilId: pupil.id });
      return allNotes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    },
    enabled: !!pupil?.id
  });

  const updateAccessMutation = useMutation({
    mutationFn: ({ noteId, accessLevel }) =>
      base44.entities.Note.update(noteId, { instructorAccessLevel: accessLevel }),
    onMutate: async ({ noteId, accessLevel }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['myNotes', pupil?.id]);
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(['myNotes', pupil?.id]);
      
      // Optimistically update to new value
      queryClient.setQueryData(['myNotes', pupil?.id], (old) => {
        if (!old) return old;
        return old.map(note => 
          note.id === noteId 
            ? { ...note, instructorAccessLevel: accessLevel }
            : note
        );
      });
      
      return { previousNotes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotes']);
      toast({ title: 'Permission updated' });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['myNotes', pupil?.id], context.previousNotes);
      }
      toast({ title: 'Failed to update permission', variant: 'destructive' });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => base44.entities.Note.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotes']);
      toast({ title: 'Note deleted' });
    }
  });

  const getCardColor = (note, index) => {
    if (note.cardColor !== 'auto') return colorClasses[note.cardColor];
    const colors = Object.values(colorClasses);
    return colors[index % colors.length];
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const filteredNotes = notes
    .filter(note => !searchQuery || note.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'created') return (a.orderIndex || 0) - (b.orderIndex || 0);
      if (sortBy === 'updated') return new Date(b.updated_date) - new Date(a.updated_date);
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      return 0;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(createPageUrl('LearnerLearningHub'))}
          className="lg:hidden mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-teal-600" />
              My Notes
            </h1>
            <p className="text-slate-500 mt-1">Create and manage your lesson notes</p>
          </div>
          <Button onClick={() => { setSelectedNote(null); setEditorOpen(true); }} className="gap-2 bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search notes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="created">Order created</option>
            <option value="updated">Recently updated</option>
            <option value="title_asc">Title A–Z</option>
            <option value="title_desc">Title Z–A</option>
          </select>
        </div>

        {filteredNotes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <StickyNote className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No notes yet</h3>
              <p className="text-slate-500 mb-4">Create your first note to track what you learn in lessons</p>
              <Button onClick={() => { setSelectedNote(null); setEditorOpen(true); }} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note, index) => (
              <Card
                key={note.id}
                className={`${getCardColor(note, index)} border shadow-sm hover:shadow-md transition-all cursor-pointer`}
                onClick={() => { setSelectedNote(note); setDetailOpen(true); }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {note.instructorAccessLevel === 'full' ? (
                        <><Unlock className="w-3 h-3 mr-1" /> Access</>
                      ) : (
                        <><Lock className="w-3 h-3 mr-1" /> Restricted</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-700 line-clamp-3">
                    {stripHtml(note.content).substring(0, 120)}...
                  </p>
                  <p className="text-xs text-slate-500">
                    Updated {moment(note.updated_date).fromNow()}
                  </p>
                  
                  <div className="pt-3 border-t border-slate-200/50 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`access-${note.id}`} className="text-xs cursor-pointer">
                        Instructor access
                      </Label>
                      <Switch
                        id={`access-${note.id}`}
                        checked={note.instructorAccessLevel === 'full'}
                        onCheckedChange={(checked) =>
                          updateAccessMutation.mutate({
                            noteId: note.id,
                            accessLevel: checked ? 'full' : 'restricted'
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNote(note);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this note? This cannot be undone.')) {
                            deleteNoteMutation.mutate(note.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NoteEditorModal
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setSelectedNote(null); }}
        note={selectedNote}
        pupilId={pupil?.id}
        instructorId={pupil?.instructorId}
      />

      <NoteDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedNote(null); }}
        note={selectedNote}
      />
    </div>
  );
}