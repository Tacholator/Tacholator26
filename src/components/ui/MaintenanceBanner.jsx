import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export default function MaintenanceBanner({ onRetry, onDismiss }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 lg:pl-64">
      <Alert variant="default" className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">Scheduled maintenance</AlertTitle>
        <AlertDescription className="text-amber-800">
          We're doing brief system maintenance. Saving changes is temporarily unavailable. Please try again in a few minutes.
        </AlertDescription>
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            onClick={onRetry}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry now
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDismiss}
            className="border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            <X className="w-3 h-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </Alert>
    </div>
  );
}