import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Fetch all MCQ attempts (paginate if needed)
  const attempts = await base44.asServiceRole.entities.McqAttempt.list('-submittedAt', 1000);

  // Fetch all existing McqStatus records upfront (avoid per-group queries)
  const existingStatuses = await base44.asServiceRole.entities.McqStatus.list('-created_date', 1000);
  const existingKeys = new Set(existingStatuses.map(s => `${s.pupilId}__${s.mcqPackId}`));

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
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    const [pupilId, mcqPackId] = key.split('__');

    // Sort by submittedAt ascending to determine first pass
    const sorted = [...groupAttempts].sort((a, b) =>
      new Date(a.submittedAt || a.created_date) - new Date(b.submittedAt || b.created_date)
    );

    const lastAttempt = sorted[sorted.length - 1];
    const firstPassedAttempt = sorted.find(a => a.passed);
    const everPassed = !!firstPassedAttempt;

    // Skip if topicId is missing (required field)
    const topicId = lastAttempt.topicId || null;
    if (!topicId) {
      skipped++;
      continue;
    }

    const statusData = {
      pupilId,
      instructorId: lastAttempt.instructorId || null,
      topicId,
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