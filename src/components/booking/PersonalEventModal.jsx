import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import moment from 'moment';

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' }
];

const COLOR_OPTIONS = [
  { value: '#F7B602', label: 'Gold' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#22C55E', label: 'Green' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#071739', label: 'Navy' }
];

export default function PersonalEventModal({
  open,
  onOpenChange,
  event,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(moment().format('HH:mm'));
  const [duration, setDuration] = useState(60);
  const [repeatType, setRepeatType] = useState('none');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);

  useEffect(() => {
    if (event && open) {
      const start = moment(event.startAtUtc).local();
      const end = moment(event.endAtUtc).local();
      setTitle(event.title || '');
      setDate(start.format('YYYY-MM-DD'));
      setStartTime(start.format('HH:mm'));
      setDuration(end.diff(start, 'minutes') || event.durationMinutes || 60);
      setRepeatType(event.repeatType || 'none');
      setColor(event.color || COLOR_OPTIONS[0].value);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [event, open]);

  const handleSave = () => {
    const startLocal = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const endLocal = startLocal.clone().add(duration, 'minutes');
    onSave({
      id: event?.id,
      title,
      startAtUtc: startLocal.toISOString(),
      endAtUtc: endLocal.toISOString(),
      durationMinutes: duration,
      repeatType,
      color
    });
  };

  const isValid = title.trim().length > 0;

  return (
    <>
      <Dialog open={open && !showDeleteConfirm} onOpenChange={(o) => { onOpenChange(o); if (!o) setIsEditing(false); }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Personal Event' : 'Personal Event'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the event details' : 'View, edit, or delete this personal event'}
            </DialogDescription>
          </DialogHeader>

          {isEditing ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title <span className="text-rose-500">*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Lunch break" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Repeat</Label>
                  <Select value={repeatType} onValueChange={setRepeatType}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: opt.value }} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: event?.color }} />
                <span className="text-lg font-semibold text-slate-900">{event?.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">Date</div>
                <div className="text-slate-900 font-medium">{event ? moment(event.startAtUtc).local().format('ddd, D MMM YYYY') : '-'}</div>
                <div className="text-slate-500">Time</div>
                <div className="text-slate-900 font-medium">
                  {event ? `${moment(event.startAtUtc).local().format('HH:mm')} - ${moment(event.endAtUtc).local().format('HH:mm')}` : '-'}
                </div>
                <div className="text-slate-500">Duration</div>
                <div className="text-slate-900 font-medium">{event?.durationMinutes ? `${event.durationMinutes} min` : '-'}</div>
                <div className="text-slate-500">Repeat</div>
                <div className="text-slate-900 font-medium capitalize">{event?.repeatType === 'daily' ? 'Daily' : event?.repeatType === 'weekly' ? 'Weekly' : 'Does not repeat'}</div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || !isValid} className="bg-teal-600 hover:bg-teal-700">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
                <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Personal Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(event)}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}