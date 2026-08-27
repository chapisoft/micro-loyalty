#!/usr/bin/env bash
set -e

# ==============================================================================
# KỊCH BẢN TỰ ĐỘNG SAO LƯU DATABASE POSTGRESQL NATIVE (NATCASH_LOYALTY_DB)
# ==============================================================================

APP_DIR="/u01/mascom/loyalty"
POSTGRE_BIN="/u01/mascom/build/postgre/bin"
BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/natcash_loyalty_db_$TIMESTAMP.sql.gz"

echo "=============================================================================="
echo " [BACKUP-NATCASH] Bắt đầu sao lưu cơ sở dữ liệu natcash_loyalty_db..."
echo " Tệp đích: $BACKUP_FILE"
echo "=============================================================================="

PGPASSWORD="Natcash\$SecureDB2026!" "$POSTGRE_BIN/pg_dump" \
    -h 127.0.0.1 \
    -p 5432 \
    -U natcash_loyalty \
    -d natcash_loyalty_db | gzip > "$BACKUP_FILE"

echo "[BACKUP-NATCASH] Sao lưu thành công!"
ls -lh "$BACKUP_FILE"

# Xóa các bản sao lưu cũ quá 30 ngày để tiết kiệm dung lượng đĩa
find "$BACKUP_DIR" -type f -name "natcash_loyalty_db_*.sql.gz" -mtime +30 -delete
echo "[BACKUP-NATCASH] Đã dọn dẹp các tệp sao lưu cũ hơn 30 ngày."
