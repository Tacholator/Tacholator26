import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, MessageSquare, Target, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function PupilLessonSummaryModal({ open, onClose, pupil, lastDiaryEntry, isGenerating, showNextSteps = true }) {
  if (!pupil) return null;

  const sections = [
    {
      icon: TrendingUp,
      title: 'Areas Covered',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: lastDiaryEntry?.mainTopic || 'No specific topics recorded'
    },
    {
      icon: Sparkles,
      title: 'What Went Well',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      content: lastDiaryEntry?.whatWentWell || 'No positive notes recorded'
    },
    {
      icon: AlertCircle,
      title: 'Areas to Improve',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      content: lastDiaryEntry?.areasToImprove || 'No improvement areas noted'
    },
    {
      icon: MessageSquare,
      title: 'Instructor Comments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      content: lastDiaryEntry?.instructorComments || 'No additional comments'
    }
  ];

  const generateNextSteps = () => {
    if (!lastDiaryEntry) {
      return [
        'Start with a comprehensive skills assessment',
        'Establish baseline for key driving competencies',
        'Create a personalized learning plan'
      ];
    }

    const steps = [];
    
    if (lastDiaryEntry.areasToImprove) {
      steps.push(`Focus on improving: ${lastDiaryEntry.areasToImprove.split('.')[0]}`);
    }
    
    if (lastDiaryEntry.mainTopic) {
      steps.push(`Continue practicing: ${lastDiaryEntry.mainTopic}`);
    }
    
    if (lastDiaryEntry.homeworkSuggestions) {
      steps.push(`Complete homework: ${lastDiaryEntry.homeworkSuggestions.split('.')[0]}`);
    }
    
    if (steps.length === 0) {
      steps.push('Continue building on recent progress');
      steps.push('Introduce new challenging scenarios');
    }
    
    return steps;
  };

  const nextSteps = generateNextSteps();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Lesson Summary: {pupil.firstName} {pupil.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Last Lesson Info */}
          {lastDiaryEntry ? (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                Last Lesson: <span className="font-medium text-slate-800">
                  {moment(lastDiaryEntry.date).format('dddd, D MMMM YYYY')}
                </span>
              </p>
              {lastDiaryEntry.objective && (
                <p className="text-sm text-slate-600 mt-1">
                  Objective: <span className="font-medium text-slate-800">{lastDiaryEntry.objective}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                No previous lesson recorded for this pupil yet.
              </p>
            </div>
          )}

          {/* Lesson Details Sections */}
          <div className="space-y-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className={`${section.bgColor} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <h3 className="font-semibold text-slate-800">{section.title}</h3>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {section.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* AI-Generated Summary */}
          {lastDiaryEntry?.aiSummary && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-800">AI Summary</h3>
                <Badge className="ml-auto bg-purple-600 text-white text-xs">Generated</Badge>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {lastDiaryEntry.aiSummary}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Generated {moment(lastDiaryEntry.aiSummaryGeneratedAt).fromNow()}
              </p>
            </div>
          )}

          {/* Proposed Next Steps */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800">Proposed Next Steps</h3>
            </div>
            <ul className="space-y-2">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-teal-600 font-bold mt-0.5">{index + 1}.</span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}