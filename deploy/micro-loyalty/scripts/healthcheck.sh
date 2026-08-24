#!/usr/bin/env bash
set -e

GATEWAY_PORT="${GATEWAY_HTTP_PORT:-18095}"

echo "=== [HEALTHCHECK-SAAS] KIỂM TRA SỨC KHỎE HỆ THỐNG LOYALTY (PORT $GATEWAY_PORT) ==="

echo -n "1. Kiểm tra Liveness Backend: "
curl -s -f http://127.0.0.1:${GATEWAY_PORT}/actuator/health/liveness > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "2. Kiểm tra Readiness Backend: "
curl -s -f http://127.0.0.1:${GATEWAY_PORT}/actuator/health/readiness > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "3. Kiểm tra Cổng Quản Trị CMS: "
curl -s -f http://127.0.0.1:${GATEWAY_PORT}/index.html > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo -n "4. Kiểm tra Cổng Webview GameHub: "
curl -s -f http://127.0.0.1:${GATEWAY_PORT}/portal/index.html > /dev/null && echo "OK" || { echo "FAILED"; exit 1; }

echo "=== [HEALTHCHECK-SAAS] TOÀN BỘ CỤM DỊCH VỤ HOẠT ĐỘNG HOÀN HẢO 100% ==="
