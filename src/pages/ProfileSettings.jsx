import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Save, Loader2, User, Mail, Phone } from 'lucide-react';
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
    phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.full_name?.split(' ')[0] || '',
        lastName: user.lastName || user.full_name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || ''
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
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white text-xl">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <p className="text-sm text-slate-500">{isInstructor ? 'Instructor' : 'Learner'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
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

              {/* Email Field (View Only) */}
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
      </div>
    </div>
  );
}