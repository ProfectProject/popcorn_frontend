'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import StoreAddModal from '../../../components/StoreAddModal';
import StoreStatusModal from '../../../components/StoreStatusModal';
import './stores.css';
import {
  clearManagerSession,
  createStore,
  deleteStore,
  getManagerToken,
  getManagerUser,
  listStores,
  mapStoreToUi,
  updateStoreStatus as updateStoreStatusApi,
  updateStore
} from '../../../lib/managerApi';

export default function StoresPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTargetStore, setStatusTargetStore] = useState(null);

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
        setStores((prev) => {
          const prevById = new Map(prev.map((item) => [item.id, item]));
          return storeList.map((item) => mapStoreToUi(item, prevById.get(item.id)));
        });
      } catch (loadError) {
        setError(loadError?.message || '스토어 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoresData();
  }, [router]);

  const handleAddStore = () => {
    setShowAddModal(true);
  };

  const handleCreateStore = async (newStore) => {
    setError('');
    setIsSaving(true);

    try {
      const created = await createStore(newStore.name.trim());
      setStores(prev => [mapStoreToUi(created, newStore), ...prev]);
      setShowAddModal(false);
    } catch (saveError) {
      setError(saveError?.message || '스토어 생성에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStore = async (updatedStore) => {
    setError('');
    setIsSaving(true);

    try {
      const apiUpdated = await updateStore(updatedStore.id, updatedStore.name.trim());
      setStores(prev => prev.map((store) => (
        store.id === updatedStore.id
          ? mapStoreToUi(apiUpdated, { ...store, ...updatedStore })
          : store
      )));
      setShowEditModal(false);
      setEditingStore(null);
    } catch (saveError) {
      setError(saveError?.message || '스토어 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStore = (store) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('스토어를 삭제하시겠습니까?')) {
      setError('');
      try {
        await deleteStore(storeId);
        setStores(prev => prev.filter(store => store.id !== storeId));
      } catch (deleteError) {
        setError(deleteError?.message || '스토어 삭제에 실패했습니다.');
      }
    }
  };

  const handleOpenStatusModal = (store) => {
    setStatusTargetStore(store);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusTargetStore(null);
  };

  const handleUpdateStoreStatus = async (nextStatus) => {
    if (!statusTargetStore?.id) return;

    setError('');
    setIsSaving(true);

    try {
      await updateStoreStatusApi(statusTargetStore.id, nextStatus);
      const storeList = await listStores();
      setStores((prev) => {
        const prevById = new Map(prev.map((item) => [item.id, item]));
        return storeList.map((item) => mapStoreToUi(item, prevById.get(item.id)));
      });
      closeStatusModal();
    } catch (statusError) {
      setError(statusError?.message || '스토어 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '운영중';
      case 'maintenance': return '일시중단';
      case 'suspended': return '일시중단';
      case 'draft': return '임시저장';
      case 'pending': return '승인대기';
      case 'hidden': return '숨김';
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

        {error && <div className="error-alert">{error}</div>}
        {isLoading && <div className="loading">스토어 정보를 불러오는 중...</div>}

        {/* 스토어 목록 */}
        {!isLoading && (
          <section className="stores-content">
          <div className="table-header">
            <h2 className="table-title">등록된 스토어</h2>
            <button
              onClick={handleAddStore}
              className="add-store-btn"
              disabled={isSaving}
            >
              스토어 추가
            </button>
          </div>

          <div className="stores-table">
            <div className="table-head">
              <div className="table-cell head-cell flex-1">스토어 정보</div>
              <div className="table-cell head-cell fixed-200">위치</div>
              <div className="table-cell head-cell fixed-150">상태</div>
              <div className="table-cell head-cell fixed-170">액션</div>
            </div>

            <div className="table-body">
              {stores.map(store => (
                <div key={store.id} className="table-row">
                  <div className="table-cell body-cell flex-1">
                    <div className="store-info">
                      <div className="store-name">{store.name}</div>
                      <div className="store-details">
                        담당: {store.manager} • 팝업 {store.currentPopups}개
                      </div>
                    </div>
                  </div>
                  <div className="table-cell body-cell fixed-200">
                    <div className="store-location">{store.location}</div>
                  </div>
                  <div className="table-cell body-cell fixed-150">
                    <span
                      className={`status-badge ${store.status}`}
                      title={store.rawPublishStatus ? `publishStatus: ${store.rawPublishStatus}` : ''}
                    >
                      {getStatusText(store.status)}
                    </span>
                  </div>
                  <div className="table-cell body-cell fixed-170">
                    <div className="store-actions">
                      <button
                        className="action-btn status-action-btn"
                        disabled={isSaving}
                        onClick={() => handleOpenStatusModal(store)}
                        title="상태 변경"
                      >
                        상태
                      </button>
                      <button
                        className="action-btn edit-btn"
                        disabled={isSaving}
                        onClick={() => handleEditStore(store)}
                        title="편집"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        disabled={isSaving}
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
        )}

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

        {showStatusModal && (
          <StoreStatusModal
            store={statusTargetStore}
            isSaving={isSaving}
            onSave={handleUpdateStoreStatus}
            onCancel={closeStatusModal}
          />
        )}
      </main>
    </div>
  );
}
