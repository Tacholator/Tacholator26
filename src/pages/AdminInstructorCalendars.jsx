import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Calendar as CalendarIcon } from 'lucide-react';
import Calendar24Hour from '@/components/booking/Calendar24Hour';
import BookingDetailsModal from '@/components/booking/BookingDetailsModal';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function AdminInstructorCalendars() {
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlotInstance, setSelectedSlotInstance] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allInstructors = [], isLoading: loadingInstructors } = useQuery({
    queryKey: ['allInstructors'],
    queryFn: async () => {
      // Get all users with admin role (instructors)
      const users = await base44.entities.User.filter({ role: 'admin' });
      // Get instructor profiles to get additional info
      const instructorProfiles = await base44.entities.Instructor.list();
      
      // Merge user data with instructor profiles
      return users.map(user => {
        const profile = instructorProfiles.find(p => p.created_by === user.email);
        return {
          id: user.id,
          name: profile?.name || user.full_name || user.email,
          email: user.email,
          instructorProfileId: profile?.id
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['instructorCalendarRules', selectedInstructorId],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: selectedInstructorId }),
    enabled: !!selectedInstructorId
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['instructorBookings', selectedInstructorId],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: selectedInstructorId }),
    enabled: !!selectedInstructorId
  });

  const { data: slotInstances = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['instructorSlotInstances', selectedInstructorId],
    queryFn: () => base44.entities.BookableSlotInstance.filter({ instructorId: selectedInstructorId }),
    enabled: !!selectedInstructorId
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['allPupils', selectedInstructorId],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: selectedInstructorId }),
    enabled: !!selectedInstructorId
  });

  const filteredInstructors = React.useMemo(() => {
    if (!searchQuery.trim()) return allInstructors;
    const query = searchQuery.toLowerCase();
    return allInstructors.filter(i => {
      const name = i.name?.toLowerCase() || '';
      const email = i.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  }, [allInstructors, searchQuery]);

  const selectedInstructor = allInstructors.find(i => i.id === selectedInstructorId);

  const handleBookingClick = (booking, slotInstance) => {
    setSelectedBooking(booking);
    setSelectedSlotInstance(slotInstance);
    setShowBookingModal(true);
  };

  const isLoading = loadingInstructors || (selectedInstructorId && (loadingRules || loadingBookings || loadingSlots));

  // Check if current user is main admin
  const isMainAdmin = user?.email === 'fasobah@gmail.com';

  if (!isMainAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-rose-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Instructor Calendars
          </h1>
          <p className="text-slate-600 mt-2">View and manage instructor bookings</p>
        </div>

        {/* Instructor Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Instructor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an instructor..." />
              </SelectTrigger>
              <SelectContent>
                <div className="max-h-[280px] overflow-y-auto">
                  {loadingInstructors ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : filteredInstructors.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">
                      No instructors found
                    </div>
                  ) : (
                    filteredInstructors.map(instructor => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{instructor.name}</span>
                          <span className="text-xs text-slate-500">{instructor.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {selectedInstructorId && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedInstructor?.name}'s Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <Calendar24Hour
                  viewMode="week"
                  rules={rules}
                  bookings={bookings}
                  slotInstances={slotInstances}
                  availabilityMode="available_by_default"
                  onPendingSlotClick={handleBookingClick}
                  isInstructor={true}
                  pupils={pupils}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <BookingDetailsModal
            open={showBookingModal}
            onOpenChange={setShowBookingModal}
            booking={selectedBooking}
            slotInstance={selectedSlotInstance}
          />
        )}
      </div>
    </div>
  );
}