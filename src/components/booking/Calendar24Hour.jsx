import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  // Light grey for others viewing pending/confirmed
  reserved_confirmed_other: '#F2F2F2'
};

// Checks whether a rule applies to a given calendar day
// Returns true when a hex background is dark enough to need light text
const isDarkColor = (hex) => {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance (Rec. 601)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140;
};

// Checks whether a rule applies to a given calendar day
const ruleMatchesDate = (rule, day) => {
  const dayOfWeek = day.format('ddd').toLowerCase();
  const dateStr = day.format('YYYY-MM-DD');

  // One-time closure: match exact date
  if (rule.isRecurring === false && rule.specificDate) {
    return dateStr === rule.specificDate;
  }

  // Recurring rule: match by day of week
  if (!rule.daysOfWeek || !rule.daysOfWeek.includes(dayOfWeek)) return false;
  if (rule.excludeDates && rule.excludeDates.includes(dateStr)) return false;
  if (rule.startDate && day.isBefore(moment(rule.startDate), 'day')) return false;
  if (rule.endDate && day.isAfter(moment(rule.endDate), 'day')) return false;
  return true;
};

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

  // When the parent month changes (via the top month/year slider), jump to the
  // current week if it's today's month, otherwise the first week of that month
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
    if (viewMode === 'day') {
      return [currentDate];
    } else {
      const startOfWeek = currentDate.clone().startOf('week');
      return Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));
    }
  };

  const getTimeSlots = () => {
    // Get working hours range from rules
    const workingHoursRules = rules.filter(r => r.ruleType === 'working_hours');

    let earliestStart = 24;
    let latestEnd = 0;

    if (workingHoursRules.length === 0) {
      // Fallback bounds: 07:00 to 20:00
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

    // Widen bounds to include personal events (they may fall outside working hours)
    personalEvents.forEach(ev => {
      const startHour = parseInt(moment(ev.startAtUtc).local().format('HH'));
      const endHour = parseInt(moment(ev.endAtUtc).local().format('HH'));
      const endMinute = parseInt(moment(ev.endAtUtc).local().format('mm'));
      if (startHour < earliestStart) earliestStart = startHour;
      if (endHour > latestEnd || (endHour === latestEnd && endMinute > 0)) {
        latestEnd = endMinute > 0 ? endHour + 1 : endHour;
      }
    });

    // Generate slots from earliest to latest with 15-minute intervals
    const slots = [];
    for (let hour = earliestStart; hour < latestEnd; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:15`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
      slots.push(`${hour.toString().padStart(2, '0')}:45`);
    }
    return slots;
  };

  const getSlotState = (day, timeSlot) => {
    const dayOfWeek = day.format('ddd').toLowerCase();
    const dateStr = day.format('YYYY-MM-DD');
    const slotDateTime = moment(`${dateStr} ${timeSlot}`, 'YYYY-MM-DD HH:mm');

    // Check if there's a booking at this time (exclude deleted bookings)
    const slotEnd = slotDateTime.clone().add(15, 'minutes');
    const overlappingBooking = bookings.find(b => {
      if (b.isDeleted || b.status === 'deleted') return false;
      const bookingStart = moment(b.startAtUtc).local();
      const bookingEnd = moment(b.endAtUtc).local();
      return slotDateTime.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart);
    });

    if (overlappingBooking) {
      if (overlappingBooking.status === 'completed') {
        return { state: 'completed', booking: overlappingBooking, blockType: 'booking' };
      }
      if (overlappingBooking.status === 'cancelled') {
        return { state: 'cancelled', booking: overlappingBooking, blockType: 'booking' };
      }
      if (overlappingBooking.status === 'no_show') {
        return { state: 'no_show', booking: overlappingBooking, blockType: 'booking' };
      }
      if (overlappingBooking.status === 'confirmed') {
        // Check if it's a practical test
        if (overlappingBooking.isPracticalTest === true) {
          return { state: 'confirmed_test', booking: overlappingBooking, blockType: 'booking' };
        }
        return { state: 'confirmed', booking: overlappingBooking, blockType: 'booking' };
      }
      if (overlappingBooking.status === 'reserved_pending_instructor') {
        return { state: 'reserved_pending', booking: overlappingBooking, blockType: 'booking' };
      }
    }

    // Check personal events (instructor-created, shown regardless of working hours)
    const personalOccurrence = personalEvents.find(ev => {
      const evStartLocal = moment(ev.startAtUtc).local();
      let occurs = false;
      if (ev.repeatType === 'daily') {
        occurs = evStartLocal.isSameOrBefore(day, 'day');
      } else if (ev.repeatType === 'weekly') {
        occurs = evStartLocal.isSameOrBefore(day, 'day') && evStartLocal.day() === day.day();
      } else {
        occurs = evStartLocal.isSame(day, 'day');
      }
      if (!occurs) return false;
      const evStartTime = evStartLocal.format('HH:mm');
      const evEndTime = moment(ev.endAtUtc).local().format('HH:mm');
      const slotStart = moment(timeSlot, 'HH:mm');
      return slotStart.isSameOrAfter(moment(evStartTime, 'HH:mm')) && slotStart.isBefore(moment(evEndTime, 'HH:mm'));
    });
    if (personalOccurrence) {
      return { state: 'personal', personalEvent: personalOccurrence, blockType: 'personal' };
    }

    // Check closed rules (after bookings, before available slots)
    const closedRules = rules.filter(r => r.ruleType === 'closed');
    for (const closedRule of closedRules) {
      if (!ruleMatchesDate(closedRule, day)) continue;

      const slotStartTime = moment(timeSlot, 'HH:mm');
      const closedStart = moment(closedRule.startTimeLocal, 'HH:mm');
      const closedEnd = moment(closedRule.endTimeLocal, 'HH:mm');
      if (slotStartTime.isSameOrAfter(closedStart) && slotStartTime.isBefore(closedEnd)) {
        // For non-instructors, don't show closed blocks — just empty space
        if (!isInstructor) {
          return { state: 'outside_working_hours' };
        }
        return { state: 'closed', rule: closedRule, blockType: 'rule' };
      }
    }

    // Check for published slots mode
    if (availabilityMode === 'published_slots_only') {
      const overlappingInstance = slotInstances.find(si => {
        const instanceStart = moment(si.startAtUtc).local();
        const instanceEnd = moment(si.endAtUtc).local();
        return slotDateTime.isBefore(instanceEnd) && slotEnd.isAfter(instanceStart);
      });

      if (overlappingInstance) {
        if (overlappingInstance.status === 'available') {
          return { state: 'available', slotInstance: overlappingInstance, blockType: 'slotInstance' };
        }
        if (overlappingInstance.status === 'reserved_pending') {
          return { state: 'reserved_pending', slotInstance: overlappingInstance, blockType: 'slotInstance' };
        }
        if (overlappingInstance.status === 'confirmed') {
          return { state: 'confirmed', slotInstance: overlappingInstance, blockType: 'slotInstance' };
        }
        if (overlappingInstance.status === 'blocked') {
          return { state: 'unavailable', slotInstance: overlappingInstance, blockType: 'slotInstance' };
        }
      }
    }

    // Check working hours
    const workingHoursRule = rules.find(r => 
      r.ruleType === 'working_hours' && 
      r.daysOfWeek.includes(dayOfWeek)
    );

    if (!workingHoursRule) {
      return { state: 'outside_working_hours' };
    }

    const workingStart = moment(timeSlot, 'HH:mm');
    const workingEnd = moment(workingHoursRule.endTimeLocal, 'HH:mm');
    const ruleStart = moment(workingHoursRule.startTimeLocal, 'HH:mm');

    if (workingStart.isBefore(ruleStart) || workingStart.isSameOrAfter(workingEnd)) {
      return { state: 'outside_working_hours' };
    }

    // Check unavailable blocks (there may be multiple per day)
    const unavailableRules = rules.filter(r => 
      r.ruleType === 'unavailable' && 
      r.daysOfWeek.includes(dayOfWeek)
    );
    for (const unavailableRule of unavailableRules) {
      const unavailStart = moment(unavailableRule.startTimeLocal, 'HH:mm');
      const unavailEnd = moment(unavailableRule.endTimeLocal, 'HH:mm');
      if (workingStart.isSameOrAfter(unavailStart) && workingStart.isBefore(unavailEnd)) {
        return { state: 'unavailable', rule: unavailableRule, blockType: 'rule' };
      }
    }

    // If published slots only mode and no slot instance found, show as light grey available
    if (availabilityMode === 'published_slots_only') {
      return { state: 'available' };
    }

    return { state: 'available' };
  };

  // Expand personal events into per-day occurrences for the visible date range,
  // and assign each occurrence a lane (0 = left, 1 = right) via greedy interval
  // packing. When two occurrences overlap in time they land in different lanes
  // so they can be rendered side by side (each at half the column width) instead
  // of one hiding the other.
  const personalLanesByDay = useMemo(() => {
    const map = {};
    days.forEach(day => {
      const key = day.format('YYYY-MM-DD');
      const occs = [];
      personalEvents.forEach(ev => {
        const evStart = moment(ev.startAtUtc).local();
        let occurs = false;
        if (ev.repeatType === 'daily') {
          occurs = evStart.isSameOrBefore(day, 'day');
        } else if (ev.repeatType === 'weekly') {
          occurs = evStart.isSameOrBefore(day, 'day') && evStart.day() === day.day();
        } else {
          occurs = evStart.isSame(day, 'day');
        }
        if (!occurs) return;
        const startMoment = day.clone().hour(evStart.hour()).minute(evStart.minute()).second(0);
        const durMin = moment(ev.endAtUtc).local().diff(evStart, 'minutes');
        const endMoment = startMoment.clone().add(durMin, 'minutes');
        occs.push({
          ev,
          startMoment,
          endMoment,
          startStr: startMoment.format('HH:mm'),
          endStr: endMoment.format('HH:mm'),
          span: Math.max(1, Math.ceil(durMin / 15)),
        });
      });
      occs.sort((a, b) => a.startMoment.diff(b.startMoment) || b.span - a.span);
      const laneEnds = [];
      occs.forEach(o => {
        let lane = laneEnds.findIndex(end => !o.startMoment.isBefore(end));
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(o.endMoment.clone()); }
        else laneEnds[lane] = o.endMoment.clone();
        o.lane = lane;
      });
      map[key] = { occs, hasOverlap: laneEnds.length > 1 };
    });
    return map;
  }, [days, personalEvents]);

  // Occurrences (with lanes) for a given day that START exactly at `timeSlot`.
  const personalStartingAtSlot = (day, timeSlot) => {
    const entry = personalLanesByDay[day.format('YYYY-MM-DD')];
    if (!entry) return [];
    return entry.occs.filter(o => o.startStr === timeSlot);
  };

  const handlePrevious = () => {
    setCurrentDateStr(currentDate.clone().subtract(viewMode === 'day' ? 1 : 7, 'days').format('YYYY-MM-DD'));
  };

  const handleNext = () => {
    setCurrentDateStr(currentDate.clone().add(viewMode === 'day' ? 1 : 7, 'days').format('YYYY-MM-DD'));
  };

  const handleToday = () => {
    setCurrentDateStr(moment().format('YYYY-MM-DD'));
    onViewModeChange && onViewModeChange('day');
  };

  const days = getDaysInView();
  const timeSlots = getTimeSlots();

  const isSlotClickable = (state, slotInstance, booking) => {
    if (isInstructor) {
      // Instructors can click any booking to view details
      if (booking) {
        return true;
      }
      // Instructors can click pending/confirmed/test slots to view booking details
      if ((state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test') && booking) {
        return true;
      }
      // Instructors can click personal events to view / edit / delete them
      if (state === 'personal' && onPersonalEventClick) {
        return true;
      }
      // In published slots mode, instructors can click available slots or anywhere to create new slots
      if (availabilityMode === 'published_slots_only') {
        return state === 'outside_working_hours' || state === 'unavailable' || state === 'available';
      }
      return state === 'available';
    }
    // For pupils: available slots OR their own pending/confirmed bookings are clickable
    if (state === 'available' && slotInstance) {
      return true;
    }
    // Check if booking belongs to current pupil
    const isOwnBooking = booking && booking.pupilId === currentPupilId;
    if ((state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test') && isOwnBooking) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button onClick={handlePrevious} variant="outline" size="sm" className="px-2 sm:px-3">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-xs sm:text-lg font-semibold text-slate-700 text-center whitespace-nowrap min-w-[110px] sm:min-w-[150px]">
            {viewMode === 'day'
              ? currentDate.format('ddd, D MMM YYYY')
              : `${days[0].format('D MMM')} – ${days[6].format('D MMM')}`
            }
          </h3>
          <Button onClick={handleNext} variant="outline" size="sm" className="px-2 sm:px-3">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {onViewModeChange && (
            <div className="flex rounded-md border overflow-hidden">
              <button
                onClick={() => onViewModeChange('day')}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Day
              </button>
              <button
                onClick={() => onViewModeChange('week')}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors border-l ${viewMode === 'week' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="grid border-b bg-slate-50" style={{ gridTemplateColumns: viewMode === 'day' ? '50px 1fr' : `50px repeat(${days.length}, minmax(90px, 1fr))` }}>
            <div className="p-1 sm:p-2 border-r font-semibold text-[10px] sm:text-sm text-slate-600 flex items-center justify-center">Time</div>
            {days.map((day, idx) => (
              <div key={idx} className="p-1 sm:p-2 text-center border-r last:border-r-0">
                <div className="font-semibold text-slate-700 text-[10px] sm:text-sm">{day.format('ddd')}</div>
                <div className="text-[9px] sm:text-xs text-slate-500">{day.format('D MMM')}</div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((timeSlot, timeIdx) => {
            // Track which day columns are already occupied by multi-slot blocks
            const occupiedDays = new Set();
            
            return (
              <div 
                key={timeIdx} 
                className="grid border-b last:border-b-0" 
                style={{ gridTemplateColumns: viewMode === 'day' ? '50px 1fr' : `50px repeat(${days.length}, minmax(90px, 1fr))`, height: '22.5px' }}
              >
                <div className="p-0.5 sm:p-2 border-r text-[9px] sm:text-xs text-slate-600 font-medium bg-slate-50 flex items-center justify-center">
                  {timeSlot}
                </div>
                {days.map((day, dayIdx) => {
                const slotStateData = getSlotState(day, timeSlot);
                const { state, booking, slotInstance, rule, blockType } = slotStateData;
                const clickable = isSlotClickable(state, slotInstance, booking);
                const dateStr = day.format('YYYY-MM-DD');
                const slotDateTime = `${dateStr}T${timeSlot}:00`;

                // Determine if this should be rendered as a card
                const shouldRenderAsCard = state !== 'outside_working_hours' && (blockType === 'booking' || blockType === 'slotInstance' || blockType === 'rule' || blockType === 'personal');

                // Define status labels first
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

                // For non-instructors viewing pending/confirmed slots
                // If it's their own confirmed booking, show as normal confirmed
                // If it's someone else's, show as unavailable with grey hatch
                const isOwnBooking = !isInstructor && booking && booking.pupilId === currentPupilId;
                const isOthersReserved = !isInstructor && (state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test') && !isOwnBooking;
                const isAvailableSlotCard = state === 'available' && blockType === 'slotInstance';
                const personalBg = state === 'personal' ? (slotStateData.personalEvent?.color || SLOT_COLORS.available) : null;
                const displayColor = isOthersReserved
                  ? SLOT_COLORS.reserved_confirmed_other
                  : (personalBg || (isAvailableSlotCard ? SLOT_COLORS.available_slot : SLOT_COLORS[state]));
                // Personal events use the user-chosen color, so pick readable text color by luminance
                const personalTextClass = state === 'personal' && isDarkColor(personalBg) ? 'text-white' : 'text-slate-900';
                const personalTimeClass = state === 'personal' && isDarkColor(personalBg) ? 'text-slate-100' : 'text-slate-800';
                const personalDark = state === 'personal' && isDarkColor(personalBg);
                const personalBadgeBg = personalDark ? 'rgba(255,255,255,0.25)' : '#E2E8F0';
                const personalBadgeText = personalDark ? '#ffffff' : '#334155';

                // Override status label for others' confirmed slots
                const displayStatusLabel = isOthersReserved && (state === 'confirmed' || state === 'confirmed_test') ? 'Unavailable' : (statusLabels[state] || state);

                // Get pupil name for instructor view - truncated for alignment
                let pupilName = null;
                if (isInstructor && booking && (state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test' || state === 'completed' || state === 'cancelled' || state === 'no_show')) {
                  const pupil = pupils.find(p => p.id === booking.pupilId);
                  if (pupil) {
                    // Format: "First L." for consistent alignment
                    const lastName = pupil.lastName || '';
                    pupilName = `${pupil.firstName}${lastName ? ' ' + lastName.charAt(0) + '.' : ''}`;
                  }
                }

                // Determine block duration and start
                let isBlockStart = false;
                let blockSpan = 1;
                let blockStartTime = '';
                let blockEndTime = '';

                if (shouldRenderAsCard) {
                  if (blockType === 'booking' && booking) {
                    const blockStart = moment(booking.startAtUtc).local();
                    const blockEnd = moment(booking.endAtUtc).local();
                    isBlockStart = blockStart.format('HH:mm') === timeSlot;
                    if (isBlockStart) {
                      const durationMinutes = blockEnd.diff(blockStart, 'minutes');
                      blockSpan = Math.ceil(durationMinutes / 15);
                      blockStartTime = blockStart.format('HH:mm');
                      blockEndTime = blockEnd.format('HH:mm');
                    }
                  } else if (blockType === 'slotInstance' && slotInstance) {
                    const blockStart = moment(slotInstance.startAtUtc).local();
                    const blockEnd = moment(slotInstance.endAtUtc).local();
                    // Snap to the 15-min grid cell that contains the slot start —
                    // slots created with a non-aligned start (e.g. 14:01) still render
                    // instead of vanishing because they never match a grid line exactly.
                    const cellStart = blockStart.clone().minutes(Math.floor(blockStart.minutes() / 15) * 15).seconds(0);
                    isBlockStart = cellStart.format('HH:mm') === timeSlot;
                    if (isBlockStart) {
                      const durationMinutes = blockEnd.diff(cellStart, 'minutes');
                      blockSpan = Math.max(1, Math.ceil(durationMinutes / 15));
                      blockStartTime = blockStart.format('HH:mm');
                      blockEndTime = blockEnd.format('HH:mm');
                    }
                  } else if (blockType === 'rule' && rule) {
                    isBlockStart = rule.startTimeLocal === timeSlot;
                    if (isBlockStart) {
                      const ruleStart = moment(rule.startTimeLocal, 'HH:mm');
                      const ruleEnd = moment(rule.endTimeLocal, 'HH:mm');
                      const durationMinutes = ruleEnd.diff(ruleStart, 'minutes');
                      blockSpan = Math.ceil(durationMinutes / 15);
                      blockStartTime = rule.startTimeLocal;
                      blockEndTime = rule.endTimeLocal;
                    }
                  } else if (blockType === 'personal' && slotStateData.personalEvent) {
                    // Personal events use lane-based layout: an occurrence is a
                    // "block start" when its own start matches this timeSlot (even
                    // if another overlapping personal event is already active here).
                    const startingHere = personalStartingAtSlot(day, timeSlot);
                    isBlockStart = startingHere.length > 0;
                    if (isBlockStart) {
                      slotStateData.personalPeers = startingHere;
                      blockSpan = Math.max(...startingHere.map(o => o.span));
                      blockStartTime = startingHere[0].startStr;
                      blockEndTime = startingHere[0].endStr;
                    }
                  }
                }

                const borderColors = {
                  available: '#2E7D32',
                  reserved_pending: '#5E35B1',
                  confirmed: '#1565C0',
                  confirmed_test: '#8B7355',
                  completed: '#757575',
                  cancelled: '#F57C00',
                  no_show: '#D32F2F',
                  unavailable: '#D32F2F',
                  closed: '#8B9A0A',
                  personal: '#475569'
                };

                const accentColors = {
                  available: '#1B5E20',
                  reserved_pending: '#4527A0',
                  confirmed: '#0D47A1',
                  confirmed_test: '#6B5840',
                  completed: '#616161',
                  cancelled: '#E65100',
                  no_show: '#C62828',
                  unavailable: '#C62828',
                  closed: '#6B7A08',
                  personal: '#334155'
                };

                // Render card-style block
                if (shouldRenderAsCard && isBlockStart) {
                  const exactHeight = blockSpan * 22.5;

                  // Personal events use lane-based layout: when a day has any
                  // overlapping personal occurrences, every occurrence on that day
                  // renders at half width in its assigned lane (left/right), so
                  // overlapping events sit side by side instead of hiding each other.
                  const personalPeers = blockType === 'personal' ? (slotStateData.personalPeers || []) : [];
                  const dayHasPersonalOverlap = blockType === 'personal'
                    && !!(personalLanesByDay[day.format('YYYY-MM-DD')]?.hasOverlap);
                  if (blockType === 'personal' && personalPeers.length > 0) {
                    const laneWidth = dayHasPersonalOverlap ? '50%' : '100%';
                    return (
                      <div
                        key={dayIdx}
                        className="border-r border-b border-slate-200 last:border-r-0 relative flex gap-[2px]"
                        style={{ height: `${exactHeight}px`, padding: '2px', gridRow: `span ${blockSpan}` }}
                      >
                        {personalPeers.map((o, peerIdx) => {
                          const ev = o.ev;
                          const peerHeight = o.span * 22.5 - 4; // minus cell padding
                          const bg = ev.color || SLOT_COLORS.available;
                          const dark = isDarkColor(bg);
                          const txt = dark ? 'text-white' : 'text-slate-900';
                          const timeTxt = dark ? 'text-slate-100' : 'text-slate-800';
                          const badgeBg = dark ? 'rgba(255,255,255,0.25)' : '#E2E8F0';
                          const badgeText = dark ? '#ffffff' : '#334155';
                          const laneOffset = dayHasPersonalOverlap ? (o.lane % 2) * 50 : 0;
                          return (
                            <div
                              key={ev.id || peerIdx}
                              onClick={() => onPersonalEventClick?.(ev)}
                              className="relative rounded-md border-2 overflow-hidden cursor-pointer group hover:shadow-md transition-shadow min-w-0"
                              style={{
                                borderColor: '#475569',
                                backgroundColor: bg,
                                height: `${peerHeight}px`,
                                width: laneWidth,
                                marginLeft: dayHasPersonalOverlap ? `${laneOffset}%` : 0,
                                position: 'relative',
                                zIndex: 2,
                              }}
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#334155' }} />
                              <div className="pl-1.5 sm:pl-2 pr-1 py-1 h-full flex flex-col justify-center relative z-10 overflow-hidden min-w-0">
                                {ev.title && (
                                  <div className={`text-[10px] sm:text-sm font-bold ${txt} mb-0.5 truncate w-full`} title={ev.title}>
                                    {ev.title}
                                  </div>
                                )}
                                <div className={`text-[10px] sm:text-xs font-semibold ${timeTxt} truncate`}>
                                  {o.startStr} - {o.endStr}
                                </div>
                                <div className="mt-0.5">
                                  <span
                                    className="inline-block px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold uppercase rounded whitespace-nowrap"
                                    style={{ backgroundColor: badgeBg, color: badgeText }}
                                  >
                                    Personal
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  const handleClick = () => {
                    if (!clickable) return;

                    // Personal events open their own edit / delete modal
                    if (blockType === 'personal' && onPersonalEventClick) {
                      onPersonalEventClick(slotStateData.personalEvent);
                      return;
                    }

                    // If instructor clicking any booking, open booking details
                    if (isInstructor && booking) {
                      onPendingSlotClick && onPendingSlotClick(booking, slotInstance);
                    } 
                    // If pupil clicking their own pending/confirmed booking, open booking details
                    else if (!isInstructor && booking && isOwnBooking && (state === 'reserved_pending' || state === 'confirmed')) {
                      onPendingSlotClick && onPendingSlotClick(booking, slotInstance);
                    }
                    // Otherwise open slot booking modal
                    else {
                      onSlotClick && onSlotClick(slotDateTime, slotInstance || state);
                    }
                  };

                  const handleDelete = (e) => {
                    e.stopPropagation();
                    if (onDeleteBooking && (booking || slotInstance)) {
                      onDeleteBooking(booking || slotInstance, state, blockType);
                    }
                  };

                  const showDeleteIcon = false;

                  return (
                    <div
                      key={dayIdx}
                      onClick={handleClick}
                      className={`border-r border-b border-slate-200 last:border-r-0 relative ${
                        clickable ? 'cursor-pointer group' : isOthersReserved ? 'cursor-not-allowed' : 'cursor-default'
                      }`}
                      style={{ 
                        backgroundColor: displayColor,
                        height: `${exactHeight}px`,
                        padding: '2px',
                        gridRow: `span ${blockSpan}`
                      }}
                    >
                      <div
                        className={`relative rounded-md border-2 overflow-hidden ${
                          clickable ? 'group-hover:shadow-md transition-shadow' : ''
                        }`}
                        style={{ 
                          borderColor: isOthersReserved ? '#E0E0E0' : borderColors[state],
                          backgroundColor: displayColor,
                          height: '100%',
                          minWidth: 0
                        }}
                      >
                        {/* Diagonal hatch overlay for non-instructors viewing others' reserved slots */}
                        {isOthersReserved && (
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 8px,
                                #D9D9D9 8px,
                                #D9D9D9 10px
                              )`,
                              opacity: 0.7
                            }}
                          />
                        )}

                        {/* Accent strip */}
                        {!isOthersReserved && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: accentColors[state] }}
                          />
                        )}

                        {/* Content */}
                        <div className={`${isOthersReserved ? 'pl-1 sm:pl-2' : 'pl-1.5 sm:pl-3'} pr-1 sm:pr-2 py-1 sm:py-2 h-full flex flex-col justify-center relative z-10 overflow-hidden min-w-0`}>
                          {pupilName && (
                            <div className={`text-[10px] sm:text-sm font-bold ${isOthersReserved ? 'text-slate-400' : 'text-slate-900'} mb-0.5 truncate w-full`} title={pupilName}>
                              {pupilName}
                            </div>
                          )}
                          {blockType === 'personal' && slotStateData.personalEvent?.title && (
                            <div className={`text-[10px] sm:text-sm font-bold ${personalTextClass} mb-0.5 truncate w-full`} title={slotStateData.personalEvent.title}>
                              {slotStateData.personalEvent.title}
                            </div>
                          )}
                          <div className={`text-[10px] sm:text-xs font-semibold ${isOthersReserved ? 'text-slate-400' : (blockType === 'personal' ? personalTimeClass : 'text-slate-800')} truncate`}>
                            {blockStartTime} - {blockEndTime}
                          </div>
                          {state === 'confirmed_test' && booking?.practicalTestTime && (
                            <div className={`text-[9px] sm:text-[11px] font-semibold ${isOthersReserved ? 'text-slate-400' : 'text-slate-800'} mt-0.5 truncate`}>
                              Test: {booking.practicalTestTime}
                            </div>
                          )}
                          <div className="mt-0.5 sm:mt-1">
                            <span 
                              className="inline-block px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold uppercase rounded whitespace-nowrap"
                              style={{ 
                                backgroundColor: blockType === 'personal' ? personalBadgeBg : (isOthersReserved ? '#E0E0E0' : `${accentColors[state]}20`),
                                color: blockType === 'personal' ? personalBadgeText : (isOthersReserved ? '#999999' : accentColors[state])
                              }}
                            >
                              {displayStatusLabel}
                            </span>
                          </div>
                        </div>



                        {/* Hover outline for clickable slots */}
                        {clickable && !isOthersReserved && (
                          <div 
                            className="absolute inset-0 rounded-md border-2 border-transparent group-hover:border-[#2E7D32] pointer-events-none transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // Skip slots covered by multi-slot blocks — must be transparent so the overflowing card above covers them
                if (shouldRenderAsCard && !isBlockStart) {
                  return <div key={dayIdx} className="border-r border-b border-slate-200 last:border-r-0" style={{ height: '22.5px', backgroundColor: 'transparent' }} />;
                }

                // Render flat background slot (for outside_working_hours or default available)
                return (
                  <div
                    key={dayIdx}
                    className="border-r border-b border-slate-200 last:border-r-0 p-1 cursor-default"
                    style={{ backgroundColor: displayColor, height: '22.5px' }}
                    title={state}
                  />
                );
                })}
                </div>
                );
                })}
                </div>
                </div>
                </div>
                );
                }