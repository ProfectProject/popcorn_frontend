'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Chart from '../../../components/Chart';
import ProductCard from '../../../components/ProductCard';
import PopupCard from '../../../components/PopupCard';
import './dashboard.css';
import {
  aggregateOrdersFromOrderItems,
  clearManagerSession,
  getDashboardMainByStore,
  getManagerToken,
  getManagerUser,
  getSelectedPopupId,
  getSelectedStoreId,
  isApiError,
  setSelectedPopupId,
  setSelectedStoreId
} from '../../../lib/managerApi';

// 🚀 Next.js 16 캐시된 API 함수들
import {
  cachedGetDashboardMain as getDashboardMain,
  cachedGetDashboardHealth as getDashboardHealth,
  cachedListStores as listStores,
  cachedListPopups as listPopups,
  cachedListOrderItems as listOrderItems,
  cachedGetOrderSummary as getOrderSummary
} from '../../../lib/cachedManagerApi';

function countRecentOrders(orderList, days = 7) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  return orderList.filter((order) => {
    if (!order?.orderDate) return false;
    const orderDate = new Date(order.orderDate);
    if (Number.isNaN(orderDate.getTime())) return false;
    return orderDate >= since;
  }).length;
}

function isPaidOrderItem(item) {
  return String(item?.paymentStatus || '').toUpperCase() === 'PAID';
}

