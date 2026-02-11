'use client';

import './OrderStats.css';

export default function OrderStats({ stats }) {
  return (
    <div className="order-stats">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <h3 className="stat-label">{stat.label}</h3>
              <div className="stat-number">
                <span className="stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </span>
                <span className="stat-unit">{stat.unit}</span>
              </div>
            </div>
            <div
              className="stat-accent"
              style={{ backgroundColor: stat.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}