import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Calendar, Trash2, Sparkles, MapPin, CreditCard, Gift, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const adminCards = [
  {
    title: 'Role Management',
    description: 'Manage user roles and permissions',
    icon: Settings,
    page: 'AdminRoleManagement',
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Instructor Calendars',
    description: 'View and manage instructor calendars',
    icon: Calendar,
    page: 'AdminInstructorCalendars',
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Data Management',
    description: 'Manage application data',
    icon: Trash2,
    page: 'AdminDataManagement',
    color: 'from-rose-500 to-rose-600'
  },
  {
    title: 'Future Updates',
    description: 'View and manage upcoming features',
    icon: Sparkles,
    page: 'FutureUpdates',
    color: 'from-amber-500 to-amber-600'
  },
  {
    title: 'Test Route Configuration',
    description: 'Configure driving test routes',
    icon: MapPin,
    page: 'AdminTestRouteConfiguration',
    color: 'from-teal-500 to-teal-600'
  },
  {
    title: 'Payments',
    description: 'View instructor transactions & invoices',
    icon: CreditCard,
    page: 'AdminPaymentsHub',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    title: 'Learner Subscriptions',
    description: 'Manage learner subscription plans',
    icon: Gift,
    page: 'AdminSubscriptions',
    color: 'from-pink-500 to-pink-600',
    section: 'learner'
  },
  {
    title: 'Instructor Subscriptions',
    description: 'Manage instructor subscription plans',
    icon: Gift,
    page: 'AdminSubscriptions',
    color: 'from-violet-500 to-violet-600',
    section: 'instructor'
  },
  {
    title: 'User Management',
    description: 'View and manage instructors and learners',
    icon: Users,
    page: 'AdminUserManagement',
    color: 'from-indigo-500 to-indigo-600'
  }
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isMainAdmin = user?.email === 'fasobah@gmail.com';
  const filteredCards = adminCards.filter(card => 
    card.title !== 'Payments' || isMainAdmin
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739]">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage system settings and configurations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-t-4 border-[#F7B602] overflow-hidden group"
                onClick={() => navigate(createPageUrl(card.page) + (card.section ? `?section=${card.section}` : ''))}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-[#071739] group-hover:text-[#F7B602] transition-colors">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-[#F7B602] font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                    Open
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}