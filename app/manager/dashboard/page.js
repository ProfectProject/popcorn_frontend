'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Chart from '../../../components/Chart';
import ProductCard from '../../../components/ProductCard';
import PopupCard from '../../../components/PopupCard';
import './dashboard.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  // 통계 데이터
  const stats = [
    { title: '오늘 매출', value: '₩2.8M', change: '+12.5%', positive: true },
    { title: '방문자', value: '324', change: '+8.2%', positive: true },
    { title: '주문 건', value: '1,250', change: '-2.4%', positive: false }
  ];

  // 차트 데이터 (주간 매출)
  const chartData = [
    { day: '월', value: 2.1 },
    { day: '화', value: 3.2 },
    { day: '수', value: 2.8 },
    { day: '목', value: 3.5 },
    { day: '금', value: 4.2 }
  ];

  // 인기 상품 TOP 3
  const topProducts = [
    { name: '카라멜 팝콘', sales: '125개', revenue: '₩487,500', trend: '+15%' },
    { name: '치즈 팝콘', sales: '98개', revenue: '₩392,000', trend: '+8%' },
    { name: '초콜릿 팝콘', sales: '87개', revenue: '₹347,300', trend: '+12%' }
  ];

  // 인기 팝업 캠페인
  const popularPopups = [
    {
      icon: '🎉',
      title: '환영 팝업',
      description: '신규 방문자 환영 • 오늘 245회 노출',
      ctr: '34%'
    },
    {
      icon: '💰',
      title: '주말 특가',
      description: '2+1 이벤트 • 오늘 189회 노출',
      ctr: '42%'
    },
    {
      icon: '📢',
      title: '매장 공지',
      description: '영업시간 변경 • 오늘 67회 노출',
      ctr: '78%'
    }
  ];

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
    router.push('/manager');
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
          </div>
        </header>

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
      </main>
    </div>
  );
}