import { base44 } from '@/api/base44Client';
import { PROGRESS_SKILLS_DATA, SUBSECTION_ALIAS_MAP } from './progressSkillsData';

export async function recalculateProgressSkill(skillId) {
  const skill = await base44.entities.ProgressSkill.filter({ id: skillId }).then(s => s[0]);
  if (!skill) return;

  const subsections = await base44.entities.ProgressSubsection.filter({ skillId });
  
  const total = subsections.length;
  const completed = subsections.filter(s => s.isCompleted).length;
  const ratio = total > 0 ? completed / total : 0;

  const updates = {
    subsectionsTotal: total,
    subsectionsCompleted: completed,
    subsectionsRatio: ratio
  };

  // Derive status from subsections
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
    if (!skill.completedAt) {
      updates.completedAt = new Date().toISOString();
      const user = await base44.auth.me();
      updates.completedByUserId = user.id;
    }
  }

  await base44.entities.ProgressSkill.update(skillId, updates);
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

function normalizeTitle(title) {
  return title.toLowerCase().trim();
}

function applyAliasMap(skillKey, subsectionTitle) {
  const normalized = normalizeTitle(subsectionTitle);
  if (SUBSECTION_ALIAS_MAP[skillKey] && SUBSECTION_ALIAS_MAP[skillKey][normalized]) {
    return SUBSECTION_ALIAS_MAP[skillKey][normalized];
  }
  return subsectionTitle;
}

export async function initializeProgressSkills(pupilId, instructorId, skillsData) {
  // Get existing skills for this pupil
  const existingSkills = await base44.entities.ProgressSkill.filter({ pupilId });
  
  // Track which existing skills were matched to canonical skills
  const matchedSkillIds = new Set();
  
  for (const skillData of skillsData) {
    // Try to match by skill_key first, then by title
    let skill = existingSkills.find(s => s.skillKey === skillData.skillKey);
    if (!skill) {
      skill = existingSkills.find(s => 
        normalizeTitle(s.title) === normalizeTitle(skillData.title) && 
        !matchedSkillIds.has(s.id)
      );
    }

    // Create or update skill
    if (!skill) {
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
    } else {
      // Update existing skill with canonical data
      await base44.entities.ProgressSkill.update(skill.id, {
        skillKey: skillData.skillKey,
        title: skillData.title,
        order: skillData.order
      });
      matchedSkillIds.add(skill.id);
    }

    // Get existing subsections for this skill
    const existingSubsections = await base44.entities.ProgressSubsection.filter({
      skillId: skill.id,
      pupilId
    });

    // Process canonical subsections
    const canonicalTitles = skillData.subsections.map(s => normalizeTitle(s.title));
    const matchedSubsectionIds = new Set();
    
    for (const subsectionData of skillData.subsections) {
      // Apply alias mapping
      const targetTitle = applyAliasMap(skillData.skillKey, subsectionData.title);
      
      // Check if subsection exists (match by normalized title or alias)
      let subsection = existingSubsections.find(s => {
        if (matchedSubsectionIds.has(s.id)) return false;
        
        const normalizedExisting = normalizeTitle(s.title);
        const normalizedTarget = normalizeTitle(targetTitle);
        const aliasedExisting = applyAliasMap(skillData.skillKey, s.title);
        
        return normalizedExisting === normalizedTarget || 
               normalizeTitle(aliasedExisting) === normalizedTarget;
      });

      if (!subsection) {
        // Create new subsection
        await base44.entities.ProgressSubsection.create({
          skillId: skill.id,
          pupilId,
          title: targetTitle,
          order: subsectionData.order,
          isCompleted: false
        });
      } else {
        // Update existing subsection with canonical title and order
        await base44.entities.ProgressSubsection.update(subsection.id, {
          title: targetTitle,
          order: subsectionData.order
        });
        matchedSubsectionIds.add(subsection.id);
      }
    }

    // Delete non-canonical subsections to enforce canonical structure
    for (const existingSubsection of existingSubsections) {
      if (!matchedSubsectionIds.has(existingSubsection.id)) {
        await base44.entities.ProgressSubsection.delete(existingSubsection.id);
      }
    }

    // Recalculate skill progress
    await recalculateProgressSkill(skill.id);
  }

  // Delete non-canonical skills to enforce canonical structure
  for (const existingSkill of existingSkills) {
    if (!matchedSkillIds.has(existingSkill.id)) {
      // Delete all subsections for this skill first
      const subsections = await base44.entities.ProgressSubsection.filter({
        skillId: existingSkill.id,
        pupilId
      });
      for (const subsection of subsections) {
        await base44.entities.ProgressSubsection.delete(subsection.id);
      }
      // Delete the skill
      await base44.entities.ProgressSkill.delete(existingSkill.id);
    }
  }

  // Final summary recalculation
  await recalculateProgressSummary(pupilId);
}

export async function migrateExistingSkills(pupilId) {
  // This function handles migration of existing data to canonical structure
  const existingSkills = await base44.entities.ProgressSkill.filter({ pupilId });
  
  if (existingSkills.length === 0) return;

  // Map old skill keys/titles to new canonical ones
  const titleMappings = {
    'cockpit drill and safety checks': 'Cockpit & Safety Procedures',
    'controls and instruments': 'Main Car Controls',
    'moving off and stopping': 'Moving Off (POM)',
    'safe position on the road': 'Use of Speed',
    'mirrors – vision and use': 'Use of Mirrors',
    'signals – when and how to give them': 'Use of Signals',
    'anticipation and planning': 'Planning Skills',
    'positioning': 'Making Progress',
    'turning at junctions': 'Junctions',
    'reverse and park (control and accuracy)': 'Manoeuvres',
    'judgement (overtaking, meeting, crossing)': 'Meeting Traffic',
    'positioning (normal driving and lane discipline)': 'Making Progress',
    'ancillary controls': 'Main Car Controls',
    'move off (control and safety)': 'Moving Off (POM)'
  };

  // Update skills to match canonical structure
  for (const skill of existingSkills) {
    const normalizedTitle = normalizeTitle(skill.title);
    const canonicalSkill = PROGRESS_SKILLS_DATA.find(cs => 
      cs.skillKey === skill.skillKey || 
      normalizeTitle(cs.title) === normalizedTitle ||
      titleMappings[normalizedTitle] === cs.title
    );

    if (canonicalSkill) {
      await base44.entities.ProgressSkill.update(skill.id, {
        skillKey: canonicalSkill.skillKey,
        title: canonicalSkill.title,
        order: canonicalSkill.order
      });
    }
  }
}