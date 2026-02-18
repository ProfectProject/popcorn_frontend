function normalizeBaseUrl(value, fallback) {
  return (value || fallback).replace(/\/$/, '');
}

const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL,
  'http://localhost:8080'
);
const STORE_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_STORE_API_BASE_URL || process.env.STORE_API_BASE_URL,
  API_BASE_URL
);
const ORDERQUERY_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_ORDERQUERY_API_BASE_URL || process.env.ORDERQUERY_API_BASE_URL,
  API_BASE_URL
);
const PAYMENT_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL || process.env.PAYMENT_API_BASE_URL,
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

function buildTargetUrl(path, requestUrl) {
  const joinedPath = Array.isArray(path) ? path.join('/') : '';
  const incoming = new URL(requestUrl);
  const baseUrl = resolveTargetBaseUrl(path);
  const target = new URL(buildApiUrl(baseUrl, joinedPath));
  target.search = incoming.search;
  return target.toString();
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
  try {
    const resolvedParams = context?.params ? (await context.params) : {};
    const targetUrl = buildTargetUrl(resolvedParams?.path, request.url);
    const method = request.method;
    const headers = createForwardHeaders(request.headers);
    const hasBody = !['GET', 'HEAD'].includes(method.toUpperCase());
    const body = hasBody ? await request.arrayBuffer() : undefined;

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual'
    });

    const responseBody = await upstream.arrayBuffer();
    return new Response(responseBody.byteLength > 0 ? responseBody : null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: sanitizeResponseHeaders(upstream.headers)
    });
  } catch (_error) {
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
