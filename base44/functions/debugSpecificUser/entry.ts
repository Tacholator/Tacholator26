import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    // Only allow admin users
    if (adminUser?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userEmail } = await req.json();
    
    if (!userEmail) {
      return Response.json({ error: 'userEmail is required in request body' }, { status: 400 });
    }

    // Fetch the specific user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

    if (!targetUser) {
      return Response.json({ 
        success: false,
        error: `User with email ${userEmail} not found` 
      }, { status: 404 });
    }

    // Fetch all pupils
    const allPupils = await base44.asServiceRole.entities.Pupil.list();

    // Check for linked pupil by linkedUserId
    const linkedPupilById = allPupils.find(p => p.linkedUserId === targetUser.id);

    // Check for matching pupil by email
    const matchingPupilByEmail = allPupils.filter(
      p => p.email && p.email.toLowerCase() === targetUser.email.toLowerCase()
    );

    // Layout.js logic simulation
    const isLearner = linkedPupilById !== null && linkedPupilById !== undefined;
    const isInstructor = !isLearner && targetUser.role === 'admin';

    // Determine what dashboard they would see
    let expectedDashboard;
    if (isInstructor) {
      expectedDashboard = 'InstructorDashboard';
    } else if (isLearner) {
      expectedDashboard = 'LearnerDashboard';
    } else {
      expectedDashboard = 'LearnerDashboard (default fallback)';
    }

    return Response.json({
      success: true,
      diagnosis: {
        userDetails: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.full_name,
          role: targetUser.role,
          createdDate: targetUser.created_date
        },
        pupilLinking: {
          hasLinkedPupilById: !!linkedPupilById,
          linkedPupilDetails: linkedPupilById ? {
            id: linkedPupilById.id,
            name: `${linkedPupilById.firstName} ${linkedPupilById.lastName}`,
            email: linkedPupilById.email,
            status: linkedPupilById.status,
            linkedUserId: linkedPupilById.linkedUserId,
            hasSignedUp: linkedPupilById.hasSignedUp
          } : null,
          matchingPupilsByEmail: matchingPupilByEmail.length,
          matchingPupilsDetails: matchingPupilByEmail.map(p => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            email: p.email,
            linkedUserId: p.linkedUserId,
            hasSignedUp: p.hasSignedUp,
            status: p.status
          }))
        },
        layoutLogic: {
          isLearner: isLearner,
          isInstructor: isInstructor,
          expectedDashboard: expectedDashboard,
          explanation: isInstructor 
            ? 'User has admin role and no linked pupil → shows InstructorDashboard'
            : isLearner
            ? 'User has linked pupil record → shows LearnerDashboard'
            : 'User has no admin role and no linked pupil → defaults to LearnerDashboard'
        },
        issue: !isLearner && targetUser.role !== 'admin' ? {
          severity: 'HIGH',
          problem: 'User is not an admin but has no linked Pupil record',
          impact: 'Will see LearnerDashboard by default but may have navigation/access issues',
          solution: matchingPupilByEmail.length > 0 && !matchingPupilByEmail[0].linkedUserId
            ? `Link Pupil (ID: ${matchingPupilByEmail[0].id}) to this user by setting linkedUserId=${targetUser.id}`
            : 'Create a new Pupil record for this user or verify their role should be admin'
        } : isInstructor && matchingPupilByEmail.length > 0 ? {
          severity: 'MEDIUM',
          problem: 'User has admin role but matching Pupil records exist by email',
          impact: 'User sees InstructorDashboard as intended, but there may be data confusion',
          solution: 'Verify if this user should be an instructor or a learner. If learner, change role to "user" and link to pupil record'
        } : null
      }
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});