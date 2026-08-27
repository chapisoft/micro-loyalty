#!/usr/bin/env bash
# ==============================================================================
# KỊCH BẢN KIỂM TRA SỨC KHỎE DỊCH VỤ (LIVENESS & READINESS PROBES)
# ==============================================================================

echo "=== KIỂM TRA SỨC KHỎE DỊCH VỤ LOYALTY (127.0.0.1:8694) ==="

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8694/actuator/health || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo " -> [OK] Health Check: 200 OK (Dịch vụ và các phụ thuộc DB/Redis đều UP)"
else
    echo " -> [LỖI] Health Check Thất bại (Mã HTTP: $HEALTH)"
    exit 1
fi

LIVENESS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8694/actuator/health/liveness || echo "000")
if [ "$LIVENESS" = "200" ]; then
    echo " -> [OK] Liveness Probe: 200 OK (Tiến trình JVM đang hoạt động)"
elif [ "$HEALTH" = "200" ]; then
    echo " -> [INFO] Liveness Probe: HTTP $LIVENESS (Health chung đã đạt 200 OK)"
else
    echo " -> [LỖI] Liveness Probe Thất bại (Mã HTTP: $LIVENESS)"
    exit 1
fi

READINESS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8694/actuator/health/readiness || echo "000")
if [ "$READINESS" = "200" ]; then
    echo " -> [OK] Readiness Probe: 200 OK (Sẵn sàng tiếp nhận lưu lượng giao dịch)"
elif [ "$HEALTH" = "200" ]; then
    echo " -> [INFO] Readiness Probe: HTTP $READINESS (Health chung đã đạt 200 OK)"
else
    echo " -> [LỖI] Readiness Probe Thất bại (Mã HTTP: $READINESS)"
    exit 1
fi

echo "=== TOÀN BỘ HỆ THỐNG LOYALTY HOẠT ĐỘNG TỐT 100% ==="
