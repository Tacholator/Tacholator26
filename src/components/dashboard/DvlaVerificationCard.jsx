import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import moment from 'moment';

export default function DvlaVerificationCard({ pupils }) {
  const now = new Date();

  // Only show pupils with a valid (non-expired) DVLA code that hasn't been verified yet
  const pendingPupils = pupils.filter(p => {
    if (!p.dvlaCheckCode || p.instructorDvlaVerified) return false;
    if (p.dvlaExpiryDate && new Date(p.dvlaExpiryDate) < now) return false; // expired — handled by automated reminder
    return true;
  });

  if (pendingPupils.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          DVLA Verification Pending
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {pendingPupils.length} pupil{pendingPupils.length !== 1 ? 's have' : ' has'} submitted their DVLA details and need{pendingPupils.length === 1 ? 's' : ''} verification.
        </p>

        <div className="space-y-3">
          {pendingPupils.map(pupil => {
            const expiry = pupil.dvlaExpiryDate ? new Date(pupil.dvlaExpiryDate) : null;
            const isExpired = expiry && expiry < new Date();
            const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={pupil.id} className="bg-white/80 rounded-lg p-3 border border-blue-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {pupil.firstName} {pupil.lastName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Code: <span className="font-mono font-semibold text-slate-700">{pupil.dvlaCheckCode}</span>
                    {pupil.dvlaSubmissionDate && (
                      <span className="ml-2 text-slate-400">· {moment(pupil.dvlaSubmissionDate).fromNow()}</span>
                    )}
                  </p>
                  {expiry && (
                    <Badge className={isExpired ? 'bg-rose-100 text-rose-700 mt-1' : daysLeft <= 7 ? 'bg-amber-100 text-amber-700 mt-1' : 'bg-blue-100 text-blue-700 mt-1'}>
                      {isExpired ? 'Code expired' : `Valid ${daysLeft}d`}
                    </Badge>
                  )}
                </div>
                <Link to={`${createPageUrl('PupilProfile')}?id=${pupil.id}&tab=checks`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Verify
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}