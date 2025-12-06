import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import ChatThread from '@/components/chat/ChatThread';
import { MessageCircle } from 'lucide-react';

export default function LearnerChats() {
  const [conversationData, setConversationData] = useState(null);
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdParam = urlParams.get('conversationId');

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
    refetchInterval: 5000 // Poll every 5 seconds
  });

  const createMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => 
      base44.entities.Message.update(messageId, { readAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    }
  });

  const createNotificationMutation = useMutation({
    mutationFn: (notificationData) => base44.entities.Notification.create(notificationData)
  });

  // Set up conversation with instructor
  useEffect(() => {
    if (pupil && pupil.instructorId) {
      const conversationId = `${pupil.id}_${pupil.instructorId}`;
      setConversationData({
        conversationId,
        pupilId: pupil.id,
        pupilName: pupil.instructorName || 'Your Instructor',
        instructorId: pupil.instructorId
      });
    }
  }, [pupil]);

  // Get messages for conversation
  const messages = conversationData
    ? allMessages.filter(m => m.conversationId === conversationData.conversationId).reverse()
    : [];

  // Mark messages as read
  useEffect(() => {
    if (conversationData) {
      const unreadMessages = allMessages.filter(
        m => m.conversationId === conversationData.conversationId 
          && m.senderRole === 'instructor' 
          && !m.readAt
      );
      unreadMessages.forEach(msg => markAsReadMutation.mutate(msg.id));
    }
  }, [conversationData?.conversationId, allMessages.length]);

  const handleSendMessage = async (messageText) => {
    if (!conversationData || !user || !pupil) return;

    const messageData = {
      conversationId: conversationData.conversationId,
      instructorId: conversationData.instructorId,
      pupilId: pupil.id,
      senderRole: 'pupil',
      senderName: `${pupil.firstName} ${pupil.lastName}`,
      messageText
    };

    await createMessageMutation.mutateAsync(messageData);

    // Create notification for instructor (assuming instructorId is the user ID)
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
    <div className="h-screen lg:h-[calc(100vh-4rem)] bg-slate-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto h-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Chat with Instructor</h1>
        
        <Card className="h-[calc(100%-5rem)] overflow-hidden">
          <ChatThread
            conversation={conversationData}
            messages={messages}
            currentUserRole="pupil"
            onSendMessage={handleSendMessage}
            isSending={createMessageMutation.isPending}
          />
        </Card>
      </div>
    </div>
  );
}