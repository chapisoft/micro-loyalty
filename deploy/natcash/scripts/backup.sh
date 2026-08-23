#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

BACKUP_DIR="$DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/natcash_loyalty_db_$TIMESTAMP.sql.gz"

echo "=============================================================================="
echo " [BACKUP-NATCASH] Sao lưu cơ sở dữ liệu PostgreSQL Natcash Loyalty..."
echo " Tệp sao lưu: $BACKUP_FILE"
echo "=============================================================================="

docker exec -t loyalty-natcash-postgres pg_dump -U natcash_loyalty natcash_loyalty_db | gzip > "$BACKUP_FILE"

echo "[BACKUP-NATCASH] Sao lưu hoàn tất thành công!"
ls -lh "$BACKUP_FILE"
