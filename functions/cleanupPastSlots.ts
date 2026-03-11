import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date().toISOString();

    // Filter server-side: only available slots whose end time is in the past
    const pastSlots = await base44.asServiceRole.entities.BookableSlotInstance.filter({
      status: 'available',
      endAtUtc: { $lt: now }
    });

    if (pastSlots.length === 0) {
      console.log('No past available slots to clean up');
      return Response.json({ success: true, deletedCount: 0, message: 'Nothing to clean up' });
    }

    // Delete in parallel batches of 20 to avoid timeouts
    const BATCH_SIZE = 20;
    let deletedCount = 0;

    for (let i = 0; i < pastSlots.length; i += BATCH_SIZE) {
      const batch = pastSlots.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(slot =>
        base44.asServiceRole.entities.BookableSlotInstance.delete(slot.id)
      ));
      deletedCount += batch.length;
      console.log(`Deleted batch: ${deletedCount}/${pastSlots.length}`);
    }

    console.log(`Cleaned up ${deletedCount} past available slots`);

    return Response.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} past available slots`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});