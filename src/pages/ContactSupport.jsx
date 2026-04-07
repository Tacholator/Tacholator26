import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon, Send, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ContactSupport() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['supportPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return res[0] || null;
    },
    enabled: !!user?.id
  });

  const isInstructor = !pupilProfile && user?.role === 'admin';
  const userRole = isInstructor ? 'instructor' : 'learner';

  const { data: myMessages = [], refetch } = useQuery({
    queryKey: ['mySupportMessages', user?.id],
    queryFn: () => base44.entities.SupportMessage.filter({ userId: user.id }, '-created_date'),
    enabled: !!user?.id
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    await base44.entities.SupportMessage.create({
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name || user.email,
      userRole,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open'
    });
    setSubject('');
    setMessage('');
    refetch();
    toast({ title: 'Message sent', description: 'Our support team will get back to you soon.' });
    setSending(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
          <HeadphonesIcon className="w-5 h-5 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#071739]">Contact Support</h1>
          <p className="text-sm text-slate-500">We typically respond within 24 hours</p>
        </div>
      </div>

      {/* New message form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-[#071739] mb-4">Send a message</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
          <Textarea
            placeholder="Describe your issue or question..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            required
          />
          <Button
            type="submit"
            disabled={sending || !subject.trim() || !message.trim()}
            className="bg-[#071739] text-white hover:bg-[#0a2050] w-full gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </div>

      {/* Previous messages */}
      {myMessages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-[#071739]">Your previous messages</h2>
          {myMessages.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-[#071739] text-sm">{msg.subject}</p>
                <Badge className={msg.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {msg.status === 'resolved' ? <><CheckCircle className="w-3 h-3 mr-1" />Resolved</> : <><Clock className="w-3 h-3 mr-1" />Open</>}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">{msg.message}</p>
              {msg.adminReply && (
                <div className="bg-[#071739]/5 rounded-lg p-3 mt-2 border-l-4 border-[#F7B602]">
                  <p className="text-xs font-semibold text-[#071739] mb-1">Support reply</p>
                  <p className="text-sm text-slate-700">{msg.adminReply}</p>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-2">{new Date(msg.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}