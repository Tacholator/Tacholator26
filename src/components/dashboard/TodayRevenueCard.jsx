import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, Banknote, Wallet } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function TodayRevenueCard({ userId, disabled }) {
  const { data: todayInvoices = [], isLoading } = useQuery({
    queryKey: ['todayInvoices', userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = moment().format('YYYY-MM-DD');
      const all = await base44.entities.Invoice.filter({ instructorId: userId });
      return all.filter(inv =>
        inv.paymentDate &&
        moment(inv.paymentDate).isSame(today, 'day') &&
        inv.status === 'PAID'
      );
    },
    enabled: !!userId && !disabled
  });

  const total = todayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const cardPayments = todayInvoices.filter(i => i.type === 'STRIPE_CARD');
  const cashPayments = todayInvoices.filter(i => i.type === 'MANUAL_CASH');
  const bacsPayments = todayInvoices.filter(i => i.type === 'MANUAL_BACS');
  const cardTotal = cardPayments.reduce((s, i) => s + (i.amount || 0), 0);
  const cashTotal = cashPayments.reduce((s, i) => s + (i.amount || 0), 0);
  const bacsTotal = bacsPayments.reduce((s, i) => s + (i.amount || 0), 0);

  const fmt = (v) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v || 0);

  return (
    <Card className="bg-gradient-to-br from-emerald-100 to-teal-100 border-0 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Today's Revenue
          </h3>
          {todayInvoices.length > 0 && (
            <span className="text-2xl font-bold text-emerald-700">{fmt(total)}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : todayInvoices.length === 0 ? (
          <div className="text-center py-6">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
            <p className="text-sm text-slate-500">No payments recorded today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-600">Card Payments</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{fmt(cardTotal)}</p>
              <p className="text-xs text-slate-500">{cardPayments.length} payment{cardPayments.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-600">Cash</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{fmt(cashTotal)}</p>
              <p className="text-xs text-slate-500">{cashPayments.length} payment{cashPayments.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-medium text-slate-600">BACS</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{fmt(bacsTotal)}</p>
              <p className="text-xs text-slate-500">{bacsPayments.length} payment{bacsPayments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {todayInvoices.length > 0 && (
          <Link to={createPageUrl('Invoices')} className="block mt-4">
            <Button size="sm" variant="outline" className="w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50">
              View Invoices
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}