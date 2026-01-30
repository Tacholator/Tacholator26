import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date().toISOString();
    
    // Get all bookable slot instances that have passed
    const allSlots = await base44.asServiceRole.entities.BookableSlotInstance.list();
    
    const pastSlots = allSlots.filter(slot => {
      // Only delete slots with status 'available'
      if (slot.status !== 'available') return false;
      
      // Check if slot end time has passed
      const slotEnd = new Date(slot.endAtUtc);
      const currentTime = new Date(now);
      
      return slotEnd < currentTime;
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