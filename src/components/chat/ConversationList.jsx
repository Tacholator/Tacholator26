import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle } from 'lucide-react';
import moment from 'moment';

export default function ConversationList({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation 
}) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm">No conversations yet</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => {
          const isSelected = conv.conversationId === selectedConversationId;
          const hasUnread = conv.unreadCount > 0;
          
          return (
            <button
              key={conv.conversationId}
              onClick={() => onSelectConversation(conv)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isSelected 
                  ? 'bg-teal-50 border border-teal-200' 
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={`font-medium text-sm ${hasUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                  {conv.pupilName}
                </p>
                {hasUnread && (
                  <Badge className="bg-teal-600 text-white text-xs px-1.5 py-0">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
              {conv.lastMessage && (
                <p className={`text-xs ${hasUnread ? 'text-slate-600 font-medium' : 'text-slate-500'} truncate mb-1`}>
                  {conv.lastMessage}
                </p>
              )}
              {conv.lastMessageTime && (
                <p className="text-xs text-slate-400">
                  {moment(conv.lastMessageTime).fromNow()}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}