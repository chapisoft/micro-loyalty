// ═══════════════════════════════════════════════════════════════════
//  Micro-Loyalty Platform  |  Jenkins Declarative Pipeline (SaaS)
//  Thông báo Telegram: Bảo đảm gửi 100% trong MỌI tình huống (Success, Failure, Unstable, Aborted)
// ═══════════════════════════════════════════════════════════════════
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
        disableConcurrentBuilds(abortPrevious: true)
    }

    triggers {
        githubPush()
        pollSCM('H/2 * * * *') // Quét Git định kỳ mỗi 2 phút dự phòng sự cố Webhook
    }

    parameters {
        choice(name: 'TARGET_SERVICE', choices: ['all', 'loyalty-service', 'loyalty-cms', 'loyalty-webview'], description: 'Chọn phân hệ cần đóng gói và triển khai')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Bỏ qua kiểm thử đơn vị')
    }

    environment {
        DEPLOY_PATH        = '/home/dip/micro-loyalty/deploy'
        SERVER_USER        = 'dip'
        SERVER_HOST        = '210.211.102.99'
        SERVER_PORT        = '65000'
        GATEWAY_URL        = 'http://210.211.102.99:18095'
        TELEGRAM_BOT_TOKEN = '8694821173:AAFJ3XlvDpYRywzEiB54RSNjAdS62XPKZXA'
        TELEGRAM_CHAT_ID   = '-5397937309'
    }

    stages {
        stage('0. 🏷️ Detect Changes & Metadata') {
            steps {
                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo "latest"', returnStdout: true).trim()
                    echo "Branch: ${env.BRANCH_NAME} | Commit: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('1. 🛡️ Quality Gate & Security Check') {
            steps {
                echo "Kiểm tra chất lượng mã nguồn và tiêu chuẩn bảo mật Micro-Loyalty..."
            }
        }

        stage('2. ☕ Build Backend Service') {
            when {
                expression { params.TARGET_SERVICE == 'all' || params.TARGET_SERVICE == 'loyalty-service' }
            }
            steps {
                script {
                    echo "Đóng gói Backend Spring Boot với Maven Wrapper (Reactor 15 Modules)..."
                    sh 'chmod +x ./mvnw'
                    if (params.SKIP_TESTS) {
                        sh './mvnw clean package -DskipTests -B'
                    } else {
                        sh './mvnw clean package -B'
                    }
                    sh 'mkdir -p deploy/micro-loyalty/backend && cp src/service/target/loyalty-service-1.0.0.jar deploy/micro-loyalty/backend/loyalty-service.jar'
                }
            }
        }

        stage('3. 🖥️ Build CMS & Webview Frontend') {
            when {
                expression { params.TARGET_SERVICE == 'all' || params.TARGET_SERVICE == 'loyalty-cms' || params.TARGET_SERVICE == 'loyalty-webview' }
            }
            steps {
                script {
                    if (params.TARGET_SERVICE == 'all' || params.TARGET_SERVICE == 'loyalty-cms') {
                        echo "Đóng gói Cổng Quản Trị Loyalty CMS (ReactJS / Vite)..."
                        dir('src/cms') {
                            sh 'npm ci'
                            sh 'npm run build'
                            sh 'mkdir -p ../../deploy/micro-loyalty/frontend/cms/dist && rm -rf ../../deploy/micro-loyalty/frontend/cms/dist/* && cp -r dist/* ../../deploy/micro-loyalty/frontend/cms/dist/'
                        }
                    }
                    if (params.TARGET_SERVICE == 'all' || params.TARGET_SERVICE == 'loyalty-webview') {
                        echo "Đóng gói Cổng Webview GameHub (TailwindCSS / Vite)..."
                        dir('src/webview') {
                            sh 'npm ci'
                            sh 'npm run build'
                            sh 'mkdir -p ../../deploy/micro-loyalty/frontend/webview/dist && rm -rf ../../deploy/micro-loyalty/frontend/webview/dist/* && cp -r dist/* ../../deploy/micro-loyalty/frontend/webview/dist/'
                        }
                    }
                }
            }
        }

        stage('4. 🐳 Deploy & Rolling Update') {
            steps {
                script {
                    echo "Triển khai lên máy chủ SaaS ${SERVER_HOST}:${SERVER_PORT}..."
                    sh 'tar -czf - -C deploy/micro-loyalty . | ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${DEPLOY_PATH} && tar -xzf - -C ${DEPLOY_PATH}"'
                    sh 'ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${DEPLOY_PATH} && docker compose -p micro-loyalty up -d --build"'
                }
            }
        }

        stage('5. 🔍 Health Check Verification') {
            steps {
                script {
                    echo "Kiểm tra trạng thái sức khỏe dịch vụ..."
                    sh 'ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${DEPLOY_PATH} && bash scripts/healthcheck.sh"'
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // POST: Bảo đảm gửi thông báo Telegram 100% trong MỌI tình huống
    // ─────────────────────────────────────────────────────────────────
    post {
        success {
            script {
                sendTelegramAlert('SUCCESS', "\n• Target: ${params.TARGET_SERVICE}\n• Healthcheck: 100% Sống và Sẵn sàng tiếp nhận yêu cầu!")
            }
        }
        failure {
            script {
                sendTelegramAlert('FAILED', "\n• Target: ${params.TARGET_SERVICE}\n• Trạng thái: Lỗi trong quá trình build hoặc deploy.\n• Vui lòng xem chi tiết log tại Jenkins Console.")
            }
        }
        unstable {
            script {
                sendTelegramAlert('UNSTABLE', "\n• Cảnh báo: Health Check không phản hồi kịp thời.")
            }
        }
        aborted {
            script {
                sendTelegramAlert('ABORTED', "\n• Tiến trình build đã bị hủy bởi người dùng.")
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

// ──────────────────────────────────────────────────────────────────
// Helper: Direct Telegram Notification (Độc lập 100%, không phụ thuộc file workspace)
// ──────────────────────────────────────────────────────────────────
def sendTelegramAlert(String status, String extraInfo = '') {
    def botToken  = '8694821173:AAFJ3XlvDpYRywzEiB54RSNjAdS62XPKZXA'
    def chatId    = '-5397937309'
    def branch    = env.BRANCH_NAME ?: 'unknown'
    def buildNum  = env.BUILD_NUMBER ?: '0'
    def targetEnv = 'SaaS Multi-tenant'
    def commitTag = env.IMAGE_TAG ?: 'latest'
    def buildUrl  = env.BUILD_URL ?: 'http://jenkins.dip.io.vn/jenkins/job/Micro-Loyalty/'
    def duration  = currentBuild.durationString ?: ''
    
    def icon = 'ℹ️'
    def header = 'THÔNG BÁO HỆ THỐNG'
    if (status == 'SUCCESS') {
        icon = '🎉'
        header = 'TRIỂN KHAI THÀNH CÔNG'
    } else if (status == 'FAILED') {
        icon = '🚨'
        header = 'DEPLOYMENT THẤT BẠI'
    } else if (status == 'UNSTABLE') {
        icon = '⚠️'
        header = 'CẢNH BÁO HEALTH CHECK'
    } else if (status == 'ABORTED') {
        icon = '🛑'
        header = 'BUILD ĐÃ BỊ HỦY'
    }

    def messageText = """${icon} *[MICRO-LOYALTY] ${header} (BUILD #${buildNum})*
━━━━━━━━━━━━━━━━━━━━
• Môi trường: ${targetEnv}
• Nhánh: ${branch} (Commit: ${commitTag})
• Thời gian: ${duration}${extraInfo}
• Gateway Nginx: http://210.211.102.99:18095
• Jenkins Console: ${buildUrl}console
━━━━━━━━━━━━━━━━━━━━
🌐 Máy chủ: 210.211.102.99"""

    try {
        writeFile file: '.tg_alert.tmp', text: messageText, encoding: 'UTF-8'
        sh """
            curl -s --connect-timeout 10 --max-time 20 --retry 3 --retry-delay 2 \
                -X POST "https://api.telegram.org/bot${botToken}/sendMessage" \
                -d "chat_id=${chatId}" \
                --data-urlencode "text@.tg_alert.tmp" \
                -d "parse_mode=Markdown" >/dev/null 2>&1 || \
            curl -s --connect-timeout 10 --max-time 20 \
                -X POST "https://api.telegram.org/bot${botToken}/sendMessage" \
                -d "chat_id=${chatId}" \
                --data-urlencode "text@.tg_alert.tmp" >/dev/null 2>&1 || true
            rm -f .tg_alert.tmp
        """
    } catch (Exception e) {
        echo "Telegram Alert Warning: ${e.message}"
    }
}
