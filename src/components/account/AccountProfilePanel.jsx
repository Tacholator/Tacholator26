import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  FileText,
  Receipt,
  Shield,
  LogOut,
  Trash2,
  ChevronRight
} from 'lucide-react';

export default function AccountProfilePanel({ user, isInstructor, onLogout, onDelete, onClose }) {
  const [activeTab, setActiveTab] = useState('personal');
  const menuItems = [
    { icon: Settings, label: 'Profile Settings', page: 'ProfileSettings' },
    { icon: FileText, label: 'Lesson T&Cs', page: 'LessonTermsAndConditions' },
    { icon: Receipt, label: 'Refund Policy', page: 'RefundPolicy' },
    { icon: FileText, label: 'Terms & Conditions', page: 'TermsAndConditions' },
    { icon: Shield, label: 'Privacy Policy', page: 'PrivacyPolicy' }
  ];

  const userName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.full_name || user?.email;

  return (
    <div className="flex flex-col h-full">
      {/* Profile Card */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={user?.profilePhotoUrl} />
            <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] font-semibold">
              {user?.firstName?.[0] || user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#071739] truncate">{userName}</h3>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">{isInstructor ? 'Instructor' : 'Learner'}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors group"
            >
              <Icon className="w-5 h-5 group-hover:text-[#F7B602]" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start gap-3 text-slate-600 hover:text-slate-700"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
        <Button
          onClick={onDelete}
          variant="outline"
          className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}