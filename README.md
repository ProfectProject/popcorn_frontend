# 🍿 Popcorn Frontend

Next.js 기반의 팝콘 프론트엔드 애플리케이션입니다.

## 🚀 시작하기

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Docker 개발 환경

```bash
# 개발용 Docker 환경 실행 (hot reload 지원)
./scripts/dev.sh

# 또는 직접 실행
docker-compose --profile dev up popcorn-dev
```

## 🐳 Docker 빌드 및 배포

### 로컬 빌드

```bash
# Docker 이미지 빌드
./scripts/build.sh

# 또는 직접 빌드
docker build -t popcorn-frontend:latest .

# 빌드된 이미지 실행
docker run -p 3000:3000 popcorn-frontend:latest
```

### Docker Compose 사용

```bash
# 프로덕션 환경 실행
docker-compose up popcorn-frontend

# 백그라운드 실행
docker-compose up -d popcorn-frontend
```

## 🔄 CI/CD 파이프라인

GitHub Actions를 통한 자동 빌드 및 배포가 설정되어 있습니다.

### 필요한 GitHub Secrets

다음 secrets를 GitHub 리포지토리에 설정해주세요:

- `DOCKER_HUB_USERNAME`: Docker Hub 사용자명
- `DOCKER_HUB_ACCESS_TOKEN`: Docker Hub 액세스 토큰

### 파이프라인 동작

- **main** 브랜치에 push하면 자동으로 Docker 이미지가 빌드되고 Docker Hub에 push됩니다
- **PR 생성** 시에는 빌드 테스트만 실행됩니다

### 수동 배포

```bash
# Docker Hub에 이미지 푸시
export DOCKER_HUB_USERNAME=your_username
./scripts/deploy.sh

# 특정 태그로 배포
./scripts/deploy.sh v1.0.0
```

## 🔧 환경 변수 설정

프로덕션 환경에서 필요한 환경 변수들:

```bash
# .env 파일 생성 (예제 파일 참고)
cp .env.example .env

# 필요한 환경 변수 설정
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📁 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
├── scripts/                # 배포 및 빌드 스크립트
├── .github/workflows/      # GitHub Actions CI/CD
├── Dockerfile              # 프로덕션용 Docker 설정
├── Dockerfile.dev          # 개발용 Docker 설정
├── docker-compose.yml      # Docker Compose 설정
└── next.config.js          # Next.js 설정 (standalone 모드)
```

## 🛠️ 사용 가능한 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 실행

./scripts/build.sh   # Docker 이미지 빌드
./scripts/deploy.sh  # Docker Hub에 푸시
./scripts/dev.sh     # Docker 개발 환경 실행
```

## 🔐 보안

- 환경 변수는 `.env` 파일에 저장하고 `.gitignore`에 포함됩니다
- Docker 이미지는 비루트 사용자로 실행됩니다
- 프로덕션 빌드는 standalone 모드로 최적화됩니다
