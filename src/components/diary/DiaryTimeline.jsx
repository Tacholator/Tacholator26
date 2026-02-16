import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Sparkles, Target, CheckCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';

export default function DiaryTimeline({ entries, onEntryClick }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No diary entries yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 via-teal-300 to-slate-100" />
      
      <div className="space-y-6">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-14"
          >
            <div className="absolute left-4 w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-sm" />
            
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer border-slate-100"
              onClick={() => onEntryClick?.(entry)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">
                    {moment(entry.date).format('ddd, D MMM YYYY')}
                  </span>
                  {entry.aiSummary && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Summary
                    </Badge>
                  )}
                </div>
                
                {entry.mainTopic && (
                   <div className="flex items-start gap-2 mb-2">
                     <BookOpen className="w-4 h-4 text-blue-500 mt-0.5" />
                     <div>
                       <p className="text-xs text-slate-500 uppercase tracking-wide">Topic</p>
                       <p className="text-slate-700">{entry.mainTopic}</p>
                     </div>
                   </div>
                 )}

                {entry.objective && (
                   <div className="flex items-start gap-2 mb-3">
                     <Target className="w-4 h-4 text-teal-500 mt-0.5" />
                     <div>
                       <p className="text-xs text-slate-500 uppercase tracking-wide">Objective</p>
                       <p className="text-slate-700">{entry.objective}</p>
                     </div>
                   </div>
                 )}

                 {entry.aiSummary && (
                   <div className="bg-purple-50 rounded-lg p-3 mt-3 border border-purple-100">
                     <p className="text-sm text-purple-800">{entry.aiSummary}</p>
                   </div>
                 )}

                {entry.instructorComments && (
                   <div className="mt-4 pt-3 border-t border-slate-100">
                     <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Instructor Comments</p>
                     <p className="text-sm text-slate-600">{entry.instructorComments}</p>
                   </div>
                 )}
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {entry.whatWentWell && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">What went well</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{entry.whatWentWell}</p>
                      </div>
                    </div>
                  )}
                  {entry.areasToImprove && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">To improve</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{entry.areasToImprove}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {entry.homeworkSuggestions && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Homework</p>
                    <p className="text-sm text-slate-600">{entry.homeworkSuggestions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}