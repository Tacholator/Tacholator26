import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function McqQuiz({ quiz, onComplete, disabled }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = quiz.questions[currentQuestion];
  const passMarkScore = quiz.passMarkScore || 8;

  const handleSelectOption = (index) => {
    if (showResult) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    const isCorrect = selectedOption === question.correctOptionIndex;
    const newAnswers = [...answers, {
      questionId: question.questionId,
      selectedOptionIndex: selectedOption,
      isCorrect
    }];
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      const score = answers.filter(a => a.isCorrect).length;
      const passed = score >= passMarkScore;
      setQuizComplete(true);
      onComplete({ score, totalQuestions: quiz.questions.length, passed, answers });
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowResult(false);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const score = answers.filter(a => a.isCorrect).length;
    const passed = score >= passMarkScore;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {passed ? (
            <Trophy className="w-10 h-10 text-emerald-600" />
          ) : (
            <RotateCcw className="w-10 h-10 text-amber-600" />
          )}
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${passed ? 'text-emerald-700' : 'text-amber-700'}`}>
          {passed ? 'Well Done!' : 'Keep Practicing'}
        </h3>
        <p className="text-slate-600 mb-2">
          You scored <span className="font-bold">{score}</span> out of {quiz.questions.length}
        </p>
        <p className="text-sm text-slate-500 mb-6">
          {passed 
            ? "You've passed this skill's quiz. Your instructor can now progress you in this area."
            : `You need ${passMarkScore} or more to pass. Try again!`}
        </p>
        {!passed && (
          <Button onClick={handleRetry} className="bg-teal-600 hover:bg-teal-700">
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge className="bg-slate-100 text-slate-600">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </Badge>
        <span className="text-sm text-slate-500">
          Pass mark: {passMarkScore}/{quiz.questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {question.questionText}
          </h3>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              let optionClass = 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50';
              if (selectedOption === idx && !showResult) {
                optionClass = 'border-teal-500 bg-teal-50';
              }
              if (showResult) {
                if (idx === question.correctOptionIndex) {
                  optionClass = 'border-emerald-500 bg-emerald-50';
                } else if (selectedOption === idx) {
                  optionClass = 'border-rose-500 bg-rose-50';
                }
              }

              return (
                <Card
                  key={idx}
                  className={`cursor-pointer transition-all border-2 ${optionClass} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === idx ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                    }`}>
                      {selectedOption === idx && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showResult && idx === question.correctOptionIndex && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {showResult && selectedOption === idx && idx !== question.correctOptionIndex && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end gap-3 pt-4">
        {!showResult ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null || disabled}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
          </Button>
        )}
      </div>
    </div>
  );
}