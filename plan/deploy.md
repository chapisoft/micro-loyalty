# KẾ HOẠCH PHÂN TÍCH VÀ PHƯƠNG ÁN TRIỂN KHAI CHI TIẾT HỆ THỐNG LOYALTY LÊN MÁY CHỦ
**Mã tài liệu:** `HDCD_VH_LOYALTY_v1.0`  
**Hệ thống áp dụng:** Hệ sinh thái Khách hàng thân thiết liên minh và Cổng Game đa thuê bao (`micro-loyalty`)  
**Mã nguồn tham chiếu:** `./` (thư mục gốc dự án `micro-loyalty`)  
**Trạng thái phê duyệt:** Sẵn sàng triển khai theo yêu cầu  

---

## 1. TỔNG QUAN HỆ THỐNG VÀ BỘ SẢN PHẨM BÀN GIAO

Dự án **Hệ sinh thái Khách hàng thân thiết liên minh và Cổng Game đa thuê bao (`micro-loyalty`)** cung cấp nền tảng quản trị tích và tiêu điểm hợp nhất, phân hạng hội viên động, liên thông Ví Phần Thưởng tại điểm bán (POS) và cổng trò chơi hóa giải trí. Hệ sinh thái được tổ chức theo kiến trúc **5 Microservices độc lập + API Gateway + 3 ứng dụng Frontend**, hỗ trợ đồng thời mô hình SaaS Đa Thuê Bao và mô hình On-Premise Tại Chỗ.

| Tầng Kiến Trúc | Thành Phần Chính | Công Nghệ & Cổng Dịch Vụ | Vai Trò & Trách Nhiệm |
| :--- | :--- | :--- | :--- |
| **Trình Diễn & Quản Trị** | `loyalty-cms`, `loyalty-webview`, `loyalty-partner-portal`, `loyalty-sandbox`, `natcash-eu-app` | React 18 / TypeScript / Vite / PrimeReact (`cms`, `partner-portal`) & TailwindCSS (`webview`) | Giao diện quản trị trung tâm, sảnh Game H5 & vòng quay `LoyaltyJSBridge`, cổng đối tác liên minh, trình giả lập đối tác |
| **API Gateway** | `loyalty-saas-gateway` (SaaS) / Nginx `1.20.2` (On-Premise) | Nginx cổng `18095` (SaaS) hoặc `8443` / `8080` (On-Premise) | Điểm tiếp nhận tập trung, định tuyến URI về 5 Microservices (`8081..8085`), phục vụ SPA và cấu hình runtime `env-config.json` |
| **5 Microservices Backend** | `cms-service` (`8081`), `customer-service` (`8082`), `game-service` (`8083`), `campaign-service` (`8084`), `partner-service` (`8085`) | Java 17 LTS, Spring Boot `3.5.3`, đóng gói `Thin-JAR` + `245` thư viện `lib/` + `etc/` | Triển khai cuốn chiếu độc lập theo từng phân hệ nghiệp vụ; chia sẻ `loyalty-common` và `loyalty-engine` |
| **Hạ Tầng Dữ Liệu** | PostgreSQL 15+ (`loyalty_db`), Redis 7 Cluster | PostgreSQL (`5432`/`15435`), Redis (`6379`/`16385`), Flyway `V1`–`V27` | Lưu trữ quan hệ đa thuê bao tách biệt 100% khỏi Core ví, khóa phân tán Redisson và Webhook Outbox |

### 1.1. Danh Mục Bộ Sản Phẩm Bàn Giao Cốt Lõi
1. **Cụm 5 Microservices Backend (`src/service/*`) và Thư viện lõi (`src/lib/*`):**
   - Nền tảng: Java 17 LTS, Spring Boot `3.5.3`, quản trị 20 module Maven (`11` module `ims-libraries`, `loyalty-engine`, `loyalty-common`, cùng 5 dịch vụ chạy độc lập), sở hữu cơ sở dữ liệu độc lập `loyalty_db` trên PostgreSQL 15+ với các bản migration `V1` đến `V27`.
   - 5 dịch vụ tách biệt theo miền nghiệp vụ: `cms-service` (`8081`), `customer-service` (`8082`), `game-service` (`8083`), `campaign-service` (`8084`) và `partner-service` (`8085`), đóng gói dạng `Thin-JAR` dùng chung thư mục thư viện `lib/`.
   - Cơ chế Transactional Outbox Webhook ký số HMAC-SHA256, khóa phân tán Redisson chống tiêu điểm kép và kiểm thử tự động `109` Unit Test Backend đạt chuẩn qua `./ci-local.sh`.
