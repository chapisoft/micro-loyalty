# HỆ SINH THÁI KHÁCH HÀNG THÂN THIẾT LIÊN MINH VÀ CỔNG GAME ĐA THUÊ BAO (MICRO-LOYALTY)

Tài liệu tổng quan hệ sinh thái phần mềm Dịch vụ Khách hàng thân thiết liên minh và Cổng Game đa thuê bao, cung cấp nền tảng tích điểm hợp nhất, phân hạng hội viên, liên thông Ví Phần Thưởng tại điểm bán và trò chơi hóa giải trí.

---

## 1. TỔNG QUAN HỆ THỐNG VÀ BỘ SẢN PHẨM BÀN GIAO

Hệ thống được thiết kế theo kiến trúc dịch vụ vi mô độc lập, phục vụ mô hình phần mềm dịch vụ đa thuê bao bao trùm dịch vụ ví điện tử Natcash, mạng viễn thông Natcom và mạng lưới các đối tác thương mại bán lẻ liên minh.

```mermaid
flowchart LR
    subgraph S_PORTAL ["TẦNG TRÌNH DIỄN VÀ QUẢN TRỊ"]
        direction TB
        P_APP["1. Ứng Dụng Di Động Natcash<br/>• Ứng dụng ví di động (React Native)<br/>• Trung tâm Loyalty, GameHub, Vòng quay<br/>• Mã QR Ví Phần Thưởng động 60 giây"]
        P_WEBVIEW["2. Cổng Webview Nhúng Đối Tác<br/>• loyalty-webview (ReactJS / Vite / Nginx)<br/>• Nhúng trực tiếp vào ứng dụng đối tác<br/>• Cầu nối JSBridge hai chiều & Tùy biến giao diện"]
        P_CMS["3. Cổng Quản Trị Trung Tâm<br/>• loyalty-cms (ReactJS / Vite / Nginx)<br/>• Cấu hình chính sách, hạn mức, đối soát<br/>• Quản lý danh mục game, sự kiện, kho quà"]
        P_APP --> P_WEBVIEW
        P_WEBVIEW --> P_CMS
    end

    subgraph S_BACKEND ["TẦNG MÁY CHỦ VÀ DỮ LIỆU ĐỘC LẬP"]
        direction TB
        B_GW["4. Cổng Chuyển Tiếp API Gateway<br/>• natcash-eu-api (Spring Boot Reverse Proxy)<br/>• Xác thực JWT, gắn tiêu đề X-Tenant-Id<br/>• Đồng bộ hai chiều qua API & Webhook"]
        B_SVC["5. Dịch Vụ Độc Lập loyalty-service<br/>• Java 17 LTS / Spring Boot 3.5.3<br/>• 7 phân hệ nghiệp vụ, sổ cái điểm, gợi nhắc<br/>• Tiến trình quét Webhook Outbox & Batch Jobs"]
        B_DATA["6. Hạ Tầng Dữ Liệu Độc Lập<br/>• PostgreSQL 15+ độc lập (loyalty_db)<br/>• Redis 7.x Cluster (Redisson Lock & Đệm)<br/>• Redis Streams (Hàng đợi sự kiện tinh gọn)"]
        B_GW --> B_SVC
        B_SVC <--> B_DATA
    end

    P_CMS --> B_SVC
    P_APP --> B_GW
    P_WEBVIEW --> B_SVC
```

