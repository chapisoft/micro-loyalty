#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=============================================================================="
echo " [START-NATCASH] Khởi chạy hệ sinh thái Loyalty On-Premise Ví Natcash..."
echo "=============================================================================="

if [ "$#" -gt 0 ]; then
  echo ">>> Khởi chạy chọn lọc (Rolling Update --build --no-deps): $*"
  docker compose up -d --build --no-deps "$@"
else
  docker compose up -d
fi

echo ""
echo "[START-NATCASH] Dịch vụ đã khởi chạy thành công!"
docker compose ps
