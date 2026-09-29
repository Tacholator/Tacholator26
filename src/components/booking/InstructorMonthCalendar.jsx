import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Week-view color palette (mirrors Calendar24Hour.jsx so the day detail list
// matches the colors used in the week/day grid view).
const SLOT_COLORS = {
  available: '#F5F5F5',
  available_slot: '#CCFF66',
  confirmed: '#87CEFA',
  confirmed_test: '#D2B48C',
  completed: '#CFCFCF',
  cancelled: '#FFCC80',
  no_show: '#FF8A80',
  reserved_pending: '#B39DDB',
};

const SLOT_BORDER_COLORS = {
  available_slot: '#2E7D32',
  reserved_pending: '#5E35B1',
  confirmed: '#1565C0',
  confirmed_test: '#8B7355',
  completed: '#757575',
  cancelled: '#F57C00',
  no_show: '#D32F2F',
};

const SLOT_ACCENT_COLORS = {
  available_slot: '#1B5E20',
  reserved_pending: '#4527A0',
  confirmed: '#0D47A1',
  confirmed_test: '#6B5840',
  completed: '#616161',
  cancelled: '#E65100',
  no_show: '#C62828',
};

const isDarkColor = (hex) => {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140;
};

// Maps a day-list item (slot or booking) to the same "state" key the week view
// uses to pick its background color.
function getSlotState(item) {
  if (item.isSlot) return 'available_slot';
  const s = item.status;
  if (s === 'reserved_pending_instructor' || s === 'reserved_pending') return 'reserved_pending';
  if (s === 'confirmed' && item.isPracticalTest) return 'confirmed_test';
  if (['confirmed', 'completed', 'cancelled', 'no_show'].includes(s)) return s;
  return null;
}

function formatLabel(status, isPracticalTest) {
  if (isPracticalTest && status === 'confirmed') return 'Test Day';
  const map = {
    available: 'Available',
    reserved_pending_instructor: 'Pending',
    reserved_pending: 'Reserved',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Dedupe bookings sharing the same slot instance (or same pupil+time when no
// slotInstanceId), keeping the most "active" status. Prevents cancelled/declined
// duplicates on the same slot from rendering alongside the active booking.
const BOOKING_STATUS_PRIORITY = {
  completed: 1, in_progress: 2, confirmed: 3, reserved_pending_instructor: 4,
  pending: 5, cancelled_late_by_pupil: 6, cancelled_by_pupil: 7, cancelled: 8,
  declined_by_instructor: 9, no_show: 10,
};
function dedupeBookingsBySlot(list) {
  const keepers = {};
  list.forEach(b => {
    const key = b.slotInstanceId || `${b.pupilId}|${b.startAtUtc}|${b.endAtUtc}`;
    const cur = keepers[key];
    const pNew = BOOKING_STATUS_PRIORITY[b.status] ?? 99;
    const pCur = cur ? (BOOKING_STATUS_PRIORITY[cur.status] ?? 99) : Infinity;
    if (!cur || pNew < pCur || (pNew === pCur && new Date(b.created_date) > new Date(cur.created_date))) {
      keepers[key] = b;
    }
  });
  return Object.values(keepers);
}

export default function InstructorMonthCalendar({
  slotInstances = [],
  bookings = [],
  pupils = [],
  onSlotClick,
  onBookingClick,
  onCreateSlot,
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

  // Map of 'YYYY-MM-DD' -> [bookings] (active only, deduped per slot).
  // Cancelled/declined bookings are excluded so they don't inflate the
  // "Bookings" count — when a slot's booking is cancelled/declined the slot
  // reverts to available, so counting the cancelled booking would double-count
  // the same time slot as both an available slot and a booking.
  const INACTIVE_BOOKING_STATUSES = new Set([
    'cancelled',
    'cancelled_by_pupil',
    'cancelled_late_by_pupil',
    'declined_by_instructor',
    'deleted',
  ]);
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (b.isDeleted || INACTIVE_BOOKING_STATUSES.has(b.status)) return;
      const key = moment(b.startAtUtc).local().format('YYYY-MM-DD');
      (map[key] = map[key] || []).push(b);
    });
    Object.keys(map).forEach(k => { map[k] = dedupeBookingsBySlot(map[k]); });
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

  const pupilName = (booking) => {
    const p = pupils.find(pl => pl.id === booking.pupilId);
    if (!p) return null;
    const last = p.lastName || '';
    return `${p.firstName || ''}${last ? ' ' + last.charAt(0) + '.' : ''}`.trim();
  };

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
          <Button
            size="sm"
            onClick={() => onCreateSlot?.(`${selectedKey}T09:00:00`)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add slot
          </Button>
        </div>

        {dayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">Nothing scheduled this day</p>
            <p className="text-xs text-slate-400 mt-1">Add a slot to make this day bookable.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayItems.map((item, idx) => {
              const startMoment = moment(item.startAtUtc).local();
              const endMoment = moment(item.endAtUtc).local();
              const state = getSlotState(item);
              const bgColor = (state && SLOT_COLORS[state]) || '#F1F5F9';
              const borderColor = (state && SLOT_BORDER_COLORS[state]) || '#CBD5E1';
              const accentColor = (state && SLOT_ACCENT_COLORS[state]) || '#475569';
              const dark = isDarkColor(bgColor);
              const textClass = dark ? 'text-white' : 'text-slate-900';
              const subTextClass = dark ? 'text-slate-100' : 'text-slate-700';
              const name = item.isSlot ? null : pupilName(item);
              return (
                <div
                  key={item.id || `item-${idx}`}
                  onClick={() => item.isSlot ? onSlotClick?.(startMoment, item) : onBookingClick?.(item)}
                  className={`relative flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:brightness-95 cursor-pointer transition-all overflow-hidden ${textClass}`}
                  style={{ backgroundColor: bgColor }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: borderColor }}
                  />
                  <div className="flex flex-col items-center justify-center min-w-[55px]">
                    <span className="text-sm font-bold opacity-90">{startMoment.format('HH:mm')}</span>
                    <span className="text-xs opacity-70">{endMoment.format('HH:mm')}</span>
                  </div>
                  <div className="w-px h-10 bg-current opacity-20" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {item.isSlot ? 'Available Slot' : (name || 'Lesson')}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.durationHours && (
                        <span className={`text-xs opacity-80 ${subTextClass}`}>{Math.round(item.durationHours * 10) / 10}h</span>
                      )}
                      {!item.isSlot && item.pickupLocation && (
                        <span className={`text-xs opacity-80 truncate ${subTextClass}`}>{item.pickupLocation}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className="inline-block px-1.5 py-0.5 text-[11px] font-bold uppercase rounded whitespace-nowrap shrink-0"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    {item.isSlot ? formatLabel('available') : formatLabel(item.status, item.isPracticalTest)}
                  </span>
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
          <div className="text-center min-w-fit px-2">
            <h3 className="text-lg font-semibold text-slate-800 capitalize leading-tight">
              {currentDate.format('MMMM')}
            </h3>
            <span className="text-xs text-slate-400">Tap a day for details</span>
          </div>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
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
          const slotCount = inMonth ? (availableByDate[key]?.length || 0) : 0;
          const dayBookingsCount = inMonth ? (bookingsByDate[key]?.length || 0) : 0;
          const pendingCount = inMonth ? (bookingsByDate[key]?.filter(b => b.status === 'reserved_pending_instructor').length || 0) : 0;
          const hasActivity = inMonth && (slotCount > 0 || dayBookingsCount > 0);
          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth || !hasActivity}
              onClick={() => hasActivity && setSelectedDate(day.clone())}
              className={[
                'relative flex flex-col items-center justify-center rounded-lg border min-h-[3.5rem] sm:min-h-[4.5rem] transition-all',
                inMonth ? 'bg-white' : 'bg-slate-50/60',
                hasActivity ? 'hover:border-emerald-400 hover:shadow-sm cursor-pointer' : 'cursor-default',
                isToday ? 'border-[#F7B602] ring-1 ring-[#F7B602]/40' : 'border-slate-100',
                !inMonth && 'opacity-40',
              ].join(' ')}
            >
              <span className={`text-sm font-semibold ${inMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                {day.format('D')}
              </span>
              {inMonth && (
                <div className="mt-1 flex items-center gap-1">
                  {slotCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white">
                      {slotCount}
                    </span>
                  )}
                  {dayBookingsCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold bg-blue-500 text-white">
                      {dayBookingsCount}
                    </span>
                  )}
                  {slotCount === 0 && dayBookingsCount === 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-400">
                      0
                    </span>
                  )}
                </div>
              )}
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" title={`${pendingCount} pending`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend — real month totals */}
      {(() => {
        const monthKeys = weeks.flat()
          .filter(d => d.isSame(currentDate, 'month'))
          .map(d => d.format('YYYY-MM-DD'));
        const totalSlots = monthKeys.reduce((sum, k) => sum + (availableByDate[k]?.length || 0), 0);
        const totalBookings = monthKeys.reduce((sum, k) => sum + (bookingsByDate[k]?.length || 0), 0);
        const totalPending = monthKeys.reduce((sum, k) =>
          sum + (bookingsByDate[k]?.filter(b => b.status === 'reserved_pending_instructor').length || 0), 0);
        return (
          <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white">{totalSlots}</span>
              <span>Available slots</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold bg-blue-500 text-white">{totalBookings}</span>
              <span>Bookings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded-full text-[11px] font-bold bg-amber-500 text-white">{totalPending}</span>
              <span>Pending request</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}