### Bộ Sản Phẩm Bàn Giao Cốt Lõi:
1. **Dịch vụ máy chủ nghiệp vụ độc lập (`loyalty-service`):** Xây dựng trên nền tảng Java 17 LTS và Spring Boot 3.5.3, quản lý cơ sở dữ liệu quan hệ độc lập `loyalty_db` trên PostgreSQL 15+ (tách biệt 100% với `natcash_db`).
2. **Cổng thông tin quản trị trung tâm (`loyalty-cms`):** Xây dựng trên nền tảng ReactJS 18+, TypeScript, Vite, Ant Design 5.x, đóng gói ứng dụng trang đơn tĩnh phục vụ qua máy chủ Nginx.
3. **Cổng Webview nhúng đa nền tảng (`loyalty-webview`):** Xây dựng trên nền tảng ReactJS 18+, Vite, TailwindCSS Mobile-First, tích hợp thư viện cầu nối `LoyaltyJSBridge` và xác thực vé một lần.
4. **Cổng nhà phát triển và trình giả lập (`loyalty-sandbox`):** Cổng tự phục vụ dành cho nhà phát triển đối tác để tra cứu API, tính chữ ký HMAC-SHA256 và thử nghiệm bắn Webhook.
5. **Bộ tích hợp Ứng dụng di động (`natcash-eu-app`):** Tích hợp màn hình Trung tâm Loyalty, Mã QR Ví Phần Thưởng động 60 giây, Cổng Game và Vòng quay may mắn trên ứng dụng React Native.
6. **Cổng chuyển tiếp trung gian (`natcash-eu-api`):** Đóng vai trò Cổng kết nối chuyển tiếp xác thực người dùng, đồng bộ hai chiều và tiếp nhận Webhook.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```
micro-loyalty/
├── .agents/                            # Quy chuẩn phiên làm việc và kỹ năng tự động
├── deploy/                             # Gói đóng gói và triển khai phân lập theo môi trường
│   ├── backend/                        # Dockerfile bất biến cho Java Spring Boot
│   ├── frontend/                       # Dockerfile bất biến cho Nginx SPA
│   ├── micro-loyalty/                  # Môi trường SaaS Đa Thuê Bao (210.211.102.99:65000 dip)
│   │   ├── config/                     # Cấu hình ngoại vi Backend, Frontend & Nginx Virtual Hosts
│   │   ├── scripts/                    # Kịch bản quản trị start.sh, stop.sh, healthcheck.sh
│   │   ├── docker-compose.yml          # Cụm 6 vùng chứa SaaS khép kín
│   │   ├── deploy-guild.md             # Hướng dẫn chi tiết triển khai môi trường SaaS
│   │   └── .env.example                # Mẫu biến môi trường SaaS
│   └── natcash/                        # Môi trường On-Premise Tại Chỗ (10.228.37.65:22 mascom)
│       ├── config/                     # Cấu hình Native JVM, Nginx & Database Natcash
│       ├── scripts/                    # Kịch bản cài đặt, nạp cấu hình và khởi chạy Native
│       ├── deploy-guild.md             # Hướng dẫn chi tiết triển khai môi trường On-Premise
│       └── .env.example                # Mẫu biến môi trường Natcash
├── docs/                               # Hồ sơ tài liệu thiết kế và giải pháp
│   ├── ba/                             # Khối tài liệu nghiệp vụ (solution.md, detailed_design.md)
│   └── dev/                            # Khối tài liệu kỹ thuật (codebase.md)
├── plan/                               # Kế hoạch sản xuất và theo dõi tiến độ WBS
└── src/                                # Toàn bộ mã nguồn triển khai thực tế
    ├── lib/                            # Thư viện dùng chung (ims-libraries, loyalty-engine)
    ├── service/                        # Máy chủ nghiệp vụ Java 17 LTS / Spring Boot 3.5.3 (loyalty-service)
    ├── cms/                            # Cổng quản trị trung tâm ReactJS 18 / Ant Design 5 (loyalty-cms)
    ├── webview/                        # Cổng Webview nhúng di động TailwindCSS (loyalty-webview)
    └── sandbox/                        # Cổng nhà phát triển đối tác (loyalty-sandbox)
```

---

## 3. HƯỚNG DẪN KHỞI CHẠY VÀ PHÁT TRIỂN CỤC BỘ (LOCAL DEVELOPMENT)

### 3.1. Yêu Cầu Môi Trường Máy Trạm
* **Java Development Kit (JDK):** Phiên bản 17 LTS (Eclipse Temurin hoặc OpenJDK 17).
* **Apache Maven:** Phiên bản 3.8+ trở lên.
* **Node.js & NPM:** Node.js 18 LTS hoặc 20 LTS, npm 9+.
* **Docker Engine & Docker Compose:** Docker Desktop hoặc Docker Engine 24.x trở lên.

---

### 3.2. Bước 1: Khởi Chạy Hạ Tầng Dữ Liệu Cục Bộ (PostgreSQL 15 & Redis 7)

