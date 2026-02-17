import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User, Loader2 } from 'lucide-react';

export default function LearnerMyInstructor() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: instructor, isLoading: instructorLoading } = useQuery({
    queryKey: ['myInstructor', pupil?.instructorEmail],
    queryFn: async () => {
      if (!pupil?.instructorEmail) return null;
      // Fetch instructor User by email to get full_name
      const users = await base44.entities.User.filter({ email: pupil.instructorEmail });
      if (users.length > 0) {
        const instructorUser = users[0];
        // Also fetch Instructor entity for additional details
        let instructorDetails = null;
        if (pupil?.instructorId) {
          const instructors = await base44.entities.Instructor.filter({ id: pupil.instructorId });
          if (instructors.length > 0) instructorDetails = instructors[0];
        }
        return {
          id: instructorUser.id,
          full_name: instructorUser.full_name,
          email: instructorUser.email,
          phone: instructorDetails?.phone || null,
          profilePhotoUrl: instructorDetails?.profilePhotoUrl || null
        };
      }
      return null;
    },
    enabled: !!pupil?.instructorEmail
  });

  if (pupilLoading || instructorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">No pupil profile found</p>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">No instructor assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#071739]">My Instructor</h1>
          <p className="text-slate-600 mt-2">Your driving instructor's information</p>
        </div>

        {/* Instructor Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Instructor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Photo */}
              <Avatar className="w-32 h-32 border-4 border-[#F7B602]">
                <AvatarImage src={instructor.profilePhotoUrl} alt={instructor.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] text-3xl">
                  {instructor.full_name?.[0]?.toUpperCase() || 'I'}
                </AvatarFallback>
              </Avatar>

              {/* Instructor Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#071739]">{instructor.full_name}</h2>
                  <Badge className="mt-2 bg-[#F7B602] text-[#071739]">
                    Driving Instructor
                  </Badge>
                </div>

                <div className="space-y-3">
                  {instructor.phone && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Phone</div>
                        <div className="font-medium">{instructor.phone}</div>
                      </div>
                    </div>
                  )}

                  {pupil.instructorEmail && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Email</div>
                        <div className="font-medium">{pupil.instructorEmail}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">Hourly Rate</div>
                <div className="text-2xl font-bold text-[#071739]">
                  £{pupil.hourlyRate || 0}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">Hours Completed</div>
                <div className="text-2xl font-bold text-[#071739]">
                  {pupil.hoursCompleted || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}