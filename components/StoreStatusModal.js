'use client';

import { useEffect, useMemo, useState } from 'react';
import './StoreStatusModal.css';

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: '운영중',
    description: '정상 운영 상태로 노출됩니다.'
  },
  {
    value: 'suspended',
    label: '일시중단',
    description: '일시 중단 상태로 전환됩니다.'
  },
  {
    value: 'draft',
    label: '임시저장',
    description: '작성 중인 상태로 유지합니다.'
  },
  {
    value: 'pending',
    label: '승인대기',
    description: '승인 대기 상태로 표시됩니다.'
  },
  {
    value: 'hidden',
    label: '숨김',
    description: '리스트에서 숨김 처리됩니다.'
  },
  {
    value: 'closed',
    label: '폐점',
    description: '운영 종료 상태로 표시됩니다.'
  }
];

export default function StoreStatusModal({ store, isSaving = false, onSave, onCancel }) {
  const normalizeInitialStatus = (value) => {
    if (!value) return 'suspended';
    if (value === 'maintenance') return 'suspended';
    return value;
  };

  const [selectedStatus, setSelectedStatus] = useState(normalizeInitialStatus(store?.status));

  useEffect(() => {
    setSelectedStatus(normalizeInitialStatus(store?.status));
  }, [store?.id, store?.status]);

  const hasChanged = useMemo(() => selectedStatus !== store?.status, [selectedStatus, store?.status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!store?.id || !hasChanged || isSaving) return;
    onSave(selectedStatus);
  };

  if (!store) return null;

  return (
    <div className="store-status-modal-overlay" onClick={() => !isSaving && onCancel()}>
      <div className="store-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="store-status-modal-header">
          <h2 className="store-status-modal-title">스토어 상태 변경</h2>
          <button
            type="button"
            className="store-status-modal-close"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="스토어 상태 변경 모달 닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="store-status-modal-body">
          <p className="store-status-modal-name">{store.name}</p>

          <div className="store-status-option-list">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="store-status-option">
                <input
                  type="radio"
                  name="storeStatus"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isSaving}
                />
                <span className="store-status-option-label">{option.label}</span>
                <span className="store-status-option-description">{option.description}</span>
              </label>
            ))}
          </div>

          <div className="store-status-modal-actions">
            <button
              type="button"
              className="store-status-cancel-btn"
              onClick={onCancel}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="submit"
              className="store-status-save-btn"
              disabled={!hasChanged || isSaving}
            >
              {isSaving ? '변경 중...' : '상태 변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
