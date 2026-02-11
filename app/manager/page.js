'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './manager.css';

export default function ManagerLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 메시지 제거
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('로그인 시도:', formData);

      // TODO: 실제 로그인 API 호출
      // 현재는 임시로 성공으로 처리
      if (formData.email && formData.password) {
        // 로그인 성공 시 대시보드로 리다이렉트
        await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 효과
        router.push('/manager/dashboard');
      } else {
        setError('이메일과 비밀번호를 입력해주세요');
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      console.error('로그인 에러:', err);
    } finally {
      setIsLoading(false);
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
            프리미엄 수제 팝콘<br />
            팝업 스토어 관리 시스템
          </p>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 영역 */}
      <div className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">매니저 로그인</h2>
            <p className="form-subtitle">관리자 계정으로 로그인하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-alert">
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email" className="input-label">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="manager@popcorn.kr"
                className="form-input"
                disabled={isLoading}
                required
              />
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
                className="form-input"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" className="checkbox" disabled={isLoading} />
                <span className="checkbox-text">로그인 상태 유지</span>
              </label>
              <a href="#" className="forgot-password">비밀번호 찾기</a>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p className="footer-text">
              계정이 없으신가요? <Link href="/manager/signup" className="signup-link">회원가입하기</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}