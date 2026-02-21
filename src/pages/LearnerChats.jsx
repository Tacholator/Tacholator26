import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle } from 'lucide-react';
import ChatThread from '@/components/chat/ChatThread';

export default function LearnerChats() {
  const [conversationData, setConversationData] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['myPupilProfile', user?.id],
    queryFn: async () => {
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', pupil?.id],
    queryFn: () => base44.entities.Message.filter({ pupilId: pupil.id }, '-created_date'),
    enabled: !!pupil?.id,
    refetchInterval: 5000
  });

  const createMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => 
      base44.entities.Message.update(messageId, { 
        readAt: new Date().toISOString(),
        status: 'read'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    }
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: (messageId) => 
      base44.entities.Message.update(messageId, { 
        deliveredAt: new Date().toISOString(),
        status: 'delivered'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    }
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData) => {
      const { createNotificationIfAllowed } = await import('@/components/notifications/notificationHelper');
      return createNotificationIfAllowed(notificationData, true);
    }
  });

  useEffect(() => {
    if (pupil && pupil.instructorId) {
      const conversationId = `${pupil.id}_${pupil.instructorId}`;
      setConversationData({
        conversationId,
        pupilId: pupil.id,
        pupilName: pupil.instructorName || 'Your Instructor',
        instructorId: pupil.instructorId,
        instructorName: pupil.instructorName || 'Your Instructor'
      });
    }
  }, [pupil]);

  const messages = conversationData
    ? allMessages.filter(m => m.conversationId === conversationData.conversationId).reverse()
    : [];

  // Mark messages as read and delivered
  useEffect(() => {
    if (conversationData) {
      const unreadMessages = allMessages.filter(
        m => m.conversationId === conversationData.conversationId 
          && m.senderRole === 'instructor' 
          && !m.readAt
      );
      unreadMessages.forEach(msg => markAsReadMutation.mutate(msg.id));

      // Mark pupil's sent messages as delivered
      const undeliveredMessages = allMessages.filter(
        m => m.conversationId === conversationData.conversationId 
          && m.senderRole === 'pupil' 
          && m.status === 'sent'
      );
      undeliveredMessages.forEach(msg => markAsDeliveredMutation.mutate(msg.id));
    }
  }, [conversationData?.conversationId, allMessages.length]);

  const handleSendMessage = async (messageText) => {
    if (!conversationData || !user || !pupil) return;

    const messageData = {
      conversationId: conversationData.conversationId,
      instructorId: conversationData.instructorId,
      pupilId: pupil.id,
      senderId: user.id,
      senderRole: 'pupil',
      senderName: `${pupil.firstName} ${pupil.lastName}`,
      messageText,
      status: 'sent'
    };

    await createMessageMutation.mutateAsync(messageData);

    await createNotificationMutation.mutateAsync({
      userId: conversationData.instructorId,
      title: `New message from ${pupil.firstName} ${pupil.lastName}`,
      message: messageText.substring(0, 100),
      type: 'message',
      linkTarget: 'InstructorChats',
      linkParams: `conversationId=${conversationData.conversationId}`
    });
  };

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Loading your chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bottom-16 lg:relative lg:top-0 lg:bottom-0 lg:h-[calc(100vh-4rem)] bg-white lg:bg-slate-50 lg:p-4 lg:p-6 overflow-hidden">
      <div className="lg:max-w-4xl lg:mx-auto h-full flex flex-col">
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold text-[#071739]">
            Chat with {conversationData?.instructorName || 'Instructor'}
          </h1>
        </div>
        
        <div className="flex-1 lg:rounded-xl lg:border lg:shadow-sm lg:bg-white overflow-hidden">
          <ChatThread
            conversation={conversationData}
            messages={messages}
            currentUserRole="pupil"
            onSendMessage={handleSendMessage}
            isSending={createMessageMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}