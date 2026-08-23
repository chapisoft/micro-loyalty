#!/usr/bin/env bash
set -e

# ==============================================================================
# SCRIPT CÀI ĐẶT ON-PREMISE VÍ NATCASH
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=============================================================================="
echo " [INSTALL-NATCASH] Bắt đầu cài đặt hệ thống Loyalty On-Premise Ví Natcash..."
echo " Thư mục đích: $DIR"
echo "=============================================================================="

if ! command -v docker &> /dev/null; then
    echo "[LỖI] Máy chủ chưa cài đặt Docker. Vui lòng cài Docker 20.10+ trước."
    exit 1
fi

if [ ! -f .env ]; then
    echo "[INFO] Khởi tạo .env từ mẫu .env.example..."
    cp .env.example .env || true
fi

chmod -R 755 config/ locales/

echo "[INSTALL-NATCASH] Cài đặt hoàn tất! Sử dụng ./scripts/start.sh để khởi chạy."
