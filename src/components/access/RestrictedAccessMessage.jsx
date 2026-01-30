import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RestrictedAccessMessage({ pupilStatus }) {
  const getStatusMessage = () => {
    switch (pupilStatus) {
      case 'OnHold':
        return 'Your account is currently on hold. Please contact your instructor to reactivate access.';
      case 'Passed':
        return 'Congratulations on passing! This feature is only available for active learners.';
      case 'Stopped':
        return 'Welcome! This feature will be available once your instructor activates your account.';
      default:
        return 'This feature is only available for active learners.';
    }
  };

  const getStatusLabel = () => {
    switch (pupilStatus) {
      case 'OnHold':
        return 'On Hold';
      case 'Passed':
        return 'Passed';
      case 'Stopped':
        return 'New Intake';
      default:
        return 'Restricted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardContent className="pt-12 pb-8 px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Access Restricted</h2>
          <div className="mb-4">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-medium text-sm">
              Account Status: {getStatusLabel()}
            </span>
          </div>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {getStatusMessage()}
          </p>
          <div className="space-y-3">
            <Link to={createPageUrl('LearnerDashboard')}>
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                Back to Dashboard
              </Button>
            </Link>
            <Link to={createPageUrl('LearnerChats')}>
              <Button variant="outline" className="w-full gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact Instructor
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}