function buildRecentDateWindow(days = 7) {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreIdState] = useState('');
  const [popups, setPopups] = useState([]);
  const [selectedPopupId, setSelectedPopupIdState] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 📊 새로운 대시보드 상태
  const [dashboardMain, setDashboardMain] = useState(null);
  const [isDashboardHealthy, setIsDashboardHealthy] = useState(false);

  const forceLogoutOnServerError = useCallback(() => {
    clearManagerSession();
    if (typeof window !== 'undefined') {
      window.alert('서버 오류가 반복되어 로그아웃합니다. 다시 로그인해주세요.');
    }
    router.replace('/manager');
  }, [router]);

  const loadStoresData = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      const storeList = await listStores();
      setStores(storeList);

      if (!storeList.length) {
        setSelectedStoreIdState('');
        setPopups([]);
        setSelectedPopupIdState('');
        setOrderItems([]);
        setOrders([]);
        setSummary(null);
        return;
      }

      const savedStoreId = getSelectedStoreId();
      const hasSavedStore = savedStoreId && storeList.some((store) => store.id === savedStoreId);
      const initialStoreId = hasSavedStore ? savedStoreId : storeList[0].id;

      setSelectedStoreId(initialStoreId);
      setSelectedStoreIdState(initialStoreId);
    } catch (loadError) {
      setError(loadError?.message || '스토어 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

    loadStoresData();
  }, [loadStoresData, router]);

  useEffect(() => {
    if (!selectedStoreId) return;

    const loadPopupsByStore = async () => {
      setError('');
      setIsLoading(true);

      try {
        const popupList = await listPopups(selectedStoreId, { page: 1, size: 100 });
        setPopups(popupList);

        if (!popupList.length) {
          setSelectedPopupId('');
          setSelectedPopupIdState('');
          setOrderItems([]);
          setOrders([]);
          setSummary(null);
          return;
        }

        const savedPopupId = getSelectedPopupId();
        const hasSavedPopup = savedPopupId && popupList.some((popup) => popup.popupId === savedPopupId);
        const initialPopupId = hasSavedPopup ? savedPopupId : popupList[0].popupId;

        setSelectedPopupId(initialPopupId);
        setSelectedPopupIdState(initialPopupId);
      } catch (loadError) {
        setError(loadError?.message || '팝업 정보를 불러오지 못했습니다.');

        const message = String(loadError?.message || '');
        const isServerErrorStatus = isApiError(loadError)
          && Number.isFinite(loadError?.status)
          && loadError.status >= 500;
        const isServerErrorMessage = message.includes('서버 오류가 발생했습니다');

        if (isServerErrorStatus || isServerErrorMessage) {
          forceLogoutOnServerError();
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPopupsByStore();
  }, [selectedStoreId, forceLogoutOnServerError]);

  useEffect(() => {
    if (!selectedStoreId || !selectedPopupId) return;

    const loadDashboardData = async () => {
      setError('');
      setIsLoading(true);

      try {
        let summaryData = null;
        try {
          summaryData = await getOrderSummary(selectedStoreId, selectedPopupId);
        } catch (summaryError) {
          if (!isApiError(summaryError, 404)) {
            throw summaryError;
          }
        }

        let orderItems = [];
        try {
          // 504 타임아웃 방지를 위해 대용량 단건 조회 대신 페이지 분할 조회를 사용한다.
          const targetCount = 200;
          const pageSize = 50;
          let page = 0;

          while (orderItems.length < targetCount) {
            const remaining = targetCount - orderItems.length;
            const currentSize = Math.min(pageSize, remaining);
            const orderItemPage = await listOrderItems(selectedStoreId, selectedPopupId, {
              page,
              size: currentSize,
              sortBy: 'orderedAt',
              sortDirection: 'DESC'
            });
            const items = Array.isArray(orderItemPage?.items) ? orderItemPage.items : [];

            if (items.length === 0) break;

            orderItems = [...orderItems, ...items];

            const hasTotalPages = typeof orderItemPage?.totalPages === 'number';
            const reachedLastPage = hasTotalPages
              ? page + 1 >= orderItemPage.totalPages
              : items.length < currentSize;

            if (reachedLastPage) break;
            page += 1;
          }
        } catch (itemsError) {
          // 주문 아이템 API가 타임아웃되더라도 대시보드 전체를 깨지 않게 한다.
          if (isApiError(itemsError, 504)) {
            console.warn('주문 아이템 조회 타임아웃(504) - 부분 데이터로 계속 진행합니다.');
          } else if (!isApiError(itemsError, 404)) {
            throw itemsError;
          }
        }

        setSummary(summaryData);
        setOrderItems(orderItems);
        setOrders(aggregateOrdersFromOrderItems(orderItems));
      } catch (loadError) {
        setError(loadError?.message || '대시보드 데이터를 불러오지 못했습니다.');
        setOrderItems([]);
        setOrders([]);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedStoreId, selectedPopupId]);

  // 📊 대시보드 메인 데이터 로드 (스토어별 우선)
  useEffect(() => {
    const loadGlobalDashboardData = async () => {
      try {
        let healthy = false;

        // 대시보드 헬스체크
        try {
          await getDashboardHealth();
          healthy = true;
        } catch (healthError) {
          console.warn('대시보드 헬스체크 실패:', healthError);
          healthy = false;
        }
        setIsDashboardHealthy(healthy);

        // 📊 스토어별/전체 대시보드 데이터 로드
        if (healthy) {
          try {
            const baseDate = new Date().toISOString().split('T')[0];
            const mainData = selectedStoreId
              ? await getDashboardMainByStore(selectedStoreId, baseDate)
              : await getDashboardMain(baseDate);

            setDashboardMain(mainData);
            console.log('✅ 대시보드 데이터 로드 완료:', mainData);
          } catch (mainError) {
            console.warn('메인 대시보드 데이터 로드 실패:', mainError);
          }

          // 📊 임시: 상태 요약 데이터 로드 비활성화 (500 오류 방지)
          try {
            // const statusData = await getDashboardStatusSummary();
            // setDashboardStatus(statusData);
            console.log('✅ 상태 요약 데이터 로드 건너뜀 (임시)');
          } catch (statusError) {
            console.warn('상태 요약 데이터 로드 실패:', statusError);
          }
        }
      } catch (dashboardError) {
        console.warn('글로벌 대시보드 데이터 로드 중 오류:', dashboardError);
      }
    };

    loadGlobalDashboardData();
  }, [selectedStoreId]);

  const stats = useMemo(() => {
    const weeklyOrdersFallback = countRecentOrders(orders, 7);
    const completedOrders = orders.filter((order) => order.status === 'completed');
    const popupRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const now = new Date();
    const monthlyCompletedOrders = completedOrders.filter((order) => {
      if (!order.orderDate) return false;
      const ordered = new Date(order.orderDate);
      return ordered.getFullYear() === now.getFullYear() && ordered.getMonth() === now.getMonth();
    });
    const monthlyRevenue = monthlyCompletedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const paidItemRevenue = orderItems.reduce((sum, item) => {
      if (!isPaidOrderItem(item)) return sum;
      return sum + Number(item?.linePrice || 0);
    }, 0);
    const totalRevenue = popupRevenue > 0 ? popupRevenue : paidItemRevenue;

    // 선택된 팝업 데이터가 우선이다.
    if (selectedPopupId) {
      return [
        {
          title: '전체 매출',
          value: `₩${new Intl.NumberFormat('ko-KR').format(totalRevenue)}`,
          change: '선택 팝업 기준',
          positive: true
        },
        {
          title: '주문 건수',
          value: `${weeklyOrdersFallback}건`,
          change: '최근 7일',
          positive: true
        },
        {
          title: '이번 달',
          value: `${monthlyCompletedOrders.length}건`,
          change: `₩${new Intl.NumberFormat('ko-KR').format(monthlyRevenue)}`,
          positive: true
        },
        {
          title: '선택된 팝업',
          value: `${orders.length}건`,
          change: `체크인 ${summary?.checkedInOrders ?? 0}건`,
          positive: true
        }
      ];
    }

    // 팝업 선택 전에는 store-level 대시보드 값 사용
    if (dashboardMain && isDashboardHealthy) {
      const weeklyOrders = dashboardMain.weeklyOrders ?? weeklyOrdersFallback;
      return [
        {
          title: '전체 매출',
          value: `₩${new Intl.NumberFormat('ko-KR').format(dashboardMain.totalRevenue || 0)}`,
          change: `평균 ₩${new Intl.NumberFormat('ko-KR').format(Math.round(dashboardMain.averageOrderAmount || 0))}`,
          positive: true
        },
        {
          title: '주문 건수',
          value: `${weeklyOrders}건`,
          change: '최근 7일',
          positive: true
        },
        {
          title: '이번 달',
          value: `${dashboardMain.monthlyOrders || 0}건`,
          change: `₩${new Intl.NumberFormat('ko-KR').format(dashboardMain.monthlyRevenue || 0)}`,
          positive: true
        }
      ];
    }

    // 🔄 기존 팝업별 데이터 사용 (fallback)
    const legacyTotalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedCount = orders.filter((order) => order.status === 'completed').length;
    const todayCount = orders.filter((order) => {
      if (!order.orderDate) return false;
      const date = new Date(order.orderDate);
      const now = new Date();
      return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    }).length;

    return [
      {
        title: '총 매출',
        value: `₩${new Intl.NumberFormat('ko-KR').format(legacyTotalRevenue)}`,
        change: `완료 ${completedCount}건`,
        positive: true
      },
      {
        title: '주문 건수',
        value: `${weeklyOrdersFallback}건`,
        change: `오늘 ${todayCount}건`,
        positive: true
      },
      {
        title: '체크인',
        value: `${summary?.checkedInOrders ?? 0}건`,
        change: `예약 ${summary?.reservation?.paid ?? 0}건 결제`,
        positive: true
      }
    ];
  }, [orders, summary, dashboardMain, isDashboardHealthy, selectedPopupId, orderItems]);

  const chartData = useMemo(() => {
    const dates = buildRecentDateWindow(7);
    const revenueByDay = new Map(dates.map((d) => [toDateKey(d), 0]));
    const since = dates[0];

    orders.forEach((order) => {
      if (!order.orderDate) return;
      const d = new Date(order.orderDate);
      if (Number.isNaN(d.getTime()) || d < since) return;
      d.setHours(0, 0, 0, 0);
      const key = toDateKey(d);
      if (!revenueByDay.has(key)) return;
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + (order.totalAmount || 0));
    });

    const mapped = dates.map((d) => {
      const key = toDateKey(d);
      return {
        day: `${d.getMonth() + 1}/${d.getDate()}`,
        value: Number(revenueByDay.get(key) || 0)
      };
    });

    if (mapped.every((item) => item.value === 0)) {
      return mapped;
    }

    return mapped;
  }, [orders]);

  const topProducts = useMemo(() => {
    const goodsMap = new Map();
    let totalPaidGoodsRevenue = 0;

    orderItems.forEach((item) => {
      const isPaid = String(item.paymentStatus || '').toUpperCase() === 'PAID';
      if (item.itemType !== 'GOODS' || !item.goodsName || !isPaid) return;

      const prev = goodsMap.get(item.goodsName) || { paidCount: 0, qty: 0, revenue: 0 };
      const next = {
        paidCount: prev.paidCount + 1,
        qty: prev.qty + (item.qty || 0),
        revenue: prev.revenue + (item.linePrice || 0)
      };
      goodsMap.set(item.goodsName, next);
      totalPaidGoodsRevenue += item.linePrice || 0;
    });

    const items = [...goodsMap.entries()]
      .map(([name, data]) => ({
        name,
        sales: `결제 ${data.paidCount}건`,
        revenue: `₩${new Intl.NumberFormat('ko-KR').format(data.revenue)}`,
        trend: `+${totalPaidGoodsRevenue > 0 ? Math.round((data.revenue / totalPaidGoodsRevenue) * 100) : 0}%`,
        paidCount: data.paidCount,
        qty: data.qty,
        revenueValue: data.revenue
      }))
      .sort((a, b) => (
        b.paidCount - a.paidCount
        || b.qty - a.qty
        || b.revenueValue - a.revenueValue
      ))
      .slice(0, 3)
      // eslint-disable-next-line no-unused-vars
      .map(({ paidCount: _paidCount, qty: _qty, revenueValue: _revenueValue, ...rest }) => rest);

    if (items.length > 0) return items;
    return [
      { name: '결제 완료 상품 없음', sales: '결제 0건', revenue: '₩0', trend: '+0%' },
      { name: '결제 완료 상품 없음', sales: '결제 0건', revenue: '₩0', trend: '+0%' },
      { name: '결제 완료 상품 없음', sales: '결제 0건', revenue: '₩0', trend: '+0%' }
    ];
  }, [orderItems]);

  const popularPopups = useMemo(() => {
    if (!summary) {
      return [
        { icon: '🎪', title: '팝업 정보 없음', description: '선택한 팝업 데이터가 없습니다.', ctr: '0%' },
        { icon: '🧾', title: '예약 정보 없음', description: '예약 주문 데이터가 없습니다.', ctr: '0%' },
        { icon: '📦', title: '굿즈 정보 없음', description: '굿즈 주문 데이터가 없습니다.', ctr: '0%' }
      ];
    }

    const reservationTotal = summary.reservation?.total || 0;
    const reservationPaid = summary.reservation?.paid || 0;
    const goodsTotal = summary.goods?.total || 0;
    const goodsPaid = summary.goods?.paid || 0;

    const reservationRate = reservationTotal > 0
      ? `${Math.round((reservationPaid / reservationTotal) * 100)}%`
      : '0%';
    const goodsRate = goodsTotal > 0
      ? `${Math.round((goodsPaid / goodsTotal) * 100)}%`
      : '0%';

    return [
      {
        icon: '🎪',
        title: summary.popupTitle || '팝업',
        description: `${summary.popupStatus || '-'} • ${summary.addressRoad || '-'}`,
        ctr: reservationRate
      },
      {
        icon: '🧾',
        title: '예약 결제율',
        description: `결제 ${reservationPaid}건 / 전체 ${reservationTotal}건`,
        ctr: reservationRate
      },
      {
        icon: '📦',
        title: '굿즈 결제율',
        description: `결제 ${goodsPaid}건 / 전체 ${goodsTotal}건`,
        ctr: goodsRate
      }
    ];
  }, [summary]);

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  const handleStoreChange = (e) => {
    const nextStoreId = e.target.value;
    setSelectedStoreId(nextStoreId);
    setSelectedStoreIdState(nextStoreId);
  };

  const handlePopupChange = (e) => {
    const nextPopupId = e.target.value;
    setSelectedPopupId(nextPopupId);
    setSelectedPopupIdState(nextPopupId);
  };

  return (
    <div className="dashboard-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        {/* 헤더 */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="page-title">팝콘 팝업 스토어 대시보드</h1>
            <p className="page-subtitle">팝업스토어 관리 시스템</p>

            {stores.length > 0 && (
              <div className="dashboard-filter-row">
                <select value={selectedStoreId} onChange={handleStoreChange} className="dashboard-filter-select">
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select value={selectedPopupId} onChange={handlePopupChange} className="dashboard-filter-select">
                  {popups.map((popup) => (
                    <option key={popup.popupId} value={popup.popupId}>
                      {popup.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {error && <div className="error-alert">{error}</div>}
        {isLoading && <div className="loading">대시보드 데이터를 불러오는 중...</div>}
        {!isLoading && !error && stores.length === 0 && (
          <div className="loading">등록된 스토어가 없습니다. 스토어를 먼저 생성해주세요.</div>
        )}
        {!isLoading && stores.length > 0 && !selectedPopupId && (
          <div className="loading">등록된 팝업이 없습니다. 팝업을 먼저 생성해주세요.</div>
        )}

        {!isLoading && selectedPopupId && (
          <>
        {/* 통계 카드 섹션 */}
        <section className="stats-section">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </section>

        {/* 차트 섹션 */}
        <section className="charts-section">
          <div className="section-header">
            <h2 className="section-title">주간 매출 추이</h2>
          </div>
          <Chart data={chartData} />
        </section>

        {/* 인기 상품 섹션 */}
        <section className="products-section">
          <div className="section-header">
            <h2 className="section-title">인기 상품 TOP 3</h2>
          </div>
          <div className="products-grid">
            {topProducts.map((product, index) => (
              <ProductCard key={index} rank={index + 1} {...product} />
            ))}
          </div>
        </section>

        {/* 인기 팝업 캠페인 섹션 */}
        <section className="popup-section">
          <div className="section-header">
            <h2 className="section-title">인기 팝업 캠페인</h2>
          </div>
          <div className="popup-grid">
            {popularPopups.map((popup, index) => (
              <PopupCard key={index} {...popup} />
            ))}
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
