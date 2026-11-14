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

if [ "$#" -gt 0 ]; then
  echo ">>> Triển khai chọn lọc (Rolling Update --build --no-deps): $*"
  docker compose up -d --build --no-deps "$@"
  if docker ps --format '{{.Names}}' | grep -qx 'loyalty-saas-gateway'; then
    echo ">>> Làm mới DNS upstream trên loyalty-saas-gateway (nginx -s reload)..."
    docker exec loyalty-saas-gateway nginx -s reload || docker restart loyalty-saas-gateway
  fi
else
  docker compose up -d
fi

echo ""
echo "[START-SAAS] Khởi động thành công!"
docker compose ps
echo ""
echo "Truy cập Gateway SaaS tại: http://localhost:18095"
