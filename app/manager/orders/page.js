'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import OrderStats from '../../../components/OrderStats';
import OrderList from '../../../components/OrderList';
import OrderDetailModal from '../../../components/OrderDetailModal';
import './orders.css';
import {
  aggregateOrdersFromOrderItems,
  clearManagerSession,
  getDashboardMain,
  getDashboardMainByStore,
  getDashboardOrders,
  getManagerToken,
  getManagerUser,
  isApiError,
  listOrderItems,
  listPopups,
  listStores
} from '../../../lib/managerApi';

function extractDashboardOrderItems(payload) {
  if (Array.isArray(payload)) return payload;

  const directKeys = ['orders', 'items', 'content', 'results', 'orderItems', 'orderSnapshots'];
  for (const key of directKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  const data = payload?.data;
  if (data && typeof data === 'object') {
    for (const key of directKeys) {
      if (Array.isArray(data?.[key])) return data[key];
    }

    const nested = [data.page, data.pageInfo, data.pagination, data.meta];
    for (const container of nested) {
      if (!container || typeof container !== 'object') continue;
      for (const key of directKeys) {
        if (Array.isArray(container?.[key])) return container[key];
      }
    }
  }

  return [];
}

function normalizeDashboardOrderStatus(rawStatus, rawPaymentStatus) {
  const status = String(rawStatus || '').toUpperCase();
  const payment = String(rawPaymentStatus || '').toUpperCase();

  if (status === 'COMPLETED' || status === 'PAID' || payment === 'PAID') return 'completed';
  if (status === 'ACCEPTED' || status === 'RESERVED' || status === 'SHIPPING') return 'shipping';
  if (status === 'REQUESTED' || status === 'PAYMENT_PENDING' || status === 'PENDING') return 'pending';
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'REJECTED' || payment === 'FAILED') return 'pending';
  return 'shipping';
}

function mapDashboardOrdersToUi(orders = []) {
  if (!Array.isArray(orders)) return [];

  return orders
    .map((order, index) => {
      const orderId = order?.orderId ?? order?.id ?? order?.snapshotId ?? null;
      const orderNo = order?.orderNo ?? order?.orderNumber ?? null;
      const amount = Number(
        order?.totalAmount
        ?? order?.paymentAmount
        ?? order?.amount
        ?? order?.linePrice
        ?? 0
      );

      return {
        id: orderNo || String(orderId || `dashboard-order-${index}`),
        orderId: orderId || orderNo || `dashboard-order-${index}`,
        customerId: order?.userId ?? order?.customerId ?? null,
        customerName: order?.customerName || order?.userName || order?.buyerName || '고객',
        products: Array.isArray(order?.products) && order.products.length > 0
          ? order.products.map((p) => String(p?.name || p?.goodsName || p?.title || '상품'))
          : [String(order?.productName || order?.goodsName || order?.orderType || '주문 항목')],
        totalAmount: Number.isFinite(amount) ? amount : 0,
        status: normalizeDashboardOrderStatus(order?.status || order?.orderStatus, order?.paymentStatus),
        rawOrderStatus: order?.orderStatus || order?.status || null,
        rawPaymentStatus: order?.paymentStatus || null,
        orderDate: order?.orderedAt || order?.orderDate || order?.createdAt || null,
        phone: order?.phone || order?.userPhone || order?.customerPhone || '',
        checkedIn: Boolean(order?.checkedIn)
      };
    })
    .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
}

