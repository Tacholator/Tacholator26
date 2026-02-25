import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admin can run this fix
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    console.log('🔧 Starting pupil instructor data fix...');

    // Get all pupils
    const allPupils = await base44.asServiceRole.entities.Pupil.list();
    console.log(`📊 Found ${allPupils.length} total pupils`);

    // Get all users to build email->id mapping
    const allUsers = await base44.asServiceRole.entities.User.list();
    const emailToUserId = {};
    allUsers.forEach(u => {
      if (u.email) {
        emailToUserId[u.email.toLowerCase()] = u.id;
      }
    });
    console.log(`👥 Built mapping for ${Object.keys(emailToUserId).length} users`);

    const fixes = [];
    const errors = [];

    // Check each pupil
    for (const pupil of allPupils) {
      if (!pupil.instructorEmail) {
        errors.push({
          pupilId: pupil.id,
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          issue: 'Missing instructorEmail'
        });
        continue;
      }

      const expectedInstructorId = emailToUserId[pupil.instructorEmail.toLowerCase()];
      
      if (!expectedInstructorId) {
        errors.push({
          pupilId: pupil.id,
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          instructorEmail: pupil.instructorEmail,
          issue: 'Instructor user not found'
        });
        continue;
      }

      // Check if instructorId needs fixing
      if (pupil.instructorId !== expectedInstructorId) {
        console.log(`🔄 Fixing pupil ${pupil.firstName} ${pupil.lastName}:`);
        console.log(`   Old instructorId: ${pupil.instructorId}`);
        console.log(`   New instructorId: ${expectedInstructorId} (for ${pupil.instructorEmail})`);

        await base44.asServiceRole.entities.Pupil.update(pupil.id, {
          instructorId: expectedInstructorId
        });

        fixes.push({
          pupilId: pupil.id,
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          instructorEmail: pupil.instructorEmail,
          oldInstructorId: pupil.instructorId,
          newInstructorId: expectedInstructorId
        });
      }
    }

    console.log(`✅ Fixed ${fixes.length} pupils`);
    console.log(`⚠️ ${errors.length} errors/warnings`);

    return Response.json({
      success: true,
      summary: {
        totalPupils: allPupils.length,
        fixed: fixes.length,
        errors: errors.length
      },
      fixes,
      errors
    });

  } catch (error) {
    console.error('❌ Error fixing pupil data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});