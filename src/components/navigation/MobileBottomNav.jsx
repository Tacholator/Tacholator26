import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  ClipboardList,
  MessageCircle,
  Bell
} from 'lucide-react';

const navItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    instructorPage: 'InstructorDashboard',
    learnerPage: 'LearnerDashboard'
  },
  {
    id: 'homework',
    label: 'Homework',
    icon: ClipboardList,
    instructorPage: 'HomeworkLibrary',
    learnerPage: 'LearnerHomework'
  },
  {
    id: 'chats',
    label: 'Chats',
    icon: MessageCircle,
    instructorPage: 'InstructorChats',
    learnerPage: 'LearnerChats'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    instructorPage: 'InstructorNotifications',
    learnerPage: 'LearnerNotifications',
    hasBadge: true
  }
];

export default function MobileBottomNav({ userId, currentPageName, isInstructor }) {
  const location = useLocation();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ userId, readAt: null }),
    enabled: !!userId
  });

  const unreadCount = notifications.length;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const targetPage = isInstructor ? item.instructorPage : item.learnerPage;
          const isActive = currentPageName === targetPage;

          return (
            <Link
              key={item.id}
              to={createPageUrl(targetPage)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                isActive 
                  ? 'text-teal-600' 
                  : 'text-slate-500 active:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.hasBadge && unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 px-1.5 bg-rose-500 text-white text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}