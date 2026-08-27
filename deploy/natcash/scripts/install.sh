#!/usr/bin/env bash
set -e

# ==============================================================================
# KỊCH BẢN THIẾT LẬP CẤU TRÚC VÀ PHÂN QUYỀN TRÊN MÁY CHỦ NATCASH
# ==============================================================================

APP_DIR="/u01/mascom/loyalty"

echo "=============================================================================="
echo " [INSTALL-NATCASH] Bắt đầu thiết lập môi trường On-Premise..."
echo " Thư mục ứng dụng: $APP_DIR"
echo "=============================================================================="

# 1. Tạo cây thư mục chuẩn
mkdir -p "$APP_DIR"/{bin,config,locales,web/cms,web/webview,scripts,logs,backups}

# 2. Phân quyền thực thi
chmod -R 755 "$APP_DIR"
chmod +x "$APP_DIR"/scripts/*.sh 2>/dev/null || true

echo "[INSTALL-NATCASH] Thiết lập cấu trúc thư mục thành công 100%!"
echo "Sử dụng $APP_DIR/scripts/start.sh để khởi động dịch vụ."
