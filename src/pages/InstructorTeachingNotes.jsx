import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Save, X, StickyNote, Search, ChevronDown, ChevronUp, BookOpen, List, Target, HelpCircle } from 'lucide-react';
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
import { PROGRESS_SKILLS_DATA } from '@/components/progress/progressSkillsData';

// 28 driving skills card colors (cycling through a palette)
const SKILL_COLORS = [
  { bg: 'bg-red-50',     border: 'border-red-200',     num: 'bg-red-500',      text: 'text-red-700'     },
  { bg: 'bg-orange-50',  border: 'border-orange-200',  num: 'bg-orange-500',   text: 'text-orange-700'  },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   num: 'bg-amber-500',    text: 'text-amber-700'   },
  { bg: 'bg-yellow-50',  border: 'border-yellow-200',  num: 'bg-yellow-500',   text: 'text-yellow-700'  },
  { bg: 'bg-lime-50',    border: 'border-lime-200',    num: 'bg-lime-600',     text: 'text-lime-700'    },
  { bg: 'bg-green-50',   border: 'border-green-200',   num: 'bg-green-600',    text: 'text-green-700'   },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', num: 'bg-emerald-600',  text: 'text-emerald-700' },
  { bg: 'bg-teal-50',    border: 'border-teal-200',    num: 'bg-teal-600',     text: 'text-teal-700'    },
  { bg: 'bg-cyan-50',    border: 'border-cyan-200',    num: 'bg-cyan-600',     text: 'text-cyan-700'    },
  { bg: 'bg-sky-50',     border: 'border-sky-200',     num: 'bg-sky-600',      text: 'text-sky-700'     },
  { bg: 'bg-blue-50',    border: 'border-blue-200',    num: 'bg-blue-600',     text: 'text-blue-700'    },
  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  num: 'bg-indigo-600',   text: 'text-indigo-700'  },
  { bg: 'bg-violet-50',  border: 'border-violet-200',  num: 'bg-violet-600',   text: 'text-violet-700'  },
  { bg: 'bg-purple-50',  border: 'border-purple-200',  num: 'bg-purple-600',   text: 'text-purple-700'  },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', num: 'bg-fuchsia-600',  text: 'text-fuchsia-700' },
  { bg: 'bg-pink-50',    border: 'border-pink-200',    num: 'bg-pink-500',     text: 'text-pink-700'    },
  { bg: 'bg-rose-50',    border: 'border-rose-200',    num: 'bg-rose-500',     text: 'text-rose-700'    },
  { bg: 'bg-red-50',     border: 'border-red-200',     num: 'bg-red-500',      text: 'text-red-700'     },
  { bg: 'bg-orange-50',  border: 'border-orange-200',  num: 'bg-orange-500',   text: 'text-orange-700'  },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   num: 'bg-amber-500',    text: 'text-amber-700'   },
  { bg: 'bg-lime-50',    border: 'border-lime-200',    num: 'bg-lime-600',     text: 'text-lime-700'    },
  { bg: 'bg-green-50',   border: 'border-green-200',   num: 'bg-green-600',    text: 'text-green-700'   },
  { bg: 'bg-teal-50',    border: 'border-teal-200',    num: 'bg-teal-600',     text: 'text-teal-700'    },
  { bg: 'bg-sky-50',     border: 'border-sky-200',     num: 'bg-sky-600',      text: 'text-sky-700'     },
];

const SKILL_SECTIONS = [
  { key: 'topics', label: 'Topics', Icon: List, placeholder: 'List the main topics covered in this skill...' },
  { key: 'learning_objectives', label: 'Learning Objectives', Icon: Target, placeholder: 'What should the pupil achieve by the end of this skill?' },
  { key: 'qa', label: 'Q&A', Icon: HelpCircle, placeholder: 'Common questions and answers for this skill...' },
];

