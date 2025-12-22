import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Generate time options in 30-minute increments
const generateTimeOptions = (minTime = '00:00', maxTime = '23:30') => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
  }
  return times;
};

// Filter end time options to only show times after start time
const filterEndTimeOptions = (allTimes, startTime) => {
  if (!startTime) return allTimes;
  const startIndex = allTimes.indexOf(startTime);
  if (startIndex === -1) return allTimes;
  return allTimes.slice(startIndex + 1);
};

export function TimePicker({ value, onChange, minTime, filterAfter, placeholder = 'Select time' }) {
  const allTimes = generateTimeOptions(minTime);
  const availableTimes = filterAfter ? filterEndTimeOptions(allTimes, filterAfter) : allTimes;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {availableTimes.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TimeRangePicker({ 
  startTime, 
  endTime, 
  onStartChange, 
  onEndChange,
  startPlaceholder = 'Start time',
  endPlaceholder = 'End time'
}) {
  // Auto-set end time when start time changes
  const handleStartChange = (newStartTime) => {
    onStartChange(newStartTime);
    
    // If end time is empty or before/equal to new start time, auto-set it
    if (!endTime || endTime <= newStartTime) {
      const allTimes = generateTimeOptions();
      const startIndex = allTimes.indexOf(newStartTime);
      if (startIndex !== -1 && startIndex + 2 < allTimes.length) {
        // Default to 1 hour later (2 slots of 30 min)
        onEndChange(allTimes[startIndex + 2]);
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-slate-500">{startPlaceholder}</label>
        <TimePicker
          value={startTime}
          onChange={handleStartChange}
          placeholder={startPlaceholder}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">{endPlaceholder}</label>
        <TimePicker
          value={endTime}
          onChange={onEndChange}
          filterAfter={startTime}
          placeholder={endPlaceholder}
        />
      </div>
    </div>
  );
}