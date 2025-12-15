import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, BookOpen, ClipboardCheck, Users, Loader2, Send, CheckCircle2, Clock, Trophy, Edit, Eye } from 'lucide-react';
import { getSkillById, DVSA_SKILLS_DATA } from '@/components/dvsa/dvsaSkillsData';
import StudyMaterial from '@/components/dvsa/StudyMaterial';
import McqQuiz from '@/components/dvsa/McqQuiz';
import MaterialEditor from '@/components/dvsa/MaterialEditor';

export default function DVSASkillDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const skillId = urlParams.get('skillId');
  const pupilIdParam = urlParams.get('pupilId');

  const [activeTab, setActiveTab] = useState('material');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPupils, setSelectedPupils] = useState([]);
  const [assignComponents, setAssignComponents] = useState('both');
  const [materialProgress, setMaterialProgress] = useState({ scrollDepth: 0, timeSpent: 0 });
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);

  const queryClient = useQueryClient();
  const skill = getSkillById(skillId);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user
  });

  const { data: assignment } = useQuery({
    queryKey: ['skillAssignment', skillId, pupilIdParam],
    queryFn: async () => {
      if (!pupilIdParam) return null;
      const assignments = await base44.entities.SkillAssignment.filter({ skillId, pupilId: pupilIdParam });
      return assignments[0] || null;
    },
    enabled: !!skillId && !!pupilIdParam
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['skillAssignmentsForSkill', skillId],
    queryFn: () => base44.entities.SkillAssignment.filter({ skillId }),
    enabled: !!skillId
  });

  const { data: customMaterial } = useQuery({
    queryKey: ['skillMaterial', skillId],
    queryFn: async () => {
      const materials = await base44.entities.SkillMaterial.filter({ skillId });
      return materials[0] || null;
    },
    enabled: !!skillId
  });

  const selectedPupil = pupils.find(p => p.id === pupilIdParam);

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.SkillAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['skillAssignments']);
      setShowAssignModal(false);
      setSelectedPupils([]);
    }
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SkillAssignment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['skillAssignment', skillId, pupilIdParam])
  });

  const createAttemptMutation = useMutation({
    mutationFn: (data) => base44.entities.McqAttempt.create(data),
    onSuccess: () => queryClient.invalidateQueries(['skillAssignment', skillId, pupilIdParam])
  });

  const saveMaterialMutation = useMutation({
    mutationFn: async ({ content, title, description, isVisibleToPupils }) => {
      const data = { 
        content, 
        title, 
        description,
        isVisibleToPupils,
        lastSavedAt: new Date().toISOString()
      };
      if (customMaterial) {
        return base44.entities.SkillMaterial.update(customMaterial.id, data);
      } else {
        return base44.entities.SkillMaterial.create({ skillId, instructorId: user.id, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['skillMaterial', skillId]);
    }
  });

  const materialContent = customMaterial?.content || skill?.learningMaterial;

  const handleMaterialProgress = useCallback((progress) => {
    setMaterialProgress(progress);
    if (assignment && progress.timeSpent > 0) {
      const shouldUpdate = !assignment.hasOpenedMaterial || 
        progress.scrollDepth > (assignment.scrollDepthPercentage || 0) ||
        progress.timeSpent > (assignment.totalTimeSpentMs / 1000 || 0);
      
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
      pupilId: pupilIdParam,
      skillId,
      startedAt: new Date().toISOString(),
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
  };

  const handleAssign = async () => {
    for (const pupilId of selectedPupils) {
      await createAssignmentMutation.mutateAsync({
        skillId,
        skillNumber: skill.skillNumber,
        pupilId,
        instructorId: user.id,
        assignedComponents: assignComponents,
        status: 'not_started'
      });
    }
  };

  const canTakeQuiz = materialProgress.timeSpent >= 60 && materialProgress.scrollDepth >= 80;

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Skill not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('DVSASkills')}>
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-teal-100 text-teal-700">Skill #{skill.skillNumber}</Badge>
                {assignment?.passedMcq && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{skill.skillTitle}</h1>
              <p className="text-slate-500 mt-1">{skill.shortDescription}</p>

              {selectedPupil && (
                <div className="mt-4 flex items-center gap-4">
                  <Badge className="bg-slate-100 text-slate-700">
                    <Users className="w-3 h-3 mr-1" />
                    {selectedPupil.firstName} {selectedPupil.lastName}
                  </Badge>
                  {assignment && (
                    <>
                      {assignment.bestScore !== undefined && (
                        <span className="text-sm text-slate-500">
                          Best: {assignment.bestScore}/{skill.mcqQuiz?.totalQuestions || 10}
                        </span>
                      )}
                      {assignment.numberOfAttempts > 0 && (
                        <span className="text-sm text-slate-500">
                          Attempts: {assignment.numberOfAttempts}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <Button 
              onClick={() => setShowAssignModal(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Assign to Pupils
            </Button>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm mb-6">
            <TabsTrigger value="material" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Study Material
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2" disabled={!skill.mcqQuiz?.questions?.length}>
              <ClipboardCheck className="w-4 h-4" />
              Take Quiz
            </TabsTrigger>
            <TabsTrigger value="viewQuestions" className="gap-2" disabled={!skill.mcqQuiz?.questions?.length}>
              <Eye className="w-4 h-4" />
              View Questions
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <Trophy className="w-4 h-4" />
              Pupil Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="material">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                {user?.role === 'admin' ? (
                  isEditingMaterial ? (
                    <MaterialEditor
                      initialContent={materialContent || ''}
                      initialTitle={customMaterial?.title || skill.skillTitle}
                      initialDescription={customMaterial?.description || skill.shortDescription}
                      onSave={async ({ content, title, description, isVisibleToPupils }) => {
                        await saveMaterialMutation.mutateAsync({ content, title, description, isVisibleToPupils });
                        setIsEditingMaterial(false);
                      }}
                      onCancel={() => setIsEditingMaterial(false)}
                    />
                  ) : (
                    <>
                      <div className="flex justify-end mb-4">
                        <Button 
                          onClick={() => setIsEditingMaterial(true)}
                          variant="outline"
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Material
                        </Button>
                      </div>
                      {materialContent ? (
                        <StudyMaterial
                          content={materialContent}
                          onProgress={handleMaterialProgress}
                          isComplete={assignment?.hasOpenedMaterial}
                        />
                      ) : (
                        <div className="text-center py-12 text-slate-400">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No learning material available yet</p>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  assignment && materialContent ? (
                    <StudyMaterial
                      content={materialContent}
                      onProgress={handleMaterialProgress}
                      isComplete={assignment?.hasOpenedMaterial}
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>This material has not been assigned to you yet</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                {!skill.mcqQuiz?.questions?.length ? (
                  <div className="text-center py-8 text-slate-500">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No quiz questions available for this skill yet</p>
                  </div>
                ) : !canTakeQuiz && !assignment?.hasOpenedMaterial ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Complete the study material first to unlock the quiz</p>
                  </div>
                ) : (
                  <McqQuiz
                    quiz={skill.mcqQuiz}
                    onComplete={handleQuizComplete}
                    disabled={!assignment}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewQuestions">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Quiz Questions & Answers</CardTitle>
                <p className="text-sm text-slate-600">Review all questions and correct answers</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {skill.mcqQuiz.questions.map((q, idx) => (
                    <div key={q.questionId} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className="bg-teal-100 text-teal-700 shrink-0">Q{idx + 1}</Badge>
                        <h4 className="font-medium text-slate-800">{q.questionText}</h4>
                      </div>
                      <div className="space-y-2 ml-2">
                        {q.options.map((option, optIdx) => (
                          <div 
                            key={optIdx}
                            className={`p-3 rounded-lg border-2 ${
                              optIdx === q.correctOptionIndex 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700">{option}</span>
                              {optIdx === q.correctOptionIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Pupil Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {allAssignments.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No assignments yet</p>
                ) : (
                  <div className="space-y-3">
                    {allAssignments.map(a => {
                      const pupil = pupils.find(p => p.id === a.pupilId);
                      const trafficLight = a.passedMcq ? 'green' : (a.hasOpenedMaterial && a.numberOfAttempts > 0) ? 'amber' : 'red';
                      return (
                        <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${
                            trafficLight === 'green' ? 'bg-emerald-500' :
                            trafficLight === 'amber' ? 'bg-amber-500' : 'bg-slate-300'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-slate-700">
                              {pupil?.firstName} {pupil?.lastName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {a.passedMcq ? 'Passed' : a.hasOpenedMaterial ? 'In Progress' : 'Not Started'}
                              {a.bestScore !== undefined && ` • Best: ${a.bestScore}/${skill.mcqQuiz?.totalQuestions || 10}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign "{skill.skillTitle}" to Pupils</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Select Pupils</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {pupils.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <Checkbox
                      checked={selectedPupils.includes(p.id)}
                      onCheckedChange={(checked) => {
                        setSelectedPupils(checked 
                          ? [...selectedPupils, p.id]
                          : selectedPupils.filter(id => id !== p.id)
                        );
                      }}
                    />
                    <span>{p.firstName} {p.lastName}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Assign</p>
              <Select value={assignComponents} onValueChange={setAssignComponents}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Material + Quiz</SelectItem>
                  <SelectItem value="material">Material Only</SelectItem>
                  <SelectItem value="mcq">Quiz Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={selectedPupils.length === 0 || createAssignmentMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createAssignmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}