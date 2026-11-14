// ═════════════════════════════════════════════════════════════════════════════
//  Micro-Loyalty Platform | Jenkins Declarative Pipeline (SaaS Multi-Tenant)
//  Server: 35.247.156.176 (LAN: 192.168.1.200, Host: micro)
//  Path:   /data/uc1-software/apps/micro-loyalty/deploy
//  Chính sách: Chạy trực tiếp trên Jenkins tại server 35.247.156.176/192.168.1.200
//              (không phụ thuộc Jenkins ngoài). Chỉ CI/CD khi nhánh main có thay
//              đổi và chỉ build/deploy đúng Microservice hoặc Frontend có cập nhật.
// ═════════════════════════════════════════════════════════════════════════════
pipeline {
    agent any

    triggers {
        githubPush()
        pollSCM('* * * * *')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        choice(
            name: 'TARGET_SERVICE',
            choices: [
                'auto',
                'cms-service',
                'customer-service',
                'game-service',
                'campaign-service',
                'partner-service',
                'all-backend',
                'loyalty-cms',
                'loyalty-webview',
                'loyalty-partner-portal',
                'gateway',
                'all'
            ],
            description: 'auto: Tự động phát hiện và chỉ build/deploy đúng Microservice/Frontend có thay đổi; hoặc chọn thủ công phân hệ mục tiêu'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Bỏ qua Unit Test khi build Backend (chỉ áp dụng cho các Microservice Backend được build)'
        )
        booleanParam(
            name: 'DRY_RUN',
            defaultValue: false,
            description: 'Chỉ kiểm tra diff và build kiểm thử, không đồng bộ/deploy lên Docker Compose'
        )
    }

    environment {
        DEPLOY_SERVER_HOST = '35.247.156.176'
        DEPLOY_SERVER_LAN  = '192.168.1.200'
        DEPLOY_SERVER_PORT = '65000'
        DEPLOY_SERVER_USER = 'root'
        DEPLOY_PATH        = '/data/uc1-software/apps/micro-loyalty/deploy'
        SSH_CREDENTIAL_ID  = 'micro-server-ssh'
        PUBLIC_API_URL     = 'https://api.mid.io.vn/gateway-health'
        PUBLIC_CMS_URL     = 'https://cms.mid.io.vn/'
        PUBLIC_PORTAL_URL  = 'https://portal.mid.io.vn/'
        PUBLIC_PARTNER_URL = 'https://partner.mid.io.vn/'
    }

    stages {
        stage('0. Detect Branch & Changed Components') {
            steps {
                script {
                    def rawBranch = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').trim()
                    def branch = rawBranch
                        .replaceFirst('^refs/remotes/origin/', '')
                        .replaceFirst('^refs/heads/', '')
                        .replaceFirst('^origin/', '')

                    if (!branch || branch == 'HEAD') {
                        def onMain = sh(
                            script: 'git branch -r --contains HEAD 2>/dev/null | grep -Eq "(^|[ /])origin/main$" && echo true || echo false',
                            returnStdout: true
                        ).trim()
                        if (onMain == 'true') {
                            branch = 'main'
                        } else {
                            branch = sh(script: 'git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown', returnStdout: true).trim()
                        }
                    }

                    env.DETECTED_BRANCH = branch
                    env.IS_MAIN_BRANCH  = (branch == 'main') ? 'true' : 'false'
                    env.IMAGE_TAG       = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo latest', returnStdout: true).trim()

                    env.DEPLOY_CMS_SERVICE      = 'false'
                    env.DEPLOY_CUSTOMER_SERVICE = 'false'
                    env.DEPLOY_GAME_SERVICE     = 'false'
                    env.DEPLOY_CAMPAIGN_SERVICE = 'false'
                    env.DEPLOY_PARTNER_SERVICE  = 'false'
                    env.DEPLOY_SHARED_BACKEND   = 'false'
                    env.DEPLOY_BACKEND          = 'false'

                    env.DEPLOY_CMS              = 'false'
                    env.DEPLOY_WEBVIEW          = 'false'
                    env.DEPLOY_PARTNER_PORTAL   = 'false'
                    env.DEPLOY_GATEWAY          = 'false'

                    env.SYNC_BACKEND_CONFIG     = 'false'
                    env.SYNC_FRONTEND_CONFIG    = 'false'
                    env.SYNC_LOCALES            = 'false'
                    env.SYNC_SCRIPTS            = 'false'
                    env.SYNC_COMPOSE            = 'false'
                    env.HAS_DEPLOY_CHANGES      = 'false'

                    env.BACKEND_SERVICES_TO_BUILD = ''
                    env.MAVEN_PL_MODULES          = ''
                    env.TARGET_SERVICES_LIST      = ''
                    env.RESTART_SERVICES_LIST     = ''
                    env.CHANGED_FILES_SUMMARY     = ''

                    if (env.IS_MAIN_BRANCH != 'true') {
                        echo "Nhánh [${branch}] (raw: '${rawBranch}') không phải 'main'. Bỏ qua toàn bộ quy trình build và deploy."
                        currentBuild.description = "SKIPPED (Branch: ${branch})"
                        return
                    }

                    if (params.TARGET_SERVICE != 'auto') {
                        switch (params.TARGET_SERVICE) {
                            case 'all':
                                env.DEPLOY_CMS_SERVICE      = 'true'
                                env.DEPLOY_CUSTOMER_SERVICE = 'true'
                                env.DEPLOY_GAME_SERVICE     = 'true'
                                env.DEPLOY_CAMPAIGN_SERVICE = 'true'
                                env.DEPLOY_PARTNER_SERVICE  = 'true'
                                env.DEPLOY_SHARED_BACKEND   = 'true'
                                env.DEPLOY_CMS              = 'true'
                                env.DEPLOY_WEBVIEW          = 'true'
                                env.DEPLOY_PARTNER_PORTAL   = 'true'
                                env.DEPLOY_GATEWAY          = 'true'
                                env.SYNC_BACKEND_CONFIG     = 'true'
                                env.SYNC_FRONTEND_CONFIG    = 'true'
                                env.SYNC_LOCALES            = 'true'
                                env.SYNC_SCRIPTS            = 'true'
                                env.SYNC_COMPOSE            = 'true'
                                break
                            case 'all-backend':
                            case 'loyalty-service':
                                env.DEPLOY_CMS_SERVICE      = 'true'
                                env.DEPLOY_CUSTOMER_SERVICE = 'true'
                                env.DEPLOY_GAME_SERVICE     = 'true'
                                env.DEPLOY_CAMPAIGN_SERVICE = 'true'
                                env.DEPLOY_PARTNER_SERVICE  = 'true'
                                env.DEPLOY_SHARED_BACKEND   = 'true'
                                break
                            case 'cms-service':
                                env.DEPLOY_CMS_SERVICE = 'true'
                                break
                            case 'customer-service':
                                env.DEPLOY_CUSTOMER_SERVICE = 'true'
                                break
                            case 'game-service':
                                env.DEPLOY_GAME_SERVICE = 'true'
                                break
                            case 'campaign-service':
                                env.DEPLOY_CAMPAIGN_SERVICE = 'true'
                                break
                            case 'partner-service':
                                env.DEPLOY_PARTNER_SERVICE = 'true'
                                break
                            case 'loyalty-cms':
                                env.DEPLOY_CMS = 'true'
                                break
                            case 'loyalty-webview':
                                env.DEPLOY_WEBVIEW = 'true'
                                break
                            case 'loyalty-partner-portal':
                                env.DEPLOY_PARTNER_PORTAL = 'true'
                                break
                            case 'gateway':
                                env.DEPLOY_GATEWAY = 'true'
                                break
                        }
                    } else {
                        def prevCommit = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: ''
                        def changedFiles = sh(script: """
                            set -e
                            HEAD_SHA=\$(git rev-parse HEAD)
                            if [ -n "${prevCommit}" ] && [ "${prevCommit}" != "\$HEAD_SHA" ] && git cat-file -e "${prevCommit}^{commit}" 2>/dev/null; then
                                git diff --name-only "${prevCommit}" "\$HEAD_SHA"
                            elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
                                git diff --name-only HEAD~1 "\$HEAD_SHA"
                            else
                                git show --pretty="" --name-only "\$HEAD_SHA"
                            fi
                        """, returnStdout: true).trim()

                        env.CHANGED_FILES_SUMMARY = changedFiles
                        echo "=== Danh sách tệp thay đổi ==="
                        echo(changedFiles ? changedFiles : "(Không có tệp thay đổi mới)")

                        if (changedFiles) {
                            def files = changedFiles.split(/\r?\n/)
                            for (int i = 0; i < files.length; i++) {
                                String f = files[i].trim()
                                if (!f) {
                                    continue
                                }

                                // Bỏ qua tài liệu, kế hoạch, sơ đồ, skills, CI cục bộ, kịch bản đo tải/an ninh và môi trường Natcash
                                if (f.startsWith('docs/') || f.startsWith('plan/') || f.startsWith('diagrams/') || f.startsWith('.agents/') ||
                                    f.startsWith('deploy/natcash/') || f.startsWith('deploy/micro-loyalty/ci-cd/') ||
                                    f == 'Jenkinsfile' || f == 'ci-local.sh' || f == 'scripts/ci-local.sh' ||
                                    f.startsWith('scripts/loadtest/') || f.startsWith('scripts/security/') ||
                                    f == 'README.md' || f.endsWith('.md')) {
                                    continue
                                }

                                // Phân tách thay đổi theo từng Microservice Backend độc lập
                                if (f.startsWith('src/service/cms-service/')) {
                                    env.DEPLOY_CMS_SERVICE = 'true'
                                } else if (f.startsWith('src/service/customer-service/')) {
                                    env.DEPLOY_CUSTOMER_SERVICE = 'true'
                                } else if (f.startsWith('src/service/game-service/')) {
                                    env.DEPLOY_GAME_SERVICE = 'true'
                                } else if (f.startsWith('src/service/campaign-service/')) {
                                    env.DEPLOY_CAMPAIGN_SERVICE = 'true'
                                } else if (f.startsWith('src/service/partner-service/')) {
                                    env.DEPLOY_PARTNER_SERVICE = 'true'
                                } else if (f.startsWith('src/lib/') || f == 'pom.xml' || f == 'mvnw' || f == 'mvnw.cmd' ||
                                           f.startsWith('.mvn/') || f.startsWith('deploy/micro-loyalty/backend/')) {
                                    env.DEPLOY_SHARED_BACKEND   = 'true'
                                    env.DEPLOY_CMS_SERVICE      = 'true'
                                    env.DEPLOY_CUSTOMER_SERVICE = 'true'
                                    env.DEPLOY_GAME_SERVICE     = 'true'
                                    env.DEPLOY_CAMPAIGN_SERVICE = 'true'
                                    env.DEPLOY_PARTNER_SERVICE  = 'true'
                                } else if (f.startsWith('deploy/micro-loyalty/config/backend/')) {
                                    env.SYNC_BACKEND_CONFIG = 'true'
                                } else if (f.startsWith('src/cms/') || f.startsWith('deploy/micro-loyalty/frontend/cms/')) {
                                    env.DEPLOY_CMS = 'true'
                                } else if (f.startsWith('src/webview/') || f.startsWith('deploy/micro-loyalty/frontend/webview/')) {
                                    env.DEPLOY_WEBVIEW = 'true'
                                } else if (f.startsWith('src/partner-portal/') || f.startsWith('deploy/micro-loyalty/frontend/partner-portal/')) {
                                    env.DEPLOY_PARTNER_PORTAL = 'true'
                                } else if (f.startsWith('deploy/micro-loyalty/config/frontend/')) {
                                    env.SYNC_FRONTEND_CONFIG = 'true'
                                } else if (f.startsWith('deploy/micro-loyalty/locales/')) {
                                    env.SYNC_LOCALES = 'true'
                                } else if (f.startsWith('deploy/micro-loyalty/gateway/') ||
                                           f == 'deploy/micro-loyalty/config/nginx/nginx-saas.conf') {
                                    env.DEPLOY_GATEWAY = 'true'
                                } else if (f.startsWith('deploy/micro-loyalty/scripts/')) {
                                    env.SYNC_SCRIPTS = 'true'
                                } else if (f == 'deploy/micro-loyalty/docker-compose.yml') {
                                    env.SYNC_COMPOSE = 'true'
                                }
                            }
                        }
                    }

                    def allBackendNames = ['cms-service', 'customer-service', 'game-service', 'campaign-service', 'partner-service']
                    def backendServices = []
                    if (env.DEPLOY_CMS_SERVICE      == 'true') backendServices.add('cms-service')
                    if (env.DEPLOY_CUSTOMER_SERVICE == 'true') backendServices.add('customer-service')
                    if (env.DEPLOY_GAME_SERVICE     == 'true') backendServices.add('game-service')
                    if (env.DEPLOY_CAMPAIGN_SERVICE == 'true') backendServices.add('campaign-service')
                    if (env.DEPLOY_PARTNER_SERVICE  == 'true') backendServices.add('partner-service')

                    env.BACKEND_SERVICES_TO_BUILD = backendServices.join(' ')
                    env.MAVEN_PL_MODULES          = backendServices.collect { "src/service/${it}" }.join(',')
                    env.DEPLOY_BACKEND            = (backendServices.size() > 0) ? 'true' : 'false'

                    def targetServices = []
                    targetServices.addAll(backendServices)
                    if (env.DEPLOY_CMS            == 'true') targetServices.add('loyalty-cms')
                    if (env.DEPLOY_WEBVIEW        == 'true') targetServices.add('loyalty-webview')
                    if (env.DEPLOY_PARTNER_PORTAL == 'true') targetServices.add('loyalty-partner-portal')
                    if (env.DEPLOY_GATEWAY        == 'true') targetServices.add('gateway')

                    def restartServices = []
                    if (env.SYNC_BACKEND_CONFIG == 'true' || env.SYNC_LOCALES == 'true') {
                        for (String svc : allBackendNames) {
                            if (!targetServices.contains(svc)) {
                                restartServices.add(svc)
                            }
                        }
                    }
                    if (env.SYNC_FRONTEND_CONFIG == 'true' || env.SYNC_LOCALES == 'true') {
                        for (String feSvc : ['loyalty-cms', 'loyalty-webview', 'loyalty-partner-portal']) {
                            if (!targetServices.contains(feSvc)) {
                                restartServices.add(feSvc)
                            }
                        }
                    }

                    env.TARGET_SERVICES_LIST  = targetServices.join(' ')
                    env.RESTART_SERVICES_LIST = restartServices.join(' ')
                    if (targetServices.size() > 0 || restartServices.size() > 0 ||
                        env.SYNC_COMPOSE == 'true' || env.SYNC_SCRIPTS == 'true' ||
                        env.SYNC_BACKEND_CONFIG == 'true' || env.SYNC_FRONTEND_CONFIG == 'true' || env.SYNC_LOCALES == 'true') {
                        env.HAS_DEPLOY_CHANGES = 'true'
                    }

                    echo """
=== TỔNG HỢP PHẠM VI CI/CD CHỌN LỌC ===
• Branch           : ${env.DETECTED_BRANCH} (${env.IMAGE_TAG})
• Mode             : ${params.TARGET_SERVICE} | DRY_RUN=${params.DRY_RUN}
• Backend Services : ${env.BACKEND_SERVICES_TO_BUILD ?: '(Không có)'} (shared=${env.DEPLOY_SHARED_BACKEND})
• Frontends        : cms=${env.DEPLOY_CMS}, webview=${env.DEPLOY_WEBVIEW}, partner-portal=${env.DEPLOY_PARTNER_PORTAL}
• Gateway          : ${env.DEPLOY_GATEWAY}
• Config/Locales   : beConfig=${env.SYNC_BACKEND_CONFIG}, feConfig=${env.SYNC_FRONTEND_CONFIG}, locales=${env.SYNC_LOCALES}
• Scripts/Compose  : scripts=${env.SYNC_SCRIPTS}, compose=${env.SYNC_COMPOSE}
• Rolling Rebuild  : ${env.TARGET_SERVICES_LIST ?: '(Không có container cần build lại)'}
• Restart Config   : ${env.RESTART_SERVICES_LIST ?: '(Không có container cần restart)'}
                    """.stripIndent()

                    def summaryTarget = env.TARGET_SERVICES_LIST ?: (env.RESTART_SERVICES_LIST ? "restart:${env.RESTART_SERVICES_LIST}" : 'scripts/compose')
                    if (env.HAS_DEPLOY_CHANGES != 'true') {
                        currentBuild.description = "SKIPPED (No SaaS code changes)"
                    } else if (params.DRY_RUN) {
                        currentBuild.description = "DRY-RUN: ${summaryTarget}"
                    } else {
                        currentBuild.description = "Deploy: ${summaryTarget}"
                        sendDeployNotification('INFO', "Bắt đầu chạy CI/CD | Phân hệ: ${summaryTarget}")
                    }
                }
            }
        }

        stage('1. Build Changed Backend Microservices') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.DEPLOY_BACKEND == 'true' }
                }
            }
            steps {
                script {
                    echo "Đóng gói chọn lọc Microservices Backend: [${env.BACKEND_SERVICES_TO_BUILD}] (shared=${env.DEPLOY_SHARED_BACKEND})..."
                    sh 'java -version && chmod +x ./mvnw'

                    if (env.DEPLOY_SHARED_BACKEND == 'true') {
                        if (params.SKIP_TESTS) {
                            sh "./mvnw clean package -DskipTests -pl ${env.MAVEN_PL_MODULES} -am -B"
                        } else {
                            sh "./mvnw clean package -pl ${env.MAVEN_PL_MODULES} -am -B"
                        }
                    } else {
                        sh './mvnw test-compile install -DskipTests -pl src/lib/loyalty-common -am -B'
                        if (params.SKIP_TESTS) {
                            sh "./mvnw clean package -DskipTests -pl ${env.MAVEN_PL_MODULES} -B"
                        } else {
                            sh "./mvnw clean package -pl ${env.MAVEN_PL_MODULES} -B"
                        }
                    }

                    sh '''
                        set -e
                        mkdir -p deploy/micro-loyalty/backend/module deploy/micro-loyalty/backend/lib deploy/micro-loyalty/backend/etc
                        if [ "${DEPLOY_SHARED_BACKEND}" = "true" ]; then
                            rm -rf deploy/micro-loyalty/backend/lib/* deploy/micro-loyalty/backend/etc/*
                        fi

                        for svc in ${BACKEND_SERVICES_TO_BUILD}; do
                            JAR_FILE=$(ls -1 src/service/${svc}/target/module/${svc}-*.jar | head -n 1)
                            test -n "$JAR_FILE"
                            cp "$JAR_FILE" "deploy/micro-loyalty/backend/module/${svc}.jar"
                            if [ -d "src/service/${svc}/target/lib" ]; then
                                cp -Rf "src/service/${svc}/target/lib/." deploy/micro-loyalty/backend/lib/
                            fi
                            if [ -d "src/service/${svc}/target/etc" ]; then
                                cp -Rf "src/service/${svc}/target/etc/." deploy/micro-loyalty/backend/etc/
                            fi
                        done
                        ls -lh deploy/micro-loyalty/backend/module/
                    '''
                }
            }
        }

        stage('2. Build CMS Frontend (loyalty-cms)') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.DEPLOY_CMS == 'true' }
                }
            }
            steps {
                dir('src/cms') {
                    sh '''
                        node -v && npm -v
                        npm ci
                        npm run build
                        rm -rf ../../deploy/micro-loyalty/frontend/cms/dist
                        mkdir -p ../../deploy/micro-loyalty/frontend/cms/dist
                        cp -R dist/. ../../deploy/micro-loyalty/frontend/cms/dist/
                    '''
                }
            }
        }

        stage('3. Build Webview Frontend (loyalty-webview)') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.DEPLOY_WEBVIEW == 'true' }
                }
            }
            steps {
                dir('src/webview') {
                    sh '''
                        node -v && npm -v
                        npm ci
                        npx tsc --noEmit
                        npm run build
                        rm -rf ../../deploy/micro-loyalty/frontend/webview/dist
                        mkdir -p ../../deploy/micro-loyalty/frontend/webview/dist
                        cp -R dist/. ../../deploy/micro-loyalty/frontend/webview/dist/
                    '''
                }
            }
        }

        stage('3B. Build Partner Portal Frontend (loyalty-partner-portal)') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.DEPLOY_PARTNER_PORTAL == 'true' }
                }
            }
            steps {
                dir('src/partner-portal') {
                    sh '''
                        node -v && npm -v
                        npm ci
                        npx tsc --noEmit
                        npm run lint
                        npm run build
                        rm -rf ../../deploy/micro-loyalty/frontend/partner-portal/dist
                        mkdir -p ../../deploy/micro-loyalty/frontend/partner-portal/dist
                        cp -R dist/. ../../deploy/micro-loyalty/frontend/partner-portal/dist/
                    '''
                }
            }
        }

        stage('4. Selective Sync & Rolling Deploy') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.HAS_DEPLOY_CHANGES == 'true' }
                    expression { !params.DRY_RUN }
                }
            }
            steps {
                script {
                    def isLocalDeploy = sh(script: "[ -d '${env.DEPLOY_PATH}' ]", returnStatus: true) == 0

                    if (isLocalDeploy) {
                        echo "Triển khai trực tiếp trên máy chủ local (${env.DEPLOY_SERVER_LAN}) -> ${env.DEPLOY_PATH}"
                        sh '''
                            set -e
                            sync_local() {
                                SRC_DIR="$1"
                                DST_SUB="$2"
                                DELETE_FLAG="$3"
                                mkdir -p "${DEPLOY_PATH}/${DST_SUB}"
                                if command -v rsync >/dev/null 2>&1; then
                                    if [ "$DELETE_FLAG" = "delete" ]; then
                                        rsync -az --delete --exclude='._*' "${SRC_DIR}/" "${DEPLOY_PATH}/${DST_SUB}/"
                                    else
                                        rsync -az --exclude='._*' "${SRC_DIR}/" "${DEPLOY_PATH}/${DST_SUB}/"
                                    fi
                                else
                                    if [ "$DELETE_FLAG" = "delete" ]; then
                                        rm -rf "${DEPLOY_PATH}/${DST_SUB}" && mkdir -p "${DEPLOY_PATH}/${DST_SUB}"
                                    fi
                                    cp -a "${SRC_DIR}/." "${DEPLOY_PATH}/${DST_SUB}/"
                                fi
                            }

                            if [ ! -f "${DEPLOY_PATH}/.env" ] && [ -f "deploy/micro-loyalty/.env.example" ]; then
                                cp "deploy/micro-loyalty/.env.example" "${DEPLOY_PATH}/.env"
                            fi

                            if [ "${DEPLOY_BACKEND}" = "true" ]; then
                                if docker ps --format '{{.Names}}' | grep -qx 'loyalty-saas-postgres'; then
                                    echo "Sao lưu CSDL PostgreSQL trước khi cập nhật Backend..."
                                    BACKUP_TS=$(date +%Y%m%d_%H%M%S)
                                    mkdir -p "${DEPLOY_PATH}/backups"
                                    docker exec loyalty-saas-postgres pg_dump -U loyalty_app loyalty_db | gzip > "${DEPLOY_PATH}/backups/loyalty_db_pre_jenkins_${BACKUP_TS}.sql.gz"
                                else
                                    echo "Container loyalty-saas-postgres chưa chạy, bỏ qua bước sao lưu trước deploy."
                                fi

                                LIB_SYNC_MODE="keep"
                                if [ "${DEPLOY_SHARED_BACKEND}" = "true" ]; then
                                    LIB_SYNC_MODE="delete"
                                fi

                                cp -f deploy/micro-loyalty/backend/Dockerfile "${DEPLOY_PATH}/backend/Dockerfile"
                                sync_local "deploy/micro-loyalty/backend/module" "backend/module" "keep"
                                sync_local "deploy/micro-loyalty/backend/lib" "backend/lib" "${LIB_SYNC_MODE}"
                                sync_local "deploy/micro-loyalty/backend/etc" "backend/etc" "${LIB_SYNC_MODE}"
                            fi

                            if [ "${DEPLOY_BACKEND}" = "true" ] || [ "${SYNC_BACKEND_CONFIG}" = "true" ]; then
                                sync_local "deploy/micro-loyalty/config/backend" "config/backend" "keep"
                            fi

                            if [ "${DEPLOY_CMS}" = "true" ]; then
                                echo "Đồng bộ gói CMS Frontend..."
                                sync_local "deploy/micro-loyalty/frontend/cms" "frontend/cms" "delete"
                            fi

                            if [ "${DEPLOY_WEBVIEW}" = "true" ]; then
                                echo "Đồng bộ gói Webview Portal..."
                                sync_local "deploy/micro-loyalty/frontend/webview" "frontend/webview" "delete"
                            fi

                            if [ "${DEPLOY_PARTNER_PORTAL}" = "true" ]; then
                                echo "Đồng bộ gói Partner Portal..."
                                sync_local "deploy/micro-loyalty/frontend/partner-portal" "frontend/partner-portal" "delete"
                            fi

                            if [ "${DEPLOY_CMS}" = "true" ] || [ "${DEPLOY_WEBVIEW}" = "true" ] || [ "${DEPLOY_PARTNER_PORTAL}" = "true" ] || [ "${SYNC_FRONTEND_CONFIG}" = "true" ]; then
                                sync_local "deploy/micro-loyalty/config/frontend" "config/frontend" "keep"
                            fi

                            if [ "${DEPLOY_BACKEND}" = "true" ] || [ "${DEPLOY_CMS}" = "true" ] || [ "${DEPLOY_WEBVIEW}" = "true" ] || [ "${DEPLOY_PARTNER_PORTAL}" = "true" ] || [ "${SYNC_LOCALES}" = "true" ]; then
                                sync_local "deploy/micro-loyalty/locales" "locales" "keep"
                            fi

                            if [ "${DEPLOY_GATEWAY}" = "true" ]; then
                                echo "Đồng bộ cấu hình Nginx Gateway..."
                                sync_local "deploy/micro-loyalty/gateway" "gateway" "keep"
                                sync_local "deploy/micro-loyalty/config/nginx" "config/nginx" "keep"
                            fi

                            if [ "${SYNC_SCRIPTS}" = "true" ]; then
                                echo "Đồng bộ thư mục scripts..."
                                sync_local "deploy/micro-loyalty/scripts" "scripts" "keep"
                                chmod +x "${DEPLOY_PATH}/scripts/"*.sh
                            fi

                            if [ "${SYNC_COMPOSE}" = "true" ]; then
                                echo "Đồng bộ docker-compose.yml..."
                                cp "deploy/micro-loyalty/docker-compose.yml" "${DEPLOY_PATH}/docker-compose.yml"
                            fi

                            cd "${DEPLOY_PATH}"
                            if [ "${DEPLOY_BACKEND}" = "true" ]; then
                                if ! docker ps --format '{{.Names}}' | grep -qx 'loyalty-saas-postgres' || ! docker ps --format '{{.Names}}' | grep -qx 'loyalty-saas-redis'; then
                                    docker compose up -d postgres redis
                                fi
                            fi

                            if [ -n "${TARGET_SERVICES_LIST}" ]; then
                                echo "Rolling update chỉ các container thay đổi: ${TARGET_SERVICES_LIST}"
                                docker compose up -d --build --no-deps ${TARGET_SERVICES_LIST}
                            elif [ "${SYNC_COMPOSE}" = "true" ]; then
                                echo "Áp dụng thay đổi docker-compose.yml..."
                                docker compose up -d --no-build
                            fi

                            if [ -n "${RESTART_SERVICES_LIST}" ]; then
                                echo "Khởi động lại nhẹ các container nhận config/locales mới: ${RESTART_SERVICES_LIST}"
                                docker compose restart ${RESTART_SERVICES_LIST}
                            fi

                            docker ps --filter 'name=loyalty-saas-' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
                        '''
                    } else {
                        echo "Không thấy ${env.DEPLOY_PATH} cục bộ, chuyển sang SSH LAN ${env.DEPLOY_SERVER_LAN}:${env.DEPLOY_SERVER_PORT}..."
                        withCredentials([sshUserPrivateKey(
                            credentialsId: env.SSH_CREDENTIAL_ID,
                            keyFileVariable: 'SSH_KEY',
                            usernameVariable: 'SSH_USER_CRED'
                        )]) {
                            sh '''
                                set -e
                                SSH_USER="${SSH_USER_CRED:-$DEPLOY_SERVER_USER}"
                                SSH_OPTS="-i ${SSH_KEY} -p ${DEPLOY_SERVER_PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
                                REMOTE="${SSH_USER}@${DEPLOY_SERVER_LAN}"

                                sync_dir() {
                                    SRC_DIR="$1"
                                    DST_SUB="$2"
                                    DELETE_FLAG="$3"
                                    if command -v rsync >/dev/null 2>&1; then
                                        if [ "$DELETE_FLAG" = "delete" ]; then
                                            rsync -az --delete --exclude='._*' -e "ssh $SSH_OPTS" "${SRC_DIR}/" "${REMOTE}:${DEPLOY_PATH}/${DST_SUB}/"
                                        else
                                            rsync -az --exclude='._*' -e "ssh $SSH_OPTS" "${SRC_DIR}/" "${REMOTE}:${DEPLOY_PATH}/${DST_SUB}/"
                                        fi
                                    else
                                        if [ "$DELETE_FLAG" = "delete" ]; then
                                            ssh $SSH_OPTS "$REMOTE" "rm -rf '${DEPLOY_PATH}/${DST_SUB}' && mkdir -p '${DEPLOY_PATH}/${DST_SUB}'"
                                        else
                                            ssh $SSH_OPTS "$REMOTE" "mkdir -p '${DEPLOY_PATH}/${DST_SUB}'"
                                        fi
                                        tar --exclude='._*' -czf - -C "${SRC_DIR}" . | ssh $SSH_OPTS "$REMOTE" "tar -xzf - -C '${DEPLOY_PATH}/${DST_SUB}'"
                                    fi
                                }

                                ssh $SSH_OPTS "$REMOTE" "mkdir -p '${DEPLOY_PATH}/backend/module' '${DEPLOY_PATH}/backend/lib' '${DEPLOY_PATH}/backend/etc'"
                                if [ "${DEPLOY_BACKEND}" = "true" ]; then
                                    ssh $SSH_OPTS "$REMOTE" "
                                        if docker ps --format '{{.Names}}' | grep -qx 'loyalty-saas-postgres'; then
                                            mkdir -p '${DEPLOY_PATH}/backups'
                                            docker exec loyalty-saas-postgres pg_dump -U loyalty_app loyalty_db | gzip > '${DEPLOY_PATH}/backups/loyalty_db_pre_jenkins_\$(date +%Y%m%d_%H%M%S).sql.gz'
                                        fi
                                    "
                                    LIB_SYNC_MODE="keep"
                                    if [ "${DEPLOY_SHARED_BACKEND}" = "true" ]; then
                                        LIB_SYNC_MODE="delete"
                                    fi

                                    scp $SSH_OPTS deploy/micro-loyalty/backend/Dockerfile "${REMOTE}:${DEPLOY_PATH}/backend/Dockerfile"
                                    sync_dir "deploy/micro-loyalty/backend/module" "backend/module" "keep"
                                    sync_dir "deploy/micro-loyalty/backend/lib" "backend/lib" "${LIB_SYNC_MODE}"
                                    sync_dir "deploy/micro-loyalty/backend/etc" "backend/etc" "${LIB_SYNC_MODE}"
                                fi

                                if [ "${DEPLOY_BACKEND}" = "true" ] || [ "${SYNC_BACKEND_CONFIG}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/config/backend" "config/backend" "keep"
                                fi

                                if [ "${DEPLOY_CMS}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/frontend/cms" "frontend/cms" "delete"
                                fi

                                if [ "${DEPLOY_WEBVIEW}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/frontend/webview" "frontend/webview" "delete"
                                fi

                                if [ "${DEPLOY_PARTNER_PORTAL}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/frontend/partner-portal" "frontend/partner-portal" "delete"
                                fi

                                if [ "${DEPLOY_CMS}" = "true" ] || [ "${DEPLOY_WEBVIEW}" = "true" ] || [ "${DEPLOY_PARTNER_PORTAL}" = "true" ] || [ "${SYNC_FRONTEND_CONFIG}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/config/frontend" "config/frontend" "keep"
                                fi

                                if [ "${DEPLOY_BACKEND}" = "true" ] || [ "${DEPLOY_CMS}" = "true" ] || [ "${DEPLOY_WEBVIEW}" = "true" ] || [ "${DEPLOY_PARTNER_PORTAL}" = "true" ] || [ "${SYNC_LOCALES}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/locales" "locales" "keep"
                                fi

                                if [ "${DEPLOY_GATEWAY}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/gateway" "gateway" "keep"
                                    sync_dir "deploy/micro-loyalty/config/nginx" "config/nginx" "keep"
                                fi

                                if [ "${SYNC_SCRIPTS}" = "true" ]; then
                                    sync_dir "deploy/micro-loyalty/scripts" "scripts" "keep"
                                    ssh $SSH_OPTS "$REMOTE" "chmod +x '${DEPLOY_PATH}/scripts/'*.sh"
                                fi

                                if [ "${SYNC_COMPOSE}" = "true" ]; then
                                    scp $SSH_OPTS deploy/micro-loyalty/docker-compose.yml "${REMOTE}:${DEPLOY_PATH}/docker-compose.yml"
                                fi

                                if [ -n "${TARGET_SERVICES_LIST}" ]; then
                                    ssh $SSH_OPTS "$REMOTE" "cd '${DEPLOY_PATH}' && docker compose up -d --build --no-deps ${TARGET_SERVICES_LIST}"
                                elif [ "${SYNC_COMPOSE}" = "true" ]; then
                                    ssh $SSH_OPTS "$REMOTE" "cd '${DEPLOY_PATH}' && docker compose up -d --no-build"
                                fi

                                if [ -n "${RESTART_SERVICES_LIST}" ]; then
                                    ssh $SSH_OPTS "$REMOTE" "cd '${DEPLOY_PATH}' && docker compose restart ${RESTART_SERVICES_LIST}"
                                fi

                                ssh $SSH_OPTS "$REMOTE" "docker ps --filter 'name=loyalty-saas-' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
                            '''
                        }
                    }
                }
            }
        }

        stage('5. Health Check Verification') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.HAS_DEPLOY_CHANGES == 'true' }
                    expression { !params.DRY_RUN }
                }
            }
            steps {
                script {
                    def isLocalDocker = sh(script: "[ -d '${env.DEPLOY_PATH}' ] && command -v docker >/dev/null 2>&1", returnStatus: true) == 0

                    def checkScript = '''
                        set -e
                        GATEWAY_HOST="127.0.0.1"
                        if ! curl -s -m 2 -o /dev/null "http://127.0.0.1:18095/gateway-health"; then
                            if curl -s -m 2 -o /dev/null "http://host.docker.internal:18095/gateway-health"; then
                                GATEWAY_HOST="host.docker.internal"
                            else
                                GATEWAY_HOST="${DEPLOY_SERVER_LAN}"
                            fi
                        fi

                        service_port() {
                            case "$1" in
                                cms-service) echo 8081 ;;
                                customer-service) echo 8082 ;;
                                game-service) echo 8083 ;;
                                campaign-service) echo 8084 ;;
                                partner-service) echo 8085 ;;
                                *) echo 8081 ;;
                            esac
                        }

                        OK=0
                        for i in $(seq 1 20); do
                            ALL_UP=1
                            if ! curl -s -f "http://${GATEWAY_HOST}:18095/gateway-health" > /dev/null || \
                               ! curl -s -f "http://${GATEWAY_HOST}:18095/index.html" > /dev/null || \
                               ! curl -s -f "http://${GATEWAY_HOST}:18095/portal/index.html" > /dev/null || \
                               ! curl -s -f "http://${GATEWAY_HOST}:18095/partner-portal/index.html" > /dev/null; then
                                ALL_UP=0
                            fi

                            if [ "$ALL_UP" -eq 1 ] && [ -n "${BACKEND_SERVICES_TO_BUILD}" ] && command -v docker >/dev/null 2>&1; then
                                for svc in ${BACKEND_SERVICES_TO_BUILD}; do
                                    SVC_PORT=$(service_port "$svc")
                                    if ! docker exec "loyalty-saas-${svc}" curl -s -f "http://127.0.0.1:${SVC_PORT}/actuator/health/liveness" > /dev/null 2>&1; then
                                        ALL_UP=0
                                        break
                                    fi
                                done
                            fi

                            if [ "$ALL_UP" -eq 1 ]; then
                                OK=1
                                break
                            fi
                            echo "Lần thử $i/20 chưa sẵn sàng (${GATEWAY_HOST}:18095), chờ 4s..."
                            sleep 4
                        done

                        if [ "$OK" -ne 1 ]; then
                            echo "Healthcheck nội bộ trên server thất bại."
                            exit 1
                        fi
                    '''

                    sh checkScript

                    if (!isLocalDocker && env.BACKEND_SERVICES_TO_BUILD) {
                        withCredentials([sshUserPrivateKey(
                            credentialsId: env.SSH_CREDENTIAL_ID,
                            keyFileVariable: 'SSH_KEY',
                            usernameVariable: 'SSH_USER_CRED'
                        )]) {
                            sh '''
                                set -e
                                SSH_USER="${SSH_USER_CRED:-$DEPLOY_SERVER_USER}"
                                SSH_OPTS="-i ${SSH_KEY} -p ${DEPLOY_SERVER_PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
                                REMOTE="${SSH_USER}@${DEPLOY_SERVER_LAN}"
                                ssh $SSH_OPTS "$REMOTE" "cd '${DEPLOY_PATH}' && bash scripts/healthcheck.sh"
                            '''
                        }
                    }

                    sh '''
                        set -e
                        API_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_API_URL}" || echo "000")
                        CMS_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_CMS_URL}" || echo "000")
                        PORTAL_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_PORTAL_URL}" || echo "000")
                        PARTNER_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_PARTNER_URL}" || echo "000")
                        echo "Public Verify -> api=${API_CODE}, cms=${CMS_CODE}, portal=${PORTAL_CODE}, partner=${PARTNER_CODE}"
                        test "$API_CODE" = "200" -a "$CMS_CODE" = "200" -a "$PORTAL_CODE" = "200" -a "$PARTNER_CODE" = "200"
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.IS_MAIN_BRANCH == 'true' && env.HAS_DEPLOY_CHANGES == 'true' && !params.DRY_RUN) {
                    def scopeDesc = env.TARGET_SERVICES_LIST ?: (env.RESTART_SERVICES_LIST ? "restart:${env.RESTART_SERVICES_LIST}" : 'scripts/compose')
                    sendDeployNotification('SUCCESS', "Phân hệ cập nhật: ${scopeDesc}")
                } else {
                    echo "Không phát sinh triển khai mới (IS_MAIN_BRANCH=${env.IS_MAIN_BRANCH}, HAS_DEPLOY_CHANGES=${env.HAS_DEPLOY_CHANGES}, DRY_RUN=${params.DRY_RUN})."
                }
            }
        }
        failure {
            script {
                if (env.IS_MAIN_BRANCH == 'true') {
                    sendDeployNotification('FAILED', "Lỗi tại phân hệ: ${env.TARGET_SERVICES_LIST ?: params.TARGET_SERVICE}")
                }
            }
        }
        aborted {
            script {
                if (env.IS_MAIN_BRANCH == 'true') {
                    sendDeployNotification('ABORTED', "Build bị hủy (Targets: ${env.TARGET_SERVICES_LIST ?: params.TARGET_SERVICE})")
                }
            }
        }
        cleanup {
            script {
                try {
                    cleanWs(deleteDirs: true, notFailBuild: true, patterns: [[pattern: '.git/**', type: 'EXCLUDE']])
                } catch (Exception e) {
                    echo "cleanWs note: ${e.message}"
                }
            }
        }
    }
}

def sendDeployNotification(String status, String detail) {
    def buildNum  = env.BUILD_NUMBER ?: '0'
    def commitTag = env.IMAGE_TAG ?: 'latest'
    def buildUrl  = env.BUILD_URL ?: 'https://jenskin.mid.io.vn/job/micro-loyalty/'
    def duration  = currentBuild.durationString ?: ''
    def msg = "Build #${buildNum} | Nhánh: ${env.DETECTED_BRANCH} (${commitTag})\n${detail}\nThời gian: ${duration}\nURLs: ${env.PUBLIC_CMS_URL} | ${env.PUBLIC_PORTAL_URL} | ${env.PUBLIC_PARTNER_URL} | ${env.PUBLIC_API_URL}\nJenkins: ${buildUrl}console"

    env.NOTIFY_STATUS = status
    env.NOTIFY_MSG    = msg

    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        sh '''
            curl -s --connect-timeout 10 --max-time 20 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d "chat_id=${TELEGRAM_CHAT_ID}" \
                --data-urlencode "text=[MICRO-LOYALTY] ${NOTIFY_STATUS}: ${NOTIFY_MSG}" || true
        '''
        return
    }

    try {
        sh '''
            if [ -x "${DEPLOY_PATH}/scripts/notify_telegram.sh" ]; then
                DEPLOY_SERVER_HOST="${DEPLOY_SERVER_HOST} (LAN: ${DEPLOY_SERVER_LAN})" "${DEPLOY_PATH}/scripts/notify_telegram.sh" "${NOTIFY_MSG}" "${NOTIFY_STATUS}" || true
            elif [ -f "deploy/micro-loyalty/scripts/notify_telegram.sh" ]; then
                chmod +x deploy/micro-loyalty/scripts/notify_telegram.sh
                DEPLOY_SERVER_HOST="${DEPLOY_SERVER_HOST} (LAN: ${DEPLOY_SERVER_LAN})" bash deploy/micro-loyalty/scripts/notify_telegram.sh "${NOTIFY_MSG}" "${NOTIFY_STATUS}" || true
            else
                echo "Không tìm thấy notify_telegram.sh để gửi cảnh báo."
            fi
        '''
    } catch (Exception e) {
        echo "Telegram notification skipped: ${e.message}"
    }
}
