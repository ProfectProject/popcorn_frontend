'use client';

import StatCard from './StatCard';
import './PopupStats.css';

export default function PopupStats({ stats }) {
  return (
    <div className="popup-stats">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            color={stat.color}
            change={stat.change}
          />
        ))}
      </div>
    </div>
  );
}