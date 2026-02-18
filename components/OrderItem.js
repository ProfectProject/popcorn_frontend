'use client';

import './OrderItem.css';

const statusConfig = {
  pending: { label: '주문대기', color: '#f59e0b', bgColor: '#fef3c7' },
  shipping: { label: '배송중', color: '#3b82f6', bgColor: '#dbeafe' },
  completed: { label: '배송완료', color: '#10b981', bgColor: '#d1fae5' }
};

export default function OrderItem({ order, onStatusChange, onViewDetails }) {
  const status = statusConfig[order.status] || statusConfig.pending;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusClick = () => {
    const statusOptions = ['pending', 'shipping', 'completed'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    onStatusChange(order.id, statusOptions[nextIndex]);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order);
    }
  };

  const handleCall = () => {
    if (!order.phone || order.phone === '-') return;
    window.open(`tel:${order.phone}`);
  };

  return (
    <div className="order-item">
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-id">{order.id}</h3>
          <div className="order-meta">
            <span className="customer-name">{order.customerName}</span>
            <span className="order-date">{formatDate(order.orderDate)}</span>
          </div>
        </div>
        <button
          onClick={handleStatusClick}
          className="status-badge"
          style={{
            color: status.color,
            backgroundColor: status.bgColor
          }}
        >
          {status.label}
        </button>
      </div>

      <div className="order-content">
        <div className="products-info">
          <div className="products-list">
            {order.products.map((product, index) => (
              <span key={index} className="product-item">
                {product}
                {index < order.products.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div className="contact-info">
            📞 {order.phone}
          </div>
        </div>

        <div className="order-amount">
          <span className="amount-label">주문금액</span>
          <span className="amount-value">₩{formatAmount(order.totalAmount)}</span>
        </div>
      </div>

      <div className="order-actions">
        <button onClick={handleViewDetails} className="action-btn detail-btn" title="주문 상세">
          📋
        </button>
        <button onClick={handleCall} className="action-btn call-btn" title="고객 연락">
          📞
        </button>
      </div>
    </div>
  );
}