2. **Cổng thông tin quản trị trung tâm (`src/cms` — `loyalty-cms`):**
   - Nền tảng: ReactJS 18, TypeScript, Vite, PrimeReact.
   - Chức năng: Quản lý cấu hình tham số động, chính sách phân hạng, chiến dịch, cột mốc, tỷ lệ chia sẻ doanh thu và tra cứu lịch sử giao dịch.
3. **Cổng Webview nhúng đa nền tảng (`src/webview` — `loyalty-webview`):**
   - Nền tảng: ReactJS 18, Vite, TailwindCSS.
   - Chức năng: Cầu nối `LoyaltyJSBridge` hai chiều với ứng dụng gốc, vòng quay may mắn và sảnh minigame HTML5.
4. **Cổng đối tác liên minh (`src/partner-portal` — `loyalty-partner-portal`):**
   - Nền tảng: ReactJS 18, TypeScript, Vite, PrimeReact.
   - Chức năng: Quản lý cửa hàng đối tác, giao dịch tích/trừ điểm POS, chứng từ đối soát bù trừ và cấu hình khóa tích hợp.
5. **Cổng nhà phát triển (`src/sandbox` — `loyalty-sandbox`) & SDK Game HTML5:**
   - Cổng thử nghiệm cho nhà phát triển đối tác kiểm tra chữ ký HMAC-SHA256, mô phỏng Webhook và thư viện tích hợp Game HTML5.

---

## 2. PHÂN TÍCH HIỆN TRẠNG VÀ SO SÁNH 2 MÔ HÌNH TRIỂN KHAI

Hệ thống Loyalty hỗ trợ 2 mô hình triển khai độc lập cho 2 môi trường hạ tầng riêng biệt (cấm dùng chung thông số cấu hình giữa 2 thư mục):

| Tiêu chí so sánh | Môi trường 1: SaaS Đa Thuê Bao (`deploy/micro-loyalty`) | Môi trường 2: On-Premise Ví Natcash (`deploy/natcash`) |
| :--- | :--- | :--- |
| **Mục đích sử dụng** | Môi trường SaaS Multi-tenant Cloud cho đối tác liên minh | Môi trường triển khai tại chỗ chuyên dụng cho ví điện tử Natcash |
| **Địa chỉ máy chủ** | `35.247.156.176` (Cổng SSH: `65000`, Tài khoản: `root`, LAN: `192.168.1.200`) | `10.228.37.65` (Cổng SSH: `22`, Tài khoản: `mascom`) |
| **Thư mục cài đặt** | `/data/uc1-software/apps/micro-loyalty/deploy` | `/u01/mascom/ringme/loyalty-game/` |
| **Kiến trúc triển khai** | Cụm **11 vùng chứa** khép kín qua **Docker Compose** | Triển khai trực tiếp **Native JVM** trên CentOS Linux 7 (kèm tùy chọn `docker-compose.yml`) |
| **Dịch vụ Backend** | 5 vùng chứa `Thin-JAR` (`8081..8085` chỉ `expose` nội bộ Docker) | 5 tệp `Thin-JAR` chạy qua JDK 17 tại `/u01/mascom/build/jdk17/bin/java` (`127.0.0.1:8081..8085`) |
| **Cơ sở dữ liệu** | Vùng chứa PostgreSQL 15 riêng (cổng Host `15435`, DB `loyalty_db`) | PostgreSQL nội bộ tại `/u01/mascom/build/postgre/` (cổng `5432`, DB `natcash_loyalty_db`) |
| **Bộ nhớ đệm & Khóa** | Vùng chứa Redis 7 riêng (cổng Host `16385`) | Redis nội bộ cụm ví (cổng `6379`, Pass: `NatCash2022`) |
| **Điều phối API Gateway** | `loyalty-saas-gateway` cổng `18095` kết hợp Host Nginx Master & `cloudflared` | Nginx `1.20.2` phân lập: Cổng `8443` (Internet HTTPS) và Cổng `8080` (Nội bộ VPN) |
| **Hệ thống tên miền** | `api.mid.io.vn`, `docs.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn` | `loyalty.natcom.com.ht:8443`, `testeuapi.natcom.com.ht:8443` |

