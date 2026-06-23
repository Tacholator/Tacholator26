import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardList, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function TestReadinessCard({ pupilId }) {
  const { data: checks = [], isLoading } = useQuery({
    queryKey: ['myReadinessChecks', pupilId],
    queryFn: () => base44.entities.TestReadinessCheck.filter({ learner_id: pupilId }, '-created_date', 1),
    enabled: !!pupilId
  });

  const latest = checks[0];

  const resultConfig = {
    'Ready for Test': {
      badge: 'bg-emerald-500 text-white',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      message: 'You appear test ready. Continue following your instructor\'s final advice.'
    },
    'Almost Ready': {
      badge: 'bg-amber-500 text-white',
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      message: 'You are close. Review areas to strengthen and speak with your instructor.'
    },
    'Not Ready Yet': {
      badge: 'bg-rose-500 text-white',
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      message: 'You still need to meet the key readiness requirements before your test.'
    }
  };

  if (isLoading) return null;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#071739]" />
          Test Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {latest ? (
          <>
            <div className="flex items-center gap-2">
              {resultConfig[latest.readiness_result]?.icon}
              <Badge className={resultConfig[latest.readiness_result]?.badge || 'bg-slate-400 text-white'}>
                {latest.readiness_result}
              </Badge>
            </div>
            {latest.readiness_score != null && (
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Readiness Score</span>
                  <span className="font-semibold">{latest.readiness_score}/100</span>
                </div>
                <Progress value={latest.readiness_score} className="h-2" />
              </div>
            )}
            <p className="text-sm text-slate-600">{resultConfig[latest.readiness_result]?.message}</p>
            {latest.final_instructor_decision && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800">Instructor Decision: {latest.final_instructor_decision}</p>
                {latest.final_instructor_decision_notes && (
                  <p className="text-xs text-blue-700 mt-0.5">{latest.final_instructor_decision_notes}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">You haven't completed a readiness check yet.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('TestReadinessChecker')}>
            <Button className="w-full bg-[#071739] hover:bg-[#0d2a5e] text-white text-sm">
              {latest ? 'Take Another Check' : 'Check My Test Readiness'}
            </Button>
          </Link>
          <Link to={createPageUrl('ManageNerves')}>
            <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white text-sm">
              How to Manage Nerves
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}