'use client';

import CustomerItem from './CustomerItem';
import './CustomerList.css';

export default function CustomerList({ customers, onContact, onViewDetails, onBlacklist }) {
  if (customers.length === 0) {
    return (
      <div className="empty-customers">
        <div className="empty-icon">👥</div>
        <h3 className="empty-title">고객이 없습니다</h3>
        <p className="empty-description">검색 조건에 맞는 고객이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="customer-list">
      {customers.map(customer => (
        <CustomerItem
          key={customer.id}
          customer={customer}
          onContact={onContact}
          onViewDetails={onViewDetails}
          onBlacklist={onBlacklist}
        />
      ))}
    </div>
  );
}