import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle, TrendingUp, ChevronRight, ChevronLeft, Flag, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import McqResultsModal from './McqResultsModal';
import { courseWorkTopics } from './topicIndex';
import GoogleTTSAudioPlayer from '../learning/GoogleTTSAudioPlayer';

export default function McqQuizPaginated({ questionPack, topicId }) {
  const queryClient = useQueryClient();
  const [shuffledQuestions, setShuffledQuestions] = useState(() => {
    if (questionPack.settings.shuffle_questions) {
      return [...questionPack.questions].sort(() => Math.random() - 0.5);
    }
    return questionPack.questions;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [hasUserStartedAudio, setHasUserStartedAudio] = useState(false);
  const [autoReadEnabled, setAutoReadEnabled] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [showFlaggedReview, setShowFlaggedReview] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const audioPlayerRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['currentPupil', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!user?.id && user?.role === 'user'
  });

  const currentTopic = courseWorkTopics.find(t => t.id === topicId);
  const topicIdStr = currentTopic?.topicId;

  const { data: mcqStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['mcqStatus', pupil?.id, questionPack.id],
    queryFn: async () => {
      if (!pupil?.id) return null;
      const statuses = await base44.entities.McqStatus.filter({ 
        pupilId: pupil.id, 
        mcqPackId: questionPack.id 
      });
      return statuses.length > 0 ? statuses[0] : null;
    },
    enabled: !!pupil?.id
  });

  const { data: instructorSettings } = useQuery({
    queryKey: ['instructorSettings', pupil?.instructorId],
    queryFn: async () => {
      if (!pupil?.instructorId) return null;
      const settings = await base44.entities.InstructorMcqSettings.filter({ 
        instructorId: pupil.instructorId 
      });
      return settings.length > 0 ? settings[0] : null;
    },
    enabled: !!pupil?.instructorId
  });

  const { data: relatedHomework } = useQuery({
    queryKey: ['relatedHomework', pupil?.id, topicIdStr],
    queryFn: async () => {
      if (!pupil?.id) return [];
      const allHomework = await base44.entities.HomeworkItem.filter({ pupilId: pupil.id });
      return allHomework.filter(h => 
        h.status !== 'Completed' && 
        (h.description?.toLowerCase().includes(topicIdStr?.toLowerCase()) ||
         h.title?.toLowerCase().includes(topicIdStr?.toLowerCase()) ||
         h.description?.toLowerCase().includes('practice'))
      );
    },
    enabled: !!pupil?.id && !!topicIdStr
  });

  const createAttemptMutation = useMutation({
    mutationFn: async (attemptData) => {
      return await base44.entities.McqAttempt.create(attemptData);
    }
  });

  const upsertStatusMutation = useMutation({
    mutationFn: async (statusData) => {
      if (mcqStatus) {
        return await base44.entities.McqStatus.update(mcqStatus.id, statusData);
      } else {
        return await base44.entities.McqStatus.create(statusData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mcqStatus']);
    }
  });

  // Show loading state while pupil data is being fetched
  if (!pupil && user?.role === 'user') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F7B602] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
  const isAnswered = answers[currentQuestion?.id] !== undefined;

  // Build audio text for current question
  const buildAudioText = (question) => {
    if (!question) return '';
    const optionLabels = ['A', 'B', 'C', 'D'];
    let text = `Question ${currentQuestionIndex + 1}. ${question.question}. `;
    question.options.forEach((opt, idx) => {
      text += `Option ${optionLabels[idx]}. ${opt}. `;
    });
    return text;
  };

  const audioText = currentQuestion ? buildAudioText(currentQuestion) : '';

  const handleAnswerSelect = (optionIndex) => {
    if (submitted) return;
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFlag = (questionId) => {
    const isNowFlagged = !flaggedQuestions[questionId];
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: isNowFlagged
    }));

    if (isNowFlagged && currentQuestionIndex < shuffledQuestions.length - 1) {
      toast.success('Question flagged for review', {
        action: {
          label: 'Next Question',
          onClick: handleNext
        },
        duration: 3000
      });
    } else if (isNowFlagged) {
      toast.success('Question flagged for review');
    } else {
      toast.info('Flag removed');
    }
  };

  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const flaggedQuestionIds = shuffledQuestions
    .map((q, idx) => ({ id: q.id, index: idx }))
    .filter(q => flaggedQuestions[q.id]);

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setShowFlaggedReview(false);
    setAutoReadEnabled(false);
    setHasUserStartedAudio(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAudioPlay = () => {
    setHasUserStartedAudio(true);
    setAutoReadEnabled(true);
  };

  const handleAudioStop = () => {
    setAutoReadEnabled(false);
  };

  const handleSubmitClick = () => {
    if (flaggedCount > 0) {
      setShowSubmitConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!pupil?.id) {
      console.error('Cannot submit: pupil data not loaded');
      return;
    }
    setShowSubmitConfirm(false);

    let correctCount = 0;
    const answerArray = [];
    
    shuffledQuestions.forEach((q) => {
      const isCorrect = answers[q.id] === q.correct_answer_index;
      if (isCorrect) correctCount++;
      answerArray.push({
        questionId: q.id,
        selectedOptionIndex: answers[q.id],
        isCorrect
      });
    });
    
    setScore(correctCount);
    setSubmitted(true);
    
    const passed = correctCount >= questionPack.settings.pass_mark;
    const attemptNumber = (mcqStatus?.attemptCount || 0) + 1;
    const submittedAt = new Date().toISOString();

    // Create attempt record
    const attemptData = {
      pupilId: pupil.id,
      instructorId: pupil.instructorId,
      topicId: topicIdStr,
      mcqPackId: questionPack.id,
      attemptNumber,
      questionIds: shuffledQuestions.map(q => q.id),
      answers: answerArray,
      score: correctCount,
      totalQuestions: questionPack.settings.total_questions,
      passMark: questionPack.settings.pass_mark,
      passed,
      startedAt,
      submittedAt
    };

    const attempt = await createAttemptMutation.mutateAsync(attemptData);

    // Update or create status
    const statusData = mcqStatus ? {
      attemptCount: mcqStatus.attemptCount + 1,
      lastAttemptId: attempt.id,
      lastScore: correctCount,
      lastPassed: passed,
      lastAttemptAt: submittedAt,
      completed: mcqStatus.completed || passed,
      firstCompletedAt: mcqStatus.firstCompletedAt || (passed ? submittedAt : null)
    } : {
      pupilId: pupil.id,
      instructorId: pupil.instructorId,
      topicId: topicIdStr,
      mcqPackId: questionPack.id,
      attemptCount: 1,
      lastAttemptId: attempt.id,
      lastScore: correctCount,
      totalQuestions: questionPack.settings.total_questions,
      passMark: questionPack.settings.pass_mark,
      lastPassed: passed,
      completed: passed,
      firstCompletedAt: passed ? submittedAt : null,
      lastAttemptAt: submittedAt
    };

    await upsertStatusMutation.mutateAsync(statusData);

    // Update related homework status to Completed if passed
    if (passed && relatedHomework && relatedHomework.length > 0) {
      await Promise.all(
        relatedHomework.map(hw => 
          base44.entities.HomeworkItem.update(hw.id, { status: 'Completed' })
        )
      );
      queryClient.invalidateQueries(['myHomework']);
      queryClient.invalidateQueries(['assignedHomework']);
    }

    // Auto-assign next topic if enabled and passed
    if (passed && instructorSettings?.autoAssignNextTopicOnCompletion) {
      const currentIndex = courseWorkTopics.findIndex(t => t.topicId === topicIdStr);
      if (currentIndex >= 0 && currentIndex < courseWorkTopics.length - 1) {
        const nextTopic = courseWorkTopics[currentIndex + 1];
        const existingAccess = await base44.entities.PupilTopicAccess.filter({
          pupilId: pupil.id,
          topicId: nextTopic.topicId
        });
        
        if (existingAccess.length === 0) {
          await base44.entities.PupilTopicAccess.create({
            pupilId: pupil.id,
            instructorId: pupil.instructorId,
            topicId: nextTopic.topicId,
            grantStudyMaterial: true,
            grantPracticeQuestions: true,
            assignedAt: new Date().toISOString()
          });
          queryClient.invalidateQueries(['pupilTopicAccess']);
        }
      }
    }

    // Show results modal and scroll to top
    setResultData({
      topicLabel: currentTopic?.title || 'Course Topic',
      score: correctCount,
      totalQuestions: questionPack.settings.total_questions,
      passMark: questionPack.settings.pass_mark,
      passed,
      attemptNumber
    });
    setShowResultsModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setHasUserStartedAudio(false);
    setAutoReadEnabled(false);
    setFlaggedQuestions({});
    if (questionPack.settings.shuffle_questions) {
      setShuffledQuestions([...questionPack.questions].sort(() => Math.random() - 0.5));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allAnswered = shuffledQuestions.every((q) => answers[q.id] !== undefined);
  const passed = score >= questionPack.settings.pass_mark;

  // Fixed option labels
  const optionLabels = ['A', 'B', 'C', 'D'];

  if (submitted) {
    // Show results summary
    return (
      <div className="space-y-6">
        {mcqStatus && (
          <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-slate-700 mb-2">Your Progress</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Attempts:</span>
                      <span className="ml-2 font-semibold text-slate-800">{mcqStatus.attemptCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Score:</span>
                      <span className="ml-2 font-semibold text-slate-800">{mcqStatus.lastScore}/{mcqStatus.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <Badge className={`ml-2 ${mcqStatus.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {mcqStatus.completed ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    {mcqStatus.lastPassed !== null && (
                      <div>
                        <span className="text-slate-500">Last:</span>
                        <Badge className={`ml-2 ${mcqStatus.lastPassed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          {mcqStatus.lastPassed ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {mcqStatus.instructorComment && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-[#F7B602]/10 to-amber-50 border-l-4 border-l-[#F7B602] rounded-lg">
                      <p className="text-xs font-semibold text-[#071739] mb-1">Message from your instructor:</p>
                      <p className="text-sm text-slate-700 italic">"{mcqStatus.instructorComment}"</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {moment(mcqStatus.instructorCommentedAt).format('D MMM YYYY, h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`border-l-4 ${passed ? 'border-l-green-500 bg-green-50' : 'border-l-rose-500 bg-rose-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {passed ? (
                  <div className="p-3 bg-green-200 rounded-full">
                    <Trophy className="w-6 h-6 text-green-700" />
                  </div>
                ) : (
                  <div className="p-3 bg-rose-200 rounded-full">
                    <XCircle className="w-6 h-6 text-rose-700" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {passed ? 'Well Done! You Passed!' : 'Not Quite There Yet'}
                  </h3>
                  <p className="text-slate-700 mb-3">
                    You scored <span className="font-bold">{score}</span> out of <span className="font-bold">{questionPack.settings.total_questions}</span>
                  </p>
                  {questionPack.settings.allow_retries && (
                    <Button onClick={handleRetry} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          {shuffledQuestions.map((question, qIndex) => {
            const selectedAnswer = answers[question.id];
            const correctAnswer = question.correct_answer_index;
            const isCorrect = selectedAnswer === correctAnswer;
            const isWrong = selectedAnswer !== correctAnswer && selectedAnswer !== undefined;

            return (
              <Card key={question.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex-1">
                      <span className="text-[#F7B602] mr-2">Q{qIndex + 1}.</span>
                      {question.question}
                    </CardTitle>
                    <Badge className={isCorrect ? 'bg-green-100 text-green-700' : isWrong ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}>
                      {isCorrect ? 'Correct' : isWrong ? 'Incorrect' : 'Not Answered'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options.map((option, optIndex) => {
                    const isSelected = selectedAnswer === optIndex;
                    const isCorrectOption = optIndex === correctAnswer;
                    const shouldHighlight = isCorrectOption || isSelected;

                    return (
                      <div
                        key={optIndex}
                        className={`w-full text-left p-4 rounded-lg border-2 ${
                          shouldHighlight
                            ? isCorrectOption
                              ? 'border-green-500 bg-green-50'
                              : 'border-rose-500 bg-rose-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold ${
                            shouldHighlight
                              ? isCorrectOption
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-rose-500 bg-rose-500 text-white'
                              : 'border-slate-300 text-slate-600'
                          }`}>
                            {optionLabels[optIndex]}
                          </div>
                          <span className="text-slate-700">{option}</span>
                          {shouldHighlight && (
                            <div className="ml-auto">
                              {isCorrectOption ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-rose-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                {question.explanation && (
                  <CardContent className="pt-0 pb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Explanation</p>
                      <p className="text-sm text-blue-800">{question.explanation}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <McqResultsModal 
          open={showResultsModal} 
          onOpenChange={setShowResultsModal}
          result={resultData}
          onRetake={handleRetry}
        />
      </div>
    );
  }

  // Quiz in progress - show one question at a time
  return (
    <>
      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flagged questions remaining</AlertDialogTitle>
            <AlertDialogDescription>
              You still have {flaggedCount} flagged question(s). Would you like to review them before submitting?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => { setShowSubmitConfirm(false); setShowFlaggedReview(true); }}>
              Review Flagged
            </Button>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flagged Questions Review Sheet */}
      <Sheet open={showFlaggedReview} onOpenChange={setShowFlaggedReview}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Review Flagged Questions</SheetTitle>
            <SheetDescription>
              {flaggedCount} {flaggedCount === 1 ? 'question' : 'questions'} flagged for review
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {flaggedQuestionIds.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No flagged questions</p>
            ) : (
              flaggedQuestionIds.map(({ id, index }) => {
                const question = shuffledQuestions[index];
                const isAnswered = answers[id] !== undefined;
                return (
                  <Card key={id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-[#F7B602]" />
                          <span className="font-semibold text-slate-800">Question {index + 1}</span>
                          <Badge variant={isAnswered ? "default" : "secondary"}>
                            {isAnswered ? 'Answered' : 'Unanswered'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{question.question}</p>
                      </div>
                      <Button size="sm" onClick={() => goToQuestion(index)}>
                        Go to
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowFlaggedReview(false)}>
              Back to Quiz
            </Button>
            <Button className="flex-1" onClick={handleSubmitClick} disabled={!allAnswered}>
              Submit Answers
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="space-y-6">
      {mcqStatus && currentQuestionIndex === 0 && (
        <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-slate-700 mb-2">Your Progress</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Attempts:</span>
                    <span className="ml-2 font-semibold text-slate-800">{mcqStatus.attemptCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Score:</span>
                    <span className="ml-2 font-semibold text-slate-800">{mcqStatus.lastScore}/{mcqStatus.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <Badge className={`ml-2 ${mcqStatus.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {mcqStatus.completed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  {mcqStatus.lastPassed !== null && (
                    <div>
                      <span className="text-slate-500">Last:</span>
                      <Badge className={`ml-2 ${mcqStatus.lastPassed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {mcqStatus.lastPassed ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                  )}
                </div>
                {mcqStatus.instructorComment && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#F7B602]/10 to-amber-50 border-l-4 border-l-[#F7B602] rounded-lg">
                    <p className="text-xs font-semibold text-[#071739] mb-1">Message from your instructor:</p>
                    <p className="text-sm text-slate-700 italic">"{mcqStatus.instructorComment}"</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {moment(mcqStatus.instructorCommentedAt).format('D MMM YYYY, h:mm a')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentQuestionIndex === 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-slate-700">
                  Pass Mark: {questionPack.settings.pass_mark} out of {questionPack.settings.total_questions}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Answer each question and click Next to continue. Use the flag button to mark questions for review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Flagged Button */}
      {flaggedCount > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowFlaggedReview(true)}
          className="w-full gap-2"
        >
          <List className="w-4 h-4" />
          Review {flaggedCount} Flagged {flaggedCount === 1 ? 'Question' : 'Questions'}
        </Button>
      )}

      {/* Audio Player at the top */}
      <GoogleTTSAudioPlayer
        key={`audio-${currentQuestion?.id}`}
        ref={audioPlayerRef}
        text={audioText}
        topicId={`mcq_${questionPack.id}_q${currentQuestionIndex}`}
        sectionId={currentQuestion?.id}
        sectionTitle={`Question ${currentQuestionIndex + 1}`}
        autoPlay={hasUserStartedAudio && autoReadEnabled}
        onPlay={handleAudioPlay}
        onStop={handleAudioStop}
      />

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      <span className="text-[#F7B602] mr-2">Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={`${flaggedQuestions[currentQuestion.id] ? 'text-[#F7B602]' : 'text-slate-400'}`}
                    >
                      <Flag className={`w-5 h-5 ${flaggedQuestions[currentQuestion.id] ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-slate-700 text-base mt-2">{currentQuestion?.question}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className="bg-slate-100 text-slate-600">
                    {Object.keys(answers).length}/{shuffledQuestions.length} Answered
                  </Badge>
                  {flaggedCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700">
                      {flaggedCount} Flagged
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion?.options.map((option, optIndex) => {
                const isSelected = answers[currentQuestion.id] === optIndex;

                return (
                  <button
                    key={optIndex}
                    onClick={() => handleAnswerSelect(optIndex)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#F7B602] bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    } cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold ${
                        isSelected
                          ? 'border-[#F7B602] bg-[#F7B602] text-white'
                          : 'border-slate-300 text-slate-600'
                      }`}>
                        {optionLabels[optIndex]}
                      </div>
                      <span className="text-slate-700">{option}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="sticky bottom-6 bg-white rounded-lg shadow-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="text-sm text-slate-600">
            <span className="font-semibold">{currentQuestionIndex + 1}</span> / {shuffledQuestions.length}
          </div>
          
          {isLastQuestion ? (
            <Button
              onClick={handleSubmitClick}
              disabled={!allAnswered}
              className="bg-[#071739] hover:bg-[#071739]/90 gap-2"
            >
              Submit Answers
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isAnswered}
              className="bg-[#071739] hover:bg-[#071739]/90 gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      </div>
    </>
  );
}