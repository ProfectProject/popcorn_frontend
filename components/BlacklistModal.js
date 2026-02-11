'use client';

import { useState } from 'react';
import './BlacklistModal.css';

const blacklistReasons = [
  '반복적인 주문 취소',
  '욕설 또는 부적절한 언행',
  '배송 관련 허위 신고',
  '결제 관련 문제',
  '리뷰 어뷰징',
  '기타'
];

export default function BlacklistModal({ customer, onSave, onCancel }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const isBlacklisted = customer?.isBlacklisted || false;

  const handleReasonChange = (selectedReason) => {
    setReason(selectedReason);
    if (selectedReason !== '기타') {
      setCustomReason('');
    }

    // 에러 메시지 제거
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isBlacklisted) { // 블랙리스트에 추가하는 경우에만 유효성 검사
      if (!reason) {
        newErrors.reason = '블랙리스트 사유를 선택해주세요';
      }

      if (reason === '기타' && !customReason.trim()) {
        newErrors.customReason = '기타 사유를 입력해주세요';
      }

      if (!description.trim()) {
        newErrors.description = '상세 설명을 입력해주세요';
      }
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const finalReason = reason === '기타' ? customReason : reason;

    onSave({
      ...customer,
      isBlacklisted: !isBlacklisted,
      blacklistReason: !isBlacklisted ? finalReason : null,
      blacklistDescription: !isBlacklisted ? description : null,
      blacklistDate: !isBlacklisted ? new Date().toISOString() : null
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content blacklist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isBlacklisted ? '블랙리스트 해제' : '블랙리스트 등록'}
          </h2>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>

        <div className="blacklist-customer-info">
          <div
            className="customer-avatar"
            style={{ backgroundColor: customer.avatarColor }}
          >
            <span className="avatar-text">{customer.name.charAt(0)}</span>
          </div>
          <div className="customer-details">
            <h3 className="customer-name">{customer.name}</h3>
            <p className="customer-email">{customer.email}</p>
            <p className="customer-phone">{customer.phone}</p>
          </div>
          {isBlacklisted && (
            <div className="blacklist-status">
              <span className="status-badge blacklisted">블랙리스트</span>
            </div>
          )}
        </div>

        {isBlacklisted && (
          <div className="current-blacklist-info">
            <h4>현재 블랙리스트 정보</h4>
            <div className="blacklist-detail">
              <div className="detail-item">
                <span className="detail-label">사유:</span>
                <span className="detail-value">{customer.blacklistReason}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">등록일:</span>
                <span className="detail-value">
                  {new Date(customer.blacklistDate).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {customer.blacklistDescription && (
                <div className="detail-item">
                  <span className="detail-label">설명:</span>
                  <span className="detail-value">{customer.blacklistDescription}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="blacklist-form">
          {!isBlacklisted && (
            <>
              <div className="form-group">
                <label className="form-label">블랙리스트 사유</label>
                <div className="reason-options">
                  {blacklistReasons.map(reasonOption => (
                    <label key={reasonOption} className="reason-option">
                      <input
                        type="radio"
                        name="reason"
                        value={reasonOption}
                        checked={reason === reasonOption}
                        onChange={(e) => handleReasonChange(e.target.value)}
                      />
                      <span className="reason-text">{reasonOption}</span>
                    </label>
                  ))}
                </div>
                {errors.reason && <span className="error-message">{errors.reason}</span>}
              </div>

              {reason === '기타' && (
                <div className="form-group">
                  <label className="form-label">기타 사유</label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="기타 사유를 입력해주세요"
                    className={`form-input ${errors.customReason ? 'error' : ''}`}
                  />
                  {errors.customReason && <span className="error-message">{errors.customReason}</span>}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">상세 설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="블랙리스트 등록 사유에 대한 상세 설명을 입력해주세요"
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  rows={4}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>
            </>
          )}

          {isBlacklisted && (
            <div className="removal-confirmation">
              <p className="confirmation-text">
                <strong>{customer.name}</strong>님을 블랙리스트에서 해제하시겠습니까?
              </p>
              <p className="warning-text">
                해제 후 해당 고객은 다시 정상적인 서비스 이용이 가능합니다.
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              취소
            </button>
            <button
              type="submit"
              className={`submit-btn ${isBlacklisted ? 'remove-btn' : 'add-btn'}`}
            >
              {isBlacklisted ? '해제하기' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}