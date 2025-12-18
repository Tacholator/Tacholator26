import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trophy, XCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function McqResultsModal({ open, onOpenChange, result, onRetake }) {
  if (!result) return null;

  const { topicLabel, score, totalQuestions, passMark, passed, attemptNumber } = result;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center mb-4">
            <div className={`p-4 rounded-full mb-4 ${passed ? 'bg-green-100' : 'bg-rose-100'}`}>
              {passed ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-rose-600" />
              )}
            </div>
            <AlertDialogTitle className="text-2xl">
              {passed ? 'Well Done! You Passed!' : 'Not Quite There Yet'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2">
              {topicLabel}
            </AlertDialogDescription>
          </div>
          
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Your Score</span>
              <span className="text-xl font-bold text-slate-800">{score}/{totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Pass Mark</span>
              <span className="text-xl font-bold text-slate-800">{passMark}/{totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Result</span>
              <Badge className={passed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}>
                {passed ? 'PASS' : 'NOT PASSED'}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Attempt</span>
              <span className="font-semibold text-slate-800">#{attemptNumber}</span>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction onClick={() => { onOpenChange(false); onRetake(); }} className="bg-slate-600 hover:bg-slate-700">
            Try Again
          </AlertDialogAction>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="bg-[#071739] hover:bg-[#071739]/90">
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}