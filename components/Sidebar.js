'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Sidebar.css';

const menuItems = [
  {
    title: '팝업 스토어',
    items: [
      { icon: '📊', label: '대시보드', href: '/manager/dashboard' },
      { icon: '📦', label: '상품 관리', href: '/manager/products' },
      { icon: '🛒', label: '주문 현황', href: '/manager/orders' }
    ]
  },
  {
    title: '매니저 관리',
    items: [
      { icon: '🏪', label: '팝업 관리', href: '/manager/popups' },
      { icon: '🎫', label: '쿠폰 관리', href: '/manager/coupons' }
    ]
  },
  {
    title: '스토어 관리',
    items: [
      { icon: '🏬', label: '스토어 관리', href: '/manager/stores' }
    ]
  }
];

export default function Sidebar({ user, onLogout }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* 로고 */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-text">POPCORN</span>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="sidebar-nav">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            <h3 className="section-title">{section.title}</h3>
            <ul className="nav-list">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="nav-item">
                  <Link
                    href={item.href}
                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* 사용자 정보 */}
      <div className="sidebar-footer">
        <div className="user-info" onClick={onLogout}>
          <div className="user-avatar">
            {user.name.charAt(0)}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <div className="logout-icon">
            ⬇
          </div>
        </div>
      </div>
    </aside>
  );
}