### 2.1. Định Cỡ Tài Nguyên Cụm SaaS (`35.247.156.176`)
- Cụm SaaS vận hành đồng bộ **11 vùng chứa** (`7/7` healthcheck `healthy`) với tổng mức cấp phát bộ nhớ khoảng **3.45 GB RAM**:
  - **5 Microservices (`Thin-JAR`):** `loyalty-saas-cms-service`, `loyalty-saas-customer-service`, `loyalty-saas-game-service`, `loyalty-saas-campaign-service`, `loyalty-saas-partner-service` (JVM `-Xms128m -Xmx512m`, HikariCP tối đa `12` kết nối/service).
  - **3 Frontend SPA:** `loyalty-saas-cms`, `loyalty-saas-webview`, `loyalty-saas-partner-portal`.
  - **Hạ tầng dữ liệu & điều phối:** PostgreSQL 15 (`loyalty-saas-postgres`), Redis 7 (`loyalty-saas-redis`) và Nginx API Gateway (`loyalty-saas-gateway`).

### 2.2. Ma Trận Phân Bổ Cổng Mạng Chống Xung Đột Tài Nguyên
Trên máy chủ `35.247.156.176`, cổng mạng của hệ sinh thái Loyalty được phân lập tuyệt đối để tránh trùng lặp với các ứng dụng khác trên host (kể cả cổng `8081` / `8085` của máy chủ):

| Dịch vụ và Phân hệ | Cổng mạng Host / Nội bộ | Giao thức | Phạm vi hiển thị | Trạng thái phân lập |
| :--- | :---: | :---: | :--- | :--- |
| **Loyalty PostgreSQL Chuyên Dụng** | `127.0.0.1:15435` | TCP | Loopback Host | Độc lập hoàn toàn |
| **Loyalty Redis Chuyên Dụng** | `127.0.0.1:16385` | TCP | Loopback Host | Độc lập hoàn toàn |
| **Loyalty API Gateway** | `127.0.0.1:18095` | TCP HTTP | Loopback Host → Host Nginx Master | Độc lập hoàn toàn |
| **5 Microservices (`8081..8085`)** | `8081..8085` (`expose` nội bộ Docker) | TCP HTTP | Nội bộ mạng `loyalty-saas-network` | Không bind ra Host, không đụng cổng `8081`/`8085` của host |

---

## 3. PHƯƠNG ÁN TRIỂN KHAI CHI TIẾT MÔ HÌNH 1: SAAS CLOUD (DOCKER COMPOSE)

Áp dụng cho máy chủ SaaS `35.247.156.176:65000` (Tài khoản: `root`, IP LAN: `192.168.1.200`, Thư mục: `/data/uc1-software/apps/micro-loyalty/deploy`).

