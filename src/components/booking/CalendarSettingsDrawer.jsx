import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Coffee, CalendarDays } from 'lucide-react';

export default function CalendarSettingsDrawer({ 
  open, 
  onOpenChange, 
  onOpenWorkingHours,
  onOpenLunch,
  onOpenUnavailable
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Calendar Settings</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              onOpenWorkingHours();
            }}
            className="w-full justify-start gap-3 h-auto py-4"
            variant="outline"
          >
            <Clock className="w-5 h-5 text-teal-600" />
            <div className="text-left">
              <div className="font-medium">Working Hours</div>
              <div className="text-xs text-slate-500">Set your weekly availability</div>
            </div>
          </Button>

          <Button
            onClick={() => {
              onOpenChange(false);
              onOpenLunch();
            }}
            className="w-full justify-start gap-3 h-auto py-4"
            variant="outline"
          >
            <Coffee className="w-5 h-5 text-orange-600" />
            <div className="text-left">
              <div className="font-medium">Lunch Breaks</div>
              <div className="text-xs text-slate-500">Block time for lunch</div>
            </div>
          </Button>

          <Button
            onClick={() => {
              onOpenChange(false);
              onOpenUnavailable();
            }}
            className="w-full justify-start gap-3 h-auto py-4"
            variant="outline"
          >
            <CalendarDays className="w-5 h-5 text-slate-600" />
            <div className="text-left">
              <div className="font-medium">Unavailable Time</div>
              <div className="text-xs text-slate-500">Block specific times</div>
            </div>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}