import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Settings,
  UserCircle,
  FileText,
  Receipt,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Scale,
  ChevronDown,
  MapPin,
  MessageSquare,
  ThumbsUp,
  Users,
  Smartphone,
  HelpCircle
} from 'lucide-react';
import ProfileSettingsContent from './ProfileSettingsContent.jsx';

export default function AccountProfilePanel({ user, isInstructor, onLogout, onDelete, onClose }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [legalOpen, setLegalOpen] = useState(false);

  const menuItems = [
    { icon: UserCircle, label: 'My Account', page: 'ProfileSettings', component: 'profile', iconBg: 'bg-violet-500' },
    { icon: Settings, label: 'Settings', page: 'Settings', iconBg: 'bg-slate-500' },
  ];

  const quickLinks = [
    { icon: MessageSquare, label: 'Contact Support', page: 'ContactSupport', iconBg: 'bg-blue-500' },
    { icon: ThumbsUp, label: 'App Feedback', page: 'AppFeedback', iconBg: 'bg-green-500' },
  ];

  const legalItems = [
    { icon: FileText, label: 'Lesson T&Cs', page: 'LessonTermsAndConditions' },
    { icon: Receipt, label: 'Subscription T&Cs', page: 'SubscriptionTerms' },
    { icon: MapPin, label: 'Test Route T&Cs', page: 'TestRouteTerms' },
    { icon: Receipt, label: 'Refund Policy', page: 'RefundPolicy' },
    { icon: FileText, label: 'Terms & Conditions', page: 'TermsAndConditions' },
    { icon: Shield, label: 'Privacy Policy', page: 'PrivacyPolicy' },
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
            <button
              key={item.page}
              onClick={() => { window.location.href = createPageUrl(item.page); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg} shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Quick Links */}
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => { window.location.href = createPageUrl(item.page); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg} shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            if (isInstructor) {
              sessionStorage.setItem('openInstructorAppTour', '1');
            } else {
              sessionStorage.setItem('openAppTour', '1');
            }
            window.location.href = '/';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shrink-0">
            <HelpCircle className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium">App Tour</span>
        </button>

        <button
          onClick={() => { window.location.href = createPageUrl('ReferAFriend'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-pink-500 shrink-0">
            <Users className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium">Refer a Friend</span>
        </button>

        <a
          href={(() => {
            const ua = navigator.userAgent || '';
            const isIOS = /iPhone|iPad|iPod/i.test(ua);
            const isAndroid = /Android/i.test(ua);
            return isIOS
              ? 'https://apps.apple.com/app/tacholator/id6757146033'
              : isAndroid
              ? 'https://play.google.com/store/apps/details?id=app.base.mobragedrivingschoolced&pcampaignid=web_share'
              : 'https://apps.apple.com/app/tacholator/id6757146033';
          })()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500 shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium">Download our App</span>
        </a>

        {/* Legal Section */}
        <button
          onClick={() => setLegalOpen(!legalOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500 shrink-0">
            <Scale className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium flex-1 text-left">Legal</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${legalOpen ? 'rotate-180' : ''}`} />
        </button>
        {legalOpen && (
          <div className="pl-4 space-y-1">
            {legalItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => { window.location.href = createPageUrl(item.page); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors group"
                >
                  <Icon className="w-4 h-4 group-hover:text-[#F7B602]" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
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

      </div>
    </div>
  );
}