# HƯỚNG DẪN TRIỂN KHAI ON-PREMISE HỆ THỐNG LOYALTY & GAMEHUB CHO VÍ NATCASH
**Máy chủ đích:** `10.228.37.65` (ewallet-mobileapp-test)  
**Thư mục cài đặt dịch vụ:** `/u01/mascom/ringme/loyalty-game/`  
**Thư mục nền tảng & công cụ:** `/u01/mascom/build/`  
**Thư mục cấu hình Nginx:** `/u01/mascom/build/nginx/conf/natcash/`  
**Nguyên tắc an toàn vận hành:** Tuyệt đối không tự ý thực thi triển khai (deploy), đồng bộ tệp hay can thiệp máy chủ từ xa khi chưa có yêu cầu tường minh từ người dùng.

---

## 1. THÔNG SỐ HIỆN TRẠNG VÀ CÁC ĐIỀU KIỆN CẦN BỔ SUNG

### 1.1. Bảng Khảo Sát Hiện Trạng Hạ Tầng Máy Chủ
| Thành phần | Hiện trạng trên máy chủ 10.228.37.65 | Đánh giá & Yêu cầu bổ sung |
|:---|:---|:---|
| **Hệ điều hành** | CentOS Linux 7 (Core) x86_64 | Đạt chuẩn, tương thích hoàn toàn. |
| **Bộ nhớ RAM** | Tổng 32 GB (Khả dụng: 13.3 GB) | Đạt chuẩn, cấp phát `-Xms128m -Xmx512m` cho mỗi Microservice (tổng ~2.5 GB cho 5 dịch vụ). |
| **Dung lượng lưu trữ** | Phân vùng `/u01` khả dụng **146 GB** | Rất dồi dào, đáp ứng tốt lưu trữ dữ liệu, thư viện `lib/` và log dài hạn. |
| **Java Runtime** | Đã cài JDK 17 tại `/u01/mascom/build/jdk17/bin/java` | **Đạt chuẩn 100%**, sẵn sàng chạy trực tiếp 5 `Thin-JAR` Microservices. |
| **Nginx** | Đã chạy Nginx 1.20.2 tại `/u01/mascom/build/nginx/` | **Đạt chuẩn 100%**, có sẵn SSL Wildcard `star_natcom.com.ht`, định tuyến API Gateway tới `8081..8085`. |
| **Redis** | Đang chạy tại cổng `6379` (`node-6379`) | **Đạt chuẩn**, mật khẩu xác thực: `NatCash2022`. |
| **PostgreSQL** | Đã có bộ cài tại `/u01/mascom/build/postgre/` | **CẦN BỔ SUNG**: Khởi tạo thư mục dữ liệu, chạy dịch vụ và tạo database `natcash_loyalty_db`. |
| **Thư mục ứng dụng** | `/u01/mascom/ringme/loyalty-game/` | **CẦN BỔ SUNG**: Tạo cấu trúc cây thư mục con và phân quyền `755`. |
| **Tự động khởi động** | Chưa có dịch vụ auto-restart | **CẦN BỔ SUNG**: Kịch bản Crontab tự khởi động và kiểm tra tiến trình sống. |

---

## 2. KIẾN TRÚC MẠNG PHÂN TẦNG VÀ DANH MỤC TÊN MIỀN BẮT BUỘC

Hệ thống vận hành theo **Mô hình Mạng Phân Tầng Kết Hợp**: Máy chủ ứng dụng nằm trong vùng mạng riêng (Private VPN / Intranet), không kết nối IP trực tiếp ra Internet. Các dịch vụ nội bộ kết nối trực tiếp qua IP mạng riêng (`127.0.0.1` / `10.228.37.65`), còn người dùng từ ứng dụng di động và đối tác ngoài Internet bắt buộc đi qua Tên miền công khai có mã hóa SSL/TLS cổng `8443` tới **Nginx API Gateway**, sau đó định tuyến vào đúng Microservice nghiệp vụ (`8081..8085`).

