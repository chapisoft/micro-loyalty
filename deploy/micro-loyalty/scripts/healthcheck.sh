#!/usr/bin/env bash
set -e

GATEWAY_PORT="${GATEWAY_HTTP_PORT:-18095}"
MAX_ATTEMPTS="${HEALTHCHECK_MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-4}"

wait_url() {
    local label="$1"
    local url="$2"
    local host_header="${3:-}"
    echo -n "${label}: "
    for i in $(seq 1 "${MAX_ATTEMPTS}"); do
        if [ -n "${host_header}" ]; then
            if curl -s -f -H "Host: ${host_header}" "${url}" > /dev/null 2>&1; then
                echo "OK"
                return 0
            fi
        else
            if curl -s -f "${url}" > /dev/null 2>&1; then
                echo "OK"
                return 0
            fi
        fi
        sleep "${SLEEP_SECONDS}"
    done
    echo "FAILED"
    return 1
}

wait_container() {
    local c_name="$1"
    local c_port="$2"
    echo -n "   - Kiểm tra trực tiếp ${c_name} (${c_port}): "
    for i in $(seq 1 "${MAX_ATTEMPTS}"); do
        if docker exec "${c_name}" curl -s -f "http://127.0.0.1:${c_port}/actuator/health/liveness" > /dev/null 2>&1; then
            echo "OK"
            return 0
        fi
        sleep "${SLEEP_SECONDS}"
    done
    echo "FAILED"
    return 1
}

echo "=== [HEALTHCHECK-SAAS] KIỂM TRA SỨC KHỎE CỤM MICROSERVICES LOYALTY (PORT $GATEWAY_PORT) ==="

wait_url "0. Kiểm tra API Gateway (/gateway-health)" "http://127.0.0.1:${GATEWAY_PORT}/gateway-health"

if command -v docker >/dev/null 2>&1; then
    for entry in \
        "loyalty-saas-cms-service:8081" \
        "loyalty-saas-customer-service:8082" \
        "loyalty-saas-game-service:8083" \
        "loyalty-saas-campaign-service:8084" \
        "loyalty-saas-partner-service:8085"; do
        C_NAME="${entry%%:*}"
        C_PORT="${entry##*:}"
        wait_container "${C_NAME}" "${C_PORT}"
    done
fi

wait_url "1. Kiểm tra Liveness qua Gateway" "http://127.0.0.1:${GATEWAY_PORT}/actuator/health/liveness"
wait_url "2. Kiểm tra Readiness qua Gateway" "http://127.0.0.1:${GATEWAY_PORT}/actuator/health/readiness"
wait_url "3. Kiểm tra Cổng Quản Trị CMS" "http://127.0.0.1:${GATEWAY_PORT}/index.html"
wait_url "4. Kiểm tra Cổng Webview GameHub" "http://127.0.0.1:${GATEWAY_PORT}/portal/index.html"
wait_url "5. Kiểm tra Cổng Đối Tác Partner Portal (/partner-portal/)" "http://127.0.0.1:${GATEWAY_PORT}/partner-portal/index.html"
wait_url "6. Kiểm tra Cổng Đối Tác Partner Portal (Virtual Host)" "http://127.0.0.1:${GATEWAY_PORT}/" "partner.mid.io.vn"

echo "=== [HEALTHCHECK-SAAS] TOÀN BỘ 5 MICROSERVICES, API GATEWAY VÀ 3 CỔNG GIAO DIỆN HOẠT ĐỘNG HOÀN HẢO 100% ==="
