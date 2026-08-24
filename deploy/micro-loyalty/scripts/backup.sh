#!/usr/bin/env bash
# ==============================================================================
# KỊCH BẢN TỰ ĐỘNG SAO LƯU CƠ SỞ DỮ LIỆU POSTGRESQL 15 (BACKUP.SH)
# Dự án: Hệ sinh thái Khách hàng thân thiết liên minh micro-loyalty
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/home/dip/micro-loyalty/deploy/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/loyalty_db_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="loyalty-saas-postgres"
DB_NAME="loyalty_db"
DB_USER="loyalty_app"

mkdir -p "${BACKUP_DIR}"

echo "=== [BACKUP-START] Bắt đầu sao lưu cơ sở dữ liệu ${DB_NAME} tại ${TIMESTAMP} ==="

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "=== [BACKUP-SUCCESS] Sao lưu thành công: ${BACKUP_FILE} (Dung lượng: ${FILE_SIZE}) ==="
else
    echo "=== [BACKUP-ERROR] Quá trình sao lưu thất bại hoặc tệp rỗng ==="
    exit 1
fi

# Tự động dọn dẹp các bản sao lưu cũ hơn 14 ngày
find "${BACKUP_DIR}" -name "loyalty_db_*.sql.gz" -type f -mtime +14 -delete
echo "=== [BACKUP-CLEANUP] Đã dọn dẹp các bản sao lưu cũ hơn 14 ngày ==="
