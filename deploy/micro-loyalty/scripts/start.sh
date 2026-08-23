#!/usr/bin/env bash
set -e

# ==============================================================================
# SCRIPT KHỞI ĐỘNG MÔ HÌNH SAAS (MICRO-LOYALTY)
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=============================================================================="
echo " [START-SAAS] Khởi động cụm dịch vụ Loyalty SaaS Multi-tenant (micro-loyalty)..."
echo " Thư mục làm việc: $DIR"
echo "=============================================================================="

if [ ! -f .env ]; then
  echo "[CẢNH BÁO] Không tìm thấy tệp .env, nạp từ .env.example..."
  cp .env.example .env || true
fi

docker compose up -d

echo ""
echo "[START-SAAS] Khởi động thành công!"
docker compose ps
echo ""
echo "Truy cập Gateway SaaS tại: http://localhost:18090"