Sử dụng Docker Compose để tạo nhanh vùng chứa cơ sở dữ liệu và bộ nhớ đệm cục bộ:

```bash
# Khởi chạy PostgreSQL 15 và Redis 7 ở chế độ ngầm
cd deploy/micro-loyalty
docker compose up -d postgres redis

# Kiểm tra trạng thái vùng chứa dữ liệu
docker compose ps
```

* PostgreSQL cục bộ: Cổng `15435` (hoặc cấu hình nội bộ `5432`), Người dùng: `loyalty_app`, Mật khẩu: `Loyalty_SecureDB2026!`, Cơ sở dữ liệu: `loyalty_db`.
* Redis cục bộ: Cổng `16385` (hoặc cấu hình nội bộ `6379`), Mật khẩu: `Loyalty_RedisPass2026!`.

---

### 3.3. Bước 2: Biên Dịch Và Khởi Chạy Máy Chủ Nghiệp Vụ (`loyalty-service`)

```bash
# 1. Di chuyển vào thư mục mã nguồn Backend
cd src/service

# 2. Biên dịch và đóng gói bỏ qua kiểm thử
mvn clean package -DskipTests

# 3. Khởi chạy ứng dụng máy chủ với cấu hình cục bộ
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

* Điểm cuối kiểm tra sức khỏe cục bộ: `http://localhost:8088/actuator/health`
* Giao diện tra cứu OpenAPI Swagger UI: `http://localhost:8088/swagger-ui/index.html`
* Tệp đặc tả JSON OpenAPI 3: `http://localhost:8088/v3/api-docs`

---

### 3.4. Bước 3: Khởi Chạy Các Cổng Giao Diện Frontend

#### Khởi chạy Cổng Quản Trị Trung Tâm (`cms`):
```bash
cd src/cms
npm install
npm run dev
```
* Ứng dụng chạy tại: `http://localhost:5173/`

#### Khởi chạy Cổng Webview GameHub (`webview`):
```bash
cd src/webview
npm install
npm run dev
```
* Ứng dụng chạy tại: `http://localhost:5174/`

#### Khởi chạy Cổng Sandbox Nhà Phát Triển (`sandbox`):
```bash
cd src/sandbox
npm install
npm run dev
```
* Ứng dụng chạy tại: `http://localhost:5175/`

---

### 3.5. Bước 4: Chạy Kiểm Thử Đơn Vị Tự Động (Unit Tests)

```bash
# Chạy toàn bộ 56 ca kiểm thử tự động tầng Backend
cd src/service
mvn clean test
```

---

## 4. QUY TRÌNH ĐÓNG GÓI VÀ TRIỂN KHAI LÊN MÁY CHỦ (DEPLOYMENT GUIDE)

> **NGUYÊN TẮC AN TOÀN VẬN HÀNH BẮT BUỘC:**  
> Tuyệt đối không tự ý chạy các lệnh triển khai (deploy), đồng bộ tệp hay tác động lên máy chủ từ xa khi chưa có yêu cầu tường minh từ người dùng. Toàn bộ mã nguồn phải được kiểm thử đạt kết quả 100% tại môi trường máy trạm cục bộ trước khi nhận lệnh triển khai.

---

### 4.1. Môi Trường 1: SaaS Đa Thuê Bao (`deploy/micro-loyalty/`)
* **Hạ tầng máy chủ:** `210.211.102.99:65000` (Tài khoản: `dip`, Ubuntu Linux 22.04 LTS).
* **Đồng hạ tầng:** Vận hành cùng cụm Nền tảng DIP và Smart-OTP.
* **Hệ thống tên miền:** `api.mid.io.vn`, `docs.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn` (Gốc: `mid.io.vn`).

