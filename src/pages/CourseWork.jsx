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
  { id: 11, title: 'Meeting Traffic' },
  { id: 12, title: 'Crossroads' },
  { id: 13, title: 'Roundabouts' },
  { id: 14, title: 'Dual Carriageways' },
  { id: 15, title: 'Country Roads' },
  { id: 16, title: 'Driving Conditions' },
  { id: 17, title: 'Traffic Lights' },
  { id: 18, title: 'Manoeuvres' },
  { id: 19, title: 'Emergency Stop' },
  { id: 20, title: 'Pedestrian Crossings' },
  { id: 21, title: 'Making Progress' },
  { id: 22, title: 'Planning Skills' },
  { id: 23, title: 'Independent Driving' },
  { id: 24, title: 'Show Me Tell Me' },
  { id: 25, title: 'Hazard Perception' },
  { id: 26, title: 'Eco-Safe Driving' },
  { id: 27, title: 'Test Preparation' }
];

const warmColors = [
  'bg-gradient-to-br from-amber-100 to-amber-200',
  'bg-gradient-to-br from-orange-100 to-orange-200',
  'bg-gradient-to-br from-red-100 to-red-200',
  'bg-gradient-to-br from-rose-100 to-rose-200',
  'bg-gradient-to-br from-yellow-100 to-yellow-200',
  'bg-gradient-to-br from-amber-50 to-orange-100',
  'bg-gradient-to-br from-peach-100 to-coral-100',
  'bg-gradient-to-br from-orange-50 to-amber-100',
  'bg-gradient-to-br from-red-50 to-rose-100',
  'bg-gradient-to-br from-rose-50 to-pink-100',
  'bg-gradient-to-br from-yellow-50 to-amber-100',
  'bg-gradient-to-br from-amber-200 to-orange-300',
  'bg-gradient-to-br from-orange-200 to-red-200',
  'bg-gradient-to-br from-red-200 to-rose-300',
  'bg-gradient-to-br from-rose-200 to-pink-200',
  'bg-gradient-to-br from-yellow-200 to-orange-200',
  'bg-gradient-to-br from-amber-100 to-yellow-200',
  'bg-gradient-to-br from-orange-100 to-amber-300',
  'bg-gradient-to-br from-red-100 to-orange-200',
  'bg-gradient-to-br from-rose-100 to-red-200',
  'bg-gradient-to-br from-yellow-100 to-orange-100',
  'bg-gradient-to-br from-amber-200 to-yellow-300',
  'bg-gradient-to-br from-orange-200 to-amber-200',
  'bg-gradient-to-br from-red-200 to-orange-300',
  'bg-gradient-to-br from-rose-200 to-red-300',
  'bg-gradient-to-br from-yellow-200 to-amber-300',
  'bg-gradient-to-br from-amber-300 to-orange-400'
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/40 to-yellow-50/50 p-6 lg:p-8">
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
              className={`${warmColors[index]} border-0 shadow-sm hover:shadow-md transition-all cursor-pointer aspect-square flex items-center justify-center hover:scale-105`}
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