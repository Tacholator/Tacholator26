import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export default function AdminGpsRouteAccess() {
  const queryClient = useQueryClient();

  const { data: instructors = [] } = useQuery({
    queryKey: ['allInstructors'],
    queryFn: () => base44.entities.Instructor.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const [updating, setUpdating] = useState({});

  const handleToggle = async (instructor, value) => {
    setUpdating(prev => ({ ...prev, [instructor.id]: true }));
    await base44.entities.Instructor.update(instructor.id, { gpsRoutesAccessEnabled: value });
    queryClient.invalidateQueries({ queryKey: ['allInstructors'] });
    setUpdating(prev => ({ ...prev, [instructor.id]: false }));
  };

  const getUserEmail = (instructor) => {
    const u = users.find(u => u.id === instructor.created_by);
    return u?.email || instructor.created_by;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#F7B602]/10 rounded-xl">
          <Users className="w-6 h-6 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#071739]">GPS Route Access</h1>
          <p className="text-sm text-slate-500">Manage instructor access to GPS Routes</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Instructor Access</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">Toggle to grant or revoke access to the GPS Routes section for each instructor.</p>
      <div className="space-y-3">
        {instructors.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">No instructors found.</p>
        )}
        {instructors.map(instructor => {
          const enabled = instructor.gpsRoutesAccessEnabled || false;
          return (
            <div key={instructor.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center text-white font-bold text-sm">
                  {instructor.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-[#071739]">{instructor.name}</p>
                  <p className="text-xs text-slate-400">{getUserEmail(instructor)}</p>
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