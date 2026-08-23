#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=============================================================================="
echo " [STOP-SAAS] Dừng cụm dịch vụ Loyalty SaaS (micro-loyalty)..."
echo "=============================================================================="

docker compose down

echo "[STOP-SAAS] Đã dừng toàn bộ dịch vụ."
