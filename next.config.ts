/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  // 개발 서버와 프로덕션 빌드가 동일 .next를 공유하면 청크 유실이 간헐적으로 발생할 수 있어 분리한다.
  distDir: isDev ? '.next-dev' : '.next',
  reactStrictMode: false, // 🚨 결제창 중복 실행 방지
  output: 'standalone', // Docker 컨테이너용 standalone 빌드

  // ⚡ Next.js 16 성능 최적화
  // 🔥 React 19 Compiler (자동 메모이제이션) - 더 이상 experimental이 아님
  reactCompiler: true,

  // 최적화된 이미지 빌드 - 더 이상 experimental이 아님
  outputFileTracingRoot: require('path').join(__dirname, '../'),

  // 💾 Turbopack은 Next.js 16에서 기본으로 활성화됨
  turbopack: {},
  devIndicators: false,

  // 📷 이미지 최적화 (Next.js 16 개선된 기본값)
  images: {
    minimumCacheTTL: 3600, // 1시간 캐싱 (4시간에서 줄임)
    formats: ['image/webp', 'image/avif'], // 최신 포맷 지원
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // 더 세밀한 크기 옵션
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 아이콘 크기 복원
    // 외부 이미지 도메인 설정 (필요시 추가)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.example.com',
      },
    ],
  },

  // 🗜️ 압축 최적화
  compress: true,

  // 📦 번들 분석 활성화 (프로덕션)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드 번들 최적화
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // SVG 최적화
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // 🔄 리다이렉트 (기존 유지)
  async redirects() {
    return [
      {
        source: '/payments',
        has: [{ type: 'query', key: 'token' }],
        destination: '/auto-payment?token=:token',
        permanent: false,
      },
    ];
  },

  // 📋 헤더 최적화 (캐싱 개선)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // 🎯 정적 자산 장기 캐싱
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=86400',
          },
        ],
      },
      // 🖼️ 이미지 캐싱
      {
        source: '/:path*.(jpg|jpeg|png|gif|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
