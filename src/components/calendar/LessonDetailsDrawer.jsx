import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MessageCircle, 
  Edit2, 
  Trash2, 
  CheckCircle,
  BookOpen,
  X
} from 'lucide-react';
import moment from 'moment';

export default function LessonDetailsDrawer({ 
  lesson, 
  pupil, 
  open, 
  onClose, 
  onEdit,
  onDelete,
  onMarkCompleted,
  currentUser 
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!lesson) return null;

  const isInstructor = currentUser?.role === 'admin';

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await base44.entities.Lesson.update(lesson.id, {
        status: 'Cancelled',
        notes: cancelReason ? `${lesson.notes || ''}\n\nCancellation reason: ${cancelReason}` : lesson.notes
      });
      
      queryClient.invalidateQueries(['lessons']);
      setShowCancelDialog(false);
      onClose();
    } catch (error) {
      console.error('Failed to cancel lesson:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkCompleted = () => {
    if (onMarkCompleted) {
      onMarkCompleted(lesson);
    }
    onClose();
  };

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-rose-100 text-rose-700'
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lesson Details</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={statusColors[lesson.status] || 'bg-slate-100 text-slate-700'}>
                {lesson.status}
              </Badge>
            </div>

            {/* Time & Date */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-700">Time</div>
                  <div className="text-slate-600">{lesson.startTime} – {lesson.endTime}</div>
                  <div className="text-sm text-slate-500">
                    {lesson.durationMinutes || 
                      Math.round(moment(lesson.endTime, 'HH:mm').diff(moment(lesson.startTime, 'HH:mm'), 'minutes'))} mins
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-700">Date</div>
                  <div className="text-slate-600">{moment(lesson.date).format('dddd, D MMMM YYYY')}</div>
                </div>
              </div>

              {isInstructor && pupil && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-700">Pupil</div>
                    <div className="text-slate-600">{pupil.firstName} {pupil.lastName}</div>
                  </div>
                </div>
              )}

              {lesson.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-700">Pickup Location</div>
                    <div className="text-slate-600">{lesson.location}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {lesson.notes && (
              <div>
                <div className="font-medium text-slate-700 mb-2">Notes</div>
                <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                  {lesson.notes}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              {isInstructor ? (
                <>
                  {lesson.status === 'Scheduled' && (
                    <>
                      <Button 
                        className="w-full bg-[#071739] hover:bg-[#071739]/90"
                        onClick={handleMarkCompleted}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete & Add Diary Entry
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          onEdit(lesson);
                          onClose();
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Lesson
                      </Button>
                    </>
                  )}

                  {lesson.status === 'Completed' && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(createPageUrl('PupilProfile') + `?id=${lesson.pupilId}&tab=diary`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Diary Entry
                    </Button>
                  )}

                  {pupil && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(createPageUrl('InstructorChats') + `?pupilId=${pupil.id}`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Pupil
                    </Button>
                  )}

                  {lesson.status !== 'Cancelled' && (
                    <Button 
                      variant="outline" 
                      className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Lesson
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {lesson.status === 'Scheduled' && (
                    <div className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3">
                      To reschedule or cancel this lesson, please contact your instructor.
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(createPageUrl('LearnerChats'))}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Instructor
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this lesson?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Reason (optional)
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Add a cancellation reason..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Lesson</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Lesson'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}