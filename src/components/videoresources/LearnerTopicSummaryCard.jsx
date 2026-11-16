import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Video, ChevronRight } from 'lucide-react';

export default function LearnerTopicSummaryCard({ topic, count }) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/LearnerVideoTopicDetail?topic=${encodeURIComponent(topic)}`)}
      className="cursor-pointer border-t-4 border-t-[#F7B602] shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F7B602]/20 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-[#071739]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-[#071739] truncate">{topic}</p>
            <p className="text-xs text-slate-500">
              {count} video{count !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}