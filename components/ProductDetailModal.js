'use client';

import { useState } from 'react';
import './ProductDetailModal.css';

export default function ProductDetailModal({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    stock: product?.stock || 0,
    image: product?.image || '🍿',
    color: product?.color || '#ea580c'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleSave = () => {
    onSave({ ...product, ...formData });
    setIsEditing(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="product-detail-overlay" onClick={onCancel}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">상품 상세정보</h2>
          <div className="modal-actions">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="edit-mode-btn"
              >
                수정
              </button>
            ) : (
              <div className="edit-actions">
                <button onClick={() => setIsEditing(false)} className="cancel-edit-btn">
                  취소
                </button>
                <button onClick={handleSave} className="save-btn">
                  저장
                </button>
              </div>
            )}
            <button onClick={onCancel} className="close-btn">×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="product-icon-section">
            <div
              className="large-product-icon"
              style={{ backgroundColor: formData.color }}
            >
              <span className="large-emoji">{formData.image}</span>
            </div>
          </div>

          <div className="product-details">
            <div className="detail-row">
              <label className="detail-label">상품명</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="detail-input"
                />
              ) : (
                <span className="detail-value">{product.name}</span>
              )}
            </div>

            <div className="detail-row">
              <label className="detail-label">설명</label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="detail-textarea"
                  rows="2"
                />
              ) : (
                <span className="detail-value">{product.description}</span>
              )}
            </div>

            <div className="detail-row">
              <label className="detail-label">가격</label>
              {isEditing ? (
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="detail-input"
                />
              ) : (
                <span className="detail-value">₩{formatPrice(product.price)}</span>
              )}
            </div>

            <div className="detail-row">
              <label className="detail-label">재고</label>
              {isEditing ? (
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="detail-input"
                />
              ) : (
                <span className={`detail-value ${product.stock <= 20 ? 'low-stock' : ''}`}>
                  {product.stock}개
                </span>
              )}
            </div>


            {isEditing && (
              <>
                <div className="detail-row">
                  <label className="detail-label">이모지</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="detail-input emoji-input"
                    placeholder="🍿"
                  />
                </div>

                <div className="detail-row">
                  <label className="detail-label">색상</label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="detail-color-input"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}