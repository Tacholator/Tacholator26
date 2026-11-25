import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Temporary diagnostic page. Not listed in navigation. Remove after testing.
const EXPECTED_APP_ID = '6928de5cfb626066705b29e3';
const AUTHORISED_ADMIN_USER_ID = '6928de5cfb626066705b29e4';
const FUNCTION_NAME = 'getAdminSubscriptionSummaries';

// Published origins reported by the platform for this app. Used for display only:
// matching one proves nothing, and not matching one does not prove the editor.
const PUBLISHED_HOSTS = ['mobrage-learner-705b29e3.base44.app', 'app.tacholator.com'];

// The function's exact output contract: ten allowlisted fields per summary.
const EXPECTED_FIELDS = [
  'billingPeriod',
  'cancelAtPeriodEnd',
  'currentPeriodEndAt',
  'currentPeriodStartAt',
  'lastPaymentAt',
  'lastPaymentStatus',
  'status',
  'trialEndAt',
  'trialStartAt',
  'userId'
];

// The only strings the function itself emits in a failure body.
const FUNCTION_ERROR_STRINGS = ['Unauthorized', 'Forbidden', 'Method Not Allowed', 'Request failed'];

// What was investigated for a trustworthy preview signal, and why none was found.
const PREVIEW_INDICATOR_FINDINGS = [
  'Page parameters carry only app id, server URL, access token, from URL and functions version. There is no environment or preview flag.',
  'The SDK client is created without platform headers, so Base44-State and X-Data-Env are never readable in the browser.',
  'The editor handshake in main.jsx is outbound only: it posts sandbox update events to the parent and receives nothing back.',
  'Being framed and not matching a published host are properties any embedder can produce, so neither identifies the editor.',
  'The editor preview hostname is minted per session and is not exposed to app code.'
];

const OUTCOME_STYLES = {
  authorised: 'bg-emerald-100 text-emerald-800',
  'function denied': 'bg-rose-100 text-rose-800',
  'gateway or auth failure': 'bg-fuchsia-100 text-fuchsia-800',
  'unexpected error': 'bg-amber-100 text-amber-800',
  'unverified response': 'bg-orange-100 text-orange-800',
  blocked: 'bg-slate-200 text-slate-800'
};

function readEnvironment() {
  const appId = appParams.appId ?? null;
  const version = appParams.functionsVersion;
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const framed = typeof window !== 'undefined' && window.parent !== window;
  return {
    appId,
    appIdMatches: appId === EXPECTED_APP_ID,
    versionPresent: typeof version === 'string' && version.trim() !== '',
    host,
    framed,
    publishedHost: PUBLISHED_HOSTS.includes(host),
    // No trustworthy indicator exists, so this is never satisfied.
    previewVerified: false
  };
}

function collectBlocks(env, identity) {
  const blocks = [];
  if (!env.appIdMatches) {
    blocks.push('The resolved application ID does not match the production Tacholator application.');
  }
  if (!identity || !identity.id || !identity.role) {
    blocks.push('The signed-in identity has not been retrieved, so a result could not be attributed to a user.');
  }
  if (!env.versionPresent) {
    blocks.push('No functions version is present on this page, so a request could not be aimed at the editor copy of the function.');
  }
  if (!env.previewVerified) {
    blocks.push('No trustworthy indicator of the editor preview environment exists, so a result could not be shown to describe the editor copy rather than the published one.');
  }
  if (env.publishedHost) {
    blocks.push(`This page is on a published host (${env.host}).`);
  }
  return blocks;
}

