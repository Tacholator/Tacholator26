import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import moment from 'moment';

const SLOT_COLORS = {
  available: '#B7F7C9',
  confirmed: '#87CEFA',
  confirmed_test: '#D2B48C',
  completed: '#CFCFCF',
  cancelled: '#FFCC80',
  no_show: '#FF8A80',
  lunch: '#F7B602',
  unavailable: '#FFB3B3',
  outside_working_hours: '#E8E8E8',
  reserved_pending: '#B39DDB',
  // Light grey for others viewing pending/confirmed
  reserved_confirmed_other: '#F2F2F2'
};

export default function Calendar24Hour({ 
  viewMode = 'week', 
  rules = [], 
  bookings = [], 
  slotInstances = [],
  availabilityMode = 'available_by_default',
  onSlotClick,
  onPendingSlotClick,
  onDeleteBooking,
  isInstructor = false,
  currentPupilId = null,
  pupils = []
}) {
  const [currentDate, setCurrentDate] = useState(moment());

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
    
    if (workingHoursRules.length === 0) {
      // Fallback: 07:00 to 20:00 with 15-minute intervals
      const slots = [];
      for (let hour = 7; hour <= 19; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:15`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
        slots.push(`${hour.toString().padStart(2, '0')}:45`);
      }
      return slots;
    }

    // Find earliest start and latest end time from working hours
    let earliestStart = 24;
    let latestEnd = 0;

    workingHoursRules.forEach(rule => {
      const startHour = parseInt(rule.startTimeLocal.split(':')[0]);
      const endHour = parseInt(rule.endTimeLocal.split(':')[0]);
      const endMinute = parseInt(rule.endTimeLocal.split(':')[1]);
      
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

    // Check lunch break
    const lunchRule = rules.find(r => 
      r.ruleType === 'lunch_break' && 
      r.daysOfWeek.includes(dayOfWeek)
    );
    if (lunchRule) {
      const lunchStart = moment(lunchRule.startTimeLocal, 'HH:mm');
      const lunchEnd = moment(lunchRule.endTimeLocal, 'HH:mm');
      if (workingStart.isSameOrAfter(lunchStart) && workingStart.isBefore(lunchEnd)) {
        return { state: 'lunch', rule: lunchRule, blockType: 'rule' };
      }
    }

    // Check unavailable blocks
    const unavailableRule = rules.find(r => 
      r.ruleType === 'unavailable' && 
      r.daysOfWeek.includes(dayOfWeek)
    );
    if (unavailableRule) {
      const unavailStart = moment(unavailableRule.startTimeLocal, 'HH:mm');
      const unavailEnd = moment(unavailableRule.endTimeLocal, 'HH:mm');
      if (workingStart.isSameOrAfter(unavailStart) && workingStart.isBefore(unavailEnd)) {
        return { state: 'unavailable', rule: unavailableRule, blockType: 'rule' };
      }
    }

    // If published slots only mode and no slot instance found, treat as unavailable
    if (availabilityMode === 'published_slots_only') {
      return { state: 'unavailable' };
    }

    return { state: 'available' };
  };

  const handlePrevious = () => {
    setCurrentDate(prev => prev.clone().subtract(viewMode === 'day' ? 1 : 7, 'days'));
  };

  const handleNext = () => {
    setCurrentDate(prev => prev.clone().add(viewMode === 'day' ? 1 : 7, 'days'));
  };

  const handleToday = () => {
    setCurrentDate(moment());
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <Button onClick={handlePrevious} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={handleNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={handleToday} variant="outline" size="sm">
            Today
          </Button>
        </div>
        <h3 className="text-sm sm:text-lg font-semibold text-slate-700 text-center sm:text-right">
          {viewMode === 'day' 
            ? currentDate.format('ddd, D MMM YYYY')
            : `${days[0].format('D MMM')} - ${days[6].format('D MMM')}`
          }
        </h3>
      </div>

      {/* Legend - Only show for instructors on desktop */}
      {isInstructor && (
        <div className="hidden sm:flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.available }} />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.confirmed }} />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.confirmed_test }} />
            <span>Practical Test</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.completed }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.cancelled }} />
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.no_show }} />
            <span>No Show</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.reserved_pending }} />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.lunch }} />
            <span>Lunch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.unavailable }} />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.outside_working_hours }} />
            <span>Outside Hours</span>
          </div>
        </div>
      )}

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
                style={{ gridTemplateColumns: viewMode === 'day' ? '50px 1fr' : `50px repeat(${days.length}, minmax(90px, 1fr))`, height: '30px' }}
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
                const shouldRenderAsCard = state !== 'outside_working_hours' && (blockType === 'booking' || blockType === 'slotInstance' || blockType === 'rule');

                // Define status labels first
                const statusLabels = {
                  available: 'Available',
                  reserved_pending: 'Pending',
                  confirmed: 'Confirmed',
                  confirmed_test: 'Test Day',
                  completed: 'Completed',
                  cancelled: 'Cancelled',
                  no_show: 'No Show',
                  lunch: 'Lunch',
                  unavailable: 'Unavailable'
                };

                // For non-instructors viewing pending/confirmed slots
                // If it's their own confirmed booking, show as normal confirmed
                // If it's someone else's, show as unavailable with grey hatch
                const isOwnBooking = !isInstructor && booking && booking.pupilId === currentPupilId;
                const isOthersReserved = !isInstructor && (state === 'reserved_pending' || state === 'confirmed' || state === 'confirmed_test') && !isOwnBooking;
                const displayColor = isOthersReserved ? SLOT_COLORS.reserved_confirmed_other : SLOT_COLORS[state];

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
                    isBlockStart = blockStart.format('HH:mm') === timeSlot;
                    if (isBlockStart) {
                      const durationMinutes = blockEnd.diff(blockStart, 'minutes');
                      blockSpan = Math.ceil(durationMinutes / 15);
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
                  lunch: '#F57C00'
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
                  lunch: '#E65100'
                };

                // Render card-style block
                if (shouldRenderAsCard && isBlockStart) {
                  const exactHeight = blockSpan * 30;

                  const handleClick = () => {
                    if (!clickable) return;

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

                  // Show delete icon for instructors on available, confirmed, confirmed_test, and completed slots
                  const showDeleteIcon = isInstructor && (
                    state === 'available' || 
                    state === 'confirmed' || 
                    state === 'confirmed_test' ||
                    state === 'completed'
                  );

                  return (
                    <div
                      key={dayIdx}
                      onClick={handleClick}
                      className={`border-r last:border-r-0 relative ${
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
                            <div className={`text-[9px] sm:text-xs font-bold ${isOthersReserved ? 'text-slate-400' : 'text-slate-800'} mb-0.5 truncate w-full`} title={pupilName}>
                              {pupilName}
                            </div>
                          )}
                          <div className={`text-[9px] sm:text-xs font-semibold ${isOthersReserved ? 'text-slate-400' : 'text-slate-700'} truncate`}>
                            {blockStartTime} - {blockEndTime}
                          </div>
                          {state === 'confirmed_test' && booking?.practicalTestTime && (
                            <div className={`text-[8px] sm:text-[10px] font-medium ${isOthersReserved ? 'text-slate-400' : 'text-slate-600'} mt-0.5 truncate`}>
                              Test: {booking.practicalTestTime}
                            </div>
                          )}
                          <div className="mt-0.5 sm:mt-1">
                            <span 
                              className="inline-block px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase rounded whitespace-nowrap"
                              style={{ 
                                backgroundColor: isOthersReserved ? '#E0E0E0' : `${accentColors[state]}20`,
                                color: isOthersReserved ? '#999999' : accentColors[state]
                              }}
                            >
                              {displayStatusLabel}
                            </span>
                          </div>
                        </div>

                        {/* Delete Icon */}
                        {showDeleteIcon && (
                          <button
                            onClick={handleDelete}
                            className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 p-0.5 sm:p-1 rounded bg-white/80 hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100 z-20"
                            title="Delete"
                          >
                            <Trash2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-rose-600" />
                          </button>
                        )}

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

                // Skip slots covered by multi-slot blocks
                if (shouldRenderAsCard && !isBlockStart) {
                  return <div key={dayIdx} className="border-r last:border-r-0" style={{ height: '30px' }} />;
                }

                // Render flat background slot (for outside_working_hours or default available)
                return (
                  <div
                    key={dayIdx}
                    onClick={() => {
                      if (!clickable) return;
                      onSlotClick && onSlotClick(slotDateTime, state);
                    }}
                    className={`border-r last:border-r-0 p-1 ${
                      clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    }`}
                    style={{ backgroundColor: displayColor, height: '30px' }}
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