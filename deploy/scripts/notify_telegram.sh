#!/usr/bin/env bash
# ==============================================================================
# Telegram Alerting Notification Script
# Usage: ./notify_telegram.sh "Message content" [SUCCESS|ERROR|INFO|WARN]
# ==============================================================================
set -euo pipefail

MESSAGE="${1:-}"
LEVEL="${2:-INFO}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$DEPLOY_DIR/.env" ]; then
    # Load environment variables safely
    export $(grep -v '^#' "$DEPLOY_DIR/.env" | xargs -0 2>/dev/null || grep -v '^#' "$DEPLOY_DIR/.env" | xargs)
fi

TOKEN="${TELEGRAM_BOT_TOKEN:-8694821173:AAFJ3XlvDpYRywzEiB54RSNjAdS62XPKZXA}"
CHAT_ID="${TELEGRAM_CHAT_ID:--5397937309}"

if [ -z "$TOKEN" ] || [ -z "$CHAT_ID" ] || [ -z "$MESSAGE" ]; then
    exit 0
fi

case "$LEVEL" in
    SUCCESS) ICON="✅" ;;
    ERROR)   ICON="🚨" ;;
    WARN)    ICON="⚠️" ;;
    *)       ICON="ℹ️" ;;
esac

TEXT="${ICON} <b>[SMART-OTP MONITOR]</b>%0A${MESSAGE}%0A<i>Time: $(date '+%Y-%m-%d %H:%M:%S')</i>"

curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${TEXT}" \
    -d "parse_mode=HTML" > /dev/null 2>&1 || true
