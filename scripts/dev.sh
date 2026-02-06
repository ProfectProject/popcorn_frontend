#!/bin/bash

# Development script for popcorn frontend

echo "🛠️  Popcorn Frontend Development Script"

# Docker Compose로 개발 환경 실행
echo "🚀 Starting development environment..."

# 개발 환경 실행
docker-compose --profile dev up popcorn-dev

echo "🎉 Development server is now running at http://localhost:3001"