| Vùng Mạng | Thành Phần | Cổng & Giao Thức | Chức Năng & Phạm Vi Truy Cập |
| :--- | :--- | :--- | :--- |
| **Công khai Internet & VPN** | `natcash-eu-app` & Thu ngân POS | `8443` (HTTPS SSL) | Mở Webview Cổng Game `/gamehub/` và gọi API tích/trừ điểm `/loyalty/` qua Firewall & SSL Wildcard `*.natcom.com.ht` |
| **Biên Mạng Nội Bộ** | Nginx `1.20.2` API Gateway | `8443` (Internet) / `8080` (VPN) | Cổng `8443` chỉ mở Webview và API; cổng `8080` chỉ phục vụ CMS & Partner Portal trong VPN nội bộ (khóa `403` từ Internet) |
| **Cụm 5 Microservices Native JVM** | `cms-service` (`8081`), `customer-service` (`8082`), `game-service` (`8083`), `campaign-service` (`8084`), `partner-service` (`8085`) | `127.0.0.1:8081..8085` (HTTP nội bộ) | Thực thi trực tiếp bằng JDK 17 (`Thin-JAR` + `lib/` + `etc/`) hoặc qua `docker-compose.yml`; tách biệt vòng đời triển khai theo từng phân hệ |
| **Lưu Trữ & Tích Hợp Core** | PostgreSQL (`5432`), Redis (`6379`), `natcash-eu-api` (`8686`) | LAN / Loopback nội bộ | Dùng chung DB `natcash_loyalty_db`, Redis `NatCash2022`, và giao tiếp hai chiều với `natcash-eu-api` trên `10.228.37.65:8686` |

---

### 2.1. Phân Định Rõ Ràng 2 Tầng Kết Nối

#### Tầng 1: Kết nối Nội bộ Mạng Riêng (Internal VPN Traffic — An toàn & Bảo mật 100%)
* **Cổng Quản Trị Trung Tâm CMS & Đối Tác:** **Chỉ chạy và truy cập trong mạng nội bộ VPN** (qua địa chỉ `http://10.228.37.65:8080/`). Tuyệt đối **KHÔNG mở cổng CMS ra ngoài Internet** để phòng ngừa rủi ro rò rỉ dữ liệu hoặc tấn công từ bên ngoài.
* **Giao tiếp liên dịch vụ:** Các tiến trình `natcash-eu-api:8686`, 5 Microservices Backend (`127.0.0.1:8081..8085`), `PostgreSQL:5432`, `Redis:6379` giao tiếp trực tiếp qua địa chỉ IP nội bộ `127.0.0.1` / `10.228.37.65`.

#### Tầng 2: Kết nối Ngoại vi từ Internet (Chỉ Mở Cổng Game Webview & API)
* **Mobile App (`natcash-eu-app`):** Kết nối mở Webview Cổng Game & Vòng Quay May Mắn qua Domain công khai `https://loyalty.natcom.com.ht:8443/gamehub/`.
* **API Gateway Mobile App:** Gọi qua Domain công khai `https://testeuapi.natcom.com.ht:8443/api/v1/loyalty/...`.
* **Quầy thu ngân POS:** Gọi API khấu trừ điểm qua `https://loyalty.natcom.com.ht:8443/loyalty/api/v1/...` (Nginx API Gateway tự động định tuyến sang `customer-service:8082` hoặc `partner-service:8085`).

---

### 2.2. Danh Mục Tên Miền & Cổng Truy Cập Phân Theo Vùng Mạng

