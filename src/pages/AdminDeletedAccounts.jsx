import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, User, CalendarClock, FileText, UserX, GraduationCap } from 'lucide-react';

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const reasonLabel = (reason) => {
  const map = {
    no_longer_need: 'No longer need the service',
    found_alternative: 'Found an alternative',
    too_expensive: 'Too expensive',
    passed_test: 'Passed my driving test',
    privacy_concerns: 'Privacy concerns',
    poor_experience: 'Poor experience',
    other: 'Other',
  };
  return map[reason] || reason || '—';
};

function DeletionRow({ record }) {
  return (
    <Card className="border-t-4 border-t-[#071739]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#071739] text-[#F7B602] flex items-center justify-center font-bold shrink-0">
              {(record.userName || record.userEmail || '?')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base text-[#071739] truncate">
                {record.userName || 'Unknown'}
              </CardTitle>
              <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {record.userEmail || '—'}
              </p>
            </div>
          </div>
          <Badge
            className={
              record.status === 'resolved'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
            }
          >
            {record.status === 'resolved' ? 'Deleted' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <UserX className="w-4 h-4 text-[#F7B602] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Reason</p>
              <p className="font-medium text-[#071739]">{reasonLabel(record.reason)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarClock className="w-4 h-4 text-[#F7B602] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Date & Time</p>
              <p className="font-medium text-[#071739]">{formatDateTime(record.created_date)}</p>
            </div>
          </div>
        </div>
        {record.additionalInfo && (
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-[#F7B602] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Additional Info</p>
              <p className="text-sm text-slate-700 break-words">{record.additionalInfo}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GroupView({ records, emptyTitle, emptyDesc }) {
  if (!records.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center">
          <User className="w-10 h-10 text-slate-300 mb-3" />
          <p className="font-medium text-slate-600">{emptyTitle}</p>
          <p className="text-sm text-slate-400">{emptyDesc}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {records.map((r) => (
        <DeletionRow key={r.id} record={r} />
      ))}
    </div>
  );
}

export default function AdminDeletedAccounts() {
  const [tab, setTab] = useState('learner');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['adminDeletedAccounts'],
    queryFn: () => base44.entities.DeletionRequest.list('-created_date', 500),
  });

  const learners = records.filter((r) => r.role === 'learner');
  const instructors = records.filter((r) => r.role === 'instructor');

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#071739]">Deleted Accounts</h1>
          <p className="text-slate-600 mt-1">
            Audit log of accounts removed from the platform, grouped by role.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#071739] h-auto p-1.5">
            <TabsTrigger
              value="learner"
              className="data-[state=active]:bg-[#F7B602] data-[state=active]:text-[#071739] text-slate-200 rounded-md gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Learners
              <span className="ml-1 text-xs bg-[#F7B602] text-[#071739] font-bold px-1.5 py-0.5 rounded-full">
                {learners.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="instructor"
              className="data-[state=active]:bg-[#F7B602] data-[state=active]:text-[#071739] text-slate-200 rounded-md gap-2"
            >
              <User className="w-4 h-4" />
              Instructors
              <span className="ml-1 text-xs bg-[#F7B602] text-[#071739] font-bold px-1.5 py-0.5 rounded-full">
                {instructors.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learner" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : (
              <GroupView
                records={learners}
                emptyTitle="No deleted learners"
                emptyDesc="Deleted learner accounts will appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="instructor" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : (
              <GroupView
                records={instructors}
                emptyTitle="No deleted instructors"
                emptyDesc="Deleted instructor accounts will appear here."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}