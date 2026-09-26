import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, ClipboardCheck, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CalendarSettingsDrawer({ 
  open, 
  onOpenChange, 
  onOpenWorkingHours,
  availabilityMode,
  onAvailabilityModeChange
}) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructorProfile } = useQuery({
    queryKey: ['instructorProfile', user?.id],
    queryFn: async () => {
      const profiles = await base44.entities.Instructor.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.id
  });

  const updateInstructorMutation = useMutation({
    mutationFn: (data) => base44.entities.Instructor.update(instructorProfile.id, data),
    onSuccess: () => queryClient.invalidateQueries(['instructorProfile'])
  });

  // Default is true (approval required) if not explicitly set to false
  const requiresApproval = instructorProfile?.requireBookingApproval !== false;

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

          {/* Mode Toggle */}
          {onAvailabilityModeChange && (
            <div className="flex items-center justify-between px-4 py-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Published slots only</div>
                  <div className="text-xs text-slate-500">
                    {availabilityMode === 'published_slots_only'
                      ? 'Showing published bookable slots'
                      : 'Showing all working hours availability'}
                  </div>
                </div>
              </div>
              <Switch
                checked={availabilityMode === 'published_slots_only'}
                onCheckedChange={(checked) =>
                  onAvailabilityModeChange(checked ? 'published_slots_only' : 'available_by_default')
                }
              />
            </div>
          )}

          {/* Booking Approval Toggle */}
          <div className="flex items-center justify-between px-4 py-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <div className="font-medium text-slate-800">Require booking approval</div>
                <div className="text-xs text-slate-500">
                  {requiresApproval 
                    ? 'All bookings need your manual approval' 
                    : 'Bookings auto-confirm if pupil has sufficient balance'}
                </div>
              </div>
            </div>
            <Switch
              checked={requiresApproval}
              onCheckedChange={(checked) => {
                if (instructorProfile?.id) {
                  updateInstructorMutation.mutate({ requireBookingApproval: checked });
                }
              }}
              disabled={!instructorProfile?.id || updateInstructorMutation.isPending}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}