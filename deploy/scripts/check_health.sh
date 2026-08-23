#!/usr/bin/env bash
# ==============================================================================
# Smart-OTP Health Verification Script
# Usage: ./check_health.sh [port]
# ==============================================================================
set -euo pipefail

PORT="${1:-18090}"
HOST="http://localhost:${PORT}"

echo "================================================================="
echo "🏥 Checking Smart-OTP Health on ${HOST}..."
echo "================================================================="

FAILED=0

check_endpoint() {
    local NAME="$1"
    local URL="$2"
    local EXPECTED_CODE="${3:-200}"

    printf "%-30s ... " "$NAME"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" || echo "000")

    if [ "$HTTP_CODE" -eq "$EXPECTED_CODE" ]; then
        echo "✅ PASS (HTTP $HTTP_CODE)"
    else
        echo "❌ FAIL (HTTP $HTTP_CODE, Expected $EXPECTED_CODE)"
        FAILED=$((FAILED + 1))
    fi
}

check_endpoint "CMS Admin Web" "${HOST}/" 200
check_endpoint "Sandbox Portal Web" "${HOST}/sandbox-portal/" 200
check_endpoint "Auth Service Health" "${HOST}/health/auth" 200
check_endpoint "Customer Service Health" "${HOST}/health/customer" 200
check_endpoint "Partner Service Health" "${HOST}/health/partner" 200
check_endpoint "CMS Service Health" "${HOST}/health/cms" 200
check_endpoint "Prometheus Scrape" "${HOST}/actuator/prometheus" 200

echo "-----------------------------------------------------------------"
if [ "$FAILED" -eq 0 ]; then
    echo "🎉 All Smart-OTP health checks passed successfully!"
    exit 0
else
    echo "⚠️ $FAILED health check(s) failed. Please inspect container logs:"
    echo "   docker compose -p smart-otp logs --tail 50"
    exit 1
fi
