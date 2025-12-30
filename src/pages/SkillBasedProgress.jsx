import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, CheckCircle2, Circle, Clock, ArrowLeft } from 'lucide-react';
import { DRIVING_SKILLS } from '@/components/progress/skillsData';
import { initializeSkillsForPupil } from '@/components/progress/SkillProgressHelper';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkillBasedProgress() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pupilIdFromUrl = searchParams.get('pupilId');
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isInstructor = user?.role === 'admin';
  const pupilId = isInstructor ? pupilIdFromUrl : user?.id;

  const { data: pupil } = useQuery({
    queryKey: ['pupil', pupilId],
    queryFn: () => base44.entities.Pupil.filter({ id: pupilId }).then(p => p[0]),
    enabled: !!pupilId && isInstructor
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills', pupilId],
    queryFn: () => base44.entities.Skill.filter({ pupilId }).then(s => s.sort((a, b) => a.order - b.order)),
    enabled: !!pupilId
  });

  const { data: progressSummary } = useQuery({
    queryKey: ['progressSummary', pupilId],
    queryFn: () => base44.entities.PupilProgressSummary.filter({ pupilId }).then(p => p[0] || null),
    enabled: !!pupilId
  });

  const handleInitialize = async () => {
    if (!pupilId || !user?.id) return;
    setIsInitializing(true);
    try {
      await initializeSkillsForPupil(pupilId, user.id, DRIVING_SKILLS);
      queryClient.invalidateQueries(['skills', pupilId]);
      queryClient.invalidateQueries(['progressSummary', pupilId]);
    } catch (error) {
      console.error('Failed to initialize skills:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      not_started: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-emerald-100 text-emerald-700'
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {status === 'not_started' ? 'Not Started' : status === 'in_progress' ? 'In Progress' : 'Completed'}
      </Badge>
    );
  };

  if (!pupilId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600">No pupil selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (skillsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="p-6">
        {isInstructor && pupil && (
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('PupilProfile', `pupilId=${pupilId}`))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {pupil.firstName} {pupil.lastName}
          </Button>
        )}
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Skills Initialized</h3>
            <p className="text-slate-600 mb-6">
              Initialize the 24 driving skills to start tracking progress.
            </p>
            <Button onClick={handleInitialize} disabled={isInitializing}>
              {isInitializing ? 'Initializing...' : 'Initialize Skills'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallProgress = progressSummary?.overallProgressPercent || 0;
  const completedSkills = progressSummary?.completedParentSkills || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {isInstructor && pupil && (
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('PupilProfile', `pupilId=${pupilId}`))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {pupil.firstName} {pupil.lastName}
          </Button>
        )}

        <Card className="border-t-4 border-[#F7B602]">
          <CardHeader>
            <CardTitle className="text-2xl">Driving Progress</CardTitle>
            <p className="text-sm text-slate-600">
              Skills Completed: {completedSkills}/24 ({overallProgress}%)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-slate-500">
                Overall progress increases only when a full skill is completed.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {skills.map((skill) => (
            <Card
              key={skill.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(createPageUrl('SkillDetail', `skillId=${skill.id}`))}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(skill.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">{skill.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(skill.status)}
                        <span className="text-sm text-slate-600">
                          {skill.subsectionsCompleted}/{skill.subsectionsTotal} sections
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right min-w-[100px]">
                      <Progress 
                        value={skill.subsectionsCompletionRatio * 100} 
                        className="h-2 w-24" 
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {Math.round(skill.subsectionsCompletionRatio * 100)}%
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}