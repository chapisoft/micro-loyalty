#!/usr/bin/env bash
set -e

GATEWAY_PORT="${GATEWAY_HTTP_PORT:-18095}"

echo "=== [HEALTHCHECK-SAAS] KIỂM TRA SỨC KHỎE CỤM MICROSERVICES LOYALTY (PORT $GATEWAY_PORT) ==="

echo -n "0. Kiểm tra API Gateway (/gateway-health): "
curl -s -f "http://127.0.0.1:${GATEWAY_PORT}/gateway-health" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

if command -v docker >/dev/null 2>&1; then
    for entry in \
        "loyalty-saas-cms-service:8081" \
        "loyalty-saas-customer-service:8082" \
        "loyalty-saas-game-service:8083" \
        "loyalty-saas-campaign-service:8084" \
        "loyalty-saas-partner-service:8085"; do
        C_NAME="${entry%%:*}"
        C_PORT="${entry##*:}"
        echo -n "   - Kiểm tra trực tiếp ${C_NAME} (${C_PORT}): "
        docker exec "${C_NAME}" curl -s -f "http://127.0.0.1:${C_PORT}/actuator/health/liveness" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }
    done
fi

echo -n "1. Kiểm tra Liveness qua Gateway: "
curl -s -f "http://127.0.0.1:${GATEWAY_PORT}/actuator/health/liveness" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "2. Kiểm tra Readiness qua Gateway: "
curl -s -f "http://127.0.0.1:${GATEWAY_PORT}/actuator/health/readiness" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "3. Kiểm tra Cổng Quản Trị CMS: "
curl -s -f "http://127.0.0.1:${GATEWAY_PORT}/index.html" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "4. Kiểm tra Cổng Webview GameHub: "
curl -s -f "http://127.0.0.1:${GATEWAY_PORT}/portal/index.html" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "5. Kiểm tra Cổng Đối Tác Partner Portal: "
curl -s -f "http://127.0.0.1:${GATEWAY_PORT}/partner-portal/index.html" > /dev/null && \
curl -s -f -H "Host: partner.mid.io.vn" "http://127.0.0.1:${GATEWAY_PORT}/" > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo "=== [HEALTHCHECK-SAAS] TOÀN BỘ 5 MICROSERVICES, API GATEWAY VÀ 3 CỔNG GIAO DIỆN HOẠT ĐỘNG HOÀN HẢO 100% ==="
