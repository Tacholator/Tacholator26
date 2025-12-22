import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function LessonTermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('LearnerDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-teal-600" />
              <CardTitle className="text-2xl">Lesson Terms & Conditions</CardTitle>
            </div>
            <p className="text-sm text-slate-500 mt-2">Mobrage Driving Academy</p>
          </CardHeader>
          <CardContent className="p-6 prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              These Lesson Terms & Conditions govern the booking, cancellation, and delivery of driving lessons booked through the Mobrage platform. By booking a lesson, pupils agree to the terms below.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">1. Booking Lessons</h3>
            <p className="text-slate-700 mb-2"><strong>1.1</strong> All lessons must be booked through the Mobrage application using the Book a Lesson feature.</p>
            <p className="text-slate-700 mb-2"><strong>1.2</strong> Lessons can only be booked in time slots made available by the instructor.</p>
            <p className="text-slate-700 mb-2"><strong>1.3</strong> When a pupil selects a lesson slot, the booking will initially be marked as Pending until confirmed by the instructor.</p>
            <p className="text-slate-700 mb-2"><strong>1.4</strong> A lesson is only considered confirmed once the instructor approves the booking.</p>
            <p className="text-slate-700 mb-4"><strong>1.5</strong> Mobrage reserves the right to refuse or cancel bookings where system misuse or abuse is detected.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">2. Lesson Duration & Charges</h3>
            <p className="text-slate-700 mb-2"><strong>2.1</strong> Lessons are booked in fixed time blocks (e.g. 1 hour, 1.5 hours, 2 hours).</p>
            <p className="text-slate-700 mb-2"><strong>2.2</strong> Lesson prices are calculated based on the lesson duration and the instructor's hourly rate at the time of booking.</p>
            <p className="text-slate-700 mb-4"><strong>2.3</strong> The rate applied at the time of booking will remain fixed for that lesson, even if prices change later.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">3. Cancellation by the Pupil</h3>
            <p className="text-slate-700 mb-2"><strong>3.1 Cancellation with 48 Hours or More Notice</strong></p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Pupils may cancel a confirmed lesson 48 hours or more before the scheduled start time.</li>
              <li>No charge will be applied.</li>
              <li>Any prepaid hours or balance will remain unchanged.</li>
            </ul>

            <p className="text-slate-700 mb-2"><strong>3.2 Late Cancellation (Less Than 48 Hours)</strong></p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>If a pupil cancels a lesson less than 48 hours before the scheduled start time, the full lesson price will be deducted.</li>
              <li>This applies whether the deduction is taken as monetary balance or prepaid lesson hours.</li>
              <li>A confirmation message will be shown before the cancellation is completed.</li>
            </ul>

            <p className="text-slate-700 mb-2"><strong>3.3 No-Shows</strong></p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>If a pupil fails to attend a lesson without cancelling, this will be treated as a late cancellation.</li>
              <li>The full lesson charge will be deducted.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">4. Cancellation by the Instructor</h3>
            <p className="text-slate-700 mb-2"><strong>4.1</strong> Instructors may cancel lessons due to illness, vehicle issues, or unforeseen circumstances.</p>
            <p className="text-slate-700 mb-2"><strong>4.2</strong> Where an instructor cancels a lesson, no charge will be applied to the pupil and any deducted balance (if applicable) will be refunded or restored.</p>
            <p className="text-slate-700 mb-4"><strong>4.3</strong> Pupils will be notified promptly via the app.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">5. Changes to Bookings</h3>
            <p className="text-slate-700 mb-2"><strong>5.1</strong> Booking times cannot be modified once confirmed; instead, the lesson must be cancelled and rebooked.</p>
            <p className="text-slate-700 mb-4"><strong>5.2</strong> Any change is subject to availability and the cancellation rules outlined above.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">6. Instructor Availability & Time Slots</h3>
            <p className="text-slate-700 mb-2"><strong>6.1</strong> Instructors control their availability through the calendar system, including working hours, lunch breaks, and unavailable periods.</p>
            <p className="text-slate-700 mb-2"><strong>6.2</strong> Pupils can only book lessons within published available slots.</p>
            <p className="text-slate-700 mb-4"><strong>6.3</strong> Mobrage is not responsible if a pupil is unable to book a preferred time due to limited availability.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">7. Punctuality</h3>
            <p className="text-slate-700 mb-2"><strong>7.1</strong> Pupils must be ready at the agreed location at the scheduled lesson start time.</p>
            <p className="text-slate-700 mb-2"><strong>7.2</strong> Late arrival by the pupil may result in reduced lesson time without refund.</p>
            <p className="text-slate-700 mb-4"><strong>7.3</strong> Instructors will make reasonable efforts to arrive on time; unavoidable delays will be communicated where possible.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">8. Fitness to Drive</h3>
            <p className="text-slate-700 mb-2"><strong>8.1</strong> Pupils must be fit to drive at the time of the lesson.</p>
            <p className="text-slate-700 mb-2"><strong>8.2</strong> Lessons may be refused or terminated if a pupil is under the influence of alcohol/drugs or is unwell or otherwise unsafe to drive.</p>
            <p className="text-slate-700 mb-4"><strong>8.3</strong> In such cases, the lesson may be charged in full at the instructor's discretion.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">9. Use of the Platform</h3>
            <p className="text-slate-700 mb-2"><strong>9.1</strong> Mobrage provides the booking and scheduling platform but lessons are delivered by independent instructors.</p>
            <p className="text-slate-700 mb-2"><strong>9.2</strong> Pupils are responsible for ensuring their account information is accurate and up to date.</p>
            <p className="text-slate-700 mb-4"><strong>9.3</strong> Misuse of the booking system may result in account suspension.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">10. Agreement</h3>
            <p className="text-slate-700">
              By booking a lesson through Mobrage, pupils confirm that they have read and understood these Lesson Terms & Conditions, agree to the cancellation and charging rules, and accept responsibility for attending lessons as booked.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}