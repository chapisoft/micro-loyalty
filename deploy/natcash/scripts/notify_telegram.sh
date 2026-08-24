#!/usr/bin/env bash
# ==============================================================================
# Telegram Alerting & Notification Script — Micro-Loyalty (Natcash On-Premise)
# Usage: ./scripts/notify_telegram.sh "MESSAGE_TEXT" [STATUS_TYPE: SUCCESS|FAILED|WARNING|INFO]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$DEPLOY_DIR/.env" ]; then
    export $(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' "$DEPLOY_DIR/.env" | xargs) 2>/dev/null || true
elif [ -f "$DEPLOY_DIR/../../.env" ]; then
    export $(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' "$DEPLOY_DIR/../../.env" | xargs) 2>/dev/null || true
fi

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8694821173:AAFJ3XlvDpYRywzEiB54RSNjAdS62XPKZXA}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:--5397937309}"

MESSAGE="${1:-Thông báo từ hệ thống Natcash Loyalty}"
STATUS_TYPE="${2:-INFO}"

# Icon mappings
case "$STATUS_TYPE" in
    "SUCCESS")
        ICON="✅"
        HEADER="[NATCASH-LOYALTY] DEPLOYMENT THÀNH CÔNG"
        ;;
    "FAILED")
        ICON="🚨"
        HEADER="[NATCASH-LOYALTY] CẢNH BÁO LỖI / DEPLOY THẤT BẠI"
        ;;
    "WARNING")
        ICON="⚠️"
        HEADER="[NATCASH-LOYALTY] CẢNH BÁO HỆ THỐNG"
        ;;
    *)
        ICON="ℹ️"
        HEADER="[NATCASH-LOYALTY] THÔNG TIN HỆ THỐNG"
        ;;
esac

FORMATTED_TEXT="${ICON} *${HEADER}*
━━━━━━━━━━━━━━━━━━━━
${MESSAGE}
━━━━━━━━━━━━━━━━━━━━
📅 *Thời gian:* $(date '+%Y-%m-%d %H:%M:%S %Z')
🌐 *Máy chủ:* 10.228.37.65 (On-Premise)"

echo "Telegram Message: $FORMATTED_TEXT"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "⚠️ Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID."
    exit 0
fi

# Send via Telegram Bot API with urlencode
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${FORMATTED_TEXT}" \
    -d "parse_mode=Markdown" || echo '{"ok":false,"description":"curl error"}')

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Đã gửi thông báo Telegram thành công!"
else
    echo "⚠️ Phản hồi từ Telegram API: $RESPONSE"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=${FORMATTED_TEXT}" >/dev/null 2>&1 || true
fi
