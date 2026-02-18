'use client';

import { useEffect, useMemo, useState } from 'react';
import './PopupStatusModal.css';

const STATUS_OPTIONS = [
  {
    value: 'planned',
    label: '예정',
    description: '오픈 전 준비 상태입니다.'
  },
  {
    value: 'active',
    label: '운영중',
    description: '고객이 이용 가능한 상태입니다.'
  },
  {
    value: 'completed',
    label: '완료',
    description: '운영 종료 상태입니다.'
  }
];

export default function PopupStatusModal({ popup, isSaving = false, onSave, onCancel }) {
  const [selectedStatus, setSelectedStatus] = useState(popup?.status || 'planned');

  useEffect(() => {
    setSelectedStatus(popup?.status || 'planned');
  }, [popup?.id, popup?.status]);

  const hasChanged = useMemo(() => selectedStatus !== popup?.status, [popup?.status, selectedStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!popup?.id || !hasChanged || isSaving) return;
    onSave(selectedStatus);
  };

  if (!popup) return null;

  return (
    <div className="popup-status-modal-overlay" onClick={() => !isSaving && onCancel()}>
      <div className="popup-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="popup-status-modal-header">
          <h2 className="popup-status-modal-title">팝업 상태 변경</h2>
          <button
            type="button"
            className="popup-status-modal-close"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="상태 변경 모달 닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="popup-status-modal-body">
          <p className="popup-status-modal-name">{popup.name}</p>

          <div className="popup-status-option-list">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="popup-status-option">
                <input
                  type="radio"
                  name="popupStatus"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isSaving}
                />
                <span className="popup-status-option-label">{option.label}</span>
                <span className="popup-status-option-description">{option.description}</span>
              </label>
            ))}
          </div>

          <div className="popup-status-modal-actions">
            <button
              type="button"
              className="popup-status-cancel-btn"
              onClick={onCancel}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="submit"
              className="popup-status-save-btn"
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
