'use client';

import CouponItem from './CouponItem';
import './CouponList.css';

export default function CouponList({ coupons, onDelete, onStatusChange, onEdit }) {
  if (coupons.length === 0) {
    return (
      <div className="empty-coupons">
        <div className="empty-icon">🎫</div>
        <h3 className="empty-title">등록된 쿠폰이 없습니다</h3>
        <p className="empty-description">새로운 할인 쿠폰을 등록해보세요!</p>
      </div>
    );
  }

  return (
    <div className="coupon-list">
      {coupons.map(coupon => (
        <CouponItem
          key={coupon.id}
          coupon={coupon}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
