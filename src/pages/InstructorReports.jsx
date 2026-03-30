import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart2, Users, Clock, PoundSterling, CheckCircle, XCircle, AlertTriangle, TrendingUp, Flag } from 'lucide-react';
import moment from 'moment';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const RANGES = [
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'This Year', key: 'year' },
  { label: 'All Time', key: 'all' },
];

function StatCard({ icon: Icon, label, value, sub, color = 'text-slate-700' }) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-slate-100">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstructorReports() {
  const [range, setRange] = useState('month');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: pupils = [] } = useQuery({
    queryKey: ['reportPupils', user?.email],
    queryFn: () => base44.entities.Pupil.filter({ instructorEmail: user.email }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['reportBookings', user?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['reportLedger', user?.id],
    queryFn: () => base44.entities.PaymentLedger.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Memoised range start — recomputed only when range changes
  const rangeStart = useMemo(() => {
    if (range === 'week') return moment().startOf('isoWeek');
    if (range === 'month') return moment().startOf('month');
    if (range === 'year') return moment().startOf('year');
    return null;
  }, [range]);

  // Single pass over bookings to derive all derived arrays
  const { completed, cancelled, noShows, totalHours } = useMemo(() => {
    const completed = [], cancelled = [], noShows = [];
    let totalHours = 0;
    for (const b of bookings) {
      if (b.isDeleted) continue;
      if (rangeStart && moment(b.startAtUtc).isBefore(rangeStart)) continue;
      if (b.status === 'completed') {
        completed.push(b);
        totalHours += moment(b.endAtUtc).diff(moment(b.startAtUtc), 'minutes') / 60;
      } else if (['cancelled', 'cancelled_by_pupil', 'cancelled_late_by_pupil'].includes(b.status)) {
        cancelled.push(b);
      } else if (b.status === 'no_show') {
        noShows.push(b);
      }
    }
    return { completed, cancelled, noShows, totalHours };
  }, [bookings, rangeStart]);

  // Financial — use amountGbp and type=payment
  const totalEarned = useMemo(() => {
    return ledger
      .filter(l => l.type === 'payment' && (!rangeStart || moment(l.created_date).isSameOrAfter(rangeStart)))
      .reduce((sum, l) => sum + (l.amountGbp || 0), 0);
  }, [ledger, rangeStart]);

  // Pupil counts — single pass
  const { activeCount, passedCount, onHoldCount, stoppedCount } = useMemo(() => {
    let activeCount = 0, passedCount = 0, onHoldCount = 0, stoppedCount = 0;
    for (const p of pupils) {
      if (p.status === 'Active') activeCount++;
      else if (p.status === 'Passed') passedCount++;
      else if (p.status === 'OnHold') onHoldCount++;
      else if (p.status === 'Stopped') stoppedCount++;
    }
    return { activeCount, passedCount, onHoldCount, stoppedCount };
  }, [pupils]);

  const upcomingTests = useMemo(() => pupils
    .filter(p =>
      p.practicalTestDate && !p.practicalTestPassed &&
      moment(p.practicalTestDate).isAfter(moment()) &&
      moment(p.practicalTestDate).diff(moment(), 'days') <= 60
    )
    .sort((a, b) => moment(a.practicalTestDate).diff(moment(b.practicalTestDate))),
  [pupils]);

  const barData = useMemo(() => {
    if (range === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = moment().startOf('isoWeek').add(i, 'days');
        return {
          label: d.format('ddd'),
          Completed: completed.filter(b => moment(b.startAtUtc).isSame(d, 'day')).length,
          Cancelled: cancelled.filter(b => moment(b.startAtUtc).isSame(d, 'day')).length,
        };
      });
    }
    if (range === 'month') {
      const weeks = [];
      const start = moment().startOf('month');
      for (let w = 0; w < 5; w++) {
        const ws = start.clone().add(w * 7, 'days');
        if (ws.month() !== moment().month()) break;
        const we = ws.clone().add(6, 'days');
        weeks.push({
          label: `W${w + 1}`,
          Completed: completed.filter(b => moment(b.startAtUtc).isBetween(ws, we, 'day', '[]')).length,
          Cancelled: cancelled.filter(b => moment(b.startAtUtc).isBetween(ws, we, 'day', '[]')).length,
        });
      }
      return weeks;
    }
    const months = range === 'year'
      ? Array.from({ length: 12 }, (_, i) => moment().startOf('year').add(i, 'months'))
      : Array.from({ length: 12 }, (_, i) => moment().subtract(11 - i, 'months').startOf('month'));
    return months.map(m => ({
      label: m.format('MMM'),
      Completed: completed.filter(b => moment(b.startAtUtc).isSame(m, 'month')).length,
      Cancelled: cancelled.filter(b => moment(b.startAtUtc).isSame(m, 'month')).length,
    }));
  }, [completed, cancelled, range]);

  const pieData = useMemo(() => [
    { name: 'Completed', value: completed.length, color: '#22c55e' },
    { name: 'Cancelled', value: cancelled.length, color: '#f97316' },
    { name: 'No Show', value: noShows.length, color: '#ef4444' },
  ].filter(d => d.value > 0), [completed, cancelled, noShows]);

  const pupilPieData = useMemo(() => [
    { name: 'Active', value: activeCount, color: '#3b82f6' },
    { name: 'Passed', value: passedCount, color: '#22c55e' },
    { name: 'On Hold', value: onHoldCount, color: '#f59e0b' },
    { name: 'Stopped', value: stoppedCount, color: '#94a3b8' },
  ].filter(d => d.value > 0), [activeCount, passedCount, onHoldCount, stoppedCount]);

  if (bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#071739] flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-[#F7B602]" />
              Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">Overview of your teaching activity</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  range === r.key
                    ? 'bg-[#071739] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Stats */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Lesson Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CheckCircle} label="Completed" value={completed.length} color="text-emerald-600" sub={`${totalHours.toFixed(1)} hrs`} />
            <StatCard icon={XCircle} label="Cancelled" value={cancelled.length} color="text-orange-500" />
            <StatCard icon={AlertTriangle} label="No Shows" value={noShows.length} color="text-red-500" />
            <StatCard icon={Clock} label="Total Hours" value={totalHours.toFixed(1)} color="text-blue-600" sub="completed lessons" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700">Lessons Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cancelled" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700">Lesson Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pupils */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pupils</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Pupils" value={pupils.length} color="text-[#071739]" />
            <StatCard icon={TrendingUp} label="Active" value={activeCount} color="text-blue-600" />
            <StatCard icon={CheckCircle} label="Passed" value={passedCount} color="text-emerald-600" />
            <StatCard icon={AlertTriangle} label="On Hold" value={onHoldCount} color="text-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700">Pupil Status</CardTitle>
            </CardHeader>
            <CardContent>
              {pupilPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pupilPieData} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                      {pupilPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No pupils yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-500" />
                Upcoming Tests (next 60 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTests.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {upcomingTests.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-500">{moment(p.practicalTestDate).format('DD MMM YYYY')}{p.practicalTestCentre ? ` · ${p.practicalTestCentre}` : ''}</p>
                      </div>
                      <Badge className="bg-rose-100 text-rose-700">
                        In {moment(p.practicalTestDate).diff(moment(), 'days')}d
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-slate-400 text-sm">No upcoming tests</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Financial</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon={PoundSterling} label="Payments Received" value={`£${totalEarned.toFixed(2)}`} color="text-emerald-600" sub={RANGES.find(r => r.key === range)?.label} />
            <StatCard icon={Clock} label="Avg Lesson Rate" value={totalHours > 0 ? `£${(totalEarned / totalHours).toFixed(2)}/hr` : '—'} color="text-slate-700" sub="based on received payments" />
          </div>
        </div>

      </div>
    </div>
  );
}