#### Quy Trình Đóng Gói Và Triển Khai SaaS:
```bash
# Bước 1: Đóng gói bản dựng Backend
cd src/service
mvn clean package -DskipTests
cp target/loyalty-service-1.0.0.jar ../../deploy/micro-loyalty/backend/loyalty-service.jar

# Bước 2: Đóng gói bản dựng Frontend CMS & Webview
cd ../cms
npm run build
rm -rf ../../deploy/micro-loyalty/frontend/cms/dist
cp -r dist ../../deploy/micro-loyalty/frontend/cms/dist

cd ../webview
npm run build
rm -rf ../../deploy/micro-loyalty/frontend/webview/dist
cp -r dist ../../deploy/micro-loyalty/frontend/webview/dist

# Bước 3: Đồng bộ gói triển khai lên máy chủ UAT
cd ../../
tar -czf - -C deploy/micro-loyalty . | ssh -i ~/.ssh/jenkins_deploy_dev -p 65000 dip@210.211.102.99 "mkdir -p /home/dip/micro-loyalty/deploy && tar -xzf - -C /home/dip/micro-loyalty/deploy"

# Bước 4: Nạp cấu hình Nginx Virtual Host và khởi chạy vùng chứa trên máy chủ
ssh -i ~/.ssh/jenkins_deploy_dev -p 65000 dip@210.211.102.99 "
cat /home/dip/micro-loyalty/deploy/config/nginx/host-loyalty-vhost.conf > /home/dip/dip/deploy/gateway/config/conf.d/micro-loyalty.conf
docker exec \$(docker ps -q --filter 'name=gateway_stack_nginx') nginx -s reload
cd /home/dip/micro-loyalty/deploy
docker compose -p micro-loyalty up -d --build
"
```

---

### 4.2. Môi Trường 2: On-Premise Tại Chỗ Ví Natcash (`deploy/natcash/`)
* **Hạ tầng máy chủ:** Máy chủ vật lý riêng biệt `10.228.37.65:22` (Tài khoản: `mascom`, CentOS Linux 7).
* **Phương thức vận hành:** Dịch vụ Native Java thực thi trực tiếp qua JDK 17 (Cổng `8085`), PostgreSQL có sẵn (Cổng `5432`), Redis có sẵn (Cổng `6379`), Nginx phân lập cổng `8443` và cổng `8080`.

#### Quy Trình Triển Khai On-Premise:
```bash
# 1. Đóng gói bản dựng Backend
cd src/service
mvn clean package -DskipTests

# 2. Truyền tệp thực thi sang máy chủ Natcash
scp -P 22 target/loyalty-service-1.0.0.jar mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/app/loyalty-service.jar

# 3. Khởi động lại dịch vụ Native qua kịch bản start.sh
ssh -p 22 mascom@10.228.37.65 "bash /u01/mascom/ringme/loyalty-game/scripts/start.sh"
```

---

## 5. HƯỚNG DẪN KIỂM TRA NHẬT KÝ VẬN HÀNH THỦ CÔNG (LOG INSPECTION)

### 5.1. Xem Nhật Ký Trực Tiếp Trên Môi Trường SaaS (Docker Containers)

| Dịch vụ cần kiểm tra | Câu lệnh xem nhật ký thời gian thực | Câu lệnh lọc lỗi hoặc cảnh báo |
| :--- | :--- | :--- |
| **Máy chủ Backend (`loyalty-service`)** | `docker logs -f --tail 100 loyalty-saas-service` | `docker logs loyalty-saas-service \| grep -E 'ERROR\|WARN'` |
| **Cổng Nginx Gateway Nội Bộ** | `docker logs -f --tail 100 loyalty-saas-gateway` | `docker logs loyalty-saas-gateway \| grep -E ' 499 \| 500 \| 502 \| 504 '` |
| **Cổng Nginx Host Gateway Trung Tâm** | `docker logs -f --tail 100 \$(docker ps -q --filter 'name=gateway_stack_nginx')` | `docker exec \$(docker ps -q --filter 'name=gateway_stack_nginx') tail -n 50 /var/log/nginx/loyalty_api_error.log` |
| **Cơ sở dữ liệu PostgreSQL 15** | `docker logs -f --tail 50 loyalty-saas-postgres` | `docker logs loyalty-saas-postgres \| grep -i 'error'` |
| **Bộ nhớ đệm Redis 7** | `docker logs -f --tail 50 loyalty-saas-redis` | `docker logs loyalty-saas-redis \| grep -i 'warning'` |
| **Cổng Quản Trị CMS** | `docker logs -f --tail 50 loyalty-saas-cms` | `docker logs loyalty-saas-cms \| grep -i 'error'` |
| **Cổng Webview GameHub** | `docker logs -f --tail 50 loyalty-saas-webview` | `docker logs loyalty-saas-webview \| grep -i 'error'` |

