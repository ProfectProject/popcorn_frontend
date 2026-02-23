'use client';

import { useEffect } from 'react';

const PATCH_FLAG = '__popcorn_fetch_logger_patched__';
const SENSITIVE_KEYS = ['token', 'authorization', 'auth', 'password', 'secret', 'key', 'refresh'];

function sanitizeUrl(urlLike) {
  try {
    const parsed = new URL(urlLike, window.location.origin);
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        parsed.searchParams.set(key, '***');
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch (_error) {
    return String(urlLike);
  }
}

function sanitizeHeaders(headersInit) {
  const safe = {};
  try {
    const headers = new Headers(headersInit || {});
    headers.forEach((value, key) => {
      const lowered = key.toLowerCase();
      if (
        lowered.includes('authorization')
        || lowered.includes('cookie')
        || lowered.includes('token')
        || lowered.includes('secret')
        || lowered.includes('key')
      ) {
        safe[key] = '***';
      } else {
        safe[key] = value;
      }
    });
  } catch (_error) {
    return {};
  }
  return safe;
}

function summarizeBody(body) {
  if (body == null) return null;
  if (typeof body === 'string') return body.slice(0, 500);
  if (body instanceof URLSearchParams) return body.toString().slice(0, 500);
  if (typeof FormData !== 'undefined' && body instanceof FormData) return '[FormData]';
  if (body instanceof Blob) return `[Blob:${body.type || 'unknown'}:${body.size}]`;
  if (body instanceof ArrayBuffer) return `[ArrayBuffer:${body.byteLength}]`;
  return `[${Object.prototype.toString.call(body)}]`;
}

export default function ClientFetchLogger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window[PATCH_FLAG]) return;
    window[PATCH_FLAG] = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
      const request = input instanceof Request ? input : null;
      const method = (init.method || request?.method || 'GET').toUpperCase();
      const rawUrl = request?.url || String(input);
      const url = sanitizeUrl(rawUrl);
      const headers = sanitizeHeaders(init.headers || request?.headers);
      const bodySummary = summarizeBody(init.body);
      const startedAt = Date.now();

      console.log('[FETCH][REQ]', {
        method,
        url,
        headers,
        body: bodySummary
      });

      try {
        const response = await originalFetch(input, init);
        const elapsedMs = Date.now() - startedAt;
        const contentType = response.headers.get('content-type') || '';
        let preview = null;

        if (contentType.includes('application/json') || contentType.startsWith('text/')) {
          try {
            const cloned = response.clone();
            const text = await cloned.text();
            preview = text.slice(0, 500);
          } catch (_error) {
            preview = '[unavailable]';
          }
        }

        console.log('[FETCH][RES]', {
          method,
          url,
          status: response.status,
          ok: response.ok,
          elapsedMs,
          contentType,
          bodyPreview: preview
        });

        return response;
      } catch (error) {
        const elapsedMs = Date.now() - startedAt;
        console.error('[FETCH][ERR]', {
          method,
          url,
          elapsedMs,
          message: error?.message || String(error)
        });
        throw error;
      }
    };
  }, []);

  return null;
}

