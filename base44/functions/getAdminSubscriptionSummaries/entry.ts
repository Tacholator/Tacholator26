import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Trusted constants. The application ID is verified against the runtime's own
// server-side environment, never against anything the caller sends.
const EXPECTED_APP_ID = '6928de5cfb626066705b29e3';
const AUTHORISED_ADMIN_USER_ID = '6928de5cfb626066705b29e4';

// SDK 0.8.54 supports list({ sort, limit, cursor }) returning one cursor page
// of { items, next_cursor, has_more }. Limit may go up to 5000.
const PAGE_LIMIT = 500;

// Allowlisted output fields only. No Stripe identifiers, no raw records.
function toSubscriptionSummary(record) {
  return {
    userId: record.userId ?? null,
    status: record.status ?? null,
    billingPeriod: record.billingPeriod ?? null,
    trialStartAt: record.trialStartAt ?? null,
    trialEndAt: record.trialEndAt ?? null,
    currentPeriodStartAt: record.currentPeriodStartAt ?? null,
    currentPeriodEndAt: record.currentPeriodEndAt ?? null,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd ?? false,
    lastPaymentAt: record.lastPaymentAt ?? null,
    lastPaymentStatus: record.lastPaymentStatus ?? null
  };
}

function fail(message, status, headers) {
  return Response.json({ success: false, error: message }, { status, headers });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return fail('Method Not Allowed', 405, { Allow: 'POST' });
  }

  try {
    const base44 = createClientFromRequest(req);

    // 1. Application context: trusted server-side value, fail closed on mismatch.
    const runtimeAppId = Deno.env.get('BASE44_APP_ID');
    if (!runtimeAppId || runtimeAppId !== EXPECTED_APP_ID) {
      console.error('getAdminSubscriptionSummaries: application context mismatch');
      return fail('Forbidden', 403);
    }

    // 2. Caller identity from the authenticated session only. auth.me() rejects
    //    with a Base44Error carrying .status === 401 when unauthenticated.
    const user = await base44.auth.me().catch((e) => (e && e.status === 401 ? null : Promise.reject(e)));
    if (!user || !user.id) {
      return fail('Unauthorized', 401);
    }

    // 3. Authorisation: immutable user ID AND admin role. Role alone is not
    //    sufficient because every instructor also holds the admin role.
    //    Nothing from the request body is read or trusted.
    if (user.id !== AUTHORISED_ADMIN_USER_ID || user.role !== 'admin') {
      return fail('Forbidden', 403);
    }

    // 4. Read every cursor page only after authorisation passed.
    const subscriptions = [];
    let cursor = null;

    for (;;) {
      const page = cursor
        ? await base44.asServiceRole.entities.UserSubscription.list({ cursor, limit: PAGE_LIMIT })
        : await base44.asServiceRole.entities.UserSubscription.list({ sort: '-created_date', limit: PAGE_LIMIT });

      // An unexpected response shape must never look like an empty success.
      if (!page || !Array.isArray(page.items) || typeof page.has_more !== 'boolean') {
        console.error('getAdminSubscriptionSummaries: unexpected page structure');
        return fail('Request failed', 500);
      }

      for (const record of page.items) {
        subscriptions.push(toSubscriptionSummary(record));
      }

      if (!page.has_more) break;

      const nextCursor = page.next_cursor;
      if (!nextCursor || nextCursor === cursor) {
        // Fail loudly rather than return a silently truncated list.
        console.error('getAdminSubscriptionSummaries: pagination cursor did not advance');
        return fail('Request failed', 500);
      }
      cursor = nextCursor;
    }

    return Response.json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    console.error('getAdminSubscriptionSummaries error:', error?.message || error);
    return fail('Request failed', 500);
  }
});