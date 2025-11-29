import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Loader2, Save, Trash2 } from 'lucide-react';
import moment from 'moment';

// Generate time options for 24-hour format
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      times.push(time);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();
const DURATION_OPTIONS = ['0.5', '1.0', '1.5', '2.0', '2.5'];

export default function LessonFormModal({ open, onClose, existingLesson, pupils, onSave, onDelete, onStatusChange }) {
  const getInitialDuration = (lesson) => {
    if (!lesson?.startTime || !lesson?.endTime) return '1.0';
    const start = moment(lesson.startTime, 'HH:mm');
    const end = moment(lesson.endTime, 'HH:mm');
    const hours = end.diff(start, 'minutes') / 60;
    return hours.toFixed(1);
  };

  const [formData, setFormData] = useState(existingLesson || {
    pupilId: '',
    date: moment().format('YYYY-MM-DD'),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    status: 'Scheduled',
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    notes: ''
  });
  const [duration, setDuration] = useState(getInitialDuration(existingLesson));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateEndTime = (startTime, durationHours) => {
    const endTime = moment(startTime, 'HH:mm').add(parseFloat(durationHours) * 60, 'minutes').format('HH:mm');
    setFormData(prev => ({ ...prev, endTime }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'startTime') {
      updateEndTime(value, duration);
    }
  };

  const handleDurationChange = (value) => {
    setDuration(value);
    updateEndTime(formData.startTime, value);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const durationMinutes = moment(formData.endTime, 'HH:mm').diff(moment(formData.startTime, 'HH:mm'), 'minutes');
      
      // Check if status changed to Completed
      const statusChangedToCompleted = existingLesson && 
        existingLesson.status !== 'Completed' && 
        formData.status === 'Completed';
      
      await onSave({ ...formData, durationMinutes });
      
      // If status changed to Completed, update pupil hours
      if (statusChangedToCompleted && onStatusChange) {
        await onStatusChange(formData.pupilId, durationMinutes / 60);
      }
      
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingLesson) return;
    setIsDeleting(true);
    try {
      await onDelete(existingLesson.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            {existingLesson ? 'Edit Lesson' : 'Schedule Lesson'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pupilId">Pupil *</Label>
            <Select value={formData.pupilId} onValueChange={(v) => handleChange('pupilId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pupil" />
              </SelectTrigger>
              <SelectContent>
                {pupils?.map(pupil => (
                  <SelectItem key={pupil.id} value={pupil.id}>
                    {pupil.firstName} {pupil.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Select value={formData.startTime} onValueChange={(v) => handleChange('startTime', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Select value={duration} onValueChange={handleDurationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d} value={d}>{d} hr{parseFloat(d) !== 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            Ends at: <span className="font-medium text-slate-700">{formData.endTime}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Pickup Location</Label>
            <Select value={formData.locationType || 'Home'} onValueChange={(v) => {
              handleChange('locationType', v);
              if (v !== 'Other') {
                handleChange('location', v);
              } else {
                handleChange('location', '');
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="School">School</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {(formData.locationType === 'Other') && (
              <Input
                className="mt-2"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter pickup address"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingLesson && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="mr-auto"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !formData.pupilId || !formData.date} 
            className="bg-teal-600 hover:bg-teal-700 gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {existingLesson ? 'Update' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}