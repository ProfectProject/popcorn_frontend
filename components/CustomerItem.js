'use client';

import './CustomerItem.css';

const tierConfig = {
  VIP: { label: 'VIP', color: '#dc2626', bgColor: '#fee2e2' },
  Regular: { label: '일반', color: '#3b82f6', bgColor: '#dbeafe' },
  New: { label: '신규', color: '#10b981', bgColor: '#d1fae5' }
};

export default function CustomerItem({ customer, onContact, onViewDetails, onBlacklist }) {
  const tier = tierConfig[customer.tier] || tierConfig.Regular;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAverageOrderAmount = () => {
    if (customer.totalOrders === 0) return 0;
    return Math.round(customer.totalSpent / customer.totalOrders);
  };

  return (
    <div className="customer-item">
      <div className="customer-header">
        <div className="customer-profile">
          <div
            className="customer-avatar"
            style={{ backgroundColor: customer.avatarColor }}
          >
            <span className="avatar-text">{customer.name.charAt(0)}</span>
          </div>
          <div className="customer-info">
            <h3 className="customer-name">{customer.name}</h3>
            <div className="customer-contact">
              <span className="customer-email">📧 {customer.email}</span>
              <span className="customer-phone">📞 {customer.phone}</span>
            </div>
          </div>
        </div>

        <div className="customer-tier">
          <span
            className="tier-badge"
            style={{
              color: tier.color,
              backgroundColor: tier.bgColor
            }}
          >
            {tier.label}
          </span>
        </div>
      </div>

      <div className="customer-content">
        <div className="customer-address">
          <span className="address-icon">📍</span>
          <span className="address-text">{customer.address}</span>
        </div>

        <div className="customer-stats">
          <div className="stat-item">
            <span className="stat-label">가입일</span>
            <span className="stat-value">{formatDate(customer.joinDate)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">총 주문</span>
            <span className="stat-value">{customer.totalOrders}회</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">총 결제</span>
            <span className="stat-value">₩{formatAmount(customer.totalSpent)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">평균 주문</span>
            <span className="stat-value">₩{formatAmount(getAverageOrderAmount())}</span>
          </div>
        </div>
      </div>

      <div className="customer-actions">
        <button
          onClick={() => onContact(customer)}
          className="action-btn contact-btn"
          title="고객 연락"
        >
          📞 연락
        </button>
        <button
          onClick={() => onViewDetails(customer)}
          className="action-btn details-btn"
          title="상세 정보"
        >
          📋 상세
        </button>
        <button
          onClick={() => onBlacklist(customer)}
          className={`action-btn blacklist-btn ${customer.isBlacklisted ? 'blacklisted' : ''}`}
          title={customer.isBlacklisted ? '블랙리스트 해제' : '블랙리스트 등록'}
        >
          {customer.isBlacklisted ? '⚠️ 해제' : '🚫 차단'}
        </button>
      </div>
    </div>
  );
}