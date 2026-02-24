import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Info } from 'lucide-react';
import InstructorPayments from './InstructorPayments';

export default function AdminInstructorPayments() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const instructorId = searchParams.get('instructorId');
  const instructorName = searchParams.get('instructorName');

  if (!instructorId) {
    navigate(createPageUrl('AdminPaymentsHub'));
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Banner */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(createPageUrl('AdminPaymentsHub'))}
            className="inline-flex items-center gap-2 text-[#071739] hover:text-[#F7B602] mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Payments Hub</span>
          </button>
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="w-5 h-5" />
            <span className="font-medium">
              Admin view: {instructorName || 'Instructor'} payments
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Instructor Payments View */}
      <div className="p-6">
        <InstructorPayments adminProxyInstructorId={instructorId} />
      </div>
    </div>
  );
}