| Bước | Giai Đoạn | Công Việc Chính | Sản Phẩm Đầu Ra |
| :---: | :--- | :--- | :--- |
| **1** | Kiểm thử & Đóng gói tại máy trạm | Chạy `./ci-local.sh` tại thư mục gốc | 20 module Maven biên dịch sạch, `109` Unit Test pass, 5 `Thin-JAR` + `245` `lib/` + `etc/`, 3 gói `dist/` Frontend |
| **2** | Đồng bộ lên máy chủ `35.247.156.176` | Chạy `rsync` qua SSH cổng `65000` (kèm sao lưu cấu hình/gói cũ trước khi ghi đè) | Thư mục `/data/uc1-software/apps/micro-loyalty/deploy` cập nhật đầy đủ `backend/`, `frontend/`, `config/` |
| **3** | Khởi tạo / cập nhật Docker Compose | Chạy `docker compose up -d --build --remove-orphans` (hoặc `--no-deps <service>`) | Toàn bộ 11 vùng chứa `Up`, `7/7` healthcheck ở trạng thái `healthy` |
| **4** | Kiểm tra Nginx Master & Cloudflare | Kiểm tra cấu hình `/data/uc3-infra/nginx-master/conf.d/loyalty.conf` và tải lại Nginx Host | Lưu lượng từ 5 tên miền công khai trỏ thông suốt vào `127.0.0.1:18095` |
| **5** | Nghiệm thu sau triển khai | Chạy `bash scripts/healthcheck.sh` và kiểm tra HTTP 200 trên 5 tên miền | `healthcheck.sh` thoát mã `0`, toàn bộ tên miền và Swagger Docs phản hồi `HTTP 200` |

### Bước 1: Kiểm Thử Toàn Diện Và Đóng Gói Bản Dựng Tại Máy Trạm
Thực hiện tại thư mục gốc dự án (`micro-loyalty/`):

```bash
# Chạy toàn bộ CI cục bộ: Maven 20 modules, 109 Unit Test,
# đóng gói 5 Thin-JAR + 245 thư viện lib/ + etc/, build 3 Frontend và kiểm tra Docker Compose / Nginx
./ci-local.sh
```

### Bước 2: Đồng Bộ Gói Triển Khai Lên Máy Chủ SaaS
```bash
# Sao lưu cấu hình cũ trước khi đồng bộ và đẩy gói mới qua SSH Port 65000
rsync -avz --delete -e "ssh -p 65000" --exclude='.env' --exclude='data/' --exclude='logs/' --exclude='backups/' \
  deploy/micro-loyalty/ root@35.247.156.176:/data/uc1-software/apps/micro-loyalty/deploy/
```

### Bước 3: Nạp Cấu Hình Nginx Master Trên Máy Chủ (Nếu Thay Đổi Định Tuyến)
```bash
ssh -p 65000 root@35.247.156.176 "
cp /data/uc1-software/apps/micro-loyalty/deploy/config/nginx/host-loyalty-vhost.conf /data/uc3-infra/nginx-master/conf.d/loyalty.conf
nginx -t && nginx -s reload
"
```

### Bước 4: Khởi Chạy Cụm 11 Vùng Chứa Docker Compose
```bash
ssh -p 65000 root@35.247.156.176 "
cd /data/uc1-software/apps/micro-loyalty/deploy
docker compose up -d --build --remove-orphans
docker compose ps
"
```

---

## 4. PHƯƠNG ÁN TRIỂN KHAI CHI TIẾT MÔ HÌNH 2: ON-PREMISE VÍ NATCASH (NATIVE JVM)

Áp dụng cho máy chủ vật lý riêng biệt `10.228.37.65:22` (User: `mascom`, CentOS 7).

### Bước 1: Khởi Tạo Cơ Sở Dữ Liệu PostgreSQL Trên Máy Chủ Natcash
Đăng nhập SSH vào máy chủ `10.228.37.65` bằng tài khoản `mascom`:

```bash
# 1. Tạo thư mục dữ liệu PostgreSQL chuyên dụng nếu chưa có
mkdir -p /u01/mascom/build/postgre/data
mkdir -p /u01/mascom/build/postgre/logs

# 2. Khởi tạo cluster dữ liệu chuẩn UTF-8 (thực hiện một lần đầu tiên)
if [ ! -f /u01/mascom/build/postgre/data/PG_VERSION ]; then
    /u01/mascom/build/postgre/bin/initdb -D /u01/mascom/build/postgre/data -E UTF8 --locale=en_US.UTF-8
fi

# 3. Khởi động dịch vụ PostgreSQL trên cổng 5432
/u01/mascom/build/postgre/bin/pg_ctl -D /u01/mascom/build/postgre/data -l /u01/mascom/build/postgre/logs/postgres.log start

# 4. Tạo User và Database độc lập cho Loyalty
/u01/mascom/build/postgre/bin/psql -h 127.0.0.1 -p 5432 -U \$(whoami) -d postgres -c "
CREATE USER natcash_loyalty WITH PASSWORD 'Natcash\$SecureDB2026!';
CREATE DATABASE natcash_loyalty_db OWNER natcash_loyalty ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE natcash_loyalty_db TO natcash_loyalty;
"
```

