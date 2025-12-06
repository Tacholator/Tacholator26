import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function ChatThread({ 
  conversation,
  messages,
  currentUserRole,
  onSendMessage,
  isSending
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
      <div className="border-b p-4 bg-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{conversation.pupilName}</h3>
          {conversation.pupilId && (
            <Link 
              to={createPageUrl('PupilProfile') + '?pupilId=' + conversation.pupilId}
              className="text-xs text-teal-600 hover:underline"
            >
              View profile
            </Link>
          )}
        </div>
        <Avatar>
          <AvatarFallback className="bg-teal-100 text-teal-700">
            {conversation.pupilName?.[0] || 'P'}
          </AvatarFallback>
        </Avatar>
      </div>

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
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {moment(msg.created_date).format('MMM D, h:mm a')}
                  </p>
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
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send)"
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}