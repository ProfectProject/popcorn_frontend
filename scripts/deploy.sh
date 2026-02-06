#!/bin/bash

# Deploy script for popcorn frontend

echo "🚀 Popcorn Frontend Deploy Script"

# 환경 변수 확인
if [ -z "$DOCKER_HUB_USERNAME" ]; then
    echo "❌ DOCKER_HUB_USERNAME environment variable is not set"
    exit 1
fi

IMAGE_NAME="${DOCKER_HUB_USERNAME}/popcorn-frontend"
TAG=${1:-latest}

echo "📦 Building and pushing Docker image: ${IMAGE_NAME}:${TAG}"

# 이미지 빌드
docker build -t ${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# 이미지 푸시
echo "📤 Pushing image to Docker Hub..."
docker push ${IMAGE_NAME}:${TAG}

if [ $? -eq 0 ]; then
    echo "✅ Push successful!"
    echo "🎉 Image ${IMAGE_NAME}:${TAG} is now available!"
else
    echo "❌ Push failed!"
    exit 1
fi

echo "🎯 Deploy completed successfully!"