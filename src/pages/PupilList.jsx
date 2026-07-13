import React, { useState, useEffect } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  User,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  Trash2,
  X,
  Lock
} from 'lucide-react';

// Returns true if a Passed pupil's access should be restricted (>7 days since pass date)
const isAccessRestricted = (pupil) => {
  if (pupil.status !== 'Passed' || !pupil.practicalTestPassDate) return false;
  const daysSince = (Date.now() - new Date(pupil.practicalTestPassDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 7;
};
import PupilFormModal, { DVSA_SKILLS } from '@/components/modals/PupilFormModal';
import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';
import OneOffPupilModal from '@/components/modals/OneOffPupilModal';
import moment from 'moment';



export default function PupilList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [showPupilModal, setShowPupilModal] = useState(false);
  const [showOneOffModal, setShowOneOffModal] = useState(false);
  const [editingPupil, setEditingPupil] = useState(null);
  const [pastTestPupils, setPastTestPupils] = useState([]);
  const [currentTestPupilIndex, setCurrentTestPupilIndex] = useState(0);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(null);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { hasValidSub } = useInstructorSubscription(currentUser?.id);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: pupils = [], isLoading } = useQuery({
    queryKey: ['pupils', currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: async () => {
      // Fetch by both instructorId and instructorEmail to handle data inconsistencies, then deduplicate
      const [byId, byEmail] = await Promise.all([
        base44.entities.Pupil.filter({ instructorId: currentUser?.id }),
        base44.entities.Pupil.filter({ instructorEmail: currentUser?.email }),
      ]);
      const map = {};
      for (const p of [...byId, ...byEmail]) map[p.id] = p;
      const allPupils = Object.values(map);
      const users = await base44.entities.User.list();
      
      // Backfill signup status for existing pupils
      for (const pupil of allPupils) {
        if (pupil.signupStatus === 'not_signed_up' || !pupil.signupStatus) {
          // Check if there's a matching user account
          const matchingUser = users.find(
            u => u.email?.toLowerCase() === pupil.email?.toLowerCase() && u.role === 'user'
          );
          
          if (matchingUser) {
            // User account exists, update pupil status
            const updates = {
              hasSignedUp: true,
              linkedUserId: matchingUser.id
            };
            
            // Determine status based on login timestamps
            if (pupil.lastLoginTimestamp) {
              const lastLogin = new Date(pupil.lastLoginTimestamp);
              const now = new Date();
              const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
              
              if (daysSinceLogin <= 7) {
                updates.signupStatus = 'active_recently';
              } else if (daysSinceLogin <= 30) {
                updates.signupStatus = 'active_but_quiet';
              } else {
                updates.signupStatus = 'inactive';
              }
            } else {
              updates.signupStatus = 'signed_up_only';
            }
            
            // Update in background (don't await)
            base44.entities.Pupil.update(pupil.id, updates);
            
            // Also update local object for immediate display
            Object.assign(pupil, updates);
          }
        }
      }
      
      return allPupils;
    }
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const allLessons = await base44.entities.Lesson.filter({ instructorId: currentUser.id });
      return allLessons || [];
    },
    enabled: !!currentUser?.id,
    staleTime: 0, // No cache - always fetch fresh
    refetchOnMount: 'stale'
  });

  const createPupilMutation = useMutation({
    mutationFn: (data) => base44.entities.Pupil.create(data),
    onSuccess: () => queryClient.invalidateQueries(['pupils'])
  });

  const updatePupilMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pupil.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pupils']);
      // After updating, check for more past test pupils
      setTimeout(() => {
        const updatedPupils = queryClient.getQueryData(['pupils', currentUser?.id]);
        if (updatedPupils) {
          const pupilsWithPastTests = updatedPupils.filter(p => 
            p.practicalTestDate && moment(p.practicalTestDate).isBefore(moment()) && p.status === 'Active'
          );
          setPastTestPupils(pupilsWithPastTests);
          if (pupilsWithPastTests.length > 0) {
            setCurrentTestPupilIndex(0);
            setShowTestDialog(true);
          }
        }
      }, 100);
    }
  });

  const createSkillsMutation = useMutation({
    mutationFn: (skills) => base44.entities.Skill.bulkCreate(skills)
  });

  const deletePupilMutation = useMutation({
    mutationFn: (id) => base44.entities.Pupil.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['pupils'])
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
      const skills = DVSA_SKILLS.map((skill, index) => ({
        pupilId: result.id,
        instructorId: currentUser?.id,
        title: skill.name,
        order: index,
        status: 'not_started'
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

  const handleSaveOneOffPupil = async (data) => {
    // Add instructor info and set status to 'Stopped' for one-off pupils
    const pupilData = {
      ...data,
      instructorId: currentUser?.id,
      instructorEmail: currentUser?.email,
      instructorName: currentUser?.full_name,
      status: 'Stopped'
    };
    const result = await createPupilMutation.mutateAsync(pupilData);
    // Create DVSA skills for new pupil
    const skills = DVSA_SKILLS.map((skill, index) => ({
      pupilId: result.id,
      instructorId: currentUser?.id,
      title: skill.name,
      order: index,
      status: 'not_started'
    }));
    await createSkillsMutation.mutateAsync(skills);
  };

  const getNextLesson = (pupilId) => {
    const today = moment().startOf('day');
    const pupilLessons = lessons
      .filter(l => {
        if (!l.pupilId || !l.date) return false;
        // Check: pupilId matches, date is today or later, status is Scheduled
        const matchesPupil = l.pupilId === pupilId;
        const isNotPast = moment(l.date).isSameOrAfter(today);
        const isScheduled = l.status === 'Scheduled';
        return matchesPupil && isNotPast && isScheduled;
      })
      .sort((a, b) => moment(a.date).diff(moment(b.date)));
    
    return pupilLessons.length > 0 ? pupilLessons[0] : null;
  };

  useEffect(() => {
    // Check for pupils with past test dates when component mounts or pupils change
    if (pupils.length > 0) {
      const pupilsWithPastTests = pupils.filter(p => 
        p.practicalTestDate && moment(p.practicalTestDate).isBefore(moment().endOf('day')) && p.status === 'Active'
      );
      if (pupilsWithPastTests.length > 0) {
        setPastTestPupils(pupilsWithPastTests);
        setCurrentTestPupilIndex(0);
        setShowTestDialog(true);
      }
    }
  }, [pupils]);

  const filteredPupils = pupils.filter(pupil => {
    const matchesSearch = `${pupil.firstName} ${pupil.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = pupil.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activePupils = pupils.filter(p => p.status === 'Active');
  const onHoldPupils = pupils.filter(p => p.status === 'OnHold');
  const passedPupils = pupils.filter(p => p.status === 'Passed');
  const oneOffPupils = pupils.filter(p => p.status === 'Stopped');

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
            <div className="flex gap-4 mt-2">
              <p className="text-slate-500">{pupils.length} total</p>
              <p className="text-emerald-600 font-medium">{activePupils.length} active</p>
              <p className="text-amber-600 font-medium">{onHoldPupils.length} on hold</p>
              <p className="text-blue-600 font-medium">{passedPupils.length} passed</p>
              <p className="text-purple-600 font-medium">{oneOffPupils.length} new intakes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!hasValidSub && (
              <a href="/InstructorSubscription">
                <Button className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] gap-2">
                  Start Free Trial
                </Button>
              </a>
            )}
            <Button
              onClick={() => {
                setEditingPupil(null);
                setShowPupilModal(true);
              }}
              disabled={!hasValidSub}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pupil
            </Button>
          </div>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setStatusFilter('Active')}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === 'Active'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className="text-left">
              <div className="text-2xl font-bold text-emerald-600">{activePupils.length}</div>
              <div className="text-sm text-slate-600 mt-1">Active</div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('OnHold')}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === 'OnHold'
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-200 bg-white hover:border-amber-300'
            }`}
          >
            <div className="text-left">
              <div className="text-2xl font-bold text-amber-600">{onHoldPupils.length}</div>
              <div className="text-sm text-slate-600 mt-1">On Hold</div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('Passed')}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === 'Passed'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="text-left">
              <div className="text-2xl font-bold text-blue-600">{passedPupils.length}</div>
              <div className="text-sm text-slate-600 mt-1">Passed</div>
            </div>
          </button>

          <div
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              statusFilter === 'Stopped'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-purple-300'
            }`}
            onClick={() => setStatusFilter('Stopped')}
          >
            <div className="text-left">
              <div className="text-2xl font-bold text-purple-600">{oneOffPupils.length}</div>
              <div className="text-sm text-slate-600 mt-1">New Intakes</div>
              <div className="mt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOneOffModal(true);
                  }}
                  disabled={!hasValidSub}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-xs h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Intake
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
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
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <Link to={createPageUrl('PupilProfile') + `?id=${pupil.id}`} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                            {pupil.firstName?.[0]}{pupil.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {pupil.firstName} {pupil.lastName}
                            </p>
                            <p className="text-sm text-slate-500">{pupil.phone}</p>
                            {!pupil.phone && (
                              <Badge className="bg-rose-100 text-rose-700 text-xs mt-1">
                                Missing Phone
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={{
                            'Active': 'bg-emerald-100 text-emerald-700',
                            'OnHold': 'bg-amber-100 text-amber-700',
                            'Passed': 'bg-blue-100 text-blue-700',
                            'Stopped': 'bg-purple-100 text-purple-700'
                          }[pupil.status || 'Active']}>
                           {pupil.status === 'OnHold' ? 'On Hold' : 
                            pupil.status === 'Stopped' ? 'New Intake' : 
                            pupil.status || 'Active'}
                          </Badge>
                          {isAccessRestricted(pupil) && (
                            <Badge className="bg-rose-100 text-rose-700 gap-1">
                              <Lock className="w-3 h-3" />
                              Access Restricted
                            </Badge>
                          )}
                          {isAccessRestricted(pupil) && pupil.practicalTestPassDate && (
                            <p className="text-xs text-rose-400">
                              Since {moment(pupil.practicalTestPassDate).add(7, 'days').format('D MMM YYYY')}
                            </p>
                          )}
                          {!pupil.hasSignedUp && !pupil.linkedUserId && (
                            <Badge className="bg-rose-100 text-rose-700">
                              Not Signed Up
                            </Badge>
                          )}
                          {pupil.lastLoginTimestamp && (
                            <p className="text-xs text-slate-400">
                              Last login: {moment(pupil.lastLoginTimestamp).fromNow()}
                            </p>
                          )}
                        </div>
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
                                                    <div className="flex items-center gap-2">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (confirm(`Delete ${pupil.firstName} ${pupil.lastName}?`)) {
                                                            deletePupilMutation.mutate(pupil.id);
                                                          }
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                      <ChevronRight className="w-5 h-5 text-slate-300" />
                                                    </div>
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

      <OneOffPupilModal
        open={showOneOffModal}
        onClose={() => setShowOneOffModal(false)}
        onSave={handleSaveOneOffPupil}
      />

      {/* Test Outcome Dialog */}
      <AlertDialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <AlertDialogContent>
          {pastTestPupils.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <AlertDialogHeader className="flex-1">
                  <AlertDialogTitle>Practical Test Date Passed</AlertDialogTitle>
                  <AlertDialogDescription>
                    {pastTestPupils[currentTestPupilIndex]?.firstName} {pastTestPupils[currentTestPupilIndex]?.lastName}'s practical test date ({moment(pastTestPupils[currentTestPupilIndex]?.practicalTestDate).format('D MMM YYYY')}) has passed. What was the outcome?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <button
                  onClick={() => setShowTestDialog(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-3 py-4">
                <Button
                  onClick={() => {
                    const today = moment().format('YYYY-MM-DD');
                    updatePupilMutation.mutate({
                      id: pastTestPupils[currentTestPupilIndex].id,
                      data: { status: 'Passed', practicalTestDate: null, practicalTestPassDate: today }
                    });
                    if (currentTestPupilIndex < pastTestPupils.length - 1) {
                      setCurrentTestPupilIndex(currentTestPupilIndex + 1);
                    } else {
                      setShowTestDialog(false);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Passed
                </Button>
                <Button
                  onClick={() => {
                    updatePupilMutation.mutate({
                      id: pastTestPupils[currentTestPupilIndex].id,
                      data: { practicalTestDate: null }
                    });
                    if (currentTestPupilIndex < pastTestPupils.length - 1) {
                      setCurrentTestPupilIndex(currentTestPupilIndex + 1);
                    } else {
                      setShowTestDialog(false);
                    }
                  }}
                  variant="outline"
                >
                  Failed
                </Button>
                <Button
                  onClick={() => {
                    updatePupilMutation.mutate({
                      id: pastTestPupils[currentTestPupilIndex].id,
                      data: { practicalTestDate: null }
                    });
                    if (currentTestPupilIndex < pastTestPupils.length - 1) {
                      setCurrentTestPupilIndex(currentTestPupilIndex + 1);
                    } else {
                      setShowTestDialog(false);
                    }
                  }}
                  variant="outline"
                >
                  Not Taken
                </Button>
                <Button
                  onClick={() => {
                    setShowRescheduleDialog(true);
                  }}
                  variant="outline"
                >
                  Rescheduled
                </Button>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Test Date Dialog */}
      <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Practical Test</AlertDialogTitle>
            <AlertDialogDescription>
              Set the new test date for {pastTestPupils[currentTestPupilIndex]?.firstName} {pastTestPupils[currentTestPupilIndex]?.lastName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rescheduleDate) {
                  updatePupilMutation.mutate({
                    id: pastTestPupils[currentTestPupilIndex].id,
                    data: { practicalTestDate: rescheduleDate }
                  });
                  setRescheduleDate(null);
                  setShowRescheduleDialog(false);
                  if (currentTestPupilIndex < pastTestPupils.length - 1) {
                    setCurrentTestPupilIndex(currentTestPupilIndex + 1);
                  } else {
                    setShowTestDialog(false);
                  }
                }
              }}
              disabled={!rescheduleDate}
            >
              Save New Date
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}