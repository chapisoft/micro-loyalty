#!/usr/bin/env bash
# ==============================================================================
# KỊCH BẢN DỪNG DỊCH VỤ LOYALTY SERVICE ON-PREMISE (GRACEFUL SHUTDOWN)
# Máy chủ đích: 10.228.37.65 (Tài khoản: mascom)
# ==============================================================================

APP_DIR="/u01/mascom/loyalty"
PID_FILE="$APP_DIR/scripts/app.pid"
JAR_FILE="$APP_DIR/bin/loyalty-service.jar"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
else
    PID=$(pgrep -f "$JAR_FILE" || true)
fi

if [ -z "$PID" ] || ! kill -0 $PID 2>/dev/null; then
    echo "[INFO] Không tìm thấy tiến trình. Loyalty Service không chạy."
    rm -f "$PID_FILE"
    exit 0
fi

echo "[STOP] Đang gửi tín hiệu dừng êm ái tới PID: $PID..."
kill -15 $PID 2>/dev/null || true

COUNT=0
while kill -0 $PID 2>/dev/null; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge 30 ]; then
        echo "[STOP] Hết thời gian chờ 30s. Bắt buộc dừng tiến trình (kill -9)..."
        kill -9 $PID 2>/dev/null || true
        break
    fi
done

rm -f "$PID_FILE"
echo "[STOP] Loyalty Service đã dừng hoàn toàn."