---

### 5.2. Xem Tệp Nhật Ký Ghi Đĩa Theo Chu Kỳ Xoay Vòng (File Log)

Backend `loyalty-service` ghi nhật ký xoay vòng 3 ngày vào thư mục `/app/logs/` bên trong vùng chứa (được mount ra thư mục `/home/dip/micro-loyalty/deploy/logs/` trên máy chủ):

```bash
# Xem tệp nhật ký ứng dụng tổng hợp
tail -f -n 100 /home/dip/micro-loyalty/deploy/logs/application.log

# Xem tệp nhật ký ghi nhận lỗi riêng biệt
tail -f -n 100 /home/dip/micro-loyalty/deploy/logs/error.log

# Lọc các giao dịch trừ điểm theo mã định danh
grep "POINT-BURN" /home/dip/micro-loyalty/deploy/logs/application.log
```

---

## 6. THÔNG TIN VÀ KỊCH BẢN KIỂM THỬ MÔI TRƯỜNG MÁY CHỦ (SERVER VERIFICATION)

### 6.1. Ma Trận Cổng Mạng Và Tên Miền Môi Trường Máy Chủ UAT (`210.211.102.99`)

| Tên Miền / Cổng Mạng | Phân Hệ Nghiệp Vụ Đích | Phương Thức | Điểm Cuối Kiểm Tra Sức Khỏe |
| :--- | :--- | :---: | :--- |
| **`api.mid.io.vn`** | API Nghiệp Vụ Backend Lõi | HTTP/HTTPS | `GET http://api.mid.io.vn/actuator/health` |
| **`docs.mid.io.vn`** | Tài Liệu Kỹ Thuật Swagger UI & OpenAPI | HTTP/HTTPS | `GET http://docs.mid.io.vn/v3/api-docs` |
| **`cms.mid.io.vn`** | Cổng Quản Trị Trung Tâm Loyalty CMS | HTTP/HTTPS | `GET http://cms.mid.io.vn/index.html` |
| **`portal.mid.io.vn`** | Cổng Khách Hàng Webview & GameHub | HTTP/HTTPS | `GET http://portal.mid.io.vn/index.html` |
| **Cổng Host `18095`** | Cổng Điều Phối Nginx Gateway SaaS | HTTP | `GET http://210.211.102.99:18095/loyalty/actuator/health` |
| **Cổng Host `15435`** | Cơ Sở Dữ Liệu PostgreSQL 15 SaaS | TCP | Kết nối `psql -h 210.211.102.99 -p 15435 -U loyalty_app -d loyalty_db` |
| **Cổng Host `16385`** | Bộ Nhớ Đệm Redis 7 SaaS | TCP | Kết nối `redis-cli -h 210.211.102.99 -p 16385 -a Loyalty_RedisPass2026!` |

---

### 6.2. Chạy Kịch Bản Kiểm Tra Sức Khỏe Tự Động (`healthcheck.sh`)

Trên máy chủ UAT, thực thi kịch bản kiểm tra toàn diện:

```bash
ssh -i ~/.ssh/jenkins_deploy_dev -p 65000 dip@210.211.102.99 "bash /home/dip/micro-loyalty/deploy/scripts/healthcheck.sh"
```

**Kết quả kỳ vọng:**
```
=== [HEALTHCHECK-SAAS] KIỂM TRA SỨC KHỎE HỆ THỐNG LOYALTY (PORT 18095) ===
1. Kiểm tra Liveness Backend: OK
2. Kiểm tra Readiness Backend: OK
3. Kiểm tra Cổng Quản Trị CMS: OK
4. Kiểm tra Cổng Webview GameHub: OK
=== [HEALTHCHECK-SAAS] TOÀN BỘ CỤM DỊCH VỤ HOẠT ĐỘNG HOÀN HẢO 100% ===
```

---

### 6.3. Lệnh Kiểm Thử Thủ Công Từng Điểm Cuối Qua `curl`

