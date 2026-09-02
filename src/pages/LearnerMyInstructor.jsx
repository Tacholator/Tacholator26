import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, User, Loader2, MapPin, Building2, UserX } from 'lucide-react';

export default function LearnerMyInstructor() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      if (user?.email) {
        const byEmail = await base44.entities.Pupil.filter({ email: user.email });
        if (byEmail.length > 0) return byEmail[0];
      }
      return null;
    },
    enabled: !!user?.id
  });

  const { data: instructor, isLoading: instructorLoading } = useQuery({
    queryKey: ['myInstructor', pupil?.instructorId],
    queryFn: async () => {
      if (!pupil?.instructorId) return null;

      // Fetch Instructor entity by instructorId — accessible to learners
      const instructors = await base44.entities.Instructor.filter({ created_by: pupil.instructorEmail });
      const instructorDetails = instructors[0] || null;

      return {
        id: pupil.instructorId,
        full_name: instructorDetails?.name || pupil.instructorName || pupil.instructorEmail,
        email: pupil.instructorEmail,
        phone: instructorDetails?.phone || instructorDetails?.businessPhone || null,
        profilePhotoUrl: instructorDetails?.profilePhotoUrl || null,
        businessName: instructorDetails?.businessName || null,
        businessAddress: instructorDetails?.businessAddress || null,
        businessCity: instructorDetails?.businessCity || null,
        businessPostcode: instructorDetails?.businessPostcode || null,
        businessEmail: instructorDetails?.businessEmail || null,
        businessPhone: instructorDetails?.businessPhone || null,
        businessLogoUrl: instructorDetails?.businessLogoUrl || null,
      };
    },
    enabled: !!pupil?.instructorId
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
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#071739]">My Instructor</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 px-6">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <UserX className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-[#071739] mb-3">Account Not Linked to an Instructor</h2>
              <p className="text-slate-600 max-w-md mb-4">
                Your learner account hasn't been linked to an instructor yet. Your instructor needs to add you to their Tacholator account first.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md w-full text-left">
                <p className="text-sm font-semibold text-blue-800 mb-1">What to do next:</p>
                <p className="text-sm text-blue-700">
                  Please contact your driving instructor and ask them to link your account in the Tacholator app. They will need your email address: <strong>{user?.email}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!instructorLoading && pupil && !pupil.instructorId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#071739]">My Instructor</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 px-6">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <UserX className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-[#071739] mb-3">Account Not Linked to an Instructor</h2>
              <p className="text-slate-600 max-w-md mb-4">
                Your learner account hasn't been linked to an instructor yet. Your instructor needs to link your account before you can view their details here.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md w-full text-left">
                <p className="text-sm font-semibold text-blue-800 mb-1">What to do next:</p>
                <p className="text-sm text-blue-700">
                  Please contact your driving instructor and ask them to link your account in the Tacholator app. They will need your email address: <strong>{user?.email}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
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

        {/* Business Information Card */}
        {(instructor.businessName || instructor.businessAddress || instructor.businessEmail || instructor.businessPhone) && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {instructor.businessLogoUrl && (
                  <img
                    src={instructor.businessLogoUrl}
                    alt="Business logo"
                    className="w-20 h-20 object-contain rounded-lg border border-slate-100"
                  />
                )}
                <div className="flex-1 space-y-3">
                  {instructor.businessName && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Business Name</div>
                        <div className="font-medium">{instructor.businessName}</div>
                      </div>
                    </div>
                  )}

                  {(instructor.businessAddress || instructor.businessCity || instructor.businessPostcode) && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Address</div>
                        <div className="font-medium">
                          {[instructor.businessAddress, instructor.businessCity, instructor.businessPostcode].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}

                  {instructor.businessPhone && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Business Phone</div>
                        <div className="font-medium">{instructor.businessPhone}</div>
                      </div>
                    </div>
                  )}

                  {instructor.businessEmail && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#071739]" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Business Email</div>
                        <div className="font-medium">{instructor.businessEmail}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}



      </div>
    </div>
  );
}