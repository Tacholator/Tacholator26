import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';

const SLOT_COLORS = {
  available: '#B7F7C9',
  confirmed: '#87CEFA',
  lunch: '#FFA500',
  unavailable: '#FF0000',
  outside_working_hours: '#D3D3D3',
  reserved_pending: '#B39DDB',
  cancelled: '#CFCFCF'
};

export default function Calendar24Hour({ 
  viewMode = 'week', 
  rules = [], 
  bookings = [], 
  slotInstances = [],
  availabilityMode = 'available_by_default',
  onSlotClick,
  isInstructor = false 
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
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getSlotState = (day, timeSlot) => {
    const dayOfWeek = day.format('ddd').toLowerCase();
    const dateStr = day.format('YYYY-MM-DD');
    const slotDateTime = moment(`${dateStr} ${timeSlot}`, 'YYYY-MM-DD HH:mm');

    // Check if there's a booking at this time
    const slotEnd = slotDateTime.clone().add(30, 'minutes');
    const overlappingBooking = bookings.find(b => {
      const bookingStart = moment(b.startAtUtc).local();
      const bookingEnd = moment(b.endAtUtc).local();
      return slotDateTime.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart);
    });

    if (overlappingBooking) {
      if (overlappingBooking.status === 'confirmed' || overlappingBooking.status === 'completed') {
        return { state: 'confirmed', booking: overlappingBooking };
      }
      if (overlappingBooking.status === 'reserved_pending_instructor') {
        return { state: 'reserved_pending', booking: overlappingBooking };
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
          return { state: 'available', slotInstance: overlappingInstance };
        }
        if (overlappingInstance.status === 'reserved_pending') {
          return { state: 'reserved_pending', slotInstance: overlappingInstance };
        }
        if (overlappingInstance.status === 'confirmed') {
          return { state: 'confirmed', slotInstance: overlappingInstance };
        }
        if (overlappingInstance.status === 'blocked') {
          return { state: 'unavailable', slotInstance: overlappingInstance };
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
        return { state: 'lunch' };
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
        return { state: 'unavailable' };
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

  const isSlotClickable = (state) => {
    if (availabilityMode === 'published_slots_only' && isInstructor) {
      // In published slots mode, instructors can click anywhere to create slots
      return state === 'outside_working_hours' || state === 'unavailable' || state === 'available';
    }
    return state === 'available';
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        <h3 className="text-lg font-semibold text-slate-700">
          {viewMode === 'day' 
            ? currentDate.format('dddd, D MMMM YYYY')
            : `Week of ${days[0].format('D MMM')} - ${days[6].format('D MMM YYYY')}`
          }
        </h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.available }} />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: SLOT_COLORS.confirmed }} />
          <span>Confirmed</span>
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

      {/* Calendar Grid */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid border-b bg-slate-50" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
            <div className="p-2 border-r font-semibold text-sm text-slate-600">Time</div>
            {days.map((day, idx) => (
              <div key={idx} className="p-2 text-center border-r last:border-r-0">
                <div className="font-semibold text-slate-700">{day.format('ddd')}</div>
                <div className="text-xs text-slate-500">{day.format('D MMM')}</div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((timeSlot, timeIdx) => (
            <div 
              key={timeIdx} 
              className="grid border-b last:border-b-0" 
              style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}
            >
              <div className="p-2 border-r text-xs text-slate-600 font-medium bg-slate-50">
                {timeSlot}
              </div>
              {days.map((day, dayIdx) => {
                const { state, booking } = getSlotState(day, timeSlot);
                const clickable = isSlotClickable(state);
                const dateStr = day.format('YYYY-MM-DD');
                const slotDateTime = `${dateStr}T${timeSlot}:00`;

                const { slotInstance } = getSlotState(day, timeSlot);
                const isSlotCard = slotInstance && availabilityMode === 'published_slots_only';
                
                // Check if this is the start of a slot instance
                const isSlotStart = isSlotCard && moment(slotInstance.startAtUtc).local().format('HH:mm') === timeSlot;
                
                // Calculate slot duration in 30min increments
                let slotSpan = 1;
                if (isSlotStart && slotInstance) {
                  const startMoment = moment(slotInstance.startAtUtc).local();
                  const endMoment = moment(slotInstance.endAtUtc).local();
                  const durationMinutes = endMoment.diff(startMoment, 'minutes');
                  slotSpan = Math.ceil(durationMinutes / 30);
                }

                const borderColors = {
                  available: '#4CAF50',
                  reserved_pending: '#7E57C2',
                  confirmed: '#4A90E2',
                  unavailable: '#C62828',
                  lunch: '#EF6C00',
                  outside_working_hours: '#B0B0B0'
                };

                const accentColors = {
                  available: '#2E7D32',
                  reserved_pending: '#5E35B1',
                  confirmed: '#1565C0',
                  unavailable: '#8E0000',
                  lunch: '#E65100',
                  outside_working_hours: '#9E9E9E'
                };

                if (isSlotStart) {
                  return (
                    <div
                      key={dayIdx}
                      onClick={() => clickable && onSlotClick && onSlotClick(slotDateTime, slotInstance)}
                      className={`border-r last:border-r-0 p-1 relative ${
                        clickable ? 'cursor-pointer group' : 'cursor-default'
                      }`}
                      style={{ 
                        backgroundColor: SLOT_COLORS[state],
                        minHeight: `${slotSpan * 40}px`
                      }}
                    >
                      <div
                        className={`relative h-full rounded-md border-2 overflow-hidden ${
                          clickable ? 'group-hover:shadow-md transition-shadow' : ''
                        }`}
                        style={{ 
                          borderColor: borderColors[state],
                          backgroundColor: SLOT_COLORS[state]
                        }}
                      >
                        {/* Accent strip */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: accentColors[state] }}
                        />
                        
                        {/* Content */}
                        <div className="pl-3 pr-2 py-1 h-full flex flex-col justify-center">
                          <div className="text-xs font-semibold text-slate-700">
                            {moment(slotInstance.startAtUtc).local().format('HH:mm')} - {moment(slotInstance.endAtUtc).local().format('HH:mm')}
                          </div>
                          <div className="mt-1">
                            <span 
                              className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded"
                              style={{ 
                                backgroundColor: `${accentColors[state]}20`,
                                color: accentColors[state]
                              }}
                            >
                              {state === 'available' ? 'Available' : 
                               state === 'reserved_pending' ? 'Pending' :
                               state === 'confirmed' ? 'Confirmed' : state}
                            </span>
                          </div>
                        </div>

                        {/* Hover outline for available slots */}
                        {clickable && (
                          <div 
                            className="absolute inset-0 rounded-md border-2 border-transparent group-hover:border-[#2E7D32] pointer-events-none transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // Skip slots covered by multi-slot instances
                if (isSlotCard && !isSlotStart) {
                  return null;
                }

                return (
                  <div
                    key={dayIdx}
                    onClick={() => clickable && onSlotClick && onSlotClick(slotDateTime, state)}
                    className={`border-r last:border-r-0 p-1 min-h-[40px] ${
                      clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    }`}
                    style={{ backgroundColor: SLOT_COLORS[state] }}
                    title={booking ? `${booking.status}` : state}
                  >
                    {booking && (
                      <div className="text-xs font-semibold text-slate-700 truncate px-1">
                        {booking.status === 'confirmed' && '✓'}
                        {booking.status === 'reserved_pending_instructor' && '⏱'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}