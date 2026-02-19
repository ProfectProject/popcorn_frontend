// 🚀 Next.js 16 캐시 래퍼 - 기존 API 함수들을 감싸서 캐싱 적용
// 기존 managerApi.js 함수들을 메모이제이션하여 성능 대폭 개선

import { useEffect, useState } from 'react';
import {
  getDashboardMain,
  getDashboardHealth,
  listStores,
  listPopups,
  listOrderItems,
  getOrderSummary,
  listCoupons,
  getManagerUser
} from './managerApi';

// 간단한 메모리 캐싱 구현 (TTL 포함)
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttlSeconds = 300) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // 패턴 매칭으로 삭제 (태그 기반)
  deleteByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new MemoryCache();

// 🔧 캐시 키 생성기
function createCacheKey(funcName, ...args) {
  return `${funcName}:${JSON.stringify(args)}`;
}

// 🔧 캐시 래퍼 함수
function withCache(func, ttlSeconds = 300, keyPrefix = '') {
  return async (...args) => {
    const cacheKey = keyPrefix + createCacheKey(func.name, ...args);

    // 캐시에서 확인
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`🚀 Cache hit: ${cacheKey}`);
      return cached;
    }

    // 캐시 미스 - 실제 API 호출
    console.log(`📡 Cache miss: ${cacheKey}`);
    const result = await func(...args);
    cache.set(cacheKey, result, ttlSeconds);
    return result;
  };
}

// 🚀 캐시된 API 함수들
export const cachedGetDashboardMain = withCache(getDashboardMain, 60); // 1분 캐싱
export const cachedGetDashboardHealth = withCache(getDashboardHealth, 30); // 30초 캐싱
export const cachedListStores = withCache(listStores, 600); // 10분 캐싱
export const cachedListPopups = withCache(listPopups, 180); // 3분 캐싱
export const cachedListOrderItems = withCache(listOrderItems, 30); // 30초 캐싱 (실시간 성격)
export const cachedGetOrderSummary = withCache(getOrderSummary, 60); // 1분 캐싱
export const cachedListCoupons = withCache(listCoupons, 180); // 3분 캐싱

// 🔄 캐시 무효화 함수들
export function invalidateDashboardCache() {
  cache.deleteByPattern('getDashboardMain');
  cache.deleteByPattern('getDashboardHealth');
  console.log('🗑️ Dashboard cache invalidated');
}

export function invalidateStoreCache() {
  cache.deleteByPattern('listStores');
  console.log('🗑️ Store cache invalidated');
}

export function invalidatePopupCache() {
  cache.deleteByPattern('listPopups');
  console.log('🗑️ Popup cache invalidated');
}

export function invalidateOrderCache() {
  cache.deleteByPattern('listOrderItems');
  cache.deleteByPattern('getOrderSummary');
  console.log('🗑️ Order cache invalidated');
}

export function invalidateCouponCache() {
  cache.deleteByPattern('listCoupons');
  console.log('🗑️ Coupon cache invalidated');
}

export function clearAllCache() {
  cache.clear();
  console.log('🗑️ All cache cleared');
}

// 📊 캐시 통계
export function getCacheStats() {
  return {
    size: cache.cache.size,
    keys: Array.from(cache.cache.keys()),
  };
}

// 🔧 토큰 기반 캐시 (사용자별 캐싱)
export function getUserSpecificKey(baseKey) {
  const user = getManagerUser();
  const userId = user?.id || user?.email || 'anonymous';
  return `${baseKey}:user:${userId}`;
}

// 🚀 React Hook 스타일 캐싱 (클라이언트 컴포넌트용)
export function useCachedApi(apiFunc, deps = [], ttlSeconds = 300) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await withCache(apiFunc, ttlSeconds)();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [apiFunc, ttlSeconds, ...deps]);

  return { data, loading, error };
}

// 🔄 자동 캐시 갱신 (백그라운드)
export function startCacheRefresh() {
  const REFRESH_INTERVALS = {
    dashboard: 60000,    // 1분
    stores: 300000,      // 5분
    popups: 180000,      // 3분
    orders: 30000,       // 30초
    coupons: 180000,     // 3분
  };

  const intervals = [];

  // 대시보드 자동 갱신
  intervals.push(setInterval(() => {
    cache.deleteByPattern('getDashboardMain');
    cache.deleteByPattern('getDashboardHealth');
  }, REFRESH_INTERVALS.dashboard));

  // 주문 자동 갱신 (가장 자주)
  intervals.push(setInterval(() => {
    cache.deleteByPattern('listOrderItems');
    cache.deleteByPattern('getOrderSummary');
  }, REFRESH_INTERVALS.orders));

  // 팝업 & 쿠폰 자동 갱신
  intervals.push(setInterval(() => {
    cache.deleteByPattern('listPopups');
    cache.deleteByPattern('listCoupons');
  }, REFRESH_INTERVALS.popups));

  // 스토어 자동 갱신 (가장 드물게)
  intervals.push(setInterval(() => {
    cache.deleteByPattern('listStores');
  }, REFRESH_INTERVALS.stores));

  // 정리 함수 반환
  return () => {
    intervals.forEach(interval => clearInterval(interval));
  };
}

// 🏷️ 태그 기반 캐시 무효화
export const CacheTags = {
  DASHBOARD: 'dashboard',
  STORES: 'stores',
  POPUPS: 'popups',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  USER: 'user'
};

export function invalidateByTags(...tags) {
  tags.forEach(tag => {
    switch (tag) {
      case CacheTags.DASHBOARD:
        invalidateDashboardCache();
        break;
      case CacheTags.STORES:
        invalidateStoreCache();
        break;
      case CacheTags.POPUPS:
        invalidatePopupCache();
        break;
      case CacheTags.ORDERS:
        invalidateOrderCache();
        break;
      case CacheTags.COUPONS:
        invalidateCouponCache();
        break;
      default:
        cache.deleteByPattern(tag);
    }
  });
}
