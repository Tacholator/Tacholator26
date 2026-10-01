import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, Clock, MapPin, User, Calendar } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BookingDetailsModal from '@/components/booking/BookingDetailsModal';

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  reserved_pending_instructor: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-rose-100 text-rose-700',
  cancelled_by_pupil: 'bg-rose-100 text-rose-700',
  cancelled_late_by_pupil: 'bg-rose-100 text-rose-700',
  declined_by_instructor: 'bg-rose-100 text-rose-700',
  no_show: 'bg-rose-100 text-rose-700',
  deleted: 'bg-slate-100 text-slate-400',
};

function formatStatusLabel(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function InstructorSchedule() {
  const [viewMode, setViewMode] = useState('day');
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['lessonBookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: user.id }),
    enabled: !!user?.id,
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils', user?.email],
    queryFn: () => base44.entities.Pupil.filter({ instructorEmail: user.email }),
    enabled: !!user?.email,
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['scheduleCalendarEvents', user?.id],
    queryFn: () => base44.entities.CalendarEvent.filter({ instructorId: user.id }),
    enabled: !!user?.id,
  });

  const bookings = useMemo(
    () => allBookings.filter(b => !b.isDeleted),
    [allBookings]
  );

  const pupilMap = useMemo(() => {
    const map = {};
    pupils.forEach(p => { map[p.id] = p; });
    return map;
  }, [pupils]);

  // Compute the date range based on view mode
  const { rangeStart, rangeEnd, periodLabel } = useMemo(() => {
    let start, end, label;
    if (viewMode === 'day') {
      start = moment(currentDate).startOf('day');
      end = moment(currentDate).endOf('day');
      label = start.format('dddd, D MMMM YYYY');
    } else if (viewMode === 'week') {
      start = moment(currentDate).startOf('isoWeek');
      end = moment(currentDate).endOf('isoWeek');
      label = `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`;
    } else {
      start = moment(currentDate).startOf('month');
      end = moment(currentDate).endOf('month');
      label = start.format('MMMM YYYY');
    }
    return { rangeStart: start, rangeEnd: end, periodLabel: label };
  }, [viewMode, currentDate]);

  // Group bookings and personal events by date
  const groupedBookings = useMemo(() => {
    const lessonItems = bookings.map(b => ({ kind: 'lesson', startAtUtc: b.startAtUtc, endAtUtc: b.endAtUtc, raw: b }));
    const eventItems = calendarEvents.map(e => ({ kind: 'event', startAtUtc: e.startAtUtc, endAtUtc: e.endAtUtc, raw: e }));
    const all = [...lessonItems, ...eventItems];

    const filtered = all.filter(item => {
      if (!item.startAtUtc) return false;
      const d = moment(item.startAtUtc);
      if (!d.isValid()) return false;
      return d.isBetween(rangeStart, rangeEnd, null, '[]');
    });

    const sorted = filtered.sort((a, b) => new Date(a.startAtUtc) - new Date(b.startAtUtc));

    const groups = {};
    sorted.forEach(item => {
      const dateKey = moment(item.startAtUtc).format('YYYY-MM-DD');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([dateKey, items]) => ({
      dateKey,
      dateLabel: moment(dateKey).format('dddd, D MMMM'),
      items,
    }));
  }, [bookings, calendarEvents, rangeStart, rangeEnd]);

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(moment(currentDate).subtract(1, 'day'));
    else if (viewMode === 'week') setCurrentDate(moment(currentDate).subtract(1, 'week'));
    else setCurrentDate(moment(currentDate).subtract(1, 'month'));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(moment(currentDate).add(1, 'day'));
    else if (viewMode === 'week') setCurrentDate(moment(currentDate).add(1, 'week'));
    else setCurrentDate(moment(currentDate).add(1, 'month'));
  };

  const handleToday = () => setCurrentDate(moment());

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const isToday = moment().isBetween(rangeStart, rangeEnd, null, '[]');

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#071739]">Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your upcoming and past lessons</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-sky-500 hover:bg-sky-600 text-white">
            <Link to={createPageUrl('Calendar')}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Calendar
            </Link>
          </Button>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === opt.value
                    ? 'bg-white text-[#071739] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{periodLabel}</span>
        </div>
      </div>

      {/* Content */}
      {bookingsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : groupedBookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No lessons scheduled</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no lessons in this {viewMode === 'day' ? 'day' : viewMode === 'week' ? 'week' : 'month'}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedBookings.map(group => {
            const groupDate = moment(group.dateKey);
            const isDateToday = groupDate.isSame(moment(), 'day');
            const isPast = groupDate.isBefore(moment(), 'day');

            return (
              <div key={group.dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-sm font-semibold ${isPast ? 'text-slate-400' : 'text-[#071739]'}`}>
                    {group.dateLabel}
                  </h3>
                  {isDateToday && (
                    <Badge className="bg-[#F7B602] text-[#071739] text-xs">Today</Badge>
                  )}
                  <span className="text-xs text-slate-400">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>

                {/* Schedule items */}
                <div className="space-y-2">
                  {group.items.map(item => {
                    if (item.kind === 'event') {
                      const ev = item.raw;
                      const startMoment = moment(ev.startAtUtc).local();
                      const endMoment = moment(ev.endAtUtc).local();
                      const color = ev.color || '#6366f1';
                      return (
                        <Card
                          key={`event-${ev.id}`}
                          className="transition-colors"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <CardContent className="flex items-center gap-4 p-3">
                            <div className="flex flex-col items-center justify-center min-w-[60px]">
                              <span className="text-lg font-bold text-[#071739]">
                                {startMoment.format('HH:mm')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {endMoment.format('HH:mm')}
                              </span>
                            </div>
                            <div className="w-px h-10 bg-slate-100" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[#071739] truncate block">
                                {ev.title || 'Personal event'}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {ev.durationMinutes ? `${(ev.durationMinutes / 60).toFixed(1)}h` : ''}
                                </span>
                              </div>
                            </div>
                            <Badge className="shrink-0 text-xs bg-yellow-100 text-yellow-800">Personal</Badge>
                          </CardContent>
                        </Card>
                      );
                    }

                    const booking = item.raw;
                    const pupil = pupilMap[booking.pupilId];
                    const startMoment = moment(booking.startAtUtc).local();
                    const endMoment = moment(booking.endAtUtc).local();
                    const statusStyle = STATUS_STYLES[booking.status] || 'bg-slate-100 text-slate-600';

                    return (
                      <Card
                        key={`lesson-${booking.id}`}
                        className="cursor-pointer hover:border-[#F7B602] transition-colors"
                        onClick={() => openBookingDetails(booking)}
                      >
                        <CardContent className="flex items-center gap-4 p-3">
                          {/* Time block */}
                          <div className="flex flex-col items-center justify-center min-w-[60px]">
                            <span className="text-lg font-bold text-[#071739]">
                              {startMoment.format('HH:mm')}
                            </span>
                            <span className="text-xs text-slate-400">
                              {endMoment.format('HH:mm')}
                            </span>
                          </div>

                          {/* Vertical divider */}
                          <div className="w-px h-10 bg-slate-100" />

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-sm font-medium text-[#071739] truncate">
                                {pupil ? `${pupil.firstName} ${pupil.lastName}` : 'Unknown pupil'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {booking.durationHours}h
                                </span>
                              </div>
                              {booking.pickupLocation && (
                                <div className="flex items-center gap-1 min-w-0">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="text-xs text-slate-500 truncate">
                                    {booking.pickupLocation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Type badge */}
                          <Badge className={`shrink-0 text-xs ${booking.isPracticalTest ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {booking.isPracticalTest ? 'Driving Test' : 'Lessons'}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          open={showBookingDetails}
          onOpenChange={setShowBookingDetails}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}