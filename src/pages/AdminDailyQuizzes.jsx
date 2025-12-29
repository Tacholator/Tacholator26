import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ClipboardCheck, Search, Plus, Calendar, Loader2, Edit, Trash2, CheckCircle, Archive } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import McqQuestionModal from '@/components/admin/McqQuestionModal';
import DailyQuizModal from '@/components/admin/DailyQuizModal';

export default function AdminDailyQuizzes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: dailyQuizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['dailyQuizzes'],
    queryFn: async () => {
      const quizzes = await base44.entities.DailyQuiz.list('-date');
      return quizzes;
    }
  });

  const { data: mcqQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['mcqQuestions', searchQuery, topicFilter, difficultyFilter],
    queryFn: async () => {
      let questions = await base44.entities.McqQuestion.filter({ isActive: true });
      
      if (searchQuery) {
        questions = questions.filter(q => 
          q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.topicLabel.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (topicFilter !== 'all') {
        questions = questions.filter(q => q.topicId === topicFilter);
      }
      
      if (difficultyFilter !== 'all') {
        questions = questions.filter(q => q.difficulty === difficultyFilter);
      }
      
      return questions.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => base44.entities.McqQuestion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['mcqQuestions']);
      toast({ title: 'Question deleted' });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to delete question', variant: 'destructive' });
    }
  });

  const updateQuizStatusMutation = useMutation({
    mutationFn: ({ id, status, publishAt }) => 
      base44.entities.DailyQuiz.update(id, { status, publishAt }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyQuizzes']);
      toast({ title: 'Quiz status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update quiz status', variant: 'destructive' });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyQuiz.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyQuizzes']);
      toast({ title: 'Quiz deleted' });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to delete quiz', variant: 'destructive' });
    }
  });

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizModalOpen(true);
  };

  const handleDeleteClick = (item, type) => {
    setItemToDelete({ ...item, type });
    setDeleteDialogOpen(true);
  };

  const handlePublishQuiz = (quiz) => {
    updateQuizStatusMutation.mutate({
      id: quiz.id,
      status: 'published',
      publishAt: quiz.publishAt || new Date().toISOString()
    });
  };

  const handleArchiveQuiz = (quiz) => {
    updateQuizStatusMutation.mutate({
      id: quiz.id,
      status: 'archived'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'bg-slate-100 text-slate-700',
      scheduled: 'bg-blue-100 text-blue-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-gray-100 text-gray-600'
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const getDifficultyBadge = (difficulty) => {
    const variants = {
      easy: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-rose-100 text-rose-700'
    };
    return <Badge className={variants[difficulty]}>{difficulty}</Badge>;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Denied</h2>
          <p className="text-slate-500">Only administrators can access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-800">Daily Quizzes</h1>
          </div>
          <p className="text-slate-500">
            Manage the question bank and schedule quizzes for pupils
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="bank">Question Bank ({mcqQuestions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quiz Schedule</CardTitle>
                <Button onClick={() => { setEditingQuiz(null); setQuizModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Quiz
                </Button>
              </CardHeader>
              <CardContent>
                {quizzesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : dailyQuizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No daily quizzes yet</h3>
                    <p className="text-slate-500 mb-4">Create a quiz to show pupils a Quiz of the Day</p>
                    <Button onClick={() => { setEditingQuiz(null); setQuizModalOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Quiz
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Published At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyQuizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell className="font-medium">
                            {moment(quiz.date).format('DD MMM YYYY')}
                          </TableCell>
                          <TableCell>{quiz.title}</TableCell>
                          <TableCell>{quiz.questionIds?.length || 0}</TableCell>
                          <TableCell>{getStatusBadge(quiz.status)}</TableCell>
                          <TableCell>
                            {quiz.publishAt ? moment(quiz.publishAt).format('DD/MM/YY HH:mm') : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuiz(quiz)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {(quiz.status === 'draft' || quiz.status === 'scheduled') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePublishQuiz(quiz)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {quiz.status === 'published' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleArchiveQuiz(quiz)}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(quiz, 'quiz')}
                                className="text-rose-600 hover:text-rose-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
                      <SelectTrigger className="w-full lg:w-48">
                        <SelectValue placeholder="Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All topics</SelectItem>
                        <SelectItem value="legal_responsibilities">Legal Responsibilities</SelectItem>
                        <SelectItem value="mirrors_signals_speed">Mirrors & Signals</SelectItem>
                        <SelectItem value="junctions_roundabouts">Junctions</SelectItem>
                        <SelectItem value="emergency_situations">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : mcqQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No questions yet</h3>
                    <p className="text-slate-500 mb-4">Add your first MCQ question to the bank</p>
                    <Button onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mcqQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{question.topicLabel}</TableCell>
                          <TableCell>{getDifficultyBadge(question.difficulty)}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {question.questionText}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(question, 'question')}
                                className="text-rose-600 hover:text-rose-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <McqQuestionModal
          open={questionModalOpen}
          onClose={() => { setQuestionModalOpen(false); setEditingQuestion(null); }}
          question={editingQuestion}
        />

        <DailyQuizModal
          open={quizModalOpen}
          onClose={() => { setQuizModalOpen(false); setEditingQuiz(null); }}
          quiz={editingQuiz}
          adminId={user?.id}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {itemToDelete?.type === 'quiz' ? 'Quiz' : 'Question'}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this {itemToDelete?.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (itemToDelete?.type === 'quiz') {
                    deleteQuizMutation.mutate(itemToDelete.id);
                  } else {
                    deleteQuestionMutation.mutate(itemToDelete.id);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}