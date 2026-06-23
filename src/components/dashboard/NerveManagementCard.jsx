import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, ChevronRight, AlertCircle } from 'lucide-react';
import { CONFIDENCE_OPTIONS } from '@/components/nerves/nerveData';

export default function NerveManagementCard({ pupilId }) {
  const { data: plan, isLoading } = useQuery({
    queryKey: ['nerveManagementCard', pupilId],
    queryFn: async () => {
      const results = await base44.entities.NerveManagementPlan.filter({ pupilId });
      return results[0] || null;
    },
    enabled: !!pupilId
  });

  const hasPlan = plan && (
    plan.nerve_confidence_rating > 0 ||
    plan.main_test_worries?.length > 0 ||
    plan.nerve_control_plan?.trim() ||
    plan.calm_plan?.trim() ||
    plan.checklist_items?.length > 0
  );

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-[#071739]">
          <Brain className="w-5 h-5 text-[#F7B602]" />
          Nerve Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : hasPlan ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Confidence:</span>
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                {plan.nerve_confidence_rating > 0
                  ? CONFIDENCE_OPTIONS.find(c => c.value === plan.nerve_confidence_rating)?.label || 'Not rated'
                  : 'Not rated'}
              </Badge>
            </div>
            {plan.main_test_worries?.length > 0 && (
              <div>
                <span className="text-sm text-slate-500">Main worry:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {plan.main_test_worries.slice(0, 3).map(w => (
                    <Badge key={w} variant="outline" className="text-xs">{w}</Badge>
                  ))}
                  {plan.main_test_worries.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{plan.main_test_worries.length - 3}</Badge>
                  )}
                </div>
              </div>
            )}
            {plan.instructorRecommendations && (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 text-xs">Instructor reviewed</Badge>
              </div>
            )}
            <Link to="/ManageNerves">
              <Button variant="outline" className="w-full text-sm border-[#071739] text-[#071739] hover:bg-[#071739] hover:text-white">
                Update My Nerve Plan
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500">
                You have not created a nerve management plan yet. Preparing your mind is part of preparing for your driving test.
              </p>
            </div>
            <Link to="/ManageNerves">
              <Button className="w-full bg-[#071739] hover:bg-[#0d2a5e] text-white text-sm">
                Create My Nerve Plan
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}