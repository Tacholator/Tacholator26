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
  CircleDashed,
  WalletMinimal
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import ProgressRing from '@/components/ui/ProgressRing';
import SkillsGrid from '@/components/skills/SkillsGrid';
import DiaryTimeline from '@/components/diary/DiaryTimeline';
import DiaryEntryModal from '@/components/modals/DiaryEntryModal';
import PupilFormModal from '@/components/modals/PupilFormModal';
import LessonFormModal from '@/components/modals/LessonFormModal';
import BookingSummaryModal from '@/components/booking/BookingSummaryModal';
import HomeworkSection from '@/components/homework/HomeworkSection';
import PupilProgressTracker from '@/components/progress/PupilProgressTracker';
import moment from 'moment';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';




export default function PupilProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const pupilId = urlParams.get('id');

  const [activeTab, setActiveTab] = useState('progress');
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingSummaryModal, setShowBookingSummaryModal] = useState(false);
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

  // Fetch confirmed bookings for the lessons tab
  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ['pupilConfirmedBookings', pupilId],
    queryFn: async () => {
      const bookings = await base44.entities.LessonBooking.filter({ 
        pupilId,
        status: 'confirmed'
      });
      return bookings.sort((a, b) => 
        moment(b.startAtUtc).diff(moment(a.startAtUtc))
      );
    },
    enabled: !!pupilId
  });

  // Calculate total escrowed amount from upcoming confirmed bookings
  const now = moment();
  const upcomingConfirmedBookings = confirmedBookings.filter(b => moment(b.startAtUtc).isAfter(now));
  const totalEscrowedGbp = upcomingConfirmedBookings.reduce((sum, b) => sum + (b.escrowAmountGbp || 0), 0);
  const availableBalance = (pupil?.bulkPaymentBalance || 0);
  const totalBalance = availableBalance + totalEscrowedGbp;

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
      
      // Deduct balance when creating a new diary entry
      if (data.lessonId) {
        const relatedLesson = lessons.find(l => l.id === data.lessonId);
        if (relatedLesson && relatedLesson.status !== 'Completed') {
          const startMoment = moment(relatedLesson.startTime, 'HH:mm');
          const endMoment = moment(relatedLesson.endTime, 'HH:mm');
          const durationHours = endMoment.diff(startMoment, 'minutes') / 60;
          
          const lessonCost = (pupil.hourlyRate || 0) * durationHours;
          const newHoursCompleted = (pupil.hoursCompleted || 0) + durationHours;
          const newBalance = (pupil.bulkPaymentBalance || 0) - lessonCost;
          
          await base44.entities.Pupil.update(pupil.id, { 
            hoursCompleted: newHoursCompleted,
            bulkPaymentBalance: newBalance
          });
          
          await base44.entities.Lesson.update(relatedLesson.id, { status: 'Completed' });
          
          // Create payment ledger entry
          if (lessonCost > 0) {
            await base44.entities.PaymentLedger.create({
              userId: pupil.linkedUserId || pupil.id,
              bookingId: null,
              type: 'charge',
              reason: 'lesson_confirmed_charge',
              amountGbp: lessonCost,
              hours: durationHours,
              createdByRole: 'instructor',
              note: `Lesson completed: ${durationHours.toFixed(2)}h @ £${pupil.hourlyRate}/h`
            });
          }
          
          queryClient.invalidateQueries(['pupil', pupilId]);
          queryClient.invalidateQueries(['lessons', pupilId]);
        }
      }
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
    
    // Create payment ledger entry
    if (lessonCost > 0) {
      await base44.entities.PaymentLedger.create({
        userId: pupil.linkedUserId || pupil.id,
        bookingId: null,
        type: 'charge',
        reason: 'lesson_confirmed_charge',
        amountGbp: lessonCost,
        hours: durationHours,
        createdByRole: 'instructor',
        note: `Lesson completed: ${durationHours.toFixed(2)}h @ £${pupil.hourlyRate}/h`
      });
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl('PupilList')}>
          <Button variant="ghost" className="mb-4 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Pupils
          </Button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border p-4 lg:p-6 mb-6"
        >
          <div className="flex flex-col gap-4">
            {/* Top row: avatar + name + edit button */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 lg:w-20 lg:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl lg:text-2xl font-bold">
                {pupil.firstName?.[0]}{pupil.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-800 truncate">
                      {pupil.firstName} {pupil.lastName}
                    </h1>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge className={{
                        'Active': 'bg-emerald-100 text-emerald-700',
                        'OnHold': 'bg-amber-100 text-amber-700',
                        'Passed': 'bg-blue-100 text-blue-700',
                        'Stopped': 'bg-purple-100 text-purple-700'
                      }[pupil.status || 'Active']}>
                        {pupil.status === 'OnHold' ? 'On Hold' : 
                         pupil.status === 'Stopped' ? 'One Off' : 
                         pupil.status || 'Active'}
                      </Badge>
                      {!pupil.hasSignedUp && !pupil.linkedUserId && (
                        <Badge className="bg-rose-100 text-rose-700">Not Signed Up</Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="shrink-0"
                  >
                    <Edit className="w-4 h-4 mr-1 lg:mr-2" />
                    <span>Edit</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-2">
                  {pupil.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="truncate">{pupil.phone}</span>
                    </div>
                  )}
                  {pupil.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{pupil.email}</span>
                    </div>
                  )}
                  {pupil.pickupAddress && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{pupil.pickupAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Ring + Stats */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-start pt-2 border-t">
              <div className="flex justify-center sm:justify-start">
                <ProgressRing
                  current={pupil.hoursCompleted || 0}
                  target={pupil.targetHours || 45}
                />
              </div>
              
              <div className="flex-1 space-y-2.5">
                {/* Theory Test */}
                <div className="flex items-center gap-2 text-sm">
                  {pupil.theoryTestPassed ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : pupil.theoryTestNotBooked ? (
                    <CircleDashed className="w-4 h-4 shrink-0 text-slate-400" />
                  ) : (
                    <Calendar className="w-4 h-4 shrink-0 text-blue-500" />
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
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : pupil.practicalTestNotBooked ? (
                    <CircleDashed className="w-4 h-4 shrink-0 text-slate-400" />
                  ) : (
                    <Calendar className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <div>
                    <p className="text-slate-400 text-xs">Practical Test</p>
                    <p className="font-medium text-slate-700">
                      {pupil.practicalTestPassed ? (
                        <span className="text-emerald-600 font-semibold">Passed</span>
                      ) : pupil.practicalTestNotBooked ? 'Not booked' :
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
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="font-medium">First Lesson Checks Complete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <CircleDashed className="w-4 h-4 shrink-0" />
                      <span className="font-medium">Checks Pending</span>
                    </div>
                  )}
                </div>

                {/* Hours Booked Info */}
                {(() => {
                  const now = moment();
                  const futureBookings = confirmedBookings.filter(b => 
                    moment(b.startAtUtc).isAfter(now)
                  );
                  const totalHoursBooked = futureBookings.reduce((sum, b) => sum + (b.durationHours || 0), 0);
                  if (totalHoursBooked > 0) {
                    return (
                      <div className="px-2 py-1 rounded-lg bg-teal-100 text-teal-700 text-sm w-fit">
                        Booked: {totalHoursBooked.toFixed(1)}h ({futureBookings.length} lesson{futureBookings.length !== 1 ? 's' : ''})
                      </div>
                    );
                  }
                })()}

                {/* Balance Override Toggle */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                    <WalletMinimal className="w-4 h-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700">Allow booking without balance</p>
                      <p className="text-xs text-slate-400">
                        Bypass the balance requirement for this pupil
                        {pupil.allowBookingWithoutBalance && totalEscrowedGbp > 0 && (
                          <span className="block text-amber-600 mt-0.5">
                            Balance left after booked lessons: £{availableBalance.toFixed(2)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={!!pupil.allowBookingWithoutBalance}
                    onCheckedChange={(checked) => updatePupilMutation.mutate({ allowBookingWithoutBalance: checked })}
                  />
                </div>

                {/* Payment Info */}
                {(pupil.hourlyRate > 0 || pupil.bulkPaymentBalance !== 0) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <div className={`px-2 py-1 rounded-lg ${availableBalance < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Available: £{availableBalance.toFixed(2)}
                      </div>
                      {totalEscrowedGbp > 0 && (
                        <div className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs">
                          In escrow: £{totalEscrowedGbp.toFixed(2)}
                        </div>
                      )}
                      {pupil.hourlyRate > 0 && (
                        <span className="text-slate-400">@ £{pupil.hourlyRate}/hr</span>
                      )}
                    </div>
                    {totalEscrowedGbp > 0 && (
                      <div className="text-xs text-slate-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        Total balance: £{totalBalance.toFixed(2)} ({upcomingConfirmedBookings.length} lesson{upcomingConfirmedBookings.length !== 1 ? 's' : ''} pending)
                      </div>
                    )}
                    {((pupil.auditNoShowHours || 0) > 0 || (pupil.auditLateCancellationHours || 0) > 0) && (
                      <div className="text-xs text-slate-500 space-y-0.5">
                        {(pupil.auditNoShowHours || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-600">No-show:</span>
                            <span>{pupil.auditNoShowHours.toFixed(1)}h</span>
                          </div>
                        )}
                        {(pupil.auditLateCancellationHours || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-600">Late cancellation:</span>
                            <span>{pupil.auditLateCancellationHours.toFixed(1)}h</span>
                          </div>
                        )}
                      </div>
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
          <div className="overflow-x-auto mb-6">
            <TabsList className="bg-gradient-to-r from-amber-50 to-orange-50 border-0 shadow-sm p-1 w-max min-w-full">
              <TabsTrigger 
                value="progress"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F7B602] data-[state=active]:to-[#d99f02] data-[state=active]:text-[#071739] data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-800 transition-all text-xs sm:text-sm"
              >
                Progress
              </TabsTrigger>
              <TabsTrigger 
                value="checks"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-800 transition-all text-xs sm:text-sm"
              >
                Checks
              </TabsTrigger>
              <TabsTrigger 
                value="diary"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-800 transition-all text-xs sm:text-sm"
              >
                Diary
              </TabsTrigger>
              <TabsTrigger 
                value="lessons"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-800 transition-all text-xs sm:text-sm"
              >
                Lessons
              </TabsTrigger>
              <TabsTrigger 
                value="homework"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-slate-600 hover:text-slate-800 transition-all text-xs sm:text-sm"
              >
                Homework
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="progress">
            {/* Audit Hours Section */}
            {((pupil?.auditNoShowHours || 0) > 0 || (pupil?.auditLateCancellationHours || 0) > 0) && (
              <Card className="mb-6 border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Audit Hours (Not Included in Progress)
                  </CardTitle>
                  <p className="text-sm text-amber-700">
                    These hours are tracked for record-keeping only and do not count toward lesson completion.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(pupil?.auditNoShowHours || 0) > 0 && (
                      <div className="p-4 bg-white rounded-lg border border-amber-200">
                        <div className="text-sm text-amber-600 font-medium mb-1">No-Show Hours</div>
                        <div className="text-2xl font-bold text-amber-900">
                          {pupil.auditNoShowHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          Lessons where pupil did not attend
                        </div>
                      </div>
                    )}
                    {(pupil?.auditLateCancellationHours || 0) > 0 && (
                      <div className="p-4 bg-white rounded-lg border border-amber-200">
                        <div className="text-sm text-amber-600 font-medium mb-1">Late Cancellation Hours</div>
                        <div className="text-2xl font-bold text-amber-900">
                          {pupil.auditLateCancellationHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          Lessons cancelled within 48 hours
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <PupilProgressTracker 
              pupilId={pupilId} 
              instructorId={pupil?.instructorId || currentUser?.id}
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
            <DiaryTimeline
              entries={diaryEntries}
              onEntryClick={(entry) => {
                setSelectedDiaryEntry(entry);
                setSelectedLesson(null);
                setShowDiaryModal(true);
              }}
            />
          </TabsContent>

          <TabsContent value="lessons">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Confirmed Lessons</CardTitle>
                <p className="text-sm text-slate-600">Lessons booked by the pupil that have been confirmed</p>
              </CardHeader>
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
                    {confirmedBookings.map(booking => {
                      const startMoment = moment(booking.startAtUtc).local();
                      const endMoment = moment(booking.endAtUtc).local();
                      
                      // Parse location from notes
                      const parseLocation = () => {
                        const notes = booking.notesFromPupil || '';
                        const pickupMatch = notes.match(/Pickup:\s*([^|]+)/);
                        return pickupMatch ? pickupMatch[1].trim() : 'Not specified';
                      };
                      
                      return (
                        <TableRow 
                           key={booking.id}
                           className="cursor-pointer hover:bg-slate-50"
                           onClick={async () => {
                             // Fetch the diary entry for this booking to determine if we should open in read-only mode
                             const diaryEntries = await base44.entities.DiaryEntry.filter({ lessonId: booking.id });
                             setSelectedBooking({ ...booking, hasDiaryEntry: diaryEntries.length > 0 });
                             setShowBookingSummaryModal(true);
                           }}
                         >
                          <TableCell className="font-medium">
                            {startMoment.format('ddd, D MMM YYYY')}
                          </TableCell>
                          <TableCell>
                            {startMoment.format('HH:mm')} - {endMoment.format('HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-4 h-4" />
                              {booking.durationHours} hour{booking.durationHours !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {parseLocation()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              Confirmed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {confirmedBookings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                          No confirmed lessons yet
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
        readOnly={!!selectedDiaryEntry}
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

      <BookingSummaryModal
        open={showBookingSummaryModal}
        onOpenChange={setShowBookingSummaryModal}
        booking={selectedBooking}
        pupil={pupil}
        readOnly={selectedBooking?.hasDiaryEntry}
      />
    </div>
  );
}