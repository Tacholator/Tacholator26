import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin users to run this fix
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all users and pupils
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allPupils = await base44.asServiceRole.entities.Pupil.list();

    const results = {
      checked: 0,
      linked: [],
      notFound: [],
      alreadyLinked: [],
      errors: []
    };

    // Find regular users without linked pupil records
    for (const regularUser of allUsers) {
      // Skip admin users
      if (regularUser.role === 'admin') continue;

      results.checked++;

      // Check if user already has a linked pupil
      const existingLinkedPupil = allPupils.find(p => p.linkedUserId === regularUser.id);
      
      if (existingLinkedPupil) {
        results.alreadyLinked.push({
          userId: regularUser.id,
          userEmail: regularUser.email,
          pupilId: existingLinkedPupil.id,
          pupilName: `${existingLinkedPupil.firstName} ${existingLinkedPupil.lastName}`
        });
        continue;
      }

      // Try to find matching pupil by email
      const matchingPupil = allPupils.find(
        p => p.email && p.email.toLowerCase() === regularUser.email.toLowerCase() && !p.linkedUserId
      );

      if (matchingPupil) {
        try {
          // Link the pupil to the user
          await base44.asServiceRole.entities.Pupil.update(matchingPupil.id, {
            linkedUserId: regularUser.id,
            hasSignedUp: true
          });

          results.linked.push({
            userId: regularUser.id,
            userEmail: regularUser.email,
            pupilId: matchingPupil.id,
            pupilName: `${matchingPupil.firstName} ${matchingPupil.lastName}`
          });
        } catch (error) {
          results.errors.push({
            userId: regularUser.id,
            userEmail: regularUser.email,
            pupilId: matchingPupil.id,
            error: error.message
          });
        }
      } else {
        results.notFound.push({
          userId: regularUser.id,
          userEmail: regularUser.email,
          message: 'No matching Pupil record found by email'
        });
      }
    }

    return Response.json({
      success: true,
      summary: {
        totalChecked: results.checked,
        totalLinked: results.linked.length,
        totalAlreadyLinked: results.alreadyLinked.length,
        totalNotFound: results.notFound.length,
        totalErrors: results.errors.length
      },
      results
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});