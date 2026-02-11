'use client';

import './PopupCard.css';

export default function PopupCard({ icon, title, description, ctr }) {
  return (
    <div className="popup-card">
      <div className="popup-icon">
        <span className="icon">{icon}</span>
      </div>
      <div className="popup-info">
        <h4 className="popup-title">{title}</h4>
        <p className="popup-description">{description}</p>
        <div className="popup-ctr">클릭률: {ctr}</div>
      </div>
    </div>
  );
}