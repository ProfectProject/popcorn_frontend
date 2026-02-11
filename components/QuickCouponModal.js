'use client';

import { useState } from 'react';
import './QuickCouponModal.css';

export default function QuickCouponModal({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    code: '',
    discountValue: '',
    validUntil: '',
    usageLimit: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = '쿠폰 코드를 입력해주세요';
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = '할인 값을 입력해주세요';
    }

    if (formData.discountValue > 100) {
      newErrors.discountValue = '할인율은 100%를 초과할 수 없습니다';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = '만료일을 선택해주세요';
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
      ...formData,
      discountType: 'percentage',
      discountValue: Number(formData.discountValue),
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      validFrom: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="quick-modal-overlay" onClick={onCancel}>
      <div className="quick-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quick-modal-header">
          <h2 className="quick-modal-title">새 쿠폰 등록</h2>
          <button onClick={onCancel} className="quick-modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="quick-coupon-form">
          {/* 쿠폰 코드 */}
          <div className="form-group">
            <label className="form-label">쿠폰 코드</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="SUMMER2024"
              className={`form-input ${errors.code ? 'error' : ''}`}
            />
            {errors.code && <span className="error-message">{errors.code}</span>}
          </div>

          {/* 할인율 */}
          <div className="form-group">
            <label className="form-label">할인율 (%)</label>
            <input
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleInputChange}
              placeholder="20"
              min="1"
              max="100"
              className={`form-input ${errors.discountValue ? 'error' : ''}`}
            />
            {errors.discountValue && <span className="error-message">{errors.discountValue}</span>}
          </div>

          {/* 만료일 */}
          <div className="form-group">
            <label className="form-label">만료일</label>
            <input
              type="date"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleInputChange}
              className={`form-input ${errors.validUntil ? 'error' : ''}`}
            />
            {errors.validUntil && <span className="error-message">{errors.validUntil}</span>}
          </div>

          {/* 최대 사용 가능 횟수 */}
          <div className="form-group">
            <label className="form-label">최대 사용 가능 횟수</label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleInputChange}
              placeholder="100"
              className="form-input"
            />
            <span className="form-hint">빈값으로 두면 무제한으로 설정됩니다</span>
          </div>

          {/* 액션 버튼 */}
          <div className="quick-modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              취소
            </button>
            <button type="submit" className="register-btn">
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}