| Phân hệ / Dịch vụ đích | Đối tượng / Dịch vụ gọi | Phạm vi mạng | Địa chỉ URL / Tên miền | Cổng & Giao thức | Mục đích sử dụng |
|:---|:---|:---|:---|:---|:---|
| **Cổng Game & Vòng Quay Webview** | • Ứng dụng di động `natcash-eu-app`<br/>• Trình duyệt Mobile của người dùng | **Công khai Internet & VPN** | `https://loyalty.natcom.com.ht:8443/gamehub/` | `8443` (HTTPS SSL) | Mở giao diện H5 Vòng Quay May Mắn và Mini-game (kèm SSO Ticket: `?ticket={token}`). |
| **Cổng API Gateway Mobile App** | • Ứng dụng di động `natcash-eu-app` | **Công khai Internet & VPN** | `https://testeuapi.natcom.com.ht:8443/api/v1/loyalty/` | `8443` (HTTPS SSL) | Tra cứu số dư điểm, đổi quà, đồng bộ `deviceId` thiết bị và sinh mã QR Ví Phần Thưởng 60 giây. |
| **Điểm cuối API Loyalty qua Gateway** | • Quầy thu ngân POS Siêu thị<br/>• Hệ thống đối tác liên minh | **Công khai Internet & VPN** | `https://loyalty.natcom.com.ht:8443/loyalty/` | `8443` (HTTPS SSL) | Nginx API Gateway phân tuyến tới `customer-service` (`8082`), `game-service` (`8083`), `campaign-service` (`8084`), `partner-service` (`8085`). |
| **Cổng Quản Trị CMS & Partner Portal** | • Ban quản trị Natcash / Vận hành liên minh | **CHỈ NỘI BỘ VPN (KHÔNG RA NGOÀI)** | `http://10.228.37.65:8080/` | `8080` (HTTP Nội bộ) | Đăng nhập qua VPN nội bộ để cấu hình chính sách, chiến dịch, voucher, đối soát bù trừ và quản lý đối tác. |
| **Cụm 5 Microservices Backend** | • API Gateway `natcash-eu-api` (`:8686`) và Nginx nội bộ | **CHỈ NỘI BỘ LAN / MÁY CHỦ** | `127.0.0.1:8081` (`cms`), `8082` (`customer`), `8083` (`game`), `8084` (`campaign`), `8085` (`partner`) | `8081..8085` (HTTP Nội bộ) | Xử lý độc lập từng miền nghiệp vụ, dùng chung `natcash_loyalty_db` và Redis `6379`. |

---

### 2.3. Ma Trận Luồng Kết Nối Hai Chiều Chi Tiết

| STT | Luồng kết nối | Nguồn phát | Đích tiếp nhận | Tuyến đường & Giao thức | Ý nghĩa & Nội dung xử lý |
|:---:|:---|:---|:---|:---|:---|
| **1** | **Mở Webview Game & Vòng Quay** | `natcash-eu-app` (Internet) | Nginx API Gateway | `https://loyalty.natcom.com.ht:8443/gamehub/?ticket=...` (HTTPS) | App mở Webview H5, tải tài nguyên tĩnh và nạp `env-config.json` qua Domain công khai. |
| **2** | **Gọi API Nghiệp vụ Ví / QR** | `natcash-eu-app` (Internet) | `natcash-eu-api` (Gateway) | `https://testeuapi.natcom.com.ht:8443/api/v1/loyalty/...` (HTTPS) | App gọi Gateway lấy thông tin hội viên, đổi quà và sinh mã QR động 60 giây. |
| **3** | **Chuyển tiếp JWT & Xác thực** | `natcash-eu-api` (Nội bộ) | Nginx / `customer-service` (`8082`) | `http://127.0.0.1:8080/loyalty/api/v1/...` hoặc `127.0.0.1:8081..8085` | Gateway giải mã JWT, gán `X-Tenant-Id: TENANT_NATCASH` và định tuyến tới đúng Microservice. |
| **4** | **Đồng bộ Device ID** | `natcash-eu-api` (Nội bộ) | `customer-service` (`8082`) | `http://127.0.0.1:8082/loyalty/api/v1/device/register` (HTTP LAN) | Đồng bộ `deviceId` thiết bị khi đăng nhập để định danh gửi Push Notification chính xác. |
| **5** | **Webhook Biến Động Điểm / Hoàn Tiền** | `game-service` (`8083`) / `partner-service` (`8085`) | `natcash-eu-api` (`8686`) | `http://10.228.37.65:8686/api/v1/loyalty/webhook/...` (HTTP LAN) | Webhook Transactional Outbox gửi thông báo hoàn tiền in-game hoặc biến động số dư. |
| **6** | **Gửi Push Notification** | `campaign-service` (`8084`) / `customer-service` (`8082`) | `natcash-eu-api` → FCM/APNs | `http://10.228.37.65:8686/api/v1/loyalty/push-notification` | Đẩy thông báo hiển thị đúng Logo và Thương hiệu Ví Natcash tới thiết bị người dùng. |
| **7** | **Khấu trừ Ví Phần Thưởng tại POS** | POS Siêu thị / Đối tác | Nginx → `partner-service` (`8085`) / `customer-service` (`8082`) | `https://loyalty.natcom.com.ht:8443/loyalty/api/v1/...` (HTTPS) | Quầy thu ngân quét mã QR Ví Phần Thưởng để trừ điểm (xác thực HMAC-SHA256). |

