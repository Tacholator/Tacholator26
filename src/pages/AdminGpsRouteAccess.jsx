import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPin, User } from 'lucide-react';

export default function AdminGpsRouteAccess() {
  const [updating, setUpdating] = useState({});

  const { data: instructors = [], refetch } = useQuery({
    queryKey: ['allInstructors'],
    queryFn: () => base44.entities.Instructor.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const handleToggle = async (instructor, value) => {
    setUpdating(prev => ({ ...prev, [instructor.id]: true }));
    await base44.entities.Instructor.update(instructor.id, { gpsRoutesAccessEnabled: value });
    await refetch();
    setUpdating(prev => ({ ...prev, [instructor.id]: false }));
  };

  const getUserForInstructor = (instructor) => {
    return users.find(u => u.id === instructor.created_by);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#F7B602]/10 rounded-xl">
          <MapPin className="w-6 h-6 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071739]">GPS Routes Access</h1>
          <p className="text-sm text-slate-500">Control which instructors can see the GPS Routes section</p>
        </div>
      </div>

      <div className="space-y-3">
        {instructors.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No instructors found.</p>
        )}
        {instructors.map(instructor => {
          const user = getUserForInstructor(instructor);
          const enabled = instructor.gpsRoutesAccessEnabled || false;
          return (
            <div key={instructor.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center text-white font-bold text-sm">
                  {instructor.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-[#071739]">{instructor.name}</p>
                  <p className="text-xs text-slate-400">{user?.email || instructor.created_by}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={enabled ? 'bg-green-100 text-green-700 border-0' : 'bg-slate-100 text-slate-500 border-0'}>
                  {enabled ? 'Access granted' : 'No access'}
                </Badge>
                <Switch
                  checked={enabled}
                  onCheckedChange={(val) => handleToggle(instructor, val)}
                  disabled={!!updating[instructor.id]}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}