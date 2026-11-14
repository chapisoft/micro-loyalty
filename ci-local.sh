#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CI-LOCAL: KIỂM THỬ TÍCH HỢP LIÊN TỤC CỤC BỘ TRƯỚC KHI DEPLOY (MICRO-LOYALTY)
# Kiểm tra toàn diện 20 module Maven (5 Microservices Thin-JAR), 3 Frontends
# (cms, webview, partner-portal) và thẩm định cấu hình Docker Compose / Gateway.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SKIP_TESTS=false
RUN_BACKEND_ALLOW=true
RUN_FRONTEND_ALLOW=true
USE_SELECTIVE=false
CHANGED_ONLY=false
BUILD_SHARED_BACKEND=true
SELECTED_SERVICES_STR=""
SELECTED_FRONTENDS_STR=""

ALL_SERVICES=(cms-service customer-service game-service campaign-service partner-service)
ALL_FRONTENDS=(cms webview partner-portal)

append_unique_service() {
  local item="$1"
  case " ${SELECTED_SERVICES_STR} " in
    *" ${item} "*) ;;
    *) SELECTED_SERVICES_STR="${SELECTED_SERVICES_STR:+${SELECTED_SERVICES_STR} }${item}" ;;
  esac
}

append_unique_frontend() {
  local item="$1"
  case " ${SELECTED_FRONTENDS_STR} " in
    *" ${item} "*) ;;
    *) SELECTED_FRONTENDS_STR="${SELECTED_FRONTENDS_STR:+${SELECTED_FRONTENDS_STR} }${item}" ;;
  esac
}

add_target_services() {
  local raw_list="$1"
  local token=""
  for token in ${raw_list//,/ }; do
    case "$token" in
      cms-service|customer-service|game-service|campaign-service|partner-service)
        append_unique_service "$token"
        ;;
      cms|loyalty-cms)
        append_unique_frontend "cms"
        ;;
      webview|loyalty-webview)
        append_unique_frontend "webview"
        ;;
      partner-portal|loyalty-partner-portal)
        append_unique_frontend "partner-portal"
        ;;
      gateway)
        ;;
      all-backend)
        BUILD_SHARED_BACKEND=true
        for token in "${ALL_SERVICES[@]}"; do
          append_unique_service "$token"
        done
        ;;
      all)
        BUILD_SHARED_BACKEND=true
        for token in "${ALL_SERVICES[@]}"; do
          append_unique_service "$token"
        done
        for token in "${ALL_FRONTENDS[@]}"; do
          append_unique_frontend "$token"
        done
        ;;
      *)
        echo "[LỖI] Phân hệ không hợp lệ: $token" >&2
        echo "Các giá trị hợp lệ: cms-service, customer-service, game-service, campaign-service, partner-service, cms, loyalty-cms, webview, loyalty-webview, partner-portal, loyalty-partner-portal, gateway, all-backend, all" >&2
        exit 1
        ;;
    esac
  done
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-tests)
      SKIP_TESTS=true
      ;;
    --backend-only)
      RUN_BACKEND_ALLOW=true
      RUN_FRONTEND_ALLOW=false
      ;;
    --frontend-only)
      RUN_BACKEND_ALLOW=false
      RUN_FRONTEND_ALLOW=true
      ;;
    --service)
      if [ "$#" -lt 2 ] || [ -z "${2:-}" ]; then
        echo "[LỖI] Thiếu tên phân hệ sau --service" >&2
        exit 1
      fi
      if [ "$USE_SELECTIVE" = false ]; then
        BUILD_SHARED_BACKEND=false
      fi
      USE_SELECTIVE=true
      add_target_services "$2"
      shift
      ;;
    --service=*)
      if [ "$USE_SELECTIVE" = false ]; then
        BUILD_SHARED_BACKEND=false
      fi
      USE_SELECTIVE=true
      add_target_services "${1#--service=}"
      ;;
    --changed)
      if [ "$USE_SELECTIVE" = false ]; then
        BUILD_SHARED_BACKEND=false
      fi
      USE_SELECTIVE=true
      CHANGED_ONLY=true
      ;;
    -h|--help)
      cat <<'USAGE'
