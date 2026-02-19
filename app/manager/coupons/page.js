'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import CouponStats from '../../../components/CouponStats';
import CouponList from '../../../components/CouponList';
import CouponStatusModal from '../../../components/CouponStatusModal';
import CouponEditModal from '../../../components/CouponEditModal';
import QuickCouponModal from '../../../components/QuickCouponModal';
import './coupons.css';
import {
  activateCoupon,
  clearManagerSession,
  createCoupon,
  deleteCoupon as deleteCouponApi,
  getManagerToken,
  getManagerUser,
  getOrderSummary,
  getTotalDiscountBenefitFromOrderSummary,
  getSelectedPopupId,
  getSelectedStoreId,
  isApiError,
  listCoupons,
  mapCouponToUi,
  updateCoupon as updateCouponApi,
  updateCouponStatus as updateCouponStatusApi
} from '../../../lib/managerApi';

const AUTO_COUPON_CREATED_DATE_KEY = 'manager_auto_coupon_created_date';
const AUTO_COUPON_EXTRA_CREATED_DATE_KEY = 'manager_auto_coupon_extra_created_date';
const SAMPLE_COUPON_SEEDED_KEY = 'manager_coupon_seeded_for_stats_v1';
const COUPONS_PAGE_SIZE = 10;

export default function CouponsPage() {
  const router = useRouter();
  const autoCreateCheckedRef = useRef(false);
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [totalDiscountBenefit, setTotalDiscountBenefit] = useState(null);
  const [usedCouponCountFromSummary, setUsedCouponCountFromSummary] = useState(null);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTargetCoupon, setStatusTargetCoupon] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTargetCoupon, setEditTargetCoupon] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAutoResultModal, setShowAutoResultModal] = useState(false);
  const [autoResultTitle, setAutoResultTitle] = useState('');
  const [autoResultMessage, setAutoResultMessage] = useState('');
  const [autoResultCouponCode, setAutoResultCouponCode] = useState('');
  const [canCreateExtraOnce, setCanCreateExtraOnce] = useState(false);

  const loadTotalDiscountBenefit = async () => {
    // Use the store/popup selection from the manager dashboard (saved in storage).
    const storeId = getSelectedStoreId();
    const popupId = getSelectedPopupId();
    if (!storeId || !popupId) {
      setTotalDiscountBenefit(null);
      setUsedCouponCountFromSummary(null);
      return;
    }

    try {
      const summary = await getOrderSummary(storeId, popupId);
      const benefit = getTotalDiscountBenefitFromOrderSummary(summary);
      const usedCount = Number(
        summary?.usedCouponCount
        ?? summary?.used_coupon_count
        ?? summary?.couponUsedCount
        ?? summary?.coupon_used_count
        ?? summary?.totalCouponUsage
        ?? summary?.total_coupon_usage
        ?? summary?.reservation?.usedCouponCount
        ?? summary?.reservation?.used_coupon_count
        ?? summary?.goods?.usedCouponCount
        ?? summary?.goods?.used_coupon_count
        ?? 0
      );
      setTotalDiscountBenefit(benefit);
      setUsedCouponCountFromSummary(Number.isFinite(usedCount) ? usedCount : null);
    } catch (summaryError) {
      // Do not block the coupon page on summary failures.
      if (!isApiError(summaryError, 404)) {
        console.warn('주문 요약(할인 혜택) 조회 실패:', summaryError);
      }
      setTotalDiscountBenefit(null);
      setUsedCouponCountFromSummary(null);
    }
  };

  const loadCoupons = async () => {
    setError('');
    setIsLoading(true);

    try {
      const couponList = await listCoupons();
      if (!Array.isArray(couponList)) {
        throw new Error('쿠폰 응답 형식이 올바르지 않습니다.');
      }
      const mappedCoupons = couponList.map(mapCouponToUi);
      setCoupons(mappedCoupons);
      return mappedCoupons;
    } catch (loadError) {
      setError(loadError?.message || '쿠폰 목록을 불러오지 못했습니다.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const hasSeededCoupons = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SAMPLE_COUPON_SEEDED_KEY) === '1';
  };

  const markSeededCoupons = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAMPLE_COUPON_SEEDED_KEY, '1');
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seedCouponsForStats = async () => {
    const now = new Date();
    const start = formatDateInput(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 45);
    const validUntil = formatDateInput(end);
    const seedSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const samples = [
      { code: `WELCOME-${seedSuffix}`, discountValue: 5000 },
      { code: `SPRING-${seedSuffix}`, discountValue: 3000 }
    ];

    for (const sample of samples) {
      const created = await createCoupon({
        name: `${sample.code} 쿠폰`,
        description: `${sample.code} 샘플 쿠폰`,
        discountType: 'amount',
        discountValue: sample.discountValue,
        minOrderAmount: 20000,
        usageLimit: 200,
        validFrom: start,
        validUntil,
        targetType: 'ALL_USERS'
      });

      if (created?.id) {
        try {
          await activateCoupon(created.id);
        } catch (_activateError) {
          // 생성은 성공했고 상태 변경만 실패한 경우라 화면 흐름은 유지합니다.
        }
      }
    }
  };

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shouldAutoCreateCoupon = () => {
    if (typeof window === 'undefined') return false;
    const createdDate = window.localStorage.getItem(AUTO_COUPON_CREATED_DATE_KEY);
    return createdDate !== getTodayKey();
  };

  const markAutoCouponCreatedToday = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTO_COUPON_CREATED_DATE_KEY, getTodayKey());
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const canCreateExtraCouponToday = () => {
    if (typeof window === 'undefined') return false;
    const createdDate = window.localStorage.getItem(AUTO_COUPON_EXTRA_CREATED_DATE_KEY);
    return createdDate !== getTodayKey();
  };

  const markExtraCouponCreatedToday = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTO_COUPON_EXTRA_CREATED_DATE_KEY, getTodayKey());
  };

  useEffect(() => {
    const token = getManagerToken();
    if (!token) {
      router.replace('/manager');
      return;
    }

    const savedUser = getManagerUser();
    if (savedUser) {
      setUser({
        name: savedUser.name || savedUser.email || '매니저',
        email: savedUser.email || 'manager@popcorn.kr'
      });
    }

    const initialize = async () => {
      const [loadedCoupons] = await Promise.all([
        loadCoupons(),
        loadTotalDiscountBenefit()
      ]);

      if (loadedCoupons.length === 0 && !hasSeededCoupons()) {
        try {
          await seedCouponsForStats();
          markSeededCoupons();
          await loadCoupons();
        } catch (_seedError) {
          // 샘플 생성 실패는 기존 흐름을 막지 않습니다.
        }
      }

      if (autoCreateCheckedRef.current) return;
      autoCreateCheckedRef.current = true;

      if (shouldAutoCreateCoupon()) {
        const result = await handleAutoCouponCreate({ silent: true, autoTriggered: true });
        if (result.ok) {
          setCanCreateExtraOnce(canCreateExtraCouponToday());
          setShowAutoResultModal(true);
          setAutoResultTitle('자동 쿠폰 생성 완료');
          setAutoResultMessage('오늘 자동 쿠폰이 생성되었습니다. 필요하면 오늘 1회 추가 생성할 수 있습니다.');
          setAutoResultCouponCode(result.code || '');
        }
      }
    };

    initialize();
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const statsWithDiscountBenefit = useMemo(() => {
    const activeCount = coupons.filter((coupon) => coupon.status === 'active').length;
    const usedCountFromCoupons = coupons.reduce((sum, coupon) => sum + (coupon.usageCount || 0), 0);
    const usedCount = usedCountFromCoupons > 0
      ? usedCountFromCoupons
      : (usedCouponCountFromSummary ?? 0);
    const fallbackDiscountTotal = coupons.reduce((sum, coupon) => {
      const couponBenefit = Number(coupon.totalDiscountBenefit);
      if (Number.isFinite(couponBenefit) && couponBenefit > 0) {
        return sum + couponBenefit;
      }

      const usage = coupon.usageCount || 0;
      if (coupon.discountType === 'amount') {
        return sum + usage * (coupon.discountValue || 0);
      }
      if (coupon.discountType === 'percentage' && coupon.maxDiscountAmount) {
        return sum + usage * coupon.maxDiscountAmount;
      }
      return sum;
    }, 0);

    const appliedDiscountTotal = totalDiscountBenefit == null ? fallbackDiscountTotal : totalDiscountBenefit;

    return [
      { label: '활성 쿠폰', value: String(activeCount), unit: '개', color: '#10b981' },
      { label: '사용된 쿠폰', value: String(usedCount), unit: '개', color: '#3b82f6' },
      { label: '총 할인 혜택', value: `₩${(appliedDiscountTotal / 1000000).toFixed(1)}M`, unit: '', color: '#ea580c' }
    ];
  }, [coupons, totalDiscountBenefit, usedCouponCountFromSummary]);

  const handleQuickCoupon = async (couponData) => {
    setError('');
    setIsSaving(true);

    try {
      const created = await createCoupon({
        name: `${couponData.code} 쿠폰`,
        description: `${couponData.code} 자동 생성 쿠폰`,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        minOrderAmount: null,
        usageLimit: couponData.usageLimit,
        validFrom: couponData.validFrom,
        validUntil: couponData.validUntil,
        targetType: 'ALL_USERS'
      });

      setCoupons(prev => [mapCouponToUi(created), ...prev]);
      setShowQuickModal(false);
    } catch (saveError) {
      setError(saveError?.message || '쿠폰 등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateAutoCouponCode = () => {
    const now = new Date();
    const yymmdd = [
      String(now.getFullYear()).slice(-2),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('');
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `AUTO${yymmdd}${randomPart}`;
  };

  const formatDateInput = (date) => date.toISOString().split('T')[0];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function handleAutoCouponCreate({ silent = false, autoTriggered = false, extraOnce = false } = {}) {
    if (!silent) {
      setError('');
    }
    setIsSaving(true);

    const code = generateAutoCouponCode();
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 30);

    const discountCandidates = [10, 15, 20];
    const discountValue = discountCandidates[Math.floor(Math.random() * discountCandidates.length)];

    try {
      const created = await createCoupon({
        name: `${code} 쿠폰`,
        description: `${code} 자동 생성 쿠폰`,
        discountType: 'percentage',
        discountValue,
        minOrderAmount: null,
        usageLimit: 200,
        validFrom: formatDateInput(today),
        validUntil: formatDateInput(validUntil),
        targetType: 'ALL_USERS'
      });

      let savedCoupon = created;
      if (created?.id) {
        try {
          savedCoupon = await activateCoupon(created.id);
        } catch (_activateError) {
          // 생성은 성공했지만 즉시 활성화가 실패할 수 있어 생성 결과를 그대로 반영합니다.
        }
      }

      setCoupons((prev) => [mapCouponToUi(savedCoupon), ...prev]);
      if (autoTriggered) {
        markAutoCouponCreatedToday();
      }
      if (extraOnce) {
        markExtraCouponCreatedToday();
      }
      return { ok: true, code };
    } catch (saveError) {
      if (!silent) {
        setError(saveError?.message || '자동 쿠폰 생성에 실패했습니다.');
      }
      return { ok: false, message: saveError?.message || '자동 쿠폰 생성에 실패했습니다.' };
    } finally {
      setIsSaving(false);
    }
  }

  const handleCreateExtraOnce = async () => {
    if (!canCreateExtraOnce || isSaving) return;
    const result = await handleAutoCouponCreate({ silent: true, extraOnce: true });

    if (result.ok) {
      setAutoResultTitle('추가 자동 생성 완료');
      setAutoResultMessage('요청하신 오늘 1회 추가 생성이 완료되었습니다.');
      setAutoResultCouponCode(result.code || '');
      setCanCreateExtraOnce(false);
      return;
    }

    setError(result.message || '추가 자동 생성에 실패했습니다.');
  };

  const handleDeleteCoupon = async (couponId) => {
    if (confirm('쿠폰을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) {
      setError('');
      setIsSaving(true);
      try {
        await deleteCouponApi(couponId);
        setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
      } catch (saveError) {
        setError(saveError?.message || '쿠폰 삭제에 실패했습니다.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleOpenStatusModal = (coupon) => {
    setStatusTargetCoupon(coupon);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusTargetCoupon(null);
  };

  const handleUpdateCouponStatus = async (nextStatus) => {
    if (!statusTargetCoupon?.id) return;

    setError('');
    setIsSaving(true);

    try {
      const updated = await updateCouponStatusApi(statusTargetCoupon.id, nextStatus);

      setCoupons(prev => prev.map((coupon) => (
        coupon.id === statusTargetCoupon.id ? mapCouponToUi(updated) : coupon
      )));
      closeStatusModal();
    } catch (saveError) {
      setError(saveError?.message || '쿠폰 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (coupon) => {
    setEditTargetCoupon(coupon);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditTargetCoupon(null);
  };

  const handleEditCoupon = async (couponData) => {
    if (!editTargetCoupon?.id) return;

    setError('');
    setIsSaving(true);

    try {
      await updateCouponApi(editTargetCoupon.id, couponData);
      await loadCoupons();
      closeEditModal();
    } catch (saveError) {
      // 백엔드가 수정은 성공하지만 응답 형식이 다를 수 있으므로 목록 새로고침 시도
      await loadCoupons();
      closeEditModal();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCoupons = selectedStatus === 'all'
    ? coupons
    : coupons.filter(coupon => coupon.status === selectedStatus);

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / COUPONS_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, coupons.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedCoupons = useMemo(() => {
    const start = (currentPage - 1) * COUPONS_PAGE_SIZE;
    return filteredCoupons.slice(start, start + COUPONS_PAGE_SIZE);
  }, [filteredCoupons, currentPage]);

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  return (
    <div className="coupons-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="coupons-main">
        {/* 헤더 */}
        <header className="coupons-header">
          <div className="header-content">
            <h1 className="page-title">쿠폰 관리</h1>
            <p className="page-subtitle">고객 할인 쿠폰을 관리하세요</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowQuickModal(true)}
              className="quick-coupon-btn"
              title="간단한 쿠폰 등록"
              disabled={isSaving}
            >
              쿠폰 등록
            </button>
            <Link href="/manager/coupons/create" className="create-coupon-btn">
              쿠폰 생성
            </Link>
          </div>
        </header>

        {/* 통계 카드 */}
        <section className="stats-section">
          <CouponStats stats={statsWithDiscountBenefit} />
        </section>

        {error && <div className="error-alert">{error}</div>}
        {isLoading && <div className="loading">쿠폰 정보를 불러오는 중...</div>}

        {/* 쿠폰 목록 */}
        {!isLoading && (
          <section className="coupons-content">
          <div className="coupons-filters">
            <h2 className="section-title">최근 등록 쿠폰</h2>
            <div className="status-filter">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedStatus('active')}
                className={`filter-btn ${selectedStatus === 'active' ? 'active' : ''}`}
              >
                활성
              </button>
              <button
                onClick={() => setSelectedStatus('disabled')}
                className={`filter-btn ${selectedStatus === 'disabled' ? 'active' : ''}`}
              >
                비활성
              </button>
              <button
                onClick={() => setSelectedStatus('expired')}
                className={`filter-btn ${selectedStatus === 'expired' ? 'active' : ''}`}
              >
                만료
              </button>
            </div>
          </div>

          <CouponList
            coupons={pagedCoupons}
            onDelete={handleDeleteCoupon}
            onStatusChange={handleOpenStatusModal}
            onEdit={handleOpenEditModal}
          />

          {filteredCoupons.length > 0 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                이전
              </button>
              <span className="pagination-info">
                {currentPage} / {totalPages} 페이지
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                다음
              </button>
            </div>
          )}
          </section>
        )}

        {/* 간단 쿠폰 등록 모달 */}
        {showQuickModal && (
          <QuickCouponModal
            onSave={handleQuickCoupon}
            onCancel={() => setShowQuickModal(false)}
          />
        )}

        {showStatusModal && statusTargetCoupon && (
          <CouponStatusModal
            coupon={statusTargetCoupon}
            isSaving={isSaving}
            onSave={handleUpdateCouponStatus}
            onCancel={closeStatusModal}
          />
        )}

        {showEditModal && editTargetCoupon && (
          <CouponEditModal
            coupon={editTargetCoupon}
            isSaving={isSaving}
            onSave={handleEditCoupon}
            onCancel={closeEditModal}
          />
        )}

        {showAutoResultModal && (
          <div className="auto-result-modal-overlay" onClick={() => setShowAutoResultModal(false)}>
            <div className="auto-result-modal" onClick={(e) => e.stopPropagation()}>
              <div className="auto-result-modal-header">
                <h2 className="auto-result-modal-title">{autoResultTitle}</h2>
                <button
                  type="button"
                  className="auto-result-modal-close"
                  onClick={() => setShowAutoResultModal(false)}
                  aria-label="자동 생성 결과 모달 닫기"
                >
                  ×
                </button>
              </div>

              <div className="auto-result-modal-body">
                <p className="auto-result-modal-message">{autoResultMessage}</p>
                {autoResultCouponCode && (
                  <p className="auto-result-modal-code">
                    생성 코드: <strong>{autoResultCouponCode}</strong>
                  </p>
                )}
              </div>

              <div className="auto-result-modal-actions">
                <button
                  type="button"
                  className="auto-result-secondary-btn"
                  onClick={() => setShowAutoResultModal(false)}
                >
                  닫기
                </button>
                <button
                  type="button"
                  className="auto-result-primary-btn"
                  onClick={handleCreateExtraOnce}
                  disabled={!canCreateExtraOnce || isSaving}
                >
                  {!canCreateExtraOnce ? '오늘 1회 추가 생성 완료' : (isSaving ? '생성 중...' : '오늘 1회 추가 생성')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
