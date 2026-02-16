import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Search, TrendingUp, CheckCircle, XCircle, Settings, AlertCircle, Award, MessageSquare } from 'lucide-react';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import { format } from 'date-fns';
import InstructorMcqCommentModal from '@/components/coursework/InstructorMcqCommentModal';

export default function InstructorMcqReporting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPupil, setSelectedPupil] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentingStatus, setCommentingStatus] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user?.id
  });

  const { data: allMcqStatuses = [] } = useQuery({
    queryKey: ['allMcqStatuses'],
    queryFn: () => base44.entities.McqStatus.list('-lastAttemptAt'),
    enabled: !!user?.id
  });

  const { data: settings } = useQuery({
    queryKey: ['instructorMcqSettings', user?.id],
    queryFn: async () => {
      const settingsList = await base44.entities.InstructorMcqSettings.filter({ instructorId: user.id });
      return settingsList.length > 0 ? settingsList[0] : null;
    },
    enabled: !!user?.id
  });

  const { data: mcqStatuses = [] } = useQuery({
    queryKey: ['mcqStatuses', selectedPupil?.id],
    queryFn: () => base44.entities.McqStatus.filter({ pupilId: selectedPupil.id }, '-lastAttemptAt'),
    enabled: !!selectedPupil?.id
  });

  const pupilStats = useMemo(() => {
    const stats = {};
    pupils.forEach(pupil => {
      const pupilStatuses = allMcqStatuses.filter(s => s.pupilId === pupil.id);
      const totalAttempts = pupilStatuses.reduce((sum, s) => sum + s.attemptCount, 0);
      const completedTopics = pupilStatuses.filter(s => s.completed).length;
      const latestAttempt = pupilStatuses.length > 0 ? pupilStatuses[0]?.lastAttemptAt : null;
      
      stats[pupil.id] = {
        totalAttempts,
        completedTopics,
        latestAttempt,
        pupil
      };
    });
    return stats;
  }, [pupils, allMcqStatuses]);

  const sortedPupils = useMemo(() => {
    return [...pupils].sort((a, b) => {
      const aLatest = pupilStats[a.id]?.latestAttempt;
      const bLatest = pupilStats[b.id]?.latestAttempt;
      if (!aLatest && !bLatest) return 0;
      if (!aLatest) return 1;
      if (!bLatest) return -1;
      return new Date(bLatest) - new Date(aLatest);
    });
  }, [pupils, pupilStats]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (autoAssign) => {
      if (settings) {
        return await base44.entities.InstructorMcqSettings.update(settings.id, {
          autoAssignNextTopicOnCompletion: autoAssign
        });
      } else {
        return await base44.entities.InstructorMcqSettings.create({
          instructorId: user.id,
          autoAssignNextTopicOnCompletion: autoAssign
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructorMcqSettings']);
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ statusId, comment }) => {
      return base44.entities.McqStatus.update(statusId, {
        instructorComment: comment,
        instructorCommentedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allMcqStatuses']);
      queryClient.invalidateQueries(['mcqStatuses']);
    }
  });

  const filteredPupils = sortedPupils.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const getTopicName = (topicId) => {
    const topic = courseWorkTopics.find(t => t.topicId === topicId);
    return topic?.title || topicId;
  };

  const handleSaveComment = async (comment) => {
    if (commentingStatus) {
      await updateCommentMutation.mutateAsync({
        statusId: commentingStatus.id,
        comment
      });
      setCommentModalOpen(false);
      setCommentingStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('InstructorTeachingHub'))}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-[#071739]">MCQ Progress Report</h1>
        </div>

        {/* Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Automation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Auto-assign next topic on completion</p>
                <p className="text-sm text-slate-500 mt-1">
                  When a pupil passes an MCQ, automatically grant access to the next topic's study material and practice questions
                </p>
              </div>
              <Switch
                checked={settings?.autoAssignNextTopicOnCompletion || false}
                onCheckedChange={(checked) => updateSettingsMutation.mutate(checked)}
              />
            </div>
          </CardContent>
        </Card>

        {!selectedPupil ? (
          <div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search pupils..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 py-6 text-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPupils.map(pupil => {
                const stats = pupilStats[pupil.id] || { totalAttempts: 0, completedTopics: 0 };
                return (
                  <Card 
                    key={pupil.id}
                    onClick={() => setSelectedPupil(pupil)}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-[#F7B602]"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 truncate">
                            {pupil.firstName} {pupil.lastName}
                          </h3>
                          <p className="text-sm text-slate-500 truncate">{pupil.email}</p>
                        </div>
                        {stats.completedTopics > 0 && (
                          <Award className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm text-slate-600">Total Attempts</span>
                          <span className="font-bold text-slate-800">{stats.totalAttempts}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm text-green-700">Completed Topics</span>
                          <span className="font-bold text-green-700">{stats.completedTopics}</span>
                        </div>
                      </div>
                      
                      {stats.latestAttempt && (
                        <p className="text-xs text-slate-500 mt-4">
                          Latest: {format(new Date(stats.latestAttempt), 'PP')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <Button
              variant="outline"
              onClick={() => setSelectedPupil(null)}
              className="mb-6 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to All Pupils
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span>{selectedPupil.firstName} {selectedPupil.lastName}</span>
                  {pupilStats[selectedPupil.id]?.completedTopics > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      {pupilStats[selectedPupil.id].completedTopics} Topic{pupilStats[selectedPupil.id].completedTopics !== 1 ? 's' : ''} Completed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mcqStatuses.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No MCQ attempts yet for this pupil</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mcqStatuses.map(status => (
                      <Card key={status.id} className={`border-2 ${status.completed ? 'border-green-300 bg-green-50/30' : 'border-slate-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-slate-800 text-sm leading-tight flex-1">
                              {getTopicName(status.topicId)}
                            </h3>
                            {status.completed && (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Attempts</span>
                              <span className="font-semibold">{status.attemptCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Last Score</span>
                              <span className="font-semibold">{status.lastScore}/{status.totalQuestions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Last Result</span>
                              <Badge className={`text-xs ${status.lastPassed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                {status.lastPassed ? 'Pass' : 'Fail'}
                              </Badge>
                            </div>
                          </div>
                          
                          {status.lastAttemptAt && (
                            <p className="text-xs text-slate-500 mt-3 pt-3 border-t">
                              {format(new Date(status.lastAttemptAt), 'PPp')}
                            </p>
                          )}

                          {status.completed && status.lastPassed && (
                            <div className="mt-3 pt-3 border-t">
                              <Button
                                size="sm"
                                variant={status.instructorComment ? 'secondary' : 'outline'}
                                onClick={() => {
                                  setCommentingStatus(status);
                                  setCommentModalOpen(true);
                                }}
                                className="w-full gap-2 text-xs"
                              >
                                <MessageSquare className="w-3 h-3" />
                                {status.instructorComment ? 'Edit Comment' : 'Add Comment'}
                              </Button>
                              {status.instructorComment && (
                                <p className="text-xs text-slate-600 mt-2 italic line-clamp-2">
                                  "{status.instructorComment}"
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <InstructorMcqCommentModal
          open={commentModalOpen}
          onClose={() => {
            setCommentModalOpen(false);
            setCommentingStatus(null);
          }}
          pupilName={selectedPupil ? `${selectedPupil.firstName} ${selectedPupil.lastName}` : ''}
          topicTitle={commentingStatus ? getTopicName(commentingStatus.topicId) : ''}
          onSaveComment={handleSaveComment}
          existingComment={commentingStatus?.instructorComment}
        />
      </div>
    </div>
  );
}