'use client';

import { useState } from 'react';
import './QuickCouponModal.css';

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export default function CouponEditModal({ coupon, isSaving, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: coupon.name || '',
    discountType: coupon.discountType || 'percentage',
    discountValue: coupon.discountValue || '',
    minOrderAmount: coupon.minOrderAmount ?? '',
    validFrom: toDateInput(coupon.validFrom),
    validUntil: toDateInput(coupon.validUntil),
    usageLimit: coupon.usageLimit || '',
    targetType: coupon.targetType || 'ALL_USERS'
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = '쿠폰명을 입력해주세요';
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      newErrors.discountValue = '할인 값을 입력해주세요';
    }
    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
      newErrors.discountValue = '할인율은 100%를 초과할 수 없습니다';
    }
    if (!formData.validFrom) {
      newErrors.validFrom = '시작일을 선택해주세요';
    }
    if (!formData.validUntil) {
      newErrors.validUntil = '종료일을 선택해주세요';
    }
    if (formData.validFrom && formData.validUntil && formData.validFrom >= formData.validUntil) {
      newErrors.validUntil = '종료일은 시작일보다 늦어야 합니다';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave({
      name: formData.name,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: (formData.minOrderAmount && Number(formData.minOrderAmount) > 0)
        ? Number(formData.minOrderAmount)
        : null,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      targetType: formData.targetType
    });
  };

  return (
    <div className="quick-modal-overlay" onClick={onCancel}>
      <div className="quick-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quick-modal-header">
          <h2 className="quick-modal-title">쿠폰 수정</h2>
          <button onClick={onCancel} className="quick-modal-close" aria-label="닫기">×</button>
        </div>

        <form onSubmit={handleSubmit} className="quick-coupon-form">
          <div className="quick-form-group">
            <label className="quick-form-label">쿠폰명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`quick-form-input ${errors.name ? 'error' : ''}`}
              disabled={isSaving}
            />
            {errors.name && <span className="quick-error-message">{errors.name}</span>}
          </div>

          <div className="quick-form-group">
            <label className="quick-form-label">할인 타입</label>
            <div className="discount-input-group">
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                placeholder={formData.discountType === 'percentage' ? '50' : '5000'}
                className={`quick-form-input ${errors.discountValue ? 'error' : ''}`}
                disabled={isSaving}
              />
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="discount-type-select"
                disabled={isSaving}
              >
                <option value="percentage">%</option>
                <option value="amount">원</option>
              </select>
            </div>
            {errors.discountValue && <span className="quick-error-message">{errors.discountValue}</span>}
          </div>

          <div className="quick-form-group">
            <label className="quick-form-label">최소 주문금액</label>
            <input
              type="number"
              name="minOrderAmount"
              value={formData.minOrderAmount}
              onChange={handleInputChange}
              placeholder="10000 (빈값시 제한 없음)"
              className="quick-form-input"
              disabled={isSaving}
            />
          </div>

          <div className="quick-form-row">
            <div className="quick-form-group">
              <label className="quick-form-label">시작일</label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                className={`quick-form-input ${errors.validFrom ? 'error' : ''}`}
                disabled={isSaving}
              />
              {errors.validFrom && <span className="quick-error-message">{errors.validFrom}</span>}
            </div>
            <div className="quick-form-group">
              <label className="quick-form-label">종료일</label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                className={`quick-form-input ${errors.validUntil ? 'error' : ''}`}
                disabled={isSaving}
              />
              {errors.validUntil && <span className="quick-error-message">{errors.validUntil}</span>}
            </div>
          </div>

          <div className="quick-form-group">
            <label className="quick-form-label">사용 한도</label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleInputChange}
              placeholder="100 (빈값시 무제한)"
              className="quick-form-input"
              disabled={isSaving}
            />
          </div>

          <div className="quick-modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn" disabled={isSaving}>
              취소
            </button>
            <button type="submit" className="register-btn" disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
