'use client';

import { useState, useEffect } from 'react';
import './AddProductModal.css';

const productEmojis = ['🍿', '🧀', '🍫', '🍯', '🌶️', '🥨', '🍪', '🥜'];
const productColors = ['#ea580c', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#6366f1', '#84cc16'];

export default function AddProductModal({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '🍿',
    color: '#ea580c'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        image: product.image || '🍿',
        color: product.color || '#ea580c'
      });
    }
  }, [product]);

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
      newErrors.name = '상품명을 입력해주세요';
    }

    if (!formData.description.trim()) {
      newErrors.description = '상품 설명을 입력해주세요';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = '유효한 가격을 입력해주세요';
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = '유효한 재고 수량을 입력해주세요';
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
      price: Number(formData.price),
      stock: Number(formData.stock)
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {product ? '상품 수정' : '새 상품 추가'}
          </h2>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">상품명</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="카라멜 팝콘"
                className={`form-input ${errors.name ? 'error' : ''}`}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

          </div>

          <div className="input-group">
            <label className="input-label">상품 설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="달콤한 카라멜이 코팅된 고급 팝콘"
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              rows={3}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">가격 (원)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="3900"
                className={`form-input ${errors.price ? 'error' : ''}`}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">재고 수량</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="50"
                className={`form-input ${errors.stock ? 'error' : ''}`}
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">상품 아이콘</label>
              <div className="emoji-selector">
                {productEmojis.map(emoji => (
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

            <div className="input-group">
              <label className="input-label">테마 색상</label>
              <div className="color-selector">
                {productColors.map(color => (
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
            <button type="submit" className="save-btn">
              {product ? '수정하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}