```bash
# 1. Kiểm tra trạng thái sống của Backend qua domain API
curl -i -H "Host: api.mid.io.vn" http://210.211.102.99/actuator/health

# 2. Kiểm tra tài liệu Swagger UI & đặc tả OpenAPI qua domain Docs
curl -i -H "Host: docs.mid.io.vn" http://210.211.102.99/
curl -i -H "Host: docs.mid.io.vn" http://210.211.102.99/v3/api-docs

# 3. Kiểm tra trang đơn tĩnh Cổng Quản Trị qua domain CMS
curl -i -H "Host: cms.mid.io.vn" http://210.211.102.99/index.html

# 4. Kiểm tra trang đơn tĩnh Cổng Webview qua domain Portal
curl -i -H "Host: portal.mid.io.vn" http://210.211.102.99/index.html

# 5. Kiểm tra trực tiếp qua Cổng Gateway nội bộ 18095
curl -i http://210.211.102.99:18095/loyalty/actuator/health
curl -i http://210.211.102.99:18095/index.html
curl -i http://210.211.102.99:18095/gamehub/index.html
```

---

## 7. DANH MỤC TÀI KHOẢN VÀ THÔNG SỐ XÁC THỰC KIỂM THỬ

### 7.1. Tài Khoản Đăng Nhập Cổng Quản Trị Trung Tâm (CMS Admin)
* **Địa chỉ truy cập:** `https://cms.mid.io.vn` (hoặc `http://localhost:5173`)

| Vai trò / Nhóm quyền | Tên đăng nhập (`username`) | Mật khẩu (`password`) | Quyền hạn và Phạm vi sử dụng |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên Cấp Cao (Super Admin)** | `admin` | `Admin@123456` | Toàn quyền cấu hình chính sách điểm, phân hạng, hạn mức, đối soát tài chính, quản trị người dùng và phân quyền hệ thống. |
| **Quản Trị Viên Vận Hành (Loyalty Operator)** | `loyalty_admin` | `Admin@123456` | Quản lý danh mục game, cấu hình sự kiện, tạo chiến dịch khuyến mại, quản lý kho quà và xem báo cáo thống kê. |
| **Chuyên Viên Chăm Sóc Khách Hàng (Support)** | `support_user` | `Admin@123456` | Tra cứu lịch sử tích/tiêu điểm, tra cứu tài khoản hội viên, hỗ trợ đối soát giao dịch và giải quyết khiếu nại. |

> **Tiện ích thao tác nhanh:** Tại màn hình đăng nhập CMS, người dùng có thể nhấp vào liên kết *"Điền nhanh tài khoản mẫu (admin)"* để hệ thống tự động điền thông tin đăng nhập mẫu chuẩn.

---

### 7.2. Thông Số Xác Thực Cổng Trải Nghiệm Khách Hàng Webview & GameHub Cho 2 Mô Hình

* **Địa chỉ truy cập Webview:** `https://portal.mid.io.vn` (hoặc `http://localhost:5174`)

| Thuộc tính phân biệt | Mô hình 1: Ví Điện Tử Natcash (`TENANT_NATCASH`) | Mô hình 2: Liên Minh Bán Lẻ & CRM (`TENANT_MICRO_CRM`) |
| :--- | :--- | :--- |
| **Mã Thuê Bao (`X-Tenant-Id`)** | `TENANT_NATCASH` | `TENANT_MICRO_CRM` |
| **Mô hình triển khai** | On-Premise Dedicated Private Datacenter | SaaS Multi-tenant Cloud Platform |
| **Tài khoản kiểm thử demo** | `50937123456` hoặc `84988888888` | `84977777777` hoặc `CRM_USER_8888` |
| **Hạng hội viên & Điểm** | Hạng Vàng (`GOLD`) • `2,500 điểm` (Hệ số x1.25) | Hạng Bạch Kim (`PLATINUM`) • `3,450 điểm` (Hệ số x1.6) |
| **Mạng lưới đối tác liên kết** | Ví Natcash, Natcom 4G/5G, Điện lực EDH, Nước DINEPA | Siêu thị Delimart, Fahasa, Highlands Coffee, CGV, Ringme |
| **Kho Voucher đặc thù** | 1GB Data 4G, Hoàn 100 HTG hóa đơn, Chiết khấu cước nạp | Phiếu 100 HTG Delimart, Giảm 20% Fahasa, Đồ uống Highlands |
| **Cổng Game & Vòng quay** | `LUCKY_WHEEL_NATCASH` (Trúng tiền mặt vào ví & Data 4G) | `LUCKY_WHEEL_CRM`, `FARM_DELI`, `QUIZ_MASTER` |

