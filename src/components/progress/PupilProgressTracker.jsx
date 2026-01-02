import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PROGRESS_SKILLS_DATA } from './progressSkillsData';
import { initializeProgressSkills } from './progressHelper';
import SkillDetailDrawer from './SkillDetailDrawer';
import MockTestsSection from './MockTestsSection';
import TestRoutesSection from './TestRoutesSection';

const SKILL_COLORS = [
  { background: 'linear-gradient(135deg, #FFE5E5 0%, #FFB3B3 100%)', border: '#FF4D4D', accent: '#FF4D4D', chip: { bg: '#FFB3B3', text: '#800000' } },
  { background: 'linear-gradient(135deg, #FFE8CC 0%, #FFD699 100%)', border: '#FF9933', accent: '#FF9933', chip: { bg: '#FFD699', text: '#804D00' } },
  { background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE99F 100%)', border: '#FFB800', accent: '#FFB800', chip: { bg: '#FFE066', text: '#4A3600' } },
  { background: 'linear-gradient(135deg, #FFFFCC 0%, #FFFF66 100%)', border: '#E6E600', accent: '#E6E600', chip: { bg: '#FFFF99', text: '#666600' } },
  { background: 'linear-gradient(135deg, #E6FFE6 0%, #99FF99 100%)', border: '#00CC00', accent: '#00CC00', chip: { bg: '#99FF99', text: '#004D00' } },
  { background: 'linear-gradient(135deg, #E6FFF0 0%, #99F5C2 100%)', border: '#00D66B', accent: '#00D66B', chip: { bg: '#66E6A8', text: '#004D26' } },
  { background: 'linear-gradient(135deg, #E6FFFF 0%, #99FFFF 100%)', border: '#00CCCC', accent: '#00CCCC', chip: { bg: '#99FFFF', text: '#004D4D' } },
  { background: 'linear-gradient(135deg, #E6F2FF 0%, #99C2FF 100%)', border: '#3399FF', accent: '#3399FF', chip: { bg: '#99C2FF', text: '#00264D' } },
  { background: 'linear-gradient(135deg, #E6E6FF 0%, #CCCCFF 100%)', border: '#6666FF', accent: '#6666FF', chip: { bg: '#CCCCFF', text: '#1A1A66' } },
  { background: 'linear-gradient(135deg, #F2E6FF 0%, #D699FF 100%)', border: '#9933FF', accent: '#9933FF', chip: { bg: '#D699FF', text: '#330066' } },
  { background: 'linear-gradient(135deg, #FFE6F2 0%, #FFB3D9 100%)', border: '#FF66B3', accent: '#FF66B3', chip: { bg: '#FFB3D9', text: '#660033' } },
  { background: 'linear-gradient(135deg, #FFE6E6 0%, #FFD1D1 100%)', border: '#FF8A8A', accent: '#FF8A8A', chip: { bg: '#FFD1D1', text: '#4D0000' } },
  { background: 'linear-gradient(135deg, #FFF0E6 0%, #FFCFA3 100%)', border: '#FF8C42', accent: '#FF8C42', chip: { bg: '#FFB380', text: '#5C2600' } },
  { background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE4B3 100%)', border: '#FFAA00', accent: '#FFAA00', chip: { bg: '#FFE4B3', text: '#664400' } },
  { background: 'linear-gradient(135deg, #FFFBE6 0%, #FFF199 100%)', border: '#FFD700', accent: '#FFD700', chip: { bg: '#FFF199', text: '#665500' } },
  { background: 'linear-gradient(135deg, #F0FFE6 0%, #CCFF99 100%)', border: '#99FF33', accent: '#99FF33', chip: { bg: '#CCFF99', text: '#336600' } },
  { background: 'linear-gradient(135deg, #E6FFEC 0%, #99FFAA 100%)', border: '#33FF66', accent: '#33FF66', chip: { bg: '#99FFAA', text: '#00662B' } },
  { background: 'linear-gradient(135deg, #E6FFF9 0%, #99FFE6 100%)', border: '#00FFB3', accent: '#00FFB3', chip: { bg: '#99FFE6', text: '#00664D' } },
  { background: 'linear-gradient(135deg, #E6F9FF 0%, #99EBFF 100%)', border: '#00BBFF', accent: '#00BBFF', chip: { bg: '#99EBFF', text: '#004D66' } },
  { background: 'linear-gradient(135deg, #E6ECFF 0%, #99B3FF 100%)', border: '#0066FF', accent: '#0066FF', chip: { bg: '#99B3FF', text: '#001A66' } },
  { background: 'linear-gradient(135deg, #EDE6FF 0%, #C999FF 100%)', border: '#7700FF', accent: '#7700FF', chip: { bg: '#C999FF', text: '#2B0066' } },
  { background: 'linear-gradient(135deg, #F9E6FF 0%, #E699FF 100%)', border: '#BB00FF', accent: '#BB00FF', chip: { bg: '#E699FF', text: '#4D0066' } },
  { background: 'linear-gradient(135deg, #FFE6F9 0%, #FFC2EB 100%)', border: '#FF3DB8', accent: '#FF3DB8', chip: { bg: '#FFC2EB', text: '#66004D' } },
  { background: 'linear-gradient(135deg, #FFE6F0 0%, #FFB3D1 100%)', border: '#FF5599', accent: '#FF5599', chip: { bg: '#FFB3D1', text: '#660033' } }
];

