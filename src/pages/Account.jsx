import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AccountProfilePanel from '@/components/account/AccountProfilePanel';

export default function Account() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isInstructor = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto">
        <div className="px-4 pt-6 pb-3">
          <h1 className="text-2xl font-bold text-[#071739]">Account</h1>
        </div>
        <div className="bg-white border-t border-slate-200 min-h-[70vh]">
          <AccountProfilePanel
            user={user}
            isInstructor={isInstructor}
            onLogout={() => base44.auth.logout()}
            onDelete={() => {}}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}