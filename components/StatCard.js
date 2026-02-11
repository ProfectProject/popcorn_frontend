'use client';

import './StatCard.css';

export default function StatCard({ title, value, change, positive }) {
  return (
    <div className="stat-card">
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
          <span className="change-icon">
            {positive ? '↗' : '↘'}
          </span>
          <span className="change-text">{change}</span>
        </div>
      </div>
    </div>
  );
}