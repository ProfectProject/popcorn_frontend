'use client';

import { useEffect, useMemo, useState } from 'react';
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
  getManagerToken,
  getManagerUser,
  getOrderSummary,
  getSelectedPopupId,
  getSelectedStoreId,
  isApiError,
  listOrderItems,
  listPopups,
  listStores,
  setSelectedPopupId,
  setSelectedStoreId,
  // 📊 새로운 대시보드 API 함수들
  getDashboardMain,
  getDashboardHealth
} from '../../../lib/managerApi';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

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

    const loadStoresData = async () => {
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
    };

    loadStoresData();
  }, [router]);

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
      } finally {
        setIsLoading(false);
      }
    };

    loadPopupsByStore();
  }, [selectedStoreId]);

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
          const orderItemPage = await listOrderItems(selectedStoreId, selectedPopupId, { page: 0, size: 200 });
          orderItems = orderItemPage?.items || [];
        } catch (itemsError) {
          if (!isApiError(itemsError, 404)) {
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

  // 📊 시스템 전체 대시보드 데이터 로드
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
            let mainData;

            // 📊 임시: 전체 통계만 사용 (스토어별 기능 비활성화)
            console.log('📊 전체 대시보드 데이터 로딩');
            mainData = await getDashboardMain(baseDate);

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
  }, []);

  const stats = useMemo(() => {
    // 📊 새로운 대시보드 데이터 사용 (우선순위)
    if (dashboardMain && isDashboardHealthy) {
      return [
        {
          title: '전체 매출',
          value: `₩${new Intl.NumberFormat('ko-KR').format(dashboardMain.totalRevenue || 0)}`,
          change: `평균 ₩${new Intl.NumberFormat('ko-KR').format(Math.round(dashboardMain.averageOrderAmount || 0))}`,
          positive: true
        },
        {
          title: '전체 주문',
          value: `${dashboardMain.totalOrders || 0}건`,
          change: `오늘 ${dashboardMain.todayOrders || 0}건`,
          positive: true
        },
        {
          title: '이번 달',
          value: `${dashboardMain.monthlyOrders || 0}건`,
          change: `₩${new Intl.NumberFormat('ko-KR').format(dashboardMain.monthlyRevenue || 0)}`,
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

    // 🔄 기존 팝업별 데이터 사용 (fallback)
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
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
        value: `₩${new Intl.NumberFormat('ko-KR').format(totalRevenue)}`,
        change: `완료 ${completedCount}건`,
        positive: true
      },
      {
        title: '주문 건수',
        value: `${orders.length}건`,
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
  }, [orders, summary, dashboardMain, isDashboardHealthy]);

  const chartData = useMemo(() => {
    const revenueByDay = new Map();
    orders.forEach((order) => {
      if (!order.orderDate) return;
      const dayLabel = DAY_LABELS[new Date(order.orderDate).getDay()];
      revenueByDay.set(dayLabel, (revenueByDay.get(dayLabel) || 0) + (order.totalAmount || 0));
    });

    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    const mapped = labels.map((label) => ({
      day: label,
      value: Number(((revenueByDay.get(label) || 0) / 1000000).toFixed(1))
    }));

    if (mapped.every((item) => item.value === 0)) {
      return labels.map((label) => ({ day: label, value: 0.1 }));
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
            <p className="page-subtitle">수제 팝콘 팝업스토어 관리 시스템</p>
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