### Bước 2: Thiết Lập Cấu Trúc Thư Mục Triển Khai
```bash
mkdir -p /u01/mascom/ringme/loyalty-game/{backend/lib,backend/etc,config,locales,scripts,logs,web/cms,web/webview,web/partner-portal,backups}
chmod -R 755 /u01/mascom/ringme/loyalty-game
```

### Bước 3: Đóng Gói Và Đồng Bộ Mã Nguồn
```bash
# 1. Đóng gói 5 Thin-JAR + lib/ + etc/ và 3 Frontend qua CI cục bộ (từ thư mục gốc dự án)
./ci-local.sh

# 2. Truyền cụm Backend Thin-JAR + lib/ + etc/ sang máy chủ Natcash
rsync -avz deploy/natcash/backend/ mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/backend/

# 3. Truyền cấu hình ngoại vi và kịch bản vận hành
scp -P 22 deploy/natcash/config/backend/application-natcash.yml mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/config/
scp -P 22 deploy/natcash/scripts/*.sh mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/scripts/

# 4. Cấp quyền thực thi kịch bản
ssh -p 22 mascom@10.228.37.65 "chmod +x /u01/mascom/ringme/loyalty-game/scripts/*.sh"
```

### Bước 4: Cấu Hình Nginx API Gateway Phân Lập
Nạp cấu hình từ `deploy/natcash/config/nginx/nginx-natcash.conf` vào `/u01/mascom/build/nginx/conf/natcash/loyalty_game.conf`:
- **Cổng 8443 (Internet HTTPS qua SSL `*.natcom.com.ht`)**: Chuyển tiếp `/gamehub/` tới Webview và `/loyalty/api/v1/` tới 5 Microservices `127.0.0.1:8081..8085`.
- **Cổng 8080 (Chỉ mở trong VPN nội bộ)**: Phục vụ Cổng Quản trị CMS và Partner Portal, nghiêm cấm mở cổng này ra Internet.

Tải lại cấu hình Nginx:
```bash
ssh -p 22 mascom@10.228.37.65 "/u01/mascom/build/nginx/sbin/nginx -t && /u01/mascom/build/nginx/sbin/nginx -s reload"
```

### Bước 5: Khởi Chạy Cụm Dịch Vụ Native JVM
```bash
ssh -p 22 mascom@10.228.37.65 "bash /u01/mascom/ringme/loyalty-game/scripts/start.sh"
```

---

## 5. KỊCH BẢN ĐO KIỂM VÀ NGHIỆM THU SAU TRIỂN KHAI

### 5.1. Thực Thi Kịch Bản Kiểm Tra Sức Khỏe Tự Động (`healthcheck.sh`)
Trên máy chủ SaaS (`35.247.156.176:65000`):
```bash
ssh -p 65000 root@35.247.156.176 "bash /data/uc1-software/apps/micro-loyalty/deploy/scripts/healthcheck.sh"
```

### 5.2. Đo Kiểm Chi Tiết Từng Điểm Cuối Qua Tên Miền Chính Thức
```bash
# 1. Kiểm tra API Gateway và cụm dịch vụ
curl -s -o /dev/null -w "%{http_code}\n" https://api.mid.io.vn/gateway-health

# 2. Kiểm tra tài liệu Swagger UI & OpenAPI
curl -s -o /dev/null -w "%{http_code}\n" https://docs.mid.io.vn/swagger-ui/index.html

# 3. Kiểm tra 3 Cổng Giao Diện Web (CMS, Webview Portal, Partner Portal)
curl -s -o /dev/null -w "%{http_code}\n" https://cms.mid.io.vn/
curl -s -o /dev/null -w "%{http_code}\n" https://portal.mid.io.vn/
curl -s -o /dev/null -w "%{http_code}\n" https://partner.mid.io.vn/

# 4. Kiểm tra qua cổng API Gateway nội bộ 18095
curl -i http://127.0.0.1:18095/gateway-health
```

