import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Search, Lock, Unlock, BookOpen, ClipboardList } from 'lucide-react';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

export default function InstructorTopicAssignment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPupil, setSelectedPupil] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['myPupils', user?.id],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const { data: accessList = [] } = useQuery({
    queryKey: ['allTopicAccess', selectedPupil?.id],
    queryFn: () => base44.entities.PupilTopicAccess.filter({ pupilId: selectedPupil.id }),
    enabled: !!selectedPupil?.id
  });

  const grantAccessMutation = useMutation({
    mutationFn: (data) => base44.entities.PupilTopicAccess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTopicAccess']);
    }
  });

  const revokeAccessMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PupilTopicAccess.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTopicAccess']);
    }
  });

  const filteredPupils = pupils.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const getAccess = (topicId) => {
    return accessList.find(a => a.topicId === topicId && !a.revokedAt);
  };

  const handleGrantAccess = (topicId, type) => {
    const existing = getAccess(topicId);
    
    if (existing) {
      // Update existing record
      const updates = { ...existing };
      if (type === 'study') updates.grantStudyMaterial = true;
      if (type === 'mcq') updates.grantPracticeQuestions = true;
      if (type === 'both') {
        updates.grantStudyMaterial = true;
        updates.grantPracticeQuestions = true;
      }
      
      revokeAccessMutation.mutate({ id: existing.id, data: updates });
    } else {
      // Create new record
      grantAccessMutation.mutate({
        pupilId: selectedPupil.id,
        instructorId: user.id,
        topicId: topicId,
        grantStudyMaterial: type === 'study' || type === 'both',
        grantPracticeQuestions: type === 'mcq' || type === 'both',
        assignedAt: new Date().toISOString()
      });
    }
  };

  const handleRevokeAccess = (topicId) => {
    const existing = getAccess(topicId);
    if (existing) {
      revokeAccessMutation.mutate({
        id: existing.id,
        data: { revokedAt: new Date().toISOString() }
      });
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
          <h1 className="text-3xl font-bold text-[#071739]">Manage Topic Access</h1>
        </div>

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

          {/* Topic Access Management */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedPupil 
                  ? `Access for ${selectedPupil.firstName} ${selectedPupil.lastName}`
                  : 'Select a pupil to manage access'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPupil ? (
                <div className="text-center py-12 text-slate-500">
                  <Lock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Choose a pupil from the list to manage their topic access</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseWorkTopics.map(topic => {
                    const access = getAccess(topic.topicId);
                    const hasStudy = access?.grantStudyMaterial;
                    const hasMcq = access?.grantPracticeQuestions;
                    
                    return (
                      <div key={topic.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{topic.title}</h3>
                            <div className="flex gap-2 mt-2">
                              {hasStudy && (
                                <Badge className="bg-green-100 text-green-700">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Study Access
                                </Badge>
                              )}
                              {hasMcq && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  <ClipboardList className="w-3 h-3 mr-1" />
                                  MCQ Access
                                </Badge>
                              )}
                              {!hasStudy && !hasMcq && (
                                <Badge variant="outline" className="text-slate-500">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!hasStudy && !hasMcq && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleGrantAccess(topic.topicId, 'both')}
                                  className="bg-[#071739] hover:bg-[#071739]/90"
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Grant Both
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGrantAccess(topic.topicId, 'study')}
                                >
                                  Study Only
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGrantAccess(topic.topicId, 'mcq')}
                                >
                                  MCQ Only
                                </Button>
                              </>
                            )}
                            {(hasStudy || hasMcq) && (
                              <>
                                {!hasStudy && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGrantAccess(topic.topicId, 'study')}
                                  >
                                    Add Study
                                  </Button>
                                )}
                                {!hasMcq && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGrantAccess(topic.topicId, 'mcq')}
                                  >
                                    Add MCQ
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRevokeAccess(topic.topicId)}
                                >
                                  Revoke All
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}