import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2, Clock, CalendarDays, Repeat, Lock } from 'lucide-react';
import { TimeRangePicker } from '@/components/ui/TimePicker';
import moment from 'moment';

const DAY_LABELS = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
};

export default function CloseDayModal({ open, onOpenChange, onSave, isSaving, defaultDate, existingRules = [], onDeleteRule }) {
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [recurring, setRecurring] = useState(false);

  useEffect(() => {
    if (open && defaultDate) {
      setDate(defaultDate.format('YYYY-MM-DD'));
    }
  }, [open, defaultDate]);

  const dayOfWeek = moment(date).format('ddd').toLowerCase();
  const dayLabel = DAY_LABELS[dayOfWeek] || dayOfWeek;
  const formattedDate = moment(date).format('D MMM YYYY');

  const handleSave = () => {
    onSave({
      specificDate: date,
      fullDay,
      startTimeLocal: fullDay ? '00:00' : startTime,
      endTimeLocal: fullDay ? '23:59' : endTime,
      recurring,
      dayOfWeek
    });
  };

  const sortedRules = [...existingRules].sort((a, b) => {
    const da = a.specificDate || a.startDate || '';
    const db = b.specificDate || b.startDate || '';
    return da.localeCompare(db);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-lime-600" />
            Close Calendar
          </DialogTitle>
          <DialogDescription>
            Close your calendar for a full day or part of the day. Available slots during closed periods will be hidden from pupils.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              Date
            </Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          {/* Close type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Close for</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFullDay(true)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  fullDay
                    ? 'border-lime-500 bg-lime-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-sm text-slate-800">Full Day</div>
                <div className="text-xs text-slate-500 mt-0.5">All working hours</div>
              </button>
              <button
                type="button"
                onClick={() => setFullDay(false)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  !fullDay
                    ? 'border-lime-500 bg-lime-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-sm text-slate-800">Part of Day</div>
                <div className="text-xs text-slate-500 mt-0.5">Specific time range</div>
              </button>
            </div>
          </div>

          {/* Time range (only for part of day) */}
          {!fullDay && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Time Range
              </Label>
              <TimeRangePicker
                startTime={startTime}
                endTime={endTime}
                onStartChange={setStartTime}
                onEndChange={setEndTime}
              />
            </div>
          )}

          {/* Recurring toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Repeat className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-sm font-medium text-slate-800">Repeat weekly</div>
                <div className="text-xs text-slate-500">
                  Every {dayLabel} {fullDay ? 'all day' : `${startTime}–${endTime}`}
                </div>
              </div>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-lime-50 border border-lime-200">
            <p className="text-xs text-lime-800">
              <span className="font-semibold">Summary:</span> Closing{' '}
              {fullDay ? 'all day' : `${startTime}–${endTime}`} on{' '}
              {formattedDate}
              {recurring ? ` and every ${dayLabel} ongoing` : ''}.
              Available slots during this period will be hidden from pupils.
            </p>
          </div>

          {/* Existing closures */}
          {sortedRules.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Existing Closures</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sortedRules.map(rule => {
                  const ruleDate = rule.specificDate || rule.startDate;
                  const ruleDay = rule.daysOfWeek?.[0];
                  return (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                      <div className="text-sm">
                        <span className="font-medium text-slate-800">
                          {rule.isRecurring === false && rule.specificDate
                            ? moment(rule.specificDate).format('D MMM YYYY')
                            : `Every ${DAY_LABELS[ruleDay] || ruleDay}`}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {rule.startTimeLocal}–{rule.endTimeLocal}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteRule?.(rule.id)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Remove closure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-lime-600 hover:bg-lime-700 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            Close Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}