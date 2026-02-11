'use client';

import ProductItem from './ProductItem';
import './ProductList.css';

export default function ProductList({ products, onEdit, onDelete, onProductClick }) {
  if (products.length === 0) {
    return (
      <div className="empty-products">
        <div className="empty-icon">📦</div>
        <h3 className="empty-title">등록된 상품이 없습니다</h3>
        <p className="empty-description">새로운 팝콘 상품을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="product-grid">
        {products.map(product => (
          <ProductItem
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onProductClick={onProductClick}
          />
        ))}
      </div>
    </div>
  );
}