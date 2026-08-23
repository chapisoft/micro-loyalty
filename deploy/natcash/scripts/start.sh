#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=============================================================================="
echo " [START-NATCASH] Khởi chạy hệ sinh thái Loyalty On-Premise Ví Natcash..."
echo "=============================================================================="

docker compose up -d

echo ""
echo "[START-NATCASH] Dịch vụ đã khởi chạy thành công!"
docker compose ps
