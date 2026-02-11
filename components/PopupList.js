'use client';

import PopupItem from './PopupItem';
import './PopupList.css';

export default function PopupList({ popups, onEdit, onDelete, onViewDetails }) {
  if (popups.length === 0) {
    return (
      <div className="empty-popups">
        <div className="empty-icon">🏪</div>
        <h3 className="empty-title">팝업이 없습니다</h3>
        <p className="empty-description">새 팝업을 생성하여 운영을 시작해보세요.</p>
      </div>
    );
  }

  return (
    <div className="popup-list">
      {popups.map(popup => (
        <PopupItem
          key={popup.id}
          popup={popup}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}