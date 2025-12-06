import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, MessageCircle, Calendar, ClipboardList, BookOpen, CheckCheck } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const typeIcons = {
  message: MessageCircle,
  booking: Calendar,
  homework: ClipboardList,
  skill: BookOpen,
  system: Bell,
  payment: Bell
};

export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ userId }, '-created_date', 50),
    enabled: !!userId,
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { readAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', userId]);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.readAt);
      await Promise.all(
        unread.map(n => base44.entities.Notification.update(n.id, { readAt: new Date().toISOString() }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', userId]);
    }
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleNotificationClick = (notification) => {
    if (!notification.readAt) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.linkTarget) {
      const url = notification.linkParams 
        ? `${createPageUrl(notification.linkTarget)}?${notification.linkParams}`
        : createPageUrl(notification.linkTarget);
      navigate(url);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-600 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-teal-600 hover:text-teal-700"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const isUnread = !notification.readAt;
                
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      isUnread ? 'bg-teal-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 ${isUnread ? 'text-teal-600' : 'text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-1 ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mb-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400">
                          {moment(notification.created_date).fromNow()}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="mt-1">
                          <div className="w-2 h-2 bg-teal-600 rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}