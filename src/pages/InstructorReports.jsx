import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PupilLessonHistory from '@/components/reports/PupilLessonHistory';
import PracticalTestTab from '@/components/reports/PracticalTestTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, BarChart2, Users, Clock, PoundSterling, CheckCircle,
  XCircle, AlertTriangle, TrendingUp, Flag, Activity, ArrowUpRight,
  ArrowDownRight, Minus, Calendar, Target, Award, BookOpen
} from 'lucide-react';
import moment from 'moment';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';

const RANGES = [
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'This Year', key: 'year' },
  { label: 'All Time', key: 'all' },
];

const TABS = ['Overview', 'Pupils', 'Financial', 'Lesson History', 'Practical Test'];

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const palettes = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700'   },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-600',val: 'text-emerald-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-700'  },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    val: 'text-red-700'    },
    navy:   { bg: 'bg-slate-100', icon: 'text-[#071739]',  val: 'text-[#071739]'  },
    gold:   { bg: 'bg-yellow-50', icon: 'text-[#F7B602]',  val: 'text-yellow-700' },
  };
  const p = palettes[color] || palettes.blue;
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-400' : 'text-slate-400';

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${p.bg}`}>
            <Icon className={`w-5 h-5 ${p.icon}`} />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center text-xs font-medium ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5 mr-0.5" />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold ${p.val}`}>{value}</p>
          <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{children}</h2>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function InstructorReports() {
  const [range, setRange] = useState('month');
  const [tab, setTab] = useState('Overview');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: pupils = [], isLoading: pupilsLoading } = useQuery({
    queryKey: ['reportPupils', user?.email, user?.id],
    queryFn: async () => {
      const [byEmail, byId] = await Promise.all([
        base44.entities.Pupil.filter({ instructorEmail: user.email }),
        base44.entities.Pupil.filter({ instructorId: user.id }),
      ]);
      // Merge and deduplicate by id
      const map = {};
      for (const p of [...byEmail, ...byId]) map[p.id] = p;
      return Object.values(map);
    },
    enabled: !!user?.email && !!user?.id,
    staleTime: 3 * 60 * 1000,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['reportLessons', user?.id],
    queryFn: () => base44.entities.Lesson.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000,
  });

  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['reportLedger', user?.id],
    queryFn: () => base44.entities.PaymentLedger.filter({ instructorId: user.id }),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000,
  });

  const rangeStart = useMemo(() => {
    if (range === 'week') return moment().startOf('isoWeek');
    if (range === 'month') return moment().startOf('month');
    if (range === 'year') return moment().startOf('year');
    return null;
  }, [range]);

  const prevRangeStart = useMemo(() => {
    if (range === 'week') return moment().startOf('isoWeek').subtract(1, 'week');
    if (range === 'month') return moment().startOf('month').subtract(1, 'month');
    if (range === 'year') return moment().startOf('year').subtract(1, 'year');
    return null;
  }, [range]);

  const prevRangeEnd = useMemo(() => {
    if (range === 'week') return moment().startOf('isoWeek').subtract(1, 'day');
    if (range === 'month') return moment().startOf('month').subtract(1, 'day');
    if (range === 'year') return moment().startOf('year').subtract(1, 'day');
    return null;
  }, [range]);

  // ── Lesson aggregation ──────────────────────────────────────────────────────
  const { completed, cancelled, noShows, totalHours, prevCompleted, prevTotalHours } = useMemo(() => {
    const completed = [], cancelled = [], noShows = [];
    const prevCompleted = [];
    let totalHours = 0, prevTotalHours = 0;

    for (const l of lessons) {
      const d = moment(l.date);
      const inRange = !rangeStart || d.isSameOrAfter(rangeStart, 'day');
      const inPrev = prevRangeStart && prevRangeEnd &&
        d.isSameOrAfter(prevRangeStart, 'day') && d.isSameOrBefore(prevRangeEnd, 'day');

      if (inRange) {
        if (l.status === 'Completed') { completed.push(l); totalHours += l.durationMinutes / 60; }
        else if (l.status === 'Cancelled') cancelled.push(l);
        else if (l.status === 'no_show') noShows.push(l);
      }
      if (inPrev && l.status === 'Completed') {
        prevCompleted.push(l);
        prevTotalHours += l.durationMinutes / 60;
      }
    }
    return { completed, cancelled, noShows, totalHours, prevCompleted, prevTotalHours };
  }, [lessons, rangeStart, prevRangeStart, prevRangeEnd]);

  const completedTrend = prevCompleted.length > 0
    ? Math.round(((completed.length - prevCompleted.length) / prevCompleted.length) * 100)
    : undefined;

  const cancellationRate = (completed.length + cancelled.length + noShows.length) > 0
    ? Math.round(((cancelled.length + noShows.length) / (completed.length + cancelled.length + noShows.length)) * 100)
    : 0;

  // ── Financial ───────────────────────────────────────────────────────────────
  const { totalEarned, prevTotalEarned, totalRefunds, monthlyRevenue } = useMemo(() => {
    let totalEarned = 0, prevTotalEarned = 0, totalRefunds = 0;
    const monthly = {};

    for (const l of ledger) {
      const d = moment(l.created_date);
      const inRange = !rangeStart || d.isSameOrAfter(rangeStart);
      const inPrev = prevRangeStart && prevRangeEnd &&
        d.isSameOrAfter(prevRangeStart) && d.isSameOrBefore(prevRangeEnd);

      if (inRange) {
        if (l.type === 'payment') totalEarned += (l.amountGbp || 0);
        if (l.type === 'refund') totalRefunds += (l.amountGbp || 0);
      }
      if (inPrev && l.type === 'payment') prevTotalEarned += (l.amountGbp || 0);

      // Monthly breakdown (last 12 months regardless of range)
      const monthKey = d.format('MMM YY');
      if (l.type === 'payment') {
        monthly[monthKey] = (monthly[monthKey] || 0) + (l.amountGbp || 0);
      }
    }

    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const m = moment().subtract(5 - i, 'months');
      const key = m.format('MMM YY');
      return { label: m.format('MMM'), revenue: +(monthly[key] || 0).toFixed(2) };
    });

    return { totalEarned, prevTotalEarned, totalRefunds, monthlyRevenue };
  }, [ledger, rangeStart, prevRangeStart, prevRangeEnd]);

  const revenueTrend = prevTotalEarned > 0
    ? Math.round(((totalEarned - prevTotalEarned) / prevTotalEarned) * 100)
    : undefined;

  // ── Pupil aggregation ───────────────────────────────────────────────────────
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

  const passRate = (passedCount + stoppedCount) > 0
    ? Math.round((passedCount / (passedCount + stoppedCount)) * 100)
    : null;

  const upcomingTests = useMemo(() => pupils
    .filter(p =>
      p.practicalTestDate && !p.practicalTestPassed &&
      moment(p.practicalTestDate).isAfter(moment()) &&
      moment(p.practicalTestDate).diff(moment(), 'days') <= 60
    )
    .sort((a, b) => moment(a.practicalTestDate).diff(moment(b.practicalTestDate))),
  [pupils]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const barData = useMemo(() => {
    if (range === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = moment().startOf('isoWeek').add(i, 'days');
        return {
          label: d.format('ddd'),
          Completed: completed.filter(l => moment(l.date).isSame(d, 'day')).length,
          Cancelled: cancelled.filter(l => moment(l.date).isSame(d, 'day')).length,
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
          Completed: completed.filter(l => moment(l.date).isBetween(ws, we, 'day', '[]')).length,
          Cancelled: cancelled.filter(l => moment(l.date).isBetween(ws, we, 'day', '[]')).length,
        });
      }
      return weeks;
    }
    const months = range === 'year'
      ? Array.from({ length: 12 }, (_, i) => moment().startOf('year').add(i, 'months'))
      : Array.from({ length: 12 }, (_, i) => moment().subtract(11 - i, 'months').startOf('month'));
    return months.map(m => ({
      label: m.format('MMM'),
      Completed: completed.filter(l => moment(l.date).isSame(m, 'month')).length,
      Cancelled: cancelled.filter(l => moment(l.date).isSame(m, 'month')).length,
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

  const isLoading = lessonsLoading || pupilsLoading || ledgerLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
        <p className="text-sm text-slate-400">Loading your reports…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="bg-[#071739] text-white px-6 lg:px-10 pt-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-5 h-5 text-[#F7B602]" />
                <h1 className="text-xl font-bold tracking-tight">Business Reports</h1>
              </div>
              <p className="text-sm text-slate-400">Your teaching business at a glance</p>
            </div>
            {/* Range pills */}
            <div className="flex gap-1.5 bg-white/10 rounded-xl p-1">
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    range === r.key
                      ? 'bg-[#F7B602] text-[#071739]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top-level hero KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Lessons Done', value: completed.length, sub: `${totalHours.toFixed(1)} hrs`, icon: CheckCircle, good: true },
              { label: 'Revenue', value: `£${totalEarned.toFixed(0)}`, sub: revenueTrend !== undefined ? `${revenueTrend > 0 ? '+' : ''}${revenueTrend}% vs prev` : null, icon: PoundSterling, good: revenueTrend >= 0 },
              { label: 'Active Pupils', value: activeCount, sub: `${pupils.length} total`, icon: Users, good: true },
              { label: 'Cancellation Rate', value: `${cancellationRate}%`, sub: `${cancelled.length + noShows.length} missed`, icon: XCircle, good: cancellationRate < 15 },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4 text-[#F7B602]" />
                  <span className="text-xs text-slate-300">{item.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                {item.sub && <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex gap-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? 'border-[#F7B602] text-[#071739]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-6 space-y-6">

        {/* ════ OVERVIEW TAB ════ */}
        {tab === 'Overview' && (
          <>
            {/* Lesson KPIs */}
            <div>
              <SectionHeading>Lesson Performance</SectionHeading>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={CheckCircle} label="Completed Lessons" value={completed.length} sub={`${totalHours.toFixed(1)} total hours`} color="green" trend={completedTrend} />
                <KpiCard icon={XCircle} label="Cancellations" value={cancelled.length} color="amber" />
                <KpiCard icon={AlertTriangle} label="No Shows" value={noShows.length} color="red" />
                <KpiCard icon={Activity} label="Completion Rate" value={`${completed.length + cancelled.length + noShows.length > 0 ? Math.round((completed.length / (completed.length + cancelled.length + noShows.length)) * 100) : 0}%`} color="blue" />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">Lessons Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} barCategoryGap="35%" barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cancelled" fill="#fdba74" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 justify-center mt-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Completed</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-orange-300 inline-block" />Cancelled</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">Lesson Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {pieData.map(d => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                              {d.name}
                            </span>
                            <span className="font-semibold text-slate-700">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming tests */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  Upcoming Practical Tests — next 60 days
                  {upcomingTests.length > 0 && (
                    <Badge className="bg-rose-100 text-rose-700 ml-auto">{upcomingTests.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingTests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {upcomingTests.map(p => {
                      const daysLeft = moment(p.practicalTestDate).diff(moment(), 'days');
                      const urgency = daysLeft <= 7 ? 'red' : daysLeft <= 21 ? 'amber' : 'blue';
                      const urgencyStyle = {
                        red: 'border-red-200 bg-red-50',
                        amber: 'border-amber-200 bg-amber-50',
                        blue: 'border-blue-100 bg-blue-50',
                      }[urgency];
                      const badgeStyle = {
                        red: 'bg-red-100 text-red-700',
                        amber: 'bg-amber-100 text-amber-700',
                        blue: 'bg-blue-100 text-blue-700',
                      }[urgency];
                      return (
                        <div key={p.id} className={`rounded-xl border p-3 ${urgencyStyle}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{moment(p.practicalTestDate).format('ddd DD MMM YYYY')}</p>
                              {p.practicalTestCentre && <p className="text-xs text-slate-400">{p.practicalTestCentre}</p>}
                            </div>
                            <Badge className={`text-xs shrink-0 ${badgeStyle}`}>
                              {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Flag className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No upcoming tests in the next 60 days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ════ PUPILS TAB ════ */}
        {tab === 'Pupils' && (
          <>
            <div>
              <SectionHeading>Pupil Overview</SectionHeading>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Users} label="Total Pupils" value={pupils.length} color="navy" />
                <KpiCard icon={TrendingUp} label="Active" value={activeCount} sub={`${pupils.length > 0 ? Math.round((activeCount / pupils.length) * 100) : 0}% of total`} color="blue" />
                <KpiCard icon={Award} label="Passed" value={passedCount} sub={passRate !== null ? `${passRate}% pass rate` : undefined} color="green" />
                <KpiCard icon={AlertTriangle} label="On Hold / Stopped" value={onHoldCount + stoppedCount} color="amber" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">Pupil Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {pupilPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pupilPieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                            {pupilPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {pupilPieData.map(d => (
                          <div key={d.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                            <span className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                              {d.name}
                            </span>
                            <span className="text-sm font-bold text-slate-800">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No pupils yet</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">Pupil Progress Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {[
                    { label: 'Pass Rate', value: passRate !== null ? `${passRate}%` : '—', sub: `${passedCount} passed out of ${passedCount + stoppedCount} completed`, color: 'bg-emerald-500' },
                    { label: 'Active Rate', value: pupils.length > 0 ? `${Math.round((activeCount / pupils.length) * 100)}%` : '—', sub: `${activeCount} active out of ${pupils.length} total`, color: 'bg-blue-500' },
                    { label: 'Avg Target Hours', value: pupils.length > 0 ? `${(pupils.reduce((s, p) => s + (p.targetHours || 45), 0) / pupils.length).toFixed(0)} hrs` : '—', sub: 'across all pupils', color: 'bg-purple-500' },
                    { label: 'Avg Hourly Rate', value: totalHours > 0 ? `£${(totalEarned / totalHours).toFixed(2)}/hr` : '—', sub: 'based on payments & hours', color: 'bg-[#F7B602]' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className={`w-1 h-10 rounded-full ${item.color}`} />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-base font-bold text-slate-800">{item.value}</p>
                        </div>
                        <p className="text-xs text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* ════ FINANCIAL TAB ════ */}
        {tab === 'Financial' && (
          <>
            <div>
              <SectionHeading>Revenue Summary</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={PoundSterling} label="Total Received" value={`£${totalEarned.toFixed(2)}`} sub={RANGES.find(r => r.key === range)?.label} color="green" trend={revenueTrend} />
                <KpiCard icon={Clock} label="Avg Rate / Hour" value={totalHours > 0 ? `£${(totalEarned / totalHours).toFixed(2)}` : '—'} sub="per teaching hour" color="blue" />
                <KpiCard icon={Calendar} label="Avg / Lesson" value={completed.length > 0 ? `£${(totalEarned / completed.length).toFixed(2)}` : '—'} sub="per completed lesson" color="navy" />
                <KpiCard icon={TrendingUp} label="Refunds Issued" value={`£${totalRefunds.toFixed(2)}`} sub="in selected period" color="amber" />
              </div>
            </div>

            {/* Revenue trend chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600">Revenue Trend — Last 6 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F7B602" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F7B602" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
                          <p className="font-semibold text-slate-700">{label}</p>
                          <p className="text-[#F7B602] font-bold">£{payload[0]?.value?.toFixed(2)}</p>
                        </div>
                      );
                    }} />
                    <Area type="monotone" dataKey="revenue" stroke="#F7B602" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#F7B602', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {ledger.filter(l => l.type === 'payment').length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {ledger
                      .filter(l => l.type === 'payment' && (!rangeStart || moment(l.created_date).isSameOrAfter(rangeStart)))
                      .sort((a, b) => moment(b.created_date).diff(moment(a.created_date)))
                      .slice(0, 20)
                      .map((l, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                          <div>
                            <p className="text-sm text-slate-700 font-medium">
                              {l.reason === 'balance_top_up' ? 'Balance Top-Up' :
                               l.reason === 'lesson_confirmed_charge' ? 'Lesson Payment' :
                               l.reason === 'manual_adjustment' ? 'Manual Adjustment' :
                               l.reason || 'Payment'}
                            </p>
                            <p className="text-xs text-slate-400">{moment(l.created_date).format('DD MMM YYYY')}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">+£{(l.amountGbp || 0).toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <PoundSterling className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No payments in this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ════ LESSON HISTORY TAB ════ */}
        {tab === 'Lesson History' && (
          <PupilLessonHistory pupils={pupils} instructorId={user?.id} />
        )}

        {/* ════ PRACTICAL TEST TAB ════ */}
        {tab === 'Practical Test' && (
          <PracticalTestTab instructorId={user?.id} pupils={pupils} />
        )}

      </div>
    </div>
  );
}