---

### 2.4. Cấu hình Mở Cổng Tường Lửa

1. **Cổng Công Khai (Mở từ mạng ngoài Internet / VPN Viễn thông qua Domain):**
   * `8443` (TCP): Cổng Nginx HTTPS bảo mật phục vụ Webview và API qua chứng chỉ SSL Wildcard `*.natcom.com.ht`.
   * `8080` (TCP): Cổng Nginx HTTP phục vụ CMS và Partner Portal trong VPN nội bộ.
2. **Cổng Nội Bộ Máy Chủ (Chỉ cho phép kết nối giữa các tiến trình nội bộ `127.0.0.1` / `10.228.37.65`, tuyệt đối không mở ra ngoài):**
   * `8081`–`8085` (TCP): Cụm 5 Microservices (`cms-service:8081`, `customer-service:8082`, `game-service:8083`, `campaign-service:8084`, `partner-service:8085`).
   * `8686` (TCP): Cổng Backend `natcash-eu-api` (Gateway).
   * `5432` (TCP): Cổng Cơ sở dữ liệu `PostgreSQL`.
   * `6379` (TCP): Cổng Bộ nhớ đệm và Khóa phân tán `Redis`.

---

## 3. CÁC HẠNG MỤC CẦN BỔ SUNG VÀ THIẾT LẬP TRÊN MÁY CHỦ

### 3.1. Bổ sung Khởi tạo & Chạy Cơ Sở Dữ Liệu PostgreSQL
Hiện tại trên máy chủ đã có sẵn bộ mã nguồn/nhị phân PostgreSQL 13.14 tại `/u01/mascom/build/postgre/bin/`. Cần thực hiện khởi tạo và tạo cơ sở dữ liệu như sau:

#### Bước 3.1.1: Khởi tạo thư mục dữ liệu PostgreSQL
Đăng nhập tài khoản `mascom` và thực thi:
```bash
# 1. Tạo thư mục dữ liệu và thư mục log cho PostgreSQL
mkdir -p /u01/mascom/build/postgre/data
mkdir -p /u01/mascom/build/postgre/logs

# 2. Khởi tạo cơ sở dữ liệu với mã hóa UTF-8
/u01/mascom/build/postgre/bin/initdb -D /u01/mascom/build/postgre/data -E UTF8 --locale=en_US.UTF-8
```

#### Bước 3.1.2: Cấu hình kết nối `postgresql.conf` và `pg_hba.conf`
1. Mở tệp `/u01/mascom/build/postgre/data/postgresql.conf`:
   * Thiết lập `listen_addresses = '127.0.0.1,10.228.37.65'`
   * Thiết lập `port = 5432`
   * Thiết lập `max_connections = 100`
   * Thiết lập `shared_buffers = 512MB`
