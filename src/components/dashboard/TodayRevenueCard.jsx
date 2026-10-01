import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, Banknote, Wallet } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const RANGE_LABEL = {
  today: "Today's Revenue",
  week: "This Week's Revenue",
  month: "This Month's Revenue"
};

export default function TodayRevenueCard({ userId, disabled, range = 'today' }) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['rangeInvoices', userId, range],
    queryFn: async () => {
      if (!userId) return [];
      const all = await base44.entities.Invoice.filter({ instructorId: userId });
      let start, end;
      if (range === 'today') {
        start = moment().startOf('day');
        end = moment().endOf('day');
      } else if (range === 'week') {
        start = moment().startOf('isoWeek');
        end = moment().endOf('day');
      } else {
        start = moment().startOf('month');
        end = moment().endOf('day');
      }
      return all.filter(inv =>
        inv.paymentDate &&
        moment(inv.paymentDate).isBetween(start, end, null, '[]') &&
        inv.status === 'PAID'
      );
    },
    enabled: !!userId && !disabled
  });

  const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const cardPayments = invoices.filter(i => i.type === 'STRIPE_CARD');
  const cashPayments = invoices.filter(i => i.type === 'MANUAL_CASH');
  const bacsPayments = invoices.filter(i => i.type === 'MANUAL_BACS');
  const cardTotal = cardPayments.reduce((s, i) => s + (i.amount || 0), 0);
  const cashTotal = cashPayments.reduce((s, i) => s + (i.amount || 0), 0);
  const bacsTotal = bacsPayments.reduce((s, i) => s + (i.amount || 0), 0);

  const fmt = (v) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v || 0);

  return (
    <Card className="bg-gradient-to-br from-emerald-100 to-teal-100 border-0 shadow-sm overflow-hidden h-full">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            {RANGE_LABEL[range]}
          </h3>
          {invoices.length > 0 && (
            <span className="text-xl font-bold text-emerald-700">{fmt(total)}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-5">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
            <p className="text-sm text-slate-500">No payments recorded.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-white/70 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-600">Card</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{fmt(cardTotal)}</p>
                <p className="text-[11px] text-slate-500">{cardPayments.length} payment{cardPayments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-600">Cash</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{fmt(cashTotal)}</p>
                <p className="text-[11px] text-slate-500">{cashPayments.length} payment{cashPayments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-medium text-slate-600">BACS</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{fmt(bacsTotal)}</p>
                <p className="text-[11px] text-slate-500">{bacsPayments.length} payment{bacsPayments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {invoices.length > 0 && (
          <Link to={createPageUrl('Invoices')} className="block mt-3">
            <Button size="sm" variant="outline" className="w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50">
              View Invoices
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}