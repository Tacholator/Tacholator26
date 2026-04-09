import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, MapPin, ChevronRight } from 'lucide-react';

const cards = [
  {
    title: 'Test Route Videos',
    description: 'Watch walkthroughs of local driving test routes to prepare for your practical test.',
    icon: MapPin,
    instructorPage: '/InstructorTestRoutes',
    learnerPage: '/LearnerTestRoutes',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100'
  }
];

export default function TestReadiness() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['trPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id
  });

  const isInstructor = user?.role === 'admin';
  const testRoutesAccessEnabled = pupilProfile?.testRoutesAccessEnabled || false;

  const handleCardClick = (card) => {
    const page = isInstructor ? card.instructorPage : card.learnerPage;
    navigate(page);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-[#F7B602]/20 p-2 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-[#F7B602]" />
            </div>
            <h1 className="text-2xl font-bold text-[#071739]">Test Readiness</h1>
          </div>
          <p className="text-slate-500 ml-14">Everything you need to prepare for your driving test.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            // For learners, only show Test Route Videos if they have access
            if (!isInstructor && card.learnerPage === '/LearnerTestRoutes' && !testRoutesAccessEnabled) {
              return null;
            }

            return (
              <Card
                key={card.title}
                onClick={() => handleCardClick(card)}
                className={`cursor-pointer border-2 hover:shadow-md transition-all duration-200 ${card.color}`}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${card.iconBg}`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#071739]">{card.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5 leading-snug">{card.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </CardContent>
              </Card>
            );
          })}

          {/* Placeholder card for upcoming features */}
          <Card className="border-2 border-dashed border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl shrink-0 bg-slate-100">
                <ClipboardCheck className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-400">More Coming Soon</p>
                <p className="text-sm text-slate-400 mt-0.5">Additional readiness tools are on the way.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}