import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Trash2, Volume2, Upload, X } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('enable_audio_reading') !== 'false';
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe(formData);
      queryClient.invalidateQueries(['currentUser']);
      setSaveSuccess(true);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profilePhotoUrl: file_url }));
      setSaveSuccess(false);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhotoUrl: '' }));
    setSaveSuccess(false);
  };

  const isInstructor = user?.role === 'admin';
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
              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="photo" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Profile Photo
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label htmlFor="photo-upload">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  </label>
                  {formData.profilePhotoUrl && (
                    <p className="text-xs text-emerald-600">Photo uploaded</p>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Email and Role (View Only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-400">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={isInstructor ? 'Instructor' : 'Learner'}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-400">Role is fixed</p>
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {saveSuccess && (
                  <p className="text-sm text-emerald-600">Changes saved successfully!</p>
                )}
                {!saveSuccess && <div />}
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700 gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accessibility Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Accessibility Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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