import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, Coffee, CalendarDays, ClipboardCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CalendarSettingsDrawer({ 
  open, 
  onOpenChange, 
  onOpenWorkingHours,
  onOpenLunch,
  onOpenUnavailable
}) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructorProfile', user?.id],
    queryFn: () => base44.entities.Instructor.filter({ created_by: user.email }),
    enabled: !!user?.email
  });
  const instructor = instructors[0];

  const updateInstructorMutation = useMutation({
    mutationFn: (data) => base44.entities.Instructor.update(instructor.id, data),
    onSuccess: () => queryClient.invalidateQueries(['instructorProfile'])
  });

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

          {/* Booking Approval Toggle */}
          {instructor && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start gap-3 flex-1 mr-3">
                <ClipboardCheck className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Require booking approval</div>
                  <div className="text-xs text-slate-500 mt-0.5">All new bookings will require your manual approval before being confirmed</div>
                </div>
              </div>
              <Switch
                checked={!!instructor.requireBookingApproval}
                onCheckedChange={(checked) => updateInstructorMutation.mutate({ requireBookingApproval: checked })}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}