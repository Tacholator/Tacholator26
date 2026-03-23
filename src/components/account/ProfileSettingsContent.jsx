import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Save, Loader2, User, Mail, Phone, Upload, X, Volume2, Mic, Building2, FileText, MapPin, Pencil, Camera } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function ProfileSettingsContent({ user, isInstructor }) {
  const queryClient = useQueryClient();

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
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState(null);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('enable_audio_reading') !== 'false';
  });
  const [audioVoice, setAudioVoice] = useState(() => {
    return localStorage.getItem('study_material_voice') || 'neutral_female';
  });

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

  const resizeImageToBase64 = (file, maxSize = 300) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let updatedFormData = { ...formData };
      if (pendingPhotoFile) {
        const base64Url = await resizeImageToBase64(pendingPhotoFile);
        updatedFormData = { ...updatedFormData, profilePhotoUrl: base64Url };
        setFormData(updatedFormData);
        setPendingPhotoFile(null);
        setPendingPhotoPreview(null);
      }
      await base44.auth.updateMe(updatedFormData);
      
      if (isInstructor && instructorProfile) {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        await base44.entities.Instructor.update(instructorProfile.id, {
          ...businessData,
          ...(fullName ? { name: fullName } : {})
        });
      }
      
      queryClient.invalidateQueries(['currentUser']);
      
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const previewUrl = URL.createObjectURL(file);
    setPendingPhotoFile(file);
    setPendingPhotoPreview(previewUrl);
    setHasPersonalChanges(true);
  };

  const handleRemovePhoto = () => {
    setPendingPhotoFile(null);
    setPendingPhotoPreview(null);
    setFormData(prev => ({ ...prev, profilePhotoUrl: '' }));
    setHasPersonalChanges(true);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const previewUrl = URL.createObjectURL(file);
    setPendingLogoFile(file);
    setPendingLogoPreview(previewUrl);
    setHasBusinessChanges(true);
  };

  const handleRemoveLogo = () => {
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    setBusinessData(prev => ({ ...prev, businessLogoUrl: '' }));
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
      let updatedBusinessData = { ...businessData };
      if (pendingLogoFile) {
        setIsUploadingLogo(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingLogoFile });
        updatedBusinessData = { ...updatedBusinessData, businessLogoUrl: file_url };
        setBusinessData(updatedBusinessData);
        setPendingLogoFile(null);
        setPendingLogoPreview(null);
        setIsUploadingLogo(false);
      }
      if (instructorProfile) {
        await base44.entities.Instructor.update(instructorProfile.id, updatedBusinessData);
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

  const displayName = formData.firstName || user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {(pendingPhotoPreview || formData.profilePhotoUrl) ? (
                  <img src={pendingPhotoPreview || formData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white text-xl">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {pendingPhotoPreview && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-md" title="Unsaved">
                  <Save className="w-3 h-3" />
                </div>
              )}
              {!pendingPhotoPreview && formData.profilePhotoUrl && isPersonalEditing && (
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
            /* Read-only view */
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
            /* Edit mode */
            <>
              {/* Profile Photo Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Profile Photo
                </Label>
                {/* Hidden inputs for each source */}
                <input type="file" id="photo-upload-library" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <input type="file" id="photo-upload-camera" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
                <input type="file" id="photo-upload-file" accept="image/*,.heic,.heif" onChange={handlePhotoUpload} className="hidden" />

                {/* Preview */}
                {pendingPhotoPreview && (
                  <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <img src={pendingPhotoPreview} alt="New profile photo" className="h-16 w-16 rounded-full object-cover border-2 border-amber-300" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">New photo selected</p>
                      <p className="text-xs text-amber-600">Click "Save Changes" to apply</p>
                    </div>
                    <button onClick={handleRemovePhoto} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-upload-library')?.click()} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Photo Library
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-upload-camera')?.click()} className="gap-2">
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-upload-file')?.click()} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Choose File
                  </Button>
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
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
                {saveSuccess && <p className="text-sm text-emerald-600">Saved!</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Business Information - Instructors Only */}
      {isInstructor && (
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
              /* Read-only view */
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
              /* Edit mode */
              <>
                {/* Business Logo */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />Business Logo</Label>
                  <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} className="hidden" />

                  {/* Pending preview */}
                  {pendingLogoPreview && (
                    <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <img src={pendingLogoPreview} alt="New business logo" className="h-16 w-auto border rounded-lg object-contain" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">New logo selected</p>
                        <p className="text-xs text-amber-600">Click "Save Business Info" to apply</p>
                      </div>
                      <button onClick={handleRemoveLogo} className="text-rose-500 hover:text-rose-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Current logo (no pending) */}
                  {!pendingLogoPreview && businessData.businessLogoUrl && (
                    <div className="relative inline-block">
                      <img src={businessData.businessLogoUrl} alt="Business Logo" className="h-20 w-auto border rounded-lg" />
                      <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()} className="gap-2">
                    <Upload className="w-4 h-4" />
                    {businessData.businessLogoUrl || pendingLogoPreview ? 'Replace Logo' : 'Upload Logo'}
                  </Button>
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
                    <Button onClick={handleSaveBusinessInfo} disabled={isSavingBusiness || isUploadingLogo} className="bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] gap-2">
                      {(isSavingBusiness || isUploadingLogo) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isUploadingLogo ? 'Uploading...' : 'Save Business Info'}
                    </Button>
                  </div>
                  {businessSaveSuccess && <p className="text-sm text-emerald-600">Saved!</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accessibility Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Accessibility Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="audio-reading" className="text-base font-medium">
                Enable audio reading
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Allow the app to read study content and course sections aloud
              </p>
            </div>
            <Switch
              id="audio-reading"
              checked={audioEnabled}
              onCheckedChange={handleAudioToggle}
            />
          </div>

          {audioEnabled && (
            <div className="space-y-2 pl-4 border-l-2 border-slate-200">
              <Label htmlFor="voice-select" className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-slate-400" />
                Study Material Voice
              </Label>
              <Select value={audioVoice} onValueChange={handleVoiceChange}>
                <SelectTrigger id="voice-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral_female">Female (UK)</SelectItem>
                  <SelectItem value="neutral_male">Male (UK)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Choose the voice used when listening to study material
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}