2. Mở tệp `/u01/mascom/build/postgre/data/pg_hba.conf` và bổ sung quyền truy cập nội bộ:
   ```text
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            md5
   host    all             all             10.228.37.65/32         md5
   ```

#### Bước 3.1.3: Tạo kịch bản khởi động và dừng PostgreSQL
1. Tạo kịch bản `/u01/mascom/build/postgre/start.sh`:
   ```bash
   #!/usr/bin/env bash
   /u01/mascom/build/postgre/bin/pg_ctl -D /u01/mascom/build/postgre/data -l /u01/mascom/build/postgre/logs/postgres.log start
   echo "[POSTGRES] PostgreSQL đã khởi động thành công trên cổng 5432."
   ```
2. Tạo kịch bản `/u01/mascom/build/postgre/stop.sh`:
   ```bash
   #!/usr/bin/env bash
   /u01/mascom/build/postgre/bin/pg_ctl -D /u01/mascom/build/postgre/data stop -m fast
   echo "[POSTGRES] PostgreSQL đã dừng an toàn."
   ```
3. Cấp quyền thực thi:
   ```bash
   chmod +x /u01/mascom/build/postgre/start.sh /u01/mascom/build/postgre/stop.sh
   /u01/mascom/build/postgre/start.sh
   ```

#### Bước 3.1.4: Tạo User và Database `natcash_loyalty_db`
Chạy lệnh tạo người dùng và cơ sở dữ liệu:
```bash
/u01/mascom/build/postgre/bin/psql -h 127.0.0.1 -p 5432 -U $(whoami) -d postgres -c "
CREATE USER natcash_loyalty WITH PASSWORD 'Natcash\$SecureDB2026!';
CREATE DATABASE natcash_loyalty_db OWNER natcash_loyalty ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE natcash_loyalty_db TO natcash_loyalty;
"
```
*(Ghi chú: Hệ thống schema từ phiên bản `V1` đến `V27` và dữ liệu khởi tạo sẽ được Flyway Migration trong `loyalty-common` tự động tạo khi dịch vụ khởi động lần đầu).*

---

### 3.2. Bổ sung Cấu hình Bộ Nhớ Đệm Redis
* Cụm Redis đang chạy tại cổng `6379` (`/u01/mascom/build/redis/node-6379/`).
* Thông số xác thực kết nối vào Redis cho cụm Microservices Loyalty:
  * **Host:** `127.0.0.1`
  * **Port:** `6379`
  * **Password:** `NatCash2022`
  * **Database:** `0`
  * **Timeout:** `2000ms`

---

### 3.3. Bổ sung Cấu trúc Thư Mục Ứng Dụng `/u01/mascom/ringme/loyalty-game/`
Chạy lệnh tạo toàn bộ cây thư mục khép kín:
```bash
mkdir -p /u01/mascom/ringme/loyalty-game/{backend/lib,backend/etc,config,locales,web/cms,web/webview,web/partner-portal,scripts,logs,backups}
chmod -R 755 /u01/mascom/ringme/loyalty-game
```

Cây thư mục chuẩn hóa:
```
/u01/mascom/ringme/loyalty-game/
├── backend/
│   ├── cms-service.jar              # Thin-JAR quản trị & cấu hình (cổng 8081)
│   ├── customer-service.jar         # Thin-JAR hội viên & sổ cái điểm (cổng 8082)
│   ├── game-service.jar             # Thin-JAR cổng game & vòng quay (cổng 8083)
│   ├── campaign-service.jar         # Thin-JAR chiến dịch & voucher (cổng 8084)
│   ├── partner-service.jar          # Thin-JAR đối tác & bù trừ (cổng 8085)
│   ├── lib/                         # 245 thư viện phụ thuộc dùng chung (~125 MB)
│   └── etc/                         # Tài nguyên cấu hình chung
├── config/                          # Chứa application-natcash.yml, env-config.json
├── locales/                         # Chứa vi.json, en.json, fr.json, ht.json
├── web/
│   ├── cms/                         # Gói tĩnh Cổng Quản Trị Trung Tâm CMS
│   ├── webview/                     # Gói tĩnh Cổng Game Webview & Lucky Wheel
│   └── partner-portal/              # Gói tĩnh Cổng Đối Tác Liên Minh
├── scripts/                         # Kịch bản quản trị install, start, stop, restart, healthcheck
├── logs/                            # Nhật ký hoạt động theo từng Microservice & gc.log
└── backups/                         # Lưu trữ bản backup DB định kỳ
```

