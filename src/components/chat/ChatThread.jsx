import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Check, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function ChatThread({ 
  conversation,
  messages,
  currentUserRole,
  onSendMessage,
  isSending,
  hideHeader = false
}) {
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || isSending) return;
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  // Enter key now creates new line - removed send on enter behavior

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      {!hideHeader && (
        <div className="border-b p-4 bg-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">
              {conversation.instructorName || conversation.pupilName}
            </h3>
            {conversation.pupilId && (
              <Link 
                to={createPageUrl('PupilProfile') + '?pupilId=' + conversation.pupilId}
                className="text-xs text-[#F7B602] hover:underline font-medium"
              >
                View profile
              </Link>
            )}
          </div>
          <Avatar>
            <AvatarFallback className="bg-[#F7B602]/20 text-[#071739] font-semibold">
              {(conversation.instructorName || conversation.pupilName)?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isCurrentUser = msg.senderRole === currentUserRole;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      isCurrentUser
                        ? 'bg-[#F7B602] text-[#071739]'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs text-slate-400 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{moment(msg.created_date).format('MMM D, h:mm a')}</span>
                    {isCurrentUser && (
                      msg.status === 'read' || msg.readAt ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#F7B602]" />
                      ) : msg.status === 'delivered' || msg.deliveredAt ? (
                        <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none max-h-[40vh] overflow-y-auto"
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}