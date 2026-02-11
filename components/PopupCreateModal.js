'use client';

import { useState } from 'react';
import './PopupCreateModal.css';

const popupEmojis = ['🏪', '🌞', '🎓', '🛍️', '🎪', '🎨', '🍕', '☕'];
const popupColors = ['#ea580c', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#6366f1', '#84cc16'];

export default function PopupCreateModal({ onSave, onCancel, editData = null }) {
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    location: editData?.location || '',
    startDate: editData?.startDate || '',
    endDate: editData?.endDate || '',
    image: editData?.image || '🏪',
    color: editData?.color || '#ea580c'
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '팝업 이름을 입력해주세요';
    }

    if (!formData.location.trim()) {
      newErrors.location = '위치를 입력해주세요';
    }

    if (!formData.startDate) {
      newErrors.startDate = '시작일을 선택해주세요';
    }

    if (!formData.endDate) {
      newErrors.endDate = '종료일을 선택해주세요';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = '종료일은 시작일보다 늦어야 합니다';
      }
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

    const popupData = {
      ...formData,
      id: editData?.id || Date.now(), // 수정 시 기존 ID 유지
      status: editData?.status || 'active'
    };

    onSave(popupData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content popup-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editData ? '팝업 수정' : '새 팝업 생성'}</h2>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="form-group">
            <label className="form-label">팝업 이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="여름 시즌 팝업"
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">위치</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="서울시 강남구"
              className={`form-input ${errors.location ? 'error' : ''}`}
            />
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작일</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`form-input ${errors.startDate ? 'error' : ''}`}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">종료일</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`form-input ${errors.endDate ? 'error' : ''}`}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">팝업 아이콘</label>
              <div className="emoji-selector">
                {popupEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: emoji }))}
                    className={`emoji-option ${formData.image === emoji ? 'selected' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">테마 색상</label>
              <div className="color-selector">
                {popupColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              취소
            </button>
            <button type="submit" className="create-btn">
              {editData ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}