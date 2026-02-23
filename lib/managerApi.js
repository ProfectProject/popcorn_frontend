const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const REFRESH_REQUEST_TIMEOUT_MS = 5000;
const REFRESH_RETRY_COOLDOWN_MS = 60 * 1000;

const STORAGE_KEYS = {
  token: 'manager_token',
  refreshToken: 'manager_refresh_token',
  user: 'manager_user',
  selectedStoreId: 'manager_store_id',
  selectedPopupId: 'manager_popup_id'
};

const POPUP_STATUS_TO_UI = {
  OPEN: 'active',
  APPROVED: 'planned',
  REQUEST: 'planned',
  DRAFT: 'planned',
  CLOSED: 'completed',
  CANCELLED: 'completed',
  HIDDEN: 'completed'
};
const UI_POPUP_STATUS_TO_API = {
  planned: 'APPROVED',
  active: 'OPEN',
  completed: 'CLOSED'
};

const STORE_STATUS_TO_UI = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DRAFT: 'draft',
  PENDING: 'pending',
  HIDDEN: 'hidden',
  CLOSED: 'closed'
};
const UI_STORE_STATUS_TO_API = {
  active: 'ACTIVE',
  // Backward compatible alias: older UI used "maintenance" for suspended state.
  maintenance: 'SUSPENDED',
  suspended: 'SUSPENDED',
  draft: 'DRAFT',
  pending: 'PENDING',
  hidden: 'HIDDEN',
  closed: 'CLOSED'
};

const COUPON_STATUS_TO_UI = {
  ACTIVE: 'active',
  INACTIVE: 'disabled',
  DRAFT: 'disabled',
  EXPIRED: 'expired'
};
const UI_COUPON_STATUS_TO_API = {
  active: 'ACTIVE',
  disabled: 'INACTIVE',
  expired: 'EXPIRED',
  draft: 'DRAFT'
};
const ORDER_STATUS_UI_VALUES = ['pending', 'shipping', 'completed'];

