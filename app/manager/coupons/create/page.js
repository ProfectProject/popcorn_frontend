'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import './create-coupon.css';
import {
  activateCoupon,
  clearManagerSession,
  createCoupon,
  getManagerToken,
  getManagerUser
} from '../../../../lib/managerApi';

export default function CreateCouponPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  const [formData, setFormData] = useState({
    name: '',
    discountType: 'percentage', // percentage or amount
    discountValue: '',
    minOrderAmount: '',
    code: '',
    targetType: 'all', // all, specific, new_customers
    description: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const token = getManagerToken();
    if (!token) {
      router.replace('/manager');
      return;
    }

    const savedUser = getManagerUser();
    if (savedUser) {
      setUser({
        name: savedUser.name || savedUser.email || '매니저',
        email: savedUser.email || 'manager@popcorn.kr'
      });
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '쿠폰명을 입력해주세요';
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = '할인 값을 입력해주세요';
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = '할인율은 100%를 초과할 수 없습니다';
    }

    if (!formData.code.trim()) {
      newErrors.code = '쿠폰 코드를 입력해주세요';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = '시작일을 선택해주세요';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = '종료일을 선택해주세요';
    }

    if (formData.validFrom && formData.validUntil && formData.validFrom >= formData.validUntil) {
      newErrors.validUntil = '종료일은 시작일보다 늦어야 합니다';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const targetTypeMap = {
        all: 'ALL_USERS',
        new_customers: 'NEW_USERS',
        specific: 'VIP_USERS'
      };

      const created = await createCoupon({
        name: formData.name,
        description: formData.description || `${formData.code} 쿠폰`,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: (formData.minOrderAmount && Number(formData.minOrderAmount) > 0)
          ? Number(formData.minOrderAmount)
          : null,
        maxDiscountAmount: null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        targetType: targetTypeMap[formData.targetType] || 'ALL_USERS'
      });

      if (formData.isActive && created?.id) {
        try {
          await activateCoupon(created.id);
        } catch (activateError) {
          console.warn('쿠폰 즉시 활성화 실패(생성은 완료):', activateError);
        }
      }

      // 성공 시 쿠폰 관리 페이지로 이동
      router.push('/manager/coupons');
    } catch (error) {
      setSubmitError(error?.message || '쿠폰 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/manager/coupons');
  };

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  return (
    <div className="create-coupon-container">
      <Sidebar user={user} />

      <main className="create-coupon-main">
        {/* 헤더 */}
        <header className="create-coupon-header">
          <div className="header-content">
            <h1 className="page-title">새 쿠폰 생성</h1>
            <p className="page-subtitle">고객을 위한 새로운 쿠폰을 만들어보세요</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </header>

        {/* 쿠폰 생성 폼 */}
        <section className="form-section">
          <div className="form-container">
            <form onSubmit={handleSubmit} className="coupon-form">
              {submitError && (
                <div className="error-alert">{submitError}</div>
              )}

              {/* 기본 정보 */}
              <div className="form-group">
                <h3 className="group-title">기본 정보</h3>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">쿠폰명</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="LOVE50POPCORN"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">쿠폰 코드</label>
                    <div className="code-input-group">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="자동생성 또는 직접입력"
                        className={`form-input ${errors.code ? 'error' : ''}`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={generateCouponCode}
                        className="generate-btn"
                        disabled={isSubmitting}
                      >
                        생성
                      </button>
                    </div>
                    {errors.code && <span className="error-message">{errors.code}</span>}
                  </div>
                </div>
              </div>

              {/* 할인 설정 */}
              <div className="form-group">
                <h3 className="group-title">할인 설정</h3>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">할인 타입</label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="discountType"
                          value="percentage"
                          checked={formData.discountType === 'percentage'}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                        <span className="radio-text">퍼센트 (%)</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="discountType"
                          value="amount"
                          checked={formData.discountType === 'amount'}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                        <span className="radio-text">금액 (원)</span>
                      </label>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      할인 {formData.discountType === 'percentage' ? '율' : '금액'}
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      placeholder={formData.discountType === 'percentage' ? '50' : '5000'}
                      className={`form-input ${errors.discountValue ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.discountValue && <span className="error-message">{errors.discountValue}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">최소 주문금액</label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      value={formData.minOrderAmount}
                      onChange={handleInputChange}
                      placeholder="10000"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">사용 한도</label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      placeholder="100 (빈값시 무제한)"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* 사용 조건 */}
              <div className="form-group">
                <h3 className="group-title">사용 조건</h3>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">사용 대상</label>
                    <select
                      name="targetType"
                      value={formData.targetType}
                      onChange={handleInputChange}
                      className="form-select"
                      disabled={isSubmitting}
                    >
                      <option value="all">전체 고객</option>
                      <option value="new_customers">신규 고객</option>
                      <option value="specific">특정 그룹</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">유효기간 시작</label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                      className={`form-input ${errors.validFrom ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.validFrom && <span className="error-message">{errors.validFrom}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">유효기간 종료</label>
                    <input
                      type="date"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleInputChange}
                      className={`form-input ${errors.validUntil ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.validUntil && <span className="error-message">{errors.validUntil}</span>}
                  </div>
                </div>
              </div>

              {/* 추가 설정 */}
              <div className="form-group">
                <h3 className="group-title">추가 설정</h3>

                <div className="input-group">
                  <label className="input-label">쿠폰 설명</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="모든 스토어 매니저에게 공지"
                    className="form-textarea"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <span className="checkbox-text">쿠폰 즉시 활성화</span>
                  </label>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-btn"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="create-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      생성 중...
                    </>
                  ) : (
                    '쿠폰 생성'
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
