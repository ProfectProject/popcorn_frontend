'use client';

import { useState } from 'react';
import './StoreAddModal.css';

export default function StoreAddModal({ onSave, onCancel, editData = null }) {
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    address: editData?.location || '', // location → address 매핑
    detailAddress: editData?.detailAddress || '',
    phone: editData?.phone || '',
    category: editData?.category || '',
    manager: editData?.manager || '', // 기존 데이터에 있는 필드 추가
    openTime: editData?.openTime || '',
    closeTime: editData?.closeTime || '',
    description: editData?.description || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
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
      newErrors.name = '스토어명을 입력해주세요.';
    }

    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!/^0\d{1,2}-\d{3,4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 연락처 형식을 입력해주세요. (예: 02-1234-5678)';
    }

    if (!formData.category.trim()) {
      newErrors.category = '카테고리를 선택해주세요.';
    }

    if (!formData.openTime.trim()) {
      newErrors.openTime = '오픈 시간을 입력해주세요.';
    }

    if (!formData.closeTime.trim()) {
      newErrors.closeTime = '마감 시간을 입력해주세요.';
    }

    if (!formData.manager.trim()) {
      newErrors.manager = '담당자명을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const storeData = {
        id: editData?.id || Date.now(), // 수정 시 기존 ID 유지
        name: formData.name,
        location: formData.address, // address → location 매핑
        manager: formData.manager,
        phone: formData.phone,
        status: editData?.status || 'active',
        openDate: editData?.openDate || new Date().toISOString().split('T')[0],
        currentPopups: editData?.currentPopups || 0,
        // 추가 필드들 (Pencil 디자인용)
        address: formData.address,
        detailAddress: formData.detailAddress,
        category: formData.category,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        description: formData.description
      };

      onSave(storeData);
    }
  };

  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');

    // 다양한 전화번호 형식 지원 (02-1234-5678, 010-1234-5678 등)
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.startsWith('02')) {
      // 서울 지역번호 (02)
      if (numbers.length <= 6) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      } else {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
      }
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formattedPhone
    }));

    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content store-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editData ? '스토어 수정' : '새 스토어 등록'}</h2>
          <button onClick={onCancel} className="modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="store-add-form">
          <div className="form-group">
            <label className="form-label">스토어명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="팝콘 강남점"
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="서울시 강남구 강남대로 94길 15"
              className={`form-input ${errors.address ? 'error' : ''}`}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">상세주소</label>
            <input
              type="text"
              name="detailAddress"
              value={formData.detailAddress}
              onChange={handleChange}
              placeholder="1층 전체"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">연락처</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="02-1234-5678"
              className={`form-input ${errors.phone ? 'error' : ''}`}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">담당자</label>
            <input
              type="text"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              placeholder="김매니저"
              className={`form-input ${errors.manager ? 'error' : ''}`}
            />
            {errors.manager && <span className="error-message">{errors.manager}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">카테고리</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-input ${errors.category ? 'error' : ''}`}
            >
              <option value="">카테고리를 선택하세요</option>
              <option value="음식/베이커리">음식/베이커리</option>
              <option value="패션/의류">패션/의류</option>
              <option value="뷰티/화장품">뷰티/화장품</option>
              <option value="액세서리">액세서리</option>
              <option value="기타">기타</option>
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">오픈 시간</label>
              <input
                type="time"
                name="openTime"
                value={formData.openTime}
                onChange={handleChange}
                className={`form-input ${errors.openTime ? 'error' : ''}`}
              />
              {errors.openTime && <span className="error-message">{errors.openTime}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">마감 시간</label>
              <input
                type="time"
                name="closeTime"
                value={formData.closeTime}
                onChange={handleChange}
                className={`form-input ${errors.closeTime ? 'error' : ''}`}
              />
              {errors.closeTime && <span className="error-message">{errors.closeTime}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">스토어 설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="강남역 인근 프리미엄 팝콘 전문 팝업 스토어입니다."
              rows="3"
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              취소
            </button>
            <button type="submit" className="create-btn">
              {editData ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
