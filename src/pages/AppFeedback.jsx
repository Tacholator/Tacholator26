import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquarePlus, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'ui_ux', label: 'UI / Design' },
  { value: 'performance', label: 'Performance' }
];

export default function AppFeedback() {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState('general');
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['feedbackPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return res[0] || null;
    },
    enabled: !!user?.id
  });

  const userRole = (!pupilProfile && user?.role === 'admin') ? 'instructor' : 'learner';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || rating === 0) return;
    setSending(true);
    await base44.entities.AppFeedback.create({
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name || user.email,
      userRole,
      rating,
      category,
      feedback: feedback.trim()
    });
    setSubmitted(true);
    toast({ title: 'Thanks for your feedback!', description: 'We really appreciate it.' });
    setSending(false);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-[#F7B602]/20 flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-[#F7B602] fill-[#F7B602]" />
        </div>
        <h2 className="text-xl font-bold text-[#071739] mb-2">Thank you!</h2>
        <p className="text-slate-500 mb-6">Your feedback helps us improve Tacholator for everyone.</p>
        <Button variant="outline" onClick={() => { setSubmitted(false); setRating(0); setFeedback(''); setCategory('general'); }}>
          Send more feedback
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
          <MessageSquarePlus className="w-5 h-5 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#071739]">App Feedback</h1>
          <p className="text-sm text-slate-500">Help us make Tacholator better</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating */}
          <div>
            <p className="text-sm font-medium text-[#071739] mb-2">How would you rate your experience?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hovered || rating)
                        ? 'text-[#F7B602] fill-[#F7B602]'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-sm font-medium text-[#071739] mb-2">Category</p>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-sm font-medium text-[#071739] mb-2">Your feedback</p>
            <Textarea
              placeholder="Tell us what you think, what could be better, or report a bug..."
              rows={5}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={sending || !feedback.trim() || rating === 0}
            className="bg-[#071739] text-white hover:bg-[#0a2050] w-full"
          >
            {sending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </div>
    </div>
  );
}