Sử dụng: ./ci-local.sh [TÙY CHỌN]
  --skip-tests            Bỏ qua Unit Tests (chỉ biên dịch và đóng gói nhanh)
  --backend-only          Chỉ kiểm thử và đóng gói Backend (20 modules / 5 Microservices)
  --frontend-only         Chỉ kiểm tra TypeScript và đóng gói 3 Frontends
  --service <tên[,tên]>   Chỉ kiểm thử và đóng gói phân hệ chỉ định (lặp lại được nhiều lần):
                            Backend : cms-service, customer-service, game-service,
                                      campaign-service, partner-service, all-backend
                            Frontend: cms (loyalty-cms), webview (loyalty-webview),
                                      partner-portal (loyalty-partner-portal)
  --changed               Tự động phát hiện các phân hệ có thay đổi qua git diff/status
  -h, --help              Hiển thị hướng dẫn
USAGE
      exit 0
      ;;
    *)
      echo "[LỖI] Tham số không hợp lệ: $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [ "$CHANGED_ONLY" = true ]; then
  CHANGED_FILES="$(git diff --name-only HEAD 2>/dev/null || true)"
  UNTRACKED_FILES="$(git ls-files --others --exclude-standard 2>/dev/null || true)"
  ALL_CHANGED="$(printf '%s\n%s\n' "$CHANGED_FILES" "$UNTRACKED_FILES" | sed '/^$/d')"
  if [ -z "$ALL_CHANGED" ] && git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    ALL_CHANGED="$(git diff --name-only HEAD~1..HEAD 2>/dev/null || true)"
  fi

  if [ -n "$ALL_CHANGED" ]; then
    while IFS= read -r changed_path; do
      [ -z "$changed_path" ] && continue
      case "$changed_path" in
        pom.xml|src/lib/*)
          BUILD_SHARED_BACKEND=true
          for svc in "${ALL_SERVICES[@]}"; do
            append_unique_service "$svc"
          done
          ;;
        src/service/cms-service/*)
          append_unique_service "cms-service"
          ;;
        src/service/customer-service/*)
          append_unique_service "customer-service"
          ;;
        src/service/game-service/*)
          append_unique_service "game-service"
          ;;
        src/service/campaign-service/*)
          append_unique_service "campaign-service"
          ;;
        src/service/partner-service/*)
          append_unique_service "partner-service"
          ;;
        src/cms/*)
          append_unique_frontend "cms"
          ;;
        src/webview/*)
          append_unique_frontend "webview"
          ;;
        src/partner-portal/*)
          append_unique_frontend "partner-portal"
          ;;
      esac
    done <<< "$ALL_CHANGED"
  fi
fi

START_EPOCH="$(date +%s)"
SERVICES=()
FRONTEND_APPS=()

if [ "$USE_SELECTIVE" = true ]; then
  if [ "$RUN_BACKEND_ALLOW" = true ] && [ -n "$SELECTED_SERVICES_STR" ]; then
    RUN_BACKEND=true
    for svc in $SELECTED_SERVICES_STR; do
      SERVICES+=("$svc")
    done
  else
    RUN_BACKEND=false
  fi

  if [ "$RUN_FRONTEND_ALLOW" = true ] && [ -n "$SELECTED_FRONTENDS_STR" ]; then
    RUN_FRONTEND=true
    for app in $SELECTED_FRONTENDS_STR; do
      FRONTEND_APPS+=("$app")
    done
  else
    RUN_FRONTEND=false
  fi
else
  RUN_BACKEND="$RUN_BACKEND_ALLOW"
  RUN_FRONTEND="$RUN_FRONTEND_ALLOW"
  if [ "$RUN_BACKEND" = true ]; then
    SERVICES=("${ALL_SERVICES[@]}")
    BUILD_SHARED_BACKEND=true
  fi
  if [ "$RUN_FRONTEND" = true ]; then
    FRONTEND_APPS=("${ALL_FRONTENDS[@]}")
  fi
fi

log_stage() {
  echo ""
  echo "=============================================================================="
  echo " $1"
  echo "=============================================================================="
}

# ------------------------------------------------------------------------------
# STAGE 0: KIỂM TRA CÔNG CỤ & THIẾT LẬP JAVA 17
# ------------------------------------------------------------------------------
log_stage "[STAGE 0] Kiểm tra công cụ & Thiết lập JDK 17"

if [ -x /usr/libexec/java_home ]; then
  if JDK17_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)" && [ -n "$JDK17_HOME" ]; then
    export JAVA_HOME="$JDK17_HOME"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
fi

if ! command -v java >/dev/null 2>&1; then
  echo "[LỖI] Không tìm thấy Java Runtime / JDK." >&2
  exit 1
fi

JAVA_VER_LINE="$(java -version 2>&1 | head -n 1)"
echo "• JAVA_HOME : ${JAVA_HOME:-system}"
echo "• Java      : ${JAVA_VER_LINE}"
if ! java -version 2>&1 | grep -qE '"17\.|version "17|openjdk 17'; then
  echo "[LỖI] Yêu cầu JDK 17 LTS để biên dịch và kiểm thử micro-loyalty." >&2
  exit 1
fi

chmod +x ./mvnw
echo "• Maven     : $(./mvnw -version | head -n 1)"

if [ "$RUN_FRONTEND" = true ]; then
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[LỖI] Không tìm thấy Node.js hoặc npm." >&2
    exit 1
  fi
  echo "• Node / npm: $(node -v) / npm v$(npm -v)"
fi

if command -v docker >/dev/null 2>&1; then
  echo "• Docker    : $(docker compose version 2>/dev/null || docker --version)"
else
  echo "• Docker    : Chưa cài đặt (sẽ bỏ qua docker compose config)"
fi

# ------------------------------------------------------------------------------
# STAGE 1: KIỂM TRA CẤU TRÚC ZERO-DEBT & CLEAN LEGACY SOURCE
# ------------------------------------------------------------------------------
log_stage "[STAGE 1] Kiểm tra cấu trúc 5 Microservices & Zero Legacy Monolith"

if [ -d "src/service/src" ]; then
  echo "[LỖI] Phát hiện thư mục monolith dư thừa src/service/src chưa được dọn dẹp!" >&2
  exit 1
fi

for svc in "${ALL_SERVICES[@]}"; do
  if [ ! -f "src/service/${svc}/pom.xml" ]; then
    echo "[LỖI] Thiếu module microservice: src/service/${svc}/pom.xml" >&2
    exit 1
  fi
  echo "• Đã xác nhận module: src/service/${svc}"
done
echo "• Cấu trúc Zero Legacy Monolith đạt chuẩn."

# ------------------------------------------------------------------------------
# STAGE 2: BIÊN DỊCH, UNIT TESTS & ĐÓNG GÓI BACKEND (20 MAVEN MODULES)
# ------------------------------------------------------------------------------
if [ "$RUN_BACKEND" = true ]; then
  log_stage "[STAGE 2] Biên dịch, Unit Tests & Đóng gói ${#SERVICES[@]} Microservice Thin-JAR (${SERVICES[*]})"

  if [ "$BUILD_SHARED_BACKEND" = true ]; then
    if [ "$SKIP_TESTS" = true ]; then
      echo ">>> Chạy ./mvnw clean package -DskipTests -B"
      ./mvnw clean package -DskipTests -B
    else
      echo ">>> Chạy ./mvnw clean test -B"
      ./mvnw clean test -B
      echo ">>> Chạy ./mvnw package -DskipTests -B"
      ./mvnw package -DskipTests -B
    fi

    for target_env in micro-loyalty natcash; do
      mkdir -p "deploy/${target_env}/backend/module" \
               "deploy/${target_env}/backend/lib" \
               "deploy/${target_env}/backend/etc"
      rm -rf "deploy/${target_env}/backend/module/"* \
             "deploy/${target_env}/backend/lib/"* \
             "deploy/${target_env}/backend/etc/"*
    done
  else
    MVN_MODULES=""
    for svc in "${SERVICES[@]}"; do
      MVN_MODULES="${MVN_MODULES:+${MVN_MODULES},}src/service/${svc}"
    done

    echo ">>> Cài đặt nhanh các module thư viện dùng chung (src/lib/*)..."
    ./mvnw test-compile install -DskipTests -pl src/lib/loyalty-common -am -B

    if [ "$SKIP_TESTS" = true ]; then
      echo ">>> Chạy ./mvnw clean package -DskipTests -pl ${MVN_MODULES} -B"
      ./mvnw clean package -DskipTests -pl "${MVN_MODULES}" -B
    else
      echo ">>> Chạy ./mvnw clean package -pl ${MVN_MODULES} -B (biên dịch + Unit Tests + Thin-JAR)"
      ./mvnw clean package -pl "${MVN_MODULES}" -B
    fi

    for target_env in micro-loyalty natcash; do
      mkdir -p "deploy/${target_env}/backend/module" \
               "deploy/${target_env}/backend/lib" \
               "deploy/${target_env}/backend/etc"
    done
  fi

  for svc in "${SERVICES[@]}"; do
    JAR_FILE="$(ls -1 "src/service/${svc}/target/module/${svc}-"*.jar 2>/dev/null | head -n 1 || true)"
    if [ -z "$JAR_FILE" ] || [ ! -f "$JAR_FILE" ]; then
      echo "[LỖI] Không tìm thấy Thin-JAR cho ${svc} trong src/service/${svc}/target/module/" >&2
      exit 1
    fi

    if ! unzip -p "$JAR_FILE" META-INF/MANIFEST.MF | tr -d '\r\n ' | grep -q 'Class-Path:.*lib/'; then
      echo "[LỖI] MANIFEST.MF của ${JAR_FILE} không khai báo Class-Path trỏ tới ../lib/!" >&2
      exit 1
    fi

    LIB_COUNT="$(find "src/service/${svc}/target/lib" -maxdepth 1 -name '*.jar' | wc -l | tr -d ' ')"
    if [ "$LIB_COUNT" -lt 100 ]; then
      echo "[LỖI] Số lượng thư viện trong ${svc}/target/lib quá ít (${LIB_COUNT} < 100)!" >&2
      exit 1
    fi

    echo "• ${svc}: $(basename "$JAR_FILE") | ${LIB_COUNT} thư viện phụ thuộc | MANIFEST OK"

    for target_env in micro-loyalty natcash; do
      cp "$JAR_FILE" "deploy/${target_env}/backend/module/${svc}.jar"
      cp -Rf "src/service/${svc}/target/lib/." "deploy/${target_env}/backend/lib/"
      cp -Rf "src/service/${svc}/target/etc/." "deploy/${target_env}/backend/etc/" 2>/dev/null || true
    done
  done

  SAAS_LIB_TOTAL="$(find deploy/micro-loyalty/backend/lib -maxdepth 1 -name '*.jar' | wc -l | tr -d ' ')"
  SAAS_MOD_TOTAL="$(find deploy/micro-loyalty/backend/module -maxdepth 1 -name '*.jar' | wc -l | tr -d ' ')"
  echo "• Đã đồng bộ tạo phẩm Backend: ${SAAS_MOD_TOTAL} module JARs, ${SAAS_LIB_TOTAL} lib JARs -> deploy/micro-loyalty/backend/ & deploy/natcash/backend/"
fi

# ------------------------------------------------------------------------------
# STAGE 3: KIỂM TRA TYPESCRIPT & ĐÓNG GÓI 3 PHÂN HỆ FRONTEND
# ------------------------------------------------------------------------------
if [ "$RUN_FRONTEND" = true ]; then
  log_stage "[STAGE 3] Kiểm tra TypeScript & Đóng gói ${#FRONTEND_APPS[@]} Phân hệ Frontend (${FRONTEND_APPS[*]})"

  for app in "${FRONTEND_APPS[@]}"; do
    APP_DIR="src/${app}"
    echo ">>> Đang xử lý Frontend: ${APP_DIR}"
    if [ ! -d "${APP_DIR}/node_modules" ]; then
      echo "• Cài đặt phụ thuộc npm ci cho ${APP_DIR}..."
      (cd "$APP_DIR" && npm ci)
    fi

    if [ "$app" = "cms" ]; then
      (cd "$APP_DIR" && npx tsc -b && npm run build)
    elif [ "$app" = "partner-portal" ]; then
      (cd "$APP_DIR" && npm run lint && npm run build)
    else
      (cd "$APP_DIR" && npm run build)
    fi

    if [ ! -f "${APP_DIR}/dist/index.html" ]; then
      echo "[LỖI] Không tìm thấy ${APP_DIR}/dist/index.html sau khi build!" >&2
      exit 1
    fi

    for target_env in micro-loyalty natcash; do
      rm -rf "deploy/${target_env}/frontend/${app}/dist"
      mkdir -p "deploy/${target_env}/frontend/${app}/dist"
      cp -R "${APP_DIR}/dist/." "deploy/${target_env}/frontend/${app}/dist/"
    done
    echo "• ${app}: TypeScript + Vite build OK -> đã đồng bộ dist/"
  done
fi

# ------------------------------------------------------------------------------
# STAGE 4: THẨM ĐỊNH CẤU HÌNH TRIỂN KHAI & API GATEWAY
# ------------------------------------------------------------------------------
log_stage "[STAGE 4] Thẩm định Docker Compose & Cấu hình API Gateway"

if command -v docker >/dev/null 2>&1; then
  MICRO_ENV="deploy/micro-loyalty/.env"
  [ -f "$MICRO_ENV" ] || MICRO_ENV="deploy/micro-loyalty/.env.example"
  NATCASH_ENV="deploy/natcash/.env"
  [ -f "$NATCASH_ENV" ] || NATCASH_ENV="deploy/natcash/.env.example"
  docker compose --env-file "$MICRO_ENV" -f deploy/micro-loyalty/docker-compose.yml config -q
  echo "• deploy/micro-loyalty/docker-compose.yml: HỢP LỆ"
  docker compose --env-file "$NATCASH_ENV" -f deploy/natcash/docker-compose.yml config -q
  echo "• deploy/natcash/docker-compose.yml: HỢP LỆ"
fi

for nginx_conf in \
  "deploy/micro-loyalty/config/nginx/nginx-saas.conf" \
  "deploy/natcash/config/nginx/nginx-natcash.conf"; do
  if [ ! -f "$nginx_conf" ]; then
    echo "[LỖI] Thiếu cấu hình Gateway: ${nginx_conf}" >&2
    exit 1
  fi
  for port in 8081 8082 8083 8084 8085; do
    if ! grep -q ":${port};" "$nginx_conf"; then
      echo "[LỖI] ${nginx_conf} thiếu khai báo upstream cổng ${port}!" >&2
      exit 1
    fi
  done
  echo "• ${nginx_conf}: Đầy đủ 5 upstream microservices (8081..8085)"
done

END_EPOCH="$(date +%s)"
ELAPSED="$((END_EPOCH - START_EPOCH))"

BACKEND_SUMMARY="SKIPPED"
UNIT_TEST_SUMMARY="SKIPPED"
FRONTEND_SUMMARY="SKIPPED"
if [ "$RUN_BACKEND" = true ]; then
  BACKEND_SUMMARY="PASSED (${SERVICES[*]})"
  if [ "$SKIP_TESTS" = false ]; then
    UNIT_TEST_SUMMARY="PASSED"
  fi
fi
if [ "$RUN_FRONTEND" = true ]; then
  FRONTEND_SUMMARY="PASSED (${FRONTEND_APPS[*]})"
fi

log_stage "TỔNG KẾT CI-LOCAL THÀNH CÔNG (${ELAPSED}s)"
echo "• Backend (Microservices Thin-JAR)  : ${BACKEND_SUMMARY}"
echo "• Unit Tests                        : ${UNIT_TEST_SUMMARY}"
echo "• Frontend (CMS / Webview / Partner): ${FRONTEND_SUMMARY}"
echo "• Docker Compose & API Gateway      : PASSED"
echo "=============================================================================="
