import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function NegativeBalancesCard({ pupils, isLoading }) {
  const negativePupils = (pupils || [])
    .filter(p => (p.bulkPaymentBalance || 0) < 0)
    .sort((a, b) => (a.bulkPaymentBalance || 0) - (b.bulkPaymentBalance || 0));

  const totalNegative = negativePupils.reduce((sum, p) => sum + (p.bulkPaymentBalance || 0), 0);
  const fmt = (v) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v || 0);

  return (
    <Card className="bg-gradient-to-br from-rose-100 to-red-100 border-0 shadow-sm overflow-hidden h-full">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 whitespace-nowrap">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            Negative Balances
          </h3>
          {negativePupils.length > 0 && (
            <span className="text-xl font-bold text-rose-700">{fmt(totalNegative)}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : negativePupils.length === 0 ? (
          <div className="text-center py-5">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-rose-300" />
            <p className="text-sm text-slate-500">No pupils in debt.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {negativePupils.map(pupil => (
              <Link
                key={pupil.id}
                to={createPageUrl('PupilProfile') + `?id=${pupil.id}`}
                className="block"
              >
                <div className="bg-white/70 rounded-lg p-2.5 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {pupil.firstName} {pupil.lastName}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px] border-slate-300 text-slate-600">
                        {pupil.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-rose-600 shrink-0">
                      {fmt(pupil.bulkPaymentBalance)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {negativePupils.length > 0 && (
          <Link to={createPageUrl('InstructorPayments')} className="block mt-3">
            <Button size="sm" variant="outline" className="w-full border-rose-300 text-rose-800 hover:bg-rose-50">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Manage Balances
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}