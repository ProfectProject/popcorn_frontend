'use client';

import { useEffect, useMemo, useState } from 'react';
import './CouponStatusModal.css';

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: '활성',
    description: '고객이 사용할 수 있는 상태입니다.'
  },
  {
    value: 'disabled',
    label: '비활성',
    description: '쿠폰 신규 사용이 중단됩니다.'
  }
];

export default function CouponStatusModal({ coupon, isSaving = false, onSave, onCancel }) {
  const [selectedStatus, setSelectedStatus] = useState(coupon?.status || 'disabled');

  useEffect(() => {
    setSelectedStatus(coupon?.status || 'disabled');
  }, [coupon?.id, coupon?.status]);

  const hasChanged = useMemo(() => selectedStatus !== coupon?.status, [coupon?.status, selectedStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!coupon?.id || !hasChanged || isSaving) return;
    onSave(selectedStatus);
  };

  if (!coupon) return null;

  return (
    <div className="coupon-status-modal-overlay" onClick={() => !isSaving && onCancel()}>
      <div className="coupon-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="coupon-status-modal-header">
          <h2 className="coupon-status-modal-title">쿠폰 상태 변경</h2>
          <button
            type="button"
            className="coupon-status-modal-close"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="쿠폰 상태 변경 모달 닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="coupon-status-modal-body">
          <p className="coupon-status-modal-name">{coupon.name}</p>
          <p className="coupon-status-modal-code">{coupon.code}</p>

          <div className="coupon-status-option-list">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="coupon-status-option">
                <input
                  type="radio"
                  name="couponStatus"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isSaving}
                />
                <span className="coupon-status-option-label">{option.label}</span>
                <span className="coupon-status-option-description">{option.description}</span>
              </label>
            ))}
          </div>

          <div className="coupon-status-modal-actions">
            <button
              type="button"
              className="coupon-status-cancel-btn"
              onClick={onCancel}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="submit"
              className="coupon-status-save-btn"
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
