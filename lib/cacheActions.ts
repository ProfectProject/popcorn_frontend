'use server'

import { revalidateTag, updateTag } from 'next/cache'

// 🔄 Next.js 16 캐시 무효화 Server Actions
// 데이터 변경 시 관련 캐시를 즉시 갱신

/**
 * 매니저 프로필 업데이트 후 캐시 갱신
 */
export async function revalidateManagerProfile() {
  revalidateTag('manager-profile', 'max')
}

/**
 * 팝업 생성/수정/삭제 후 캐시 갱신
 * updateTag: 즉시 갱신 (read-your-writes)
 */
export async function updatePopupList() {
  updateTag('popup-list')
}

/**
 * 대시보드 통계 새로고침
 * revalidateTag: 백그라운드 갱신
 */
export async function revalidateDashboardStats(storeId?: string) {
  revalidateTag('dashboard-stats', 'hours')
  if (storeId) {
    revalidateTag(`store-${storeId}`, 'hours')
  }
}

/**
 * 스토어 생성/수정 후 캐시 갱신
 */
export async function updateStoreList() {
  updateTag('store-list')
}

/**
 * 쿠폰 생성/수정/삭제 후 캐시 갱신
 */
export async function updateCouponList() {
  updateTag('coupon-list')
}

/**
 * 주문 생성 후 캐시 갱신
 */
export async function revalidateOrderList() {
  revalidateTag('order-list', 'max')
  // 주문이 생성되면 대시보드 통계도 갱신
  revalidateTag('dashboard-stats', 'max')
}

/**
 * 전체 캐시 새로고침 (관리자 액션)
 */
export async function revalidateAllCache() {
  const tags = [
    'manager-profile',
    'popup-list',
    'dashboard-stats',
    'store-list',
    'coupon-list',
    'order-list'
  ]

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }
}

/**
 * 쿠폰 자동 생성 후 즉시 갱신
 * 사용자가 즉시 새 쿠폰을 봐야 하므로 updateTag 사용
 */
export async function updateAfterCouponAutoCreate() {
  updateTag('coupon-list')
  revalidateTag('dashboard-stats', 'max')
}