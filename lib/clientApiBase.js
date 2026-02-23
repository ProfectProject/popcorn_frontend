export function getClientApiBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();

  if (typeof window === 'undefined') {
    return raw.replace(/\/$/, '');
  }

  const origin = window.location.origin.replace(/\/$/, '');
  const currentHost = window.location.hostname;
  const isCurrentLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';

  if (!raw) return origin;

  try {
    const parsed = new URL(raw);
    const envHost = parsed.hostname;
    const isEnvLocal = envHost === 'localhost' || envHost === '127.0.0.1';

    // Production-like host + localhost env 조합은 브라우저 접근이 불가하므로 same-origin으로 강제 전환.
    if (isEnvLocal && !isCurrentLocal) {
      return origin;
    }

    return raw.replace(/\/$/, '');
  } catch (_error) {
    return origin;
  }
}

export function normalizeClientRedirectUrl(url, fallbackPath = '/') {
  if (typeof window === 'undefined') return url || fallbackPath;

  const origin = window.location.origin.replace(/\/$/, '');
  const fallback = `${origin}${fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`}`;
  if (!url) return fallback;

  try {
    const parsed = new URL(url, origin);
    const host = parsed.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isCurrentLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost && !isCurrentLocalhost) {
      return `${origin}${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch (_error) {
    return fallback;
  }
}