---

## 6. KẾ HOẠCH SAO LƯU, KHÔI PHỤC THẢM HỌA VÀ ROLLBACK AN TOÀN

### 6.1. Quy Trình Sao Lưu Dữ Liệu Tự Động Định Kỳ
Kịch bản sao lưu tự động chạy hàng ngày lúc 02h00 sáng vào thư mục `/data/uc1-software/apps/micro-loyalty/deploy/backups/`:

```bash
BACKUP_DIR="/data/uc1-software/apps/micro-loyalty/deploy/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "${BACKUP_DIR}"
docker exec loyalty-saas-postgres pg_dump -U loyalty_app -d loyalty_db | gzip > "${BACKUP_DIR}/loyalty_db_${TIMESTAMP}.sql.gz"
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +7 -delete
```

### 6.2. Kịch Bản Khôi Phục Thảm Họa
Khi cơ sở dữ liệu gặp sự cố hỏng hóc ngoài ý muốn:
```bash
# 1. Tạm dừng 5 Microservices Backend để cô lập luồng ghi
docker compose stop cms-service customer-service game-service campaign-service partner-service

# 2. Nạp lại dữ liệu từ bản sao lưu gần nhất
gunzip -c /data/uc1-software/apps/micro-loyalty/deploy/backups/loyalty_db_YYYYMMDD_HHMMSS.sql.gz | docker exec -i loyalty-saas-postgres psql -U loyalty_app -d loyalty_db

# 3. Khởi động lại cụm dịch vụ và kiểm tra sức khỏe
docker compose start cms-service customer-service game-service campaign-service partner-service
bash /data/uc1-software/apps/micro-loyalty/deploy/scripts/healthcheck.sh
```

### 6.3. Kịch Bản Rollback Bản Phát Hành Khi Gặp Sự Cố
1. **Đối với Môi trường SaaS (`35.247.156.176`):**
   Khôi phục từng `Thin-JAR` (ví dụ `game-service.jar`) hoặc bản sao lưu trước đợt nâng cấp trong `/data/uc1-software/apps/micro-loyalty/deploy`, sau đó khởi động lại riêng dịch vụ bị lỗi bằng `docker compose up -d --build --no-deps <service>`.
2. **Đối với Môi trường On-Premise Natcash (`10.228.37.65`):**
   ```bash
   ssh -p 22 mascom@10.228.37.65 "
   bash /u01/mascom/ringme/loyalty-game/scripts/stop.sh
   cp /u01/mascom/ringme/loyalty-game/backups/<service>-previous.jar /u01/mascom/ringme/loyalty-game/backend/<service>.jar
   bash /u01/mascom/ringme/loyalty-game/scripts/start.sh
   "
   ```

---

## 7. BẢNG MÃ LỖI HỆ THỐNG VÀ PLAYBOOK XỬ LÝ SỰ CỐ KHẨN CẤP

### 7.1. Bảng Mã Lỗi Hệ Thống Chuẩn 9 Cột

