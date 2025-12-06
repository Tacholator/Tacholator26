import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ConversationList from '@/components/chat/ConversationList';
import ChatThread from '@/components/chat/ChatThread';

export default function InstructorChats() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      return createNotificationIfAllowed(notificationData, false);
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

  const selectedMessages = selectedConversation
    ? allMessages.filter(m => m.conversationId === selectedConversation.conversationId).reverse()
    : [];

  // Mark messages as read and delivered when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = allMessages.filter(
        m => m.conversationId === selectedConversation.conversationId 
          && m.senderRole === 'pupil' 
          && !m.readAt
      );
      unreadMessages.forEach(msg => markAsReadMutation.mutate(msg.id));

      // Mark instructor's sent messages as delivered
      const undeliveredMessages = allMessages.filter(
        m => m.conversationId === selectedConversation.conversationId 
          && m.senderRole === 'instructor' 
          && m.status === 'sent'
      );
      undeliveredMessages.forEach(msg => markAsDeliveredMutation.mutate(msg.id));
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
      messageText,
      status: 'sent'
    };

    await createMessageMutation.mutateAsync(messageData);

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

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Mobile view: show either list or chat
  if (isMobileView) {
    return (
      <div className="fixed inset-0 top-16 bottom-16 bg-white overflow-hidden">
        {!selectedConversation ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-white">
              <h1 className="text-xl font-bold text-[#071739]">Pupil Chats</h1>
            </div>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.conversationId}
              onSelectConversation={setSelectedConversation}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-white flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="h-9 w-9"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-semibold text-[#071739]">{selectedConversation.pupilName}</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatThread
                conversation={selectedConversation}
                messages={selectedMessages}
                currentUserRole="instructor"
                onSendMessage={handleSendMessage}
                isSending={createMessageMutation.isPending}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop view: side-by-side
  return (
    <div className="h-screen lg:h-[calc(100vh-4rem)] bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto h-full">
        <h1 className="text-2xl font-bold text-[#071739] mb-6">Pupil Chats</h1>
        
        <Card className="h-[calc(100%-5rem)] flex overflow-hidden">
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