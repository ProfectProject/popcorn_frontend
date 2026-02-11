'use client';

import './ProductItem.css';

export default function ProductItem({ product, onEdit, onDelete, onProductClick }) {
  const getStatusBadge = (status, stock) => {
    if (status === 'low_stock' || stock <= 20) {
      return <span className="status-badge low-stock">재고부족</span>;
    }
    return <span className="status-badge active">판매중</span>;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="product-item">
      <div
        className="product-clickable-area"
        onClick={() => onProductClick && onProductClick(product)}
      >
        <div className="product-header">
          <div
            className="product-icon"
            style={{ backgroundColor: product.color }}
          >
            <span className="product-emoji">{product.image}</span>
          </div>
          {getStatusBadge(product.status, product.stock)}
        </div>

        <div className="product-content">
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
          </div>

          <div className="product-stats">
            <div className="stat">
              <span className="stat-label">가격</span>
              <span className="stat-value">₩{formatPrice(product.price)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">재고</span>
              <span className={`stat-value ${product.stock <= 20 ? 'low-stock' : ''}`}>
                {product.stock}개
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="product-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(product);
          }}
          className="action-btn edit-btn"
          title="상품 수정"
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(product.id);
          }}
          className="action-btn delete-btn"
          title="상품 삭제"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}