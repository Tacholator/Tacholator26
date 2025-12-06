import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import NotifyArrivalButton from './NotifyArrivalButton';

const statusColors = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700'
};

export default function LessonCard({ lesson, pupilName, onClick, pupil }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
            {pupilName?.charAt(0) || 'P'}
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">{pupilName}</h4>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.startTime} - {lesson.endTime}</span>
            </div>
          </div>
        </div>
        <Badge className={statusColors[lesson.status]}>{lesson.status}</Badge>
      </div>
      
      {lesson.location && (
        <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span>{lesson.location}</span>
        </div>
      )}

      {lesson.status === 'Scheduled' && pupil && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <NotifyArrivalButton lesson={lesson} pupil={pupil} />
        </div>
      )}
    </motion.div>
  );
}