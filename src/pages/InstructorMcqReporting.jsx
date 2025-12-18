import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Search, TrendingUp, CheckCircle, XCircle, Settings, AlertCircle } from 'lucide-react';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import { format } from 'date-fns';

export default function InstructorMcqReporting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPupil, setSelectedPupil] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
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

  const filteredPupils = pupils.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const getTopicName = (topicId) => {
    const topic = courseWorkTopics.find(t => t.topicId === topicId);
    return topic?.title || topicId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('PupilList'))}
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pupil Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Pupil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search pupils..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPupils.map(pupil => (
                  <button
                    key={pupil.id}
                    onClick={() => setSelectedPupil(pupil)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedPupil?.id === pupil.id
                        ? 'border-[#F7B602] bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="font-medium text-slate-800">{pupil.firstName} {pupil.lastName}</p>
                    <p className="text-sm text-slate-500">{pupil.email}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* MCQ Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedPupil 
                  ? `MCQ Progress: ${selectedPupil.firstName} ${selectedPupil.lastName}`
                  : 'Select a pupil to view progress'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPupil ? (
                <div className="text-center py-12 text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Choose a pupil from the list to view their MCQ progress</p>
                </div>
              ) : mcqStatuses.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No MCQ attempts yet for this pupil</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mcqStatuses.map(status => (
                    <div key={status.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">{getTopicName(status.topicId)}</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                            <div>
                              <span className="text-slate-500">Attempts:</span>
                              <span className="ml-2 font-semibold text-slate-700">{status.attemptCount}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Last Score:</span>
                              <span className="ml-2 font-semibold text-slate-700">{status.lastScore}/{status.totalQuestions}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Last Result:</span>
                              <Badge className={`ml-2 ${status.lastPassed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                {status.lastPassed ? 'Pass' : 'Fail'}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-slate-500">Status:</span>
                              <Badge className={`ml-2 ${status.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {status.completed ? 'Completed' : 'In Progress'}
                              </Badge>
                            </div>
                          </div>
                          {status.lastAttemptAt && (
                            <p className="text-xs text-slate-500 mt-2">
                              Last attempt: {format(new Date(status.lastAttemptAt), 'PPpp')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}