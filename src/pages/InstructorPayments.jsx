import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Clock,
  Search,
  DollarSign,
  Wallet
} from 'lucide-react';
import moment from 'moment';

export default function InstructorPayments() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructor } = useQuery({
    queryKey: ['myInstructorProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      return instructors[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: pupils = [], isLoading: pupilsLoading } = useQuery({
    queryKey: ['myPupils', instructor?.id],
    queryFn: () => base44.entities.Pupil.filter({ instructorId: instructor.id }),
    enabled: !!instructor?.id
  });

  const { data: allLedgerEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['allPaymentLedger', instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return [];
      const pupilIds = pupils.map(p => p.id);
      if (pupilIds.length === 0) return [];
      
      // Fetch ledger entries for all pupils
      const entries = await base44.entities.PaymentLedger.list('-created_date', 500);
      return entries.filter(e => pupilIds.includes(e.userId));
    },
    enabled: !!instructor?.id && pupils.length > 0
  });

  if (pupilsLoading || ledgerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading payment information...</div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">No instructor profile found</div>
      </div>
    );
  }

  // Calculate statistics
  const totalRevenue = allLedgerEntries
    .filter(e => e.type === 'charge')
    .reduce((sum, e) => sum + (e.amountGbp || 0), 0);

  const thisMonthRevenue = allLedgerEntries
    .filter(e => e.type === 'charge' && moment(e.created_date).isSame(moment(), 'month'))
    .reduce((sum, e) => sum + (e.amountGbp || 0), 0);

  const totalBalances = pupils.reduce((sum, p) => sum + (p.bulkPaymentBalance || 0), 0);

  // Filter pupils by search
  const filteredPupils = pupils.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Get recent activity
  const recentActivity = allLedgerEntries.slice(0, 20).map(entry => {
    const pupil = pupils.find(p => p.id === entry.userId);
    return { ...entry, pupil };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#071739]">Payment Management</h1>
          <p className="text-slate-600 mt-2">Track pupil balances and payment activity</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mt-1">All time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{thisMonthRevenue.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mt-1">{moment().format('MMMM YYYY')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Pupil Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">£{totalBalances.toFixed(2)}</div>
              <div className="text-sm text-slate-500 mt-1">Combined</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Pupils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#071739]">{pupils.length}</div>
              <div className="text-sm text-slate-500 mt-1">Total pupils</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pupils" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pupils">Pupil Balances</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Pupil Balances Tab */}
          <TabsContent value="pupils">
            <Card>
              <CardHeader>
                <CardTitle>Pupil Balances</CardTitle>
                <CardDescription>View and track individual pupil payment balances</CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search pupils..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPupils.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No pupils found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPupils.map((pupil) => {
                      const balance = pupil.bulkPaymentBalance || 0;
                      const hourlyRate = pupil.hourlyRate || 50;
                      const availableHours = balance / hourlyRate;

                      return (
                        <div
                          key={pupil.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F7B602] to-[#d99f02] flex items-center justify-center text-[#071739] font-bold text-lg">
                              {pupil.firstName[0]}{pupil.lastName[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {pupil.firstName} {pupil.lastName}
                              </div>
                              <div className="text-sm text-slate-500">
                                £{hourlyRate}/hr • {pupil.status}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              balance < hourlyRate ? 'text-amber-600' : 'text-[#071739]'
                            }`}>
                              £{balance.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">
                              ≈ {availableHours.toFixed(1)} hours
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest payment transactions across all pupils</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentActivity.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            entry.type === 'charge' ? 'bg-green-100' : 'bg-rose-100'
                          }`}>
                            {entry.type === 'charge' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-rose-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {entry.pupil ? `${entry.pupil.firstName} ${entry.pupil.lastName}` : 'Unknown Pupil'}
                            </div>
                            <div className="text-sm text-slate-600">
                              {entry.reason === 'lesson_confirmed_charge' && 'Lesson Charge'}
                              {entry.reason === 'late_cancellation_penalty' && 'Late Cancellation Penalty'}
                              {entry.reason === 'manual_adjustment' && 'Balance Adjustment'}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" />
                              {moment(entry.created_date).format('DD MMM YYYY, HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            entry.type === 'charge' ? 'text-green-600' : 'text-rose-600'
                          }`}>
                            {entry.type === 'charge' ? '+' : '-'}£{Math.abs(entry.amountGbp || 0).toFixed(2)}
                          </div>
                          {entry.hours && (
                            <div className="text-xs text-slate-500">{entry.hours}h</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}