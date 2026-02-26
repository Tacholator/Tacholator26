import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin users to run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all users and pupils
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allPupils = await base44.asServiceRole.entities.Pupil.list();

    const unlinkedUsers = [];

    // Find regular users without linked pupil records
    for (const regularUser of allUsers) {
      // Skip admin users
      if (regularUser.role === 'admin') continue;

      // Check if user has a linked pupil
      const hasLinkedPupil = allPupils.some(p => p.linkedUserId === regularUser.id);
      
      if (!hasLinkedPupil) {
        // Check if there's a matching pupil by email
        const matchingPupilByEmail = allPupils.find(
          p => p.email && p.email.toLowerCase() === regularUser.email.toLowerCase()
        );

        unlinkedUsers.push({
          userId: regularUser.id,
          userEmail: regularUser.email,
          userFullName: regularUser.full_name,
          userRole: regularUser.role,
          userCreatedDate: regularUser.created_date,
          matchingPupilFound: !!matchingPupilByEmail,
          matchingPupilId: matchingPupilByEmail?.id,
          matchingPupilName: matchingPupilByEmail 
            ? `${matchingPupilByEmail.firstName} ${matchingPupilByEmail.lastName}`
            : null,
          matchingPupilLinkedUserId: matchingPupilByEmail?.linkedUserId,
          canAutoLink: !!matchingPupilByEmail && !matchingPupilByEmail.linkedUserId
        });
      }
    }

    return Response.json({
      success: true,
      totalUnlinked: unlinkedUsers.length,
      canAutoLinkCount: unlinkedUsers.filter(u => u.canAutoLink).length,
      users: unlinkedUsers
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});