function extractRecentOrdersFromDashboardMain(payload) {
  const data = payload?.data ?? payload;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.recentOrders)) return data.recentOrders;
  if (Array.isArray(data.orders)) return data.orders;
  return [];
}

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreIdState] = useState('all');
  const [popups, setPopups] = useState([]);
  const [selectedPopupId, setSelectedPopupIdState] = useState('all');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalOrders, setServerTotalOrders] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const pageSize = 10;

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
          setSelectedStoreIdState('all');
          setPopups([]);
          setSelectedPopupIdState('all');
          setOrders([]);
          return;
        }
      } catch (loadError) {
        setError(loadError?.message || '스토어 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoresData();
  }, [router]);

  useEffect(() => {
    const loadPopupsByStore = async () => {
      setError('');
      setIsLoading(true);

      try {
        if (selectedStoreId === 'all') {
          // 전체 스토어에서는 팝업 목록 대량 조회를 생략해서 초기 로딩을 빠르게 유지
          setPopups([]);
          if (selectedPopupId !== 'all') {
            setSelectedPopupIdState('all');
          }
          return;
        }

        const popupList = await listPopups(selectedStoreId, { page: 1, size: 100 });
        setPopups(popupList);
        if (!popupList.some((popup) => popup.popupId === selectedPopupId)) {
          setSelectedPopupIdState('all');
        }
      } catch (loadError) {
        setError(loadError?.message || '팝업 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPopupsByStore();
  }, [selectedStoreId, selectedPopupId]);

  useEffect(() => {
    let canceled = false;

    const loadOrdersData = async () => {
      setError('');
      setIsLoading(true);

      try {
        const pageIndex = Math.max(0, currentPage - 1);
        const FETCH_SIZE = 200;
        const orderPage = await getDashboardOrders({
          page: 0,
          size: FETCH_SIZE,
          // popcorn_msa orderquery의 주문 시각 축은 orderedAt 정렬이 가장 일관적이다.
          sortBy: 'orderedAt',
          sortDirection: 'DESC',
          popupId: selectedPopupId === 'all' ? undefined : selectedPopupId
        });
        let items = extractDashboardOrderItems(orderPage);

        console.log('[ORDERS][DASHBOARD_ORDERS][RAW]', {
          selectedStoreId,
          selectedPopupId,
          pageIndex: 0,
          pageSize: FETCH_SIZE,
          received: Array.isArray(items) ? items.length : 0
        });

        if (selectedStoreId !== 'all') {
          items = items.filter((item) => (
            String(item.storeId || item.store_id || item.store?.id || '') === String(selectedStoreId)
          ));
        }
        if (selectedPopupId !== 'all') {
          items = items.filter((item) => (
            String(item.popupId || item.popup_id || item.popup?.id || '') === String(selectedPopupId)
          ));
        }

        console.log('[ORDERS][DASHBOARD_ORDERS][FILTERED]', {
          selectedStoreId,
          selectedPopupId,
          filtered: Array.isArray(items) ? items.length : 0,
          latestCreatedAt: items?.[0]?.createdAt || null,
          latestOrderedAt: items?.[0]?.orderedAt || null,
          latestOrderId: items?.[0]?.orderId || items?.[0]?.id || null
        });

        let mappedOrders = aggregateOrdersFromOrderItems(items);
        if (mappedOrders.length === 0 && items.length > 0) {
          mappedOrders = mapDashboardOrdersToUi(items);
        }
        if (canceled) return;

        // 서버 정렬/페이지 불안정성을 피하기 위해 프론트에서 최신순 + 페이지네이션을 고정한다.
        const sortedOrders = [...mappedOrders].sort((a, b) => {
          const aTime = new Date(a?.orderDate || 0).getTime();
          const bTime = new Date(b?.orderDate || 0).getTime();
          return bTime - aTime;
        });
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        setOrders(sortedOrders.slice(start, end));
        setServerTotalOrders(sortedOrders.length);
        setServerTotalPages(Math.max(1, Math.ceil(sortedOrders.length / pageSize)));
      } catch (loadError) {
        // Fallback for legacy endpoint when a specific store/popup is selected.
        if (selectedStoreId !== 'all' && selectedPopupId !== 'all') {
          try {
            const legacyPage = await listOrderItems(selectedStoreId, selectedPopupId, {
              page: Math.max(0, currentPage - 1),
              size: pageSize
            });
            const legacyItems = legacyPage?.items || legacyPage?.orders || [];
            if (canceled) return;

            const mappedLegacyOrders = aggregateOrdersFromOrderItems(legacyItems);
            setOrders(mappedLegacyOrders);
            setServerTotalOrders(legacyItems.length);
            setServerTotalPages(Math.max(1, Math.ceil(legacyItems.length / pageSize)));
            return;
          } catch (_legacyError) {
            // Continue to regular error handling below.
          }
        }

        // Fallback 2: dashboard main recentOrders (orderquery /dashboard/orders 500 대응)
        try {
          const baseDate = new Date().toISOString().split('T')[0];
          const dashboardMain = selectedStoreId === 'all'
            ? await getDashboardMain(baseDate)
            : await getDashboardMainByStore(selectedStoreId, baseDate);
          const recentOrders = extractRecentOrdersFromDashboardMain(dashboardMain);
          let mappedFallbackOrders = mapDashboardOrdersToUi(recentOrders);

          if (selectedPopupId !== 'all') {
            mappedFallbackOrders = mappedFallbackOrders.filter((order) => {
              const raw = recentOrders.find((item) => (
                String(item?.orderId || item?.id || item?.orderNo || '') === String(order.orderId || order.id)
              ));
              return String(raw?.popupId || raw?.popup_id || raw?.popup?.id || '') === String(selectedPopupId);
            });
          }

          if (mappedFallbackOrders.length > 0) {
            setOrders(mappedFallbackOrders);
            setServerTotalOrders(mappedFallbackOrders.length);
            setServerTotalPages(1);
            return;
          }
        } catch (_dashboardFallbackError) {
          // Continue to regular error handling below.
        }

        if (isApiError(loadError, 404) || isApiError(loadError, 403)) {
          setOrders([]);
          setServerTotalOrders(0);
          setServerTotalPages(1);
        } else {
          setError(loadError?.message || '주문 데이터를 불러오지 못했습니다.');
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    };

    loadOrdersData();

    return () => {
      canceled = true;
    };
  }, [selectedStoreId, selectedPopupId, currentPage]);

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyOrderCount = orders.filter((order) => {
      if (!order.orderDate) return false;
      const ordered = new Date(order.orderDate);
      return ordered >= sevenDaysAgo && ordered <= now;
    }).length;

    const shippingCount = orders.filter((order) => order.status === 'shipping').length;
    const monthlyRevenue = orders.reduce((sum, order) => {
      if (!order.orderDate) return sum;
      const ordered = new Date(order.orderDate);
      if (ordered.getFullYear() === now.getFullYear() && ordered.getMonth() === now.getMonth()) {
        return sum + (order.totalAmount || 0);
      }
      return sum;
    }, 0);

    return [
      { label: '주문 건수(7일)', value: String(weeklyOrderCount), unit: '건', color: '#ea580c' },
      { label: '진행중', value: String(shippingCount), unit: '건', color: '#3b82f6' },
      { label: '총매출(월)', value: String(Math.round(monthlyRevenue / 10000)), unit: '만원', color: '#10b981' }
    ];
  }, [orders]);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);
  const totalPages = Math.max(1, serverTotalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStoreId, selectedPopupId, selectedStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  const handleStoreChange = (e) => {
    const nextStoreId = e.target.value;
    setSelectedStoreIdState(nextStoreId);
    setSelectedPopupIdState('all');
  };

  const handlePopupChange = (e) => {
    const nextPopupId = e.target.value;
    setSelectedPopupIdState(nextPopupId);
  };

  return (
    <div className="orders-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="orders-main">
        {/* 헤더 */}
        <header className="orders-header">
          <div className="header-content">
            <h1 className="page-title">주문 현황</h1>
            <p className="page-subtitle">고객 주문을 관리하고 배송 상태를 업데이트하세요</p>
            {stores.length > 0 && (
              <div className="status-filter" style={{ marginTop: '12px' }}>
                <select value={selectedStoreId} onChange={handleStoreChange} className="filter-btn">
                  <option value="all">전체 스토어</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select value={selectedPopupId} onChange={handlePopupChange} className="filter-btn">
                  <option value="all">전체 팝업</option>
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
        {isLoading && <div className="loading">주문 정보를 불러오는 중...</div>}
        {!isLoading && !error && stores.length === 0 && (
          <div className="loading">등록된 스토어가 없습니다. 스토어를 먼저 생성해주세요.</div>
        )}
        {!isLoading && stores.length > 0 && (
          <>
        {/* 통계 카드 */}
        <section className="stats-section">
          <OrderStats stats={stats} />
        </section>

        {/* 주문 목록 */}
        <section className="orders-content">
          <div className="orders-filters">
            <h2 className="section-title">최근 주문</h2>
            <div className="status-filter">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedStatus('pending')}
                className={`filter-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
              >
                대기중
              </button>
              <button
                onClick={() => setSelectedStatus('shipping')}
                className={`filter-btn ${selectedStatus === 'shipping' ? 'active' : ''}`}
              >
                배송중
              </button>
              <button
                onClick={() => setSelectedStatus('completed')}
                className={`filter-btn ${selectedStatus === 'completed' ? 'active' : ''}`}
              >
                완료
              </button>
            </div>
          </div>

          <OrderList
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onViewDetails={handleViewDetails}
          />

          {orders.length > 0 && (
            <div className="orders-pagination">
              <div className="orders-pagination-summary">
                총 {serverTotalOrders}건 · {currentPage}/{totalPages} 페이지
              </div>
              <div className="orders-pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(
                  Math.max(0, currentPage - 3),
                  Math.max(0, currentPage - 3) + 5
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </section>
          </>
        )}

        {/* 주문 상세 모달 */}
        {showDetailModal && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={handleCloseModal}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
    </div>
  );
}
