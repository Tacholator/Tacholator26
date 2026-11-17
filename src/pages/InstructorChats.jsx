import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getUserDisplayName } from '@/lib/userName';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import ConversationList from '@/components/chat/ConversationList';
import ChatThread from '@/components/chat/ChatThread';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function InstructorChats() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showPupilSelector, setShowPupilSelector] = useState(false);
  const [pupilSearchQuery, setPupilSearchQuery] = useState('');
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
    queryKey: ['pupils', user?.id],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: user.id }),
    enabled: !!user?.id
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

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId) => {
      const messagesToDelete = allMessages.filter(m => m.conversationId === conversationId);
      for (const msg of messagesToDelete) {
        await base44.entities.Message.delete(msg.id);
      }
      return conversationId;
    },
    onSuccess: () => {
      setSelectedConversation(null);
      queryClient.invalidateQueries(['messages']);
    }
  });

  // Build conversations from pupils and messages - only show if conversation has messages
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
  })
  .filter(conv => conv.lastMessageTime) // Only show conversations with messages
  .sort((a, b) => {
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
      senderId: user.id,
      senderRole: 'instructor',
      senderName: getUserDisplayName(user),
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

  const handleStartNewConversation = (pupil) => {
    const conversationId = `${pupil.id}_${user?.id}`;
    setSelectedConversation({
      conversationId,
      pupilId: pupil.id,
      pupilName: `${pupil.firstName} ${pupil.lastName}`
    });
    setShowPupilSelector(false);
    setPupilSearchQuery('');
  };

  // Filter pupils for search
  const filteredPupils = pupils.filter(pupil => {
    const fullName = `${pupil.firstName} ${pupil.lastName}`.toLowerCase();
    return fullName.includes(pupilSearchQuery.toLowerCase());
  });

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    if (!window.confirm('Are you sure you want to delete this conversation? This will delete all messages.')) return;
    
    await deleteConversationMutation.mutateAsync(selectedConversation.conversationId);
  };

  // Mobile view: show either list or chat
  if (isMobileView) {
    return (
      <div className="fixed inset-0 top-16 bottom-16 bg-white overflow-hidden">
        {!selectedConversation ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <h1 className="text-xl font-bold text-[#071739]">Pupil Chats</h1>
              <Button
                onClick={() => setShowPupilSelector(true)}
                size="icon"
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] rounded-full h-10 w-10"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.conversationId}
              onSelectConversation={setSelectedConversation}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteConversation}
                className="h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Conversations</h2>
              <Button
                onClick={() => setShowPupilSelector(true)}
                size="icon"
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] rounded-full h-8 w-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.conversationId}
              onSelectConversation={setSelectedConversation}
            />
          </div>

          <div className="flex-1 bg-slate-50 flex flex-col">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">
                {selectedConversation?.pupilName || 'Select a conversation'}
              </h3>
              {selectedConversation && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteConversation}
                  className="h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatThread
                conversation={selectedConversation}
                messages={selectedMessages}
                currentUserRole="instructor"
                onSendMessage={handleSendMessage}
                isSending={createMessageMutation.isPending}
                hideHeader={true}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Pupil Selector Dialog */}
      <Dialog open={showPupilSelector} onOpenChange={setShowPupilSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select a pupil to start chatting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search pupils..."
              value={pupilSearchQuery}
              onChange={(e) => setPupilSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredPupils.map((pupil) => (
                  <button
                    key={pupil.id}
                    onClick={() => handleStartNewConversation(pupil)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-[#F7B602]/20"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-[#F7B602]/20 text-[#071739]">
                        {pupil.firstName?.[0]}{pupil.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm text-slate-900">
                        {pupil.firstName} {pupil.lastName}
                      </p>
                      {pupil.email && (
                        <p className="text-xs text-slate-500">{pupil.email}</p>
                      )}
                    </div>
                  </button>
                ))}
                {filteredPupils.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-8">
                    No pupils found
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}