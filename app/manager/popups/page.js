'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PopupCreateModal from '../../../components/PopupCreateModal';
import PopupStatusModal from '../../../components/PopupStatusModal';
import './popups.css';
import {
  clearManagerSession,
  createPopup,
  deletePopup,
  getManagerToken,
  getManagerUser,
  getSelectedStoreId,
  listPopups,
  listStores,
  mapPopupToUi,
  setSelectedPopupId,
  setSelectedStoreId as saveSelectedStoreId,
  updatePopup,
  updatePopupStatus as updatePopupStatusApi
} from '../../../lib/managerApi';

export default function PopupsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [popups, setPopups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTargetPopup, setStatusTargetPopup] = useState(null);

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

    const loadStores = async () => {
      setError('');
      setIsLoading(true);

      try {
        const storeList = await listStores();
        setStores(storeList);

        if (!storeList.length) {
          setSelectedStoreId('');
          setPopups([]);
          return;
        }

        const savedStoreId = getSelectedStoreId();
        const hasSavedStore = savedStoreId && storeList.some((store) => store.id === savedStoreId);
        const targetStoreId = hasSavedStore ? savedStoreId : storeList[0].id;

        setSelectedStoreId(targetStoreId);
        saveSelectedStoreId(targetStoreId);
      } catch (loadError) {
        setError(loadError?.message || '스토어 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStores();
  }, [router]);

  useEffect(() => {
    if (!selectedStoreId) return;

    const loadPopupsByStore = async () => {
      setError('');
      setIsLoading(true);

      try {
        const popupList = await listPopups(selectedStoreId, { page: 1, size: 100 });
        setPopups((prev) => {
          const prevById = new Map(prev.map((item) => [item.id, item]));
          return popupList.map((item) => mapPopupToUi(item, prevById.get(item.popupId)));
        });
      } catch (loadError) {
        setError(loadError?.message || '팝업 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPopupsByStore();
  }, [selectedStoreId]);

  const refreshPopups = async () => {
    if (!selectedStoreId) return;
    const popupList = await listPopups(selectedStoreId, { page: 1, size: 100 });
    setPopups((prev) => {
      const prevById = new Map(prev.map((item) => [item.id, item]));
      return popupList.map((item) => mapPopupToUi(item, prevById.get(item.popupId)));
    });
  };

  const handleCreatePopup = async (popupData) => {
    if (!selectedStoreId) {
      setError('스토어를 먼저 선택해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await createPopup(selectedStoreId, popupData);
      await refreshPopups();
      setShowCreateModal(false);
    } catch (saveError) {
      setError(saveError?.message || '팝업 생성에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePopup = async (popupId) => {
    if (confirm('정말로 이 팝업을 삭제하시겠습니까?')) {
      setError('');
      try {
        await deletePopup(popupId);
        setPopups(prev => prev.filter(p => p.id !== popupId));
      } catch (deleteError) {
        setError(deleteError?.message || '팝업 삭제에 실패했습니다.');
      }
    }
  };

  const handleEditPopup = (popup) => {
    setEditingPopup(popup);
    setShowEditModal(true);
  };

  const handleOpenStatusModal = (popup) => {
    setStatusTargetPopup(popup);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusTargetPopup(null);
  };

  const handleUpdatePopup = async (updatedPopup) => {
    setIsSaving(true);
    setError('');

    try {
      await updatePopup(updatedPopup.id, updatedPopup);
      await refreshPopups();
      setShowEditModal(false);
      setEditingPopup(null);
    } catch (updateError) {
      setError(updateError?.message || '팝업 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePopupStatus = async (nextStatus) => {
    if (!statusTargetPopup?.id) return;

    setIsSaving(true);
    setError('');

    try {
      await updatePopupStatusApi(statusTargetPopup.id, nextStatus);
      await refreshPopups();
      closeStatusModal();
    } catch (updateError) {
      setError(updateError?.message || '팝업 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDetails = (popup) => {
    setSelectedPopupId(popup.id);
    router.push(`/manager/popups/${popup.id}`);
  };

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  const handleStoreChange = (e) => {
    const nextStoreId = e.target.value;
    setSelectedStoreId(nextStoreId);
    saveSelectedStoreId(nextStoreId);
  };

  const getPopupStatusText = (status) => {
    if (status === 'active') return '운영중';
    if (status === 'planned') return '예정';
    return '완료';
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
            {stores.length > 0 && (
              <select value={selectedStoreId} onChange={handleStoreChange} className="status-filter-select">
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="add-popup-btn"
            disabled={!selectedStoreId || isSaving}
          >
            팝업 추가
          </button>
        </header>

        {error && <div className="error-alert">{error}</div>}

        {!stores.length && !isLoading && !error && (
          <div className="loading">등록된 스토어가 없습니다. 스토어를 먼저 생성해주세요.</div>
        )}

        {isLoading && (
          <div className="loading">팝업 정보를 불러오는 중...</div>
        )}

        {/* 팝업 목록 */}
        {!isLoading && stores.length > 0 && (
          <section className="popups-content">
          <h2 className="section-title">팝업 목록</h2>
          <div className="popups-list">
            {popups.map(popup => (
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
                    {getPopupStatusText(popup.status)}
                  </span>
                  <div className="popup-actions">
                    <button
                      className="action-btn status-btn"
                      disabled={isSaving}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStatusModal(popup);
                      }}
                    >
                      상태
                    </button>
                    <button
                      className="action-btn edit-btn"
                      disabled={isSaving}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPopup(popup);
                      }}
                    >
                      편집
                    </button>
                    <button
                      className="action-btn delete-btn"
                      disabled={isSaving}
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
        )}

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

        {/* 팝업 상태 변경 모달 */}
        {showStatusModal && statusTargetPopup && (
          <PopupStatusModal
            popup={statusTargetPopup}
            isSaving={isSaving}
            onSave={handleUpdatePopupStatus}
            onCancel={closeStatusModal}
          />
        )}
      </main>
    </div>
  );
}
