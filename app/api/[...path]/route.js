function normalizeBaseUrl(value, fallback) {
  return (value || fallback).replace(/\/$/, '');
}

const SENSITIVE_KEYS = ['token', 'authorization', 'auth', 'password', 'secret', 'key', 'refresh'];

function sanitizeUrlForLog(url) {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        parsed.searchParams.set(key, '***');
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch (_error) {
    return String(url);
  }
}

function sanitizeHeadersForLog(headersLike) {
  const safe = {};
  try {
    const headers = new Headers(headersLike || {});
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

const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL,
  process.env.NODE_ENV === 'production'
    ? 'https://api.goormpopcorn.shop'
    : 'http://localhost:8080'
);
const STORE_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_STORE_API_BASE_URL
    || process.env.STORE_API_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL,
  API_BASE_URL
);
const ORDERQUERY_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_ORDERQUERY_API_BASE_URL
    || process.env.ORDERQUERY_API_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL,
  API_BASE_URL
);
const PAYMENT_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL
    || process.env.PAYMENT_API_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL,
  API_BASE_URL
);

function buildApiUrl(baseUrl, joinedPath) {
  const baseHasApiSuffix = /\/api$/i.test(baseUrl);
  const path = baseHasApiSuffix
    ? `${baseUrl}/${joinedPath}`
    : `${baseUrl}/api/${joinedPath}`;
  return path.replace(/([^:]\/)\/+/g, '$1');
}

function resolveTargetBaseUrl(path) {
  const firstSegment = Array.isArray(path) ? path[0] : '';
  if (firstSegment === 'stores') return STORE_API_BASE_URL;
  if (firstSegment === 'orderquery') return ORDERQUERY_API_BASE_URL;
  if (firstSegment === 'payments' || firstSegment === 'payment') return PAYMENT_API_BASE_URL;
  return API_BASE_URL;
}

function buildTargetUrls(path, requestUrl) {
  const joinedPath = Array.isArray(path) ? path.join('/') : '';
  const incoming = new URL(requestUrl);
  const baseUrl = resolveTargetBaseUrl(path);
  const candidates = [baseUrl];

  // In some runtimes (e.g. containerized Next server), localhost may not point
  // to the host where upstream APIs are exposed.
  if (/^https?:\/\/localhost(?::\d+)?$/i.test(baseUrl)) {
    candidates.push(baseUrl.replace('localhost', '127.0.0.1'));
    candidates.push(baseUrl.replace('localhost', 'host.docker.internal'));
  }

  return [...new Set(candidates)].map((candidateBaseUrl) => {
    const target = new URL(buildApiUrl(candidateBaseUrl, joinedPath));
    target.search = incoming.search;
    return target.toString();
  });
}

function createForwardHeaders(requestHeaders) {
  const headers = new Headers(requestHeaders);

  // Remove hop-by-hop/origin headers for clean server-to-server forwarding.
  headers.delete('host');
  headers.delete('origin');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('transfer-encoding');

  return headers;
}

function sanitizeResponseHeaders(upstreamHeaders) {
  const headers = new Headers(upstreamHeaders);

  // Browser does not need upstream CORS headers for same-origin Next responses.
  headers.delete('access-control-allow-origin');
  headers.delete('access-control-allow-credentials');
  headers.delete('access-control-allow-methods');
  headers.delete('access-control-allow-headers');
  headers.delete('access-control-expose-headers');

  return headers;
}

async function forward(request, context) {
  const reqId = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();
  try {
    const resolvedParams = context?.params ? (await context.params) : {};
    const pathSegments = Array.isArray(resolvedParams?.path) ? resolvedParams.path : [];
    const firstSegment = pathSegments[0] || '';
    if (firstSegment === 'orderquery') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !/^Bearer\s+.+/i.test(authHeader)) {
        return Response.json(
          {
            code: 401,
            message: 'orderquery API는 인증이 필요합니다.'
          },
          { status: 401 }
        );
      }
    }

    const targetUrls = buildTargetUrls(resolvedParams?.path, request.url);
    const method = request.method;
    const headers = createForwardHeaders(request.headers);
    const hasBody = !['GET', 'HEAD'].includes(method.toUpperCase());
    const body = hasBody ? await request.arrayBuffer() : undefined;
    let upstream = null;
    let lastError = null;

    console.log('[API_PROXY][REQ]', {
      reqId,
      method,
      source: sanitizeUrlForLog(request.url),
      targets: targetUrls.map((target) => sanitizeUrlForLog(target)),
      headers: sanitizeHeadersForLog(headers),
      bodyBytes: body?.byteLength || 0
    });

    for (const targetUrl of targetUrls) {
      try {
        upstream = await fetch(targetUrl, {
          method,
          headers,
          body,
          redirect: 'manual'
        });
        break;
      } catch (error) {
        console.error('[API_PROXY][UPSTREAM_ERR]', {
          reqId,
          method,
          target: sanitizeUrlForLog(targetUrl),
          message: error?.message || String(error)
        });
        lastError = error;
      }
    }
    if (!upstream) throw lastError || new Error('Upstream fetch failed');

    const responseBody = await upstream.arrayBuffer();
    console.log('[API_PROXY][RES]', {
      reqId,
      method,
      source: sanitizeUrlForLog(request.url),
      status: upstream.status,
      statusText: upstream.statusText,
      elapsedMs: Date.now() - startedAt,
      bodyBytes: responseBody?.byteLength || 0
    });

    return new Response(responseBody.byteLength > 0 ? responseBody : null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: sanitizeResponseHeaders(upstream.headers)
    });
  } catch (error) {
    console.error('[API_PROXY][ERR]', {
      reqId,
      method: request.method,
      source: sanitizeUrlForLog(request.url),
      elapsedMs: Date.now() - startedAt,
      message: error?.message || String(error)
    });

    return Response.json(
      {
        code: 502,
        message: `Upstream API 서버에 연결할 수 없습니다. 기본 주소=${API_BASE_URL}`
      },
      { status: 502 }
    );
  }
}

export async function GET(request, context) {
  return forward(request, context);
}

export async function POST(request, context) {
  return forward(request, context);
}

export async function PUT(request, context) {
  return forward(request, context);
}

export async function PATCH(request, context) {
  return forward(request, context);
}

export async function DELETE(request, context) {
  return forward(request, context);
}

export async function OPTIONS(request, context) {
  return forward(request, context);
}