// Validates each summary independently against the exact allowlist.
function inspectRecords(records) {
  const missingNames = new Set();
  const unexpectedNames = new Set();
  let valid = 0;
  let withMissing = 0;
  let withUnexpected = 0;
  let nonObject = 0;

  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      nonObject += 1;
      continue;
    }
    const keys = Object.keys(record);
    const missing = EXPECTED_FIELDS.filter((field) => !keys.includes(field));
    const unexpected = keys.filter((key) => !EXPECTED_FIELDS.includes(key));
    if (missing.length > 0) {
      withMissing += 1;
      missing.forEach((name) => missingNames.add(name));
    }
    if (unexpected.length > 0) {
      withUnexpected += 1;
      unexpected.forEach((name) => unexpectedNames.add(name));
    }
    if (missing.length === 0 && unexpected.length === 0) valid += 1;
  }

  return {
    checked: records.length,
    valid,
    withMissing,
    withUnexpected,
    nonObject,
    missingNames: Array.from(missingNames).sort(),
    unexpectedNames: Array.from(unexpectedNames).sort(),
    empty: records.length === 0,
    allValid: records.length > 0 && nonObject === 0 && valid === records.length
  };
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="break-all text-right font-mono text-slate-900">{String(value)}</span>
    </div>
  );
}

