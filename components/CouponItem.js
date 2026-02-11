'use client';

import './CouponItem.css';

const statusConfig = {
  active: { label: '활성', color: '#10b981', bgColor: '#d1fae5' },
  disabled: { label: '비활성', color: '#6b7280', bgColor: '#f3f4f6' },
  expired: { label: '만료', color: '#dc2626', bgColor: '#fee2e2' }
};

export default function CouponItem({ coupon, onDelete, onToggle }) {
  const status = statusConfig[coupon.status] || statusConfig.active;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDiscountDisplay = () => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% 할인`;
    } else {
      return `₩${coupon.discountValue.toLocaleString()} 할인`;
    }
  };

  const getUsagePercentage = () => {
    if (!coupon.usageLimit) return 0;
    return Math.round((coupon.usageCount / coupon.usageLimit) * 100);
  };

  const isExpired = () => {
    return new Date(coupon.validUntil) < new Date();
  };

  return (
    <div className="coupon-item">
      <div className="coupon-header">
        <div className="coupon-info">
          <div className="coupon-code-section">
            <h3 className="coupon-code">{coupon.code}</h3>
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
          <p className="coupon-name">{coupon.name}</p>
        </div>

        <div className="coupon-actions">
          {!isExpired() && (
            <button
              onClick={() => onToggle(coupon.id)}
              className={`action-btn toggle-btn ${coupon.status}`}
              title={coupon.status === 'active' ? '비활성화' : '활성화'}
            >
              {coupon.status === 'active' ? '⏸️' : '▶️'}
            </button>
          )}
          <button
            onClick={() => onDelete(coupon.id)}
            className="action-btn delete-btn"
            title="쿠폰 삭제"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="coupon-content">
        <div className="coupon-details">
          <div className="detail-item">
            <span className="detail-label">할인</span>
            <span className="detail-value discount">{getDiscountDisplay()}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">최소 주문</span>
            <span className="detail-value">
              {coupon.minOrderAmount ? `₩${coupon.minOrderAmount.toLocaleString()}` : '없음'}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">유효기간</span>
            <span className="detail-value">
              {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validUntil)}
            </span>
          </div>
        </div>

        <div className="usage-section">
          <div className="usage-info">
            <span className="usage-text">
              사용: {coupon.usageCount}
              {coupon.usageLimit && ` / ${coupon.usageLimit}`}회
            </span>
            {coupon.usageLimit && (
              <span className="usage-percentage">({getUsagePercentage()}%)</span>
            )}
          </div>

          {coupon.usageLimit && (
            <div className="usage-bar">
              <div
                className="usage-progress"
                style={{
                  width: `${getUsagePercentage()}%`,
                  backgroundColor: getUsagePercentage() > 80 ? '#dc2626' : '#10b981'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}