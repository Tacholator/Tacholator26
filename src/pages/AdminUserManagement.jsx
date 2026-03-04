import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, BookOpen, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminUserManagement() {
  const navigate = useNavigate();

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

  // Learners: users who have a pupil record
  const learnerUsers = allUsers.filter(u =>
    allPupils.some(p => p.linkedUserId === u.id || (p.email && p.email.toLowerCase() === u.email?.toLowerCase()))
  );

  // Instructors: users who have an instructor record
  const instructorUsers = allUsers.filter(u =>
    allInstructors.some(i => i.created_by === u.email)
  );

  const activePupils = allPupils.filter(p => p.status === 'Active').length;
  const passedPupils = allPupils.filter(p => p.status === 'Passed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('AdminDashboard'))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">User Management</h1>
            <p className="text-slate-500 mt-1">Overview of instructors and learners on the platform</p>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-5 h-5 text-slate-400" />
          <span className="text-slate-600 text-sm">
            <strong className="text-[#071739]">{allUsers.length}</strong> total registered users
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instructors Card */}
          <Card className="border-t-4 border-[#F7B602] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F7B602] to-[#d99f02] flex items-center justify-center">
                  <Car className="w-6 h-6 text-[#071739]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#071739]">Instructors</CardTitle>
                  <CardDescription>Registered driving instructors</CardDescription>
                </div>
              </div>
              <div className="text-4xl font-bold text-[#071739]">{instructorUsers.length}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-500 border-t border-slate-100 pt-3">
                {instructorUsers.length === 0 ? (
                  <p className="text-slate-400 italic">No instructors registered yet</p>
                ) : (
                  <ul className="space-y-2">
                    {instructorUsers.slice(0, 5).map(u => {
                      const instructor = allInstructors.find(i => i.created_by === u.email);
                      const pupilCount = allPupils.filter(p => p.instructorId === u.id).length;
                      return (
                        <li key={u.id} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-700">{instructor?.name || u.full_name || u.email}</span>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {pupilCount} pupil{pupilCount !== 1 ? 's' : ''}
                          </Badge>
                        </li>
                      );
                    })}
                    {instructorUsers.length > 5 && (
                      <p className="text-xs text-slate-400 pt-1">+{instructorUsers.length - 5} more</p>
                    )}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Learners Card */}
          <Card className="border-t-4 border-[#071739] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#071739] to-slate-700 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#F7B602]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#071739]">Learners</CardTitle>
                  <CardDescription>Registered learner drivers</CardDescription>
                </div>
              </div>
              <div className="text-4xl font-bold text-[#071739]">{learnerUsers.length}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 mb-3">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {activePupils} Active
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {passedPupils} Passed
                </Badge>
              </div>
              <div className="text-sm text-slate-500 border-t border-slate-100 pt-3">
                {learnerUsers.length === 0 ? (
                  <p className="text-slate-400 italic">No learners registered yet</p>
                ) : (
                  <ul className="space-y-2">
                    {learnerUsers.slice(0, 5).map(u => {
                      const pupil = allPupils.find(p => p.linkedUserId === u.id || p.email?.toLowerCase() === u.email?.toLowerCase());
                      return (
                        <li key={u.id} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-700">
                              {pupil ? `${pupil.firstName} ${pupil.lastName}` : u.full_name || u.email}
                            </span>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${pupil?.status === 'Active' ? 'border-emerald-300 text-emerald-600' : 'border-slate-300 text-slate-500'}`}
                          >
                            {pupil?.status || 'Unknown'}
                          </Badge>
                        </li>
                      );
                    })}
                    {learnerUsers.length > 5 && (
                      <p className="text-xs text-slate-400 pt-1">+{learnerUsers.length - 5} more</p>
                    )}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}