import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function normalizePhoneToE164(phone) {
  if (!phone) return null;
  
  const cleaned = phone.trim().replace(/\s+/g, '');
  
  // Already in E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // UK number starting with 0
  if (cleaned.startsWith('0')) {
    return '+44' + cleaned.substring(1);
  }
  
  // UK number without prefix
  if (cleaned.match(/^[1-9]\d{9}$/)) {
    return '+44' + cleaned;
  }
  
  return cleaned;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const pupilId = payload?.data?.id || payload?.event?.entity_id;

    if (!pupilId) {
      return Response.json({ error: 'Invalid event data' }, { status: 400 });
    }

    // Read the pupil from the database rather than trusting the request body
    const pupil = await base44.asServiceRole.entities.Pupil
      .get(pupilId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!pupil) {
      return Response.json({ skipped: true, reason: 'Pupil not found' });
    }

    // Skip if phone is already normalized or missing
    if (!pupil.phone || pupil.phone.startsWith('+')) {
      return Response.json({ skipped: true, reason: 'Phone already normalized or missing' });
    }

    const normalizedPhone = normalizePhoneToE164(pupil.phone);
    
    if (normalizedPhone !== pupil.phone) {
      await base44.asServiceRole.entities.Pupil.update(pupil.id, {
        phone: normalizedPhone
      });
      
      return Response.json({ 
        success: true,
        originalPhone: pupil.phone,
        normalizedPhone: normalizedPhone
      });
    }

    return Response.json({ skipped: true, reason: 'No normalization needed' });

  } catch (error) {
    console.error('Normalize phone error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});