import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { PROGRESS_SKILLS_DATA } from '@/components/progress/progressSkillsData';
import { initializeProgressSkills } from '@/components/progress/progressHelper';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SkillDetailDrawer from '@/components/progress/SkillDetailDrawer';

const STATUS_THEME = {
  not_started: {
    background: '#FFF3D6',
    border: '#F7B602',
    accent: '#F0B429',
    chip: { bg: '#FFE8B3', text: '#3B2F00' }
  },
  in_progress: {
    background: '#FFE0C2',
    border: '#FF9B54',
    accent: '#FF7A1A',
    chip: { bg: '#FFD1A3', text: '#4A1F00' }
  },
  completed: {
    background: '#DFF5E6',
    border: '#38A169',
    accent: '#2F855A',
    chip: { bg: '#CDEEDB', text: '#0F3D22' }
  }
};

export default function DrivingProgressV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pupilIdFromUrl = searchParams.get('pupilId');
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState(null);

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
    queryKey: ['progressSkills', pupilId],
    queryFn: () => base44.entities.ProgressSkill.filter({ pupilId }).then(s => s.sort((a, b) => a.order - b.order)),
    enabled: !!pupilId
  });

  const { data: progressSummary } = useQuery({
    queryKey: ['progressSummary', pupilId],
    queryFn: () => base44.entities.ProgressSummary.filter({ pupilId }).then(p => p[0] || null),
    enabled: !!pupilId
  });

  // Recalculate all skills on page load to ensure data integrity
  React.useEffect(() => {
    const recalculateAll = async () => {
      if (!pupilId || skills.length === 0) return;
      try {
        const { recalculateProgressSkill } = await import('@/components/progress/progressHelper');
        for (const skill of skills) {
          await recalculateProgressSkill(skill.id);
        }
      } catch (error) {
        console.error('Failed to recalculate skills:', error);
      }
    };
    recalculateAll();
  }, [pupilId, skills.length]);

  const handleInitialize = async () => {
    if (!pupilId || !user?.id) return;
    setIsInitializing(true);
    try {
      await initializeProgressSkills(pupilId, user.id, PROGRESS_SKILLS_DATA);
      queryClient.invalidateQueries(['progressSkills', pupilId]);
      queryClient.invalidateQueries(['progressSummary', pupilId]);
    } catch (error) {
      console.error('Failed to initialize skills:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    return labels[status] || status;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
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
            <Button onClick={handleInitialize} disabled={isInitializing} className="bg-[#F7B602] hover:bg-[#F0B429] text-[#071739]">
              {isInitializing ? 'Initializing...' : 'Initialize Skills'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallProgress = progressSummary?.overallPercent || 0;
  const completedSkills = progressSummary?.completedParentSkills || 0;

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {isInstructor && pupil && (
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('PupilProfile', `pupilId=${pupilId}`))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {pupil.firstName} {pupil.lastName}
            </Button>
          )}

          <Card className="border-t-4 border-[#F7B602] shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-[#071739]">Driving Progress</CardTitle>
              <p className="text-sm text-slate-600">
                Skills Completed: {completedSkills}/24 ({overallProgress}%)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={overallProgress} className="h-4" />
                <p className="text-xs text-slate-500">
                  Overall progress increases only when a full skill is completed.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {skills.map((skill) => {
              const theme = STATUS_THEME[skill.status];
              return (
                <Card
                  key={skill.id}
                  className="hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-105"
                  style={{
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    borderWidth: '2px',
                    borderRadius: '16px'
                  }}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm text-slate-800 flex-1 leading-tight">
                        {skill.title}
                      </h3>
                      <Badge
                        style={{
                          backgroundColor: theme.chip.bg,
                          color: theme.chip.text,
                          fontSize: '10px',
                          padding: '2px 8px'
                        }}
                      >
                        {getStatusLabel(skill.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      {skill.subsectionsCompleted} / {skill.subsectionsTotal} sub-sections completed
                    </p>
                    <div className="space-y-1">
                      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${skill.subsectionsRatio * 100}%`,
                            backgroundColor: theme.accent
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Complete all sub-sections to finish this skill.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <SkillDetailDrawer
        skillId={selectedSkillId}
        open={!!selectedSkillId}
        onClose={() => setSelectedSkillId(null)}
        pupilId={pupilId}
      />
    </>
  );
}