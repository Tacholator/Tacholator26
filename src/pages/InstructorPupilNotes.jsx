import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Notebook, Search, ChevronRight, Loader2, StickyNote, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstructorPupilNotes() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupils = [], isLoading } = useQuery({
    queryKey: ['myPupils', user?.id],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const { data: allNotes = [] } = useQuery({
    queryKey: ['allNotes', user?.id],
    queryFn: () => base44.entities.Note.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const getAccessibleNotesCount = (pupilId) => {
    return allNotes.filter(note => 
      note.ownerPupilId === pupilId &&
      note.instructorAccessLevel === 'full'
    ).length;
  };

  const filteredPupils = pupils
    .filter(p => !searchQuery || 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(createPageUrl('InstructorTeachingHub'))}
            className="lg:hidden mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <h1 className="text-3xl font-bold text-[#071739] flex items-center gap-3">
            <Notebook className="w-8 h-8 text-[#F7B602]" />
            Pupil Notes
          </h1>
          <p className="text-slate-500 mt-1">View and add notes for your pupils (based on their permissions)</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search pupils..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredPupils.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Notebook className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No pupils found</h3>
              <p className="text-slate-500">Once pupils are linked to you, they will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPupils.map((pupil) => {
              const accessibleCount = getAccessibleNotesCount(pupil.id);
              
              return (
                <Card
                  key={pupil.id}
                  className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-[#F7B602]"
                  onClick={() => navigate(createPageUrl('InstructorPupilNotesList') + `?pupilId=${pupil.id}`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {pupil.firstName} {pupil.lastName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <StickyNote className="w-4 h-4" />
                        <span>{accessibleCount} accessible note{accessibleCount !== 1 ? 's' : ''}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}