import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ClipboardCheck } from 'lucide-react';
import moment from 'moment';

export default function InstructorQuizPreview() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('quizId');

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['dailyQuiz', quizId],
    queryFn: async () => {
      if (!quizId) return null;
      const quizzes = await base44.entities.DailyQuiz.filter({ id: quizId });
      return quizzes[0] || null;
    },
    enabled: !!quizId
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['quizQuestions', quiz?.questionIds],
    queryFn: async () => {
      if (!quiz?.questionIds || quiz.questionIds.length === 0) return [];
      const allQuestions = await base44.entities.McqQuestion.list();
      // Maintain order from quiz.questionIds
      return quiz.questionIds
        .map(qid => allQuestions.find(q => q.id === qid))
        .filter(Boolean);
    },
    enabled: !!quiz?.questionIds
  });

  if (quizLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl('InstructorDashboard')}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Quiz not found</h2>
              <p className="text-slate-500">The requested quiz could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getDifficultyBadge = (difficulty) => {
    const variants = {
      easy: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-rose-100 text-rose-700'
    };
    return <Badge className={variants[difficulty]}>{difficulty}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('InstructorDashboard')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2">Quiz of the Day</Badge>
                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                <p className="text-slate-600 mt-2">
                  Scheduled for {moment(quiz.date).format('DD MMMM YYYY')}
                </p>
              </div>
              <Badge className="bg-purple-600 text-white">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                <strong>Status:</strong> {quiz.status}
              </p>
              {quiz.publishAt && (
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Published at:</strong> {moment(quiz.publishAt).format('DD/MM/YY HH:mm')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Questions Preview</h2>
          <p className="text-sm text-slate-500">Read-only • Answers not shuffled</p>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No questions in this quiz</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">Question {index + 1}</Badge>
                    {getDifficultyBadge(question.difficulty)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {question.questionText}
                  </h3>

                  <div className="space-y-2">
                    {question.answers?.map((answer) => (
                      <div
                        key={answer.id}
                        className={`p-3 rounded-lg border-2 ${
                          answer.id === question.correctAnswerId
                            ? 'border-green-300 bg-green-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-slate-700">{answer.id}.</span>
                          <span className="flex-1 text-slate-700">{answer.text}</span>
                          {answer.id === question.correctAnswerId && (
                            <Badge className="bg-green-600 text-white text-xs">Correct</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Explanation:</p>
                      <p className="text-sm text-slate-700">{question.explanation}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t text-xs text-slate-500">
                    <p><strong>Topic:</strong> {question.topicLabel}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}