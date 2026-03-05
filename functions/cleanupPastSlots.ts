import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date().toISOString();
    
    // Get all bookable slot instances that are available
    const allSlots = await base44.asServiceRole.entities.BookableSlotInstance.filter({ status: 'available' });
    
    const pastSlots = allSlots.filter(slot => {
      const slotEnd = new Date(slot.endAtUtc);
      return slotEnd < new Date(now);
    });

    // Delete past available slots
    let deletedCount = 0;
    for (const slot of pastSlots) {
      await base44.asServiceRole.entities.BookableSlotInstance.delete(slot.id);
      deletedCount++;
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