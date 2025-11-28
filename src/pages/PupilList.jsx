import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  User,
  Clock,
  Calendar,
  ChevronRight,
  Loader2
} from 'lucide-react';
import PupilFormModal, { DVSA_SKILLS } from '@/components/modals/PupilFormModal';
import moment from 'moment';

const statusColors = {
  Lead: 'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  OnHold: 'bg-amber-100 text-amber-700',
  Passed: 'bg-blue-100 text-blue-700',
  Stopped: 'bg-rose-100 text-rose-700'
};

export default function PupilList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPupilModal, setShowPupilModal] = useState(false);
  const [editingPupil, setEditingPupil] = useState(null);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [], isLoading } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list()
  });

  const createPupilMutation = useMutation({
    mutationFn: (data) => base44.entities.Pupil.create(data),
    onSuccess: () => queryClient.invalidateQueries(['pupils'])
  });

  const updatePupilMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pupil.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['pupils'])
  });

  const createSkillsMutation = useMutation({
    mutationFn: (skills) => base44.entities.Skill.bulkCreate(skills)
  });

  const handleSavePupil = async (data, isNew) => {
    if (isNew) {
      // Check if a learner account exists with the same email
      let linkedUserId = null;
      if (data.email) {
        const matchingUser = allUsers.find(
          u => u.email?.toLowerCase() === data.email.toLowerCase() && u.role === 'user'
        );
        if (matchingUser) {
          linkedUserId = matchingUser.id;
        }
      }

      // Add instructor info to the pupil record
      const pupilData = {
        ...data,
        instructorId: currentUser?.id,
        instructorEmail: currentUser?.email,
        instructorName: currentUser?.full_name,
        linkedUserId: linkedUserId
      };
      const result = await createPupilMutation.mutateAsync(pupilData);
      // Create DVSA skills for new pupil
      const skills = DVSA_SKILLS.map(skill => ({
        pupilId: result.id,
        skillCode: skill.code,
        skillName: skill.name,
        status: 'NotStarted'
      }));
      await createSkillsMutation.mutateAsync(skills);
    } else {
      // When updating, also check for linked user if email changed
      let linkedUserId = editingPupil.linkedUserId;
      if (data.email && data.email !== editingPupil.email) {
        const matchingUser = allUsers.find(
          u => u.email?.toLowerCase() === data.email.toLowerCase() && u.role === 'user'
        );
        linkedUserId = matchingUser ? matchingUser.id : null;
      }
      await updatePupilMutation.mutateAsync({ 
        id: editingPupil.id, 
        data: { ...data, linkedUserId } 
      });
    }
  };

  const getNextLesson = (pupilId) => {
    const today = moment().format('YYYY-MM-DD');
    const pupilLessons = lessons
      .filter(l => l.pupilId === pupilId && l.date >= today && l.status === 'Scheduled')
      .sort((a, b) => a.date.localeCompare(b.date));
    return pupilLessons[0];
  };

  const filteredPupils = pupils.filter(pupil => {
    const matchesSearch = `${pupil.firstName} ${pupil.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pupil.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Pupils</h1>
            <p className="text-slate-500 mt-1">{pupils.length} total pupils</p>
          </div>
          
          <Button
            onClick={() => {
              setEditingPupil(null);
              setShowPupilModal(true);
            }}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pupil
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search pupils..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="OnHold">On Hold</SelectItem>
              <SelectItem value="Passed">Passed</SelectItem>
              <SelectItem value="Stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Pupil</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Progress</TableHead>
                <TableHead className="font-semibold">Next Lesson</TableHead>
                <TableHead className="font-semibold">Test Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredPupils.map((pupil, idx) => {
                  const nextLesson = getNextLesson(pupil.id);
                  const progress = pupil.targetHours > 0 
                    ? Math.round((pupil.hoursCompleted / pupil.targetHours) * 100) 
                    : 0;
                  
                  return (
                    <motion.tr
                      key={pupil.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => window.location.href = createPageUrl('PupilProfile') + `?id=${pupil.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                            {pupil.firstName?.[0]}{pupil.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {pupil.firstName} {pupil.lastName}
                            </p>
                            <p className="text-sm text-slate-500">{pupil.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[pupil.status]}>
                          {pupil.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">
                            {pupil.hoursCompleted || 0}/{pupil.targetHours || 45}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {nextLesson ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{moment(nextLesson.date).format('D MMM')}</span>
                            <span className="text-slate-400">{nextLesson.startTime}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No upcoming</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pupil.practicalTestDate ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className={
                              moment(pupil.practicalTestDate).isBefore(moment().add(7, 'days'))
                                ? 'text-rose-600 font-medium'
                                : 'text-slate-600'
                            }>
                              {moment(pupil.practicalTestDate).format('D MMM YYYY')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
          
          {filteredPupils.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pupils found</p>
            </div>
          )}
        </div>
      </div>

      <PupilFormModal
        open={showPupilModal}
        onClose={() => {
          setShowPupilModal(false);
          setEditingPupil(null);
        }}
        existingPupil={editingPupil}
        onSave={handleSavePupil}
      />
    </div>
  );
}