import { base44 } from '@/api/base44Client';

export async function recalculateProgressSkill(skillId) {
  const skill = await base44.entities.ProgressSkill.filter({ id: skillId }).then(s => s[0]);
  if (!skill) return;

  const subsections = await base44.entities.ProgressSubsection.filter({ skillId });
  
  const total = subsections.length;
  const completed = subsections.filter(s => s.isCompleted).length;
  const ratio = total > 0 ? completed / total : 0;

  let status = 'not_started';
  let completedAt = null;
  let completedByUserId = null;

  if (completed === 0) {
    status = 'not_started';
  } else if (completed > 0 && completed < total) {
    status = 'in_progress';
  } else if (total > 0 && completed === total) {
    status = 'completed';
    completedAt = new Date().toISOString();
    const user = await base44.auth.me();
    completedByUserId = user.id;
  }

  await base44.entities.ProgressSkill.update(skillId, {
    subsectionsTotal: total,
    subsectionsCompleted: completed,
    subsectionsRatio: ratio,
    status,
    completedAt,
    completedByUserId
  });

  await recalculateProgressSummary(skill.pupilId);
}

export async function recalculateProgressSummary(pupilId) {
  const skills = await base44.entities.ProgressSkill.filter({ pupilId });
  const completedCount = skills.filter(s => s.status === 'completed').length;
  const ratio = completedCount / 24;
  const percent = Math.round(ratio * 100);

  const existingSummary = await base44.entities.ProgressSummary.filter({ pupilId });
  
  const data = {
    pupilId,
    totalParentSkills: 24,
    completedParentSkills: completedCount,
    overallRatio: ratio,
    overallPercent: percent,
    lastUpdatedAt: new Date().toISOString()
  };

  if (existingSummary.length > 0) {
    await base44.entities.ProgressSummary.update(existingSummary[0].id, data);
  } else {
    await base44.entities.ProgressSummary.create(data);
  }
}

export async function initializeProgressSkills(pupilId, instructorId, skillsData) {
  for (const skillData of skillsData) {
    const existingSkill = await base44.entities.ProgressSkill.filter({ 
      pupilId, 
      skillKey: skillData.skillKey
    });

    let skill;
    if (existingSkill.length > 0) {
      skill = existingSkill[0];
    } else {
      skill = await base44.entities.ProgressSkill.create({
        pupilId,
        instructorId,
        skillKey: skillData.skillKey,
        title: skillData.title,
        order: skillData.order,
        status: 'not_started',
        subsectionsTotal: skillData.subsections.length,
        subsectionsCompleted: 0,
        subsectionsRatio: 0
      });
    }

    for (const subsectionData of skillData.subsections) {
      const existingSubsection = await base44.entities.ProgressSubsection.filter({
        skillId: skill.id,
        title: subsectionData.title
      });

      if (existingSubsection.length === 0) {
        await base44.entities.ProgressSubsection.create({
          skillId: skill.id,
          pupilId,
          title: subsectionData.title,
          order: subsectionData.order,
          isCompleted: false
        });
      } else {
        // Migrate existing subsections: if they don't have completedMethod but are marked completed, backfill
        const subsection = existingSubsection[0];
        if (!subsection.completedMethod && subsection.isCompleted) {
          await base44.entities.ProgressSubsection.update(subsection.id, {
            completedMethod: 'full_talkthrough'
          });
        }
      }
    }

    // Recalculate this skill to ensure counts are correct
    await recalculateProgressSkill(skill.id);
  }

  await recalculateProgressSummary(pupilId);
}