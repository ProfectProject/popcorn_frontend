'use client';

import './CouponStats.css';

export default function CouponStats({ stats }) {
  return (
    <div className="coupon-stats">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <h3 className="stat-label">{stat.label}</h3>
              <div className="stat-number">
                <span className="stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </span>
                {stat.unit && <span className="stat-unit">{stat.unit}</span>}
              </div>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: stat.color }}
            >
              {index === 0 && '🎫'}
              {index === 1 && '✅'}
              {index === 2 && '💰'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}