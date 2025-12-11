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
  Edit,
  CheckCircle2,
  CircleDashed
} from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import SkillsGrid from '@/components/skills/SkillsGrid';
import DiaryTimeline from '@/components/diary/DiaryTimeline';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import PupilFormModal from '@/components/modals/PupilFormModal';
import LessonFormModal from '@/components/modals/LessonFormModal';
import HomeworkSection from '@/components/homework/HomeworkSection';
import PupilProgressTracker from '@/components/progress/PupilProgressTracker';
import moment from 'moment';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';



export default function PupilProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const pupilId = urlParams.get('id');

  const [activeTab, setActiveTab] = useState('skills');
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [checksData, setChecksData] = useState({
    licenseChecked: false,
    licenseCheckDate: '',
    licenseCheckNotes: '',
    eyeTestChecked: false,
    eyeTestCheckDate: '',
    eyeTestCheckNotes: ''
  });
  const [originalChecksData, setOriginalChecksData] = useState(null);
  const [checksModified, setChecksModified] = useState(false);

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

  const { data: homework = [] } = useQuery({
    queryKey: ['homework', pupilId],
    queryFn: async () => {
      const items = await base44.entities.HomeworkItem.filter({ pupilId });
      return items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!pupilId
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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

    // Update pupil's hoursCompleted and deduct from bulk payment
    const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
    const lessonCost = (pupil.hourlyRate || 0) * durationHours;
    const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
    await base44.entities.Pupil.update(pupil.id, { 
      hoursCompleted: newHoursCompleted,
      bulkPaymentBalance: newBalance
    });
    
    queryClient.invalidateQueries(['lessons', pupilId]);
    queryClient.invalidateQueries(['diaryEntries', pupilId]);
    queryClient.invalidateQueries(['pupil', pupilId]);
  };

  const handleSavePupil = async (data) => {
    await updatePupilMutation.mutateAsync(data);
  };

  const saveChecksMutation = useMutation({
    mutationFn: (data) => base44.entities.Pupil.update(pupilId, data),
    onSuccess: () => queryClient.invalidateQueries(['pupil', pupilId])
  });

  const handleSaveChecks = async () => {
    await saveChecksMutation.mutateAsync(checksData);
  };

  React.useEffect(() => {
    if (pupil) {
      const savedData = {
        licenseChecked: pupil.licenseChecked || false,
        licenseCheckDate: pupil.licenseCheckDate || '',
        licenseCheckNotes: pupil.licenseCheckNotes || '',
        eyeTestChecked: pupil.eyeTestChecked || false,
        eyeTestCheckDate: pupil.eyeTestCheckDate || '',
        eyeTestCheckNotes: pupil.eyeTestCheckNotes || ''
      };
      setChecksData(savedData);
      setOriginalChecksData(savedData);
      setChecksModified(false);
    }
  }, [pupil]);

  React.useEffect(() => {
    if (originalChecksData) {
      const isModified = JSON.stringify(checksData) !== JSON.stringify(originalChecksData);
      setChecksModified(isModified);
    }
  }, [checksData, originalChecksData]);

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
                                            <Badge className={{
                                                                          'active_recently': 'bg-emerald-100 text-emerald-700',
                                                                          'active_but_quiet': 'bg-amber-100 text-amber-700',
                                                                          'signed_up_only': 'bg-slate-100 text-slate-600',
                                                                          'inactive': 'bg-rose-100 text-rose-700',
                                                                          'not_signed_up': 'bg-rose-100 text-rose-700'
                                                                        }[pupil.signupStatus || 'not_signed_up']}>
                                                                          {pupil.signupStatus === 'active_recently' ? 'Active' : 
                                                                           pupil.signupStatus === 'active_but_quiet' ? 'Quiet' :
                                                                           pupil.signupStatus === 'signed_up_only' ? 'Signed Up' :
                                                                           pupil.signupStatus === 'inactive' ? 'Inactive' :
                                                                           'Not Signed Up'}
                                                                        </Badge>
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
                {/* Theory Test */}
                <div className="flex items-center gap-2 text-sm">
                  {pupil.theoryTestPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : pupil.theoryTestNotBooked ? (
                    <CircleDashed className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Calendar className="w-4 h-4 text-blue-500" />
                  )}
                  <div>
                    <p className="text-slate-400 text-xs">Theory Test</p>
                    <p className="font-medium text-slate-700">
                      {pupil.theoryTestPassed ? 'Passed' : 
                       pupil.theoryTestNotBooked ? 'Not booked' :
                       pupil.theoryTestDate ? moment(pupil.theoryTestDate).format('D MMM YYYY') : 'Not set'}
                    </p>
                  </div>
                </div>
                
                {/* Practical Test */}
                <div className="flex items-center gap-2 text-sm">
                  {pupil.practicalTestPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : pupil.practicalTestNotBooked ? (
                    <CircleDashed className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Calendar className="w-4 h-4 text-rose-500" />
                  )}
                  <div>
                    <p className="text-slate-400 text-xs">Practical Test</p>
                    <p className="font-medium text-slate-700">
                      {pupil.practicalTestPassed ? 'Passed' : 
                                               pupil.practicalTestNotBooked ? 'Not booked' :
                                               pupil.practicalTestDate ? `${moment(pupil.practicalTestDate).format('D MMM YYYY')}${pupil.practicalTestTime ? ` at ${pupil.practicalTestTime}` : ''}` : 'Not set'}
                    </p>
                    {pupil.practicalTestCentre && !pupil.practicalTestPassed && !pupil.practicalTestNotBooked && (
                      <p className="text-xs text-slate-400">{pupil.practicalTestCentre}</p>
                    )}
                  </div>
                </div>
                
                {/* First Lesson Checks Status */}
                <div className="flex items-center gap-2 text-sm">
                  {pupil.licenseChecked && pupil.eyeTestChecked ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">First Lesson Checks Complete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <CircleDashed className="w-4 h-4" />
                      <span className="font-medium">Checks Pending</span>
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                                      {(pupil.hourlyRate > 0 || pupil.bulkPaymentBalance !== 0) && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <div className={`px-2 py-1 rounded-lg ${pupil.bulkPaymentBalance < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            Balance: £{(pupil.bulkPaymentBalance || 0).toFixed(2)}
                                          </div>
                                          {pupil.hourlyRate > 0 && (
                                            <span className="text-slate-400">@ £{pupil.hourlyRate}/hr</span>
                                          )}
                                        </div>
                                      )}

                                      {/* Account Activity */}
                                                                                  <div className="text-xs text-slate-500 space-y-1 border-t pt-2 mt-2">
                                                                                    <p className="font-medium text-slate-600">Account Status</p>
                                                                                    {pupil.hasSignedUp ? (
                                                                                      <>
                                                                                        {pupil.firstLoginTimestamp && (
                                                                                          <p>First login: {moment(pupil.firstLoginTimestamp).format('D MMM YYYY, h:mm a')}</p>
                                                                                        )}
                                                                                        {pupil.lastLoginTimestamp && (
                                                                                          <p>Last login: {moment(pupil.lastLoginTimestamp).fromNow()}</p>
                                                                                        )}
                                                                                        {pupil.lastActivityTimestamp && (
                                                                                          <p>Last activity: {moment(pupil.lastActivityTimestamp).fromNow()}</p>
                                                                                        )}
                                                                                      </>
                                                                                    ) : (
                                                                                      <p className="text-rose-500">Not signed up yet</p>
                                                                                    )}
                                                                                  </div>

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
                          <TabsTrigger value="progress">Driving Progress</TabsTrigger>
                          <TabsTrigger value="checks">First Lesson Checks</TabsTrigger>
                          <TabsTrigger value="diary">Lesson Diary</TabsTrigger>
                          <TabsTrigger value="lessons">Lessons</TabsTrigger>
                          <TabsTrigger value="homework">Homework</TabsTrigger>
                        </TabsList>

          <TabsContent value="progress">
            <PupilProgressTracker
              pupilId={pupilId}
              instructorId={pupil.instructorId}
              isInstructor={true}
            />
          </TabsContent>

          <TabsContent value="checks">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>First Lesson Checks</CardTitle>
                <p className="text-sm text-slate-600">Record license and eye test checks from the first lesson</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* License Check */}
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checksData.licenseChecked}
                        onCheckedChange={(checked) => setChecksData({ ...checksData, licenseChecked: checked })}
                      />
                      <div>
                        <label className="font-medium text-slate-800">Provisional License Checked</label>
                        <p className="text-xs text-slate-500">Verify and record license details</p>
                      </div>
                    </div>
                    {checksData.licenseChecked && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  
                  {checksData.licenseChecked && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Check Date</label>
                        <Input
                          type="date"
                          value={checksData.licenseCheckDate}
                          onChange={(e) => setChecksData({ ...checksData, licenseCheckDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Notes</label>
                        <Textarea
                          value={checksData.licenseCheckNotes}
                          onChange={(e) => setChecksData({ ...checksData, licenseCheckNotes: e.target.value })}
                          placeholder="Add any notes about the license check..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Eye Test Check */}
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checksData.eyeTestChecked}
                        onCheckedChange={(checked) => setChecksData({ ...checksData, eyeTestChecked: checked })}
                      />
                      <div>
                        <label className="font-medium text-slate-800">Eye Test Passed</label>
                        <p className="text-xs text-slate-500">Verify pupil can read a number plate</p>
                      </div>
                    </div>
                    {checksData.eyeTestChecked && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  
                  {checksData.eyeTestChecked && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Check Date</label>
                        <Input
                          type="date"
                          value={checksData.eyeTestCheckDate}
                          onChange={(e) => setChecksData({ ...checksData, eyeTestCheckDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Notes</label>
                        <Textarea
                          value={checksData.eyeTestCheckNotes}
                          onChange={(e) => setChecksData({ ...checksData, eyeTestCheckNotes: e.target.value })}
                          placeholder="Add any notes about the eye test..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveChecks}
                    disabled={saveChecksMutation.isPending || !checksModified}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {saveChecksMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Checks'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            <div className="mb-4">
              <Button 
                onClick={() => setShowLessonModal(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Next Lesson
              </Button>
            </div>
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

                        <TabsContent value="homework">
                          <HomeworkSection
                            pupilId={pupilId}
                            instructorId={currentUser?.id}
                            homework={homework}
                          />
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