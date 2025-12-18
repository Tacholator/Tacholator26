import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuizResults({ attempt, questions, answers, onRetry, onClose }) {
  const passed = attempt.passed;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Score summary */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <Card className={`border-0 shadow-lg ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-rose-50 to-pink-50'}`}>
          <CardContent className="p-8 text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              passed ? 'bg-green-100' : 'bg-rose-100'
            }`}>
              {passed ? (
                <Trophy className="w-10 h-10 text-green-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-rose-600" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-[#071739] mb-2">
              {attempt.scorePercent}%
            </h2>
            <p className="text-lg text-slate-600 mb-1">
              {attempt.correctCount} out of {attempt.totalQuestions} correct
            </p>
            <p className={`text-lg font-semibold ${passed ? 'text-green-600' : 'text-rose-600'}`}>
              {passed ? '✓ Passed' : '✗ Not Passed'}
            </p>
            {!passed && (
              <p className="text-sm text-slate-600 mt-2">
                Pass mark: 80% or higher
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Question review */}
      <h3 className="text-xl font-semibold text-[#071739] mb-4">Review Your Answers</h3>
      <div className="space-y-4 mb-6">
        {questions.map((question, index) => {
          const answer = answers.find(a => a.questionId === question.questionId);
          const isCorrect = answer?.isCorrect;

          return (
            <Card key={question.questionId} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCorrect ? 'bg-green-100' : 'bg-rose-100'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-3">
                      Question {index + 1}: {question.prompt}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className={`p-3 rounded-lg ${
                        answer?.selectedOption ? 'bg-slate-50 border-2 border-slate-300' : ''
                      }`}>
                        <p className="text-sm text-slate-600">Your answer:</p>
                        <p className="font-medium">
                          {answer?.selectedOption ? (
                            <>
                              <span className={isCorrect ? 'text-green-600' : 'text-rose-600'}>
                                {answer.selectedOption}.
                              </span>{' '}
                              {question.options[answer.selectedOption]}
                            </>
                          ) : (
                            <span className="text-slate-400">Not answered</span>
                          )}
                        </p>
                      </div>

                      {!isCorrect && (
                        <div className="p-3 rounded-lg bg-green-50 border-2 border-green-200">
                          <p className="text-sm text-slate-600">Correct answer:</p>
                          <p className="font-medium text-green-700">
                            {question.correctOption}. {question.options[question.correctOption]}
                          </p>
                        </div>
                      )}
                    </div>

                    {question.explanation && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="gap-2"
          >
            Try Again
          </Button>
        )}
        <Button
          onClick={onClose}
          className="gap-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
        >
          Close
        </Button>
      </div>
    </div>
  );
}