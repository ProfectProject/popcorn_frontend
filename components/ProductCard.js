'use client';

import './ProductCard.css';

export default function ProductCard({ rank, name, sales, revenue, trend }) {
  const isPositive = trend.startsWith('+');

  return (
    <div className="product-card">
      <div className="product-rank">#{rank}</div>
      <div className="product-info">
        <h4 className="product-name">{name}</h4>
        <div className="product-stats">
          <div className="product-sales">{sales}</div>
          <div className="product-revenue">{revenue}</div>
        </div>
        <div className={`product-trend ${isPositive ? 'positive' : 'negative'}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}