---

### 7.3. Thông Số Xác Thực Tích Hợp API B2B (Máy Chủ Sang Máy Chủ)
* **Cổng API:** `https://api.mid.io.vn` / **Tài liệu Swagger:** `https://docs.mid.io.vn`

| Tiêu đề HTTP (Header) | Mẫu Mô Hình 1 (`TENANT_NATCASH`) | Mẫu Mô Hình 2 (`TENANT_MICRO_CRM`) | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- |
| `X-Tenant-Id` | `TENANT_NATCASH` | `TENANT_MICRO_CRM` | Định danh đối tác trong mô hình đa thuê bao. |
| `X-Api-Key` | `KEY_NATCASH_WALLET` | `KEY_CRM_DELIMART` | Khóa công khai định danh đối tác gọi API. |
| `X-Secret-Key` | `SEC_NC_WALLET_01` | `SEC_CRM_DELI_01` | Khóa bí mật dùng để sinh chữ ký số HMAC-SHA256. |
| `X-Timestamp` | Epoch millis hiện tại | Epoch millis hiện tại | Kiểm tra dung sai lệch thời gian (±300 giây). |

---

### 7.4. Tài Khoản Quản Trị Cơ Sở Dữ Liệu & Bộ Nhớ Đệm (Dev / Ops)

| Phân hệ hạ tầng | Môi trường SaaS UAT (`210.211.102.99`) | Môi trường On-Premise (`10.228.37.65`) |
| :--- | :--- | :--- |
| **PostgreSQL** | Cổng: `15435`<br/>User: `loyalty_app`<br/>Pass: `Loyalty_SecureDB2026!`<br/>DB: `loyalty_db` | Cổng: `5432`<br/>User: `natcash_loyalty`<br/>Pass: `Natcash$SecureDB2026!`<br/>DB: `natcash_loyalty_db` |
| **Redis Cache** | Cổng: `16385`<br/>Pass: `Loyalty_RedisPass2026!` | Cổng: `6379`<br/>Pass: `NatCash2022` |

---

## 8. CÁC NGUYÊN TẮC BẢO MẬT VÀ TOÀN VẸN TÀI CHÍNH

* **Tách biệt cơ sở dữ liệu hoàn toàn:** Cơ sở dữ liệu `loyalty_db` trên PostgreSQL 15+ độc lập 100% với cơ sở dữ liệu ví `natcash_db`. Hai hệ thống không chia sẻ bảng và chỉ giao tiếp qua giao thức mạng chuẩn hóa.
* **Bảo vệ an toàn tài chính và chống tiêu điểm kép:** Sử dụng khóa phân tán `RLock` của Redisson theo cú pháp `lock:burn:tenant_id:user_id` với thời gian chờ tối đa 3.000ms kết hợp khóa mức dữ liệu `Pessimistic Write Lock` trong giao dịch cơ sở dữ liệu.
* **Xác thực đa tầng chuẩn hóa:**
  * Giao tiếp máy chủ sang máy chủ: Xác thực Khóa kép (`X-Api-Key`, `SecretKey`), ký số `HMAC-SHA256` và kiểm tra sai lệch thời gian `X-Timestamp` (tối đa ±300 giây).
  * Giao tiếp Webview nhúng: Xác thực vé phiên một lần (`session_ticket` thời hạn 60 giây) đổi lấy mã truy cập ngắn hạn JWT (15 phút).
* **Đồng bộ phi tập trung qua Transactional Outbox:** Đảm bảo 100% sự kiện thăng hạng và biến động điểm được gửi đến đích thành công qua cơ chế Outbox Publisher và tự động thử lại theo cấp số nhân (5 lần).
* **Kiểm soát tần suất thông báo:** Giới hạn tối đa 1 thông báo đẩy mỗi ngày cho mỗi khách hàng, chỉ gửi trong khung giờ thân thiện từ 8h00 sáng đến 20h00 tối và ưu tiên hiển thị thông điệp gợi nhắc âm thầm trong ứng dụng.