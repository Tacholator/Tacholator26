import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Film } from 'lucide-react';
import LearnerVideoCard from '@/components/videoresources/LearnerVideoCard';
import useLearnerInstructorVideos from '@/hooks/useLearnerInstructorVideos';

export default function LearnerVideoTopicDetail() {
  const navigate = useNavigate();
  const topic = new URLSearchParams(window.location.search).get('topic') || '';
  const [playingId, setPlayingId] = useState(null);

  const { groups, isLoading } = useLearnerInstructorVideos();

  const topicVideos = (groups.find((group) => group.topic === topic)?.items) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/LearnerVideoResources')}
            className="p-2 -ml-1 rounded-lg text-[#071739] hover:bg-slate-200/60 shrink-0"
            aria-label="Back to topics"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#071739] truncate">{topic}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {topicVideos.length} video{topicVideos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center py-12 text-slate-500">Loading...</div>
        ) : topicVideos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos in this topic</h3>
              <p className="text-slate-500 text-sm">
                Your instructor hasn't shared any videos for this topic yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {topicVideos.map((video) => (
              <LearnerVideoCard
                key={video.id}
                video={video}
                isPlaying={playingId === video.id}
                onPlay={() => setPlayingId(video.id)}
                onClose={() => setPlayingId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}