import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  Users,
  CalendarPlus,
  FileText,
  MessageCircle,
  GraduationCap,
  BookOpen
} from 'lucide-react';

const instructorNavItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    page: 'Home'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    page: 'InstructorBookingCalendar'
  },
  {
    id: 'pupils',
    label: 'Pupils',
    icon: Users,
    page: 'PupilList'
  },
  {
    id: 'teaching',
    label: 'My Teaching',
    icon: GraduationCap,
    page: 'InstructorTeachingHub'
  },
  {
    id: 'chats',
    label: 'Chats',
    icon: MessageCircle,
    page: 'InstructorChats'
  }
];

const pupilNavItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    page: 'Home'
  },
  {
    id: 'book',
    label: 'Book Lesson',
    icon: CalendarPlus,
    page: 'LearnerBookingCalendar'
  },
  {
    id: 'learning',
    label: 'My Learning',
    icon: BookOpen,
    page: 'LearnerLearningHub'
  },
  {
    id: 'chats',
    label: 'Chats',
    icon: MessageCircle,
    page: 'LearnerChats'
  }
];

export default function MobileBottomNav({ userId, currentPageName, isInstructor }) {
  // Fetch pupil status for learners
  const { data: pupilProfile } = useQuery({
    queryKey: ['learnerPupilProfile', userId],
    queryFn: async () => {
      if (isInstructor || !userId) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: userId });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!userId && !isInstructor
  });
  
  const pupilStatus = pupilProfile?.status || 'Active';
  
  // For non-active pupils, only show booking
  const navItems = isInstructor 
    ? instructorNavItems 
    : (pupilStatus !== 'Active' 
        ? pupilNavItems.filter(item => item.id === 'book')
        : pupilNavItems);

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', userId, isInstructor],
    queryFn: async () => {
      const messages = await base44.entities.Message.filter({ readAt: null });
      // Filter messages where current user is the receiver
      return messages.filter(msg => {
        if (isInstructor) {
          return msg.senderRole === 'pupil' && msg.instructorId === userId;
        } else {
          return msg.senderRole === 'instructor' && msg.pupilId === pupilProfile?.id;
        }
      });
    },
    enabled: !!userId && (isInstructor || !!pupilProfile?.id)
  });

  const unreadMessagesCount = unreadMessages.length;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#071739] border-t border-slate-700 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPageName === item.page || (item.id === 'home' && currentPageName === 'Home');

          return (
            <Link
              key={item.id}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                isActive 
                  ? 'text-[#F7B602]' 
                  : 'text-slate-300 active:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.id === 'chats' && unreadMessagesCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 px-1.5 bg-[#F7B602] text-[#071739] text-xs font-bold"
                  >
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 leading-tight whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}