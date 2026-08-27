#!/usr/bin/env bash
set -e

# ==============================================================================
# KỊCH BẢN KHỞI ĐỘNG LOYALTY SERVICE ON-PREMISE (JDK 17 NATIVE)
# Máy chủ đích: 10.228.37.65 (Tài khoản: mascom)
# ==============================================================================

APP_DIR="/u01/mascom/loyalty"
JAVA_BIN="/u01/mascom/build/jdk17/bin/java"
JAR_FILE="$APP_DIR/bin/loyalty-service.jar"
CONFIG_FILE="$APP_DIR/config/application-onprem.yml"
LOG_DIR="$APP_DIR/logs"
LOG_FILE="$LOG_DIR/app.log"
PID_FILE="$APP_DIR/scripts/app.pid"

mkdir -p "$LOG_DIR" "$APP_DIR/scripts"

if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "[CẢNH BÁO] Loyalty Service đang chạy với PID: $(cat "$PID_FILE")"
    exit 0
fi

# Fallback kiểm tra nếu PID file bị mất
OLD_PID=$(pgrep -f "$JAR_FILE" || true)
if [ -n "$OLD_PID" ]; then
    echo "[CẢNH BÁO] Tìm thấy tiến trình cũ đang chạy PID: $OLD_PID. Đang ghi lại PID file..."
    echo "$OLD_PID" > "$PID_FILE"
    exit 0
fi

echo "[START] Đang khởi động Loyalty Service với JDK 17..."
JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+ExitOnOutOfMemoryError"

cd "$APP_DIR"
nohup "$JAVA_BIN" $JAVA_OPTS \
    -Dspring.config.additional-location="file:$CONFIG_FILE" \
    -jar "$JAR_FILE" >> "$LOG_FILE" 2>&1 &

PID=$!
echo "$PID" > "$PID_FILE"
echo "[START] Khởi động thành công với PID: $PID"
echo "[START] Theo dõi nhật ký: tail -f $LOG_FILE"
