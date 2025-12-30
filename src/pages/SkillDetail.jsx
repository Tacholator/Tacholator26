import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { recalculateSkillProgress } from '@/components/progress/SkillProgressHelper';

export default function SkillDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get('skillId');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isInstructor = user?.role === 'admin';

  const { data: skill } = useQuery({
    queryKey: ['skill', skillId],
    queryFn: () => base44.entities.Skill.filter({ id: skillId }).then(s => s[0]),
    enabled: !!skillId
  });

  const { data: subsections = [] } = useQuery({
    queryKey: ['subsections', skillId],
    queryFn: () => base44.entities.SkillSubsection.filter({ skillId }).then(s => s.sort((a, b) => a.order - b.order)),
    enabled: !!skillId
  });

  const updateSubsectionMutation = useMutation({
    mutationFn: async ({ subsectionId, status }) => {
      const user = await base44.auth.me();
      const updates = { status };
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
        updates.completedByUserId = user.id;
      } else {
        updates.completedAt = null;
        updates.completedByUserId = null;
      }
      await base44.entities.SkillSubsection.update(subsectionId, updates);
      await recalculateSkillProgress(skillId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subsections', skillId]);
      queryClient.invalidateQueries(['skill', skillId]);
      queryClient.invalidateQueries(['skills', skill?.pupilId]);
      queryClient.invalidateQueries(['progressSummary', skill?.pupilId]);
      toast({ title: 'Subsection updated' });
    }
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ override, reason }) => {
      const user = await base44.auth.me();
      const updates = { overrideCompleted: override };
      
      if (override) {
        updates.overrideReason = reason;
        updates.overrideByUserId = user.id;
        updates.overrideAt = new Date().toISOString();
        updates.status = 'completed';
        updates.completedAt = new Date().toISOString();
        updates.completedByUserId = user.id;
      } else {
        updates.overrideReason = null;
        updates.overrideByUserId = null;
        updates.overrideAt = null;
      }
      
      await base44.entities.Skill.update(skillId, updates);
      if (!override) {
        await recalculateSkillProgress(skillId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['skill', skillId]);
      queryClient.invalidateQueries(['skills', skill?.pupilId]);
      queryClient.invalidateQueries(['progressSummary', skill?.pupilId]);
      setShowOverrideModal(false);
      setOverrideReason('');
      toast({ title: skill?.overrideCompleted ? 'Override removed' : 'Skill marked as completed' });
    }
  });

  const handleOverrideToggle = (checked) => {
    if (checked) {
      setShowOverrideModal(true);
    } else {
      toggleOverrideMutation.mutate({ override: false });
    }
  };

  const handleOverrideConfirm = () => {
    if (overrideReason.length < 10) {
      toast({ title: 'Reason must be at least 10 characters', variant: 'destructive' });
      return;
    }
    toggleOverrideMutation.mutate({ override: true, reason: overrideReason });
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

  if (!skill) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('SkillBasedProgress', `pupilId=${skill.pupilId}`))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Skills
        </Button>

        <Card className="border-t-4 border-[#F7B602]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{skill.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(skill.status)}
                  <span className="text-sm text-slate-600">
                    {skill.subsectionsCompleted}/{skill.subsectionsTotal} completed
                  </span>
                </div>
              </div>
              {getStatusIcon(skill.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={skill.subsectionsCompletionRatio * 100} className="h-3" />
              <p className="text-xs text-slate-500">
                {Math.round(skill.subsectionsCompletionRatio * 100)}% within this skill
              </p>
            </div>
          </CardContent>
        </Card>

        {isInstructor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructor Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex-1">
                  <Label htmlFor="override-toggle" className="font-medium text-slate-800">
                    Mark Skill as Completed (Override)
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">
                    Manually mark this skill as completed regardless of subsection progress
                  </p>
                </div>
                <Switch
                  id="override-toggle"
                  checked={skill.overrideCompleted}
                  onCheckedChange={handleOverrideToggle}
                />
              </div>
              {skill.overrideCompleted && skill.overrideReason && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 text-sm">Override Reason:</p>
                      <p className="text-sm text-blue-700 mt-1">{skill.overrideReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subsections.map((subsection) => (
              <div
                key={subsection.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(subsection.status)}
                  <span className="text-slate-800">{subsection.title}</span>
                </div>
                <Select
                  value={subsection.status}
                  onValueChange={(value) => updateSubsectionMutation.mutate({ subsectionId: subsection.id, status: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Completion</DialogTitle>
            <DialogDescription>
              Provide a reason for marking this skill as completed despite incomplete subsections.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="override-reason">Reason (minimum 10 characters)</Label>
            <Textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter reason for override..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleOverrideConfirm} disabled={overrideReason.length < 10}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}