'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import CouponStats from '../../../components/CouponStats';
import CouponList from '../../../components/CouponList';
import QuickCouponModal from '../../../components/QuickCouponModal';
import './coupons.css';

export default function CouponsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  // 쿠폰 통계 데이터
  const stats = [
    { label: '활성 쿠폰', value: '8', unit: '개', color: '#10b981' },
    { label: '사용된 쿠폰', value: '342', unit: '개', color: '#3b82f6' },
    { label: '총 할인 혜택', value: '₩2.1M', unit: '', color: '#ea580c' }
  ];

  // 쿠폰 데이터
  const [coupons, setCoupons] = useState([
    {
      id: 1,
      code: 'SUMMER20',
      name: '여름 할인 쿠폰',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 20000,
      validFrom: '2024-01-01',
      validUntil: '2024-06-30',
      usageCount: 156,
      usageLimit: 500,
      status: 'active'
    },
    {
      id: 2,
      code: 'WELCOME15',
      name: '신규 고객 환영',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 15000,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      usageCount: 89,
      usageLimit: 1000,
      status: 'active'
    },
    {
      id: 3,
      code: 'VIP2024',
      name: 'VIP 고객 특별',
      discountType: 'amount',
      discountValue: 5000,
      minOrderAmount: 30000,
      validFrom: '2024-01-01',
      validUntil: '2024-01-31',
      usageCount: 45,
      usageLimit: 100,
      status: 'expired'
    }
  ]);

  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleQuickCoupon = (couponData) => {
    const newCoupon = {
      id: Date.now(),
      ...couponData,
      name: `${couponData.code} 쿠폰`,
      usageCount: 0,
      status: 'active'
    };
    setCoupons(prev => [newCoupon, ...prev]);
    setShowQuickModal(false);
  };

  const handleDeleteCoupon = (couponId) => {
    if (confirm('정말로 이 쿠폰을 삭제하시겠습니까?')) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
  };

  const handleToggleCoupon = (couponId) => {
    setCoupons(prev =>
      prev.map(c =>
        c.id === couponId
          ? { ...c, status: c.status === 'active' ? 'disabled' : 'active' }
          : c
      )
    );
  };

  const filteredCoupons = selectedStatus === 'all'
    ? coupons
    : coupons.filter(coupon => coupon.status === selectedStatus);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
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
          <CouponStats stats={stats} />
        </section>

        {/* 쿠폰 목록 */}
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
            coupons={filteredCoupons}
            onDelete={handleDeleteCoupon}
            onToggle={handleToggleCoupon}
          />
        </section>

        {/* 간단 쿠폰 등록 모달 */}
        {showQuickModal && (
          <QuickCouponModal
            onSave={handleQuickCoupon}
            onCancel={() => setShowQuickModal(false)}
          />
        )}
      </main>
    </div>
  );
}