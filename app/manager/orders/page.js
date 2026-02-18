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
  getDashboardOrders,
  getManagerToken,
  getManagerUser,
  isApiError,
  listOrderItems,
  listPopups,
  listStores
} from '../../../lib/managerApi';

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
        let popupList = [];
        if (selectedStoreId === 'all') {
          const popupResults = await Promise.all(
            stores.map((store) => listPopups(store.id, { page: 1, size: 100 }))
          );
          const popupMap = new Map();
          popupResults.flat().forEach((popup) => {
            if (!popup?.popupId || popupMap.has(popup.popupId)) return;
            popupMap.set(popup.popupId, popup);
          });
          popupList = [...popupMap.values()];
        } else {
          popupList = await listPopups(selectedStoreId, { page: 1, size: 100 });
        }
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
  }, [selectedStoreId, stores, selectedPopupId]);

  useEffect(() => {
    const loadOrdersData = async () => {
      setError('');
      setIsLoading(true);

      try {
        const pageSize = 100;
        let page = 0;
        let hasNext = true;
        const allItems = [];

        while (hasNext) {
          const orderPage = await getDashboardOrders({
            page,
            size: pageSize,
            sortBy: 'orderedAt',
            sortDirection: 'desc'
          });
          const pageItems = orderPage?.orders || orderPage?.items || [];
          allItems.push(...pageItems);
          hasNext = Boolean(orderPage?.pageInfo?.hasNext);
          page += 1;
          if (page > 50) break;
        }

        let items = allItems;

        if (selectedStoreId !== 'all') {
          items = items.filter((item) => String(item.storeId || '') === String(selectedStoreId));
        }
        if (selectedPopupId !== 'all') {
          items = items.filter((item) => String(item.popupId || '') === String(selectedPopupId));
        }

        setOrders(aggregateOrdersFromOrderItems(items));
      } catch (loadError) {
        // Fallback for legacy endpoint when a specific store/popup is selected.
        if (selectedStoreId !== 'all' && selectedPopupId !== 'all') {
          try {
            const legacyPage = await listOrderItems(selectedStoreId, selectedPopupId, { page: 0, size: 200 });
            const legacyItems = legacyPage?.items || legacyPage?.orders || [];
            setOrders(aggregateOrdersFromOrderItems(legacyItems));
            return;
          } catch (_legacyError) {
            // Continue to regular error handling below.
          }
        }

        if (isApiError(loadError, 404) || isApiError(loadError, 403)) {
          setOrders([]);
        } else {
          setError(loadError?.message || '주문 데이터를 불러오지 못했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadOrdersData();
  }, [selectedStoreId, selectedPopupId]);

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
