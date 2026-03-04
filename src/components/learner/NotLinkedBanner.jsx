import React from 'react';
import { UserX } from 'lucide-react';

export default function NotLinkedBanner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <UserX className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          Your Account is Not Linked to an Instructor
        </h2>
        <p className="text-slate-500 text-base leading-relaxed">
          This section will become available once your instructor links your account. Please contact your instructor to get set up.
        </p>
      </div>
    </div>
  );
}