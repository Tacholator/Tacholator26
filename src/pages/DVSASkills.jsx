import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, BookOpen, Loader2, Users } from 'lucide-react';
import { DVSA_SKILLS_DATA } from '@/components/dvsa/dvsaSkillsData';
import SkillCard from '@/components/dvsa/SkillCard';
import { createPageUrl } from '@/utils';

export default function DVSASkills() {
  const [search, setSearch] = useState('');
  const [selectedPupil, setSelectedPupil] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['skillAssignments', selectedPupil],
    queryFn: () => selectedPupil === 'all' 
      ? base44.entities.SkillAssignment.list()
      : base44.entities.SkillAssignment.filter({ pupilId: selectedPupil }),
    enabled: !!user
  });

  const filteredSkills = DVSA_SKILLS_DATA.filter(skill =>
    skill.skillTitle.toLowerCase().includes(search.toLowerCase()) ||
    skill.shortDescription.toLowerCase().includes(search.toLowerCase())
  );

  const getAssignmentForSkill = (skillId) => {
    if (selectedPupil === 'all') return null;
    return assignments.find(a => a.skillId === skillId);
  };

  const getOverviewStats = () => {
    if (selectedPupil === 'all' || !assignments.length) return null;
    const passed = assignments.filter(a => a.passedMcq).length;
    const inProgress = assignments.filter(a => a.hasOpenedMaterial && !a.passedMcq).length;
    const notStarted = 27 - passed - inProgress;
    return { passed, inProgress, notStarted };
  };

  const stats = getOverviewStats();

  const handleSkillClick = (skill) => {
    const url = createPageUrl('DVSASkillDetail') + `?skillId=${skill.skillId}${selectedPupil !== 'all' ? `&pupilId=${selectedPupil}` : ''}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-teal-600" />
              DVSA Skills
            </h1>
            <p className="text-slate-500 mt-1">27 core driving competencies</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedPupil} onValueChange={setSelectedPupil}>
            <SelectTrigger className="w-48">
              <Users className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Select pupil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pupils</SelectItem>
              {pupils.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.passed}</p>
                  <p className="text-sm text-slate-500">Passed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
                  <p className="text-sm text-slate-500">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.notStarted}</p>
                  <p className="text-sm text-slate-500">Not Started</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSkills.map((skill, idx) => (
              <motion.div
                key={skill.skillId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <SkillCard
                  skill={skill}
                  assignment={getAssignmentForSkill(skill.skillId)}
                  onClick={() => handleSkillClick(skill)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}