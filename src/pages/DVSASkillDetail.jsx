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
import { ArrowLeft, BookOpen, ClipboardCheck, Users, Loader2, Send, CheckCircle2, Clock, Trophy, Edit, Eye, FileText, StickyNote, UserX, Video, Plus, Trash2, Pencil, Lock, Zap } from 'lucide-react';
import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';
import { Input } from '@/components/ui/input';
import { getSkillById, DVSA_SKILLS_DATA } from '@/components/dvsa/dvsaSkillsData';
import StudyMaterial from '@/components/dvsa/StudyMaterial';
import McqQuiz from '@/components/dvsa/McqQuiz';
import { Textarea } from '@/components/ui/textarea';

export default function DVSASkillDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const skillId = urlParams.get('skillId');
  const pupilIdParam = urlParams.get('pupilId');

  const [activeTab, setActiveTab] = useState('material');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [selectedPupils, setSelectedPupils] = useState([]);
  const [assignComponents, setAssignComponents] = useState('both');
  const [materialProgress, setMaterialProgress] = useState({ scrollDepth: 0, timeSpent: 0 });
  const [instructorNotes, setInstructorNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoInput, setVideoInput] = useState('');

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
  };

  const queryClient = useQueryClient();
  const skill = getSkillById(skillId);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { hasValidSub } = useInstructorSubscription(user?.id);

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

  const { data: myAssignment } = useQuery({
    queryKey: ['mySkillAssignment', skillId, user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'user') return null;
      const assignments = await base44.entities.SkillAssignment.filter({ skillId, pupilId: user.id });
      return assignments[0] || null;
    },
    enabled: !!skillId && !!user
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['skillAssignmentsForSkill', skillId],
    queryFn: () => base44.entities.SkillAssignment.filter({ skillId }),
    enabled: !!skillId
  });

  const { data: customMaterial } = useQuery({
    queryKey: ['skillMaterial', skillId, user?.id],
    queryFn: async () => {
      const materials = await base44.entities.SkillMaterial.filter({ skillId, instructorId: user.id });
      return materials[0] || null;
    },
    enabled: !!skillId && !!user?.id
  });

  const { data: skillNotes } = useQuery({
    queryKey: ['skillNotes', skillId, user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'admin') return null;
      const notes = await base44.entities.SkillMaterial.filter({ skillId, instructorId: user.id });
      return notes[0] || null;
    },
    enabled: !!skillId && !!user
  });

  const saveVideoMutation = useMutation({
    mutationFn: async (url) => {
      const videoId = extractYoutubeId(url);
      const data = { youtubeUrl: url, youtubeVideoId: videoId };
      if (customMaterial) {
        return base44.entities.SkillMaterial.update(customMaterial.id, data);
      }
      return base44.entities.SkillMaterial.create({ skillId, content: '', ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['skillMaterial', skillId]);
      setIsEditingVideo(false);
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async () => {
      if (customMaterial) {
        return base44.entities.SkillMaterial.update(customMaterial.id, { youtubeUrl: '', youtubeVideoId: '' });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['skillMaterial', skillId])
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

  const saveNotesMutation = useMutation({
    mutationFn: async (notes) => {
      const data = { 
        content: notes,
        skillId,
        instructorId: user.id,
        title: `${skill.skillTitle} - Instructor Notes`,
        lastSavedAt: new Date().toISOString()
      };
      if (skillNotes) {
        return base44.entities.SkillMaterial.update(skillNotes.id, data);
      } else {
        return base44.entities.SkillMaterial.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['skillNotes', skillId, user?.id]);
    }
  });

  const removeAllAssignmentsMutation = useMutation({
    mutationFn: async () => {
      const assignmentIds = allAssignments.map(a => a.id);
      for (const id of assignmentIds) {
        await base44.entities.SkillAssignment.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['skillAssignmentsForSkill', skillId]);
      setShowRemoveAllModal(false);
    }
  });

  const materialContent = skill?.learningMaterial || '<p>Content for this skill will be added soon.</p>';
  
  React.useEffect(() => {
    if (skillNotes?.content) {
      setInstructorNotes(skillNotes.content);
    }
  }, [skillNotes]);

  const handleMaterialProgress = useCallback((progress) => {
    setMaterialProgress(progress);
    const activeAssignment = assignment || myAssignment;
    if (activeAssignment && progress.timeSpent > 0) {
      const shouldUpdate = !activeAssignment.hasOpenedMaterial || 
        progress.scrollDepth > (activeAssignment.scrollDepthPercentage || 0) ||
        progress.timeSpent > (activeAssignment.totalTimeSpentMs / 1000 || 0);
      
      if (shouldUpdate) {
        updateAssignmentMutation.mutate({
          id: activeAssignment.id,
          data: {
            hasOpenedMaterial: true,
            materialOpenedAt: activeAssignment.materialOpenedAt || new Date().toISOString(),
            totalTimeSpentMs: Math.max(activeAssignment.totalTimeSpentMs || 0, progress.timeSpent * 1000),
            scrollDepthPercentage: Math.max(activeAssignment.scrollDepthPercentage || 0, progress.scrollDepth),
            status: activeAssignment.status === 'not_started' ? 'in_progress' : activeAssignment.status
          }
        });
      }
    }
  }, [assignment, myAssignment, updateAssignmentMutation]);

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
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('DVSASkills')}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Skills
            </Button>
          </Link>
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              {allAssignments.length > 0 && (
                <Button 
                  onClick={() => setShowRemoveAllModal(true)}
                  variant="destructive"
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Remove All Pupils
                </Button>
              )}
              <Button 
                onClick={() => setShowAssignModal(true)}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
              >
                <Send className="w-4 h-4 mr-2" />
                Assign to Pupils
              </Button>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">{skill.skillTitle}</h1>
          </div>
          <p className="text-slate-600 mb-1">{skill.shortDescription}</p>
          <p className="text-slate-500 text-sm">Last updated: December 2025</p>
        </div>

        {selectedPupil && (
          <div className="mb-6 flex items-center gap-4 p-4 bg-white rounded-lg border">
            <Badge className="bg-slate-100 text-slate-700">
              <Users className="w-3 h-3 mr-1" />
              {selectedPupil.firstName} {selectedPupil.lastName}
            </Badge>
            {assignment?.passedMcq && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
              </Badge>
            )}
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm mb-6 w-full justify-start">
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
            {user?.role === 'admin' && (
              <>
                <TabsTrigger value="progress" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  Pupil Progress
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <StickyNote className="w-4 h-4" />
                  My Notes
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="material">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                {user?.role === 'admin' && !hasValidSub ? (
                  <div className="text-center py-12">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Study Material Locked</h3>
                    <p className="text-slate-500 mb-6">Start a free trial to access study material and practice questions.</p>
                    <a href="/InstructorSubscription">
                      <button className="inline-flex items-center gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold px-6 py-3 rounded-lg transition-colors">
                        <Zap className="w-4 h-4" />
                        Start Free Trial
                      </button>
                    </a>
                  </div>
                ) : user?.role === 'admin' ? (
                  <StudyMaterial
                    content={materialContent}
                    onProgress={handleMaterialProgress}
                    isComplete={assignment?.hasOpenedMaterial}
                  />
                ) : myAssignment ? (
                  <StudyMaterial
                    content={materialContent}
                    onProgress={handleMaterialProgress}
                    isComplete={myAssignment.hasOpenedMaterial}
                  />
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>This skill has not been assigned to you yet</p>
                    <p className="text-sm mt-1">Contact your instructor to get access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                {user?.role === 'admin' && !hasValidSub ? (
                  <div className="text-center py-12">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Practice Questions Locked</h3>
                    <p className="text-slate-500 mb-6">Start a free trial to access practice questions.</p>
                    <a href="/InstructorSubscription">
                      <button className="inline-flex items-center gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold px-6 py-3 rounded-lg transition-colors">
                        <Zap className="w-4 h-4" />
                        Start Free Trial
                      </button>
                    </a>
                  </div>
                ) : !skill.mcqQuiz?.questions?.length ? (
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

          <TabsContent value="notes">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Instructor Notes</CardTitle>
                <p className="text-sm text-slate-600">Personal notes about this skill (only visible to you)</p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={instructorNotes}
                  onChange={(e) => setInstructorNotes(e.target.value)}
                  placeholder="Add your personal notes about this skill..."
                  className="min-h-[300px] mb-4"
                />
                <Button 
                  onClick={() => saveNotesMutation.mutate(instructorNotes)}
                  disabled={saveNotesMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {saveNotesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {user?.role === 'admin' && (
          <Card className="border-0 shadow-sm mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#071739]" />
                  Video Tutorial
                </CardTitle>
                {!isEditingVideo && hasValidSub && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setVideoInput(customMaterial?.youtubeUrl || ''); setIsEditingVideo(true); }}
                    className="gap-2"
                  >
                    {customMaterial?.youtubeVideoId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {customMaterial?.youtubeVideoId ? 'Edit Video' : 'Add Video'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingVideo ? (
                <div className="space-y-3">
                  <Input
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste YouTube URL (e.g. https://youtube.com/watch?v=...)" 
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveVideoMutation.mutate(videoInput)}
                      disabled={!videoInput || saveVideoMutation.isPending}
                      className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                    >
                      {saveVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingVideo(false)}>Cancel</Button>
                  </div>
                </div>
              ) : customMaterial?.youtubeVideoId ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${customMaterial.youtubeVideoId}`}
                      title="Video Tutorial"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteVideoMutation.mutate()}
                    disabled={deleteVideoMutation.isPending}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Video
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No video tutorial added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          © {new Date().getFullYear()} Mobrage Driving Academy. All rights reserved.
        </p>
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

      <Dialog open={showRemoveAllModal} onOpenChange={setShowRemoveAllModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove All Assigned Pupils</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              This will remove this study material from all {allAssignments.length} assigned pupil{allAssignments.length !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveAllModal(false)}>Cancel</Button>
            <Button
              onClick={() => removeAllAssignmentsMutation.mutate()}
              disabled={removeAllAssignmentsMutation.isPending}
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700"
            >
              {removeAllAssignmentsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove All'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}