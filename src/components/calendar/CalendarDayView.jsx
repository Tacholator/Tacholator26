import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
import { motion } from 'framer-motion';

const PIXELS_PER_MINUTE = 1.6;
const SLOT_MINUTES = 30;
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;

export default function CalendarDayView({ 
  date, 
  lessons = [], 
  pupilMap = {}, 
  onLessonClick, 
  onSlotClick,
  currentUser
}) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i + DAY_START_HOUR);
  
  // Convert time string to minutes from day start
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours - DAY_START_HOUR) * 60 + minutes;
  };

  // Calculate lesson positioning
  const positionedLessons = useMemo(() => {
    return lessons.map(lesson => {
      const startMinutes = timeToMinutes(lesson.startTime);
      const endMinutes = timeToMinutes(lesson.endTime);
      const durationMinutes = endMinutes - startMinutes;
      
      return {
        ...lesson,
        top: startMinutes * PIXELS_PER_MINUTE,
        height: Math.max(durationMinutes * PIXELS_PER_MINUTE, SLOT_MINUTES * PIXELS_PER_MINUTE),
        durationMinutes
      };
    });
  }, [lessons]);

  // Detect overlaps and calculate columns
  const lessonsWithColumns = useMemo(() => {
    const sorted = [...positionedLessons].sort((a, b) => a.top - b.top);
    const columns = [];
    
    sorted.forEach(lesson => {
      const lessonEnd = lesson.top + lesson.height;
      
      // Find a column where this lesson doesn't overlap
      let columnIndex = 0;
      for (let i = 0; i < columns.length; i++) {
        const lastInColumn = columns[i][columns[i].length - 1];
        const lastEnd = lastInColumn.top + lastInColumn.height;
        
        if (lesson.top >= lastEnd) {
          columnIndex = i;
          break;
        }
        columnIndex = i + 1;
      }
      
      if (!columns[columnIndex]) {
        columns[columnIndex] = [];
      }
      
      columns[columnIndex].push({
        ...lesson,
        column: columnIndex,
        totalColumns: 0 // Will be set below
      });
    });
    
    // Calculate total overlapping columns for each lesson
    const result = [];
    columns.forEach(column => {
      column.forEach(lesson => {
        const lessonEnd = lesson.top + lesson.height;
        
        // Count how many columns have overlapping lessons
        let maxColumns = 1;
        columns.forEach(otherColumn => {
          otherColumn.forEach(other => {
            if (other !== lesson) {
              const otherEnd = other.top + other.height;
              if (!(lesson.top >= otherEnd || lessonEnd <= other.top)) {
                maxColumns = Math.max(maxColumns, other.column + 1);
              }
            }
          });
        });
        
        result.push({
          ...lesson,
          totalColumns: maxColumns
        });
      });
    });
    
    return result;
  }, [positionedLessons]);

  const isInstructor = currentUser?.role === 'admin';

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
      case 'Completed':
        return 'bg-emerald-500/75 hover:bg-emerald-600/75 text-white border-emerald-600';
      case 'Cancelled':
        return 'bg-slate-400/55 hover:bg-slate-500/55 text-slate-700 border-slate-500';
      default:
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';
    }
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      {/* Time labels column */}
      <div className="flex">
        <div className="w-16 flex-shrink-0 bg-slate-50 border-r">
          <div className="h-12 border-b" /> {/* Header spacer */}
          {hours.map(hour => (
            <div key={hour} className="relative" style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}>
              <div className="absolute -top-2 right-2 text-xs text-slate-500 font-medium">
                {hour.toString().padStart(2, '0')}:00
              </div>
            </div>
          ))}
        </div>

        {/* Day column with lessons */}
        <div className="flex-1 relative">
          {/* Header */}
          <div className="h-12 border-b bg-teal-50 flex items-center justify-center sticky top-0 z-10">
            <div className="text-center">
              <div className="text-xs text-slate-500">{moment(date).format('ddd')}</div>
              <div className="text-lg font-semibold text-slate-800">{moment(date).format('D MMM')}</div>
            </div>
          </div>

          {/* Time slots (30-min grid) */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour}>
                <div 
                  className="border-b border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  style={{ height: `${30 * PIXELS_PER_MINUTE}px` }}
                  onClick={() => onSlotClick(date, `${hour.toString().padStart(2, '0')}:00`)}
                />
                <div 
                  className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  style={{ height: `${30 * PIXELS_PER_MINUTE}px` }}
                  onClick={() => onSlotClick(date, `${hour.toString().padStart(2, '0')}:30`)}
                />
              </div>
            ))}

            {/* Absolute positioned lesson blocks */}
            {lessonsWithColumns.map(lesson => {
              const pupil = pupilMap[lesson.pupilId];
              const width = lesson.totalColumns > 1 ? `calc(${100 / lesson.totalColumns}% - 3px)` : '100%';
              const left = lesson.totalColumns > 1 ? `calc(${(lesson.column / lesson.totalColumns) * 100}%)` : '0';
              
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute rounded-lg border-2 shadow-sm cursor-pointer transition-all overflow-hidden ${getStatusStyle(lesson.status)}`}
                  style={{
                    top: `${lesson.top}px`,
                    height: `${lesson.height}px`,
                    left,
                    width,
                    minHeight: '48px',
                    zIndex: 5
                  }}
                  onClick={() => onLessonClick(lesson)}
                >
                  <div className="p-2 h-full flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-sm leading-tight">
                        {isInstructor 
                          ? `${pupil?.firstName || 'Unknown'} ${pupil?.lastName || ''}`.trim()
                          : 'Lesson'
                        }
                      </div>
                      <div className="text-xs mt-0.5 opacity-90">
                        {lesson.startTime} – {lesson.endTime}
                      </div>
                    </div>
                    {lesson.location && (
                      <div className="text-xs opacity-80 truncate mt-1">
                        {lesson.location}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}