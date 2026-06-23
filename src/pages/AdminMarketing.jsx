import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Gift, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const REFERRAL_KEY = 'referral_program_enabled';

export default function AdminMarketing() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: referralSetting, isLoading } = useQuery({
    queryKey: ['appSetting', REFERRAL_KEY],
    queryFn: async () => {
      const results = await base44.entities.AppSetting.filter({ key: REFERRAL_KEY });
      return results[0] || null;
    },
  });

  const referralEnabled = referralSetting ? referralSetting.value !== false : true;

  const toggleMutation = useMutation({
    mutationFn: async (newValue) => {
      if (referralSetting) {
        return base44.entities.AppSetting.update(referralSetting.id, { value: newValue });
      } else {
        return base44.entities.AppSetting.create({
          key: REFERRAL_KEY,
          value: newValue,
          label: 'Refer a Friend Program',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSetting', REFERRAL_KEY] });
      toast({ title: 'Marketing setting updated' });
    },
    onError: () => toast({ title: 'Failed to update setting', variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#071739] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739]">Marketing</h1>
          <p className="text-slate-600 mt-2">Control promotional banners and popups shown to learners</p>
        </div>

        <Card className="border-t-4 border-[#F7B602]">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-[#071739]">Refer a Friend Program</CardTitle>
                <CardDescription className="text-slate-600">
                  Toggle the referral banner and popup shown to learners on their dashboard
                </CardDescription>
              </div>
              <Badge className={referralEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}>
                {referralEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="font-medium text-[#071739]">Show referral banner & popup</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {referralEnabled
                    ? 'Learners will see the referral banner and popup on their dashboard.'
                    : 'The referral banner and popup are hidden from all learners.'}
                </p>
              </div>
              <Switch
                checked={referralEnabled}
                disabled={isLoading || toggleMutation.isPending}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}