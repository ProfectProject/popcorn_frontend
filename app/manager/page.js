'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './manager.css';
import {
  clearManagerSession,
  getManagerToken,
  loginManager
} from '../../lib/managerApi';

const AUTO_LOGIN_STORAGE_KEY = 'manager_auto_login';

export default function ManagerLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [keepLogin, setKeepLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const hasAutoLoginTriedRef = useRef(false);
  const router = useRouter();

  const saveAutoLogin = (credentials) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTO_LOGIN_STORAGE_KEY, JSON.stringify(credentials));
  };

  const clearAutoLogin = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(AUTO_LOGIN_STORAGE_KEY);
  };

  const validateManagerRole = (user) => {
    if (!user?.role || !['OWNER', 'MANAGER'].includes(user.role)) {
      clearManagerSession();
      throw new Error('매니저/오너 권한 계정으로 로그인해주세요.');
    }
  };

  const loginWithCredentials = async (credentials) => {
    const { user } = await loginManager(credentials);
    validateManagerRole(user);
    router.replace('/manager/dashboard');
  };

  useEffect(() => {
    if (getManagerToken()) {
      router.replace('/manager/dashboard');
      return;
    }

    if (hasAutoLoginTriedRef.current || typeof window === 'undefined') return;
    hasAutoLoginTriedRef.current = true;

    const rawSaved = window.localStorage.getItem(AUTO_LOGIN_STORAGE_KEY);
    if (!rawSaved) return;

    let savedCredentials = null;
    try {
      savedCredentials = JSON.parse(rawSaved);
    } catch (_error) {
      clearAutoLogin();
      return;
    }

    const email = savedCredentials?.email?.trim();
    const password = savedCredentials?.password;
    if (!email || !password) {
      clearAutoLogin();
      return;
    }

    setFormData({ email, password });
    setKeepLogin(true);

    (async () => {
      setIsLoading(true);
      setError('');
      try {
        await loginWithCredentials({ email, password });
      } catch (autoLoginError) {
        clearManagerSession();
        clearAutoLogin();
        setError(autoLoginError?.message || '자동 로그인에 실패했습니다. 다시 로그인해주세요.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

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
      await loginWithCredentials(formData);
      if (keepLogin) {
        saveAutoLogin({
          email: formData.email.trim(),
          password: formData.password
        });
      } else {
        clearAutoLogin();
      }
    } catch (err) {
      setError(err?.message || '로그인에 실패했습니다. 다시 시도해주세요.');
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
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={keepLogin}
                  onChange={(e) => setKeepLogin(e.target.checked)}
                  disabled={isLoading}
                />
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
