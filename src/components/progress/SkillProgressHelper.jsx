import { base44 } from '@/api/base44Client';

export async function recalculateSkillProgress(skillId) {
  const skill = await base44.entities.Skill.filter({ id: skillId }).then(s => s[0]);
  if (!skill) return;

  const subsections = await base44.entities.SkillSubsection.filter({ skillId });
  
  const total = subsections.length;
  const completed = subsections.filter(s => s.status === 'completed').length;
  const ratio = total > 0 ? completed / total : 0;

  const updates = {
    subsectionsTotal: total,
    subsectionsCompleted: completed,
    subsectionsCompletionRatio: ratio
  };

  if (!skill.overrideCompleted) {
    if (completed === 0) {
      updates.status = 'not_started';
      updates.completedAt = null;
      updates.completedByUserId = null;
    } else if (completed > 0 && completed < total) {
      updates.status = 'in_progress';
      updates.completedAt = null;
      updates.completedByUserId = null;
    } else if (total > 0 && completed === total) {
      updates.status = 'completed';
      updates.completedAt = new Date().toISOString();
      const user = await base44.auth.me();
      updates.completedByUserId = user.id;
    }
  }

  await base44.entities.Skill.update(skillId, updates);
  await recalculatePupilProgress(skill.pupilId);
}

export async function recalculatePupilProgress(pupilId) {
  const skills = await base44.entities.Skill.filter({ pupilId });
  const completedCount = skills.filter(s => s.status === 'completed').length;
  const ratio = completedCount / 24;
  const percent = Math.round(ratio * 100);

  const existingSummary = await base44.entities.PupilProgressSummary.filter({ pupilId });
  
  const data = {
    pupilId,
    totalParentSkills: 24,
    completedParentSkills: completedCount,
    overallProgressRatio: ratio,
    overallProgressPercent: percent,
    lastUpdatedAt: new Date().toISOString()
  };

  if (existingSummary.length > 0) {
    await base44.entities.PupilProgressSummary.update(existingSummary[0].id, data);
  } else {
    await base44.entities.PupilProgressSummary.create(data);
  }
}

export async function initializeSkillsForPupil(pupilId, instructorId, skillsData) {
  for (const skillData of skillsData) {
    const existingSkill = await base44.entities.Skill.filter({ 
      pupilId, 
      title: skillData.title 
    });

    let skill;
    if (existingSkill.length > 0) {
      skill = existingSkill[0];
    } else {
      skill = await base44.entities.Skill.create({
        pupilId,
        instructorId,
        title: skillData.title || 'Untitled Skill',
        order: skillData.order || 0,
        status: 'not_started',
        subsectionsTotal: skillData.subsections?.length || 0,
        subsectionsCompleted: 0,
        subsectionsCompletionRatio: 0
      });
    }

    for (const subsectionData of skillData.subsections) {
      const existingSubsection = await base44.entities.SkillSubsection.filter({
        skillId: skill.id,
        title: subsectionData.title
      });

      if (existingSubsection.length === 0) {
        await base44.entities.SkillSubsection.create({
          skillId: skill.id,
          pupilId,
          title: subsectionData.title || 'Untitled Section',
          order: subsectionData.order || 0,
          status: 'not_started'
        });
      }
    }
  }

  await recalculatePupilProgress(pupilId);
}