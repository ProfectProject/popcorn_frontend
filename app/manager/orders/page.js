'use client';

import { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import OrderStats from '../../../components/OrderStats';
import OrderList from '../../../components/OrderList';
import OrderDetailModal from '../../../components/OrderDetailModal';
import './orders.css';

export default function OrdersPage() {
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  // 주문 통계 데이터
  const stats = [
    { label: '오늘 주문', value: '24', unit: '건', color: '#ea580c' },
    { label: '배송중', value: '8', unit: '건', color: '#3b82f6' },
    { label: '총매출', value: '312', unit: '만원', color: '#10b981' }
  ];

  // 주문 데이터
  const [orders, setOrders] = useState([
    {
      id: 'ORD-202401001-001',
      customerName: '김고객',
      products: ['카라멜 팝콘 x2', '치즈 팝콘 x1'],
      totalAmount: 12000,
      status: 'completed',
      orderDate: '2024-01-15 14:30',
      phone: '010-1234-5678'
    },
    {
      id: 'ORD-202401001-002',
      customerName: '이고객',
      products: ['초콜릿 팝콘 x1', '카라멜 팝콘 x1'],
      totalAmount: 8400,
      status: 'shipping',
      orderDate: '2024-01-15 13:45',
      phone: '010-2345-6789'
    },
    {
      id: 'ORD-202401001-003',
      customerName: '박고객',
      products: ['치즈 팝콘 x3'],
      totalAmount: 12600,
      status: 'pending',
      orderDate: '2024-01-15 12:15',
      phone: '010-3456-7890'
    },
    {
      id: 'ORD-202401001-004',
      customerName: '최고객',
      products: ['카라멜 팝콘 x1', '초콜릿 팝콘 x2'],
      totalAmount: 13400,
      status: 'completed',
      orderDate: '2024-01-15 11:20',
      phone: '010-4567-8901'
    }
  ]);

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    console.log('로그아웃');
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
          </div>
        </header>

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