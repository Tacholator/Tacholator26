import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, Volume2 } from 'lucide-react';

const instructorSettings = [
  {
    id: 'notifBookingEvents',
    label: 'Lesson bookings and changes',
    description: 'New, rescheduled, or cancelled lessons'
  },
  {
    id: 'notifPupilMessages',
    label: 'Messages from pupils',
    description: 'New chat messages'
  },
  {
    id: 'notifArrivalResponses',
    label: 'Arrival responses',
    description: "Pupil responses to 'Notify Arrival'"
  },
  {
    id: 'notifHomeworkEvents',
    label: 'Homework updates',
    description: 'Submissions and completion status'
  },
  {
    id: 'notifStudyEngagement',
    label: 'Study engagement',
    description: 'Pupil activity with study materials'
  },
  {
    id: 'notifProgressUpdates',
    label: 'Progress milestones',
    description: 'Skills and quiz achievements'
  },
  {
    id: 'notifPaymentEvents',
    label: 'Payments and balances',
    description: 'Payment receipts and block hour updates'
  },
  {
    id: 'notifSystemUpdates',
    label: 'System updates',
    description: 'Platform announcements and tips'
  }
];

const learnerSettings = [
  {
    id: 'notifBookingChanges',
    label: 'Lesson bookings and changes',
    description: 'New, rescheduled, or cancelled lessons'
  },
  {
    id: 'notifInstructorMessages',
    label: 'Messages from instructor',
    description: 'New chat messages'
  },
  {
    id: 'notifArrivalAlerts',
    label: 'Instructor arrival',
    description: 'When your instructor arrives'
  },
  {
    id: 'notifHomeworkAssigned',
    label: 'New homework',
    description: 'Homework assignments from your instructor'
  },
  {
    id: 'notifStudyMaterialAssigned',
    label: 'Study material assigned',
    description: 'New DVSA skills and learning content'
  },
  {
    id: 'notifLearningReminders',
    label: 'Learning reminders',
    description: 'Reminders to complete homework or study'
  },
  {
    id: 'notifPaymentUpdates',
    label: 'Payments and receipts',
    description: 'Payment confirmations and balance info'
  },
  {
    id: 'notifSystemInfo',
    label: 'Tips and updates',
    description: 'Learning resources and system updates'
  }
];

const instructorSoundSettings = [
  {
    id: 'soundMessageAlert',
    label: 'Message sounds',
    description: 'Play sound when pupils send messages'
  },
  {
    id: 'soundNotificationAlert',
    label: 'Notification sounds',
    description: 'Play sound for bookings, homework, and system alerts'
  },
  {
    id: 'soundMuteMode',
    label: 'Mute all sounds',
    description: 'Turn off all audio alerts'
  }
];

const learnerSoundSettings = [
  {
    id: 'soundMessageAlert',
    label: 'Message sounds',
    description: 'Play sound when instructor sends messages'
  },
  {
    id: 'soundNotificationAlert',
    label: 'Notification sounds',
    description: 'Play sound for bookings, homework, and reminders'
  },
  {
    id: 'soundMuteMode',
    label: 'Mute all sounds',
    description: 'Turn off all audio alerts'
  }
];

export default function NotificationSettings({ userId, isInstructor }) {
  const queryClient = useQueryClient();
  const [savedSettings, setSavedSettings] = useState({});
  const [recentlySaved, setRecentlySaved] = useState('');

  const entityName = isInstructor ? 'InstructorNotificationPreferences' : 'LearnerNotificationPreferences';
  const userIdField = isInstructor ? 'instructorId' : 'learnerId';
  const settingsConfig = isInstructor ? instructorSettings : learnerSettings;
  const soundSettingsConfig = isInstructor ? instructorSoundSettings : learnerSoundSettings;

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences', userId, isInstructor],
    queryFn: async () => {
      const prefs = await base44.entities[entityName].filter({ [userIdField]: userId });
      return prefs[0] || null;
    },
    enabled: !!userId
  });

  useEffect(() => {
    if (preferences) {
      setSavedSettings(preferences);
    }
  }, [preferences]);

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ field, value }) => {
      if (preferences) {
        return base44.entities[entityName].update(preferences.id, { [field]: value });
      } else {
        return base44.entities[entityName].create({
          [userIdField]: userId,
          [field]: value
        });
      }
    },
    onSuccess: (_, { field }) => {
      queryClient.invalidateQueries(['notificationPreferences']);
      setRecentlySaved(field);
      setTimeout(() => setRecentlySaved(''), 2000);
    }
  });

  const handleToggle = (field, currentValue) => {
    const newValue = !currentValue;
    setSavedSettings(prev => ({ ...prev, [field]: newValue }));
    updatePreferenceMutation.mutate({ field, value: newValue });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Settings</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Choose which notifications you'd like to receive
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsConfig.map((setting, index) => {
            const isEnabled = savedSettings[setting.id] ?? true;
            const isSaving = updatePreferenceMutation.isPending && updatePreferenceMutation.variables?.field === setting.id;
            const wasSaved = recentlySaved === setting.id;

            return (
              <div key={setting.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor={setting.id} className="text-sm font-medium cursor-pointer">
                      {setting.label}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
                    {wasSaved && <Check className="w-4 h-4 text-emerald-600" />}
                    <Switch
                      id={setting.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(setting.id, isEnabled)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-teal-600" />
            Sound Alerts
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Manage audio notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {soundSettingsConfig.map((setting, index) => {
            const isEnabled = savedSettings[setting.id] ?? (setting.id === 'soundMuteMode' ? false : true);
            const isSaving = updatePreferenceMutation.isPending && updatePreferenceMutation.variables?.field === setting.id;
            const wasSaved = recentlySaved === setting.id;

            return (
              <div key={setting.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor={setting.id} className="text-sm font-medium cursor-pointer">
                      {setting.label}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
                    {wasSaved && <Check className="w-4 h-4 text-emerald-600" />}
                    <Switch
                      id={setting.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(setting.id, isEnabled)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}