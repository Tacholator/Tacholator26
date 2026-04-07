import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdminSupportMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [replies, setReplies] = useState({});
  const [saving, setSaving] = useState(null);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['allSupportMessages'],
    queryFn: () => base44.entities.SupportMessage.list('-created_date', 100)
  });

  const openMessages = messages.filter(m => m.status === 'open');
  const resolvedMessages = messages.filter(m => m.status === 'resolved');

  const handleResolve = async (msg) => {
    setSaving(msg.id);
    await base44.entities.SupportMessage.update(msg.id, {
      status: 'resolved',
      adminReply: replies[msg.id] || msg.adminReply || '',
      repliedAt: new Date().toISOString()
    });
    refetch();
    toast({ title: 'Resolved', description: 'Message marked as resolved.' });
    setSaving(null);
  };

  const handleSaveReply = async (msg) => {
    if (!replies[msg.id]?.trim()) return;
    setSaving(msg.id);
    await base44.entities.SupportMessage.update(msg.id, {
      adminReply: replies[msg.id].trim(),
      repliedAt: new Date().toISOString()
    });
    refetch();
    toast({ title: 'Reply saved' });
    setSaving(null);
  };

  const MessageCard = ({ msg }) => {
    const isExpanded = expandedId === msg.id;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          className="w-full flex items-start gap-3 p-4 text-left"
          onClick={() => setExpandedId(isExpanded ? null : msg.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#071739] text-sm">{msg.subject}</span>
              <Badge className={msg.status === 'resolved' ? 'bg-green-100 text-green-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
                {msg.status === 'resolved' ? 'Resolved' : 'Open'}
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 text-xs capitalize">{msg.userRole}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{msg.userName || msg.userEmail} · {new Date(msg.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
            <p className="text-sm text-slate-700">{msg.message}</p>

            {msg.adminReply && (
              <div className="bg-[#071739]/5 rounded-lg p-3 border-l-4 border-[#F7B602]">
                <p className="text-xs font-semibold text-[#071739] mb-1">Your reply</p>
                <p className="text-sm text-slate-700">{msg.adminReply}</p>
              </div>
            )}

            <Textarea
              placeholder="Write a reply to the user..."
              rows={3}
              value={replies[msg.id] ?? msg.adminReply ?? ''}
              onChange={e => setReplies(r => ({ ...r, [msg.id]: e.target.value }))}
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveReply(msg)}
                disabled={saving === msg.id}
                className="flex-1"
              >
                Save Reply
              </Button>
              {msg.status === 'open' && (
                <Button
                  size="sm"
                  onClick={() => handleResolve(msg)}
                  disabled={saving === msg.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Resolved
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
          <HeadphonesIcon className="w-5 h-5 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#071739]">Support Messages</h1>
          <p className="text-sm text-slate-500">{openMessages.length} open · {resolvedMessages.length} resolved</p>
        </div>
      </div>

      {openMessages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-[#071739] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Open ({openMessages.length})
          </h2>
          {openMessages.map(msg => <MessageCard key={msg.id} msg={msg} />)}
        </div>
      )}

      {resolvedMessages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Resolved ({resolvedMessages.length})
          </h2>
          {resolvedMessages.map(msg => <MessageCard key={msg.id} msg={msg} />)}
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <HeadphonesIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No support messages yet</p>
        </div>
      )}
    </div>
  );
}