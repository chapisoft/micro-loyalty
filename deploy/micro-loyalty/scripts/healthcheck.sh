#!/usr/bin/env bash
set -e

echo "[HEALTHCHECK-SAAS] Kiểm tra sức khỏe Loyalty Service..."
curl -s -f http://localhost:8085/actuator/health/liveness || { echo "Liveness FAILED"; exit 1; }
echo " -> Liveness: OK"

curl -s -f http://localhost:8085/actuator/health/readiness || { echo "Readiness FAILED"; exit 1; }
echo " -> Readiness: OK"

echo "[HEALTHCHECK-SAAS] Hệ thống SaaS đang hoạt động ổn định 100%!"
