'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import StoreAddModal from '../../../components/StoreAddModal';
import './stores.css';

export default function StoresPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  // 스토어 데이터
  const [stores, setStores] = useState([
    {
      id: 1,
      name: '강남 플래그십 스토어',
      location: '서울시 강남구 테헤란로 123',
      manager: '김매니저',
      phone: '010-1234-5678',
      status: 'active',
      openDate: '2024-01-15',
      area: '120㎡',
      monthlyRent: 5000000,
      currentPopups: 2
    },
    {
      id: 2,
      name: '홍대 트렌드 스토어',
      location: '서울시 마포구 홍익로 45',
      manager: '이매니저',
      phone: '010-2345-6789',
      status: 'maintenance',
      openDate: '2024-02-01',
      area: '80㎡',
      monthlyRent: 3500000,
      currentPopups: 0
    },
    {
      id: 3,
      name: '명동 관광 스토어',
      location: '서울시 중구 명동길 67',
      manager: '박매니저',
      phone: '010-3456-7890',
      status: 'active',
      openDate: '2024-01-10',
      area: '150㎡',
      monthlyRent: 7000000,
      currentPopups: 3
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const handleAddStore = () => {
    setShowAddModal(true);
  };

  const handleCreateStore = (newStore) => {
    setStores(prev => [...prev, newStore]);
    setShowAddModal(false);
  };

  const handleUpdateStore = (updatedStore) => {
    setStores(prev => prev.map(store =>
      store.id === updatedStore.id ? updatedStore : store
    ));
    setShowEditModal(false);
    setEditingStore(null);
  };

  const handleEditStore = (store) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  const handleDeleteStore = (storeId) => {
    if (window.confirm('스토어를 삭제하시겠습니까?')) {
      setStores(prev => prev.filter(store => store.id !== storeId));
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
    router.push('/manager');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '운영중';
      case 'maintenance': return '정비중';
      case 'closed': return '폐점';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="stores-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="stores-main">
        {/* 헤더 */}
        <header className="stores-header">
          <div className="header-content">
            <h1 className="page-title">스토어 관리</h1>
            <p className="page-subtitle">팝업 스토어를 등록하고 관리하세요</p>
          </div>
        </header>

        {/* 스토어 목록 */}
        <section className="stores-content">
          <div className="table-header">
            <h2 className="table-title">등록된 스토어</h2>
            <button
              onClick={handleAddStore}
              className="add-store-btn"
            >
              스토어 추가
            </button>
          </div>

          <div className="stores-table">
            <div className="table-head">
              <div className="table-cell head-cell flex-1">스토어 정보</div>
              <div className="table-cell head-cell fixed-200">위치</div>
              <div className="table-cell head-cell fixed-150">상태</div>
              <div className="table-cell head-cell fixed-100">액션</div>
            </div>

            <div className="table-body">
              {stores.map(store => (
                <div key={store.id} className="table-row">
                  <div className="table-cell body-cell flex-1">
                    <div className="store-info">
                      <div className="store-name">{store.name}</div>
                      <div className="store-details">
                        {store.area} • 담당: {store.manager} • 팝업 {store.currentPopups}개
                      </div>
                    </div>
                  </div>
                  <div className="table-cell body-cell fixed-200">
                    <div className="store-location">{store.location}</div>
                  </div>
                  <div className="table-cell body-cell fixed-150">
                    <span className={`status-badge ${store.status}`}>
                      {getStatusText(store.status)}
                    </span>
                  </div>
                  <div className="table-cell body-cell fixed-100">
                    <div className="store-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditStore(store)}
                        title="편집"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteStore(store.id)}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 스토어 추가 모달 */}
        {showAddModal && (
          <StoreAddModal
            onSave={handleCreateStore}
            onCancel={() => setShowAddModal(false)}
          />
        )}

        {/* 스토어 수정 모달 */}
        {showEditModal && editingStore && (
          <StoreAddModal
            onSave={handleUpdateStore}
            onCancel={() => {
              setShowEditModal(false);
              setEditingStore(null);
            }}
            editData={editingStore}
          />
        )}
      </main>
    </div>
  );
}