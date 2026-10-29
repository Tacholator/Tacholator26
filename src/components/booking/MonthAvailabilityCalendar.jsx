import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowLeft, Clock, Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_BADGE_COLORS = {
  available: 'bg-amber-200 text-amber-800',
  reserved_pending_instructor: 'bg-yellow-200 text-yellow-800',
  reserved_pending: 'bg-yellow-200 text-yellow-800',
  confirmed: 'bg-lime-200 text-lime-800',
  completed: 'bg-stone-200 text-stone-700',
};

const STATUS_ROW_COLORS = {
  available: 'bg-amber-50 text-amber-800 border-l-amber-400',
  reserved_pending_instructor: 'bg-yellow-50 text-yellow-700 border-l-yellow-400',
  reserved_pending: 'bg-yellow-50 text-yellow-700 border-l-yellow-400',
  confirmed: 'bg-lime-50 text-lime-700 border-l-lime-400',
  completed: 'bg-stone-50 text-stone-600 border-l-stone-400',
};

function formatLabel(status) {
  const map = {
    available: 'Available',
    reserved_pending_instructor: 'Pending',
    reserved_pending: 'Reserved',
    confirmed: 'Confirmed',
    completed: 'Completed',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function MonthAvailabilityCalendar({
  slotInstances = [],
  bookings = [],
  onSlotClick,
  onBookingClick,
}) {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);

  // Map of 'YYYY-MM-DD' -> [available slot instances] (future, available only)
  const availableByDate = useMemo(() => {
    const now = moment();
    const map = {};
    slotInstances.forEach(s => {
      if (s.status !== 'available') return;
      const start = moment(s.startAtUtc).local();
      if (!start.isAfter(now)) return;
      const key = start.format('YYYY-MM-DD');
      (map[key] = map[key] || []).push(s);
    });
    return map;
  }, [slotInstances]);

  // Map of 'YYYY-MM-DD' -> [pupil bookings]
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const key = moment(b.startAtUtc).local().format('YYYY-MM-DD');
      (map[key] = map[key] || []).push(b);
    });
    return map;
  }, [bookings]);

  // Build Monday-based week grid for the displayed month
  const weeks = useMemo(() => {
    const start = currentDate.clone().startOf('month');
    const gridStart = start.clone().startOf('isoWeek');
    const gridEnd = currentDate.clone().endOf('month').endOf('isoWeek');
    const rows = [];
    let cursor = gridStart.clone();
    while (cursor.isSameOrBefore(gridEnd)) {
      const row = [];
      for (let i = 0; i < 7; i++) {
        row.push(cursor.clone());
        cursor.add(1, 'day');
      }
      rows.push(row);
    }
    return rows;
  }, [currentDate]);

  // Real totals for the displayed month (replaces the old static legend numbers)
  const monthStats = useMemo(() => {
    let availableSlots = 0;
    let daysWithNoSlots = 0;
    let bookingCount = 0;
    const cursor = currentDate.clone().startOf('month');
    const monthEnd = currentDate.clone().endOf('month');
    while (cursor.isSameOrBefore(monthEnd)) {
      const key = cursor.format('YYYY-MM-DD');
      const slots = availableByDate[key]?.length || 0;
      availableSlots += slots;
      if (slots === 0) daysWithNoSlots += 1;
      bookingCount += bookingsByDate[key]?.length || 0;
      cursor.add(1, 'day');
    }
    return { availableSlots, daysWithNoSlots, bookingCount };
  }, [currentDate, availableByDate, bookingsByDate]);

  const selectedKey = selectedDate ? selectedDate.format('YYYY-MM-DD') : null;
  const daySlots = selectedKey ? availableByDate[selectedKey] || [] : [];
  const dayBookings = selectedKey ? bookingsByDate[selectedKey] || [] : [];
  const dayItems = [
    ...daySlots.map(s => ({ ...s, isSlot: true, status: 'available' })),
    ...dayBookings.map(b => ({ ...b, isSlot: false })),
  ].sort((a, b) => moment(a.startAtUtc).diff(moment(b.startAtUtc)));

  const goPrev = () => { setCurrentDate(p => p.clone().subtract(1, 'month')); setSelectedDate(null); };
  const goNext = () => { setCurrentDate(p => p.clone().add(1, 'month')); setSelectedDate(null); };
  const goToday = () => { setCurrentDate(moment()); setSelectedDate(null); };

  // ---- Day detail (list) view ----
  if (selectedDate) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to calendar
          </Button>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 capitalize leading-tight">
              {selectedDate.format('dddd, D MMMM YYYY')}
            </h3>
            <span className="text-xs text-slate-400">
              {dayItems.length} item{dayItems.length !== 1 ? 's' : ''} this day
            </span>
          </div>
        </div>

        {dayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No available slots on this day</p>
            <p className="text-xs text-slate-400 mt-1">Pick another day from the calendar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayItems.map((item, idx) => {
              const startMoment = moment(item.startAtUtc).local();
              const endMoment = moment(item.endAtUtc).local();
              const rowColor = STATUS_ROW_COLORS[item.status] || 'bg-slate-50 text-slate-600 border-l-slate-300';
              const badgeColor = STATUS_BADGE_COLORS[item.status] || 'bg-slate-200 text-slate-600';
              return (
                <div
                  key={item.id || `item-${idx}`}
                  onClick={() => item.isSlot ? onSlotClick?.(startMoment, item) : onBookingClick?.(item)}
                  className={`flex items-center gap-4 p-3 rounded-xl border border-slate-100 border-l-4 ${rowColor} hover:brightness-95 cursor-pointer transition-all`}
                >
                  <div className="flex flex-col items-center justify-center min-w-[55px]">
                    <span className="text-sm font-bold opacity-90">{startMoment.format('HH:mm')}</span>
                    <span className="text-xs opacity-60">{endMoment.format('HH:mm')}</span>
                  </div>
                  <div className="w-px h-10 bg-current opacity-20" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {item.isSlot ? 'Available Slot' : 'Your Lesson'}
                    </span>
                    {item.durationHours && (
                      <span className="text-xs opacity-70">{Math.round(item.durationHours * 10) / 10}h</span>
                    )}
                    {!item.isSlot && item.pickupLocation && (
                      <span className="text-xs opacity-70 truncate block">{item.pickupLocation}</span>
                    )}
                  </div>
                  <Badge className={`shrink-0 text-xs ${badgeColor}`}>{formatLabel(item.status)}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- Month grid view ----
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[140px]">
            <h3 className="text-lg font-semibold text-slate-800 capitalize leading-tight">
              {currentDate.format('MMMM YYYY')}
            </h3>
            <span className="text-xs text-slate-400">Tap a day with available slots</span>
          </div>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="ml-1">
            Today
          </Button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map(day => {
          const key = day.format('YYYY-MM-DD');
          const inMonth = day.isSame(currentDate, 'month');
          const isToday = day.isSame(moment(), 'day');
          const count = inMonth ? (availableByDate[key]?.length || 0) : 0;
          const hasBooking = inMonth && !!(bookingsByDate[key]?.length);
          const hasSlots = count > 0;
          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth || !hasSlots}
              onClick={() => hasSlots && setSelectedDate(day.clone())}
              className={[
                'relative flex flex-col items-center justify-center rounded-lg border min-h-[3.5rem] sm:min-h-[4.5rem] transition-all',
                inMonth ? 'bg-white' : 'bg-slate-50/60',
                hasSlots ? 'hover:border-emerald-400 hover:shadow-sm cursor-pointer' : 'cursor-default',
                isToday ? 'border-[#F7B602] ring-1 ring-[#F7B602]/40' : 'border-slate-100',
                !inMonth && 'opacity-40',
              ].join(' ')}
            >
              <span className={`text-sm font-semibold ${inMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                {day.format('D')}
              </span>
              {inMonth && (
                <span
                  className={[
                    'mt-1 inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold',
                    hasSlots ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
              {hasBooking && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Month totals */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
          {currentDate.format('MMMM YYYY')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-2 text-center">
            <p className="text-lg font-bold leading-tight text-emerald-700">{monthStats.availableSlots}</p>
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Available slots
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
            <p className="text-lg font-bold leading-tight text-slate-500">{monthStats.daysWithNoSlots}</p>
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              Days with no slots
            </p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-2 text-center">
            <p className="text-lg font-bold leading-tight text-blue-700">{monthStats.bookingCount}</p>
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Your bookings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}