import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { progressStates, drivingSkillsSections, mockTests } from './drivingSkillsData';
import { ChevronRight, Check, Loader2, Edit2, Award } from 'lucide-react';
import moment from 'moment';

export default function PupilProgressTracker({ pupilId, instructorId, isInstructor = true }) {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [notes, setNotes] = useState('');
  const [mockResults, setMockResults] = useState({});

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['drivingProgress', pupilId],
    queryFn: () => base44.entities.DrivingSkillProgress.filter({ pupilId }),
    enabled: !!pupilId
  });

  const { data: pupil } = useQuery({
    queryKey: ['pupil', pupilId],
    queryFn: () => base44.entities.Pupil.filter({ id: pupilId }).then(r => r[0]),
    enabled: !!pupilId
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ skillId, progressState }) => {
      const existing = progressData.find(p => p.skillId === skillId);
      if (existing) {
        return base44.entities.DrivingSkillProgress.update(existing.id, {
          progressState,
          notes,
          lastUpdated: new Date().toISOString()
        });
      } else {
        return base44.entities.DrivingSkillProgress.create({
          pupilId,
          instructorId,
          skillId,
          progressState,
          notes,
          lastUpdated: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['drivingProgress']);
      setSelectedSkill(null);
      setNotes('');
    }
  });

  const getProgressForSkill = (skillId) => {
    return progressData.find(p => p.skillId === skillId);
  };

  const getProgressColor = (state) => {
    const stateConfig = progressStates.find(s => s.id === state);
    return stateConfig?.color || 'bg-slate-100 text-slate-600';
  };

  const handleSkillClick = (skill) => {
    if (!isInstructor) return;
    const progress = getProgressForSkill(skill.id);
    setSelectedSkill(skill);
    setNotes(progress?.notes || '');
  };

  const handleSaveProgress = (progressState) => {
    updateProgressMutation.mutate({
      skillId: selectedSkill.id,
      progressState
    });
  };

  const renderSkillItem = (skill, level = 0) => {
    const progress = getProgressForSkill(skill.id);
    const stateLabel = progressStates.find(s => s.id === progress?.progressState)?.label;

    return (
      <div 
        key={skill.id}
        className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors ${
          isInstructor ? 'cursor-pointer' : ''
        }`}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => handleSkillClick(skill)}
      >
        <div className="flex items-center gap-3 flex-1">
          <ChevronRight className={`w-4 h-4 text-slate-400 ${level > 0 ? 'opacity-50' : ''}`} />
          <span className="text-sm text-slate-700">{skill.label}</span>
        </div>
        {progress && (
          <Badge className={`${getProgressColor(progress.progressState)} text-xs`}>
            {stateLabel}
          </Badge>
        )}
      </div>
    );
  };

  const renderTopic = (topic, level = 0) => {
    if (topic.type === 'skill') {
      return renderSkillItem(topic, level);
    }

    if (topic.type === 'group' && topic.subtopics) {
      return (
        <div key={topic.id} className="mb-2">
          <div className="font-medium text-slate-600 text-sm mb-2" style={{ marginLeft: `${level * 16}px` }}>
            {topic.label}
          </div>
          {topic.subtopics.map(subtopic => renderTopic(subtopic, level + 1))}
        </div>
      );
    }

    return null;
  };

  const calculateOverallProgress = () => {
    const allSkills = [];
    drivingSkillsSections.forEach(section => {
      section.topics.forEach(topic => {
        if (topic.type === 'skill') {
          allSkills.push(topic.id);
        } else if (topic.subtopics) {
          const extractSkills = (items) => {
            items.forEach(item => {
              if (item.type === 'skill') {
                allSkills.push(item.id);
              } else if (item.subtopics) {
                extractSkills(item.subtopics);
              }
            });
          };
          extractSkills(topic.subtopics);
        }
      });
    });

    const independentCount = allSkills.filter(skillId => {
      const progress = getProgressForSkill(skillId);
      return progress?.progressState === 'independent';
    }).length;

    return {
      total: allSkills.length,
      independent: independentCount,
      percentage: Math.round((independentCount / allSkills.length) * 100)
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-[#F7B602]/10 to-[#F7B602]/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Overall Progress</h3>
              <p className="text-sm text-slate-600">
                {overallProgress.independent} of {overallProgress.total} skills mastered
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#071739]">{overallProgress.percentage}%</div>
              <p className="text-xs text-slate-500">Independent</p>
            </div>
          </div>
          <div className="mt-4 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#F7B602] to-[#d99f02] transition-all duration-500"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Legend */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-600">Progress Levels:</span>
            {progressStates.map(state => (
              <Badge key={state.id} className={`${state.color} text-xs`}>
                {state.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Sections */}
      <Accordion type="multiple" className="space-y-3">
        {drivingSkillsSections.map((section, index) => (
          <AccordionItem 
            key={section.id} 
            value={section.id}
            className="border-0 shadow-sm rounded-lg bg-white overflow-hidden"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F7B602]/20 flex items-center justify-center text-[#071739] font-semibold text-sm">
                  {index + 1}
                </div>
                <span className="font-semibold text-slate-800">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="space-y-1">
                {section.topics.map(topic => renderTopic(topic))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Mock Tests Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F7B602]" />
            Mock Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockTests.map(test => (
              <div key={test.id} className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">{test.label}</h4>
                <div className="text-sm text-slate-500">Coming soon...</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Progress Dialog */}
      <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Progress: {selectedSkill?.label}</DialogTitle>
            <DialogDescription>
              Select the current progress level for this skill
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {progressStates.map(state => (
              <button
                key={state.id}
                onClick={() => handleSaveProgress(state.id)}
                disabled={updateProgressMutation.isPending}
                className={`w-full p-4 border-2 rounded-lg text-left hover:border-[#F7B602] transition-colors ${
                  getProgressForSkill(selectedSkill?.id)?.progressState === state.id
                    ? 'border-[#F7B602] bg-[#F7B602]/5'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">{state.label}</h4>
                    <p className="text-xs text-slate-600">{state.description}</p>
                  </div>
                  {getProgressForSkill(selectedSkill?.id)?.progressState === state.id && (
                    <Check className="w-5 h-5 text-[#F7B602] shrink-0" />
                  )}
                </div>
              </button>
            ))}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this skill..."
                rows={3}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}