import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Loader2, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NoteEditorModal from '@/components/notes/NoteEditorModal';
import NoteDetailModal from '@/components/notes/NoteDetailModal';
import moment from 'moment';

const colorClasses = {
  auto: 'bg-gradient-to-br from-slate-100 to-gray-100 border-slate-200',
  sunny: 'bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-200',
  sky: 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200',
  mint: 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-200',
  lavender: 'bg-gradient-to-br from-purple-100 to-violet-100 border-purple-200',
  peach: 'bg-gradient-to-br from-orange-100 to-pink-100 border-orange-200',
  slate: 'bg-gradient-to-br from-slate-100 to-gray-100 border-slate-200'
};

export default function InstructorPupilNotesList() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const pupilId = urlParams.get('pupilId');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['pupil', pupilId],
    queryFn: async () => {
      const pupils = await base44.entities.Pupil.filter({ id: pupilId });
      return pupils[0] || null;
    },
    enabled: !!pupilId
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['pupilNotes', pupilId, user?.id],
    queryFn: async () => {
      const allNotes = await base44.entities.Note.filter({ ownerPupilId: pupilId });
      return allNotes
        .filter(note => 
          note.instructorAccessLevel === 'full' || note.createdByRole === 'instructor'
        )
        .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    },
    enabled: !!pupilId && !!user?.id
  });

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getCardColor = (note, index) => {
    if (note.cardColor && note.cardColor !== 'auto') return colorClasses[note.cardColor];
    const colors = Object.values(colorClasses);
    return colors[index % colors.length];
  };

  if (pupilLoading || notesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Pupil not found</h2>
          <Link to={createPageUrl('InstructorPupilNotes')}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pupil Notes
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl('InstructorPupilNotes')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pupils
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#071739]">
                {pupil.firstName} {pupil.lastName} – Notes
              </h1>
              <p className="text-slate-500 mt-1">
                Only notes with learner permission enabled are visible
              </p>
            </div>
            <Button 
              onClick={() => { setSelectedNote(null); setEditorOpen(true); }}
              className="gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>
        </div>

        {notes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <StickyNote className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No accessible notes</h3>
              <p className="text-slate-500 mb-4">
                If the pupil restricts access, their notes will not appear here.
              </p>
              <Button 
                onClick={() => { setSelectedNote(null); setEditorOpen(true); }}
                className="gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                <Plus className="w-4 h-4" />
                Create a Note for this Pupil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notes.map((note, index) => (
              <Card
                key={note.id}
                className={`${getCardColor(note, index)} border shadow-sm hover:shadow-md transition-all cursor-pointer`}
                onClick={() => { setSelectedNote(note); setDetailOpen(true); }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <Badge variant={note.createdByRole === 'instructor' ? 'default' : 'secondary'}>
                      {note.createdByRole === 'instructor' ? 'Added by Instructor' : 'Learner note'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {stripHtml(note.content).substring(0, 140)}...
                  </p>
                  <p className="text-xs text-slate-500">
                    Last updated: {moment(note.updated_date).format('D MMM YYYY, HH:mm')}
                  </p>
                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNote(note);
                        setDetailOpen(true);
                      }}
                    >
                      Open
                    </Button>
                    {note.createdByRole === 'instructor' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNote(note);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
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
        pupilId={pupilId}
        instructorId={user?.id}
        createdByRole="instructor"
      />

      <NoteDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedNote(null); }}
        note={selectedNote}
      />
    </div>
  );
}