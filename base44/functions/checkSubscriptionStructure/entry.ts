import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { instructorEmail } = await req.json();

    // Get instructor first
    const instructors = await base44.asServiceRole.entities.Instructor.filter({ created_by: instructorEmail });
    if (instructors.length === 0) {
      return Response.json({ error: 'Instructor not found' }, { status: 404 });
    }
    const instructor = instructors[0];
    console.log('Instructor:', instructor.id, instructor.created_by);

    // Try different ways to find subscription
    const subsByUserId = await base44.asServiceRole.entities.UserSubscription.filter({ userId: instructor.id });
    const subsByEmail = await base44.asServiceRole.entities.UserSubscription.filter({ userId: instructorEmail });
    const allSubs = await base44.asServiceRole.entities.UserSubscription.list();

    // Find subs for this instructor by checking all
    const relevantSubs = allSubs.filter(s => s.userId === instructor.id || s.userId === instructorEmail || s.userId?.includes(instructorEmail));

    return Response.json({
      instructor: { id: instructor.id, created_by: instructor.created_by },
      subsByUserId: subsByUserId.length,
      subsByEmail: subsByEmail.length,
      allSubsCount: allSubs.length,
      relevantSubs: relevantSubs.slice(0, 3),
      firstFewSubs: allSubs.slice(0, 3).map(s => ({ userId: s.userId, status: s.status, id: s.id }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});