'use client';

import { useEffect } from 'react';

function mask(value) {
  if (!value) return '(empty)';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

export default function ClientBootLog() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[BOOT][CLIENT]', {
      origin: window.location.origin,
      href: window.location.href,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '(unset)',
      NEXT_PUBLIC_STORE_API_BASE_URL: process.env.NEXT_PUBLIC_STORE_API_BASE_URL || '(unset)',
      NEXT_PUBLIC_ORDERQUERY_API_BASE_URL: process.env.NEXT_PUBLIC_ORDERQUERY_API_BASE_URL || '(unset)',
      NEXT_PUBLIC_PAYMENT_API_BASE_URL: process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL || '(unset)',
      NEXT_PUBLIC_TOSS_SUCCESS_URL: process.env.NEXT_PUBLIC_TOSS_SUCCESS_URL || '(unset)',
      NEXT_PUBLIC_TOSS_FAIL_URL: process.env.NEXT_PUBLIC_TOSS_FAIL_URL || '(unset)',
      NEXT_PUBLIC_TOSS_CLIENT_KEY: mask(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '')
    });
  }, []);

  return null;
}

