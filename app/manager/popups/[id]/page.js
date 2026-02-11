'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import './popup-detail.css';

export default function PopupDetailPage({ params }) {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  const [popup, setPopup] = useState(null);
  const [settings, setSettings] = useState({
    autoNotification: true,
    emailAlerts: false
  });

  // 팝업 데이터 (팝업 관리 페이지와 동일한 데이터)
  const allPopups = [
    {
      id: 1,
      name: '여름 시즌 팝업',
      location: '서울시 강남구 테헤란로 123',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      status: 'active',
      totalSales: 4200000,
      dailyVisitors: 150,
      productCount: 8,
      image: '🌞',
      color: '#ea580c',
      description: '여름 시즌을 맞이하여 특별히 기획된 팝업 스토어입니다.',
      manager: '김매니저',
      phone: '010-1234-5678'
    },
    {
      id: 2,
      name: '대학교 축제 팝업',
      location: '서울시 관악구 서울대학교',
      startDate: '2024-05-15',
      endDate: '2024-05-17',
      status: 'completed',
      totalSales: 890000,
      dailyVisitors: 200,
      productCount: 6,
      image: '🎓',
      color: '#3b82f6',
      description: '대학교 축제 기간 동안 운영된 팝업 스토어입니다.',
      manager: '이매니저',
      phone: '010-2345-6789'
    },
    {
      id: 3,
      name: '쇼핑몰 팝업',
      location: '경기도 성남시 분당구 정자동',
      startDate: '2024-07-01',
      endDate: '2024-07-15',
      status: 'planned',
      totalSales: 0,
      dailyVisitors: 0,
      productCount: 10,
      image: '🛍️',
      color: '#8b5cf6',
      description: '쇼핑몰에서 진행되는 특별 팝업 이벤트입니다.',
      manager: '박매니저',
      phone: '010-3456-7890'
    }
  ];

  useEffect(() => {
    const popupId = parseInt(params.id);
    const foundPopup = allPopups.find(p => p.id === popupId);
    setPopup(foundPopup);
  }, [params.id]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
    router.push('/manager');
  };

  const handleBackToList = () => {
    router.push('/manager/popups');
  };

  const handleSettingToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (!popup) {
    return (
      <div className="popup-detail-container">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="popup-detail-main">
          <div className="loading">팝업 정보를 불러오는 중...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="popup-detail-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="popup-detail-main">
        {/* 헤더 */}
        <header className="popup-detail-header">
          <div className="header-left">
            <button onClick={handleBackToList} className="back-btn">
              ← 팝업 목록으로
            </button>
            <div className="header-content">
              <h1 className="page-title">{popup.name}</h1>
              <p className="page-subtitle">{popup.description}</p>
            </div>
          </div>
          <div className="popup-status-large">
            <span className={`status-badge-large ${popup.status}`}>
              {popup.status === 'active' ? '운영중' :
               popup.status === 'planned' ? '예정' : '완료'}
            </span>
          </div>
        </header>

        {/* 기본 정보 카드 */}
        <section className="popup-info-card">
          <div className="info-header">
            <div className="popup-icon" style={{ backgroundColor: popup.color }}>
              {popup.image}
            </div>
            <div className="info-details">
              <h2 className="info-title">기본 정보</h2>
              <p className="info-subtitle">팝업 스토어 세부사항</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">위치</span>
              <span className="info-value">{popup.location}</span>
            </div>
            <div className="info-item">
              <span className="info-label">운영기간</span>
              <span className="info-value">{popup.startDate} ~ {popup.endDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label">담당자</span>
              <span className="info-value">{popup.manager}</span>
            </div>
            <div className="info-item">
              <span className="info-label">연락처</span>
              <span className="info-value">{popup.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">총 매출</span>
              <span className="info-value">₩{new Intl.NumberFormat('ko-KR').format(popup.totalSales)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">일평균 방문자</span>
              <span className="info-value">{popup.dailyVisitors}명</span>
            </div>
            <div className="info-item">
              <span className="info-label">상품 수</span>
              <span className="info-value">{popup.productCount}개</span>
            </div>
          </div>
        </section>

        {/* 설정 섹션 */}
        <section className="popup-settings-card">
          <h2 className="section-title">일반 설정</h2>

          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-left">
                <div className="setting-name">자동 알림</div>
                <div className="setting-description">팝업 상태 변경 시 자동으로 알림을 받습니다</div>
              </div>
              <div className="setting-toggle">
                <input
                  type="checkbox"
                  id="autoNotification"
                  checked={settings.autoNotification}
                  onChange={() => handleSettingToggle('autoNotification')}
                />
                <label htmlFor="autoNotification" className="toggle-switch"></label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-left">
                <div className="setting-name">이메일 알림</div>
                <div className="setting-description">중요한 업데이트를 이메일로 받습니다</div>
              </div>
              <div className="setting-toggle">
                <input
                  type="checkbox"
                  id="emailAlerts"
                  checked={settings.emailAlerts}
                  onChange={() => handleSettingToggle('emailAlerts')}
                />
                <label htmlFor="emailAlerts" className="toggle-switch"></label>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}