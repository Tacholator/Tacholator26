import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import moment from 'moment';

const STATUS_COLORS = {
  available: 'bg-amber-50 text-amber-700',
  reserved_pending_instructor: 'bg-yellow-50 text-yellow-700',
  reserved_pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-lime-50 text-lime-700',
  completed: 'bg-stone-50 text-stone-600',
  cancelled_by_pupil: 'bg-red-50 text-red-700',
  cancelled_late_by_pupil: 'bg-pink-50 text-pink-700',
};

const STATUS_BADGE_COLORS = {
  available: 'bg-amber-200 text-amber-800',
  reserved_pending_instructor: 'bg-yellow-200 text-yellow-800',
  reserved_pending: 'bg-yellow-200 text-yellow-800',
  confirmed: 'bg-lime-200 text-lime-800',
  completed: 'bg-stone-200 text-stone-700',
  cancelled_by_pupil: 'bg-red-200 text-red-800',
  cancelled_late_by_pupil: 'bg-pink-200 text-pink-800',
};

const STATUS_BORDERS = {
  available: 'border-l-amber-400',
  reserved_pending_instructor: 'border-l-yellow-400',
  reserved_pending: 'border-l-yellow-400',
  confirmed: 'border-l-lime-400',
  completed: 'border-l-stone-400',
  cancelled_by_pupil: 'border-l-red-400',
  cancelled_late_by_pupil: 'border-l-pink-400',
};

function formatLabel(status) {
  const map = {
    available: 'Available',
    reserved_pending_instructor: 'Pending',
    reserved_pending: 'Reserved',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled_by_pupil: 'Cancelled',
    cancelled_late_by_pupil: 'Late Cancel',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function LearnerBookingList({
  bookings = [],
  slotInstances = [],
  onSlotClick,
  onBookingClick,
  calendarView = null,
  initialListView = false,
}) {
  const [showListView, setShowListView] = useState(() => {
    try {
      const stored = localStorage.getItem('learner_list_view');
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });
  const [availableOnly, setAvailableOnly] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());

  const merged = useMemo(() => {
    const now = moment();
    const slotItems = slotInstances
      .filter(s => {
        const start = moment(s.startAtUtc);
        if (!start.isAfter(now)) return false;
        if (s.reservedByPupilId && s.status !== 'available') return true;
        return s.status === 'available';
      })
      .map(s => ({
        ...s,
        isSlot: true,
        status: s.status === 'available' ? 'available' : (s.reservedByPupilId ? 'reserved_pending' : s.status),
      }));

    const bookingItems = bookings
      .filter(b => {
        const start = moment(b.startAtUtc);
        if (!start.isAfter(now)) return b.status === 'completed';
        return ['reserved_pending_instructor', 'confirmed'].includes(b.status);
      })
      .map(b => ({ ...b, isSlot: false }));

    return [...slotItems, ...bookingItems].sort((a, b) =>
      moment(a.startAtUtc).diff(moment(b.startAtUtc))
    );
  }, [bookings, slotInstances]);

  const filtered = useMemo(() => {
    if (!availableOnly) return merged;
    return merged.filter(item => item.isSlot && item.status === 'available');
  }, [merged, availableOnly]);

  const toggleList = (checked) => {
    setShowListView(checked);
    try { localStorage.setItem('learner_list_view', String(checked)); } catch {}
  };

  const Controls = (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      <div className="flex items-center gap-2 bg-white rounded-lg border shadow-sm px-3 py-2">
        <span className={`text-sm font-medium ${showListView ? 'text-teal-700' : 'text-slate-600'}`}>List</span>
        <Switch checked={showListView} onCheckedChange={toggleList} />
      </div>
      {showListView && (
        <Button
          variant={availableOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAvailableOnly(prev => !prev)}
          className={availableOnly ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
        >
          <CalendarCheck className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Available</span>
        </Button>
      )}
    </div>
  );

  if (!showListView) {
    return (
      <div>
        {Controls}
        {calendarView}
      </div>
    );
  }

  return (
    <div>
      {Controls}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => prev.clone().subtract(1, 'month'))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[140px]">
              <h3 className="text-lg font-semibold text-slate-800 capitalize leading-tight">
                {currentDate.format('MMMM YYYY')}
              </h3>
              <span className="text-xs text-slate-400">
                {availableOnly ? 'Available Only' : 'All Bookings & Slots'}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => prev.clone().add(1, 'month'))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(moment())} className="ml-1">
              Today
            </Button>
          </div>
          <span className="text-sm text-slate-500">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No available slots found</p>
            <p className="text-xs text-slate-400 mt-1">Available slots for this month will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, idx) => {
              const startMoment = moment(item.startAtUtc).local();
              const endMoment = moment(item.endAtUtc).local();
              const bookingDateKey = startMoment.format('YYYY-MM-DD');
              const prevItem = filtered[idx - 1];
              const prevDateKey = prevItem ? moment(prevItem.startAtUtc).local().format('YYYY-MM-DD') : null;
              const showDateHeader = !prevDateKey || prevDateKey !== bookingDateKey;
              const isToday = startMoment.isSame(moment(), 'day');
              const statusStyle = STATUS_COLORS[item.status] || 'bg-slate-50 text-slate-600';
              const badgeStyle = STATUS_BADGE_COLORS[item.status] || 'bg-slate-200 text-slate-600';
              const borderStyle = STATUS_BORDERS[item.status] || 'border-l-slate-300';
              const statusLabel = formatLabel(item.status);

              return (
                <React.Fragment key={item.id || `item-${idx}`}>
                  {showDateHeader && (
                    <div className="flex items-center gap-3 pt-2 pb-1">
                      <div className="flex flex-col items-center justify-center min-w-[48px]">
                        <span className="text-xs font-bold uppercase text-[#F7B602]">{startMoment.format('ddd')}</span>
                        <span className="text-xl font-bold text-[#071739]">{startMoment.format('DD')}</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                      <span className="text-xs font-medium text-slate-400 uppercase">{startMoment.format('MMMM YYYY')}</span>
                      {isToday && <Badge className="bg-[#F7B602] text-[#071739] text-xs">Today</Badge>}
                    </div>
                  )}
                  <div
                    onClick={() => {
                      if (item.isSlot) {
                        onSlotClick(moment(item.startAtUtc).local(), item);
                      } else {
                        onBookingClick(item);
                      }
                    }}
                    className={`flex items-center gap-4 p-3 rounded-xl border border-slate-100 border-l-4 ${borderStyle} ${statusStyle} hover:brightness-95 cursor-pointer transition-all`}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[56px]">
                      <span className="text-lg font-bold opacity-80">{startMoment.format('DD')}</span>
                      <span className="text-xs opacity-60 uppercase">{startMoment.format('MMM')}</span>
                    </div>
                    <div className="w-px h-10 bg-current opacity-20" />
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
                    <Badge className={`shrink-0 text-xs ${badgeStyle}`}>{statusLabel}</Badge>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}