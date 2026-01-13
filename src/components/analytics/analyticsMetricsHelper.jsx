export function getDateRangeFromPreset(preset) {
  const now = new Date();
  let start;

  switch (preset) {
    case 'last_30_days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last_3_months':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'last_6_months':
      start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all_time':
      return { start: null, end: null };
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end: now };
}

export function filterPupilsByTimeRange(pupils, dateRange) {
  if (!dateRange.start) return pupils;

  return pupils.filter((pupil) => {
    const createdAt = new Date(pupil.created_date);
    const lastLessonAt = pupil.lastLessonAt ? new Date(pupil.lastLessonAt) : null;
    const passDate = pupil.passDate ? new Date(pupil.passDate) : null;
    const testDate = pupil.testDate ? new Date(pupil.testDate) : null;

    return (
      (createdAt >= dateRange.start && createdAt <= dateRange.end) ||
      (lastLessonAt && lastLessonAt >= dateRange.start && lastLessonAt <= dateRange.end) ||
      (passDate && passDate >= dateRange.start && passDate <= dateRange.end) ||
      (testDate && testDate >= dateRange.start && testDate <= dateRange.end)
    );
  });
}

export function filterLessonsByTimeRange(lessons, dateRange) {
  if (!dateRange.start) return lessons;

  return lessons.filter((lesson) => {
    const startAt = new Date(lesson.startTime);
    return startAt >= dateRange.start && startAt <= dateRange.end;
  });
}

export function computeInstructorAnalyticsMetrics(
  pupilsInRange,
  lessonsInRange,
  allPupils,
  allLessons,
  user
) {
  // Pupil status counts
  const pupilStatusCounts = {
    Active: 0,
    OnHold: 0,
    'Test Ready': 0,
    Passed: 0,
    Stopped: 0,
    TransferredOut: 0,
  };

  pupilsInRange.forEach((pupil) => {
    const status = pupil.status || 'Active';
    const statusKey = status.charAt(0).toUpperCase() + status.slice(1);
    if (statusKey in pupilStatusCounts) {
      pupilStatusCounts[statusKey]++;
    }
  });

  // Pass rates
  const passedPupils = allPupils.filter((p) => p.status === 'Passed');
  const passedWithAttempt = passedPupils.filter((p) => p.passAttempt);
  const firstTimePass = passedWithAttempt.filter((p) => p.passAttempt === 1);

  const passRates = {
    overallPercent: allPupils.length > 0 ? Math.round((passedPupils.length / allPupils.length) * 100) : 0,
    firstTimePercent: passedWithAttempt.length > 0 ? Math.round((firstTimePass.length / passedWithAttempt.length) * 100) : 0,
    avgAttempts:
      passedWithAttempt.length > 0
        ? passedWithAttempt.reduce((sum, p) => sum + (p.passAttempt || 0), 0) /
          passedWithAttempt.length
        : 0,
  };

  // Attempt distribution
  const attemptDistribution = {
    first: passedPupils.filter((p) => p.passAttempt === 1).length,
    second: passedPupils.filter((p) => p.passAttempt === 2).length,
    third: passedPupils.filter((p) => p.passAttempt === 3).length,
    fourPlus: passedPupils.filter((p) => p.passAttempt && p.passAttempt >= 4).length,
  };

  // Lesson health
  const lessonHealth = {
    completed: lessonsInRange.filter((l) => l.status === 'Completed').length,
    cancelledByPupil: lessonsInRange.filter((l) => l.status === 'cancelled_by_pupil').length,
    cancelledByInstructor: lessonsInRange.filter((l) => l.status === 'cancelled_by_instructor').length,
    noShowPupil: lessonsInRange.filter((l) => l.status === 'no_show_pupil').length,
    noShowInstructor: lessonsInRange.filter((l) => l.status === 'no_show_instructor').length,
  };

  // Retention
  const stoppedPupils = pupilsInRange.filter((p) => p.status === 'Stopped');
  const transferredPupils = pupilsInRange.filter((p) => p.status === 'TransferredOut');
  const avgLessonsPerPupil =
    pupilsInRange.length > 0
      ? pupilsInRange.reduce((sum, p) => sum + (p.totalLessons || 0), 0) / pupilsInRange.length
      : 0;
  const avgHoursToTestReady =
    pupilsInRange.length > 0
      ? pupilsInRange
          .filter((p) => p.status === 'Test Ready' || p.status === 'Passed')
          .reduce((sum, p) => sum + (p.totalHours || 0), 0) /
        pupilsInRange.filter((p) => p.status === 'Test Ready' || p.status === 'Passed').length
      : 0;

  const totalStoppedTransferred = stoppedPupils.length + transferredPupils.length;
  const dropoffPercent =
    pupilsInRange.length > 0
      ? Math.round((totalStoppedTransferred / pupilsInRange.length) * 100)
      : 0;

  const retention = {
    avgLessonsPerPupil,
    avgHoursToTestReady,
    avgTrainingDurationText: `${Math.round(avgHoursToTestReady)} hours`,
    stoppedTraining: stoppedPupils.length,
    transferredOut: transferredPupils.length,
    dropoffPercent,
  };

  // Skill effectiveness (placeholder)
  const skillEffectiveness = {
    heatmap: [],
    topBlockers: [
      {
        skillName: 'Cockpit drill',
        subsection: 'Adjustment of seat',
        stuckPercent: 12,
      },
      {
        skillName: 'Driving control',
        subsection: 'Acceleration',
        stuckPercent: 8,
      },
      {
        skillName: 'Driving control',
        subsection: 'Braking',
        stuckPercent: 7,
      },
    ],
  };

  // Test pipeline
  const testReady = pupilsInRange.filter((p) => p.status === 'Test Ready').length;
  const testBooked = pupilsInRange.filter((p) => p.testDate).length;
  const testPassed = pupilsInRange.filter((p) => p.testOutcome === 'passed').length;
  const testFailed = pupilsInRange.filter((p) => p.testOutcome === 'failed').length;

  const testPipeline = {
    funnelSteps: [
      { label: 'Ready for test', value: testReady },
      { label: 'Test booked', value: testBooked },
      { label: 'Test passed', value: testPassed },
    ],
  };

  // Insights
  const insights = generateInsights({
    passRates,
    retention,
    lessonHealth,
    pupilsInRange,
  });

  // Trends (placeholder - in a real app, would compute over time buckets)
  const trends = {
    series: [
      { date: 'Week 1', firstTimePassRate: 65, overallPassRate: 75, dropoffRate: 5, noShowRate: 8 },
      { date: 'Week 2', firstTimePassRate: 68, overallPassRate: 78, dropoffRate: 6, noShowRate: 7 },
      { date: 'Week 3', firstTimePassRate: 70, overallPassRate: 80, dropoffRate: 5, noShowRate: 6 },
    ],
  };

  // Achievements
  const achievements = generateAchievements({
    passedPupils: passedPupils.length,
    pupilsInRange: pupilsInRange.length,
    lessonHealthRate: (lessonHealth.completed / lessonsInRange.length) * 100,
  });

  // Chart data
  const pupilStatusCountsChart = Object.entries(pupilStatusCounts).map(([key, value]) => ({
    name: key,
    value: value,
  }));

  return {
    pupilStatusCounts,
    pupilStatusCountsChart,
    passRates,
    attemptDistribution,
    lessonHealth,
    retention,
    skillEffectiveness,
    testPipeline,
    trends,
    achievements,
    insights,
  };
}

