#!/usr/bin/env bash
# ==============================================================================
# KỊCH BẢN KHỞI ĐỘNG LẠI DỊCH VỤ LOYALTY SERVICE
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== ĐANG KHỞI ĐỘNG LẠI LOYALTY SERVICE ==="
"$DIR/stop.sh"
sleep 2
"$DIR/start.sh"
echo "=== KHỞI ĐỘNG LẠI HOÀN TẤT ==="
