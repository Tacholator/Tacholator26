import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const courseWorkItems = [
  { id: 1, title: 'Legal Responsibilities' },
  { id: 2, title: 'Safety Checks' },
  { id: 3, title: 'Vehicle Security' },
  { id: 4, title: 'Cockpit Procedures' },
  { id: 5, title: 'Main Car Controls' },
  { id: 6, title: 'Stopping Techniques' },
  { id: 7, title: 'Moving Off' },
  { id: 8, title: 'Use of Mirrors' },
  { id: 9, title: 'Signaling' },
  { id: 10, title: 'Junctions' },
  { id: 11, title: 'Use of Speed' },
  { id: 12, title: 'Meeting Traffic' },
  { id: 13, title: 'Crossroads' },
  { id: 14, title: 'Roundabouts' },
  { id: 15, title: 'Dual Carriageways' },
  { id: 16, title: 'Country Roads' },
  { id: 17, title: 'Driving Conditions' },
  { id: 18, title: 'Traffic Lights' },
  { id: 19, title: 'Manoeuvres' },
  { id: 20, title: 'Emergency Stop' },
  { id: 21, title: 'Pedestrian Crossings' },
  { id: 22, title: 'Making Progress' },
  { id: 23, title: 'Planning Skills' },
  { id: 24, title: 'Independent Driving' },
  { id: 25, title: 'Show Me Tell Me' },
  { id: 26, title: 'Hazard Perception' },
  { id: 27, title: 'Eco-Safe Driving' },
  { id: 28, title: 'Test Preparation' }
];

const cardColors = [
  'bg-gradient-to-br from-blue-100 to-blue-200',
  'bg-gradient-to-br from-green-100 to-green-200',
  'bg-gradient-to-br from-purple-100 to-purple-200',
  'bg-gradient-to-br from-red-100 to-red-200',
  'bg-gradient-to-br from-indigo-100 to-indigo-200',
  'bg-gradient-to-br from-teal-100 to-teal-200',
  'bg-gradient-to-br from-pink-100 to-pink-200',
  'bg-gradient-to-br from-orange-100 to-orange-200',
  'bg-gradient-to-br from-cyan-100 to-cyan-200',
  'bg-gradient-to-br from-violet-100 to-violet-200',
  'bg-gradient-to-br from-emerald-100 to-emerald-200',
  'bg-gradient-to-br from-rose-100 to-rose-200',
  'bg-gradient-to-br from-sky-100 to-sky-200',
  'bg-gradient-to-br from-lime-100 to-lime-200',
  'bg-gradient-to-br from-fuchsia-100 to-fuchsia-200',
  'bg-gradient-to-br from-amber-100 to-amber-200',
  'bg-gradient-to-br from-slate-100 to-slate-200',
  'bg-gradient-to-br from-blue-200 to-cyan-200',
  'bg-gradient-to-br from-green-200 to-teal-200',
  'bg-gradient-to-br from-purple-200 to-pink-200',
  'bg-gradient-to-br from-red-200 to-orange-200',
  'bg-gradient-to-br from-indigo-200 to-blue-300',
  'bg-gradient-to-br from-teal-200 to-emerald-200',
  'bg-gradient-to-br from-pink-200 to-rose-200',
  'bg-gradient-to-br from-yellow-100 to-amber-200',
  'bg-gradient-to-br from-gray-100 to-gray-200',
  'bg-gradient-to-br from-cyan-200 to-sky-300'
];

export default function CourseWork() {
  const navigate = useNavigate();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleCardClick = (itemId) => {
    navigate(createPageUrl('CourseWorkDetail') + `?id=${itemId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-[#071739]" />
          <h1 className="text-3xl font-bold text-[#071739]">Course Work</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {courseWorkItems.map((item, index) => (
            <Card 
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              className={`${cardColors[index]} border-0 shadow-sm hover:shadow-md transition-all cursor-pointer aspect-square flex items-center justify-center hover:scale-105`}
            >
              <CardContent className="p-4 text-center w-full">
                <div className="text-3xl font-bold text-slate-700 mb-2">{item.id}</div>
                <div className="text-sm font-medium text-slate-600 leading-tight">{item.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}