import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Fetch all MCQ attempts
  const attempts = await base44.asServiceRole.entities.McqAttempt.list('-submittedAt', 500);

  // Group attempts by pupilId + mcqPackId
  const groups = {};
  for (const attempt of attempts) {
    const key = `${attempt.pupilId}__${attempt.mcqPackId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(attempt);
  }

  let created = 0;
  let skipped = 0;

  for (const [key, groupAttempts] of Object.entries(groups)) {
    const [pupilId, mcqPackId] = key.split('__');

    // Check if McqStatus already exists
    const existing = await base44.asServiceRole.entities.McqStatus.filter({ pupilId, mcqPackId });
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Sort by submittedAt ascending to determine first pass
    const sorted = [...groupAttempts].sort((a, b) =>
      new Date(a.submittedAt || a.created_date) - new Date(b.submittedAt || b.created_date)
    );

    const lastAttempt = sorted[sorted.length - 1];
    const firstPassedAttempt = sorted.find(a => a.passed);
    const everPassed = !!firstPassedAttempt;

    const statusData = {
      pupilId,
      instructorId: lastAttempt.instructorId || null,
      topicId: lastAttempt.topicId || null,
      mcqPackId,
      attemptCount: sorted.length,
      lastAttemptId: lastAttempt.id,
      lastScore: lastAttempt.score,
      totalQuestions: lastAttempt.totalQuestions,
      passMark: lastAttempt.passMark,
      lastPassed: lastAttempt.passed,
      completed: everPassed,
      firstCompletedAt: firstPassedAttempt?.submittedAt || null,
      lastAttemptAt: lastAttempt.submittedAt || lastAttempt.created_date
    };

    await base44.asServiceRole.entities.McqStatus.create(statusData);
    created++;
  }

  return Response.json({ success: true, created, skipped, totalGroups: Object.keys(groups).length });
});