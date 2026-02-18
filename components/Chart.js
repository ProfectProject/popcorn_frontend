'use client';

import { useState, useEffect } from 'react';
import './Chart.css';

export default function Chart({ data }) {
  const [isVisible, setIsVisible] = useState(false);

  const maxValue = Math.max(...data.map(item => item.value), 0);
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  useEffect(() => {
    // 컴포넌트가 마운트되면 애니메이션 시작
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div className="chart-container">
      <div className="chart">
        {data.map((item, index) => (
          <div key={index} className="chart-bar">
            <div className={`bar-value ${isVisible ? 'show' : ''}`} style={{ animationDelay: `${index * 0.2 + 0.3}s` }}>
              ₩{item.value}M
            </div>
            <div
              className={`bar ${isVisible ? 'animate-in' : ''}`}
              style={{
                height: `${(item.value / safeMaxValue) * 100}%`,
                animationDelay: `${index * 0.2}s`
              }}
            />
            <div
              className={`bar-label ${isVisible ? 'fade-in' : ''}`}
              style={{ animationDelay: `${index * 0.2 + 0.5}s` }}
            >
              {item.day}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