export default function AdminSubscriptionFunctionProbe() {
  const [identity, setIdentity] = useState(null);
  const [identityStatus, setIdentityStatus] = useState('reading');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const requestLock = useRef(false);

  // Identity only. The subscription function is never called from an effect.
  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then((me) => {
        if (cancelled) return;
        setIdentity({ id: me?.id ?? null, role: me?.role ?? null });
        setIdentityStatus('retrieved');
      })
      .catch(() => {
        if (cancelled) return;
        setIdentity(null);
        setIdentityStatus('failed');
      });
    return () => { cancelled = true; };
  }, []);

  const env = readEnvironment();
  const blocks = collectBlocks(env, identity);
  const isAuthorisedMainAdmin = !!identity?.id && identity.id === AUTHORISED_ADMIN_USER_ID;

  const runProbe = async () => {
    // Synchronous lock, taken before any await.
    if (requestLock.current) return;
    requestLock.current = true;
    setBusy(true);

    try {
      // Identity is re-read and every guard re-checked before anything is invoked.
      let freshIdentity = null;
      try {
        const me = await base44.auth.me();
        freshIdentity = { id: me?.id ?? null, role: me?.role ?? null };
        setIdentity(freshIdentity);
        setIdentityStatus('retrieved');
      } catch {
        freshIdentity = null;
        setIdentity(null);
        setIdentityStatus('failed');
      }

      const currentEnv = readEnvironment();
      const freshBlocks = collectBlocks(currentEnv, freshIdentity);
      if (freshBlocks.length > 0) {
        setResult({ outcome: 'blocked', blocks: freshBlocks });
        return;
      }

      const res = await base44.functions.invoke(FUNCTION_NAME, {});
      const body = res?.data ?? null;
      const records = body?.subscriptions;
      const httpStatus = typeof res?.status === 'number' ? res.status : null;
      const isArray = Array.isArray(records);
      const declaredCount = typeof body?.count === 'number' ? body.count : null;
      const arrayLength = isArray ? records.length : null;
      const countMatches = declaredCount !== null && arrayLength !== null && declaredCount === arrayLength;
      const fields = isArray
        ? inspectRecords(records)
        : { checked: 0, valid: 0, withMissing: 0, withUnexpected: 0, nonObject: 0, missingNames: [], unexpectedNames: [], empty: false, allValid: false };

      const fieldValidation = !isArray
        ? 'unverified (no array returned)'
        : fields.empty
          ? 'unverified (empty array)'
          : fields.allValid
            ? 'verified'
            : 'failed';

      const authorised = httpStatus === 200
        && body?.success === true
        && isArray
        && countMatches
        && (fields.empty || fields.allValid);

      setResult({
        outcome: authorised ? 'authorised' : 'unverified response',
        httpStatus: httpStatus ?? 'not exposed',
        backendSuccess: typeof body?.success === 'boolean' ? body.success : null,
        declaredCount,
        arrayLength,
        countMatches,
        fields,
        fieldValidation,
        serverMessage: null,
        note: null,
        blocks: []
      });
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data ?? null;
      const fromFunction = data?.success === false
        && typeof data?.error === 'string'
        && FUNCTION_ERROR_STRINGS.includes(data.error);
      const isDenialStatus = status === 401 || status === 403;

      let outcome = 'unexpected error';
      if (isDenialStatus) outcome = fromFunction ? 'function denied' : 'gateway or auth failure';

      setResult({
        outcome,
        httpStatus: typeof status === 'number' ? status : 'not exposed',
        backendSuccess: typeof data?.success === 'boolean' ? data.success : null,
        declaredCount: null,
        arrayLength: null,
        countMatches: null,
        fields: null,
        fieldValidation: 'not reached',
        serverMessage: fromFunction ? data.error : (data ? 'suppressed' : null),
        note: outcome === 'function denied'
          ? 'The function replied with its own error body. A 403 Forbidden comes from either the application-context check or the admin identity check, so this alone does not prove the admin gate was the one that ran.'
          : outcome === 'gateway or auth failure'
            ? 'A denial status arrived without the function\'s own error body, so it may come from the gateway or session rather than the function.'
            : null,
        blocks: []
      });
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscription function probe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Temporary diagnostic page. Invocation is blocked until a trustworthy preview indicator exists. Remove this page after testing.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader>
        <CardContent>
          <Row label="App ID in use" value={env.appId ?? 'not set'} />
          <Row label="Matches production app" value={env.appIdMatches} />
          <Row label="Functions version" value={env.versionPresent ? 'present' : 'missing'} />
          <Row label="Host" value={env.host || 'unknown'} />
          <Row label="Inside editor frame" value={env.framed} />
          <Row label="Known published host" value={env.publishedHost} />
          <Row label="Trustworthy preview indicator" value={env.previewVerified ? 'present' : 'none found'} />
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-500">
            {PREVIEW_INDICATOR_FINDINGS.map((finding) => <li key={finding}>{finding}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Signed in as</CardTitle></CardHeader>
        <CardContent>
          <Row label="Identity status" value={identityStatus} />
          <Row label="Immutable user ID" value={identity?.id ?? 'unknown'} />
          <Row label="Role" value={identity?.role ?? 'unknown'} />
          <Row label="Matches authorised main administrator" value={isAuthorisedMainAdmin} />
          <p className="mt-3 text-xs text-slate-500">Diagnostic only. It does not affect who may run the test.</p>
        </CardContent>
      </Card>

      {blocks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader><CardTitle className="text-base text-amber-900">Testing blocked</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
              {blocks.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button onClick={runProbe} disabled={busy || blocks.length > 0} className="w-full">
        {busy ? 'Running' : 'Run authorisation test'}
      </Button>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[result.outcome]}`}>
                {result.outcome}
              </span>
              Observed result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.outcome === 'blocked' ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {result.blocks.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : (
              <>
                <Row label="HTTP status" value={result.httpStatus} />
                <Row label="Backend success flag" value={result.backendSuccess} />
                <Row label="Declared count" value={result.declaredCount ?? 'not returned'} />
                <Row label="Summaries returned" value={result.arrayLength ?? 'not an array'} />
                <Row label="Count matches array length" value={result.countMatches ?? 'not verifiable'} />
                {result.fields && (
                  <>
                    <Row label="Records checked" value={result.fields.checked} />
                    <Row label="Records matching allowlist exactly" value={result.fields.valid} />
                    <Row label="Records with missing fields" value={result.fields.withMissing} />
                    <Row label="Records with unexpected fields" value={result.fields.withUnexpected} />
                    <Row label="Non-object records" value={result.fields.nonObject} />
                    <Row label="Missing field names" value={result.fields.missingNames.join(', ') || 'none'} />
                    <Row label="Unexpected field names" value={result.fields.unexpectedNames.join(', ') || 'none'} />
                  </>
                )}
                <Row label="Field validation" value={result.fieldValidation} />
                {result.serverMessage && <Row label="Server message" value={result.serverMessage} />}
                {result.note && <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.note}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}