---

## 4. NỘI DUNG TỆP CẤU HÌNH VÀ KỊCH BẢN VẬN HÀNH

### 4.1. Cấu Hình Ngoại Vi Backend & Điều Phối Container
- **Tệp cấu hình Backend:** Khai báo tại [config/backend/application-natcash.yml](config/backend/application-natcash.yml), nạp động qua `SPRING_CONFIG_IMPORT=optional:file:/app/etc/,optional:file:/app/config/` (hoặc `--spring.config.additional-location`), kết nối PostgreSQL `127.0.0.1:5432/natcash_loyalty_db` (`user: natcash_loyalty`), Redis `127.0.0.1:6379` (`password: NatCash2022`), và `natcash-eu-api` tại `http://10.228.37.65:8686`.
- **Tùy chọn điều phối vùng chứa:** Với hạ tầng hỗ trợ Docker, [docker-compose.yml](docker-compose.yml) (kèm [`.env.example`](.env.example)) cung cấp sẵn cấu hình khởi chạy 5 Microservices `Thin-JAR` (`cms-service:8081`, `customer-service:8082`, `game-service:8083`, `campaign-service:8084`, `partner-service:8085`) và Nginx API Gateway mà không cài đặt chéo thông số từ môi trường SaaS.

---

### 4.2. Cấu hình Nginx API Gateway (`config/nginx/nginx-natcash.conf`)

Tệp cấu hình chuẩn tại [nginx-natcash.conf](config/nginx/nginx-natcash.conf) (nạp vào `/u01/mascom/build/nginx/conf/natcash/loyalty_game.conf` trên máy chủ `10.228.37.65`) thực hiện tách biệt 2 khối `server` và định tuyến từng nhóm API tới đúng cổng Microservice nội bộ:

| Khối Nginx | Cổng & Phạm Vi | Quy Tắc Định Tuyến Chính |
| :--- | :--- | :--- |
| **Cổng Công Khai** | `8443` HTTPS SSL (`loyalty.natcom.com.ht`, `testloyalty.natcom.com.ht`) | Phục vụ `/gamehub/` (gói tĩnh Webview) và định tuyến `/loyalty/api/v1/...` tới các Microservices `127.0.0.1:8081..8085`; trả về `403 Forbidden` cho toàn bộ đường dẫn CMS |
| **Cổng Quản Trị Nội Bộ** | `8080` HTTP (`10.228.37.65`, `loyalty-admin.natcom.com.ht`) | Phục vụ gói tĩnh `cms` và `partner-portal`, đồng thời định tuyến API nội bộ về các cổng `8081..8085` chỉ trong mạng VPN |

---

### 4.3. Bộ Kịch Bản Quản Trị Dịch Vụ (`scripts/`)

