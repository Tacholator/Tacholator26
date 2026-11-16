import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';

const SLOT_COLORS = {
  available: '#F5F5F5',
  available_slot: '#CCFF66',
  confirmed: '#87CEFA',
  confirmed_test: '#D2B48C',
  completed: '#CFCFCF',
  cancelled: '#FFCC80',
  no_show: '#FF8A80',
  unavailable: '#FFB3B3',
  closed: '#E2F35E',
  outside_working_hours: '#E8E8E8',
  reserved_pending: '#B39DDB',
  reserved_confirmed_other: '#F2F2F2'
};

const isDarkColor = (hex) => {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

const ruleMatchesDate = (rule, day) => {
  const dayOfWeek = day.format('ddd').toLowerCase();
  const dateStr = day.format('YYYY-MM-DD');
  if (rule.isRecurring === false && rule.specificDate) {
    return dateStr === rule.specificDate;
  }
  if (!rule.daysOfWeek || !rule.daysOfWeek.includes(dayOfWeek)) return false;
  if (rule.excludeDates && rule.excludeDates.includes(dateStr)) return false;
  if (rule.startDate && day.isBefore(moment(rule.startDate), 'day')) return false;
  if (rule.endDate && day.isAfter(moment(rule.endDate), 'day')) return false;
  return true;
};

const ROW_PX = 22.5;

const CANCELLED_STATUSES = [
  'cancelled',
  'cancelled_by_pupil',
  'cancelled_late_by_pupil',
  'cancelled_by_instructor',
  'declined_by_instructor'
];

export default function Calendar24Hour({
  viewMode = 'week',
  onViewModeChange,
  rules = [],
  bookings = [],
  slotInstances = [],
  availabilityMode = 'available_by_default',
  onSlotClick,
  onPendingSlotClick,
  onDeleteBooking,
  onPersonalEventClick,
  isInstructor = false,
  currentPupilId = null,
  pupils = [],
  personalEvents = [],
  syncedDate
}) {
  const [currentDateStr, setCurrentDateStr] = useState(() => moment().format('YYYY-MM-DD'));
  const currentDate = moment(currentDateStr, 'YYYY-MM-DD');

  const syncedMonthKey = syncedDate ? syncedDate.format('YYYY-MM') : '';
  useEffect(() => {
    if (syncedDate) {
      const target = syncedDate.isSame(moment(), 'month')
        ? moment()
        : syncedDate.clone().startOf('month');
      setCurrentDateStr(target.format('YYYY-MM-DD'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedMonthKey]);

  const getDaysInView = () => {
    if (viewMode === 'day') return [currentDate];
    const startOfWeek = currentDate.clone().startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));
  };

  const getTimeSlots = () => {
    const workingHoursRules = rules.filter(r => r.ruleType === 'working_hours');
    let earliestStart = 24;
    let latestEnd = 0;
    if (workingHoursRules.length === 0) {
      earliestStart = 7;
      latestEnd = 20;
    } else {
      workingHoursRules.forEach(rule => {
        const startHour = parseInt(rule.startTimeLocal.split(':')[0]);
        const endHour = parseInt(rule.endTimeLocal.split(':')[0]);
        const endMinute = parseInt(rule.endTimeLocal.split(':')[1]);
        if (startHour < earliestStart) earliestStart = startHour;
        if (endHour > latestEnd || (endHour === latestEnd && endMinute > 0)) {
          latestEnd = endMinute > 0 ? endHour + 1 : endHour;
        }
      });
    }
    personalEvents.forEach(ev => {
      const s = moment(ev.startAtUtc).local();
      const e = moment(ev.endAtUtc).local();
      const startHour = parseInt(s.format('HH'));
      const endHour = parseInt(e.format('HH'));
      const endMinute = parseInt(e.format('mm'));
      if (startHour < earliestStart) earliestStart = startHour;
      if (endHour > latestEnd || (endHour === latestEnd && endMinute > 0)) {
        latestEnd = endMinute > 0 ? endHour + 1 : endHour;
      }
    });
    const slots = [];
    for (let hour = earliestStart; hour < latestEnd; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:15`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
      slots.push(`${hour.toString().padStart(2, '0')}:45`);
    }
    return slots;
  };

  const days = getDaysInView();
  const timeSlots = getTimeSlots();

  // Background cell state: 'available' | 'outside_working_hours'
  const getBackgroundState = (day, timeSlot) => {
    const dayOfWeek = day.format('ddd').toLowerCase();
    const slotStart = moment(timeSlot, 'HH:mm');

    // Closed rules (for non-instructors these read as outside working hours)
    const closedRules = rules.filter(r => r.ruleType === 'closed');
    for (const closedRule of closedRules) {
      if (!ruleMatchesDate(closedRule, day)) continue;
      const cs = moment(closedRule.startTimeLocal, 'HH:mm');
      const ce = moment(closedRule.endTimeLocal, 'HH:mm');
      if (slotStart.isSameOrAfter(cs) && slotStart.isBefore(ce)) {
        return 'outside_working_hours';
      }
    }

    const workingHoursRule = rules.find(r =>
      r.ruleType === 'working_hours' && r.daysOfWeek.includes(dayOfWeek)
    );
    if (!workingHoursRule) return 'outside_working_hours';
    const we = moment(workingHoursRule.endTimeLocal, 'HH:mm');
    const rs = moment(workingHoursRule.startTimeLocal, 'HH:mm');
    if (slotStart.isBefore(rs) || slotStart.isSameOrAfter(we)) return 'outside_working_hours';
    return 'available';
  };

  // Unified lane-packing of ALL foreground blocks (bookings, slot instances,
  // personal events, unavailable/closed rules) per day. Overlapping blocks of
  // any kind land in different lanes so they render side by side.
  const blocksByDay = useMemo(() => {
    // Minutes-from-midnight of the first visible time slot (timeSlots[0] is
    // like "07:00"). Block positions are measured relative to this offset.
    const offsetMin = timeSlots.length
      ? (() => { const [h, m] = timeSlots[0].split(':').map(Number); return h * 60 + m; })()
      : 0;
    const map = {};
    days.forEach(day => {
      const dayKey = day.format('YYYY-MM-DD');
      const dayStart = day.clone().startOf('day');
      const blocks = [];

      const pushBlock = (startMoment, endMoment, data) => {
        if (!startMoment || !endMoment || !endMoment.isAfter(startMoment)) return;
        // timeSlots starts at the working-hours earliest hour (e.g. 07:00), not
        // midnight — so slot indices must be measured from that offset, not from
        // 00:00, otherwise afternoon blocks get dropped by the window guard.
        const startMin = startMoment.diff(dayStart, 'minutes');
        const endMin = endMoment.diff(dayStart, 'minutes');
        const windowEnd = offsetMin + timeSlots.length * 15;
        if (endMin <= offsetMin || startMin >= windowEnd) return;
        const startSlot = Math.max(0, Math.floor((startMin - offsetMin) / 15));
        const span = Math.max(1, Math.min(Math.ceil((endMin - offsetMin) / 15) - startSlot, timeSlots.length - startSlot));
        blocks.push({ startSlot, span, startMoment, endMoment, ...data });
      };

      // Bookings
      bookings.forEach(b => {
        if (b.isDeleted || b.status === 'deleted') return;
        const bs = moment(b.startAtUtc).local();
        const be = moment(b.endAtUtc).local();
        if (!bs.isSame(day, 'day') && !be.isSame(day, 'day')) {
          // spans across day — only if overlaps this day
          if (!(bs.isBefore(day.clone().endOf('day')) && be.isAfter(dayStart))) return;
        }
        let state = 'reserved_pending';
        if (b.status === 'completed') state = 'completed';
        // Every cancellation flavour (by pupil, late by pupil, by instructor,
        // declined) must render as cancelled — never as a pending lesson.
        else if (CANCELLED_STATUSES.includes(b.status)) state = 'cancelled';
        else if (b.status === 'no_show') state = 'no_show';
        else if (b.status === 'confirmed') state = b.isPracticalTest ? 'confirmed_test' : 'confirmed';
        else if (b.status === 'reserved_pending_instructor') state = 'reserved_pending';
        pushBlock(bs, be, { kind: 'booking', booking: b, state });
      });

      // Slot instances — only render slots that are NOT already represented by
      // a booking block. A slot with status 'confirmed' or 'reserved_pending'
      // has a corresponding LessonBooking that renders in its place, so drawing
      // both would make them overlap and split into side-by-side columns.
      slotInstances.forEach(si => {
        if (si.status !== 'available' && si.status !== 'blocked') return;
        const bs = moment(si.startAtUtc).local();
        const be = moment(si.endAtUtc).local();
        if (!bs.isSame(day, 'day') && !(bs.isBefore(day.clone().endOf('day')) && be.isAfter(dayStart))) return;
        const state = si.status === 'blocked' ? 'unavailable' : 'available';
        pushBlock(bs, be, { kind: 'slot', slotInstance: si, state });
      });

      // Personal events (expanded by recurrence)
      personalEvents.forEach(ev => {
        const evStart = moment(ev.startAtUtc).local();
        let occurs = false;
        if (ev.repeatType === 'daily') occurs = evStart.isSameOrBefore(day, 'day');
        else if (ev.repeatType === 'weekly') occurs = evStart.isSameOrBefore(day, 'day') && evStart.day() === day.day();
        else occurs = evStart.isSame(day, 'day');
        if (!occurs) return;
        const startMoment = day.clone().hour(evStart.hour()).minute(evStart.minute()).second(0).millisecond(0);
        const durMin = moment(ev.endAtUtc).local().diff(evStart, 'minutes');
        const endMoment = startMoment.clone().add(durMin, 'minutes');
        pushBlock(startMoment, endMoment, { kind: 'personal', ev, state: 'personal', startStr: startMoment.format('HH:mm'), endStr: endMoment.format('HH:mm') });
      });

      // Unavailable / closed / lunch rules
      rules.forEach(rule => {
        if (!ruleMatchesDate(rule, day)) return;
        if (rule.ruleType !== 'unavailable' && rule.ruleType !== 'closed' && rule.ruleType !== 'lunch_break') return;
        if (!rule.startTimeLocal || !rule.endTimeLocal) return;
        const rs = day.clone().hour(parseInt(rule.startTimeLocal.split(':')[0])).minute(parseInt(rule.startTimeLocal.split(':')[1])).second(0);
        const re = day.clone().hour(parseInt(rule.endTimeLocal.split(':')[0])).minute(parseInt(rule.endTimeLocal.split(':')[1])).second(0);
        pushBlock(rs, re, { kind: 'rule', rule, state: rule.ruleType === 'closed' ? 'closed' : 'unavailable' });
      });

      // Greedy lane packing — assign each block to the first lane whose end is
      // <= the block's start. This gives a valid lane index per block.
      blocks.sort((a, b) => a.startSlot - b.startSlot || b.span - a.span);
      const laneEnds = [];
      blocks.forEach(bl => {
        let lane = laneEnds.findIndex(end => bl.startSlot >= end);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(bl.startSlot + bl.span); }
        else laneEnds[lane] = bl.startSlot + bl.span;
        bl.lane = lane;
      });

      // Side-by-side splitting must apply ONLY to blocks that actually overlap.
      // Group blocks into connected overlap clusters; each block's column count
      // is the number of lanes used inside its own cluster (1 if none overlap).
      const n = blocks.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
      const overlap = (a, b) => a.startSlot < b.startSlot + b.span && b.startSlot < a.startSlot + a.span;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (overlap(blocks[i], blocks[j])) union(i, j);
        }
      }
      const groups = {};
      for (let i = 0; i < n; i++) { const r = find(i); (groups[r] = groups[r] || []).push(i); }
      Object.values(groups).forEach(idxs => {
        const cols = idxs.reduce((m, i) => Math.max(m, blocks[i].lane + 1), 1);
        idxs.forEach(i => { blocks[i].colCount = cols; });
      });
      blocks.forEach(bl => { if (!bl.colCount) bl.colCount = 1; });

      map[dayKey] = { blocks };
    });
    return map;
  }, [days, bookings, slotInstances, personalEvents, rules, timeSlots]);

  const isSlotClickable = (block) => {
    const { kind, booking, slotInstance, state, ev } = block;
    if (kind === 'personal' && onPersonalEventClick) return true;
    if (kind === 'rule') return false;
    if (isInstructor) {
      if (booking) return true;
      if (kind === 'slot' && state === 'available') return true;
      return false;
    }
    // pupil
    if (kind === 'slot' && state === 'available' && slotInstance) return true;
    const isOwn = booking && booking.pupilId === currentPupilId;
    if (booking && (state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test') && isOwn) return true;
    return false;
  };

  const handleBlockClick = (block, day) => {
    if (!isSlotClickable(block)) return;
    const { kind, booking, slotInstance, ev } = block;
    if (kind === 'personal' && onPersonalEventClick) {
      onPersonalEventClick(ev);
      return;
    }
    if (booking) {
      onPendingSlotClick && onPendingSlotClick(booking, slotInstance);
    } else if (kind === 'slot') {
      const slotDateTime = `${day.format('YYYY-MM-DD')}T${block.startMoment.format('HH:mm')}:00`;
      onSlotClick && onSlotClick(slotDateTime, slotInstance);
    }
  };

  const handleBackgroundClick = (day, timeSlot) => {
    if (!onSlotClick) return;
    if (isInstructor) {
      onSlotClick(`${day.format('YYYY-MM-DD')}T${timeSlot}:00`, 'available');
    } else {
      // pupils click explicit available slot cards, not background
    }
  };

  const statusLabels = {
    available: 'Available',
    reserved_pending: 'Pending',
    confirmed: 'Confirmed',
    confirmed_test: 'Test Day',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    unavailable: 'Unavailable',
    closed: 'Closed',
    personal: 'Personal'
  };

  const borderColors = {
    available: '#2E7D32', reserved_pending: '#5E35B1', confirmed: '#1565C0',
    confirmed_test: '#8B7355', completed: '#757575', cancelled: '#F57C00',
    no_show: '#D32F2F', unavailable: '#D32F2F', closed: '#8B9A0A', personal: '#475569'
  };
  const accentColors = {
    available: '#1B5E20', reserved_pending: '#4527A0', confirmed: '#0D47A1',
    confirmed_test: '#6B5840', completed: '#616161', cancelled: '#E65100',
    no_show: '#C62828', unavailable: '#C62828', closed: '#6B7A08', personal: '#334155'
  };

  const renderBlock = (block, day) => {
    const { kind, booking, slotInstance, ev, rule, state, startSlot, span, lane, colCount } = block;
    const top = startSlot * ROW_PX;
    const height = span * ROW_PX;
    const cols = colCount || 1;
    const sideBySide = cols > 1;
    const widthPct = sideBySide ? 100 / cols : 100;
    const leftPct = sideBySide ? lane * (100 / cols) : 0;

    const isOwnBooking = !isInstructor && booking && booking.pupilId === currentPupilId;
    const isOthersReserved = !isInstructor && (state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test') && !isOwnBooking;
    const isAvailableSlotCard = kind === 'slot' && state === 'available';
    const personalBg = kind === 'personal' ? (ev?.color || SLOT_COLORS.available) : null;
    const displayColor = isOthersReserved
      ? SLOT_COLORS.reserved_confirmed_other
      : (personalBg || (isAvailableSlotCard ? SLOT_COLORS.available_slot : SLOT_COLORS[state]));
    const cancelledLabel = booking?.status === 'cancelled_by_pupil' || booking?.status === 'cancelled_late_by_pupil'
      ? 'Cancelled by pupil'
      : booking?.status === 'declined_by_instructor'
        ? 'Declined'
        : 'Cancelled';
    const displayLabel = isOthersReserved && (state === 'confirmed' || state === 'confirmed_test')
      ? 'Unavailable'
      : state === 'cancelled'
        ? cancelledLabel
        : statusLabels[state];

    let pupilName = null;
    if (isInstructor && booking && (state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test' || state === 'completed' || state === 'cancelled' || state === 'no_show')) {
      const pupil = pupils.find(p => p.id === booking.pupilId);
      if (pupil) {
        const ln = pupil.lastName || '';
        pupilName = `${pupil.firstName}${ln ? ' ' + ln.charAt(0) + '.' : ''}`;
      }
    }

    const clickable = isSlotClickable(block);
    const blockStartTime = block.startMoment.format('HH:mm');
    const blockEndTime = block.endMoment.format('HH:mm');

    const personalDark = kind === 'personal' && isDarkColor(personalBg);
    const personalTextClass = personalDark ? 'text-white' : 'text-slate-900';
    const personalTimeClass = personalDark ? 'text-slate-100' : 'text-slate-800';
    const personalBadgeBg = personalDark ? 'rgba(255,255,255,0.25)' : '#E2E8F0';
    const personalBadgeText = personalDark ? '#ffffff' : '#334155';

    return (
      <div
        key={`${kind}-${booking?.id || slotInstance?.id || ev?.id || rule?.id}-${startSlot}`}
        onClick={() => handleBlockClick(block, day)}
        className={`absolute ${clickable ? 'cursor-pointer group' : isOthersReserved ? 'cursor-not-allowed' : 'cursor-default'}`}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          width: `calc(${widthPct}% - 4px)`,
          left: `calc(${leftPct}% + 2px)`,
          padding: '2px',
          zIndex: 2,
        }}
      >
        <div
          className={`relative rounded-md border-2 overflow-hidden h-full ${clickable ? 'group-hover:shadow-md transition-shadow' : ''}`}
          style={{
            borderColor: isOthersReserved ? '#E0E0E0' : (kind === 'personal' ? '#475569' : borderColors[state]),
            backgroundColor: displayColor,
            minWidth: 0
          }}
        >
          {isOthersReserved && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, #D9D9D9 8px, #D9D9D9 10px)`,
              opacity: 0.7
            }} />
          )}
          {!isOthersReserved && (
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: kind === 'personal' ? '#334155' : accentColors[state] }} />
          )}
          <div className={`${isOthersReserved ? 'pl-1 sm:pl-2' : 'pl-1.5 sm:pl-3'} pr-1 sm:pr-2 py-1 h-full flex flex-col justify-center relative z-10 overflow-hidden min-w-0`}>
            {pupilName && (
              <div className="text-[10px] sm:text-sm font-bold text-slate-900 mb-0.5 truncate w-full" title={pupilName}>{pupilName}</div>
            )}
            {kind === 'personal' && ev?.title && (
              <div className={`text-[10px] sm:text-sm font-bold ${personalTextClass} mb-0.5 truncate w-full`} title={ev.title}>{ev.title}</div>
            )}
            <div className={`text-[10px] sm:text-xs font-semibold ${isOthersReserved ? 'text-slate-400' : (kind === 'personal' ? personalTimeClass : 'text-slate-800')} truncate`}>
              {blockStartTime} - {blockEndTime}
            </div>
            {state === 'confirmed_test' && booking?.practicalTestTime && (
              <div className="text-[9px] sm:text-[11px] font-semibold text-slate-800 mt-0.5 truncate">Test: {booking.practicalTestTime}</div>
            )}
            <div className="mt-0.5 sm:mt-1">
              <span className="inline-block px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold uppercase rounded whitespace-nowrap"
                style={{
                  backgroundColor: kind === 'personal' ? personalBadgeBg : (isOthersReserved ? '#E0E0E0' : `${accentColors[state]}20`),
                  color: kind === 'personal' ? personalBadgeText : (isOthersReserved ? '#999999' : accentColors[state])
                }}>
                {displayLabel}
              </span>
            </div>
          </div>
          {clickable && !isOthersReserved && (
            <div className="absolute inset-0 rounded-md border-2 border-transparent group-hover:border-[#2E7D32] pointer-events-none transition-colors" />
          )}
        </div>
      </div>
    );
  };

  const handlePrevious = () => setCurrentDateStr(currentDate.clone().subtract(viewMode === 'day' ? 1 : 7, 'days').format('YYYY-MM-DD'));
  const handleNext = () => setCurrentDateStr(currentDate.clone().add(viewMode === 'day' ? 1 : 7, 'days').format('YYYY-MM-DD'));
  const handleToday = () => { setCurrentDateStr(moment().format('YYYY-MM-DD')); onViewModeChange && onViewModeChange('day'); };

  const totalHeight = timeSlots.length * ROW_PX;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button onClick={handlePrevious} variant="outline" size="sm" className="px-2 sm:px-3"><ChevronLeft className="w-4 h-4" /></Button>
          <h3 className="text-xs sm:text-lg font-semibold text-slate-700 text-center whitespace-nowrap min-w-[110px] sm:min-w-[150px]">
            {viewMode === 'day' ? currentDate.format('ddd, D MMM YYYY') : `${days[0].format('D MMM')} – ${days[6].format('D MMM')}`}
          </h3>
          <Button onClick={handleNext} variant="outline" size="sm" className="px-2 sm:px-3"><ChevronRight className="w-4 h-4" /></Button>
          {onViewModeChange && (
            <div className="flex rounded-md border overflow-hidden">
              <button onClick={() => onViewModeChange('day')} className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Day</button>
              <button onClick={() => onViewModeChange('week')} className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors border-l ${viewMode === 'week' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Week</button>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header */}
          <div className="flex border-b bg-slate-50">
            <div className="w-[50px] shrink-0 p-1 sm:p-2 border-r font-semibold text-[10px] sm:text-sm text-slate-600 flex items-center justify-center">Time</div>
            {days.map((day, idx) => (
              <div key={idx} className="p-1 sm:p-2 text-center border-r last:border-r-0" style={{ minWidth: 90, flex: 1 }}>
                <div className="font-semibold text-slate-700 text-[10px] sm:text-sm">{day.format('ddd')}</div>
                <div className="text-[9px] sm:text-xs text-slate-500">{day.format('D MMM')}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex">
            {/* Time labels column */}
            <div className="w-[50px] shrink-0 border-r bg-slate-50">
              {timeSlots.map((t, i) => (
                <div key={i} className="text-[9px] sm:text-xs text-slate-600 font-medium flex items-center justify-center border-b" style={{ height: ROW_PX }}>{t}</div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIdx) => {
              const dayKey = day.format('YYYY-MM-DD');
              const { blocks } = blocksByDay[dayKey] || { blocks: [] };
              return (
                <div key={dayIdx} className="relative border-r last:border-r-0" style={{ minWidth: 90, flex: 1, height: totalHeight }}>
                  {/* Background grid cells */}
                  {timeSlots.map((t, i) => {
                    const bg = getBackgroundState(day, t);
                    const bgClick = bg === 'available';
                    return (
                      <div
                        key={i}
                        onClick={() => bgClick && handleBackgroundClick(day, t)}
                        className={`border-b ${bgClick && isInstructor ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{ height: ROW_PX, backgroundColor: SLOT_COLORS[bg] }}
                      />
                    );
                  })}
                  {/* Foreground blocks (absolute, lane-packed) */}
                  {blocks.map(bl => renderBlock(bl, day))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}