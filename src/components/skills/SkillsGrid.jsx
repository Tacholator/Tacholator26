import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Circle, PlayCircle, Star, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const statusConfig = {
  NotStarted: { label: 'Not Started', color: 'bg-slate-100 text-slate-600', icon: Circle },
  Introduced: { label: 'Introduced', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
  Practising: { label: 'Practising', color: 'bg-amber-100 text-amber-700', icon: Star },
  Independent: { label: 'Independent', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
};

export default function SkillsGrid({ skills, onUpdateSkill, readOnly = false }) {
  const independentCount = skills.filter(s => s.status === 'Independent').length;
  const totalSkills = skills.length || 27;
  const progressPercentage = Math.round((independentCount / totalSkills) * 100);

  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.skillCode?.split('.')[0] || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  const categories = {
    '1': 'Cockpit Drill',
    '2': 'Safety Checks',
    '3': 'Controls',
    '4': 'Moving Off & Stopping',
    '5': 'Safe Positioning',
    '6': 'Mirrors',
    '7': 'Signals',
    '8': 'Anticipation & Planning',
    '9': 'Use of Speed',
    '10': 'Junctions',
    '11': 'Roundabouts',
    '12': 'Pedestrian Crossings',
    '13': 'Dual Carriageways',
    '14': 'Manoeuvres',
    '15': 'Emergency Stop',
    '16': 'Independent Driving',
    '17': 'Darkness',
    '18': 'Weather Conditions',
    '19': 'Commentary Driving'
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-100 p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-700">Overall DVSA Skills Progress</h3>
          </div>
          <span className="text-lg font-bold text-teal-600">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
        <p className="text-sm text-slate-500 mt-2">
          {independentCount} of {totalSkills} skills at Independent level
        </p>
      </motion.div>

      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 overflow-hidden"
        >
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">
              {categories[category] || `Category ${category}`}
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {categorySkills.map((skill) => {
              const config = statusConfig[skill.status] || statusConfig.NotStarted;
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={skill.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                    <span className="text-slate-700">{skill.skillName}</span>
                  </div>
                  {readOnly ? (
                    <Badge className={config.color}>{config.label}</Badge>
                  ) : (
                    <Select
                      value={skill.status}
                      onValueChange={(value) => onUpdateSkill(skill.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <val.icon className="w-4 h-4" />
                              {val.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}