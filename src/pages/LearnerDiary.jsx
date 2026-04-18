import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { BookOpen, ChevronDown, ChevronUp, Target, ThumbsUp, TrendingUp, MessageSquare, Lightbulb } from 'lucide-react';

export default function LearnerDiary() {
  const [expandedId, setExpandedId] = React.useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id,
  });

  const { data: diaryEntries = [], isLoading } = useQuery({
    queryKey: ['learnerDiaryEntries', pupilProfile?.id],
    queryFn: () => base44.entities.DiaryEntry.filter({ pupilId: pupilProfile.id }, '-date', 50),
    enabled: !!pupilProfile?.id,
  });

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  const sections = [
    { key: 'objective', label: 'Objective', icon: Target, color: 'text-blue-600' },
    { key: 'whatWentWell', label: 'What Went Well', icon: ThumbsUp, color: 'text-green-600' },
    { key: 'areasToImprove', label: 'Areas to Improve', icon: TrendingUp, color: 'text-amber-600' },
    { key: 'instructorComments', label: 'Instructor Comments', icon: MessageSquare, color: 'text-purple-600' },
    { key: 'homeworkSuggestions', label: 'Homework Suggestions', icon: Lightbulb, color: 'text-orange-500' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#071739]">Lesson Diary</h1>
          <p className="text-sm text-slate-500">Notes from your driving lessons</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && diaryEntries.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No diary entries yet</p>
          <p className="text-sm">Your instructor will add notes after each lesson.</p>
        </div>
      )}

      <div className="space-y-3">
        {diaryEntries.map(entry => {
          const isOpen = expandedId === entry.id;
          const hasContent = sections.some(s => entry[s.key]);
          return (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggle(entry.id)}
                className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#071739]">{entry.mainTopic}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {entry.date ? format(new Date(entry.date), 'EEEE d MMMM yyyy') : 'Date unknown'}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-4">
                  {entry.aiSummary && (
                    <div className="bg-[#F7B602]/10 border border-[#F7B602]/30 rounded-lg p-3">
                      <p className="text-xs font-semibold text-[#071739] mb-1">✨ AI Summary</p>
                      <p className="text-sm text-slate-700">{entry.aiSummary}</p>
                    </div>
                  )}
                  {!hasContent && !entry.aiSummary && (
                    <p className="text-sm text-slate-400 italic">No detailed notes for this entry.</p>
                  )}
                  {sections.map(({ key, label, icon: Icon, color }) =>
                    entry[key] ? (
                      <div key={key}>
                        <div className={`flex items-center gap-2 mb-1 ${color}`}>
                          <Icon className="w-4 h-4" />
                          <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                        </div>
                        <p className="text-sm text-slate-700 pl-6">{entry[key]}</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}