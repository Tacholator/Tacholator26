import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, BookOpen } from 'lucide-react';

export default function StudyMaterial({ content, onProgress, isComplete }) {
  const containerRef = useRef(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const depth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollDepth(Math.min(100, Math.max(scrollDepth, depth)));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    const timer = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(elapsed);
    }, 1000);

    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (onProgress) {
      onProgress({ scrollDepth, timeSpent });
    }
  }, [scrollDepth, timeSpent, onProgress]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canTakeQuiz = timeSpent >= 60 && scrollDepth >= 80;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-slate-100 text-slate-600 gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(timeSpent)}
          </Badge>
          <Badge className="bg-slate-100 text-slate-600 gap-1">
            <BookOpen className="w-3 h-3" />
            {scrollDepth}% read
          </Badge>
        </div>
        {isComplete && (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Studied
          </Badge>
        )}
      </div>

      {!canTakeQuiz && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          Read for at least 1 minute and scroll through the material to unlock the quiz.
        </div>
      )}

      <div 
        ref={containerRef}
        className="max-h-[60vh] overflow-y-auto prose prose-slate max-w-none bg-white rounded-xl p-6 border"
      >
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}