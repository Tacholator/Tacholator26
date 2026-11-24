/**
 * Shared guard for backend functions that are only ever invoked by other
 * backend functions (never by a browser). The token lives in server-side code
 * only and is compared in constant time.
 */
export const INTERNAL_TOKEN = 'b44_int_9f3c1a7d5e2b48c6a0d4f8e1c3b7a950';

export function isInternalCall(req: Request, payload?: any): boolean {
  const fromHeader = req.headers.get('x-internal-token');
  const fromBody = payload && typeof payload._internalToken === 'string' ? payload._internalToken : null;
  const provided = fromHeader || fromBody;
  if (!provided || provided.length !== INTERNAL_TOKEN.length) return false;

  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ INTERNAL_TOKEN.charCodeAt(i);
  }
  return diff === 0;
}