| Kịch Bản | Đường Dẫn | Chức Năng Vận Hành |
| :--- | :--- | :--- |
| Cài đặt khởi tạo | [scripts/install.sh](scripts/install.sh) | Kiểm tra biến môi trường `.env`, chuẩn bị thư mục cài đặt và phân quyền thực thi trên máy chủ `10.228.37.65` |
| Khởi chạy dịch vụ | [scripts/start.sh](scripts/start.sh) | Khởi động 5 Microservices `Thin-JAR` (`8081..8085`) bằng JDK 17 (`/u01/mascom/build/jdk17/bin/java`) với tham số JVM tối ưu và ghi PID riêng cho từng dịch vụ |
| Dừng dịch vụ | [scripts/stop.sh](scripts/stop.sh) | Gửi tín hiệu `SIGTERM` dừng êm ái từng tiến trình Microservice (chờ tối đa 30 giây hoàn tất giao dịch) |
| Khởi động lại | [scripts/restart.sh](scripts/restart.sh) | Thực hiện chu trình dừng và khởi động lại an toàn toàn bộ hoặc từng Microservice chỉ định |
| Kiểm tra sức khỏe | [scripts/healthcheck.sh](scripts/healthcheck.sh) | Kiểm tra `/actuator/health` trên cả 5 cổng `8081..8085` và cổng Webview/CMS Nginx `8080` |

---

## 5. BỔ SUNG TỰ ĐỘNG HÓA VẬN HÀNH & GIÁM SÁT SỐNG

Để đảm bảo hệ thống tự phục hồi khi gặp sự cố hoặc sau khi máy chủ khởi động lại, bổ sung các tác vụ Crontab sau cho người dùng `mascom` (`crontab -e`):

```bash
# 1. Tự động khởi động lại PostgreSQL và cụm 5 Microservices Loyalty khi máy chủ Reboot
@reboot /u01/mascom/build/postgre/start.sh > /dev/null 2>&1
@reboot sleep 10 && /u01/mascom/ringme/loyalty-game/scripts/start.sh > /dev/null 2>&1

# 2. Giám sát tự động mỗi 2 phút: Tự phục hồi nếu healthcheck cụm dịch vụ thất bại
*/2 * * * * /u01/mascom/ringme/loyalty-game/scripts/healthcheck.sh > /dev/null 2>&1 || /u01/mascom/ringme/loyalty-game/scripts/start.sh > /dev/null 2>&1

# 3. Tự động sao lưu cơ sở dữ liệu hàng ngày vào 02:00 sáng
0 2 * * * /u01/mascom/build/postgre/bin/pg_dump -h 127.0.0.1 -U natcash_loyalty natcash_loyalty_db | gzip > /u01/mascom/ringme/loyalty-game/backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 6. QUY TRÌNH THỰC HIỆN TRIỂN KHAI 5 BƯỚC

| Bước | Giai Đoạn | Thao Tác Chuẩn Hóa | Kết Quả Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Bước 1** | Chuẩn bị hạ tầng trên `10.228.37.65` | Khởi tạo PostgreSQL data, tạo DB `natcash_loyalty_db`, tạo thư mục `/u01/mascom/ringme/loyalty-game/` | Thư mục ứng dụng và PostgreSQL `5432` sẵn sàng tiếp nhận kết nối |
| **Bước 2** | Đóng gói và kiểm thử cục bộ | Chạy `./ci-local.sh` tại thư mục gốc | Biên dịch 20 module Maven, pass `109` Unit Test, xuất 5 `Thin-JAR` + `245` thư viện `lib/` và 3 gói Frontend (`cms`, `webview`, `partner-portal`) |
| **Bước 3** | Đồng bộ gói triển khai lên máy chủ | Đồng bộ qua SCP/Rsync tới `mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/` | Đầy đủ `backend/`, `web/`, `config/`, `locales/`, `scripts/` trên máy chủ |
| **Bước 4** | Nạp cấu hình Nginx 8443 & 8080 | Đẩy `nginx-natcash.conf` vào `/u01/mascom/build/nginx/conf/natcash/` và reload Nginx | Khối `8443` chỉ mở Webview/API; khối `8080` phục vụ CMS & Partner Portal nội bộ |
| **Bước 5** | Khởi chạy và nghiệm thu | Chạy `scripts/start.sh` và `scripts/healthcheck.sh`, cài Crontab tự giám sát | Cả 5 Microservices `8081..8085` đạt `UP`, Webview (`8443`) và CMS (`8080`) truy cập thông suốt |

### Bước 1: Khởi tạo PostgreSQL và cấu trúc thư mục trên máy chủ
Đăng nhập SSH vào `10.228.37.65` với tài khoản `mascom`:
```bash
# 1. Khởi tạo PostgreSQL
mkdir -p /u01/mascom/build/postgre/data /u01/mascom/build/postgre/logs
/u01/mascom/build/postgre/bin/initdb -D /u01/mascom/build/postgre/data -E UTF8 --locale=en_US.UTF-8
/u01/mascom/build/postgre/bin/pg_ctl -D /u01/mascom/build/postgre/data -l /u01/mascom/build/postgre/logs/postgres.log start

