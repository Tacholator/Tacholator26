import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Film } from 'lucide-react';
import LearnerTopicSummaryCard from '@/components/videoresources/LearnerTopicSummaryCard';
import useLearnerInstructorVideos from '@/hooks/useLearnerInstructorVideos';

export default function LearnerVideoResources() {
  const { groups, isLoading } = useLearnerInstructorVideos();

  if (isLoading) {
    return <div className="p-6 text-center py-12 text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#071739] mb-1">Video Resources</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Videos your instructor has shared, grouped by topic.
          </p>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos yet</h3>
              <p className="text-slate-500 text-sm">
                Your instructor hasn't shared any video resources with you yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <LearnerTopicSummaryCard
                key={group.topic}
                topic={group.topic}
                count={group.items.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}