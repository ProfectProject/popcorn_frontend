'use client';

import { useState } from 'react';
import './OrderDetailModal.css';

const statusConfig = {
  pending: { label: '주문대기', color: '#f59e0b', bgColor: '#fef3c7' },
  shipping: { label: '배송중', color: '#3b82f6', bgColor: '#dbeafe' },
  completed: { label: '배송완료', color: '#10b981', bgColor: '#d1fae5' }
};

export default function OrderDetailModal({ order, onClose, onStatusChange }) {
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [deliveryMemo, setDeliveryMemo] = useState('');

  const status = statusConfig[order.status] || statusConfig.pending;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = () => {
    if (selectedStatus !== order.status) {
      onStatusChange(order.id, selectedStatus);
      onClose();
    }
  };

  const handleCall = () => {
    if (!order.phone || order.phone === '-') return;
    window.open(`tel:${order.phone}`);
  };

  const getItemPrice = (item) => {
    // 상품별 가격 (실제로는 API에서 가져와야 함)
    const prices = {
      '카라멜 팝콘': 3900,
      '치즈 팝콘': 4200,
      '초콜릿 팝콘': 4500
    };

    const match = item.match(/(.+)\s+x(\d+)/);
    if (match) {
      const [, productName, quantity] = match;
      const price = prices[productName] || 4000;
      return price * parseInt(quantity);
    }
    return 0;
  };

  return (
    <div className="order-detail-overlay" onClick={onClose}>
      <div className="order-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="order-detail-header">
          <div className="header-info">
            <h2 className="order-detail-title">주문 상세</h2>
            <span className="order-id">{order.id}</span>
          </div>
          <button onClick={onClose} className="order-detail-close">×</button>
        </div>

        <div className="order-detail-body">
          {/* 고객 정보 */}
          <div className="detail-section">
            <h3 className="section-title">고객 정보</h3>
            <div className="customer-info-card">
              <div className="customer-avatar">
                {order.customerName.charAt(0)}
              </div>
              <div className="customer-details">
                <div className="customer-name">{order.customerName}</div>
                <div className="customer-contact">
                  <span>📞 {order.phone}</span>
                  <button onClick={handleCall} className="call-btn">통화하기</button>
                </div>
              </div>
            </div>
          </div>

          {/* 주문 상품 */}
          <div className="detail-section">
            <h3 className="section-title">주문 상품</h3>
            <div className="products-list">
              {order.products.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-info">
                    <span className="product-name">{product}</span>
                  </div>
                  <div className="product-price">
                    ₩{formatAmount(getItemPrice(product))}
                  </div>
                </div>
              ))}
            </div>
            <div className="order-summary">
              <div className="summary-row">
                <span>상품 금액</span>
                <span>₩{formatAmount(order.totalAmount - 3000)}</span>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <span>₩3,000</span>
              </div>
              <div className="summary-row total">
                <span>총 주문금액</span>
                <span>₩{formatAmount(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 주문 상태 */}
          <div className="detail-section">
            <h3 className="section-title">주문 상태</h3>
            <div className="status-info">
              <div className="current-status">
                <span>현재 상태:</span>
                <span
                  className="status-badge"
                  style={{
                    color: status.color,
                    backgroundColor: status.bgColor
                  }}
                >
                  {status.label}
                </span>
              </div>
              <div className="order-date">
                <span>주문일시:</span>
                <span>{formatDate(order.orderDate)}</span>
              </div>
            </div>

            {/* 상태 변경 */}
            <div className="status-change">
              <label className="status-label">상태 변경:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="status-select"
              >
                <option value="pending">주문대기</option>
                <option value="shipping">배송중</option>
                <option value="completed">배송완료</option>
              </select>
            </div>
          </div>

          {/* 배송 메모 */}
          <div className="detail-section">
            <h3 className="section-title">배송 메모</h3>
            <textarea
              value={deliveryMemo}
              onChange={(e) => setDeliveryMemo(e.target.value)}
              placeholder="배송 관련 메모를 입력하세요..."
              className="delivery-memo"
              rows={3}
            />
          </div>
        </div>

        <div className="order-detail-actions">
          <button onClick={onClose} className="cancel-btn">
            닫기
          </button>
          {selectedStatus !== order.status && (
            <button onClick={handleStatusUpdate} className="update-btn">
              상태 업데이트
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
