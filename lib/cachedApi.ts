'use cache'

// 🚀 Next.js 16 Cache Components
// API 호출을 자동으로 캐싱하여 성능 대폭 개선

/**
 * 매니저 정보 캐싱 (5분)
 * 자주 변하지 않는 사용자 정보를 캐싱
 */
export async function getCachedManagerInfo(token: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const response = await fetch(`${apiBase}/api/v1/managers/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    // Next.js 16: 명시적 캐싱 설정
    next: {
      revalidate: 300, // 5분 캐싱
      tags: ['manager-profile']
    }
  });

  if (!response.ok) {
    throw new Error('매니저 정보를 가져올 수 없습니다');
  }

  return response.json();
}

/**
 * 팝업 목록 캐싱 (2분)
 * 팝업 목록은 상대적으로 자주 변할 수 있으므로 짧은 캐싱
 */
export async function getCachedPopupList(token: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const response = await fetch(`${apiBase}/api/v1/popups`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    next: {
      revalidate: 120, // 2분 캐싱
      tags: ['popup-list']
    }
  });

  if (!response.ok) {
    throw new Error('팝업 목록을 가져올 수 없습니다');
  }

  return response.json();
}

/**
 * 대시보드 통계 캐싱 (1분)
 * 실시간 성격이 강한 통계는 짧은 캐싱
 */
export async function getCachedDashboardStats(token: string, storeId?: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const url = storeId
    ? `${apiBase}/api/v1/dashboard/stats?storeId=${storeId}`
    : `${apiBase}/api/v1/dashboard/stats`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    next: {
      revalidate: 60, // 1분 캐싱
      tags: ['dashboard-stats', ...(storeId ? [`store-${storeId}`] : [])]
    }
  });

  if (!response.ok) {
    throw new Error('대시보드 통계를 가져올 수 없습니다');
  }

  return response.json();
}

/**
 * 스토어 목록 캐싱 (10분)
 * 스토어는 자주 변하지 않으므로 긴 캐싱
 */
export async function getCachedStoreList(token: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const response = await fetch(`${apiBase}/api/v1/stores`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    next: {
      revalidate: 600, // 10분 캐싱
      tags: ['store-list']
    }
  });

  if (!response.ok) {
    throw new Error('스토어 목록을 가져올 수 없습니다');
  }

  return response.json();
}

/**
 * 쿠폰 목록 캐싱 (3분)
 * 쿠폰은 중간 정도의 변경 빈도
 */
export async function getCachedCouponList(token: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const response = await fetch(`${apiBase}/api/v1/coupons`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    next: {
      revalidate: 180, // 3분 캐싱
      tags: ['coupon-list']
    }
  });

  if (!response.ok) {
    throw new Error('쿠폰 목록을 가져올 수 없습니다');
  }

  return response.json();
}

/**
 * 주문 목록 캐싱 (30초)
 * 주문은 실시간 성격이 강하므로 매우 짧은 캐싱
 */
export async function getCachedOrderList(token: string, limit: number = 50) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const response = await fetch(`${apiBase}/api/v1/orders?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    next: {
      revalidate: 30, // 30초 캐싱
      tags: ['order-list']
    }
  });

  if (!response.ok) {
    throw new Error('주문 목록을 가져올 수 없습니다');
  }

  return response.json();
}