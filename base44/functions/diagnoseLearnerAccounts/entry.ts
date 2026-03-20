import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin users to run this diagnostic
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Fetch all pupils
    const allPupils = await base44.asServiceRole.entities.Pupil.list();

    // Categorize users
    const userAnalysis = {
      totalUsers: allUsers.length,
      totalPupils: allPupils.length,
      admins: [],
      regularUsers: [],
      usersWithLinkedPupil: [],
      usersWithoutLinkedPupil: [],
      pupilsWithoutLinkedUser: [],
      pupilsWithLinkedUser: [],
      issues: []
    };

    // Analyze each user
    for (const user of allUsers) {
      if (user.role === 'admin') {
        userAnalysis.admins.push({
          id: user.id,
          email: user.email,
          fullName: user.full_name
        });
      } else {
        userAnalysis.regularUsers.push({
          id: user.id,
          email: user.email,
          fullName: user.full_name
        });

        // Check if this user has a linked pupil record
        const linkedPupil = allPupils.find(p => p.linkedUserId === user.id);
        
        if (linkedPupil) {
          userAnalysis.usersWithLinkedPupil.push({
            userId: user.id,
            userEmail: user.email,
            pupilId: linkedPupil.id,
            pupilName: `${linkedPupil.firstName} ${linkedPupil.lastName}`
          });
        } else {
          // Check if there's a pupil with matching email but no linkedUserId
          const pupilWithMatchingEmail = allPupils.find(
            p => p.email && p.email.toLowerCase() === user.email.toLowerCase()
          );

          if (pupilWithMatchingEmail) {
            userAnalysis.issues.push({
              type: 'unlinked_matching_email',
              userId: user.id,
              userEmail: user.email,
              pupilId: pupilWithMatchingEmail.id,
              pupilName: `${pupilWithMatchingEmail.firstName} ${pupilWithMatchingEmail.lastName}`,
              linkedUserId: pupilWithMatchingEmail.linkedUserId
            });
          } else {
            userAnalysis.usersWithoutLinkedPupil.push({
              userId: user.id,
              userEmail: user.email,
              userFullName: user.full_name
            });
          }
        }
      }
    }

    // Analyze pupils
    for (const pupil of allPupils) {
      if (pupil.linkedUserId) {
        const linkedUser = allUsers.find(u => u.id === pupil.linkedUserId);
        if (linkedUser) {
          userAnalysis.pupilsWithLinkedUser.push({
            pupilId: pupil.id,
            pupilName: `${pupil.firstName} ${pupil.lastName}`,
            pupilEmail: pupil.email,
            linkedUserId: pupil.linkedUserId,
            linkedUserEmail: linkedUser.email
          });
        } else {
          userAnalysis.issues.push({
            type: 'invalid_linked_user',
            pupilId: pupil.id,
            pupilName: `${pupil.firstName} ${pupil.lastName}`,
            linkedUserId: pupil.linkedUserId,
            message: 'Pupil has linkedUserId but user does not exist'
          });
        }
      } else {
        userAnalysis.pupilsWithoutLinkedUser.push({
          pupilId: pupil.id,
          pupilName: `${pupil.firstName} ${pupil.lastName}`,
          pupilEmail: pupil.email,
          hasSignedUp: pupil.hasSignedUp
        });
      }
    }

    // Generate summary
    const summary = {
      totalAdmins: userAnalysis.admins.length,
      totalRegularUsers: userAnalysis.regularUsers.length,
      usersWithLinkedPupil: userAnalysis.usersWithLinkedPupil.length,
      usersWithoutLinkedPupil: userAnalysis.usersWithoutLinkedPupil.length,
      pupilsWithLinkedUser: userAnalysis.pupilsWithLinkedUser.length,
      pupilsWithoutLinkedUser: userAnalysis.pupilsWithoutLinkedUser.length,
      totalIssues: userAnalysis.issues.length,
      
      diagnosis: []
    };

    // Diagnose issues
    if (userAnalysis.usersWithoutLinkedPupil.length > 0) {
      summary.diagnosis.push({
        severity: 'HIGH',
        issue: `${userAnalysis.usersWithoutLinkedPupil.length} regular users have no linked Pupil record`,
        impact: 'These users will see Instructor Dashboard because isLearner=false',
        solution: 'Link these users to their Pupil records or create Pupil records for them'
      });
    }

    if (userAnalysis.issues.filter(i => i.type === 'unlinked_matching_email').length > 0) {
      summary.diagnosis.push({
        severity: 'HIGH',
        issue: `${userAnalysis.issues.filter(i => i.type === 'unlinked_matching_email').length} users have matching Pupil records by email but linkedUserId is not set`,
        impact: 'These users will see Instructor Dashboard instead of Learner Dashboard',
        solution: 'Update Pupil records to set linkedUserId field'
      });
    }

    return Response.json({
      success: true,
      summary,
      details: userAnalysis
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});