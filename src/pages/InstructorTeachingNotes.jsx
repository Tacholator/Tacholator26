import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Save, X, StickyNote, Search } from 'lucide-react';
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
import { format } from 'date-fns';

export default function InstructorTeachingNotes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', tag: '' });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['teachingNotes', user?.id],
    queryFn: () => base44.entities.Note.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Note.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['teachingNotes']); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Note.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['teachingNotes']); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['teachingNotes']); setDeleteId(null); },
  });

  const resetForm = () => {
    setForm({ title: '', content: '', tag: '' });
    setShowForm(false);
    setEditingNote(null);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setForm({ title: note.title || '', content: note.content || '', tag: note.tag || '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = notes.filter(n =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase()) || n.tag?.toLowerCase().includes(search.toLowerCase())
  );

  const tagColors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  const getTagColor = (tag) => {
    const idx = (tag?.charCodeAt(0) || 0) % tagColors.length;
    return tagColors[idx];
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#071739]">Teaching Notes</h1>
            <p className="text-slate-500 text-sm mt-1">Your personal notes and reminders for teaching</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-[#071739] hover:bg-[#0a2150] text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* New / Edit Form */}
        {showForm && (
          <Card className="mb-5 border-[#F7B602] border-2 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#071739]">
                {editingNote ? 'Edit Note' : 'New Note'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                placeholder="Write your note here..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
              />
              <Input
                placeholder="Tag (optional, e.g. Manoeuvres, Highway Code)"
                value={form.tag}
                onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#071739] hover:bg-[#0a2150] text-white"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {editingNote ? 'Save Changes' : 'Save Note'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading notes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{search ? 'No notes match your search' : 'No teaching notes yet'}</p>
            {!search && <p className="text-sm mt-1">Click "New Note" to create your first note</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(note => (
              <Card key={note.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[#071739] leading-tight">{note.title}</h3>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(note.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4 mb-3">{note.content}</p>
                  <div className="flex items-center justify-between gap-2">
                    {note.tag ? (
                      <Badge className={`text-xs ${getTagColor(note.tag)}`}>{note.tag}</Badge>
                    ) : <span />}
                    <span className="text-xs text-slate-400">
                      {note.updated_date ? format(new Date(note.updated_date), 'dd MMM yyyy') : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}