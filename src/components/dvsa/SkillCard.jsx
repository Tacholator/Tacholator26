import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export default function SkillCard({ skill, assignment, onClick }) {
  const getTrafficLight = () => {
    if (!assignment) return 'red';
    if (assignment.passedMcq && assignment.hasOpenedMaterial) return 'green';
    if (assignment.hasOpenedMaterial && assignment.numberOfAttempts > 0) return 'amber';
    return 'red';
  };

  const trafficLight = getTrafficLight();

  const trafficLightStyles = {
    green: { bg: 'bg-emerald-500', ring: 'ring-emerald-200' },
    amber: { bg: 'bg-amber-500', ring: 'ring-amber-200' },
    red: { bg: 'bg-slate-300', ring: 'ring-slate-100' }
  };

  const cardColors = [
    'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100',
    'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100',
    'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100',
    'bg-gradient-to-br from-lime-50 to-green-50 border-lime-100',
    'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100',
    'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100',
    'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100',
    'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100',
    'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100',
  ];

  const cardColor = cardColors[(skill.skillNumber - 1) % cardColors.length];

  return (
    <Card 
      className={`border shadow-sm hover:shadow-md transition-all cursor-pointer ${cardColor}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${trafficLightStyles[trafficLight].bg} ring-4 ${trafficLightStyles[trafficLight].ring}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">{skill.skillNumber}</span>
              <h3 className="font-semibold text-slate-800 truncate">{skill.skillTitle}</h3>
            </div>
            <p className="text-sm text-slate-500 truncate mt-0.5">{skill.shortDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            {assignment?.passedMcq && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
              </Badge>
            )}
            {assignment?.hasOpenedMaterial && !assignment?.passedMcq && (
              <Badge className="bg-amber-100 text-amber-700">In Progress</Badge>
            )}
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}