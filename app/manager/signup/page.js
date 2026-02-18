'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../manager.css';
import {
  createStore,
  loginManager,
  signupManager
} from '../../../lib/managerApi';

export default function ManagerSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호를 다시 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.storeName.trim()) {
      newErrors.storeName = '매장명을 입력해주세요';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요';
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
      await signupManager({
        email: formData.email,
        password: formData.password,
        passwordCheck: formData.confirmPassword,
        name: formData.name,
        phone: formData.phone,
        role: 'OWNER'
      });

      await loginManager({
        email: formData.email,
        password: formData.password
      });

      try {
        await createStore(formData.storeName.trim());
      } catch (storeError) {
        console.error('초기 스토어 생성 실패:', storeError);
      }

      router.push('/manager/dashboard');
    } catch (error) {
      setSubmitError(error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="manager-login-container">
      {/* 왼쪽 브랜딩 영역 */}
      <div className="brand-section">
        <div className="brand-content">
          <div className="brand-icon">
            <div className="popcorn-icon">🍿</div>
          </div>
          <h1 className="brand-title">팝콘 팝업 스토어</h1>
          <p className="brand-description">
            팝업 스토어 관리 시스템
          </p>
        </div>
      </div>

      {/* 오른쪽 회원가입 폼 영역 */}
      <div className="form-section">
        <div className="form-container signup-form">
          <div className="form-header">
            <h2 className="form-title">매니저 회원가입</h2>
            <p className="form-subtitle">팝업스토어 관리를 시작하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {submitError && (
              <div className="error-alert">
                {submitError}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="name" className="input-label">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="홍길동"
                className={`form-input ${errors.name ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="manager@popcorn.kr"
                className={`form-input ${errors.email ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="storeName" className="input-label">매장명</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                placeholder="팝콘 팝업스토어 강남점"
                className={`form-input ${errors.storeName ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.storeName && <span className="error-message">{errors.storeName}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="phone" className="input-label">연락처</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="010-1234-5678"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                className={`form-input ${errors.password ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="비밀번호를 다시 입력하세요"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" className="checkbox" disabled={isSubmitting} required />
                <span className="checkbox-text">
                  <Link href="#" className="terms-link">이용약관</Link> 및 <Link href="#" className="terms-link">개인정보처리방침</Link>에 동의합니다
                </span>
              </label>
            </div>

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="form-footer">
            <p className="footer-text">
              이미 계정이 있으신가요? <Link href="/manager" className="signup-link">로그인하기</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