export function computeDrilldownRows(pupils, lessons, filter, searchQuery, dateRange) {
  let filtered = pupils;

  // Apply filter
  if (filter.type === 'pupil_status') {
    filtered = filtered.filter((p) => p.status === filter.value);
  } else if (filter.type === 'pass_attempt') {
    if (filter.value === '4plus') {
      filtered = filtered.filter((p) => p.passAttempt && p.passAttempt >= 4);
    } else {
      filtered = filtered.filter((p) => p.passAttempt === parseInt(filter.value));
    }
  }

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((p) =>
      (p.firstName || '').toLowerCase().includes(query) ||
      (p.lastName || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query)
    );
  }

  // Map to table rows
  return filtered
    .sort((a, b) => new Date(b.lastLessonAt || 0) - new Date(a.lastLessonAt || 0))
    .map((p) => ({
      id: p.id,
      fullName: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      status: p.status || 'Active',
      lastLessonAt: p.lastLessonAt ? new Date(p.lastLessonAt).toLocaleDateString() : 'N/A',
      totalLessons: p.totalLessons || 0,
      testOutcome: p.testOutcome ? (p.testOutcome === 'passed' ? '✓ Passed' : '✗ Failed') : 'Pending',
    }));
}

function generateInsights(metrics) {
  const insights = [];

  if (metrics.passRates.firstTimePercent < 60) {
    insights.push({
      type: 'warning',
      title: 'Low first-time pass rate',
      message: `Only ${metrics.passRates.firstTimePercent}% of pupils passed on first attempt. Consider reviewing lesson content.`,
    });
  }

  if (metrics.retention.dropoffPercent > 10) {
    insights.push({
      type: 'warning',
      title: 'High drop-off rate',
      message: `${metrics.retention.dropoffPercent}% of pupils stopped or transferred. Check in with at-risk pupils.`,
    });
  }

  if (metrics.lessonHealth.cancelledByPupil > metrics.lessonHealth.completed * 0.2) {
    insights.push({
      type: 'info',
      title: 'Many pupil cancellations',
      message: 'Consider discussing scheduling preferences with pupils.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'success',
      title: 'Strong performance',
      message: 'Your metrics are looking good. Keep up the great work!',
    });
  }

  return insights;
}

function generateAchievements(metrics) {
  const achievements = [];

  if (metrics.passedPupils >= 5) {
    achievements.push({
      id: 'five_passed',
      icon: '🏆',
      title: '5 Pupils Passed',
      description: `You've helped ${metrics.passedPupils} pupils pass their tests!`,
    });
  }

  if (metrics.lessonHealthRate > 85) {
    achievements.push({
      id: 'high_completion',
      icon: '⭐',
      title: 'High Completion Rate',
      description: 'Over 85% of your lessons completed successfully.',
    });
  }

  if (metrics.pupilsInRange > 20) {
    achievements.push({
      id: 'many_pupils',
      icon: '👥',
      title: 'Growing Cohort',
      description: `You're working with ${metrics.pupilsInRange} active pupils.`,
    });
  }

  return achievements;
}