'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PopupCreateModal from '../../../components/PopupCreateModal';
import './popups.css';

export default function PopupsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  // 팝업 통계 데이터
  const stats = [
    { label: '진행중 팝업', value: '3', unit: '개', color: '#ea580c' },
    { label: '예정된 팝업', value: '2', unit: '개', color: '#3b82f6' },
    { label: '총 매출', value: '₩12.5M', unit: '', color: '#10b981' }
  ];

  // 팝업 데이터
  const [popups, setPopups] = useState([
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
      color: '#ea580c'
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
      color: '#3b82f6'
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
      color: '#8b5cf6'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleCreatePopup = (popupData) => {
    const newPopup = {
      ...popupData,
      id: Date.now(),
      totalSales: 0,
      dailyVisitors: 0,
      productCount: 0,
      status: new Date(popupData.startDate) > new Date() ? 'planned' : 'active'
    };
    setPopups(prev => [newPopup, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeletePopup = (popupId) => {
    if (confirm('정말로 이 팝업을 삭제하시겠습니까?')) {
      setPopups(prev => prev.filter(p => p.id !== popupId));
    }
  };

  const handleEditPopup = (popup) => {
    setEditingPopup(popup);
    setShowEditModal(true);
  };

  const handleUpdatePopup = (updatedPopup) => {
    setPopups(prev => prev.map(popup =>
      popup.id === updatedPopup.id ? updatedPopup : popup
    ));
    setShowEditModal(false);
    setEditingPopup(null);
  };

  const handleViewDetails = (popup) => {
    router.push(`/manager/popups/${popup.id}`);
  };

  const filteredPopups = selectedStatus === 'all'
    ? popups
    : popups.filter(popup => popup.status === selectedStatus);

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
        {/* 헤더 */}
        <header className="popups-header">
          <div className="header-content">
            <h1 className="page-title">팝업 관리</h1>
            <p className="page-subtitle">팝업 스토어 현황을 관리하세요</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="add-popup-btn"
          >
            팝업 추가
          </button>
        </header>

        {/* 팝업 목록 */}
        <section className="popups-content">
          <h2 className="section-title">팝업 목록</h2>
          <div className="popups-list">
            {filteredPopups.map(popup => (
              <div
                key={popup.id}
                className="popup-item"
                onClick={() => handleViewDetails(popup)}
              >
                <div className="popup-left">
                  <div className="popup-name">{popup.name}</div>
                  <div className="popup-location">{popup.location}</div>
                </div>
                <div className="popup-right">
                  <span className={`popup-status ${popup.status}`}>
                    {popup.status === 'active' ? '운영중' :
                     popup.status === 'scheduled' ? '예정' : '완료'}
                  </span>
                  <div className="popup-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPopup(popup);
                      }}
                    >
                      편집
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePopup(popup.id);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 팝업 생성 모달 */}
        {showCreateModal && (
          <PopupCreateModal
            onSave={handleCreatePopup}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        {/* 팝업 수정 모달 */}
        {showEditModal && editingPopup && (
          <PopupCreateModal
            onSave={handleUpdatePopup}
            onCancel={() => {
              setShowEditModal(false);
              setEditingPopup(null);
            }}
            editData={editingPopup}
          />
        )}
      </main>
    </div>
  );
}