#!/usr/bin/env bash
# ==============================================================================
# Smart-OTP Single Service Rolling Update Script (Zero Downtime)
# Usage: ./deploy_service.sh <service_name>
# Examples:
#   ./deploy_service.sh authentication-service
#   ./deploy_service.sh customer-service
#   ./deploy_service.sh partner-service
#   ./deploy_service.sh cms-service
#   ./deploy_service.sh cms-admin
#   ./deploy_service.sh sandbox-portal
# ==============================================================================
set -euo pipefail

SERVICE_NAME="${1:-}"

if [ -z "$SERVICE_NAME" ]; then
    echo "❌ Error: Service name required."
    echo "Usage: $0 <service_name>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DEPLOY_DIR"

echo "🔄 Rolling update for service: $SERVICE_NAME..."

# Backup existing JAR if backend
if [[ "$SERVICE_NAME" =~ -service$ ]] && [ -f "backend/${SERVICE_NAME}.jar" ]; then
    echo "📦 Backing up backend/${SERVICE_NAME}.jar to backend/${SERVICE_NAME}.jar.backup..."
    cp "backend/${SERVICE_NAME}.jar" "backend/${SERVICE_NAME}.jar.backup"
fi

# Rebuild and reload container
docker compose -p smart-otp build "$SERVICE_NAME"
docker compose -p smart-otp up -d --no-deps --force-recreate "$SERVICE_NAME"

echo "🔍 Waiting for container to become healthy..."
sleep 5

echo "✅ Service $SERVICE_NAME reloaded successfully!"

if [ -f "$SCRIPT_DIR/notify_telegram.sh" ]; then
    bash "$SCRIPT_DIR/notify_telegram.sh" "🔄 <b>Smart-OTP Service Update:</b> <code>$SERVICE_NAME</code> reloaded successfully." "SUCCESS" || true
fi