| STT | Phân loại | Tên module | Mã lỗi | Ý nghĩa mã lỗi | Mức độ | Nguyên nhân gốc rễ | Biện pháp khắc phục chi tiết | SLA MTTR |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| 1 | Cơ sở dữ liệu | Database Pool | `ERR_DB_POOL_EXHAUSTED` | Cạn kiệt Connection Pool HikariCP | Critical | Tải truy vấn tăng đột biến hoặc có truy vấn chạy ngầm giữ kết nối quá lâu | Tăng `maximum-pool-size: 50`, kiểm tra và ngắt các truy vấn treo trong PostgreSQL | ≤ 15 phút |
| 2 | Khóa phân tán | Redisson Engine | `ERR_REDIS_LOCK_TIMEOUT` | Tranh chấp khóa tiêu điểm Redisson quá hạn | Major | Nhiều yêu cầu trừ điểm đồng thời trên cùng tài khoản hội viên vượt quá 3.000ms | Kiểm tra độ trễ mạng Redis, tối ưu thời gian giao dịch ghi sổ cái điểm | ≤ 10 phút |
| 3 | Tích hợp ngoại vi | Webhook Outbox | `ERR_WEBHOOK_DELIVERY_FAILED` | Không gửi được Webhook biến động điểm sang Core ví | Major | Cổng API đối tác ví bị treo hoặc đường truyền mạng chập chờn | Bộ đệm Outbox tự động thử lại 5 lần; kiểm tra trạng thái bảng dead-letter | ≤ 30 phút |
| 4 | Cổng Gateway | Nginx Gateway | `ERR_NGINX_502_BAD_GATEWAY` | Cổng Nginx không kết nối được tới Microservice tương ứng | Critical | Tiến trình Microservice (`cms`, `customer`, `game`, `campaign` hoặc `partner`) bị OOM hoặc chưa khởi động xong | Kiểm tra `docker compose ps`, xem nhật ký service gặp lỗi và tăng heap JVM nếu cần | ≤ 10 phút |
| 5 | Bảo mật API | Security Filter | `ERR_HMAC_SIGNATURE_INVALID` | Chữ ký số HMAC-SHA256 không hợp lệ | Major | Sai lệch `SecretKey` hoặc tham số request bị thay đổi trên đường truyền | Kiểm tra cấu hình SecretKey của đối tác và kiểm tra độ lệch thời gian `X-Timestamp` | ≤ 20 phút |

### 7.2. Playbook Xử Lý Sự Cố 3 Tầng Khẩn Cấp

#### Tầng 1: Sự Cố Dịch Vụ Ứng Dụng (`loyalty-saas-{cms,customer,game,campaign,partner}-service` & `loyalty-saas-gateway`)
1. Kiểm tra trạng thái toàn bộ 11 vùng chứa: `docker compose ps` (tại `/data/uc1-software/apps/micro-loyalty/deploy`).
2. Xem 100 dòng nhật ký của Microservice gặp lỗi: `docker logs --tail 100 loyalty-saas-game-service` (hoặc dịch vụ tương ứng).
3. Khởi động lại riêng dịch vụ cần xử lý (không làm gián đoạn 4 dịch vụ còn lại): `docker compose restart game-service`.
4. Kiểm tra sức khỏe phục hồi toàn cụm: `bash scripts/healthcheck.sh` và `curl -I http://127.0.0.1:18095/gateway-health`.

#### Tầng 2: Sự Cố Bộ Nhớ Đệm Và Khóa Phân Tán (`loyalty-saas-redis`)
1. Kiểm tra kết nối Redis: `docker exec loyalty-saas-redis redis-cli -a <REDIS_PASSWORD> ping`.
2. Kiểm tra mức tiêu thụ bộ nhớ Redis: `docker exec loyalty-saas-redis redis-cli -a <REDIS_PASSWORD> info memory`.
3. Khởi động lại vùng chứa Redis nếu bộ đệm bị treo: `docker compose restart redis`.

#### Tầng 3: Sự Cố Cơ Sở Dữ Liệu (`loyalty-saas-postgres`)
1. Kiểm tra các kết nối đang hoạt động trong `loyalty_db`:
   `docker exec loyalty-saas-postgres psql -U loyalty_app -d loyalty_db -c "SELECT pid, state, query, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != 'idle';"`
2. Ngắt các truy vấn treo lâu hơn 30 giây:
   `docker exec loyalty-saas-postgres psql -U loyalty_app -d loyalty_db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE age(clock_timestamp(), query_start) > '30s';"`

---

## 8. ĐIỀU KIỆN SẴN SÀNG THỰC THI

Toàn bộ gói triển khai và kịch bản vận hành nằm độc lập trong hai thư mục `deploy/micro-loyalty/` (SaaS) và `deploy/natcash/` (On-Premise). Môi trường SaaS tại `35.247.156.176:65000` đã được triển khai vận hành với 11 vùng chứa; với môi trường On-Premise Natcash (`10.228.37.65:22`), tuyệt đối tuân thủ nguyên tắc an toàn vận hành: chỉ thực thi kết nối và đẩy bản dựng khi có chỉ thị triển khai tường minh từ người dùng.
