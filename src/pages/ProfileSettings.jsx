import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Trash2, Volume2, Upload, X, ClipboardCheck, Mic, Building2, FileText, MapPin, Pencil, Shield, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import moment from 'moment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfileSettings() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePhotoUrl: ''
  });

  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessAddress: '',
    businessCity: '',
    businessPostcode: '',
    businessLogoUrl: '',
    businessRegistration: '',
    businessPhone: '',
    businessEmail: '',
    usePersonalPhoneForBusiness: false,
    usePersonalEmailForBusiness: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [businessSaveSuccess, setBusinessSaveSuccess] = useState(false);
  const [hasPersonalChanges, setHasPersonalChanges] = useState(false);
  const [hasBusinessChanges, setHasBusinessChanges] = useState(false);
  const [isPersonalEditing, setIsPersonalEditing] = useState(false);
  const [isBusinessEditing, setIsBusinessEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('enable_audio_reading') !== 'false';
  });
  const [audioVoice, setAudioVoice] = useState(() => {
    return localStorage.getItem('study_material_voice') || 'neutral_female';
  });

  const isInstructor = user?.role === 'admin';

  // Learner: fetch pupil profile for DVLA section
  const { data: pupil } = useQuery({
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
    enabled: !!user?.id && !isInstructor
  });

  const [dvlaForm, setDvlaForm] = useState({ dvlaCheckCode: '', licenceSuffix: '' });
  const [dvlaFormError, setDvlaFormError] = useState('');

  const submitDvlaMutation = useMutation({
    mutationFn: (data) => base44.entities.Pupil.update(pupil.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPupilProfile']);
      setDvlaFormError('');
    }
  });

  const handleDvlaSubmit = () => {
    if (!dvlaForm.dvlaCheckCode || dvlaForm.dvlaCheckCode.length !== 8) {
      setDvlaFormError('Check code must be exactly 8 characters.');
      return;
    }
    if (!dvlaForm.licenceSuffix || dvlaForm.licenceSuffix.length !== 8) {
      setDvlaFormError('Last 8 characters of licence number is required.');
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

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.full_name?.split(' ')[0] || '',
        lastName: user.lastName || user.full_name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || '',
        profilePhotoUrl: user.profilePhotoUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchInstructorProfile = async () => {
      if (user?.id && isInstructor) {
        const profiles = await base44.entities.Instructor.filter({ created_by: user.email });
        if (profiles.length > 0) {
          const profile = profiles[0];
          setInstructorProfile(profile);
          setBusinessData({
            businessName: profile.businessName || '',
            businessAddress: profile.businessAddress || '',
            businessCity: profile.businessCity || '',
            businessPostcode: profile.businessPostcode || '',
            businessLogoUrl: profile.businessLogoUrl || '',
            businessRegistration: profile.businessRegistration || '',
            businessPhone: profile.businessPhone || '',
            businessEmail: profile.businessEmail || '',
            usePersonalPhoneForBusiness: profile.usePersonalPhoneForBusiness || false,
            usePersonalEmailForBusiness: profile.usePersonalEmailForBusiness || false
          });
        }
      }
    };
    if (user) {
      fetchInstructorProfile();
    }
  }, [user, isInstructor]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setHasPersonalChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe(formData);
      
      // Save instructor business info if instructor
      if (isInstructor && instructorProfile) {
        await base44.entities.Instructor.update(instructorProfile.id, businessData);
      }
      
      queryClient.invalidateQueries(['currentUser']);
      
      // If instructor and name changed, update all pupil records
      if (isInstructor && (formData.firstName || formData.lastName)) {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        if (fullName) {
          const pupils = await base44.entities.Pupil.filter({ instructorId: user.id });
          await Promise.all(
            pupils.map(pupil => 
              base44.entities.Pupil.update(pupil.id, { instructorName: fullName })
            )
          );
        }
      }
      
      setSaveSuccess(true);
      setHasPersonalChanges(false);
      setIsPersonalEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioToggle = (checked) => {
    setAudioEnabled(checked);
    localStorage.setItem('enable_audio_reading', checked.toString());
    if (!checked) {
      window.speechSynthesis.cancel();
    }
  };

  const handleVoiceChange = (voice) => {
    setAudioVoice(voice);
    localStorage.setItem('study_material_voice', voice);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profilePhotoUrl: file_url }));
      setSaveSuccess(false);
      setHasPersonalChanges(true);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhotoUrl: '' }));
    setSaveSuccess(false);
    setHasPersonalChanges(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBusinessData(prev => ({ ...prev, businessLogoUrl: file_url }));
      setSaveSuccess(false);
      setHasBusinessChanges(true);
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setBusinessData(prev => ({ ...prev, businessLogoUrl: '' }));
    setSaveSuccess(false);
    setHasBusinessChanges(true);
  };

  const handleBusinessChange = (field, value) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setBusinessSaveSuccess(false);
    setHasBusinessChanges(true);
  };

  const handleSaveBusinessInfo = async () => {
    setIsSavingBusiness(true);
    try {
      if (instructorProfile) {
        await base44.entities.Instructor.update(instructorProfile.id, businessData);
      }
      setBusinessSaveSuccess(true);
      setHasBusinessChanges(false);
      setIsBusinessEditing(false);
      setTimeout(() => setBusinessSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save business info:', error);
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const dashboardPage = isInstructor ? 'InstructorDashboard' : 'LearnerDashboard';
  const displayName = formData.firstName || user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl(dashboardPage)}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-500 mt-1">Manage your personal information</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    {formData.profilePhotoUrl ? (
                      <img src={formData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white text-xl">
                        {displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {formData.profilePhotoUrl && (
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <p className="text-sm text-slate-500">{isInstructor ? 'Instructor' : 'Learner'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!isPersonalEditing ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Name</p>
                        <p className="font-medium text-slate-800">{formData.firstName} {formData.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="font-medium text-slate-800">{user?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Phone</p>
                        <p className="font-medium text-slate-800">{formData.phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={() => setIsPersonalEditing(true)} className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Update Details
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />Profile Photo</Label>
                    <div className="flex items-center gap-4">
                      <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <Button type="button" variant="outline" disabled={isUploading} onClick={() => document.getElementById('photo-upload')?.click()} className="gap-2">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      {formData.profilePhotoUrl && <p className="text-xs text-emerald-600">Photo uploaded</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />First Name</Label>
                      <Input id="firstName" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Enter your first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />Last Name</Label>
                      <Input id="lastName" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Enter your last name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />Email Address</Label>
                      <Input value={user?.email || ''} disabled className="bg-slate-50" />
                      <p className="text-xs text-slate-400">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />Role</Label>
                      <Input value={isInstructor ? 'Instructor' : 'Learner'} disabled className="bg-slate-50" />
                      <p className="text-xs text-slate-400">Role is fixed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />Phone Number</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Enter your phone number" />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsPersonalEditing(false)}>Cancel</Button>
                      <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </Button>
                    </div>
                    {saveSuccess && <p className="text-sm text-emerald-600">Saved!</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Information - Instructors Only */}
        {isInstructor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Information
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  This information will appear on your invoices
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {!isBusinessEditing ? (
                  <>
                    <div className="space-y-3">
                      {businessData.businessLogoUrl && (
                        <img src={businessData.businessLogoUrl} alt="Business Logo" className="h-16 w-auto border rounded-lg mb-2" />
                      )}
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Business Name</p>
                          <p className="font-medium text-slate-800">{businessData.businessName || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Address</p>
                          <p className="font-medium text-slate-800">
                            {[businessData.businessAddress, businessData.businessCity, businessData.businessPostcode].filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Business Phone</p>
                          <p className="font-medium text-slate-800">{businessData.businessPhone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Business Email</p>
                          <p className="font-medium text-slate-800">{businessData.businessEmail || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <Button variant="outline" onClick={() => setIsBusinessEditing(true)} className="gap-2">
                        <Pencil className="w-4 h-4" />
                        Update Details
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />Business Logo</Label>
                      {businessData.businessLogoUrl && (
                        <div className="relative inline-block mb-3">
                          <img src={businessData.businessLogoUrl} alt="Business Logo" className="h-20 w-auto border rounded-lg" />
                          <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <Button type="button" variant="outline" disabled={isUploadingLogo} onClick={() => document.getElementById('logo-upload')?.click()} className="gap-2">
                          {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        {businessData.businessLogoUrl && <p className="text-xs text-emerald-600">Logo uploaded</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" />Business Name</Label>
                      <Input id="businessName" value={businessData.businessName} onChange={(e) => handleBusinessChange('businessName', e.target.value)} placeholder="e.g., ABC Driving School" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />Business Address</Label>
                      <Input id="businessAddress" value={businessData.businessAddress} onChange={(e) => handleBusinessChange('businessAddress', e.target.value)} placeholder="Street address" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessCity">City</Label>
                        <Input id="businessCity" value={businessData.businessCity} onChange={(e) => handleBusinessChange('businessCity', e.target.value)} placeholder="City" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessPostcode">Postcode</Label>
                        <Input id="businessPostcode" value={businessData.businessPostcode} onChange={(e) => handleBusinessChange('businessPostcode', e.target.value)} placeholder="Postcode" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessRegistration" className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />Business Registration Number (Optional)</Label>
                      <Input id="businessRegistration" value={businessData.businessRegistration} onChange={(e) => handleBusinessChange('businessRegistration', e.target.value)} placeholder="e.g., 12345678" />
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />Business Phone</Label>
                      <div className="flex items-center gap-3 mb-2">
                        <Switch id="usePersonalPhone" checked={businessData.usePersonalPhoneForBusiness} onCheckedChange={(checked) => { handleBusinessChange('usePersonalPhoneForBusiness', checked); if (checked) handleBusinessChange('businessPhone', formData.phone); }} />
                        <Label htmlFor="usePersonalPhone" className="text-sm font-normal cursor-pointer">Use personal phone number</Label>
                      </div>
                      <Input id="businessPhone" value={businessData.businessPhone} onChange={(e) => handleBusinessChange('businessPhone', e.target.value)} placeholder="Business phone number" disabled={businessData.usePersonalPhoneForBusiness} />
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />Business Email</Label>
                      <div className="flex items-center gap-3 mb-2">
                        <Switch id="usePersonalEmail" checked={businessData.usePersonalEmailForBusiness} onCheckedChange={(checked) => { handleBusinessChange('usePersonalEmailForBusiness', checked); if (checked) handleBusinessChange('businessEmail', user?.email || ''); }} />
                        <Label htmlFor="usePersonalEmail" className="text-sm font-normal cursor-pointer">Use personal email address</Label>
                      </div>
                      <Input id="businessEmail" value={businessData.businessEmail} onChange={(e) => handleBusinessChange('businessEmail', e.target.value)} placeholder="Business email address" disabled={businessData.usePersonalEmailForBusiness} />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsBusinessEditing(false)}>Cancel</Button>
                        <Button onClick={handleSaveBusinessInfo} disabled={isSavingBusiness} className="bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] gap-2">
                          {isSavingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Business Info
                        </Button>
                      </div>
                      {businessSaveSuccess && <p className="text-sm text-emerald-600">Saved!</p>}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admin: Daily Quizzes */}
        {isInstructor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Link to={createPageUrl('AdminDailyQuizzes')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <ClipboardCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Daily Quizzes</h3>
                        <p className="text-sm text-slate-500">Manage quiz questions and schedule</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* DVLA Licence Verification - Learners Only */}
        {!isInstructor && pupil && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5" />
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
                <p className="text-sm text-slate-500 mt-1">Share your DVLA check code with your instructor so they can verify your licence online before your lesson.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(!pupil.licenseChecked || !pupil.eyeTestChecked) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Remember:</strong> Always bring your physical provisional licence to your first lesson. Your instructor must see the original document.
                    </p>
                  </div>
                )}

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
                          onChange={(e) => { setDvlaForm({ ...dvlaForm, dvlaCheckCode: e.target.value.toUpperCase() }); setDvlaFormError(''); }}
                          placeholder="8 characters"
                          maxLength={8}
                          className="font-mono tracking-widest uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Last 8 chars of Licence No. <span className="text-rose-500">*</span></label>
                        <Input
                          value={dvlaForm.licenceSuffix}
                          onChange={(e) => { setDvlaForm({ ...dvlaForm, licenceSuffix: e.target.value.toUpperCase() }); setDvlaFormError(''); }}
                          placeholder="8 characters"
                          maxLength={8}
                          className="font-mono tracking-widest uppercase"
                        />
                      </div>
                    </div>
                    {dvlaFormError && <p className="text-xs text-rose-500">{dvlaFormError}</p>}
                    <Button
                      onClick={handleDvlaSubmit}
                      disabled={submitDvlaMutation.isPending || !dvlaForm.dvlaCheckCode || !dvlaForm.licenceSuffix}
                      className="bg-[#071739] hover:bg-[#0a2142] text-white"
                    >
                      {submitDvlaMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Share with Instructor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Delete Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="border-0 shadow-sm border-rose-200">
            <CardHeader>
              <CardTitle className="text-lg text-rose-700">Delete Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Link to={createPageUrl('AccountDeletionRequest')}>
                <Button variant="outline" className="text-rose-600 border-rose-300 hover:bg-rose-50 gap-2">
                  <Trash2 className="w-4 h-4" />
                  Request Account Deletion
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}