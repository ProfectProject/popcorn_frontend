/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  // 개발 서버와 프로덕션 빌드가 동일 .next를 공유하면 청크 유실이 간헐적으로 발생할 수 있어 분리한다.
  distDir: isDev ? '.next-dev' : '.next',
  reactStrictMode: false, // 🚨 결제창 중복 실행 방지
  output: 'standalone', // Docker 컨테이너용 standalone 빌드
  experimental: {
    // 최적화된 이미지 빌드
    outputFileTracingRoot: require('path').join(__dirname, '../'),
  },
  async redirects() {
    return [
      {
        source: '/payments',
        has: [{ type: 'query', key: 'token' }],
        destination: '/auto-payment?token=:token',
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;
