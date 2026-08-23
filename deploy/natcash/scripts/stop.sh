#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=============================================================================="
echo " [STOP-NATCASH] Dừng cụm dịch vụ Loyalty On-Premise Ví Natcash..."
echo "=============================================================================="

docker compose down

echo "[STOP-NATCASH] Đã dừng toàn bộ dịch vụ."
