// ═════════════════════════════════════════════════════════════════════════════
//  Micro-Loyalty Platform | Jenkins Declarative Pipeline (SaaS Multi-Tenant)
//  Server: 35.247.156.176:65000 (LAN: 192.168.1.200)
//  Path:   /data/uc1-software/apps/micro-loyalty/deploy
//  Chính sách: Chỉ CI/CD khi nhánh main có thay đổi mã nguồn/cấu hình SaaS và
//              chỉ build/cập nhật đúng phân hệ bị thay đổi.
// ═════════════════════════════════════════════════════════════════════════════
pipeline {
    agent any

    tools {
        jdk    'jdk-21'
        nodejs 'node-20'
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
            choices: ['auto', 'loyalty-service', 'loyalty-cms', 'loyalty-webview', 'gateway', 'all'],
            description: 'auto: Tự động phát hiện và chỉ build/deploy phân hệ có thay đổi; hoặc chọn thủ công phân hệ mục tiêu'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Bỏ qua Unit Test khi build Backend (chỉ áp dụng khi loyalty-service được build)'
        )
        booleanParam(
            name: 'DRY_RUN',
            defaultValue: false,
            description: 'Chỉ kiểm tra diff và build kiểm thử, không rsync/deploy lên server'
        )
    }

    environment {
        DEPLOY_SERVER_HOST = '35.247.156.176'
        DEPLOY_SERVER_LAN  = '192.168.1.200'
        DEPLOY_SERVER_PORT = '65000'
        DEPLOY_SERVER_USER = 'root'
        DEPLOY_PATH        = '/data/uc1-software/apps/micro-loyalty/deploy'
        SSH_CREDENTIAL_ID  = 'micro-server-ssh'
        PUBLIC_API_URL     = 'https://api.mid.io.vn/actuator/health'
        PUBLIC_CMS_URL     = 'https://cms.mid.io.vn/'
        PUBLIC_PORTAL_URL  = 'https://portal.mid.io.vn/'
    }

    stages {
        stage('0. Detect Branch & Changed Components') {
            steps {
                script {
                    def branch = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst('^origin/', '').trim()
                    if (!branch) {
                        branch = sh(script: 'git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown', returnStdout: true).trim()
                    }
                    env.DETECTED_BRANCH = branch
                    env.IS_MAIN_BRANCH = (branch == 'main') ? 'true' : 'false'
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo latest', returnStdout: true).trim()

                    env.DEPLOY_BACKEND     = 'false'
                    env.DEPLOY_CMS         = 'false'
                    env.DEPLOY_WEBVIEW     = 'false'
                    env.DEPLOY_GATEWAY     = 'false'
                    env.SYNC_SCRIPTS       = 'false'
                    env.SYNC_COMPOSE       = 'false'
                    env.HAS_DEPLOY_CHANGES = 'false'
                    env.TARGET_SERVICES_LIST = ''
                    env.CHANGED_FILES_SUMMARY = ''

                    if (env.IS_MAIN_BRANCH != 'true') {
                        echo "Nhánh [${branch}] không phải 'main'. Bỏ qua toàn bộ quy trình build và deploy."
                        currentBuild.description = "SKIPPED (Branch: ${branch})"
                        return
                    }

                    if (params.TARGET_SERVICE != 'auto') {
                        switch (params.TARGET_SERVICE) {
                            case 'all':
                                env.DEPLOY_BACKEND = 'true'
                                env.DEPLOY_CMS     = 'true'
                                env.DEPLOY_WEBVIEW = 'true'
                                env.DEPLOY_GATEWAY = 'true'
                                env.SYNC_SCRIPTS   = 'true'
                                env.SYNC_COMPOSE   = 'true'
                                break
                            case 'loyalty-service':
                                env.DEPLOY_BACKEND = 'true'
                                break
                            case 'loyalty-cms':
                                env.DEPLOY_CMS = 'true'
                                break
                            case 'loyalty-webview':
                                env.DEPLOY_WEBVIEW = 'true'
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
                            if [ -n "${prevCommit}" ] && git cat-file -e "${prevCommit}^{commit}" 2>/dev/null; then
                                if [ "${prevCommit}" = "\$HEAD_SHA" ]; then
                                    exit 0
                                fi
                                git diff --name-only "${prevCommit}" "\$HEAD_SHA"
                            elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
                                git diff --name-only HEAD~1 "\$HEAD_SHA"
                            else
                                git show --pretty="" --name-only "\$HEAD_SHA"
                            fi
                        """, returnStdout: true).trim()

                        env.CHANGED_FILES_SUMMARY = changedFiles
                        echo "=== Danh sách tệp thay đổi kể từ bản triển khai thành công gần nhất ==="
                        echo changedFiles ? changedFiles : "(Không có tệp thay đổi mới)"

                        if (changedFiles) {
                            def files = changedFiles.split(/\r?\n/).collect { it.trim() }.findAll { it }
                            for (String f : files) {
                                // Bỏ qua tài liệu, kế hoạch, skills, bộ test thuần túy, cấu hình Jenkins và môi trường Natcash
                                if (f.startsWith('docs/') || f.startsWith('plan/') || f.startsWith('.agents/') ||
                                    f.startsWith('deploy/natcash/') || f.startsWith('deploy/micro-loyalty/ci-cd/') ||
                                    f == 'Jenkinsfile' || f == 'README.md' || f.endsWith('.md')) {
                                    continue
                                }

                                if (f.startsWith('src/service/') || f.startsWith('src/lib/') ||
                                    f == 'pom.xml' || f == 'mvnw' || f == 'mvnw.cmd' || f.startsWith('.mvn/') ||
                                    f.startsWith('deploy/micro-loyalty/backend/') || f.startsWith('deploy/micro-loyalty/config/backend/')) {
                                    env.DEPLOY_BACKEND = 'true'
                                }

                                if (f.startsWith('src/cms/') || f.startsWith('deploy/micro-loyalty/frontend/cms/') ||
                                    f.startsWith('deploy/micro-loyalty/config/frontend/')) {
                                    env.DEPLOY_CMS = 'true'
                                }

                                if (f.startsWith('src/webview/') || f.startsWith('deploy/micro-loyalty/frontend/webview/') ||
                                    f.startsWith('deploy/micro-loyalty/config/frontend/')) {
                                    env.DEPLOY_WEBVIEW = 'true'
                                }

                                if (f.startsWith('deploy/micro-loyalty/locales/')) {
                                    env.DEPLOY_BACKEND = 'true'
                                    env.DEPLOY_CMS     = 'true'
                                    env.DEPLOY_WEBVIEW = 'true'
                                }

                                if (f.startsWith('deploy/micro-loyalty/gateway/') ||
                                    f == 'deploy/micro-loyalty/config/nginx/nginx-saas.conf') {
                                    env.DEPLOY_GATEWAY = 'true'
                                }

                                if (f.startsWith('deploy/micro-loyalty/scripts/')) {
                                    env.SYNC_SCRIPTS = 'true'
                                }

                                if (f == 'deploy/micro-loyalty/docker-compose.yml') {
                                    env.SYNC_COMPOSE = 'true'
                                }
                            }
                        }
                    }

                    def services = []
                    if (env.DEPLOY_BACKEND == 'true') services.add('loyalty-service')
                    if (env.DEPLOY_CMS     == 'true') services.add('loyalty-cms')
                    if (env.DEPLOY_WEBVIEW == 'true') services.add('loyalty-webview')
                    if (env.DEPLOY_GATEWAY == 'true') services.add('gateway')

                    env.TARGET_SERVICES_LIST = services.join(' ')
                    if (services.size() > 0 || env.SYNC_COMPOSE == 'true' || env.SYNC_SCRIPTS == 'true') {
                        env.HAS_DEPLOY_CHANGES = 'true'
                    }

                    echo """
=== TỔNG HỢP PHẠM VI CI/CD ===
• Branch        : ${env.DETECTED_BRANCH} (${env.IMAGE_TAG})
• Mode          : ${params.TARGET_SERVICE} | DRY_RUN=${params.DRY_RUN}
• Backend       : ${env.DEPLOY_BACKEND}
• CMS           : ${env.DEPLOY_CMS}
• Webview       : ${env.DEPLOY_WEBVIEW}
• Gateway       : ${env.DEPLOY_GATEWAY}
• Scripts/Compose: scripts=${env.SYNC_SCRIPTS}, compose=${env.SYNC_COMPOSE}
• Docker Targets: ${env.TARGET_SERVICES_LIST ?: '(Không có container cần build lại)'}
                    """.stripIndent()

                    if (env.HAS_DEPLOY_CHANGES != 'true') {
                        currentBuild.description = "SKIPPED (No SaaS code changes)"
                    } else if (params.DRY_RUN) {
                        currentBuild.description = "DRY-RUN: ${env.TARGET_SERVICES_LIST ?: 'scripts/compose'}"
                    } else {
                        currentBuild.description = "Deploy: ${env.TARGET_SERVICES_LIST ?: 'scripts/compose'}"
                    }
                }
            }
        }

        stage('1. Build Backend (loyalty-service)') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.DEPLOY_BACKEND == 'true' }
                }
            }
            steps {
                script {
                    echo "Đóng gói Backend Spring Boot (Reactor 15 Modules)..."
                    sh 'chmod +x ./mvnw'
                    if (params.SKIP_TESTS) {
                        sh './mvnw clean package -DskipTests -B'
                    } else {
                        sh './mvnw clean package -B'
                    }
                    sh '''
                        mkdir -p deploy/micro-loyalty/backend
                        JAR_FILE=$(ls -1 src/service/target/loyalty-service-*.jar | grep -vF '.original' | head -n 1)
                        test -n "$JAR_FILE"
                        cp "$JAR_FILE" deploy/micro-loyalty/backend/loyalty-service.jar
                        ls -lh deploy/micro-loyalty/backend/loyalty-service.jar
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
                        npm ci
                        npx tsc --noEmit
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

        stage('4. Selective Rsync & Rolling Deploy') {
            when {
                allOf {
                    expression { env.IS_MAIN_BRANCH == 'true' }
                    expression { env.HAS_DEPLOY_CHANGES == 'true' }
                    expression { !params.DRY_RUN }
                }
            }
            steps {
                script {
                    withCredentials([sshUserPrivateKey(
                        credentialsId: env.SSH_CREDENTIAL_ID,
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER_CRED'
                    )]) {
                        sh '''
                            set -e
                            SSH_USER="${SSH_USER_CRED:-$DEPLOY_SERVER_USER}"
                            SSH_OPTS="-i ${SSH_KEY} -p ${DEPLOY_SERVER_PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
                            REMOTE="${SSH_USER}@${DEPLOY_SERVER_HOST}"

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

                            if [ "${DEPLOY_BACKEND}" = "true" ]; then
                                echo "Sao lưu CSDL PostgreSQL trước khi cập nhật Backend..."
                                BACKUP_TS=$(date +%Y%m%d_%H%M%S)
                                ssh $SSH_OPTS "$REMOTE" "mkdir -p ${DEPLOY_PATH}/backups && docker exec loyalty-saas-postgres pg_dump -U loyalty_app loyalty_db | gzip > ${DEPLOY_PATH}/backups/loyalty_db_pre_jenkins_${BACKUP_TS}.sql.gz"
                                sync_dir "deploy/micro-loyalty/backend" "backend" "delete"
                                sync_dir "deploy/micro-loyalty/config/backend" "config/backend" "keep"
                            fi

                            if [ "${DEPLOY_CMS}" = "true" ]; then
                                echo "Đồng bộ gói CMS Frontend..."
                                sync_dir "deploy/micro-loyalty/frontend/cms" "frontend/cms" "delete"
                            fi

                            if [ "${DEPLOY_WEBVIEW}" = "true" ]; then
                                echo "Đồng bộ gói Webview Portal..."
                                sync_dir "deploy/micro-loyalty/frontend/webview" "frontend/webview" "delete"
                            fi

                            if [ "${DEPLOY_CMS}" = "true" ] || [ "${DEPLOY_WEBVIEW}" = "true" ]; then
                                sync_dir "deploy/micro-loyalty/config/frontend" "config/frontend" "keep"
                            fi

                            if [ "${DEPLOY_BACKEND}" = "true" ] || [ "${DEPLOY_CMS}" = "true" ] || [ "${DEPLOY_WEBVIEW}" = "true" ]; then
                                sync_dir "deploy/micro-loyalty/locales" "locales" "keep"
                            fi

                            if [ "${DEPLOY_GATEWAY}" = "true" ]; then
                                echo "Đồng bộ cấu hình Nginx Gateway..."
                                sync_dir "deploy/micro-loyalty/gateway" "gateway" "keep"
                                sync_dir "deploy/micro-loyalty/config/nginx" "config/nginx" "keep"
                            fi

                            if [ "${SYNC_SCRIPTS}" = "true" ]; then
                                echo "Đồng bộ thư mục scripts..."
                                sync_dir "deploy/micro-loyalty/scripts" "scripts" "keep"
                                ssh $SSH_OPTS "$REMOTE" "chmod +x ${DEPLOY_PATH}/scripts/*.sh"
                            fi

                            if [ "${SYNC_COMPOSE}" = "true" ]; then
                                echo "Đồng bộ docker-compose.yml..."
                                scp -P "${DEPLOY_SERVER_PORT}" -i "${SSH_KEY}" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null deploy/micro-loyalty/docker-compose.yml "${REMOTE}:${DEPLOY_PATH}/docker-compose.yml"
                            fi

                            if [ -n "${TARGET_SERVICES_LIST}" ]; then
                                echo "Rolling update chỉ các container thay đổi: ${TARGET_SERVICES_LIST}"
                                ssh $SSH_OPTS "$REMOTE" "cd ${DEPLOY_PATH} && docker compose up -d --build --no-deps ${TARGET_SERVICES_LIST}"
                            elif [ "${SYNC_COMPOSE}" = "true" ]; then
                                echo "Áp dụng thay đổi docker-compose.yml (không ép build lại phân hệ khác)..."
                                ssh $SSH_OPTS "$REMOTE" "cd ${DEPLOY_PATH} && docker compose up -d --no-build"
                            fi

                            ssh $SSH_OPTS "$REMOTE" "docker ps --filter 'name=loyalty-saas-' --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'"
                        '''
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
                    withCredentials([sshUserPrivateKey(
                        credentialsId: env.SSH_CREDENTIAL_ID,
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER_CRED'
                    )]) {
                        sh '''
                            set -e
                            SSH_USER="${SSH_USER_CRED:-$DEPLOY_SERVER_USER}"
                            SSH_OPTS="-i ${SSH_KEY} -p ${DEPLOY_SERVER_PORT} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
                            REMOTE="${SSH_USER}@${DEPLOY_SERVER_HOST}"

                            OK=0
                            for i in $(seq 1 20); do
                                if ssh $SSH_OPTS "$REMOTE" "cd ${DEPLOY_PATH} && ./scripts/healthcheck.sh"; then
                                    OK=1
                                    break
                                fi
                                echo "Lần thử $i/20 chưa sẵn sàng, chờ 4s..."
                                sleep 4
                            done

                            if [ "$OK" -ne 1 ]; then
                                echo "Healthcheck nội bộ trên server thất bại."
                                exit 1
                            fi

                            API_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_API_URL}" || echo "000")
                            CMS_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_CMS_URL}" || echo "000")
                            PORTAL_CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "${PUBLIC_PORTAL_URL}" || echo "000")
                            echo "Public Verify -> api=${API_CODE}, cms=${CMS_CODE}, portal=${PORTAL_CODE}"
                            test "$API_CODE" = "200" -a "$CMS_CODE" = "200" -a "$PORTAL_CODE" = "200"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.IS_MAIN_BRANCH == 'true' && env.HAS_DEPLOY_CHANGES == 'true' && !params.DRY_RUN) {
                    sendDeployNotification('SUCCESS', "Phân hệ cập nhật: ${env.TARGET_SERVICES_LIST ?: 'scripts/compose'}")
                } else {
                    echo "Không phát sinh triển khai mới (HAS_DEPLOY_CHANGES=${env.HAS_DEPLOY_CHANGES}, DRY_RUN=${params.DRY_RUN})."
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
    def buildUrl  = env.BUILD_URL ?: 'https://jenkins.dip.io.vn/jenkins/job/Micro-Loyalty/'
    def duration  = currentBuild.durationString ?: ''
    def msg = "Build #${buildNum} | Nhánh: ${env.DETECTED_BRANCH} (${commitTag})\n${detail}\nThời gian: ${duration}\nURLs: ${env.PUBLIC_CMS_URL} | ${env.PUBLIC_PORTAL_URL} | ${env.PUBLIC_API_URL}\nJenkins: ${buildUrl}console"

    env.NOTIFY_STATUS = status
    env.NOTIFY_MSG    = msg

    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        sh '''
            curl -s --connect-timeout 10 --max-time 20 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d "chat_id=${TELEGRAM_CHAT_ID}" \
                --data-urlencode "text=[MICRO-LOYALTY] ${NOTIFY_STATUS}: ${NOTIFY_MSG}" >/dev/null 2>&1 || true
        '''
        return
    }

    try {
        withCredentials([sshUserPrivateKey(
            credentialsId: env.SSH_CREDENTIAL_ID,
            keyFileVariable: 'SSH_KEY',
            usernameVariable: 'SSH_USER_CRED'
        )]) {
            sh """
                SSH_USER="\${SSH_USER_CRED:-\$DEPLOY_SERVER_USER}"
                printf '%s' "\$NOTIFY_MSG" | ssh -i "\${SSH_KEY}" -p "\${DEPLOY_SERVER_PORT}" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "\${SSH_USER}@\${DEPLOY_SERVER_HOST}" \
                    "MSG=\\\$(cat) && DEPLOY_SERVER_HOST='\${DEPLOY_SERVER_HOST} (LAN: \${DEPLOY_SERVER_LAN})' \${DEPLOY_PATH}/scripts/notify_telegram.sh \"\\\$MSG\" '\${NOTIFY_STATUS}'" >/dev/null 2>&1 || true
            """
        }
    } catch (Exception e) {
        echo "Telegram notification skipped: ${e.message}"
    }
}
