import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import CreateBookableSlotModal from '@/components/booking/CreateBookableSlotModal';
import moment from 'moment';

/**
 * Wraps CreateBookableSlotModal for use inside the pupil profile.
 * Handles the three onSave slot types (bookable slot, booking-for-pupil,
 * personal event) so the parent page stays clean.
 */
export default function PupilNewSlotModal({ open, onOpenChange, instructorId, defaultPupilId, defaultPickupLocation }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: open,
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['createSlotPupils', user?.id, user?.email, open],
    queryFn: async () => {
      if (!user?.id && !user?.email) return [];
      const [byId, byEmail] = await Promise.all([
        base44.entities.Pupil.filter({ instructorId: user.id }),
        base44.entities.Pupil.filter({ instructorEmail: user.email }),
      ]);
      const map = {};
      for (const p of [...byId, ...byEmail]) map[p.id] = p;
      return Object.values(map);
    },
    enabled: open,
  });

  const { data: slotInstances = [] } = useQuery({
    queryKey: ['pupilProfileSlotInstances', instructorId, open],
    queryFn: async () => {
      if (!instructorId) return [];
      const items = await base44.entities.BookableSlotInstance.filter({
        instructorId,
        status: 'available',
      });
      return items;
    },
    enabled: open && !!instructorId,
  });

  const handleSave = async (data) => {
    const instId = instructorId || user?.id;
    setIsSaving(true);
    try {
      if (data.slotType === 'personal') {
        await base44.entities.CalendarEvent.create({
          instructorId: instId,
          title: data.title,
          startAtUtc: data.startAtUtc,
          endAtUtc: data.endAtUtc,
          durationMinutes: data.durationMinutes,
          repeatType: data.repeatType || 'none',
          color: data.color || '#F7B602',
        });
        queryClient.invalidateQueries(['calendarEvents']);
        toast({ title: 'Personal event saved' });
      } else if (data.slotType === 'lesson_booking') {
        const pupil = pupils.find((p) => p.id === data.pupilId);
        const hourlyRate = pupil?.hourlyRate || 0;
        const totalPriceGbp = hourlyRate * data.durationHours;

        const newStart = moment(data.startAtUtc);
        const newEnd = moment(data.endAtUtc);

        const clashingBooking = await base44.entities.LessonBooking.filter({
          instructorId: instId,
          status: { $in: ['confirmed', 'in_progress', 'completed'] },
        });
        const clash = clashingBooking.find((b) => {
          if (b.isDeleted) return false;
          return newStart.isBefore(moment(b.endAtUtc)) && newEnd.isAfter(moment(b.startAtUtc));
        });
        if (clash) {
          throw new Error(
            `This time clashes with an existing lesson at ${moment(clash.startAtUtc).local().format('HH:mm')}.`
          );
        }

        const booking = await base44.entities.LessonBooking.create({
          instructorId: instId,
          pupilId: data.pupilId,
          slotInstanceId: data.slotInstanceId || undefined,
          startAtUtc: data.startAtUtc,
          endAtUtc: data.endAtUtc,
          durationHours: data.durationHours,
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          hourlyRateAtBookingGbp: hourlyRate,
          totalPriceGbp,
          isPracticalTest: data.isPracticalTest || false,
          practicalTestTime: data.isPracticalTest ? data.practicalTestTime : undefined,
        });

        if (data.slotInstanceId) {
          await base44.entities.BookableSlotInstance.update(data.slotInstanceId, {
            status: 'confirmed',
            bookingId: booking.id,
            reservedByPupilId: data.pupilId,
          });
        }

        await base44.entities.PaymentLedger.create({
          userId: data.pupilId,
          bookingId: booking.id,
          type: 'charge',
          reason: 'lesson_confirmed_charge',
          amountGbp: totalPriceGbp,
          hours: data.durationHours,
          createdByRole: 'instructor',
          note: 'Charge applied on confirmation',
        });

        if (pupil?.linkedUserId) {
          await base44.entities.Notification.create({
            userId: pupil.linkedUserId,
            title: 'Lesson Scheduled',
            message: `Your instructor has scheduled a lesson for ${moment(data.startAtUtc)
              .local()
              .format('D MMM')} at ${moment(data.startAtUtc).local().format('HH:mm')}.`,
            type: 'booking',
            linkTarget: 'LearnerCalendar',
          });
        }

        queryClient.invalidateQueries(['pupilConfirmedBookings', data.pupilId]);
        queryClient.invalidateQueries(['slotInstances']);
        toast({ title: 'Lesson scheduled for pupil' });
      } else {
        // Bookable available slot (single or recurring)
        const { slotId, title, startDate, startTime, endTime, repeatWeekly, selectedDays, stopDate } = data;

        if (slotId) {
          const startAtUtc = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
          const endAtUtc = moment(`${startDate} ${endTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
          await base44.entities.BookableSlotInstance.update(slotId, {
            startAtUtc,
            endAtUtc,
            title: title || undefined,
          });
        } else if (repeatWeekly) {
          const template = await base44.entities.BookableSlotTemplate.create({
            instructorId: instId,
            title: title || 'Available Slot',
            daysOfWeek: selectedDays,
            startTimeLocal: startTime,
            endTimeLocal: endTime,
            startDate,
            endDate: stopDate || null,
            isActive: true,
          });

          const instances = [];
          const start = moment(startDate);
          const end = stopDate ? moment(stopDate) : moment(startDate).add(12, 'weeks');
          while (start.isSameOrBefore(end)) {
            const dayOfWeek = start.format('ddd').toLowerCase();
            if (selectedDays.includes(dayOfWeek)) {
              const startAtUtc = moment(`${start.format('YYYY-MM-DD')} ${startTime}`, 'YYYY-MM-DD HH:mm')
                .utc()
                .toISOString();
              const endAtUtc = moment(`${start.format('YYYY-MM-DD')} ${endTime}`, 'YYYY-MM-DD HH:mm')
                .utc()
                .toISOString();
              instances.push({
                instructorId: instId,
                sourceTemplateId: template.id,
                startAtUtc,
                endAtUtc,
                status: 'available',
                title: title || 'Available Slot',
              });
            }
            start.add(1, 'day');
          }
          await base44.entities.BookableSlotInstance.bulkCreate(instances);
        } else {
          const startAtUtc = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
          const endAtUtc = moment(`${startDate} ${endTime}`, 'YYYY-MM-DD HH:mm').utc().toISOString();
          await base44.entities.BookableSlotInstance.create({
            instructorId: instId,
            startAtUtc,
            endAtUtc,
            status: 'available',
            title: title || 'Available Slot',
          });
        }

        queryClient.invalidateQueries(['slotInstances']);
        queryClient.invalidateQueries(['pupilProfileSlotInstances', instructorId]);
        toast({ title: 'Bookable slot created successfully' });
      }

      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CreateBookableSlotModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      isSaving={isSaving}
      slotInstances={slotInstances}
      defaultSlotType="lesson"
      defaultLessonMode="booking"
      defaultPupilId={defaultPupilId}
      defaultPickupLocation={defaultPickupLocation}
    />
  );
}