import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import McqResultsModal from './McqResultsModal';
import { courseWorkTopics } from './topicIndex';

export default function McqQuiz({ questionPack, topicId }) {
  const queryClient = useQueryClient();
  const [shuffledQuestions, setShuffledQuestions] = useState(() => {
    if (questionPack.settings.shuffle_questions) {
      return [...questionPack.questions].sort(() => Math.random() - 0.5);
    }
    return questionPack.questions;
  });

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultData, setResultData] = useState(null);

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

  const { data: mcqStatus } = useQuery({
    queryKey: ['mcqStatus', pupil?.id, questionPack.id],
    queryFn: async () => {
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
      const allHomework = await base44.entities.HomeworkItem.filter({ pupilId: pupil.id });
      return allHomework.filter(h => 
        h.status !== 'Completed' && 
        h.formatPayload?.topicId !== undefined &&
        String(h.formatPayload.topicId) === String(topicIdStr)
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
      queryClient.invalidateQueries(['allMcqStatuses']);
    }
  });

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
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
      queryClient.invalidateQueries({ queryKey: ['myHomework'] });
      queryClient.invalidateQueries({ queryKey: ['homework', pupil.id] });
      queryClient.invalidateQueries({ queryKey: ['relatedHomework', pupil.id, topicIdStr] });
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
    if (questionPack.settings.shuffle_questions) {
      setShuffledQuestions([...questionPack.questions].sort(() => Math.random() - 0.5));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allAnswered = shuffledQuestions.every((q) => answers[q.id] !== undefined);
  const passed = score >= questionPack.settings.pass_mark;

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

      {!submitted && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">
                  Pass Mark: {questionPack.settings.pass_mark} out of {questionPack.settings.total_questions}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Answer all questions and click Submit to see your results
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {submitted && (
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
      )}

      <div className="space-y-6">
        {shuffledQuestions.map((question, qIndex) => {
          const isAnswered = answers[question.id] !== undefined;
          const selectedAnswer = answers[question.id];
          const correctAnswer = question.correct_answer_index;
          const isCorrect = submitted && selectedAnswer === correctAnswer;
          const isWrong = submitted && selectedAnswer !== correctAnswer && isAnswered;

          // Fixed option order - no shuffling
          const options = question.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));

          return (
            <Card key={question.id} className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg font-semibold text-slate-800 flex-1">
                    <span className="text-[#F7B602] mr-2">Q{qIndex + 1}.</span>
                    {question.question}
                  </CardTitle>
                  {submitted && (
                    <Badge className={isCorrect ? 'bg-green-100 text-green-700' : isWrong ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}>
                      {isCorrect ? 'Correct' : isWrong ? 'Incorrect' : 'Not Answered'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((option, optIndex) => {
                  const isSelected = selectedAnswer === option.originalIndex;
                  const isCorrectOption = submitted && option.originalIndex === correctAnswer;
                  const shouldHighlight = submitted && (isCorrectOption || isSelected);

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleAnswerSelect(question.id, option.originalIndex)}
                      disabled={submitted}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        shouldHighlight
                          ? isCorrectOption
                            ? 'border-green-500 bg-green-50'
                            : 'border-rose-500 bg-rose-50'
                          : isSelected
                          ? 'border-[#F7B602] bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          shouldHighlight
                            ? isCorrectOption
                              ? 'border-green-500 bg-green-500'
                              : 'border-rose-500 bg-rose-500'
                            : isSelected
                            ? 'border-[#F7B602] bg-[#F7B602]'
                            : 'border-slate-300'
                        }`}>
                          {shouldHighlight && (
                            isCorrectOption ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )
                          )}
                        </div>
                        <span className="text-slate-700">{option.text}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>

              {submitted && question.explanation && (
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

      {!submitted && (
        <div className="sticky bottom-6 bg-white rounded-lg shadow-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Answered: <span className="font-semibold">{Object.keys(answers).length}</span> / {questionPack.settings.total_questions}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="bg-[#071739] hover:bg-[#071739]/90"
            >
              Submit Answers
            </Button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="sticky bottom-6 bg-white rounded-lg shadow-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Review complete. Scroll up to see explanations.
            </div>
            <Button
              onClick={handleRetry}
              className="gap-2 bg-[#071739] hover:bg-[#071739]/90"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      <McqResultsModal 
        open={showResultsModal} 
        onOpenChange={setShowResultsModal}
        result={resultData}
        onRetake={handleRetry}
      />
      </div>
      );
      }