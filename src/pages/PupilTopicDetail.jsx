import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PupilTopicDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic') || 'Topic';
  const pupilId = urlParams.get('pupilId');
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/PupilProfile?id=${pupilId}&tab=topics`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-[#071739]">{topicName}</h1>
      </div>

      <div className="min-h-[60vh] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Content coming soon</p>
      </div>
    </div>
  );
}