import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { MessageSquarePlus, Star } from 'lucide-react';

const CATEGORY_LABELS = {
  general: 'General',
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  ui_ux: 'UI / Design',
  performance: 'Performance'
};

const CATEGORY_COLORS = {
  general: 'bg-slate-100 text-slate-700',
  bug: 'bg-red-100 text-red-700',
  feature_request: 'bg-blue-100 text-blue-700',
  ui_ux: 'bg-purple-100 text-purple-700',
  performance: 'bg-orange-100 text-orange-700'
};

export default function AdminFeedback() {
  const [filter, setFilter] = useState('all');

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['allAppFeedback'],
    queryFn: () => base44.entities.AppFeedback.list('-created_date', 200)
  });

  const filtered = filter === 'all' ? feedbacks : feedbacks.filter(f => f.category === filter);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : '–';

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
          <MessageSquarePlus className="w-5 h-5 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#071739]">App Feedback</h1>
          <p className="text-sm text-slate-500">{feedbacks.length} responses · avg rating {avgRating} / 5</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[5,4,3,2,1].slice(0,3).map(star => {
          const count = feedbacks.filter(f => f.rating === star).length;
          return (
            <div key={star} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="flex justify-center gap-0.5 mb-1">
                {Array.from({length: star}).map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-[#F7B602] fill-[#F7B602]" />
                ))}
              </div>
              <p className="text-lg font-bold text-[#071739]">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === 'all' ? 'bg-[#071739] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === val ? 'bg-[#071739] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.map(fb => (
          <div key={fb.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-[#071739]">{fb.userName || fb.userEmail}</span>
                <Badge className={`text-xs ${CATEGORY_COLORS[fb.category] || 'bg-slate-100 text-slate-700'}`}>
                  {CATEGORY_LABELS[fb.category] || fb.category}
                </Badge>
                <Badge className="bg-slate-100 text-slate-600 text-xs capitalize">{fb.userRole}</Badge>
              </div>
              <div className="flex shrink-0">
                {Array.from({ length: fb.rating || 0 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-[#F7B602] fill-[#F7B602]" />
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-700">{fb.feedback}</p>
            <p className="text-xs text-slate-400 mt-2">{new Date(fb.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <MessageSquarePlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No feedback yet</p>
          </div>
        )}
      </div>
    </div>
  );
}