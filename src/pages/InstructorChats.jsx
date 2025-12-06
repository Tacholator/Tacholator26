import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import ConversationList from '@/components/chat/ConversationList';
import ChatThread from '@/components/chat/ChatThread';

export default function InstructorChats() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils'],
    queryFn: () => base44.entities.Pupil.list(),
    enabled: !!user
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: () => base44.entities.Message.filter({ instructorId: user.id }, '-created_date'),
    enabled: !!user?.id,
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
    mutationFn: async (notificationData) => {
      const { createNotificationIfAllowed } = await import('@/components/notifications/notificationHelper');
      return createNotificationIfAllowed(notificationData, false); // false = pupil is recipient
    }
  });

  // Build conversations from pupils and messages
  const conversations = pupils.map(pupil => {
    const conversationId = `${pupil.id}_${user?.id}`;
    const conversationMessages = allMessages.filter(m => m.conversationId === conversationId);
    const lastMessage = conversationMessages[0];
    const unreadMessages = conversationMessages.filter(m => m.senderRole === 'pupil' && !m.readAt);

    return {
      conversationId,
      pupilId: pupil.id,
      pupilName: `${pupil.firstName} ${pupil.lastName}`,
      lastMessage: lastMessage?.messageText,
      lastMessageTime: lastMessage?.created_date,
      unreadCount: unreadMessages.length
    };
  }).sort((a, b) => {
    if (!a.lastMessageTime) return 1;
    if (!b.lastMessageTime) return -1;
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
  });

  // Get messages for selected conversation
  const selectedMessages = selectedConversation
    ? allMessages.filter(m => m.conversationId === selectedConversation.conversationId).reverse()
    : [];

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = allMessages.filter(
        m => m.conversationId === selectedConversation.conversationId 
          && m.senderRole === 'pupil' 
          && !m.readAt
      );
      unreadMessages.forEach(msg => markAsReadMutation.mutate(msg.id));
    }
  }, [selectedConversation?.conversationId, allMessages.length]);

  const handleSendMessage = async (messageText) => {
    if (!selectedConversation || !user) return;

    const messageData = {
      conversationId: selectedConversation.conversationId,
      instructorId: user.id,
      pupilId: selectedConversation.pupilId,
      senderRole: 'instructor',
      senderName: user.full_name,
      messageText
    };

    await createMessageMutation.mutateAsync(messageData);

    // Create notification for pupil
    const pupil = pupils.find(p => p.id === selectedConversation.pupilId);
    if (pupil?.linkedUserId) {
      await createNotificationMutation.mutateAsync({
        userId: pupil.linkedUserId,
        title: 'New message from your instructor',
        message: messageText.substring(0, 100),
        type: 'message',
        linkTarget: 'LearnerChats',
        linkParams: `conversationId=${selectedConversation.conversationId}`
      });
    }
  };

  return (
    <div className="h-screen lg:h-[calc(100vh-4rem)] bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto h-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Pupil Chats</h1>
        
        <Card className="h-[calc(100%-5rem)] flex overflow-hidden">
          {/* Left Panel - Conversation List */}
          <div className="w-80 border-r bg-white">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-slate-700">Conversations</h2>
            </div>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.conversationId}
              onSelectConversation={setSelectedConversation}
            />
          </div>

          {/* Right Panel - Chat Thread */}
          <div className="flex-1 bg-slate-50">
            <ChatThread
              conversation={selectedConversation}
              messages={selectedMessages}
              currentUserRole="instructor"
              onSendMessage={handleSendMessage}
              isSending={createMessageMutation.isPending}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}