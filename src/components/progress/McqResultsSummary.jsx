import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import { format } from 'date-fns';

export default function McqResultsSummary({ pupilId }) {
  const { data: mcqStatuses = [], isLoading } = useQuery({
    queryKey: ['mcqStatuses', pupilId],
    queryFn: () => base44.entities.McqStatus.filter({ pupilId }, '-lastAttemptAt'),
    enabled: !!pupilId
  });

  if (isLoading || mcqStatuses.length === 0) return null;

  const getTopicName = (topicId) => {
    const topic = courseWorkTopics.find(t => t.topicId === topicId);
    return topic?.title || topicId;
  };

  const completedCount = mcqStatuses.filter(s => s.completed).length;
  const passedCount = mcqStatuses.filter(s => s.lastPassed).length;

  return (
    <Card className="mt-6 border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          MCQ Practice Results
          <Badge className="bg-indigo-100 text-indigo-700 ml-auto">
            {completedCount} completed · {passedCount} passed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mcqStatuses.map(status => (
            <div
              key={status.id}
              className={`rounded-lg border-2 p-3 ${status.completed ? 'border-green-300 bg-green-50/40' : 'border-slate-200 bg-slate-50/40'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-slate-800 leading-tight flex-1">
                  {getTopicName(status.topicId)}
                </p>
                {status.completed
                  ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  : <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                }
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Score</span>
                  <span className="font-semibold">{status.lastScore}/{status.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Result</span>
                  <Badge className={`text-xs ${status.lastPassed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                    {status.lastPassed ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Attempts</span>
                  <span className="font-semibold">{status.attemptCount}</span>
                </div>
              </div>
              {status.lastAttemptAt && (
                <p className="text-xs text-slate-400 mt-2 border-t pt-2">
                  {format(new Date(status.lastAttemptAt), 'PP')}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}