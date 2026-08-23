#!/usr/bin/env bash
# ==============================================================================
# Smart-OTP Full Stack Deployment Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOY_DIR"

echo "================================================================="
echo "🚀 [1/4] Starting Smart-OTP Full Stack Deployment..."
echo "================================================================="

if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        echo "⚠️ .env not found. Creating from .env.production.example..."
        cp .env.production.example .env
    else
        echo "❌ Error: .env file missing!"
        exit 1
    fi
fi

# Create persistent storage directories
echo "📁 [2/4] Ensuring persistent data directories exist..."
mkdir -p ./data/postgres ./data/redis ./data/logs/nginx ./data/backups

# Start Containers
echo "🐳 [3/4] Starting Docker Compose Stack..."
docker compose -p smart-otp up -d --build --remove-orphans

# Wait and Reload Nginx Gateway for updated container IPs
echo "🔄 Reloading Nginx Gateway to refresh upstream IPs..."
sleep 5
docker compose -p smart-otp restart nginx || docker exec smart-otp-nginx-gateway nginx -s reload || true

# Health Check
echo "🔍 [4/4] Verifying System Health (waiting up to 45s for Spring Boot contexts)..."
sleep 25
if [ -f "$SCRIPT_DIR/check_health.sh" ]; then
    bash "$SCRIPT_DIR/check_health.sh" 18090 || {
        echo "⏳ Retrying health check in 20s..."
        sleep 20
        docker exec smart-otp-nginx-gateway nginx -s reload || true
        bash "$SCRIPT_DIR/check_health.sh" 18090
    }
fi

echo "================================================================="
echo "✅ Smart-OTP Deployment Completed Successfully!"
echo "🌐 Gateway URL: http://localhost:18090"
echo "================================================================="

if [ -f "$SCRIPT_DIR/notify_telegram.sh" ]; then
    bash "$SCRIPT_DIR/notify_telegram.sh" "🚀 <b>Smart-OTP Full Stack Deploy Thành Công!</b>\nGateway: <code>http://210.211.102.99:18090</code>" "SUCCESS" || true
fi
