import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, ClipboardCheck, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { getSkillById } from '@/components/dvsa/dvsaSkillsData';
import StudyMaterial from '@/components/dvsa/StudyMaterial';
import McqQuiz from '@/components/dvsa/McqQuiz';

export default function LearnerSkillStudy() {
  const urlParams = new URLSearchParams(window.location.search);
  const skillId = urlParams.get('skillId');

  const [activeStep, setActiveStep] = useState('study');
  const [materialProgress, setMaterialProgress] = useState({ scrollDepth: 0, timeSpent: 0 });

  const queryClient = useQueryClient();
  const skill = getSkillById(skillId);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail[0] || null;
    },
    enabled: !!user
  });

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['mySkillAssignment', skillId, pupil?.id],
    queryFn: async () => {
      const assignments = await base44.entities.SkillAssignment.filter({ skillId, pupilId: pupil.id });
      return assignments[0] || null;
    },
    enabled: !!skillId && !!pupil?.id
  });

  const { data: customMaterial } = useQuery({
    queryKey: ['skillMaterial', skillId, pupil?.instructorId],
    queryFn: async () => {
      if (!pupil?.instructorId) return null;
      const materials = await base44.entities.SkillMaterial.filter({ skillId, instructorId: pupil.instructorId });
      const mat = materials[0] || null;
      // Only return if visible to pupils
      return mat?.isVisibleToPupils ? mat : null;
    },
    enabled: !!skillId && !!pupil?.instructorId
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SkillAssignment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['mySkillAssignment', skillId, pupil?.id])
  });

  const createAttemptMutation = useMutation({
    mutationFn: (data) => base44.entities.McqAttempt.create(data)
  });

  const handleMaterialProgress = useCallback((progress) => {
    setMaterialProgress(progress);
    if (assignment && progress.timeSpent > 0) {
      const shouldUpdate = !assignment.hasOpenedMaterial || 
        progress.scrollDepth > (assignment.scrollDepthPercentage || 0);
      
      if (shouldUpdate) {
        updateAssignmentMutation.mutate({
          id: assignment.id,
          data: {
            hasOpenedMaterial: true,
            materialOpenedAt: assignment.materialOpenedAt || new Date().toISOString(),
            totalTimeSpentMs: Math.max(assignment.totalTimeSpentMs || 0, progress.timeSpent * 1000),
            scrollDepthPercentage: Math.max(assignment.scrollDepthPercentage || 0, progress.scrollDepth),
            status: assignment.status === 'not_started' ? 'in_progress' : assignment.status
          }
        });
      }
    }
  }, [assignment, updateAssignmentMutation]);

  const handleQuizComplete = async (result) => {
    if (!assignment) return;

    await createAttemptMutation.mutateAsync({
      assignmentId: assignment.id,
      pupilId: pupil.id,
      skillId,
      completedAt: new Date().toISOString(),
      score: result.score,
      totalQuestions: result.totalQuestions,
      passed: result.passed,
      answers: result.answers
    });

    const newBestScore = Math.max(assignment.bestScore || 0, result.score);
    await updateAssignmentMutation.mutateAsync({
      id: assignment.id,
      data: {
        bestScore: newBestScore,
        lastAttemptScore: result.score,
        lastAttemptDate: new Date().toISOString(),
        passedMcq: result.passed || assignment.passedMcq,
        numberOfAttempts: (assignment.numberOfAttempts || 0) + 1,
        status: result.passed ? 'completed' : 'in_progress'
      }
    });

    queryClient.invalidateQueries(['mySkillAssignments']);
  };

  const canTakeQuiz = materialProgress.timeSpent >= 60 && materialProgress.scrollDepth >= 80;
  const quizUnlocked = canTakeQuiz || assignment?.hasOpenedMaterial;
  const materialContent = customMaterial?.content || skill?.learningMaterial;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!skill || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <div className="max-w-3xl mx-auto text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">This skill hasn't been assigned to you yet</p>
          <Link to={createPageUrl('LearnerSkills')}>
            <Button variant="outline" className="mt-4">Back to Skills</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('LearnerSkills')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Skills
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-teal-100 text-teal-700">Skill #{skill.skillNumber}</Badge>
            {assignment.passedMcq && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{skill.skillTitle}</h1>
          <p className="text-slate-500 mt-1">{skill.shortDescription}</p>
        </motion.div>

        {/* Step Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveStep('study')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              activeStep === 'study' 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                assignment.hasOpenedMaterial ? 'bg-emerald-100' : 'bg-slate-100'
              }`}>
                {assignment.hasOpenedMaterial ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-sm font-bold text-slate-500">1</span>
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">Study Material</p>
                <p className="text-sm text-slate-500">Read the learning content</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => quizUnlocked && setActiveStep('quiz')}
            disabled={!quizUnlocked}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              activeStep === 'quiz' 
                ? 'border-teal-500 bg-teal-50' 
                : quizUnlocked 
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-100 bg-slate-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                assignment.passedMcq ? 'bg-emerald-100' : quizUnlocked ? 'bg-slate-100' : 'bg-slate-50'
              }`}>
                {assignment.passedMcq ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : !quizUnlocked ? (
                  <Lock className="w-4 h-4 text-slate-300" />
                ) : (
                  <span className="text-sm font-bold text-slate-500">2</span>
                )}
              </div>
              <div className="text-left">
                <p className={`font-medium ${quizUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>Take Quiz</p>
                <p className="text-sm text-slate-500">
                  {assignment.passedMcq 
                    ? `Passed (${assignment.bestScore}/${skill.mcqQuiz?.totalQuestions || 10})`
                    : quizUnlocked 
                      ? 'Test your knowledge' 
                      : 'Complete study first'}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {activeStep === 'study' ? (
              materialContent ? (
                <StudyMaterial
                  content={materialContent}
                  onProgress={handleMaterialProgress}
                  isComplete={assignment.hasOpenedMaterial}
                />
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Learning material coming soon</p>
                </div>
              )
            ) : (
              skill.mcqQuiz ? (
                <McqQuiz
                  quiz={skill.mcqQuiz}
                  onComplete={handleQuizComplete}
                />
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Quiz coming soon</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}