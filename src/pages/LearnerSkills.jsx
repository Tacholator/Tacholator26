import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, BookOpen, Loader2, CheckCircle2, Clock, Lock } from 'lucide-react';
import { DVSA_SKILLS_DATA } from '@/components/dvsa/dvsaSkillsData';

export default function LearnerSkills() {
  const [search, setSearch] = useState('');

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
        const allPupils = await base44.entities.Pupil.list();
        return allPupils.find(p => p.email?.toLowerCase() === user.email.toLowerCase()) || null;
      }
      return null;
    },
    enabled: !!user
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['mySkillAssignments', pupil?.id],
    queryFn: () => base44.entities.SkillAssignment.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const filteredSkills = DVSA_SKILLS_DATA.filter(skill =>
    skill.skillTitle.toLowerCase().includes(search.toLowerCase())
  );

  const getAssignment = (skillId) => assignments.find(a => a.skillId === skillId);

  const getSkillStatus = (skillId) => {
    const assignment = getAssignment(skillId);
    if (!assignment) return 'locked';
    if (assignment.passedMcq) return 'passed';
    if (assignment.hasOpenedMaterial || assignment.numberOfAttempts > 0) return 'in_progress';
    return 'assigned';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const passedCount = assignments.filter(a => a.passedMcq).length;
  const assignedCount = assignments.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('LearnerDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-teal-600" />
            DVSA Skills
          </h1>
          <p className="text-slate-500 mt-1">Study materials and quizzes assigned by your instructor</p>
          
          {assignedCount > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {passedCount} Passed
              </Badge>
              <Badge className="bg-slate-100 text-slate-600">
                {assignedCount} Assigned
              </Badge>
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3">
          {filteredSkills.map((skill, idx) => {
            const status = getSkillStatus(skill.skillId);
            const assignment = getAssignment(skill.skillId);
            const isLocked = status === 'locked';

            return (
              <motion.div
                key={skill.skillId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <Card 
                  className={`border-0 shadow-sm transition-all ${
                    isLocked ? 'opacity-60' : 'hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !isLocked && (window.location.href = createPageUrl('LearnerSkillStudy') + `?skillId=${skill.skillId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        status === 'passed' ? 'bg-emerald-100' :
                        status === 'in_progress' ? 'bg-amber-100' :
                        status === 'assigned' ? 'bg-teal-100' : 'bg-slate-100'
                      }`}>
                        {isLocked ? (
                          <Lock className="w-5 h-5 text-slate-400" />
                        ) : status === 'passed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : status === 'in_progress' ? (
                          <Clock className="w-5 h-5 text-amber-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-teal-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-400">#{skill.skillNumber}</span>
                          <h3 className="font-semibold text-slate-800 truncate">{skill.skillTitle}</h3>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{skill.shortDescription}</p>
                      </div>
                      {!isLocked && (
                        <div className="flex items-center gap-2">
                          {status === 'passed' && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              {assignment?.bestScore}/{skill.mcqQuiz?.totalQuestions || 10}
                            </Badge>
                          )}
                          {status === 'in_progress' && (
                            <Badge className="bg-amber-100 text-amber-700">Continue</Badge>
                          )}
                          {status === 'assigned' && (
                            <Badge className="bg-teal-100 text-teal-700">Start</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <Card className="border-dashed mt-6">
            <CardContent className="py-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No skills assigned yet</p>
              <p className="text-sm mt-1">Your instructor will assign skills for you to study</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}