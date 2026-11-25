import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Trusted constants. The application ID is verified against the runtime's own
// server-side environment, never against anything the caller sends.
const EXPECTED_APP_ID = '6928de5cfb626066705b29e3';
const AUTHORISED_ADMIN_USER_ID = '6928de5cfb626066705b29e4';
const PAGE_SIZE = 200;

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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Application context: trusted server-side value, fail closed on mismatch.
    const runtimeAppId = Deno.env.get('BASE44_APP_ID');
    if (!runtimeAppId || runtimeAppId !== EXPECTED_APP_ID) {
      console.error('getAdminSubscriptionSummaries: application context mismatch');
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 2. Caller identity from the authenticated session only.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Authorisation: immutable user ID AND admin role. Role alone is not
    //    sufficient because every instructor also holds the admin role.
    //    Nothing from the request body is read or trusted here.
    if (user.id !== AUTHORISED_ADMIN_USER_ID || user.role !== 'admin') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 4. Read every page of subscriptions only after authorisation passed.
    const subscriptions = [];
    let cursor = null;

    for (;;) {
      const page = await base44.asServiceRole.entities.UserSubscription.list(
        cursor ? { limit: PAGE_SIZE, cursor } : { limit: PAGE_SIZE }
      );

      const items = Array.isArray(page?.items) ? page.items : [];
      for (const record of items) {
        subscriptions.push(toSubscriptionSummary(record));
      }

      if (!page?.has_more) break;

      const nextCursor = page?.next_cursor;
      if (!nextCursor || nextCursor === cursor) {
        // Fail loudly rather than return a silently truncated list.
        console.error('getAdminSubscriptionSummaries: pagination cursor did not advance');
        return Response.json({ success: false, error: 'Request failed' }, { status: 500 });
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
    return Response.json({ success: false, error: 'Request failed' }, { status: 500 });
  }
}