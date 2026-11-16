import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Video, ChevronDown, ChevronRight } from 'lucide-react';

export default function AdminVideoGroupCard({ label, videos, onToggleAll, children }) {
  const [expanded, setExpanded] = useState(true);

  const count = videos.length;
  const allPublished = count > 0 && videos.every((v) => v.published !== false);

  return (
    <Card className="border-t-4 border-t-[#F7B602] shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F7B602]/20 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-[#071739]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[#071739] truncate">{label}</p>
              <p className="text-xs text-slate-500">
                {count} video{count !== 1 ? 's' : ''}
              </p>
            </div>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            )}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={allPublished} onCheckedChange={onToggleAll} />
            <span
              className={`hidden sm:inline text-xs font-medium ${
                allPublished ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {allPublished ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>

        {expanded && <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">{children}</div>}
      </CardContent>
    </Card>
  );
}