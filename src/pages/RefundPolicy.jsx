import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt } from 'lucide-react';

export default function RefundPolicy() {
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
              <Receipt className="w-6 h-6 text-teal-600" />
              <CardTitle className="text-2xl">Refund Policy</CardTitle>
            </div>
            <p className="text-sm text-slate-500 mt-2">Mobrage Driving Academy</p>
          </CardHeader>
          <CardContent className="p-6 prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              This Refund Policy explains when refunds may be issued for driving lessons booked through the Mobrage platform.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">1. General Principles</h3>
            <p className="text-slate-700 mb-2"><strong>1.1</strong> Refunds are governed by lesson booking status, cancellation timing, and whether lessons were prepaid or paid per booking.</p>
            <p className="text-slate-700 mb-4"><strong>1.2</strong> Mobrage provides the booking platform; lessons are delivered by independent instructors.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">2. Lesson Cancellations by the Pupil</h3>
            <p className="text-slate-700 mb-2"><strong>2.1 Cancellation with 48 Hours or More Notice</strong></p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>If a pupil cancels 48 hours or more before the scheduled start time, the lesson is fully refundable.</li>
              <li>Any prepaid hours remain available.</li>
              <li>Any monetary charge already applied will be refunded or credited.</li>
            </ul>

            <p className="text-slate-700 mb-2"><strong>2.2 Late Cancellation (Less Than 48 Hours)</strong></p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>If a pupil cancels less than 48 hours before the scheduled start time, no refund will be issued.</li>
              <li>The full lesson price will be deducted (money balance or prepaid hours).</li>
            </ul>

            <p className="text-slate-700 mb-2"><strong>2.3 No-Shows</strong></p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Failure to attend without prior cancellation is treated as a late cancellation.</li>
              <li>No refund will be issued.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">3. Lesson Cancellations by the Instructor</h3>
            <p className="text-slate-700 mb-2"><strong>3.1</strong> If an instructor cancels a lesson, the pupil will receive a full refund or any deducted hours will be fully restored.</p>
            <p className="text-slate-700 mb-4"><strong>3.2</strong> Refunds/credits will be applied automatically once the cancellation is confirmed.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">4. Prepaid Lesson Blocks & Account Credit</h3>
            <p className="text-slate-700 mb-2"><strong>4.1</strong> Prepaid hours/account credit are non-transferable and may only be used for lessons booked through Mobrage.</p>
            <p className="text-slate-700 mb-2"><strong>4.2</strong> Refunds of unused prepaid hours may be considered where lessons cannot continue due to exceptional circumstances and are assessed case-by-case.</p>
            <p className="text-slate-700 mb-4"><strong>4.3</strong> Any discounts applied to block bookings may be recalculated if a refund is approved.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">5. Exceptional Circumstances</h3>
            <p className="text-slate-700 mb-2"><strong>5.1</strong> Refunds outside the standard policy may be considered in cases such as medical emergencies, extended instructor unavailability, or system errors.</p>
            <p className="text-slate-700 mb-4"><strong>5.2</strong> Supporting evidence may be requested.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">6. How Refunds Are Issued</h3>
            <p className="text-slate-700 mb-2"><strong>6.1</strong> Approved refunds may be issued to the original payment method or as account credit where appropriate.</p>
            <p className="text-slate-700 mb-4"><strong>6.2</strong> Refunds are typically processed within 5–10 working days (bank processing times may vary).</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">7. Disputes</h3>
            <p className="text-slate-700 mb-4"><strong>7.1</strong> If a pupil believes a refund has been incorrectly applied or denied, they should contact Mobrage support via the app.</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">8. Policy Updates</h3>
            <p className="text-slate-700"><strong>8.1</strong> Mobrage may update this policy. Changes will be communicated via the app and apply to future bookings only.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}