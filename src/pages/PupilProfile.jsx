import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  Clock,
  Loader2,
  Edit
} from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import SkillsGrid from '@/components/skills/SkillsGrid';
import DiaryTimeline from '@/components/diary/DiaryTimeline';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import PupilFormModal from '@/components/modals/PupilFormModal';
import LessonFormModal from '@/components/modals/LessonFormModal';
import moment from 'moment';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const statusColors = {
  Lead: 'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  OnHold: 'bg-amber-100 text-amber-700',
  Passed: 'bg-blue-100 text-blue-700',
  Stopped: 'bg-rose-100 text-rose-700'
};

export default function PupilProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const pupilId = urlParams.get('id');

  const [activeTab, setActiveTab] = useState('skills');
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['pupil', pupilId],
    queryFn: async () => {
      const pupils = await base44.entities.Pupil.filter({ id: pupilId });
      return pupils[0];
    },
    enabled: !!pupilId
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills', pupilId],
    queryFn: () => base44.entities.Skill.filter({ pupilId }),
    enabled: !!pupilId
  });

  const { data: diaryEntries = [] } = useQuery({
    queryKey: ['diaryEntries', pupilId],
    queryFn: async () => {
      const entries = await base44.entities.DiaryEntry.filter({ pupilId });
      return entries.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!pupilId
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', pupilId],
    queryFn: async () => {
      const allLessons = await base44.entities.Lesson.filter({ pupilId });
      return allLessons.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!pupilId
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Skill.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['skills', pupilId])
  });

  const createDiaryMutation = useMutation({
    mutationFn: (data) => base44.entities.DiaryEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries(['diaryEntries', pupilId])
  });

  const updateDiaryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiaryEntry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['diaryEntries', pupilId])
  });

  const updatePupilMutation = useMutation({
    mutationFn: (data) => base44.entities.Pupil.update(pupilId, data),
    onSuccess: () => queryClient.invalidateQueries(['pupil', pupilId])
  });

  const handleUpdateSkill = async (skillId, status) => {
    await updateSkillMutation.mutateAsync({ id: skillId, status });
  };

  const handleSaveDiary = async (data) => {
    if (selectedDiaryEntry) {
      await updateDiaryMutation.mutateAsync({ id: selectedDiaryEntry.id, data });
    } else {
      await createDiaryMutation.mutateAsync(data);
    }
  };

  const handleSaveDiaryAndComplete = async (diaryData) => {
    if (!selectedLesson) return;
    
    // Create the diary entry
    await base44.entities.DiaryEntry.create({
      ...diaryData,
      pupilId: selectedLesson.pupilId,
      lessonId: selectedLesson.id,
      instructorId: selectedLesson.instructorId
    });

    // Calculate lesson duration in hours
    const startMoment = moment(selectedLesson.startTime, 'HH:mm');
    const endMoment = moment(selectedLesson.endTime, 'HH:mm');
    const durationHours = endMoment.diff(startMoment, 'minutes') / 60;

    // Update lesson status to Completed
    await base44.entities.Lesson.update(selectedLesson.id, { status: 'Completed' });

    // Update pupil's hoursCompleted
    const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
    await base44.entities.Pupil.update(pupil.id, { hoursCompleted: newHoursCompleted });
    
    queryClient.invalidateQueries(['lessons', pupilId]);
    queryClient.invalidateQueries(['diaryEntries', pupilId]);
    queryClient.invalidateQueries(['pupil', pupilId]);
  };

  const handleSavePupil = async (data) => {
    await updatePupilMutation.mutateAsync(data);
  };

  if (pupilLoading || !pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl('PupilList')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Pupils
          </Button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-4 flex-1">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                {pupil.firstName?.[0]}{pupil.lastName?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-slate-800">
                    {pupil.firstName} {pupil.lastName}
                  </h1>
                  <Badge className={statusColors[pupil.status]}>{pupil.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  {pupil.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {pupil.phone}
                    </div>
                  )}
                  {pupil.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {pupil.email}
                    </div>
                  )}
                  {pupil.pickupAddress && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {pupil.pickupAddress}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>

            {/* Progress Ring */}
            <div className="flex items-center gap-8">
              <ProgressRing
                current={pupil.hoursCompleted || 0}
                target={pupil.targetHours || 45}
              />
              
              <div className="space-y-3">
                {pupil.theoryTestDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-slate-400 text-xs">Theory Test</p>
                      <p className="font-medium text-slate-700">
                        {moment(pupil.theoryTestDate).format('D MMM YYYY')}
                      </p>
                    </div>
                  </div>
                )}
                {pupil.practicalTestDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <div>
                      <p className="text-slate-400 text-xs">Practical Test</p>
                      <p className="font-medium text-slate-700">
                        {moment(pupil.practicalTestDate).format('D MMM YYYY')}
                      </p>
                      {pupil.practicalTestCentre && (
                        <p className="text-xs text-slate-400">{pupil.practicalTestCentre}</p>
                      )}
                    </div>
                  </div>
                )}
                {pupil.googleSheetUrl && (
                  <a 
                    href={pupil.googleSheetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Google Sheet
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm mb-6">
            <TabsTrigger value="skills">Skills Tracker</TabsTrigger>
            <TabsTrigger value="diary">Lesson Diary</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <div className="mb-4">
              <Button 
                onClick={() => setShowLessonModal(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Next Lesson
              </Button>
            </div>
            {skillsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <SkillsGrid skills={skills} onUpdateSkill={handleUpdateSkill} />
            )}
          </TabsContent>

          <TabsContent value="diary">
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  setSelectedDiaryEntry(null);
                  setShowDiaryModal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson Feedback
              </Button>
            </div>
            <DiaryTimeline
              entries={diaryEntries}
              onEntryClick={(entry) => {
                setSelectedDiaryEntry(entry);
                setShowDiaryModal(true);
              }}
            />
          </TabsContent>

          <TabsContent value="lessons">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map(lesson => (
                      <TableRow 
                        key={lesson.id}
                        className={lesson.status === 'Scheduled' ? 'cursor-pointer hover:bg-slate-50' : ''}
                        onClick={() => {
                          if (lesson.status === 'Scheduled') {
                            setSelectedLesson(lesson);
                            setSelectedDiaryEntry(null);
                            setShowDiaryModal(true);
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          {moment(lesson.date).format('ddd, D MMM YYYY')}
                        </TableCell>
                        <TableCell>
                          {lesson.startTime} - {lesson.endTime}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-4 h-4" />
                            {lesson.durationMinutes || 60} mins
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {lesson.location || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={{
                            Scheduled: 'bg-blue-100 text-blue-700',
                            Completed: 'bg-emerald-100 text-emerald-700',
                            Cancelled: 'bg-rose-100 text-rose-700'
                          }[lesson.status]}>
                            {lesson.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lessons.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                          No lessons recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DiaryEntryModal
        open={showDiaryModal}
        onClose={() => {
          setShowDiaryModal(false);
          setSelectedDiaryEntry(null);
          setSelectedLesson(null);
        }}
        pupilId={pupilId}
        lessonId={selectedLesson?.id}
        lesson={selectedLesson}
        pupil={pupil}
        existingEntry={selectedDiaryEntry}
        onSave={selectedLesson ? handleSaveDiaryAndComplete : handleSaveDiary}
      />

      <PupilFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        existingPupil={pupil}
        onSave={handleSavePupil}
      />

      <LessonFormModal
        open={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        existingLesson={{ pupilId: pupilId, date: moment().format('YYYY-MM-DD'), startTime: '09:00', endTime: '10:00', status: 'Scheduled' }}
        pupils={[pupil]}
        onSave={async (data) => {
          await base44.entities.Lesson.create(data);
          queryClient.invalidateQueries(['lessons', pupilId]);
        }}
      />
    </div>
  );
}