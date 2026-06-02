import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, X, Edit2, Target, HelpCircle, List } from 'lucide-react';
import { PROGRESS_SKILLS_DATA } from '@/components/progress/progressSkillsData';
import { SKILL_LEARNING_OBJECTIVES } from '@/components/teachingnotes/skillLearningObjectives';

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
  { key: 'learning_objectives', label: 'Learning Objectives', Icon: Target, placeholder: 'What should the pupil achieve by the end of this skill?' },
  { key: 'qa', label: 'Q&A', Icon: HelpCircle, placeholder: 'Common questions and answers for this skill...' },
];

function SectionEditor({ section, note, onSave, isSaving, color, suggestions = [] }) {
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-200 ${color.bg}`}>
        <Icon className={`w-4 h-4 ${color.text}`} />
        <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{label}</span>
      </div>
      <div className="p-4">
        {editing ? (
          <div className="space-y-3">
            <Textarea
              placeholder={placeholder}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={5}
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
              <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{note.content}</p>
            ) : (
              <>
                {suggestions.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 italic mb-2">Suggested {label.toLowerCase()}:</p>
                    <ul className="space-y-1.5">
                      {suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color.num} shrink-0`} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic mb-3">No {label.toLowerCase()} notes yet.</p>
                )}
              </>
            )}
            <button
              onClick={() => { setDraft(note?.content || ''); setEditing(true); }}
              className={`flex items-center gap-1.5 text-sm ${color.text} font-medium hover:underline`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              {note?.content?.trim() ? `Edit ${label}` : `Add ${label}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InstructorTeachingNoteDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const skillKey = params.get('skill');

  const skillIndex = PROGRESS_SKILLS_DATA.findIndex(s => s.skillKey === skillKey);
  const skill = PROGRESS_SKILLS_DATA[skillIndex];
  const color = SKILL_COLORS[skillIndex % SKILL_COLORS.length];

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: allNotes = [] } = useQuery({
    queryKey: ['teachingNotes', user?.id],
    queryFn: () => base44.entities.TeachingNote.filter({ instructorId: user.id }),
    enabled: !!user?.id,
  });

  const skillNotes = allNotes.filter(n => n.noteType === 'skill' && n.skillKey === skillKey);
  const sectionNoteMap = {};
  skillNotes.forEach(n => {
    sectionNoteMap[n.section || 'general_skill'] = n;
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id
      ? base44.entities.TeachingNote.update(id, data)
      : base44.entities.TeachingNote.create({ ...data, instructorId: user.id }),
    onSuccess: () => queryClient.invalidateQueries(['teachingNotes']),
  });

  const handleSectionSave = (section, content, existingId) => {
    saveMutation.mutate({ id: existingId, data: { skillKey, section, content, noteType: 'skill' } });
  };

  if (!skill) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Skill not found.</p>
          <Button onClick={() => navigate('/InstructorTeachingNotes')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teaching Notes
          </Button>
        </div>
      </div>
    );
  }

  const objectives = SKILL_LEARNING_OBJECTIVES[skillKey] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`${color.bg} border-b-2 ${color.border} px-4 sm:px-6 py-5`}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/InstructorTeachingNotes')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Teaching Notes
          </button>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${color.num} flex items-center justify-center shrink-0 shadow-sm`}>
              <span className="text-white text-sm font-bold">{skill.order}</span>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${color.text}`}>{skill.title}</h1>
              <p className="text-slate-500 text-sm mt-0.5">Teaching notes for this skill</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Topics / Subsections */}
        {skill.subsections?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-200 ${color.bg}`}>
              <List className={`w-4 h-4 ${color.text}`} />
              <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Topics</span>
            </div>
            <div className="divide-y divide-slate-100">
              {skill.subsections.map((sub, i) => {
                const subWords = sub.title.toLowerCase().split(/[\s–\-\/,]+/).filter(w => w.length > 3);
                const matched = objectives.filter(obj => subWords.some(w => obj.toLowerCase().includes(w)));

                return (
                  <div key={i} className="px-4 py-3">
                    <p className={`text-sm font-semibold ${color.text} mb-1.5`}>{sub.title}</p>
                    {matched.length > 0 && (
                      <ul className="space-y-1">
                        {matched.map((obj, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color.num} shrink-0`} />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Learning Objectives & Q&A */}
        {SKILL_SECTIONS.map(section => (
          <SectionEditor
            key={section.key}
            section={section}
            note={sectionNoteMap[section.key] || null}
            onSave={(content, existingId) => handleSectionSave(section.key, content, existingId)}
            isSaving={saveMutation.isPending}
            color={color}
            suggestions={section.key === 'learning_objectives' ? objectives : []}
          />
        ))}
      </div>
    </div>
  );
}