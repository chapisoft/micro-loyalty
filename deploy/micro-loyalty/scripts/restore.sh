#!/usr/bin/env bash
# ==============================================================================
# KỊCH BẢN PHỤC HỒI CƠ SỞ DỮ LIỆU POSTGRESQL 15 (RESTORE.SH)
# Dự án: Hệ sinh thái Khách hàng thân thiết liên minh micro-loyalty
# ==============================================================================

set -e

if [ -z "$1" ]; then
    echo "Sử dụng: bash restore.sh <duong_dan_tep_backup.sql.gz>"
    echo "Ví dụ: bash restore.sh /home/dip/micro-loyalty/deploy/backups/loyalty_db_20260824_160000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="loyalty-saas-postgres"
DB_NAME="loyalty_db"
DB_USER="loyalty_app"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "=== [RESTORE-ERROR] Không tìm thấy tệp sao lưu: ${BACKUP_FILE} ==="
    exit 1
fi

echo "=== [RESTORE-WARNING] Bạn sắp phục hồi cơ sở dữ liệu ${DB_NAME} từ tệp ${BACKUP_FILE} ==="
echo "Dữ liệu hiện tại sẽ bị ghi đè hoàn toàn. Đang tiến hành trong 5 giây..."
sleep 5

echo "=== [RESTORE-START] Đang giải nén và nạp dữ liệu vào ${CONTAINER_NAME}... ==="
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "=== [RESTORE-SUCCESS] Phục hồi cơ sở dữ liệu thành công hoàn toàn! ==="
