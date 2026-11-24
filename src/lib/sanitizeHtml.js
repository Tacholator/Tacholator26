// Safe helpers for rendering user-authored HTML.
// DOMParser builds an inert document: no scripts run and no images load while
// the markup is parsed, so nothing executes before we strip the dangerous parts.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'A', 'SPAN', 'DIV',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'CODE', 'PRE', 'HR', 'IMG'
]);

const BLOCKED_TAGS = 'script, style, iframe, object, embed, link, meta, form, input, button, svg, math, base, frame, frameset';

export function sanitizeHtml(html) {
  if (!html) return '';

  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  doc.querySelectorAll(BLOCKED_TAGS).forEach((el) => el.remove());

  Array.from(doc.body.querySelectorAll('*')).forEach((el) => {
    if (!el.parentNode) return;

    if (!ALLOWED_TAGS.has(el.tagName)) {
      const parent = el.parentNode;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      el.remove();
      return;
    }

    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || '';
      const isEventHandler = name.startsWith('on');
      const isScriptUrl = /^\s*(javascript|data|vbscript):/i.test(value);
      if (isEventHandler || isScriptUrl || name === 'srcset' || name === 'formaction') {
        el.removeAttribute(attr.name);
      }
    });

    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return doc.body.innerHTML;
}

export function htmlToText(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  return doc.body.textContent || '';
}