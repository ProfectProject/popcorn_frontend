#!/bin/bash

# Build script for popcorn frontend

echo "🚀 Popcorn Frontend Build Script"

# Docker 이미지 빌드
echo "📦 Building Docker image..."
docker build -t popcorn-frontend:latest .

# 빌드 성공 확인
if [ $? -eq 0 ]; then
    echo "✅ Docker image build successful!"
    echo "📋 Image details:"
    docker images popcorn-frontend:latest
else
    echo "❌ Docker image build failed!"
    exit 1
fi

echo "🎉 Build completed successfully!"