# 2. Tạo User & DB
/u01/mascom/build/postgre/bin/psql -h 127.0.0.1 -p 5432 -U mascom -d postgres -c "
CREATE USER natcash_loyalty WITH PASSWORD 'Natcash\$SecureDB2026!';
CREATE DATABASE natcash_loyalty_db OWNER natcash_loyalty ENCODING 'UTF8';
"

# 3. Tạo thư mục ứng dụng
mkdir -p /u01/mascom/ringme/loyalty-game/{backend/lib,backend/etc,config,locales,web/cms,web/webview,web/partner-portal,scripts,logs,backups}
chmod -R 755 /u01/mascom/ringme/loyalty-game
```

### Bước 2: Đóng gói và kiểm thử mã nguồn tại máy phát triển
```bash
# Chạy CI cục bộ: biên dịch 20 module Maven, pass 109 Unit Test,
# đóng gói 5 Thin-JAR + 245 thư viện lib/ + etc/ và build 3 gói Frontend
./ci-local.sh
```

### Bước 3: Đẩy gói triển khai lên máy chủ (`10.228.37.65`) khi có yêu cầu triển khai
```bash
# 1. Đẩy 5 Microservices Thin-JAR + thư viện dùng chung lib/ + etc/
rsync -avz deploy/natcash/backend/ mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/backend/

# 2. Đẩy Frontend CMS, Webview và Partner Portal
scp -r src/cms/dist/* mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/web/cms/
scp -r src/webview/dist/* mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/web/webview/
scp -r src/partner-portal/dist/* mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/web/partner-portal/

# 3. Đẩy cấu hình ngoại vi, từ điển đa ngôn ngữ và kịch bản quản trị
scp deploy/natcash/config/backend/application-natcash.yml mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/config/
scp -r deploy/natcash/config/frontend/* mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/config/
scp -r deploy/natcash/locales/* mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/locales/
scp deploy/natcash/scripts/*.sh mascom@10.228.37.65:/u01/mascom/ringme/loyalty-game/scripts/
```

### Bước 4: Thiết lập và tải lại cấu hình Nginx API Gateway
```bash
# 1. Đẩy file cấu hình Nginx On-Premise
scp deploy/natcash/config/nginx/nginx-natcash.conf mascom@10.228.37.65:/u01/mascom/build/nginx/conf/natcash/loyalty_game.conf

# 2. Kiểm tra và tải lại trên máy chủ
/u01/mascom/build/nginx/sbin/nginx -t
/u01/mascom/build/nginx/sbin/nginx -s reload
```

### Bước 5: Khởi chạy và Nghiệm thu
```bash
# 1. Khởi động cụm 5 Microservices Loyalty
chmod +x /u01/mascom/ringme/loyalty-game/scripts/*.sh
/u01/mascom/ringme/loyalty-game/scripts/start.sh

# 2. Kiểm tra sức khỏe dịch vụ (5 cổng 8081..8085 & Nginx)
/u01/mascom/ringme/loyalty-game/scripts/healthcheck.sh

# 3. Kiểm tra các cổng truy cập
# API Gateway Backend: http://10.228.37.65:8080/loyalty/
# Cổng Game Webview:  https://loyalty.natcom.com.ht:8443/gamehub/
# Cổng Quản Trị CMS:   http://10.228.37.65:8080/
```
