import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { playNotificationSound } from '@/components/notifications/soundHelper';
import {
  Bell,
  MessageCircle,
  Calendar,
  ClipboardList,
  BookOpen,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';
import moment from 'moment';

const notificationIcons = {
  booking: Calendar,
  message: MessageCircle,
  lesson_arrival: Bell,
  homework: ClipboardList,
  skill: BookOpen,
  progress: TrendingUp,
  payment: CreditCard,
  system: AlertCircle,
};

export default function NotificationsList({ userId, isInstructor }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterUnread, setFilterUnread] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ userId }, '-created_date'),
    enabled: !!userId
  });

  const { data: preferences } = useQuery({
    queryKey: [isInstructor ? 'instructorPreferences' : 'learnerPreferences', userId],
    queryFn: async () => {
      const entityName = isInstructor ? 'InstructorNotificationPreferences' : 'LearnerNotificationPreferences';
      const userIdField = isInstructor ? 'instructorId' : 'learnerId';
      const prefs = await base44.entities[entityName].filter({ [userIdField]: userId });
      return prefs[0];
    },
    enabled: !!userId
  });

  // Play sound for new notifications
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.readAt);
    
    if (unreadNotifications.length > previousNotificationCount && previousNotificationCount > 0) {
      playNotificationSound(preferences);
    }
    
    setPreviousNotificationCount(unreadNotifications.length);
  }, [notifications, preferences]);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { readAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.readAt) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.linkTarget) {
      const url = notification.linkParams 
        ? `${createPageUrl(notification.linkTarget)}?${notification.linkParams}`
        : createPageUrl(notification.linkTarget);
      navigate(url);
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;
  const displayedNotifications = filterUnread 
    ? notifications.filter(n => !n.readAt) 
    : notifications;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {filterUnread ? 'Unread Notifications' : 'All Notifications'}
          </h2>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterUnread ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterUnread(!filterUnread)}
            className={filterUnread ? "bg-[#F7B602] text-[#071739] hover:bg-[#d99f02]" : ""}
          >
            {filterUnread ? 'Show All' : 'Unread Only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="gap-2"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {displayedNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">
            {filterUnread ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedNotifications.map((notification, index) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const isUnread = !notification.readAt;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isUnread ? 'bg-[#F7B602]/5 border-l-4 border-l-[#F7B602]' : 'bg-white'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isUnread ? 'bg-[#F7B602]/20' : 'bg-slate-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isUnread ? 'text-[#F7B602]' : 'text-slate-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-medium ${
                          isUnread ? 'text-slate-900' : 'text-slate-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <Badge className="bg-[#F7B602] text-[#071739] shrink-0 font-bold">New</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{moment(notification.created_date).fromNow()}</span>
                        {!isUnread && (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}