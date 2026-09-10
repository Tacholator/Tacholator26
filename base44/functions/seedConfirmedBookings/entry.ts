import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const instructorId = '69291dfc8ba784c871dcff5e';
    const pupilId = '6aa2e2f8b5e1723cf0f34ea1';
    const hourlyRate = 40;
    const durationHours = 1.5;
    const totalPrice = hourlyRate * durationHours; // 60
    const pickupLocation = '8 Bounty Road, RG21 3DD';
    const now = new Date().toISOString();

    // UK local times (BST = UTC+1) → UTC
    const slots = [
      { start: '2026-09-10T08:00:00.000Z', end: '2026-09-10T09:30:00.000Z' },
      { start: '2026-09-14T08:00:00.000Z', end: '2026-09-14T09:30:00.000Z' },
      { start: '2026-09-21T12:00:00.000Z', end: '2026-09-21T13:30:00.000Z' },
    ];

    const created = [];
    for (const slot of slots) {
      const booking = await base44.asServiceRole.entities.LessonBooking.create({
        instructorId,
        pupilId,
        startAtUtc: slot.start,
        endAtUtc: slot.end,
        durationHours,
        status: 'confirmed',
        isPracticalTest: false,
        chargesApplied: true,
        hourlyRateAtBookingGbp: hourlyRate,
        totalPriceGbp: totalPrice,
        escrowAmountGbp: totalPrice,
        pickupLocation,
        requestedAt: now,
        confirmedAt: now,
      });
      created.push({ id: booking.id, start: slot.start, end: slot.end });
    }

    // Escrow is held on each booking (escrowAmountGbp) but NOT deducted from
    // the pupil's available balance. The charge is applied on completion.

    return Response.json({
      createdBookings: created,
      escrowHeldNotDeducted: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}