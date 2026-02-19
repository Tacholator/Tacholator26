import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Convert UK phone numbers to E.164 format
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 07, convert to +447
  if (digits.startsWith('07') && digits.length === 11) {
    return `+44${digits.substring(1)}`;
  }
  
  // If starts with 447, add +
  if (digits.startsWith('447') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If already starts with +44, return as is
  if (phone.startsWith('+44')) {
    return phone;
  }
  
  // Return null if format not recognized
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all pupils
    const pupils = await base44.asServiceRole.entities.Pupil.list();
    
    const results = [];
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const pupil of pupils) {
      if (!pupil.phone) {
        results.push({
          id: pupil.id,
          name: `${pupil.firstName} ${pupil.lastName}`,
          status: 'skipped',
          reason: 'No phone number'
        });
        skipped++;
        continue;
      }

      const normalized = normalizePhoneNumber(pupil.phone);
      
      if (!normalized) {
        results.push({
          id: pupil.id,
          name: `${pupil.firstName} ${pupil.lastName}`,
          status: 'failed',
          original: pupil.phone,
          reason: 'Unrecognized format'
        });
        failed++;
        continue;
      }

      // Skip if already normalized
      if (pupil.phone === normalized) {
        results.push({
          id: pupil.id,
          name: `${pupil.firstName} ${pupil.lastName}`,
          status: 'skipped',
          reason: 'Already in E.164 format',
          phone: pupil.phone
        });
        skipped++;
        continue;
      }

      // Update phone number
      try {
        await base44.asServiceRole.entities.Pupil.update(pupil.id, {
          phone: normalized
        });
        
        results.push({
          id: pupil.id,
          name: `${pupil.firstName} ${pupil.lastName}`,
          status: 'updated',
          original: pupil.phone,
          normalized: normalized
        });
        updated++;
      } catch (error) {
        results.push({
          id: pupil.id,
          name: `${pupil.firstName} ${pupil.lastName}`,
          status: 'failed',
          original: pupil.phone,
          error: error.message
        });
        failed++;
      }
    }

    return Response.json({
      success: true,
      summary: {
        total: pupils.length,
        updated,
        skipped,
        failed
      },
      results
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});