function SkillSectionEditor({ section, note, onSave, isSaving, color }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note?.content || '');
  const { Icon, label, placeholder } = section;

  const handleSave = () => {
    onSave(draft, note?.id);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(note?.content || '');
    setEditing(false);
  };

  return (
    <div className="bg-white/60 rounded-lg border border-white/80 overflow-hidden">
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-white/80 ${color.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${color.text}`} />
        <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">{label}</span>
      </div>
      <div className="p-3">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              placeholder={placeholder}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              className="bg-white border-slate-200 text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-[#071739] hover:bg-[#0a2150] text-white">
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {note?.content?.trim() ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{note.content}</p>
            ) : (
              <p className="text-xs text-slate-400 italic mb-2">No {label.toLowerCase()} notes yet.</p>
            )}
            <button
              onClick={() => { setDraft(note?.content || ''); setEditing(true); }}
              className={`flex items-center gap-1 text-xs ${color.text} font-medium hover:underline`}
            >
              <Edit2 className="w-3 h-3" />
              {note?.content?.trim() ? `Edit ${label}` : `Add ${label}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillNoteCard({ skill, index, sectionNotes, onSectionSave, isSaving }) {
  const [expanded, setExpanded] = useState(false);
  const color = SKILL_COLORS[index % SKILL_COLORS.length];
  const hasAnyNote = SKILL_SECTIONS.some(s => sectionNotes[s.key]?.content?.trim());

  const handleExpand = () => {
    setExpanded(v => !v);
  };

  return (
    <div className={`rounded-xl border-2 ${color.border} ${color.bg} overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md`}>
      {/* Card Header */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`w-8 h-8 rounded-full ${color.num} flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs font-bold">{skill.order}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${color.text} leading-tight`}>{skill.title}</p>
          {hasAnyNote && !expanded && (
            <div className="flex gap-1 mt-1">
              {SKILL_SECTIONS.filter(s => sectionNotes[s.key]?.content?.trim()).map(s => (
                <span key={s.key} className={`text-xs px-1.5 py-0.5 rounded bg-white/70 ${color.text} border ${color.border}`}>{s.label}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAnyNote && (
            <span className={`w-2 h-2 rounded-full ${color.num} opacity-80`} title="Has notes" />
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Area */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {skill.subsections?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {skill.subsections.map((sub, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full bg-white/70 ${color.text} border ${color.border}`}>
                  {sub.title}
                </span>
              ))}
            </div>
          )}

          {SKILL_SECTIONS.map(section => (
            <SkillSectionEditor
              key={section.key}
              section={section}
              note={sectionNotes[section.key] || null}
              onSave={(content, existingId) => onSectionSave(skill.skillKey, section.key, content, existingId)}
              isSaving={isSaving}
              color={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InstructorTeachingNotes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('skills');

  // Free-form notes state
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', tag: '' });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Teaching notes from dedicated entity
  const { data: allNotes = [] } = useQuery({
    queryKey: ['teachingNotes', user?.id],
    queryFn: () => base44.entities.TeachingNote.filter({ instructorId: user.id }),
    enabled: !!user?.id,
  });

  const skillNotes = allNotes.filter(n => n.noteType === 'skill');
  const freeNotes = allNotes.filter(n => n.noteType === 'general');

  // sectionNoteMap: { [skillKey]: { topics: note, learning_objectives: note, qa: note } }
  const sectionNoteMap = {};
  skillNotes.forEach(n => {
    if (!sectionNoteMap[n.skillKey]) sectionNoteMap[n.skillKey] = {};
    const sectionKey = n.section || 'general_skill';
    sectionNoteMap[n.skillKey][sectionKey] = n;
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id
      ? base44.entities.TeachingNote.update(id, data)
      : base44.entities.TeachingNote.create({ ...data, instructorId: user.id }),
    onSuccess: () => queryClient.invalidateQueries(['teachingNotes']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeachingNote.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['teachingNotes']); setDeleteId(null); },
  });

  const handleSkillSave = (skillKey, section, content, existingId) => {
    saveMutation.mutate({ id: existingId, data: { skillKey, section, content, noteType: 'skill' } });
  };

  const resetForm = () => { setForm({ title: '', content: '', tag: '' }); setShowForm(false); setEditingNote(null); };

  const handleFreeNoteSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingNote) {
      saveMutation.mutate({ id: editingNote.id, data: { ...form, noteType: 'general' } });
    } else {
      saveMutation.mutate({ id: null, data: { ...form, noteType: 'general' } });
    }
    resetForm();
  };

  const filteredSkills = PROGRESS_SKILLS_DATA.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFreeNotes = freeNotes.filter(n =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#071739]">Teaching Notes</h1>
          <p className="text-slate-500 text-sm mt-1">Notes and reminders for all 24 driving skills</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'skills' ? 'bg-[#071739] text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            Driving Skills
          </button>
          <button
            onClick={() => setActiveTab('free')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'free' ? 'bg-[#071739] text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            General Notes {freeNotes.length > 0 && <span className="ml-1 bg-[#F7B602] text-[#071739] text-xs px-1.5 py-0.5 rounded-full font-bold">{freeNotes.length}</span>}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={activeTab === 'skills' ? 'Search skills...' : 'Search notes...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredSkills.map((skill, i) => (
              <SkillNoteCard
                key={skill.skillKey}
                skill={skill}
                index={i}
                sectionNotes={sectionNoteMap[skill.skillKey] || {}}
                onSectionSave={handleSkillSave}
                isSaving={saveMutation.isPending}
              />
            ))}
            {filteredSkills.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No skills match your search</p>
              </div>
            )}
          </div>
        )}

        {/* Free Notes Tab */}
        {activeTab === 'free' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-[#071739] hover:bg-[#0a2150] text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> New Note
              </Button>
            </div>

            {showForm && (
              <Card className="mb-5 border-[#F7B602] border-2 shadow-md">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-[#071739]">{editingNote ? 'Edit Note' : 'New Note'}</h3>
                  <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <Textarea placeholder="Write your note here..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} />
                  <Input placeholder="Tag (e.g. Manoeuvres, Highway Code)" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                    <Button onClick={handleFreeNoteSubmit} disabled={saveMutation.isPending} className="bg-[#071739] hover:bg-[#0a2150] text-white">
                      <Save className="w-4 h-4 mr-1" /> Save Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredFreeNotes.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">{search ? 'No notes match your search' : 'No general notes yet'}</p>
                {!search && <p className="text-sm mt-1">Click "New Note" to create one</p>}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredFreeNotes.map(note => (
                  <Card key={note.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-[#071739] leading-tight">{note.title}</h3>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingNote(note); setForm({ title: note.title || '', content: note.content || '', tag: note.tag || '' }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(note.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4 mb-3">{note.content}</p>
                      <div className="flex items-center justify-between">
                        {note.tag ? <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{note.tag}</span> : <span />}
                        <span className="text-xs text-slate-400">{note.updated_date ? format(new Date(note.updated_date), 'dd MMM yyyy') : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this note? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}