import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle2, Circle, PlayCircle, Star, Car } from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';

const statusConfig = {
  NotStarted: { label: 'Not Started', color: 'bg-slate-100 text-slate-600', icon: Circle },
  Introduced: { label: 'Introduced', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
  Practising: { label: 'Practising', color: 'bg-amber-100 text-amber-700', icon: Star },
  Independent: { label: 'Independent', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
};

export default function LearnerProgress() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      if (user.email) {
        const byEmail = await base44.entities.Pupil.filter({ email: user.email });
        return byEmail[0] || null;
      }
      return null;
    },
    enabled: !!user
  });

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['mySkills', pupil?.id],
    queryFn: () => base44.entities.Skill.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const skillStats = skills.reduce((acc, skill) => {
    acc[skill.status] = (acc[skill.status] || 0) + 1;
    return acc;
  }, {});

  const categories = {
    '1': 'Legal responsibilities',
    '2': 'Safety checks',
    '3': 'Cockpit checks',
    '4': 'Security',
    '5': 'Controls and instruments',
    '6': 'Moving away and stopping',
    '7': 'Safe positioning',
    '8': 'Mirrors – vision and use',
    '9': 'Signals',
    '10': 'Anticipation and planning',
    '11': 'Use of speed',
    '12': 'Other traffic',
    '13': 'Fuel-efficient driving',
    '14': 'Junctions',
    '15': 'Roundabouts',
    '16': 'Pedestrian crossings',
    '17': 'Reversing',
    '18': 'Turning the car around',
    '19': 'Parking',
    '20': 'Emergency stop',
    '21': 'Country roads',
    '22': 'Dual carriageways',
    '23': 'Motorways',
    '24': 'Driving in the dark',
    '25': 'Driving in different weather conditions',
    '26': 'Passengers and loads',
    '27': 'Following routes / independent driving'
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.skillCode?.split('.')[0] || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <Card className="max-w-md text-center p-8">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Linked</h2>
          <p className="text-slate-500">
            Your account hasn't been linked to a pupil profile yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('LearnerDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Skills Progress</h1>
          <p className="text-slate-500 mt-1">Track your driving skills development</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(statusConfig).map(([status, config], idx) => {
            const Icon = config.icon;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`border-0 shadow-sm ${config.color.split(' ')[0]}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={`w-8 h-8 ${config.color.split(' ')[1]}`} />
                    <div>
                      <p className={`text-2xl font-bold ${config.color.split(' ')[1]}`}>
                        {skillStats[status] || 0}
                      </p>
                      <p className="text-xs opacity-70">{config.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Skills by Category */}
        <div className="space-y-4">
          {Object.entries(groupedSkills).map(([category, categorySkills], idx) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 py-3 px-5 border-b">
                  <CardTitle className="text-base font-semibold text-slate-700">
                    {categories[category] || `Category ${category}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-50">
                  {categorySkills.map(skill => {
                    const config = statusConfig[skill.status] || statusConfig.NotStarted;
                    const Icon = config.icon;
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                          <span className="text-slate-700">{skill.skillName}</span>
                        </div>
                        <Badge className={`${config.color} border-0`}>
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}