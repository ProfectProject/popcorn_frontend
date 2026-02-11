'use client';

import OrderItem from './OrderItem';
import './OrderList.css';

export default function OrderList({ orders, onStatusChange, onViewDetails }) {
  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <div className="empty-icon">📋</div>
        <h3 className="empty-title">주문이 없습니다</h3>
        <p className="empty-description">새로운 주문을 기다리고 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map(order => (
        <OrderItem
          key={order.id}
          order={order}
          onStatusChange={onStatusChange}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}