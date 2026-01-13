import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { TrendingUp, Users, Target, CheckCircle2, Zap } from 'lucide-react';
import {
  computeInstructorAnalyticsMetrics,
  getDateRangeFromPreset,
  filterPupilsByTimeRange,
  filterLessonsByTimeRange,
  computeDrilldownRows,
} from '@/components/analytics/analyticsMetricsHelper';
import StatCard from '@/components/analytics/StatCard';
import PupilStatusChart from '@/components/analytics/PupilStatusChart';
import LessonHealthChart from '@/components/analytics/LessonHealthChart';
import SkillEffectivenessChart from '@/components/analytics/SkillEffectivenessChart';
import TestPipelineChart from '@/components/analytics/TestPipelineChart';
import RetentionChart from '@/components/analytics/RetentionChart';
import TrendsChart from '@/components/analytics/TrendsChart';
import AchievementsBadges from '@/components/analytics/AchievementsBadges';
import InsightsList from '@/components/analytics/InsightsList';
import DrilldownTable from '@/components/analytics/DrilldownTable';

export default function InstructorAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownFilter, setDrilldownFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch pupils
  const { data: pupils = [] } = useQuery({
    queryKey: ['pupils', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.Pupil.filter({ instructorId: user.id });
    },
    enabled: !!user?.id,
  });

  // Fetch lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.Lesson.filter({ instructorId: user.id });
    },
    enabled: !!user?.id,
  });

  // Get date range
  const dateRange = useMemo(() => getDateRangeFromPreset(timeRange), [timeRange]);

  // Filter by time range
  const pupilsInRange = useMemo(
    () => filterPupilsByTimeRange(pupils, dateRange),
    [pupils, dateRange]
  );

  const lessonsInRange = useMemo(
    () => filterLessonsByTimeRange(lessons, dateRange),
    [lessons, dateRange]
  );

  // Compute metrics
  const metrics = useMemo(
    () =>
      computeInstructorAnalyticsMetrics(
        pupilsInRange,
        lessonsInRange,
        pupils,
        lessons,
        user
      ),
    [pupilsInRange, lessonsInRange, pupils, lessons, user]
  );

  // Compute drilldown rows
  const drilldownRows = useMemo(
    () =>
      drilldownFilter
        ? computeDrilldownRows(pupils, lessons, drilldownFilter, searchQuery, dateRange)
        : [],
    [pupils, lessons, drilldownFilter, searchQuery, dateRange]
  );

  const openDrilldown = (title, filter) => {
    setDrilldownTitle(title);
    setDrilldownFilter(filter);
    setSearchQuery('');
    setDrilldownOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Instructor Analytics</h1>
              <p className="text-sm text-slate-600 mt-1">
                Track outcomes, lesson health, DVSA skill effectiveness, and trends.
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_3_months">Last 3 months</SelectItem>
                <SelectItem value="last_6_months">Last 6 months</SelectItem>
                <SelectItem value="ytd">YTD</SelectItem>
                <SelectItem value="all_time">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Active pupils"
                value={metrics.pupilStatusCounts.active || 0}
                accent="warmBlue"
                onClick={() => openDrilldown('Active pupils', { type: 'pupil_status', value: 'Active' })}
              />
              <StatCard
                title="First-time pass rate"
                value={`${metrics.passRates.firstTimePercent || 0}%`}
                accent="warmGreen"
              />
              <StatCard
                title="Overall pass rate"
                value={`${metrics.passRates.overallPercent || 0}%`}
                accent="warmViolet"
              />
              <StatCard
                title="Drop-off rate"
                value={`${metrics.retention.dropoffPercent || 0}%`}
                accent="warmOrange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pupil status breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <PupilStatusChart
                    data={metrics.pupilStatusCountsChart}
                    onSegmentClick={(status) =>
                      openDrilldown(`${status} pupils`, {
                        type: 'pupil_status',
                        value: status,
                      })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lesson health</CardTitle>
                </CardHeader>
                <CardContent>
                  <LessonHealthChart
                    data={metrics.lessonHealth}
                    onItemClick={(key) =>
                      openDrilldown(`Lessons: ${key}`, {
                        type: 'lesson_status',
                        value: key,
                      })
                    }
                  />
                </CardContent>
              </Card>
            </div>

            {metrics.insights && metrics.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <InsightsList insights={metrics.insights} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Passed (1st attempt)"
                value={metrics.attemptDistribution.first || 0}
                accent="warmGreen"
                onClick={() =>
                  openDrilldown('Passed - First attempt', {
                    type: 'pass_attempt',
                    value: '1',
                  })
                }
              />
              <StatCard
                title="Passed (2nd attempt)"
                value={metrics.attemptDistribution.second || 0}
                accent="warmBlue"
                onClick={() =>
                  openDrilldown('Passed - Second attempt', {
                    type: 'pass_attempt',
                    value: '2',
                  })
                }
              />
              <StatCard
                title="Passed (3rd attempt)"
                value={metrics.attemptDistribution.third || 0}
                accent="warmViolet"
                onClick={() =>
                  openDrilldown('Passed - Third attempt', {
                    type: 'pass_attempt',
                    value: '3',
                  })
                }
              />
              <StatCard
                title="Passed (4+ attempts)"
                value={metrics.attemptDistribution.fourPlus || 0}
                accent="warmOrange"
                onClick={() =>
                  openDrilldown('Passed - 4+ attempts', {
                    type: 'pass_attempt',
                    value: '4plus',
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stopped training / not continuing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      openDrilldown('Stopped training', {
                        type: 'pupil_status',
                        value: 'Stopped',
                      })
                    }
                  >
                    <span className="text-sm font-medium">Stopped training</span>
                    <span className="text-lg font-bold text-slate-900">
                      {metrics.retention.stoppedTraining || 0}
                    </span>
                  </div>
                  <div
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    onClick={() =>
                      openDrilldown('Transferred out', {
                        type: 'pupil_status',
                        value: 'TransferredOut',
                      })
                    }
                  >
                    <span className="text-sm font-medium">Transferred out</span>
                    <span className="text-lg font-bold text-slate-900">
                      {metrics.retention.transferredOut || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg lessons per pupil</span>
                    <span className="font-bold">
                      {metrics.retention.avgLessonsPerPupil?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg hours to test-ready</span>
                    <span className="font-bold">
                      {metrics.retention.avgHoursToTestReady?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg attempts to pass</span>
                    <span className="font-bold">
                      {metrics.passRates.avgAttempts?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>DVSA skill effectiveness (Independent rate)</CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  Green = most pupils reach Independent; Red = most pupils get stuck.
                </p>
              </CardHeader>
              <CardContent>
                <SkillEffectivenessChart
                  data={metrics.skillEffectiveness}
                  onSkillClick={(skillId) =>
                    openDrilldown(`Skill: ${skillId}`, {
                      type: 'skill_flag',
                      value: skillId,
                    })
                  }
                />
              </CardContent>
            </Card>

            {metrics.skillEffectiveness?.topBlockers && (
              <Card>
                <CardHeader>
                  <CardTitle>Top blockers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.skillEffectiveness.topBlockers.map((blocker, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{blocker.skillName}</p>
                          <p className="text-xs text-slate-600">{blocker.subsection}</p>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {blocker.stuckPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <TestPipelineChart data={metrics.testPipeline} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pass rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall pass rate</span>
                    <span className="text-lg font-bold">
                      {metrics.passRates.overallPercent || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">First-time pass rate</span>
                    <span className="text-lg font-bold">
                      {metrics.passRates.firstTimePercent || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Retention Tab */}
          <TabsContent value="retention" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Avg lessons per pupil"
                value={metrics.retention.avgLessonsPerPupil?.toFixed(1) || '0.0'}
                accent="warmBlue"
              />
              <StatCard
                title="Avg training duration"
                value={metrics.retention.avgTrainingDurationText || 'N/A'}
                accent="warmViolet"
              />
              <StatCard
                title="Drop-off rate"
                value={`${metrics.retention.dropoffPercent || 0}%`}
                accent="warmOrange"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Drop-off stage</CardTitle>
              </CardHeader>
              <CardContent>
                <RetentionChart data={metrics.retention} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trends over time</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendsChart data={metrics.trends} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementsBadges achievements={metrics.achievements} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drilldown Drawer */}
      <Drawer open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{drilldownTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6 space-y-4">
            <Input
              placeholder="Search pupils…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <DrilldownTable rows={drilldownRows} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}