import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function McqQuiz({ questionPack }) {
  const [shuffledQuestions, setShuffledQuestions] = useState(() => {
    if (questionPack.settings.shuffle_questions) {
      return [...questionPack.questions].sort(() => Math.random() - 0.5);
    }
    return questionPack.questions;
  });

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    shuffledQuestions.forEach((q) => {
      if (answers[q.id] === q.correct_answer_index) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    if (questionPack.settings.shuffle_questions) {
      setShuffledQuestions([...questionPack.questions].sort(() => Math.random() - 0.5));
    }
  };

  const allAnswered = shuffledQuestions.every((q) => answers[q.id] !== undefined);
  const passed = score >= questionPack.settings.pass_mark;

  return (
    <div className="space-y-6">
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

          const options = questionPack.settings.shuffle_options && !submitted
            ? question.options.map((opt, idx) => ({ text: opt, originalIndex: idx }))
                .sort(() => Math.random() - 0.5)
            : question.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));

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
    </div>
  );
}