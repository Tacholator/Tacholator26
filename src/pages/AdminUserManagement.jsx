import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, BookOpen, Users, ArrowLeft, Loader2, ChevronRight, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// View states: 'overview' | 'instructors' | 'learners' | 'detail'

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allPupils = [], isLoading: pupilsLoading } = useQuery({
    queryKey: ['allPupils'],
    queryFn: () => base44.entities.Pupil.list(),
  });

  const { data: allInstructors = [], isLoading: instructorsLoading } = useQuery({
    queryKey: ['allInstructors'],
    queryFn: () => base44.entities.Instructor.list(),
  });

  const isLoading = usersLoading || pupilsLoading || instructorsLoading;

  const learnerUsers = allUsers.filter(u =>
    allPupils.some(p => p.linkedUserId === u.id || (p.email && p.email.toLowerCase() === u.email?.toLowerCase()))
  );

  const instructorUsers = allUsers.filter(u =>
    allInstructors.some(i => i.created_by === u.email || i.instructorEmail === u.email || i.userId === u.id) ||
    allPupils.some(p => p.instructorId === u.id)
  );

  const activePupils = allPupils.filter(p => p.status === 'Active').length;
  const passedPupils = allPupils.filter(p => p.status === 'Passed').length;

  const handleBack = () => {
    if (view === 'detail') setView(selectedUser?.type === 'instructor' ? 'instructors' : 'learners');
    else if (view === 'instructors' || view === 'learners') setView('overview');
    else navigate(createPageUrl('AdminDashboard'));
  };

  const openDetail = (user, type) => {
    setSelectedUser({ ...user, type });
    setView('detail');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">
              {view === 'overview' && 'User Management'}
              {view === 'instructors' && 'Instructors'}
              {view === 'learners' && 'Learners'}
              {view === 'detail' && (selectedUser?.type === 'instructor'
                ? (allInstructors.find(i => i.created_by === selectedUser.email)?.name || selectedUser.full_name || selectedUser.email)
                : (() => { const p = allPupils.find(p => p.linkedUserId === selectedUser?.id || p.email?.toLowerCase() === selectedUser?.email?.toLowerCase()); return p ? `${p.firstName} ${p.lastName}` : selectedUser?.full_name || selectedUser?.email; })()
              )}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {view === 'overview' && `${allUsers.length} total registered users`}
              {view === 'instructors' && `${instructorUsers.length} instructors`}
              {view === 'learners' && `${learnerUsers.length} learners`}
              {view === 'detail' && `${selectedUser?.type === 'instructor' ? 'Instructor' : 'Learner'} profile`}
            </p>
          </div>
        </div>

        {/* OVERVIEW */}
        {view === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instructors Card */}
            <Card
              className="border-t-4 border-[#F7B602] shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setView('instructors')}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F7B602] to-[#d99f02] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Car className="w-6 h-6 text-[#071739]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[#071739]">Instructors</CardTitle>
                    <CardDescription>Registered driving instructors</CardDescription>
                  </div>
                </div>
                <div className="text-5xl font-bold text-[#071739]">{instructorUsers.length}</div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[#F7B602] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  View all <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            {/* Learners Card */}
            <Card
              className="border-t-4 border-[#071739] shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setView('learners')}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#071739] to-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-[#F7B602]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[#071739]">Learners</CardTitle>
                    <CardDescription>Registered learner drivers</CardDescription>
                  </div>
                </div>
                <div className="text-5xl font-bold text-[#071739]">{learnerUsers.length}</div>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{activePupils} Active</Badge>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{passedPupils} Passed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[#071739] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  View all <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* INSTRUCTORS LIST */}
        {view === 'instructors' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {instructorUsers.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No instructors registered yet</p>
            ) : (
              instructorUsers.map(u => {
                const instructor = allInstructors.find(i => i.created_by === u.email || i.instructorEmail === u.email || i.userId === u.id);
                const pupilCount = allPupils.filter(p => p.instructorId === u.id).length;
                return (
                  <button
                    key={u.id}
                    onClick={() => openDetail(u, 'instructor')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F7B602]/20 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#071739]">{instructor?.name || u.full_name || u.email}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{pupilCount} pupil{pupilCount !== 1 ? 's' : ''}</Badge>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* LEARNERS LIST */}
        {view === 'learners' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {learnerUsers.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No learners registered yet</p>
            ) : (
              learnerUsers.map(u => {
                const pupil = allPupils.find(p => p.linkedUserId === u.id || p.email?.toLowerCase() === u.email?.toLowerCase());
                return (
                  <button
                    key={u.id}
                    onClick={() => openDetail(u, 'learner')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#071739]/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#071739]">
                          {pupil ? `${pupil.firstName} ${pupil.lastName}` : u.full_name || u.email}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${pupil?.status === 'Active' ? 'border-emerald-300 text-emerald-600' : pupil?.status === 'Passed' ? 'border-blue-300 text-blue-600' : 'border-slate-300 text-slate-500'}`}
                      >
                        {pupil?.status || 'Unknown'}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selectedUser && (() => {
          const isInstructorType = selectedUser.type === 'instructor';
          const instructor = allInstructors.find(i => i.created_by === selectedUser.email || i.instructorEmail === selectedUser.email || i.userId === selectedUser.id);
          const pupil = allPupils.find(p => p.linkedUserId === selectedUser.id || p.email?.toLowerCase() === selectedUser.email?.toLowerCase());
          const pupilCount = isInstructorType ? allPupils.filter(p => p.instructorId === selectedUser.id).length : null;

          return (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isInstructorType ? 'bg-[#F7B602]/20' : 'bg-[#071739]/10'}`}>
                    {isInstructorType ? <Car className="w-8 h-8 text-[#071739]" /> : <BookOpen className="w-8 h-8 text-[#071739]" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#071739]">
                      {isInstructorType
                        ? (instructor?.name || selectedUser.full_name || selectedUser.email)
                        : (pupil ? `${pupil.firstName} ${pupil.lastName}` : selectedUser.full_name || selectedUser.email)}
                    </h2>
                    <Badge className={isInstructorType ? 'bg-[#F7B602]/20 text-[#071739]' : 'bg-[#071739]/10 text-[#071739]'}>
                      {isInstructorType ? 'Instructor' : 'Learner'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow icon={Mail} label="Email" value={selectedUser.email} />
                  <DetailRow icon={Phone} label="Phone" value={isInstructorType ? (instructor?.phone || '—') : (pupil?.phone || '—')} />
                  <DetailRow icon={User} label="Full Name" value={selectedUser.full_name || '—'} />
                  <DetailRow icon={Calendar} label="Joined" value={selectedUser.created_date ? new Date(selectedUser.created_date).toLocaleDateString('en-GB') : '—'} />
                  {isInstructorType && (
                    <DetailRow icon={Users} label="Pupils" value={`${pupilCount} pupil${pupilCount !== 1 ? 's' : ''}`} />
                  )}
                  {!isInstructorType && pupil && (
                    <>
                      <DetailRow icon={MapPin} label="Pickup Address" value={pupil.pickupAddress || '—'} />
                      <DetailRow icon={Users} label="Instructor" value={pupil.instructorName || '—'} />
                      <DetailRow
                        label="Status"
                        value={pupil.status || '—'}
                        badge
                        badgeClass={pupil.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : pupil.status === 'Passed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Instructor Business Info */}
              {isInstructorType && instructor?.businessName && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-[#071739] mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow icon={BookOpen} label="Business Name" value={instructor.businessName} />
                    <DetailRow icon={Mail} label="Business Email" value={instructor.businessEmail || '—'} />
                    <DetailRow icon={Phone} label="Business Phone" value={instructor.businessPhone || '—'} />
                    <DetailRow icon={MapPin} label="Address" value={[instructor.businessAddress, instructor.businessCity, instructor.businessPostcode].filter(Boolean).join(', ') || '—'} />
                  </div>
                </div>
              )}

              {/* Learner test info */}
              {!isInstructorType && pupil && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-[#071739] mb-4">Test Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Theory Test" value={pupil.theoryTestPassed ? 'Passed' : (pupil.theoryTestDate ? new Date(pupil.theoryTestDate).toLocaleDateString('en-GB') : 'Not booked')} />
                    <DetailRow label="Practical Test" value={pupil.practicalTestPassed ? 'Passed' : (pupil.practicalTestDate ? new Date(pupil.practicalTestDate).toLocaleDateString('en-GB') : 'Not booked')} />
                    <DetailRow label="Test Centre" value={pupil.practicalTestCentre || '—'} />
                    <DetailRow label="Hours Completed" value={`${pupil.hoursCompleted || 0} hrs`} />
                    <DetailRow label="Target Hours" value={`${pupil.targetHours || 45} hrs`} />
                    <DetailRow label="Balance" value={`£${(pupil.bulkPaymentBalance || 0).toFixed(2)}`} />
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, badge, badgeClass }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        {badge ? (
          <Badge className={`text-xs mt-0.5 ${badgeClass}`}>{value}</Badge>
        ) : (
          <p className="text-sm font-medium text-slate-800">{value}</p>
        )}
      </div>
    </div>
  );
}