const POPUP_EMOJIS = ['🏪', '🌞', '🎓', '🛍️', '🎪', '🎨', '🍕', '☕'];
const POPUP_COLORS = ['#ea580c', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#6366f1', '#84cc16'];
const PRODUCT_EMOJIS = ['🍿', '🧀', '🍫', '🍯', '🌶️', '🥨', '🍪', '🥜'];
const PRODUCT_COLORS = ['#ea580c', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#6366f1', '#84cc16'];
const HIDDEN_TEST_ORDER_NOS = new Set(['TEST_000086']);

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function isApiError(error, status = null) {
  if (!(error instanceof ApiError)) return false;
  if (status === null) return true;
  return error.status === status;
}

function hasWindow() {
  return typeof window !== 'undefined';
}

export function getApiBaseUrl() {
  // Browser should always use same-origin (/api/*) and let Next route handler proxy upstream.
  if (hasWindow() && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBaseUrl && typeof envBaseUrl === 'string') {
    return envBaseUrl.replace(/\/$/, '');
  }

  return DEFAULT_API_BASE_URL.replace(/\/$/, '');
}

function getStorageItem(key) {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(key);
}

function setStorageItem(key, value) {
  if (!hasWindow()) return;
  if (value === undefined || value === null || value === '') {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

function removeStorageItem(key) {
  if (!hasWindow()) return;
  window.localStorage.removeItem(key);
}

export function decodeJwtPayload(token) {
  if (!token) return null;
  const chunks = token.split('.');
  if (chunks.length < 2) return null;

  try {
    const base64 = chunks[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}

export function getManagerToken() {
  return getStorageItem(STORAGE_KEYS.token);
}

export function getManagerRefreshToken() {
  return getStorageItem(STORAGE_KEYS.refreshToken);
}

export function getManagerUser() {
  const raw = getStorageItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function saveManagerSession({ token, refreshToken, user }) {
  setStorageItem(STORAGE_KEYS.token, token);
  setStorageItem(STORAGE_KEYS.refreshToken, refreshToken);
  setStorageItem(STORAGE_KEYS.user, JSON.stringify(user));
  refreshDenied = false;
  refreshRetryBlockedUntil = 0;
}

export function clearManagerSession() {
  removeStorageItem(STORAGE_KEYS.token);
  removeStorageItem(STORAGE_KEYS.refreshToken);
  removeStorageItem(STORAGE_KEYS.user);
  removeStorageItem(STORAGE_KEYS.selectedStoreId);
  removeStorageItem(STORAGE_KEYS.selectedPopupId);
  refreshDenied = false;
  refreshRetryBlockedUntil = 0;
}

export function getSelectedStoreId() {
  return getStorageItem(STORAGE_KEYS.selectedStoreId);
}

export function setSelectedStoreId(storeId) {
  setStorageItem(STORAGE_KEYS.selectedStoreId, storeId);
}

export function getSelectedPopupId() {
  return getStorageItem(STORAGE_KEYS.selectedPopupId);
}

export function setSelectedPopupId(popupId) {
  setStorageItem(STORAGE_KEYS.selectedPopupId, popupId);
}

function parseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

function buildRequestUrl(path, query) {
  const browserOrigin = hasWindow() && window.location?.origin
    ? window.location.origin.replace(/\/$/, '')
    : null;
  const baseUrl = browserOrigin || getApiBaseUrl();
  const url = new URL(path, `${baseUrl}/`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  // In browser runtime, send relative URL to Next server route handler (`app/api/[...path]/route.js`).
  if (browserOrigin) {
    return `${url.pathname}${url.search}`;
  }
  return url.toString();
}

function extractErrorMessage(payload, status) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (payload.data && typeof payload.data.message === 'string') {
      return payload.data.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  }
  return `요청에 실패했습니다. (${status})`;
}

function unwrapSuccessPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if ('code' in payload && 'data' in payload) return payload.data;
  return payload;
}

function getTokenExpirationMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return Number(payload.exp) * 1000;
}

function isAccessTokenExpiringSoon(token) {
  const expMs = getTokenExpirationMs(token);
  if (!expMs) return false;
  return expMs - Date.now() <= REFRESH_THRESHOLD_MS;
}

function buildUserFromToken(token, fallbackUser = null) {
  const payload = decodeJwtPayload(token) || {};
  const email = payload.email || fallbackUser?.email || null;
  return {
    id: payload.id ?? fallbackUser?.id ?? null,
    email,
    name: payload.name || fallbackUser?.name || (email ? email.split('@')[0] : '매니저'),
    role: payload.role || fallbackUser?.role || 'UNKNOWN'
  };
}

function normalizeRole(role) {
  if (!role) return '';
  const normalized = String(role).toUpperCase();
  return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
}

function getCurrentSessionRole() {
  const savedUser = getManagerUser();
  if (savedUser?.role) return normalizeRole(savedUser.role);
  const payload = decodeJwtPayload(getManagerToken());
  return normalizeRole(payload?.role);
}

function isManagerSession() {
  return getCurrentSessionRole() === 'MANAGER';
}

function formatStoreLabel(storeId) {
  const shortId = String(storeId || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return shortId ? `스토어 ${shortId}` : '스토어';
}

function mapPublicPopupToOwnerShape(popup) {
  return {
    popupId: popup.id,
    storeId: popup.storeId || null,
    title: popup.title || '팝업',
    popupCategory: popup.category || 'ETC',
    status: popup.status || 'DRAFT',
    reservationOpenAt: popup.reservationOpenAt || popup.eventStartAt || popup.createdAt || null,
    addressRoad: popup.addressRoad || null,
    addressDetail: popup.addressDetail || null,
    createdAt: popup.createdAt || popup.eventStartAt || null
  };
}

async function listPublicPopups(options = {}) {
  const { page = 1, size = 100, category, storeId, keyword, regionId } = options;
  const safeSize = Math.min(Math.max(Number(size) || 100, 1), 100);
  const safePage = Math.max(Number(page) || 1, 0);

  try {
    const response = await request('/api/stores/v1/popups', {
      auth: false,
      query: { page: safePage, size: safeSize, category, storeId, keyword, regionId }
    });
    return response?.items || [];
  } catch (error) {
    // Some store-service versions reject certain pagination values.
    if (!isApiError(error, 400)) throw error;

    const response = await request('/api/stores/v1/popups', {
      auth: false,
      query: { page: 0, size: 100 }
    });
    return response?.items || [];
  }
}

let refreshPromise = null;
let hasAuthRedirectInProgress = false;
let refreshDenied = false;
let refreshRetryBlockedUntil = 0;

function handleUnauthorized() {
  if (!hasWindow()) return;
  if (hasAuthRedirectInProgress) return;
  hasAuthRedirectInProgress = true;

  clearManagerSession();
  window.alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  window.location.replace('/manager');
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  if (refreshDenied) {
    throw new ApiError('세션이 만료되었습니다. 다시 로그인해주세요.', 401, null);
  }
  if (Date.now() < refreshRetryBlockedUntil) {
    throw new ApiError('토큰 갱신 재시도 대기 중입니다.', 503, null);
  }

  refreshPromise = (async () => {
    const refreshToken = getManagerRefreshToken();
    const currentAccessToken = getManagerToken();
    if (!refreshToken) {
      throw new ApiError('세션이 만료되었습니다. 다시 로그인해주세요.', 401, null);
    }
    if (!currentAccessToken) {
      throw new ApiError('세션이 만료되었습니다. 다시 로그인해주세요.', 401, null);
    }

    let response;
    let networkFailed = true;
    const refreshBody = JSON.stringify({
      refreshToken,
      refresh_token: refreshToken
    });

    const callRefresh = async (extraHeaders = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REFRESH_REQUEST_TIMEOUT_MS);
      try {
        return await fetch(buildRequestUrl('/api/users/v1/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Refresh-Token': refreshToken,
            ...extraHeaders
          },
          body: refreshBody,
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const callCandidates = [
      () => callRefresh({ Authorization: `Bearer ${currentAccessToken}` }),
      () => callRefresh()
    ];

    for (const candidate of callCandidates) {
      try {
        response = await candidate();
        networkFailed = false;
        // Some users-service deployments fail refresh when Authorization is sent with expired access token.
        // If first strategy fails with server/auth error, retry once without Authorization header.
        if (response.status >= 500 || response.status === 401 || response.status === 403) {
          continue;
        }
        break;
      } catch (_networkError) {
        // Try next strategy.
      }
    }

    if (networkFailed || !response) {
      refreshRetryBlockedUntil = Date.now() + REFRESH_RETRY_COOLDOWN_MS;
      throw new ApiError(
        `API 서버(${getApiBaseUrl()})에 연결할 수 없습니다. 주소/포트/CORS 설정을 확인해주세요.`,
        0,
        null
      );
    }

    const payload = parseBody(await response.text());

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        refreshDenied = true;
        removeStorageItem(STORAGE_KEYS.token);
        removeStorageItem(STORAGE_KEYS.refreshToken);
        refreshRetryBlockedUntil = 0;
      } else if (response.status >= 500) {
        refreshRetryBlockedUntil = Date.now() + REFRESH_RETRY_COOLDOWN_MS;
      }
      throw new ApiError(extractErrorMessage(payload, response.status), response.status, payload);
    }

    const data = unwrapSuccessPayload(payload);
    const newAccessToken = data?.accessToken || data?.token;
    if (!newAccessToken) {
      refreshRetryBlockedUntil = Date.now() + REFRESH_RETRY_COOLDOWN_MS;
      throw new ApiError('토큰 갱신에 실패했습니다.', 500, data);
    }

    setStorageItem(STORAGE_KEYS.token, newAccessToken);
    setStorageItem(
      STORAGE_KEYS.user,
      JSON.stringify(buildUserFromToken(newAccessToken, getManagerUser()))
    );
    refreshRetryBlockedUntil = 0;

    return newAccessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    query,
    headers = {},
    auth = true
  } = options;

  const requestUrl = buildRequestUrl(path, query);
  const safeRequestUrl = String(requestUrl).replace(/([?&](?:token|refreshToken|authorization)=[^&]+)/gi, '$1***');

  const requestHeaders = { ...headers };
  let authToken = null;

  if (auth) {
    authToken = getManagerToken();
    if (!authToken) throw new ApiError('로그인이 필요합니다.', 401, null);

    const refreshToken = getManagerRefreshToken();
    if (isAccessTokenExpiringSoon(authToken) && refreshToken) {
      try {
        authToken = await refreshAccessToken();
      } catch (refreshError) {
        if (
          refreshError instanceof ApiError
          && (refreshError.status === 401 || refreshError.status === 403)
        ) {
          handleUnauthorized();
          throw refreshError;
        }
        // refresh 서버 장애가 있을 때는 기존 access token으로 요청을 진행한다.
        // 토큰이 실제로 만료됐다면 아래 응답(401) 분기에서 처리된다.
        console.warn('토큰 갱신 실패 - 기존 토큰으로 요청을 계속합니다:', refreshError);
      }
    }

    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    console.log('[MANAGER_API][REQ]', {
      method,
      path,
      url: safeRequestUrl,
      auth,
      hasBody: body !== undefined
    });
    response = await fetch(requestUrl, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    console.log('[MANAGER_API][RES]', {
      method,
      path,
      url: safeRequestUrl,
      status: response.status,
      ok: response.ok
    });
  } catch (_networkError) {
    console.error('[MANAGER_API][NET_ERR]', {
      method,
      path,
      url: safeRequestUrl
    });
    throw new ApiError(
      `API 서버(${getApiBaseUrl()})에 연결할 수 없습니다. 주소/포트/CORS 설정을 확인해주세요.`,
      0,
      null
    );
  }

  const payload = parseBody(await response.text());

  if (!response.ok) {
    if (auth && response.status === 401) {
      const refreshToken = getManagerRefreshToken();
      if (!refreshToken) {
        handleUnauthorized();
        throw new ApiError(extractErrorMessage(payload, response.status), response.status, payload);
      }

      try {
        const refreshedToken = await refreshAccessToken();
        const retryHeaders = { ...requestHeaders, Authorization: `Bearer ${refreshedToken}` };
        let retryResponse;
        try {
          retryResponse = await fetch(requestUrl, {
            method,
            headers: retryHeaders,
            body: body === undefined ? undefined : JSON.stringify(body)
          });
        } catch (_networkError) {
          throw new ApiError(
            `API 서버(${getApiBaseUrl()})에 연결할 수 없습니다. 주소/포트/CORS 설정을 확인해주세요.`,
            0,
            null
          );
        }

        const retryPayload = parseBody(await retryResponse.text());
        if (!retryResponse.ok) {
          throw new ApiError(
            extractErrorMessage(retryPayload, retryResponse.status),
            retryResponse.status,
            retryPayload
          );
        }

        return unwrapSuccessPayload(retryPayload);
      } catch (refreshError) {
        if (
          refreshError instanceof ApiError
          && (refreshError.status === 401 || refreshError.status === 403)
        ) {
          handleUnauthorized();
        }
        if (refreshError instanceof ApiError) throw refreshError;
        handleUnauthorized();
        throw new ApiError('세션이 만료되었습니다. 다시 로그인해주세요.', 401, null);
      }
    }

    throw new ApiError(extractErrorMessage(payload, response.status), response.status, payload);
  }

  return unwrapSuccessPayload(payload);
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toLocalDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function toDateTime(dateString, endOfDay = false) {
  if (!dateString) return null;
  return `${dateString}T${endOfDay ? '23:59:59' : '00:00:00'}`;
}

function pickByHash(seed, values, fallback) {
  if (!seed) return fallback;
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return values[hash % values.length];
}

function normalizePopupStatusForApi(status) {
  if (!status) return null;

  const uiStatus = UI_POPUP_STATUS_TO_API[String(status).toLowerCase()];
  if (uiStatus) return uiStatus;

  const normalized = String(status).toUpperCase();
  if (POPUP_STATUS_TO_UI[normalized]) return normalized;

  return null;
}

function normalizeStoreStatusForApi(status) {
  if (!status) return null;

  const uiStatus = UI_STORE_STATUS_TO_API[String(status).toLowerCase()];
  if (uiStatus) return uiStatus;

  const normalized = String(status).toUpperCase();
  if (STORE_STATUS_TO_UI[normalized]) return normalized;

  return null;
}

function normalizeCouponStatusForApi(status) {
  if (!status) return null;

  const uiStatus = UI_COUPON_STATUS_TO_API[String(status).toLowerCase()];
  if (uiStatus) return uiStatus;

  const normalized = String(status).toUpperCase();
  if (COUPON_STATUS_TO_UI[normalized]) return normalized;

  return null;
}

function guessCouponStatus(coupon) {
  const rawUntil = coupon.validUntil || coupon.valid_until || null;
  const until = rawUntil ? new Date(rawUntil).getTime() : null;
  if (until && !Number.isNaN(until) && until < Date.now()) return 'expired';
  if (coupon.is_expired === true) return 'expired';
  return COUPON_STATUS_TO_UI[coupon.status] || 'active';
}

function mapSnapshotStatusToUi(orderStatus, paymentStatus) {
  const normalizedOrder = String(orderStatus || '').toUpperCase();
  const normalizedPayment = String(paymentStatus || '').toUpperCase();

  if (normalizedOrder === 'COMPLETED') return 'completed';
  if (normalizedOrder === 'PAID' || normalizedPayment === 'PAID') return 'completed';
  if (normalizedOrder === 'ACCEPTED' || normalizedOrder === 'RESERVED') return 'shipping';
  if (normalizedOrder === 'REQUESTED' || normalizedOrder === 'PAYMENT_PENDING') return 'pending';
  if (normalizedOrder === 'CANCELLED' || normalizedOrder === 'REJECTED' || normalizedPayment === 'FAILED') {
    return 'pending';
  }
  return 'shipping';
}

function makeOrderProductLabel(item) {
  if (item.itemType === 'GOODS' && item.goodsName) {
    return `${item.goodsName} x${item.qty}`;
  }

  const start = item.scheduleStartAt ? new Date(item.scheduleStartAt).toLocaleString('ko-KR') : '';
  const end = item.scheduleEndAt ? new Date(item.scheduleEndAt).toLocaleString('ko-KR') : '';
  const timeRange = [start, end].filter(Boolean).join(' ~ ');
  return `예약 ${timeRange} x${item.qty}`;
}

export async function loginManager({ email, password }) {
  let response;
  try {
    response = await request('/api/users/v1/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password }
    });
  } catch (error) {
    if (isApiError(error) && (error.status === 401 || error.status === 403)) {
      throw new ApiError('이메일 또는 비밀번호를 확인해주세요.', error.status, error.payload);
    }
    throw error;
  }

  const token = response?.token || response?.accessToken;
  if (!token) {
    throw new ApiError('토큰 발급에 실패했습니다.', 500, response);
  }

  const refreshToken = response?.refreshToken || null;
  const user = buildUserFromToken(token, { email });

  saveManagerSession({ token, refreshToken, user });
  return { token, refreshToken, user };
}

export async function signupManager({ email, password, passwordCheck, name, phone, role = 'OWNER' }) {
  return request('/api/users/v1/users/signup', {
    method: 'POST',
    auth: false,
    body: {
      email,
      password,
      passwordCheck,
      name,
      phone: phone?.replace(/-/g, '') || null,
      role
    }
  });
}

export async function listStores() {
  try {
    return await request('/api/stores/v1/owner/stores');
  } catch (error) {
    const canFallback = (
      isApiError(error)
      && [403, 404, 500, 503].includes(error.status)
    );

    if (!canFallback) {
      throw error;
    }

    if (isApiError(error, 500) || isApiError(error, 503)) {
      // Store service 장애 시 public popups endpoint까지 연쇄 호출하면 500 로그만 늘어날 수 있음.
      // 우선 로컬 선택값 기반의 최소 fallback으로 화면 흐름을 유지.
      const selectedStoreId = getSelectedStoreId();
      if (selectedStoreId) {
        return [{
          id: selectedStoreId,
          name: formatStoreLabel(selectedStoreId),
          publishStatus: 'ACTIVE',
          createdAt: null
        }];
      }

      console.warn('스토어 owner 조회 실패(500/503), 사용할 스토어 캐시가 없어 빈 목록 반환:', error);
      return [];
    }

    const publicPopups = await listPublicPopups({ page: 1, size: 100 });
    const storeMap = new Map();

    publicPopups.forEach((popup) => {
      const storeId = popup?.storeId;
      if (!storeId) return;
      if (storeMap.has(storeId)) return;
      storeMap.set(storeId, {
        id: storeId,
        name: formatStoreLabel(storeId),
        publishStatus: 'ACTIVE',
        createdAt: popup?.createdAt || popup?.eventStartAt || popup?.reservationOpenAt || null
      });
    });

    return [...storeMap.values()];
  }
}

export async function createStore(name) {
  return request('/api/stores/v1/owner/stores', {
    method: 'POST',
    body: { name }
  });
}

export async function updateStore(storeId, name) {
  return request(`/api/stores/v1/owner/stores/${storeId}`, {
    method: 'PUT',
    body: { name }
  });
}

export async function deleteStore(storeId) {
  return request(`/api/stores/v1/owner/stores/${storeId}`, {
    method: 'DELETE'
  });
}

export async function updateStoreStatus(storeId, status) {
  const apiStatus = normalizeStoreStatusForApi(status);
  if (!apiStatus) {
    throw new ApiError('유효하지 않은 스토어 상태입니다.', 400, { status });
  }

  return request(`/api/stores/v1/owner/stores/${storeId}/status`, {
    method: 'PATCH',
    body: { publishStatus: apiStatus }
  });
}

export async function listPopups(storeId, options = {}) {
  const { page = 1, size = 50, category } = options;
  try {
    return await request('/api/stores/v1/owner/stores/popups', {
      query: { storeId, page, size, category }
    });
  } catch (error) {
    if (!(isApiError(error, 403) && isManagerSession())) {
      throw error;
    }

    const publicPopups = await listPublicPopups({ storeId, page, size, category });
    return publicPopups.map(mapPublicPopupToOwnerShape);
  }
}

export async function getPopupDetail(popupId) {
  return request(`/api/stores/v1/owner/stores/popups/${popupId}`);
}

export async function createPopup(storeId, popup) {
  return request('/api/stores/v1/owner/stores/popups', {
    method: 'POST',
    body: {
      storeId,
      title: popup.name,
      description: popup.description || `${popup.name} 팝업`,
      category: 'FOOD',
      reservationOpenAt: toDateTime(popup.startDate),
      addressRoad: popup.location,
      addressDetail: popup.locationDetail || null,
      schedules: [
        {
          startAt: toDateTime(popup.startDate),
          endAt: toDateTime(popup.endDate, true),
          price: 0,
          capacity: 1
        }
      ]
    }
  });
}

export async function updatePopup(popupId, popup) {
  return request(`/api/stores/v1/owner/stores/popups/${popupId}`, {
    method: 'PUT',
    body: {
      title: popup.name,
      description: popup.description || `${popup.name} 팝업`,
      popupCategory: 'FOOD',
      reservationOpenAt: toDateTime(popup.startDate),
      addressRoad: popup.location,
      addressDetail: popup.locationDetail || null
    }
  });
}

export async function updatePopupStatus(popupId, status) {
  const apiStatus = normalizePopupStatusForApi(status);
  if (!apiStatus) {
    throw new ApiError('유효하지 않은 팝업 상태입니다.', 400, { status });
  }

  return request(`/api/stores/v1/owner/stores/popups/${popupId}/status`, {
    method: 'PATCH',
    body: { status: apiStatus }
  });
}

export async function deletePopup(popupId) {
  return request(`/api/stores/v1/owner/stores/popups/${popupId}`, {
    method: 'DELETE'
  });
}

export async function listGoods(popupId) {
  return request(`/api/stores/v1/owner/popups/${popupId}/goods`);
}

export async function createGoods(popupId, product) {
  return request(`/api/stores/v1/owner/popups/${popupId}/goods`, {
    method: 'POST',
    body: {
      stockUnit: '개',
      goodsName: product.name,
      goodsPrice: toNumber(product.price),
      stock: toNumber(product.stock),
      isActive: true
    }
  });
}

export async function updateGoods(popupId, goodsId, product) {
  return request(`/api/stores/v1/owner/popups/${popupId}/goods/${goodsId}`, {
    method: 'PUT',
    body: {
      goodsName: product.name,
      goodsPrice: toNumber(product.price),
      stock: toNumber(product.stock)
    }
  });
}

export async function deleteGoods(popupId, goodsId) {
  return request(`/api/stores/v1/owner/popups/${popupId}/goods/${goodsId}`, {
    method: 'DELETE'
  });
}

export async function listCoupons() {
  // Manager page needs to see INACTIVE/DRAFT/etc as well.
  const response = await request('/api/v1/coupons/all');
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.coupons)) return response.coupons;
  if (Array.isArray(response?.content)) return response.content;
  return [];
}

export async function createCoupon(coupon) {
  return request('/api/v1/coupons', {
    method: 'POST',
    body: {
      name: coupon.name,
      description: coupon.description || null,
      discount_type: coupon.discountType === 'amount' ? 'AMOUNT' : 'PERCENTAGE',
      discount_amount: coupon.discountType === 'amount' ? toNumber(coupon.discountValue) : null,
      discount_percentage: coupon.discountType === 'percentage' ? toNumber(coupon.discountValue) : null,
      min_order_amount: coupon.minOrderAmount ? toNumber(coupon.minOrderAmount) : null,
      max_discount_amount: coupon.maxDiscountAmount ? toNumber(coupon.maxDiscountAmount) : null,
      total_quantity: coupon.usageLimit ? toNumber(coupon.usageLimit) : null,
      valid_from: toDateTime(coupon.validFrom),
      valid_until: toDateTime(coupon.validUntil, true),
      target_type: coupon.targetType || 'ALL_USERS'
    }
  });
}

export async function updateCoupon(couponId, coupon) {
  return request(`/api/v1/coupons/${couponId}`, {
    method: 'PUT',
    body: {
      name: coupon.name,
      description: coupon.description || null,
      discount_type: coupon.discountType === 'amount' ? 'AMOUNT' : 'PERCENTAGE',
      discount_amount: coupon.discountType === 'amount' ? toNumber(coupon.discountValue) : null,
      discount_percentage: coupon.discountType === 'percentage' ? toNumber(coupon.discountValue) : null,
      min_order_amount: coupon.minOrderAmount ? toNumber(coupon.minOrderAmount) : null,
      max_discount_amount: coupon.maxDiscountAmount ? toNumber(coupon.maxDiscountAmount) : null,
      total_quantity: coupon.usageLimit ? toNumber(coupon.usageLimit) : null,
      valid_from: toDateTime(coupon.validFrom),
      valid_until: toDateTime(coupon.validUntil, true),
      target_type: coupon.targetType || 'ALL_USERS'
    }
  });
}

export async function activateCoupon(couponId) {
  return request(`/api/v1/coupons/${couponId}/activate`, {
    method: 'POST'
  });
}

export async function deactivateCoupon(couponId) {
  return request(`/api/v1/coupons/${couponId}/deactivate`, {
    method: 'POST'
  });
}

export async function updateCouponStatus(couponId, status) {
  const apiStatus = normalizeCouponStatusForApi(status);
  if (!apiStatus) {
    throw new ApiError('유효하지 않은 쿠폰 상태입니다.', 400, { status });
  }

  try {
    return await request(`/api/v1/coupons/${couponId}/status`, {
      method: 'PATCH',
      body: { status: apiStatus }
    });
  } catch (error) {
    const isLegacyFallbackCase = isApiError(error) && (error.status === 404 || error.status === 405);
    if (!isLegacyFallbackCase) throw error;

    if (apiStatus === 'ACTIVE') {
      return activateCoupon(couponId);
    }
    if (apiStatus === 'INACTIVE') {
      return deactivateCoupon(couponId);
    }
    throw error;
  }
}

export async function deleteCoupon(couponId) {
  return request(`/api/v1/coupons/${couponId}`, {
    method: 'DELETE'
  });
}

export async function getOrderSummary(storeId, popupId) {
  return request(`/api/orderquery/v1/owner/stores/${storeId}/popups/${popupId}/orders/summary`, {
    auth: true
  });
}

function pickFirstNumber(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const num = toNumber(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function sumDefinedNumbers(values) {
  let sum = 0;
  let hasAny = false;

  for (const value of values) {
    if (value === undefined || value === null) continue;
    const num = toNumber(value);
    if (!Number.isFinite(num)) continue;
    sum += num;
    hasAny = true;
  }

  return hasAny ? sum : null;
}

export function getTotalDiscountBenefitFromOrderSummary(summary) {
  if (!summary || typeof summary !== 'object') return null;

  const direct = pickFirstNumber(
    summary.totalDiscountBenefit,
    summary.total_discount_benefit,
    summary.totalDiscountAmount,
    summary.total_discount_amount,
    summary.totalDiscount,
    summary.total_discount,
    summary.discountAmount,
    summary.discount_amount,
    summary.couponDiscountAmount,
    summary.coupon_discount_amount
  );
  if (direct != null) return direct;

  const reservationDiscount = pickFirstNumber(
    summary.reservation?.totalDiscountBenefit,
    summary.reservation?.total_discount_benefit,
    summary.reservation?.totalDiscountAmount,
    summary.reservation?.total_discount_amount,
    summary.reservation?.discountAmount,
    summary.reservation?.discount_amount,
    summary.reservation?.couponDiscountAmount,
    summary.reservation?.coupon_discount_amount
  );
  const goodsDiscount = pickFirstNumber(
    summary.goods?.totalDiscountBenefit,
    summary.goods?.total_discount_benefit,
    summary.goods?.totalDiscountAmount,
    summary.goods?.total_discount_amount,
    summary.goods?.discountAmount,
    summary.goods?.discount_amount,
    summary.goods?.couponDiscountAmount,
    summary.goods?.coupon_discount_amount
  );
  const nestedSum = sumDefinedNumbers([reservationDiscount, goodsDiscount]);
  if (nestedSum != null) return nestedSum;

  // Heuristic fallback: if API provides original/gross and paid/net amounts, treat the delta as "discount benefit".
  const reservationOriginal = pickFirstNumber(
    summary.reservation?.originalAmount,
    summary.reservation?.original_amount,
    summary.reservation?.grossAmount,
    summary.reservation?.gross_amount,
    summary.reservation?.totalAmount,
    summary.reservation?.total_amount
  );
  const reservationPaid = pickFirstNumber(
    summary.reservation?.paidAmount,
    summary.reservation?.paid_amount,
    summary.reservation?.netAmount,
    summary.reservation?.net_amount,
    summary.reservation?.finalAmount,
    summary.reservation?.final_amount
  );
  const goodsOriginal = pickFirstNumber(
    summary.goods?.originalAmount,
    summary.goods?.original_amount,
    summary.goods?.grossAmount,
    summary.goods?.gross_amount,
    summary.goods?.totalAmount,
    summary.goods?.total_amount
  );
  const goodsPaid = pickFirstNumber(
    summary.goods?.paidAmount,
    summary.goods?.paid_amount,
    summary.goods?.netAmount,
    summary.goods?.net_amount,
    summary.goods?.finalAmount,
    summary.goods?.final_amount
  );

  const reservationDelta = (reservationOriginal != null && reservationPaid != null && reservationOriginal >= reservationPaid)
    ? (reservationOriginal - reservationPaid)
    : null;
  const goodsDelta = (goodsOriginal != null && goodsPaid != null && goodsOriginal >= goodsPaid)
    ? (goodsOriginal - goodsPaid)
    : null;
  const deltaSum = sumDefinedNumbers([reservationDelta, goodsDelta]);
  if (deltaSum != null) return deltaSum;

  return null;
}

export async function listOrderItems(storeId, popupId, query = {}) {
  return request(`/api/orderquery/v1/owner/stores/${storeId}/popups/${popupId}/orders/items`, {
    auth: true,
    query
  });
}

export function mapOrderItemToUiOrder(item) {
  const orderNo = item.orderNo || item.orderNumber || '';
  if (HIDDEN_TEST_ORDER_NOS.has(String(orderNo))) {
    return null;
  }

  const nameCandidates = [
    item.customerName,
    item.customer_name,
    item.customer?.name,
    item.customer?.customerName,
    item.userName,
    item.user_name,
    item.username,
    item.user?.name,
    item.user?.userName,
    item.user?.nickname,
    item.userNickname,
    item.user_nickname,
    item.nickname,
    item.buyerName,
    item.buyer_name,
    item.purchaserName,
    item.purchaser_name,
    item.memberName,
    item.member_name,
    item.recipientName,
    item.recipient_name,
    item.name
  ];

  const customerName = (
    nameCandidates.find((value) => typeof value === 'string' && value.trim())
    || (item.userEmail ? item.userEmail.split('@')[0] : null)
    || (item.user_email ? item.user_email.split('@')[0] : null)
    || (item.customer?.email ? item.customer.email.split('@')[0] : null)
    || (item.user?.email ? item.user.email.split('@')[0] : null)
    || (item.userId != null ? `고객 #${item.userId}` : '고객')
  );

  const customerId = (
    item.userId
    ?? item.user_id
    ?? item.customerId
    ?? item.customer_id
    ?? item.customer?.id
    ?? item.customer?.userId
    ?? item.user?.id
    ?? item.user?.userId
    ?? null
  );

  return {
    id: orderNo || String(item.orderId),
    orderId: item.orderId,
    customerId: customerId == null ? null : Number(customerId),
    customerName,
    products: [makeOrderProductLabel(item)],
    totalAmount: toNumber(item.totalAmount ?? item.total_amount ?? item.linePrice),
    status: mapSnapshotStatusToUi(item.orderStatus ?? item.status, item.paymentStatus),
    rawOrderStatus: item.orderStatus ?? item.status,
    rawPaymentStatus: item.paymentStatus ?? null,
    // orderquery는 orderedAt이 비어 있고 createdAt만 채워지는 케이스가 있다.
    orderDate: item.orderedAt || item.ordered_at || item.createdAt || item.created_at,
    phone: item.phone || item.userPhone || item.user_phone || '',
    checkedIn: Boolean(item.checkedIn)
  };
}

export function aggregateOrdersFromOrderItems(items) {
  const byOrderId = new Map();

  items.forEach((item) => {
    const order = mapOrderItemToUiOrder(item);
    if (!order) return;
    const key = String(order.orderId || order.id);
    const existing = byOrderId.get(key);

    if (!existing) {
      byOrderId.set(key, order);
      return;
    }

    byOrderId.set(key, {
      ...existing,
      products: [...existing.products, ...order.products],
      totalAmount: existing.totalAmount + order.totalAmount,
      checkedIn: existing.checkedIn || order.checkedIn
    });
  });

  return [...byOrderId.values()].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
}

export function getUiOrderStatus(rawStatus) {
  if (ORDER_STATUS_UI_VALUES.includes(rawStatus)) return rawStatus;
  return mapSnapshotStatusToUi(rawStatus, null);
}

export function mapStoreToUi(store, fallback = {}) {
  return {
    id: store.id,
    name: store.name,
    location: fallback.location || '-',
    manager: fallback.manager || '담당자 미지정',
    phone: fallback.phone || '-',
    status: STORE_STATUS_TO_UI[store.publishStatus] || 'suspended',
    rawPublishStatus: store.publishStatus || null,
    openDate: fallback.openDate || toLocalDate(store.createdAt),
    area: fallback.area || '-',
    monthlyRent: fallback.monthlyRent || 0,
    currentPopups: fallback.currentPopups || 0,
    category: fallback.category || '',
    detailAddress: fallback.detailAddress || '',
    openTime: fallback.openTime || '',
    closeTime: fallback.closeTime || '',
    description: fallback.description || ''
  };
}

export function mapPopupToUi(popup, fallback = {}) {
  return {
    id: popup.popupId,
    name: popup.title,
    location: [popup.addressRoad, popup.addressDetail].filter(Boolean).join(' ') || '-',
    startDate: toLocalDate(popup.reservationOpenAt || popup.createdAt),
    endDate: toLocalDate(popup.reservationOpenAt || popup.createdAt),
    status: POPUP_STATUS_TO_UI[popup.status] || 'planned',
    totalSales: fallback.totalSales || 0,
    dailyVisitors: fallback.dailyVisitors || 0,
    productCount: fallback.productCount || 0,
    image: fallback.image || pickByHash(popup.popupId, POPUP_EMOJIS, '🏪'),
    color: fallback.color || pickByHash(popup.popupId, POPUP_COLORS, '#ea580c'),
    description: popup.description || '',
    manager: fallback.manager || '담당자 미지정',
    phone: fallback.phone || '-',
    storeId: popup.storeId || fallback.storeId || null
  };
}

export function mapPopupDetailToUi(popup, fallback = {}) {
  const firstSchedule = popup.schedules?.[0] || null;
  return {
    id: popup.popupId,
    storeId: popup.storeId,
    name: popup.title,
    location: [popup.addressRoad, popup.addressDetail].filter(Boolean).join(' ') || '-',
    startDate: toLocalDate(firstSchedule?.startAt || popup.reservationOpenAt || popup.createdAt),
    endDate: toLocalDate(firstSchedule?.endAt || popup.reservationOpenAt || popup.createdAt),
    status: POPUP_STATUS_TO_UI[popup.status] || 'planned',
    totalSales: fallback.totalSales || 0,
    dailyVisitors: fallback.dailyVisitors || 0,
    productCount: fallback.productCount || 0,
    image: fallback.image || pickByHash(popup.popupId, POPUP_EMOJIS, '🏪'),
    color: fallback.color || pickByHash(popup.popupId, POPUP_COLORS, '#ea580c'),
    description: popup.description || '',
    manager: fallback.manager || '담당자 미지정',
    phone: fallback.phone || '-'
  };
}

export function mapGoodsToUi(goods, fallback = {}) {
  const nameSeed = goods.id || goods.goodsName;
  return {
    id: goods.id,
    name: goods.goodsName,
    description: fallback.description || '',
    price: goods.goodsPrice,
    stock: goods.stock,
    category: fallback.category || '기타',
    image: fallback.image || pickByHash(nameSeed, PRODUCT_EMOJIS, '🍿'),
    color: fallback.color || pickByHash(nameSeed, PRODUCT_COLORS, '#ea580c'),
    status: goods.stock <= 20 ? 'low_stock' : 'active'
  };
}

export function mapCouponToUi(coupon) {
  const rawType = (coupon.discountType || coupon.discount_type || '').toUpperCase();
  const isAmount = rawType === 'AMOUNT';

  const discountValue = isAmount
    ? toNumber(coupon.discountAmount ?? coupon.discount_amount ?? coupon.discountValue ?? coupon.discount_value)
    : toNumber(coupon.discountPercentage ?? coupon.discount_percentage ?? coupon.discountValue ?? coupon.discount_value);

  const validFrom = coupon.validFrom || coupon.valid_from || null;
  const validUntil = coupon.validUntil || coupon.valid_until || null;
  const createdAt = coupon.createdAt || coupon.created_at || coupon.issuedAt || coupon.issued_at || null;

  // Preserve "no minimum" as null (API may return null/undefined for min_order_amount).
  // Avoid forcing it to 0 because UI often uses truthy checks.
  const rawMinOrderAmount = coupon.minOrderAmount ?? coupon.min_order_amount;
  const minOrderAmount = rawMinOrderAmount == null ? null : toNumber(rawMinOrderAmount);
  const usageCount = toNumber(
    coupon.usedQuantity
    ?? coupon.used_quantity
    ?? coupon.usedCount
    ?? coupon.used_count
    ?? coupon.redeemedCount
    ?? coupon.redeemed_count
    ?? coupon.appliedCount
    ?? coupon.applied_count
    ?? coupon.issuedQuantity
    ?? coupon.issued_quantity
    ?? coupon.usageCount
    ?? coupon.usage_count
    ?? 0
  );
  const usageLimit = coupon.totalQuantity ?? coupon.total_quantity ?? coupon.usageLimit ?? coupon.usage_limit ?? null;
  const maxDiscountAmountRaw = coupon.maxDiscountAmount ?? coupon.max_discount_amount;
  const maxDiscountAmount = maxDiscountAmountRaw == null ? null : toNumber(maxDiscountAmountRaw);
  const totalDiscountBenefit = pickFirstNumber(
    coupon.totalDiscountBenefit,
    coupon.total_discount_benefit,
    coupon.totalDiscountAmount,
    coupon.total_discount_amount,
    coupon.discountBenefit,
    coupon.discount_benefit,
    coupon.discountAmountTotal,
    coupon.discount_amount_total
  );

  const result = {
    id: coupon.id,
    code: coupon.code || null,
    name: coupon.name,
    discountType: isAmount ? 'amount' : 'percentage',
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    validFrom,
    validUntil,
    createdAt,
    usageCount,
    usageLimit: usageLimit ? toNumber(usageLimit) : null,
    totalDiscountBenefit,
    status: guessCouponStatus(coupon)
  };
  return result;
}

// =============================================================================
// 📊 새로운 대시보드 API 함수들 (orderQuery 대시보드 연동)
// =============================================================================

/**
 * 대시보드 헬스체크
 */
export async function getDashboardHealth() {
  return request('/api/orderquery/v1/dashboard/health', { auth: true });
}

/**
 * 메인 대시보드 데이터 조회
 * @param {string} baseDate - 기준 날짜 (YYYY-MM-DD 형식)
 */
export async function getDashboardMain(baseDate = null) {
  const query = baseDate ? { baseDate } : {};
  return request('/api/orderquery/v1/dashboard/main', { auth: true, query });
}

/**
 * 🏪 스토어별 메인 대시보드 데이터 조회
 * @param {string} storeId - 스토어 ID
 * @param {string} baseDate - 기준 날짜 (YYYY-MM-DD 형식)
 */
export async function getDashboardMainByStore(storeId, baseDate = null) {
  const query = baseDate ? { baseDate } : {};
  return request(`/api/orderquery/v1/dashboard/stores/${storeId}/main`, { auth: true, query });
}

/**
 * 주문 상태별 실시간 요약 조회
 */
export async function getDashboardStatusSummary() {
  return request('/api/orderquery/v1/dashboard/status-summary', { auth: true });
}

/**
 * 상세 주문 통계 조회
 * @param {number} days - 통계 기간 (일 수)
 * @param {string} includeTypes - 포함할 통계 유형
 */
export async function getDashboardStatistics(days = 7, includeTypes = 'all') {
  return request('/api/orderquery/v1/dashboard/statistics', {
    auth: true,
    query: { days, includeTypes }
  });
}

/**
 * 전체 주문 목록 조회 (고급 필터링)
 */
export async function getDashboardOrders(filters = {}) {
  return request('/api/orderquery/v1/dashboard/orders', {
    auth: true,
    query: filters
  });
}

const userProfileCache = new Map();
const missingUserProfileCache = new Set();

export async function getUserProfile(userId) {
  const normalizedId = Number(userId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) return null;

  if (userProfileCache.has(normalizedId)) {
    return userProfileCache.get(normalizedId);
  }
  if (missingUserProfileCache.has(normalizedId)) {
    return null;
  }

  try {
    const response = await request(`/api/users/v1/users/${normalizedId}`, { auth: false });
    userProfileCache.set(normalizedId, response);
    return response;
  } catch (error) {
    // 404인 경우만 미존재 캐시에 넣고, 그 외 에러는 다음번에 재시도한다.
    if (isApiError(error, 404)) {
      missingUserProfileCache.add(normalizedId);
    }
    return null;
  }
}

export async function enrichOrdersWithCustomerNames(orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) return orders;

  const unresolvedIds = [...new Set(
    orders
      .filter((order) => {
        const name = String(order?.customerName || '');
        return (
          Number.isFinite(Number(order?.customerId))
          && (name === '고객' || /^고객\s*#\d+$/i.test(name))
        );
      })
      .map((order) => Number(order.customerId))
  )];

  if (unresolvedIds.length === 0) return orders;

  const profiles = await Promise.all(unresolvedIds.map((userId) => getUserProfile(userId)));
  const nameById = new Map();
  profiles.forEach((profile) => {
    const id = Number(profile?.id ?? profile?.userId);
    const name = String(profile?.name || '').trim();
    if (Number.isFinite(id) && name) {
      nameById.set(id, name);
    }
  });

  if (nameById.size === 0) return orders;

  return orders.map((order) => {
    const id = Number(order?.customerId);
    const resolvedName = nameById.get(id);
    if (!resolvedName) return order;
    return { ...order, customerName: resolvedName };
  });
}

/**
 * 주문 검색
 * @param {string} keyword - 검색 키워드
 * @param {string} searchScope - 검색 범위
 * @param {number} limit - 최대 결과 수
 */
export async function searchDashboardOrders(keyword, searchScope = 'all', limit = 50) {
  return request('/api/orderquery/v1/dashboard/search', {
    auth: true,
    query: { keyword, searchScope, limit }
  });
}
