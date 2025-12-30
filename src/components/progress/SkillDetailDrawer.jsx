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

const STATUS_THEME = {
  not_started: {
    background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE99F 100%)',
    border: '#FFB800',
    accent: '#FFB800',
    chip: { bg: '#FFE066', text: '#4A3600' }
  },
  in_progress: {
    background: 'linear-gradient(135deg, #FFF0E6 0%, #FFCFA3 100%)',
    border: '#FF8C42',
    accent: '#FF8C42',
    chip: { bg: '#FFB380', text: '#5C2600' }
  },
  completed: {
    background: 'linear-gradient(135deg, #E6FFF0 0%, #99F5C2 100%)',
    border: '#00D66B',
    accent: '#00D66B',
    chip: { bg: '#66E6A8', text: '#004D26' }
  }
};

export default function SkillDetailDrawer({ skillId, open, onClose, pupilId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: skill } = useQuery({
    queryKey: ['progressSkill', skillId],
    queryFn: () => base44.entities.ProgressSkill.filter({ id: skillId }).then(s => s[0]),
    enabled: !!skillId && open
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

  const theme = STATUS_THEME[skill.status];

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
                      Mark as completed using one method
                    </Label>
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
                    <p className="text-xs text-slate-500 italic">
                      Selecting one option marks the sub-section as completed. Only one option can be selected.
                    </p>
                  </div>

                  {subsection.isCompleted && (
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