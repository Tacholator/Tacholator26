import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, MapPin, AlertCircle, User, MessageCircle, WalletMinimal } from 'lucide-react';
import moment from 'moment';

export default function PupilReserveLessonModal({ 
  open, 
  onOpenChange, 
  onReserve, 
  isSaving, 
  slotDateTime,
  slotInstance,
  hourlyRate 
}) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffSameAsPickup, setDropoffSameAsPickup] = useState(true);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [drivingExperience, setDrivingExperience] = useState('');
  const [transmissionType, setTransmissionType] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!user?.id
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', pupil?.instructorId],
    queryFn: async () => {
      if (!pupil?.instructorId) return null;
      const users = await base44.entities.User.filter({ id: pupil.instructorId });
      return users.length > 0 ? users[0] : null;
    },
    enabled: !!pupil?.instructorId
  });

  // Check if this is first booking (exclude deleted bookings)
  const { data: existingBookings = [] } = useQuery({
    queryKey: ['myBookings', pupil?.id],
    queryFn: async () => {
      const allBookings = await base44.entities.LessonBooking.filter({ pupilId: pupil.id });
      return allBookings.filter(b => !b.isDeleted);
    },
    enabled: !!pupil?.id
  });

  const isFirstBooking = existingBookings.length === 0;

  const handleReserve = () => {
    const dropoffFinal = dropoffSameAsPickup ? pickupLocation : dropoffLocation;
    
    onReserve({
      pickupLocation,
      dropoffLocation: dropoffFinal,
      notesFromPupil: notes,
      firstTimeData: isFirstBooking ? {
        drivingExperience,
        transmissionType
      } : null
    });
  };

  // Calculate slot details
  const slotStart = slotInstance ? moment(slotInstance.startAtUtc).local() : (slotDateTime ? moment(slotDateTime) : null);
  const slotEnd = slotInstance ? moment(slotInstance.endAtUtc).local() : null;
  const durationHours = slotEnd ? slotEnd.diff(slotStart, 'minutes') / 60 : 1;
  const totalPrice = (hourlyRate || 50) * durationHours;

  const isFormValid = pickupLocation.trim() !== '' && 
                      (!dropoffSameAsPickup ? dropoffLocation.trim() !== '' : true) &&
                      (isFirstBooking ? (drivingExperience !== '' && transmissionType !== '') : true) &&
                      agreeTerms;

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Request a Lesson</DialogTitle>
          <DialogDescription>
            Complete the form below to request this lesson slot
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Selected Slot Summary (Read-only) */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Selected Slot (Read-only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Date:</span>
                  <p className="font-medium text-slate-700">
                    {slotStart?.format('dddd, D MMMM YYYY')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Time:</span>
                  <p className="font-medium text-slate-700">
                    {slotStart?.format('HH:mm')} – {slotEnd?.format('HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span>
                  <p className="font-medium text-slate-700">{durationHours} hour{durationHours !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <span className="text-slate-500">Instructor:</span>
                  <p className="font-medium text-slate-700">
                    {instructor?.firstName && instructor?.lastName 
                      ? `${instructor.firstName} ${instructor.lastName}` 
                      : instructor?.full_name || instructor?.email}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Price:</span>
                  <span className="text-lg font-bold text-emerald-700">£{totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {pupil?.bulkPaymentBalance > 0 
                    ? 'May be deducted from your prepaid balance' 
                    : 'Charged upon instructor confirmation'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lesson Details
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup location *</Label>
              <Input
                id="pickup"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Enter pickup address or area"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="dropoff-same"
                checked={dropoffSameAsPickup}
                onCheckedChange={setDropoffSameAsPickup}
              />
              <label htmlFor="dropoff-same" className="text-sm text-slate-700 cursor-pointer">
                Drop-off location same as pickup
              </label>
            </div>

            {!dropoffSameAsPickup && (
              <div className="space-y-2">
                <Label htmlFor="dropoff">Drop-off location *</Label>
                <Input
                  id="dropoff"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Enter drop-off address or area"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for instructor (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any helpful details? (e.g., nervous driver, returning after a break, what you want to focus on)"
                rows={3}
              />
            </div>
          </div>

          {/* First-time Booking Questions */}
          {isFirstBooking && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4" />
                First-time Booking
              </h3>
              
              <div className="space-y-3">
                <Label>Driving experience *</Label>
                <RadioGroup value={drivingExperience} onValueChange={setDrivingExperience}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="exp-beginner" />
                    <label htmlFor="exp-beginner" className="text-sm cursor-pointer">
                      Beginner (never driven)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="some_experience" id="exp-some" />
                    <label htmlFor="exp-some" className="text-sm cursor-pointer">
                      Some experience
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nearly_test_ready" id="exp-test" />
                    <label htmlFor="exp-test" className="text-sm cursor-pointer">
                      Nearly test-ready
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Transmission type *</Label>
                <RadioGroup value={transmissionType} onValueChange={setTransmissionType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="trans-manual" />
                    <label htmlFor="trans-manual" className="text-sm cursor-pointer">
                      Manual
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="automatic" id="trans-auto" />
                    <label htmlFor="trans-auto" className="text-sm cursor-pointer">
                      Automatic
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Payment & Cancellation Info */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Payment & Cancellation
            </h3>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>This request will be marked as Pending until your instructor confirms it</li>
              <li>Free cancellation up to 48 hours before the lesson start time</li>
              <li>If you cancel within 48 hours (or do not attend), the full lesson price may be deducted</li>
            </ul>
            <div className="flex gap-3 text-xs pt-2 border-t border-slate-300">
              <Link to={createPageUrl('LessonTermsAndConditions')} className="text-teal-600 hover:underline">
                View full Lesson T&Cs
              </Link>
              <span className="text-slate-300">|</span>
              <Link to={createPageUrl('RefundPolicy')} className="text-teal-600 hover:underline">
                View Refund Policy
              </Link>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-2 border-t pt-4">
            <Checkbox
              id="agree-terms"
              checked={agreeTerms}
              onCheckedChange={setAgreeTerms}
            />
            <label htmlFor="agree-terms" className="text-sm text-slate-700 cursor-pointer leading-tight">
              I agree to the Lesson Terms & Conditions and understand the 48-hour cancellation policy *
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleReserve} 
            disabled={isSaving || !isFormValid}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
  );
}