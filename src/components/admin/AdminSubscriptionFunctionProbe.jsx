import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Temporary diagnostic page. Not listed in navigation. Remove after testing.
const EXPECTED_APP_ID = '6928de5cfb626066705b29e3';
const FUNCTION_NAME = 'getAdminSubscriptionSummaries';

// Published origins, as reported by the platform for this app. The editor preview
// host is minted per session and cannot be verified from inside the app, so the
// environment check is a fail-closed exclusion of these hosts plus a frame check.
const PUBLISHED_HOSTS = ['mobrage-learner-705b29e3.base44.app', 'app.tacholator.com'];

// Allowlist the function returns. Used to detect an unexpected shape, never values.
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

// The only strings the function itself emits on failure.
const SAFE_SERVER_MESSAGES = ['Unauthorized', 'Forbidden', 'Method Not Allowed', 'Request failed'];

const OUTCOME_STYLES = {
  authorised: 'bg-emerald-100 text-emerald-800',
  'permission denied': 'bg-rose-100 text-rose-800',
  'unexpected error': 'bg-amber-100 text-amber-800',
  'unverified response': 'bg-orange-100 text-orange-800',
  blocked: 'bg-slate-200 text-slate-800'
};

function readEnvironment() {
  const appId = appParams.appId ?? null;
  const version = appParams.functionsVersion;
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const framed = typeof window !== 'undefined' && window.parent !== window;
  const publishedHost = PUBLISHED_HOSTS.includes(host);
  return {
    appId,
    appIdMatches: appId === EXPECTED_APP_ID,
    versionPresent: typeof version === 'string' && version.trim() !== '',
    host,
    framed,
    publishedHost,
    previewConditional: framed && !publishedHost
  };
}

function collectBlocks(env, identity) {
  const blocks = [];
  if (!env.appIdMatches) {
    blocks.push('The resolved application ID does not match the production Tacholator application.');
  }
  if (!identity || !identity.id || !identity.role) {
    blocks.push('The signed-in identity has not been retrieved, so the result could not be attributed to a user.');
  }
  if (!env.versionPresent) {
    blocks.push('No functions version is present on this page, so the request could not be aimed at the editor copy of the function.');
  }
  if (env.publishedHost) {
    blocks.push(`This page is running on a published host (${env.host}). The live app calls the last published function version, so a result here would say nothing about the editor version.`);
  } else if (!env.framed) {
    blocks.push('This page is not inside the editor preview frame, so preview isolation cannot be established.');
  }
  return blocks;
}

function inspectFields(records) {
  const names = new Set();
  let allObjects = true;
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      allObjects = false;
      continue;
    }
    Object.keys(record).forEach((key) => names.add(key));
  }
  const sorted = Array.from(names).sort();
  return {
    names: sorted,
    allObjects,
    unexpected: sorted.filter((name) => !EXPECTED_FIELDS.includes(name)),
    missing: EXPECTED_FIELDS.filter((name) => !names.has(name))
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

  // Identity only. The subscription function is never called from an effect.
  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then((me) => {
        if (cancelled) return;
        setIdentity({ id: me?.id ?? null, role: me?.role ?? null });
        setIdentityStatus('retrieved');
      })
      .catch((e) => {
        if (cancelled) return;
        setIdentity(null);
        setIdentityStatus(`failed (${e?.status ?? e?.response?.status ?? 'no status exposed'})`);
      });
    return () => { cancelled = true; };
  }, []);

  const env = readEnvironment();
  const blocks = collectBlocks(env, identity);
  const canRun = !busy && blocks.length === 0;

  const runProbe = async () => {
    // Every check is repeated here; the disabled button is not the guard.
    const currentEnv = readEnvironment();
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

    const freshBlocks = collectBlocks(currentEnv, freshIdentity);
    if (freshBlocks.length > 0) {
      setResult({ outcome: 'blocked', blocks: freshBlocks });
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke(FUNCTION_NAME, {});
      const body = res?.data ?? null;
      const records = body?.subscriptions;
      const httpStatus = typeof res?.status === 'number' ? res.status : null;
      const isArray = Array.isArray(records);
      const fields = isArray
        ? inspectFields(records)
        : { names: [], allObjects: false, unexpected: [], missing: EXPECTED_FIELDS };
      const declaredCount = typeof body?.count === 'number' ? body.count : null;
      const arrayLength = isArray ? records.length : null;
      const countMatches = declaredCount !== null && arrayLength !== null && declaredCount === arrayLength;

      const authorised = httpStatus === 200
        && body?.success === true
        && isArray
        && countMatches
        && fields.allObjects
        && fields.unexpected.length === 0
        && fields.missing.length === 0;

      setResult({
        outcome: authorised ? 'authorised' : 'unverified response',
        httpStatus: httpStatus ?? 'not exposed',
        backendSuccess: typeof body?.success === 'boolean' ? body.success : null,
        declaredCount,
        arrayLength,
        countMatches,
        fieldNames: fields.names,
        unexpectedFields: fields.unexpected,
        missingFields: fields.missing,
        serverMessage: null,
        blocks: []
      });
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data ?? null;
      const raw = typeof data?.error === 'string' ? data.error : null;
      setResult({
        outcome: status === 401 || status === 403 ? 'permission denied' : 'unexpected error',
        httpStatus: typeof status === 'number' ? status : 'not exposed',
        backendSuccess: typeof data?.success === 'boolean' ? data.success : null,
        declaredCount: null,
        arrayLength: null,
        countMatches: null,
        fieldNames: [],
        unexpectedFields: [],
        missingFields: [],
        serverMessage: raw ? (SAFE_SERVER_MESSAGES.includes(raw) ? raw : 'suppressed') : null,
        blocks: []
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscription function probe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Temporary diagnostic page. No request is sent until you press the button. Remove this page after testing.
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
          <Row label="Preview isolation" value={env.previewConditional ? 'conditional, not proven' : 'not established'} />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            The editor preview host is minted per session and cannot be verified from inside the app. This page therefore
            refuses on the two known published hosts and requires the editor frame. The functions version is a routing
            selector, not proof that the editor copy answered.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Signed in as</CardTitle></CardHeader>
        <CardContent>
          <Row label="Identity status" value={identityStatus} />
          <Row label="Immutable user ID" value={identity?.id ?? 'unknown'} />
          <Row label="Role" value={identity?.role ?? 'unknown'} />
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

      <Button onClick={runProbe} disabled={!canRun} className="w-full">
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
                <Row label="Field names across all summaries" value={result.fieldNames.join(', ') || 'none'} />
                <Row label="Unexpected field names" value={result.unexpectedFields.join(', ') || 'none'} />
                <Row label="Missing field names" value={result.missingFields.join(', ') || 'none'} />
                {result.serverMessage && <Row label="Server message" value={result.serverMessage} />}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}