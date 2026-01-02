import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { recalculateProgressSkill } from './progressHelper';
import { Loader2 } from 'lucide-react';

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

export default function SkillDetailDrawer({ skillId, open, onClose, pupilId, isInstructor = false }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: skill } = useQuery({
    queryKey: ['progressSkill', skillId],
    queryFn: () => base44.entities.ProgressSkill.filter({ id: skillId }).then(s => s[0]),
    enabled: !!skillId && open
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ['progressSkills', pupilId],
    queryFn: () => base44.entities.ProgressSkill.filter({ pupilId }).then(s => s.sort((a, b) => a.order - b.order)),
    enabled: !!pupilId && open
  });

  const { data: subsections = [] } = useQuery({
    queryKey: ['progressSubsections', skillId],
    queryFn: () => base44.entities.ProgressSubsection.filter({ skillId }).then(s => s.sort((a, b) => a.order - b.order)),
    enabled: !!skillId && open
  });

  const updateSubsectionMutation = useMutation({
    mutationFn: async ({ subsectionId, completedMethod }) => {
      const user = await base44.auth.me();
      const updates = {
        completedMethod,
        isCompleted: !!completedMethod,
        completedAt: completedMethod ? new Date().toISOString() : null,
        completedByUserId: completedMethod ? user.id : null
      };
      await base44.entities.ProgressSubsection.update(subsectionId, updates);
      await recalculateProgressSkill(skillId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progressSubsections', skillId]);
      queryClient.invalidateQueries(['progressSkill', skillId]);
      queryClient.invalidateQueries(['progressSkills', pupilId]);
      queryClient.invalidateQueries(['progressSummary', pupilId]);
    }
  });

  const handleMethodChange = async (subsectionId, value) => {
    try {
      const previousSkillStatus = skill?.status;
      await updateSubsectionMutation.mutateAsync({ subsectionId, completedMethod: value });
      
      // Check if skill just became completed
      const updatedSkill = await base44.entities.ProgressSkill.filter({ id: skillId }).then(s => s[0]);
      if (previousSkillStatus !== 'completed' && updatedSkill?.status === 'completed') {
        toast({ title: 'Skill completed ✅', description: 'Well done!' });
      }
    } catch (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleReset = async (subsectionId) => {
    await updateSubsectionMutation.mutateAsync({ subsectionId, completedMethod: null });
    toast({ title: 'Subsection reset', description: 'Marked as not completed' });
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  if (!skill) return null;

  const skillIndex = allSkills.findIndex(s => s.id === skill.id);
  const theme = SKILL_COLORS[skillIndex >= 0 ? skillIndex % SKILL_COLORS.length : 0];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{skill.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Card
            style={{
              background: theme.background,
              borderColor: theme.border,
              borderWidth: '3px',
              borderRadius: '20px'
            }}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{skill.title}</h3>
                <Badge
                  style={{
                    backgroundColor: theme.chip.bg,
                    color: theme.chip.text
                  }}
                >
                  {getStatusLabel(skill.status)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                {skill.subsectionsCompleted} / {skill.subsectionsTotal} completed
              </p>
              <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${skill.subsectionsRatio * 100}%`,
                    backgroundColor: theme.accent
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Sub-sections</h3>
            {subsections.map((subsection) => (
              <Card key={subsection.id} className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">{subsection.title}</h4>
                    <Badge
                      style={{
                        backgroundColor: subsection.isCompleted ? '#CDEEDB' : '#FFE8B3',
                        color: subsection.isCompleted ? '#0F3D22' : '#3B2F00'
                      }}
                    >
                      {subsection.isCompleted ? 'Completed' : 'Not completed'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-slate-600">
                      {isInstructor ? 'Mark progress level' : 'Progress level'}
                    </Label>
                    {isInstructor ? (
                      <RadioGroup
                        value={subsection.completedMethod || ''}
                        onValueChange={(value) => handleMethodChange(subsection.id, value)}
                      >
                        <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
                          <RadioGroupItem value="full_talkthrough" id={`${subsection.id}-full`} />
                          <Label htmlFor={`${subsection.id}-full`} className="cursor-pointer flex-1 text-sm">
                            Full Talkthrough
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
                          <RadioGroupItem value="prompt" id={`${subsection.id}-prompt`} />
                          <Label htmlFor={`${subsection.id}-prompt`} className="cursor-pointer flex-1 text-sm">
                            Prompt
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
                          <RadioGroupItem value="independent" id={`${subsection.id}-independent`} />
                          <Label htmlFor={`${subsection.id}-independent`} className="cursor-pointer flex-1 text-sm">
                            Independent
                          </Label>
                        </div>
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        <div className={`p-3 rounded-lg ${subsection.completedMethod === 'full_talkthrough' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-slate-50'}`}>
                          <p className="text-sm font-medium text-slate-700">Full Talkthrough</p>
                        </div>
                        <div className={`p-3 rounded-lg ${subsection.completedMethod === 'prompt' ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50'}`}>
                          <p className="text-sm font-medium text-slate-700">Prompt</p>
                        </div>
                        <div className={`p-3 rounded-lg ${subsection.completedMethod === 'independent' ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50'}`}>
                          <p className="text-sm font-medium text-slate-700">Independent</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 italic">
                      {isInstructor 
                        ? 'Only "Independent" counts as fully completed. Select one option per subsection.'
                        : 'Only "Independent" level means you have mastered this subsection.'}
                    </p>
                  </div>

                  {isInstructor && subsection.isCompleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(subsection.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 w-full"
                      disabled={updateSubsectionMutation.isPending}
                    >
                      {updateSubsectionMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Mark as not completed (Reset)'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}