'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import './popup-detail.css';
import {
  clearManagerSession,
  getManagerToken,
  getManagerUser,
  getPopupDetail,
  listGoods,
  mapPopupDetailToUi,
  setSelectedPopupId
} from '../../../../lib/managerApi';

export default function PopupDetailPage({ params }) {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [popup, setPopup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    autoNotification: true,
    emailAlerts: false
  });

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

    const loadPopupDetail = async () => {
      setIsLoading(true);
      setError('');
      setSelectedPopupId(params.id);

      try {
        const detail = await getPopupDetail(params.id);

        let productCount = 0;
        try {
          const goods = await listGoods(params.id);
          productCount = goods?.items?.length || 0;
        } catch (_goodsError) {
          productCount = 0;
        }

        setPopup(mapPopupDetailToUi(detail, { productCount }));
      } catch (loadError) {
        setError(loadError?.message || '팝업 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPopupDetail();
  }, [params.id, router]);

  const handleLogout = () => {
    clearManagerSession();
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

  if (isLoading) {
    return (
      <div className="popup-detail-container">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="popup-detail-main">
          <div className="loading">팝업 정보를 불러오는 중...</div>
        </main>
      </div>
    );
  }

  if (!popup) {
    return (
      <div className="popup-detail-container">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="popup-detail-main">
          <div className="loading">{error || '팝업 정보를 찾을 수 없습니다.'}</div>
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
