import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, User, Loader2, MapPin, Building2, ExternalLink, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import moment from 'moment';

export default function LearnerMyInstructor() {
  const queryClient = useQueryClient();
  const [dvlaForm, setDvlaForm] = useState({ dvlaCheckCode: '', licenceSuffix: '' });
  const [formError, setFormError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil, isLoading: pupilLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      const allPupils = await base44.entities.Pupil.list();
      let match = allPupils.find(p => p.linkedUserId === user.id);
      if (!match && user?.email) {
        match = allPupils.find(p => p.email && p.email.toLowerCase() === user.email.toLowerCase());
      }
      return match || null;
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

  const submitDvlaMutation = useMutation({
    mutationFn: (data) => base44.entities.Pupil.update(pupil.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPupilProfile']);
      setFormError('');
    }
  });

  const handleDvlaSubmit = () => {
    if (!dvlaForm.dvlaCheckCode || dvlaForm.dvlaCheckCode.length !== 8) {
      setFormError('Check code must be exactly 8 characters.');
      return;
    }
    const submissionDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    submitDvlaMutation.mutate({
      dvlaCheckCode: dvlaForm.dvlaCheckCode.toUpperCase(),
      licenceSuffix: dvlaForm.licenceSuffix.toUpperCase(),
      dvlaSubmissionDate: submissionDate,
      dvlaExpiryDate: expiryDate,
      instructorDvlaVerified: false,
      instructorDvlaVerifiedDate: null
    });
  };

  const handleClearDvla = () => {
    submitDvlaMutation.mutate({
      dvlaCheckCode: null,
      licenceSuffix: null,
      dvlaSubmissionDate: null,
      dvlaExpiryDate: null,
      instructorDvlaVerified: false,
      instructorDvlaVerifiedDate: null
    });
    setDvlaForm({ dvlaCheckCode: '', licenceSuffix: '' });
  };

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

  if (!instructorLoading && pupil && !pupil.instructorId) {
    return <NotLinkedBanner />;
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

        {/* DVLA Licence Verification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#071739]" />
              DVLA Licence Verification
              {pupil.dvlaCheckCode && (
                (() => {
                  const expiry = pupil.dvlaExpiryDate ? new Date(pupil.dvlaExpiryDate) : null;
                  const isExpired = expiry && expiry < new Date();
                  const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  if (isExpired) return <Badge className="bg-rose-100 text-rose-700 ml-2">Expired</Badge>;
                  if (daysLeft !== null && daysLeft <= 7) return <Badge className="bg-amber-100 text-amber-700 ml-2">Expiring in {daysLeft}d</Badge>;
                  if (pupil.instructorDvlaVerified) return <Badge className="bg-emerald-100 text-emerald-700 ml-2">Verified ✓</Badge>;
                  return <Badge className="bg-blue-100 text-blue-700 ml-2">Submitted</Badge>;
                })()
              )}
            </CardTitle>
            <p className="text-sm text-slate-600">Share your DVLA check code with your instructor so they can verify your licence online before your lesson.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Remember:</strong> Always bring your physical provisional licence to your first lesson. Your instructor must see the original document.
              </p>
            </div>

            {pupil.dvlaCheckCode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">Check Code</p>
                    <p className="font-mono font-bold text-slate-800 text-lg tracking-widest">{pupil.dvlaCheckCode}</p>
                  </div>
                  {pupil.licenceSuffix && (
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <p className="text-xs text-slate-500 mb-1">Licence (Last 8 chars)</p>
                      <p className="font-mono font-bold text-slate-800 text-lg tracking-widest">{pupil.licenceSuffix}</p>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  {pupil.dvlaSubmissionDate && <p>Submitted: {moment(pupil.dvlaSubmissionDate).format('D MMM YYYY, h:mm a')}</p>}
                  {pupil.dvlaExpiryDate && (
                    <p className={new Date(pupil.dvlaExpiryDate) < new Date() ? 'text-rose-500 font-medium' : ''}>
                      Valid until: {moment(pupil.dvlaExpiryDate).format('D MMM YYYY, h:mm a')}
                    </p>
                  )}
                  {pupil.instructorDvlaVerified && (
                    <p className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Your instructor has verified your licence details
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleClearDvla} disabled={submitDvlaMutation.isPending} className="text-slate-600">
                  Update Details
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">How to get your check code:</p>
                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Visit the DVLA website and sign in with your driving licence details</li>
                    <li>Select "Share your licence information"</li>
                    <li>Generate a one-time check code (valid for 21 days)</li>
                    <li>Enter it below</li>
                  </ol>
                  <a
                    href="https://www.gov.uk/view-driving-licence"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Go to DVLA website
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Check Code <span className="text-rose-500">*</span></label>
                    <Input
                      value={dvlaForm.dvlaCheckCode}
                      onChange={(e) => { setDvlaForm({ ...dvlaForm, dvlaCheckCode: e.target.value.toUpperCase() }); setFormError(''); }}
                      placeholder="8 characters"
                      maxLength={8}
                      className="font-mono tracking-widest uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Last 8 chars of Licence No.</label>
                    <Input
                      value={dvlaForm.licenceSuffix}
                      onChange={(e) => setDvlaForm({ ...dvlaForm, licenceSuffix: e.target.value.toUpperCase() })}
                      placeholder="Optional"
                      maxLength={8}
                      className="font-mono tracking-widest uppercase"
                    />
                  </div>
                </div>
                {formError && <p className="text-xs text-rose-500">{formError}</p>}
                <Button
                  onClick={handleDvlaSubmit}
                  disabled={submitDvlaMutation.isPending || !dvlaForm.dvlaCheckCode}
                  className="bg-[#071739] hover:bg-[#0a2142] text-white"
                >
                  {submitDvlaMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Share with Instructor
                </Button>
              </div>
            )}
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