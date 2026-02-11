'use client';

import './PopupItem.css';

const statusConfig = {
  active: { label: '진행중', color: '#10b981', bgColor: '#d1fae5' },
  planned: { label: '예정', color: '#3b82f6', bgColor: '#dbeafe' },
  completed: { label: '완료', color: '#6b7280', bgColor: '#f3f4f6' }
};

export default function PopupItem({ popup, onEdit, onDelete, onViewDetails }) {
  const status = statusConfig[popup.status] || statusConfig.planned;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(popup.endDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (popup.status === 'completed') return '종료됨';
    if (popup.status === 'planned') return `${Math.ceil((new Date(popup.startDate) - today) / (1000 * 60 * 60 * 24))}일 후 시작`;
    if (diffDays < 0) return '종료됨';
    if (diffDays === 0) return '오늘 종료';
    return `${diffDays}일 남음`;
  };

  return (
    <div className="popup-item">
      <div className="popup-header">
        <div className="popup-icon" style={{ backgroundColor: popup.color }}>
          <span className="popup-emoji">{popup.image}</span>
        </div>

        <div className="popup-status">
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
      </div>

      <div className="popup-content">
        <div className="popup-info">
          <h3 className="popup-name">{popup.name}</h3>
          <p className="popup-location">📍 {popup.location}</p>
          <p className="popup-period">
            📅 {formatDate(popup.startDate)} - {formatDate(popup.endDate)}
          </p>
          <p className="popup-remaining">{getDaysRemaining()}</p>
        </div>

        <div className="popup-stats">
          <div className="stat">
            <span className="stat-label">매출</span>
            <span className="stat-value">₩{formatAmount(popup.totalSales)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">일평균 방문</span>
            <span className="stat-value">{popup.dailyVisitors}명</span>
          </div>
          <div className="stat">
            <span className="stat-label">상품 수</span>
            <span className="stat-value">{popup.productCount}개</span>
          </div>
        </div>
      </div>

      <div className="popup-actions">
        <button
          onClick={() => onViewDetails(popup)}
          className="action-btn details-btn"
          title="상세 정보"
        >
          📊 상세
        </button>
        <button
          onClick={() => onEdit(popup)}
          className="action-btn edit-btn"
          title="수정"
        >
          ✏️ 수정
        </button>
        <button
          onClick={() => onDelete(popup.id)}
          className="action-btn delete-btn"
          title="삭제"
        >
          🗑️ 삭제
        </button>
      </div>
    </div>
  );
}