'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import '../popups/popups.css';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState({ // eslint-disable-line no-unused-vars
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
    router.push('/manager');
  };

  return (
    <div className="popups-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="popups-main">
        <header className="popups-header">
          <div className="header-content">
            <h1 className="page-title">팝업 설정</h1>
            <p className="page-subtitle">팝업 스토어 시스템 설정 및 환경설정</p>
          </div>
        </header>

        <section className="popups-content">
          <div className="popups-filters">
            <h2 className="section-title">설정 항목</h2>
          </div>

          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>설정 화면 준비중</h3>
            <p style={{ margin: 0 }}>팝업 스토어 설정 기능이 곧 업데이트될 예정입니다.</p>
          </div>
        </section>
      </main>
    </div>
  );
}