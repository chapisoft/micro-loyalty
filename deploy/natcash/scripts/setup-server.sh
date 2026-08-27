#!/usr/bin/env bash
set -e

# ==============================================================================
# SCRIPT TỰ ĐỘNG KHỞI TẠO HẠ TẦNG VÀ CƠ SỞ DỮ LIỆU ON-PREMISE TRÊN SERVER
# Chạy trên máy chủ 10.228.37.65 với tài khoản mascom
# ==============================================================================

echo "=============================================================================="
echo " [SETUP-SERVER] Bắt đầu khởi tạo môi trường Loyalty On-Premise trên server..."
echo "=============================================================================="

# 1. Tạo cây thư mục ứng dụng
echo "[1/4] Tạo cây thư mục ứng dụng tại /u01/mascom/loyalty/..."
mkdir -p /u01/mascom/loyalty/{bin,config,locales,web/cms,web/webview,scripts,logs,backups}
chmod -R 755 /u01/mascom/loyalty

# 2. Khởi tạo dữ liệu PostgreSQL nếu chưa có
echo "[2/4] Kiểm tra và khởi tạo cơ sở dữ liệu PostgreSQL..."
POSTGRE_BIN="/u01/mascom/build/postgre/bin"
POSTGRE_DATA="/u01/mascom/build/postgre/data"
POSTGRE_LOGS="/u01/mascom/build/postgre/logs"

mkdir -p "$POSTGRE_LOGS"

if [ ! -f "$POSTGRE_DATA/PG_VERSION" ]; then
    echo " -> Khởi tạo cluster dữ liệu PostgreSQL tại $POSTGRE_DATA..."
    $POSTGRE_BIN/initdb -D "$POSTGRE_DATA" -E UTF8 --locale=en_US.UTF-8
fi

# 3. Khởi động PostgreSQL
echo "[3/4] Khởi động PostgreSQL..."
if ! $POSTGRE_BIN/pg_isready -h 127.0.0.1 -p 5432 &>/dev/null; then
    $POSTGRE_BIN/pg_ctl -D "$POSTGRE_DATA" -l "$POSTGRE_LOGS/postgres.log" start
    sleep 2
fi

# 4. Tạo User & Database natcash_loyalty_db
echo "[4/4] Tạo User natcash_loyalty và Database natcash_loyalty_db..."
$POSTGRE_BIN/psql -h 127.0.0.1 -p 5432 -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='natcash_loyalty'" | grep -q 1 || \
$POSTGRE_BIN/psql -h 127.0.0.1 -p 5432 -U $(whoami) -d postgres -c "CREATE USER natcash_loyalty WITH PASSWORD 'Natcash\$SecureDB2026!';"

$POSTGRE_BIN/psql -h 127.0.0.1 -p 5432 -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='natcash_loyalty_db'" | grep -q 1 || \
$POSTGRE_BIN/psql -h 127.0.0.1 -p 5432 -U $(whoami) -d postgres -c "CREATE DATABASE natcash_loyalty_db OWNER natcash_loyalty ENCODING 'UTF8';"

echo "=============================================================================="
echo " [SETUP-SERVER] Khởi tạo hạ tầng thành công 100%!"
echo " Tiếp theo: Đẩy các file mã nguồn và cấu hình theo deploy-guild.md để chạy."
echo "=============================================================================="
