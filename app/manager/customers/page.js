'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import CustomerStats from '../../../components/CustomerStats';
import CustomerList from '../../../components/CustomerList';
import BlacklistModal from '../../../components/BlacklistModal';
import './customers.css';

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  // 고객 통계 데이터
  const stats = [
    { label: '전체 고객', value: '2,341', change: '+18%', color: '#ea580c' },
    { label: '활성 회원', value: '1,847', change: '이번달', color: '#3b82f6' },
    { label: '신규 가입', value: '324', change: '이번달', color: '#10b981' }
  ];

  // 고객 데이터
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: '김고객',
      email: 'kim.customer@email.com',
      phone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      joinDate: '2024-01-10',
      totalOrders: 15,
      totalSpent: 187500,
      tier: 'Active',
      avatar: '👤',
      avatarColor: '#ea580c'
    },
    {
      id: 2,
      name: '이고객',
      email: 'lee.customer@email.com',
      phone: '010-2345-6789',
      address: '서울시 서초구 반포대로 456',
      joinDate: '2024-01-15',
      totalOrders: 8,
      totalSpent: 96000,
      tier: 'Active',
      avatar: '👤',
      avatarColor: '#3b82f6'
    },
    {
      id: 3,
      name: '박고객',
      email: 'park.customer@email.com',
      phone: '010-3456-7890',
      address: '경기도 성남시 분당구 정자일로 789',
      joinDate: '2024-01-08',
      totalOrders: 22,
      totalSpent: 264000,
      tier: 'Active',
      avatar: '👤',
      avatarColor: '#8b5cf6'
    },
    {
      id: 4,
      name: '최고객',
      email: 'choi.customer@email.com',
      phone: '010-4567-8901',
      address: '인천시 연수구 컨벤시아대로 321',
      joinDate: '2024-01-20',
      totalOrders: 3,
      totalSpent: 36000,
      tier: 'New',
      avatar: '👤',
      avatarColor: '#f59e0b'
    },
    {
      id: 5,
      name: '정고객',
      email: 'jung.customer@email.com',
      phone: '010-5678-9012',
      address: '대전시 유성구 대학로 654',
      joinDate: '2024-01-05',
      totalOrders: 12,
      totalSpent: 144000,
      tier: 'Active',
      avatar: '👤',
      avatarColor: '#ef4444'
    }
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);

  const handleContact = (customer) => {
    console.log('연락하기:', customer);
    // TODO: 연락 기능 구현
  };

  const handleViewDetails = (customer) => {
    console.log('상세보기:', customer);
    // TODO: 상세보기 모달 또는 페이지
  };

  const handleBlacklist = (customer) => {
    setSelectedCustomer(customer);
    setShowBlacklistModal(true);
  };

  const handleBlacklistSave = (updatedCustomer) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === updatedCustomer.id ? updatedCustomer : c
      )
    );
    setShowBlacklistModal(false);
    setSelectedCustomer(null);
  };

  const handleBlacklistCancel = () => {
    setShowBlacklistModal(false);
    setSelectedCustomer(null);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
    router.push('/manager');
  };

  return (
    <div className="customers-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="customers-main">
        {/* 헤더 */}
        <header className="customers-header">
          <div className="header-content">
            <h1 className="page-title">고객 관리</h1>
            <p className="page-subtitle">회원 정보 및 구매 이력 관리</p>
          </div>
        </header>

        {/* 통계 카드 */}
        <section className="stats-section">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-title">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change">{stat.change}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 고객 목록 */}
        <section className="customers-list-section">
          <h2 className="section-title">고객 목록</h2>

          <div className="customers-simple-list">
            {customers.map(customer => (
              <div key={customer.id} className="customer-simple-item">
                <div className="customer-left-section">
                  <div
                    className="customer-simple-avatar"
                    style={{ backgroundColor: customer.avatarColor }}
                  >
                    {customer.name.charAt(0)}
                  </div>
                  <div className="customer-simple-details">
                    <div className="customer-simple-name">{customer.name}</div>
                    <div className="customer-simple-email">
                      {customer.email} • 총 구매: {customer.totalOrders}회 (₩{new Intl.NumberFormat('ko-KR').format(customer.totalSpent)})
                    </div>
                  </div>
                </div>

                <div className="customer-right-section">
                  <span className={`status-label ${customer.tier.toLowerCase()}`}>
                    {customer.tier === 'New' ? '신규' : '활성'}
                  </span>
                  <button
                    className="blacklist-btn"
                    onClick={() => handleBlacklist(customer)}
                  >
                    블랙리스트
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 블랙리스트 모달 */}
        {showBlacklistModal && selectedCustomer && (
          <BlacklistModal
            customer={selectedCustomer}
            onSave={handleBlacklistSave}
            onCancel={handleBlacklistCancel}
          />
        )}
      </main>
    </div>
  );
}