export default function PupilProgressTracker({ pupilId, instructorId, isInstructor = true }) {
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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

  // Auto-initialize skills if not present and migrate existing
  React.useEffect(() => {
    const initializeIfNeeded = async () => {
      if (!pupilId || !instructorId) return;
      if (skillsLoading) return;
      
      if (skills.length === 0) {
        setIsInitializing(true);
        try {
          await initializeProgressSkills(pupilId, instructorId, PROGRESS_SKILLS_DATA);
          queryClient.invalidateQueries(['progressSkills', pupilId]);
          queryClient.invalidateQueries(['progressSummary', pupilId]);
        } catch (error) {
          console.error('Failed to initialize skills:', error);
        } finally {
          setIsInitializing(false);
        }
      } else if (skills.length > 0 && skills.length !== 24) {
        // Migrate/sync to canonical structure if count doesn't match
        setIsInitializing(true);
        try {
          await initializeProgressSkills(pupilId, instructorId, PROGRESS_SKILLS_DATA);
          queryClient.invalidateQueries(['progressSkills', pupilId]);
          queryClient.invalidateQueries(['progressSummary', pupilId]);
        } catch (error) {
          console.error('Failed to migrate skills:', error);
        } finally {
          setIsInitializing(false);
        }
      } else {
        // Recalculate existing skills on load
        try {
          const { recalculateProgressSkill } = await import('./progressHelper');
          for (const skill of skills) {
            await recalculateProgressSkill(skill.id);
          }
        } catch (error) {
          console.error('Failed to recalculate skills:', error);
        }
      }
    };
    initializeIfNeeded();
  }, [pupilId, instructorId, skills.length, skillsLoading]);

  const handleInitialize = async () => {
    if (!pupilId || !instructorId) return;
    setIsInitializing(true);
    try {
      await initializeProgressSkills(pupilId, instructorId, PROGRESS_SKILLS_DATA);
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

  if (skillsLoading || isInitializing) {
    return (
      <div className="space-y-4">
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
    );
  }

  const overallProgress = progressSummary?.overallPercent || 0;
  const completedSkills = progressSummary?.completedParentSkills || 0;

  return (
    <>
      <div className="space-y-6">
        {/* Overall Progress Summary */}
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

        {/* Skill Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {skills.map((skill, index) => {
            const theme = SKILL_COLORS[index % SKILL_COLORS.length];
            return (
              <Card
                key={skill.id}
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1"
                style={{
                  background: theme.background,
                  borderColor: theme.border,
                  borderWidth: '3px',
                  borderRadius: '20px',
                  minHeight: '180px'
                }}
                onClick={() => setSelectedSkillId(skill.id)}
              >
                <CardContent className="p-5 space-y-3 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900 flex-1 leading-tight">
                      {skill.title}
                    </h3>
                    <Badge
                      className="shrink-0 font-semibold"
                      style={{
                        backgroundColor: theme.chip.bg,
                        color: theme.chip.text,
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '8px'
                      }}
                    >
                      {getStatusLabel(skill.status)}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      {skill.subsectionsCompleted} / {skill.subsectionsTotal} sections
                    </p>
                    <div className="space-y-2">
                      <div className="w-full bg-white/70 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${skill.subsectionsRatio * 100}%`,
                            backgroundColor: theme.accent
                          }}
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        {Math.round(skill.subsectionsRatio * 100)}% complete
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mock Tests Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Mock Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <MockTestsSection pupilId={pupilId} />
          </CardContent>
        </Card>

        {/* Test Routes Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Test Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <TestRoutesSection pupilId={pupilId} />
          </CardContent>
        </Card>
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