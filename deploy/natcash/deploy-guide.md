# HƯỚNG DẪN TRIỂN KHAI ON-PREMISE HỆ THỐNG LOYALTY & GAMEHUB CHO VÍ NATCASH
**Máy chủ đích:** `10.228.37.65` (ewallet-mobileapp-test)  
**Thư mục cài đặt dịch vụ:** `/u01/mascom/loyalty/`  
**Thư mục nền tảng & công cụ:** `/u01/mascom/build/`  
**Thư mục cấu hình Nginx:** `/u01/mascom/build/nginx/conf/natcash/`  
**Nguyên tắc an toàn vận hành:** Tuyệt đối không tự ý thực thi triển khai (deploy), đồng bộ tệp hay can thiệp máy chủ từ xa khi chưa có yêu cầu tường minh từ người dùng.

---

## 1. THÔNG SỐ HIỆN TRẠNG VÀ CÁC ĐIỀU KIỆN CẦN BỔ SUNG

### 1.1. Bảng Khảo Sát Hiện Trạng Hạ Tầng Máy Chủ
| Thành phần | Hiện trạng trên máy chủ 10.228.37.65 | Đánh giá & Yêu cầu bổ sung |
|:---|:---|:---|
| **Hệ điều hành** | CentOS Linux 7 (Core) x86_64 | Đạt chuẩn, tương thích hoàn toàn. |
| **Bộ nhớ RAM** | Tổng 32 GB (Khả dụng: 13.3 GB) | Đạt chuẩn, cấp phát 1 GB - 2 GB RAM cho Loyalty Service. |
| **Dung lượng lưu trữ** | Phân vùng `/u01` khả dụng **146 GB** | Rất dồi dào, đáp ứng tốt lưu trữ dữ liệu và log dài hạn. |
| **Java Runtime** | Đã cài JDK 17 tại `/u01/mascom/build/jdk17/bin/java` | **Đạt chuẩn 100%**, sẵn sàng chạy trực tiếp `loyalty-service.jar`. |
| **Nginx** | Đã chạy Nginx 1.20.2 tại `/u01/mascom/build/nginx/` | **Đạt chuẩn 100%**, có sẵn SSL Wildcard `star_natcom.com.ht`. |
| **Redis** | Đang chạy cụm Redis Cluster 3-nodes (`6579, 6679, 6779`) | **Đạt chuẩn 100%**, mật khẩu xác thực: `NatCash2022`. |
| **PostgreSQL** | Cụm PostgreSQL 13 tại `/u01/mascom/build/postgre_data/` | **Đạt chuẩn 100%**, Database `natcash_loyalty_db` và User `natcash_loyalty` đã khởi tạo. |
| **Thư mục ứng dụng** | `/u01/mascom/loyalty/` | **Đạt chuẩn 100%**, cấu trúc 8 thư mục con hoàn chỉnh, quyền `755`. |
| **Tự động khởi động** | Crontab Auto-Recovery & Backup | **Đạt chuẩn 100%**, tự phục hồi mỗi 2 phút và backup hàng ngày lúc 02:00. |

---

### 1.2. Danh Mục Các Dịch Vụ Và Cổng Mạng Mới Triển Khai

Bảng quy hoạch các dịch vụ và cổng mạng thực sự mới cần cấp phát trên máy chủ `10.228.37.65` cho hệ sinh thái Loyalty & GameHub:

| STT | Phân Hệ Mới Triển Khai | Cổng Mạng | Giao Thức | Vùng Mạng Tiếp Nhận | Địa Chỉ Truy Cập / Tên Miền | Thư Mục / Tiến Trình Máy Chủ | Tính Chất & Ý Nghĩa Nghiệp Vụ |
|:---:|---|:---:|:---:|---|---|---|---|
| **1** | **Backend Lõi (`loyalty-service`)** | **`8694`** | HTTP | **Chỉ Nội Bộ Máy Chủ** (`127.0.0.1`) | `http://127.0.0.1:8694/` | `/u01/mascom/loyalty/bin/loyalty-service.jar` | **Cổng Backend Mới**: Tiến trình Java 17 xử lý logic Loyalty, sổ cái điểm, minigame, vòng quay và bù trừ tài chính. |
| **2** | **Cổng Quản Trị CMS (`loyalty-cms`)** | **`8992`** | HTTP | **CHỈ NỘI BỘ VPN (KHÔNG RA NGOÀI)** | `http://10.228.37.65:8992/` | `/u01/mascom/loyalty/web/cms/` | **Cổng Nginx CMS Mới**: Giao diện quản trị cho cán bộ vận hành cấu hình chính sách, tạo voucher và đối soát bù trừ. |
| **3** | **Cổng Game Webview (`loyalty-webview`)** | **`8443`** | HTTPS (SSL) | **Công Khai Internet & VPN** | `https://uatloyalty.natcom.com.ht:8443/gamehub/` | `/u01/mascom/loyalty/web/webview/` | **Tên Miền Ảo Mới (SNI)**: Mở Webview H5 cho Mobile App `natcash-eu-app` chơi game, quay thưởng và điểm danh (trên Nginx SSL `8443` có sẵn). |
| **4** | **Điểm Cuối API Công Khai (POS & Webview)** | **`8443`** | HTTPS (SSL) | **Công Khai Internet & VPN** | `https://uatloyalty.natcom.com.ht:8443/loyalty/` | Nginx chuyển tiếp tới `http://127.0.0.1:8694/loyalty/` | **Đường Dẫn API Mới**: Phục vụ quầy thu ngân siêu thị (POS) quét mã QR trừ điểm và Webview gọi API (trên Nginx SSL `8443` có sẵn). |
| **5** | **Cơ Sở Dữ Liệu (`natcash_loyalty_db`)** | **`5432`** | TCP | **Chỉ Nội Bộ Máy Chủ** (`127.0.0.1`) | `jdbc:postgresql://127.0.0.1:5432/natcash_loyalty_db` | Cụm PostgreSQL có sẵn tại `/u01/mascom/build/postgre/` | **Database Mới (Không tạo port mới)**: Khởi tạo DB `natcash_loyalty_db` và User `natcash_loyalty` trên cụm PostgreSQL cổng `5432` có sẵn. |

#### Đánh Giá Trạng Thái Cấp Phát Cổng Mới:
* **Cổng `8694` (Backend Mới):** Hoàn toàn trống, tiếp nối chuẩn chuỗi Backend Natcash (`8690 → 8693 → 8694`), tránh xung đột Dropwizard admin `8085`.
* **Cổng `8992` (Frontend CMS Mới):** Hoàn toàn trống, tiếp nối chuẩn chuỗi Nginx CMS Natcash (`8989 → 8991 → 8992`), tránh tranh chấp cổng `8080`.
* **Cổng `8443` (Nginx HTTPS Có Sẵn):** Cấp thêm Tên miền ảo mới `uatloyalty.natcom.com.ht` thông qua cơ chế SNI có sẵn của Nginx.
* **Cổng `5432` (PostgreSQL Có Sẵn):** Sử dụng cổng DB có sẵn, chỉ chạy câu lệnh tạo mới Database `natcash_loyalty_db` và phân quyền người dùng.

---

## 2. KIẾN TRÚC MẠNG PHÂN TẦNG VÀ NGUYÊN TẮC GIAO TIẾP DỊCH VỤ

Hệ thống vận hành theo **Mô hình Phân Tầng An Ninh Tuyệt Đối**:
1. **Địa chỉ IP máy chủ (`10.228.37.65`) là IP nội bộ (Private IP), tuyệt đối KHÔNG public trực tiếp ra Internet.**
2. **Lưu lượng từ ngoài Internet:** Các ứng dụng di động, trình duyệt người dùng hoặc hệ thống POS bên ngoài cần gọi dịch vụ Loyalty **bắt buộc phải sử dụng Tên miền công khai `https://uatloyalty.natcom.com.ht:8443/...`** (được phân giải qua DNS, kiểm soát bởi Firewall/WAF và tiếp nhận bởi Nginx Reverse Proxy với chứng chỉ SSL Wildcard `star_natcom.com.ht`).
3. **Lưu lượng Backend nội bộ Natcash:** Vì các dịch vụ Backend của Natcash (`natcash-eu-api`, `natcash-messaging`, `payment-point`, `am-cms-be`, `loyalty-service`) **cùng được triển khai trên 1 máy chủ UAT `10.228.37.65`**, nên Backend của Natcash **gọi trực tiếp `loyalty-service` qua `http://localhost:8694` (hoặc `http://127.0.0.1:8694`)**, giúp đạt tốc độ xử lý tức thì, không tốn tài nguyên bắt tay SSL và không phụ thuộc đường truyền Internet.

```mermaid
flowchart LR
    subgraph S_INTERNET ["VÙNG NGOẠI VI & PUBLIC (TÊN MIỀN uatloyalty.natcom.com.ht)"]
        direction TB
        PUB_APP["Ứng Dụng Di Động natcash-eu-app<br/>• Truy cập Cổng Game: /gamehub/<br/>• Kết nối HTTPS qua Cổng 8443 SSL"]
        PUB_POS["POS Siêu Thị & Đối Tác Bên Ngoài<br/>• Quét mã QR trừ điểm: /loyalty/<br/>• Gọi qua Domain uatloyalty.natcom.com.ht:8443"]
        PUB_APP --> PUB_POS
    end

    subgraph S_INTRANET ["MÁY CHỦ UAT NATCASH ĐỒNG TRIỂN KHAI (10.228.37.65)"]
        direction TB
        INT_NGINX["Nginx SSL Ingress (Cổng 8443 SSL)<br/>• Tiếp nhận Tên miền uatloyalty.natcom.com.ht<br/>• Chuyển tiếp ngầm sang localhost:8694<br/>• Khóa 100% truy cập CMS tại root / (Mã 403)"]
        INT_CORE["loyalty-service Native JVM (Cổng 8694)<br/>• Tiếp nhận trực tiếp từ Backend Natcash qua localhost<br/>• Cơ sở dữ liệu: PostgreSQL 13 (Cổng 5432: natcash_loyalty_db)<br/>• Bộ nhớ đệm: Redis 6.2 (Cổng 6379: NatCash2022)"]
        INT_BE_NATCASH["Backend Natcash Đồng Máy Chủ (8686 / 8689)<br/>• natcash-eu-api (Gateway): 8686<br/>• natcash-messaging (SMS Gateway): 8689<br/>• Gọi 2 chiều với Loyalty qua localhost:8694"]
        INT_NGINX --> INT_CORE
        INT_BE_NATCASH <-->|Gọi trực tiếp qua localhost:8694| INT_CORE
    end

    S_INTERNET -->|Tên miền qua Firewall & SSL 8443| INT_NGINX
```

---

### 2.1. Phân Định Rõ Ràng Các Kênh Giao Tiếp

#### Kênh 1: Kênh Ngoại Vi / Public APIs (Bắt Buộc Dùng Domain `uatloyalty.natcom.com.ht`)
* **Không để lộ IP máy chủ:** Máy chủ `10.228.37.65` không public IP ra ngoài. Mọi truy cập từ Client ngoại vi phải trỏ về tên miền `uatloyalty.natcom.com.ht`.
* **Cổng Game Webview Mobile App:** Mở giao diện H5 Cổng Game & Vòng Quay May Mắn qua Domain công khai:
  `https://uatloyalty.natcom.com.ht:8443/gamehub/`
* **Quầy thu ngân POS & Đối tác bên ngoài:** Quét mã QR khấu trừ điểm hóa đơn trực tiếp qua:
  `https://uatloyalty.natcom.com.ht:8443/loyalty/api/v1/wallet/redeem`

#### Kênh 2: Kênh Backend Nội Bộ Đồng Máy Chủ UAT (Dùng Trực Tiếp `localhost` / `127.0.0.1`)
* **Gọi từ Backend Natcash (`natcash-eu-api`):** Chuyển tiếp JWT xác thực, cấp vé SSO, tra cứu số dư và đồng bộ thiết bị qua:
  `http://localhost:8694/loyalty/api/v1/...` (hoặc `http://127.0.0.1:8694/loyalty/api/v1/...`)
* **Gọi từ `loyalty-service` về Backend Natcash:** Bắn Webhook biến động điểm, yêu cầu gửi Push Notification hoặc gửi SMS Brandname qua:
  `http://localhost:8686/api/v1/loyalty/...` (hoặc `http://127.0.0.1:8686/api/v1/loyalty/...`) và `http://localhost:8689/message/send`

#### Kênh 3: Kênh Quản Trị Trung Tâm CMS (Chỉ Mở Trong Mạng Riêng VPN)
* **Cổng Quản Trị CMS:** **Chỉ chạy và truy cập trong mạng riêng VPN** qua địa chỉ `http://10.228.37.65:8992/`. Khóa 100% quyền truy cập từ ngoài Internet.

---

### 2.2. Danh Mục Tên Miền & Cổng Truy Cập Phân Theo Vùng Mạng

| Phân hệ / Dịch vụ đích | Đối tượng / Dịch vụ gọi | Phạm vi mạng | Địa chỉ URL / Tên miền | Cổng & Giao thức | Mục đích sử dụng |
|:---|:---|:---|:---|:---|:---|
| **Cổng Game & Vòng Quay Webview** | • Ứng dụng di động `natcash-eu-app`<br/>• Trình duyệt Mobile của người dùng | **Công khai qua Domain** | `https://uatloyalty.natcom.com.ht:8443/gamehub/` | `8443` (HTTPS SSL) | Mở giao diện H5 Vòng Quay May Mắn và Mini-game (kèm SSO Ticket: `?ticket={token}`). |
| **Điểm cuối API Loyalty Trực tiếp** | • Quầy thu ngân POS Siêu thị Delimart<br/>• Hệ thống đối tác liên minh | **Công khai qua Domain** | `https://uatloyalty.natcom.com.ht:8443/loyalty/` | `8443` (HTTPS SSL) | Quét mã QR Ví Phần Thưởng để khấu trừ điểm hóa đơn trực tiếp tại quầy thanh toán. |
| **Cổng API Gateway Mobile App** | • Ứng dụng di động `natcash-eu-app` | **Công khai qua Domain** | `https://testeuapi.natcom.com.ht:8443/api/v1/loyalty/` | `8443` (HTTPS SSL) | Tra cứu số dư điểm, đổi quà, đồng bộ `deviceId` thiết bị và sinh mã QR Ví Phần Thưởng 60 giây. |
| **Giao Tiếp Backend Natcash → Loyalty** | • API Gateway `natcash-eu-api` (`:8686`)<br/>• Các Backend Natcash khác | **Nội Bộ Đồng Máy Chủ (Localhost)** | `http://localhost:8694/loyalty/api/v1/` | `8694` (HTTP Nội bộ) | Chuyển tiếp JWT xác thực, cấp vé SSO, đồng bộ thiết bị trực tiếp qua localhost. |
| **Giao Tiếp Loyalty → Backend Natcash** | • Tiến trình `loyalty-service` (`:8694`) | **Nội Bộ Đồng Máy Chủ (Localhost)** | `http://localhost:8686/api/v1/loyalty/...` | `8686` (HTTP Nội bộ) | Gửi Webhook biến động số dư, đẩy Push Notification và gửi SMS Brandname qua cổng 8689. |
| **Cổng Quản Trị Trung Tâm CMS** | • Ban quản trị Natcash / Lập trình viên<br/>• Nhân viên vận hành liên minh | **CHỈ NỘI BỘ VPN (KHÔNG RA NGOÀI)** | `http://10.228.37.65:8992/` | `8992` (HTTP Nội bộ) | Đăng nhập qua VPN nội bộ để cấu hình chính sách, tạo chiến dịch, quản lý mã voucher và đối soát bù trừ. |

---

### 2.3. Ma Trận Luồng Kết Nối Hai Chiều Chi Tiết

| STT | Luồng kết nối | Nguồn phát | Đích tiếp nhận | Tuyến đường & Giao thức | Ý nghĩa & Nội dung xử lý |
|:---:|:---|:---|:---|:---|:---|
| **1** | **Mở Webview Game & Vòng Quay** | `natcash-eu-app` (Internet) | Nginx Reverse Proxy | `https://uatloyalty.natcom.com.ht:8443/gamehub/?ticket=...` (HTTPS) | App mở Webview H5 qua Domain công khai, nạp tài nguyên tĩnh và cấu hình runtime. |
| **2** | **Gọi API Nghiệp vụ Ví / QR từ App** | `natcash-eu-app` (Internet) | `natcash-eu-api` (Gateway) | `https://testeuapi.natcom.com.ht:8443/api/v1/loyalty/...` (HTTPS) | App gọi Gateway lấy thông tin hội viên, đổi quà và sinh mã QR động 60 giây. |
| **3** | **Chuyển tiếp JWT & Xác thực** | `natcash-eu-api` (Đồng máy chủ) | `loyalty-service` (Đồng máy chủ) | `http://localhost:8694/loyalty/api/v1/...` (HTTP Localhost) | Gateway giải mã JWT, gán `X-Tenant-Id: TENANT_NATCASH` và forward trực tiếp qua localhost. |
| **4** | **Đồng bộ Device ID** | `natcash-eu-api` (Đồng máy chủ) | `loyalty-service` (Đồng máy chủ) | `http://localhost:8694/loyalty/api/v1/device/register` (HTTP Localhost) | Đồng bộ `deviceId` thiết bị khi đăng nhập để định danh gửi Push Notification chính xác. |
| **5** | **Webhook Biến Động Điểm / Hoàn Tiền** | `loyalty-service` (Đồng máy chủ) | `natcash-eu-api` (Đồng máy chủ) | `http://localhost:8686/api/v1/loyalty/webhook/...` (HTTP Localhost) | Webhook Transactional Outbox gửi thông báo hoàn tiền in-game hoặc biến động số dư qua localhost. |
| **6** | **Gửi Push Notification** | `loyalty-service` (Đồng máy chủ) | `natcash-eu-api` → FCM/APNs | `http://localhost:8686/api/v1/loyalty/push-notification` (HTTP Localhost) | Đẩy thông báo hiển thị đúng Logo và Thương hiệu Ví Natcash tới thiết bị người dùng. |
| **7** | **Gửi Tin Nhắn SMS Brandname** | `loyalty-service` (Đồng máy chủ) | `natcash-messaging` (Đồng máy chủ) | `http://localhost:8689/message/send` (HTTP Localhost) | Gửi tin nhắn SMS Brandname thông báo biến động điểm và mã quà tặng. |
| **8** | **Khấu trừ Ví Phần Thưởng tại POS** | POS Siêu thị / Đối tác (Internet) | Nginx → `loyalty-service` | `https://uatloyalty.natcom.com.ht:8443/loyalty/api/v1/wallet/redeem` (HTTPS) | Quầy thu ngân quét mã QR Ví Phần Thưởng để trừ điểm (xác thực HMAC-SHA256 qua Domain). |

---

### 2.4. Cấu hình Mở Cổng Tường Lửa (Firewall Rules & Port Whitelisting)

1. **Cổng Công Khai (Mở từ mạng ngoài Internet / VPN Viễn thông qua Domain):**
   * `8443` (TCP): Cổng Nginx HTTPS bảo mật phục vụ Webview, CMS và API qua chứng chỉ SSL Wildcard `*.natcom.com.ht`.
   * `8992` (TCP): Cổng Nginx HTTP phục vụ Cổng Quản Trị CMS nội bộ.
2. **Cổng Nội Bộ Máy Chủ (Chỉ cho phép kết nối giữa các tiến trình nội bộ `127.0.0.1` / `10.228.37.65`, tuyệt đối không mở ra ngoài):**
   * `8694` (TCP): Cổng Backend `loyalty-service`.
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
*(Ghi chú: 17 bảng cơ sở dữ liệu và dữ liệu ban đầu sẽ được Spring Boot Flyway Migration tự động tạo khi `loyalty-service` khởi động lần đầu).*

---

### 3.2. Bổ sung Cấu hình Bộ Nhớ Đệm Redis 7
* Cụm Redis đang chạy tại cổng `6379` (`/u01/mascom/build/redis/node-6379/`).
* Thông số xác thực kết nối vào Redis cho Loyalty Service:
  * **Host:** `127.0.0.1`
  * **Port:** `6379`
  * **Password:** `NatCash2022`
  * **Database:** `0`
  * **Timeout:** `2000ms`

---

### 3.3. Bổ sung Cấu trúc Thư Mục Ứng Dụng `/u01/mascom/loyalty/`
Chạy lệnh tạo toàn bộ cây thư mục khép kín:
```bash
mkdir -p /u01/mascom/loyalty/{bin,config,locales,web/cms,web/webview,scripts,logs,backups}
chmod -R 755 /u01/mascom/loyalty
```

Cây thư mục chuẩn hóa:
```
/u01/mascom/loyalty/
├── bin/                            # Chứa file loyalty-service.jar
├── config/                         # Chứa application-onprem.yml, env-config-*.json
├── locales/                        # Chứa vi.json, en.json, fr.json, ht.json
├── web/
│   ├── cms/                        # Gói tĩnh Cổng Quản Trị Trung Tâm CMS
│   └── webview/                    # Gói tĩnh Cổng Game Webview & Lucky Wheel
├── scripts/                        # Kịch bản quản trị start, stop, restart, healthcheck
├── logs/                           # Nhật ký hoạt động app.log, gc.log
└── backups/                        # Lưu trữ bản backup DB định kỳ
```

---

## 4. NỘI DUNG TỆP CẤU HÌNH VÀ KỊCH BẢN VẬN HÀNH

### 4.1. Tệp Cấu hình Ngoại Vi Backend (`config/application-onprem.yml`)

```yaml
server:
  port: 8694
  shutdown: graceful
  servlet:
    context-path: /

spring:
  application:
    name: loyalty-service-natcash
  lifecycle:
    timeout-per-shutdown-phase: 30s
  datasource:
    url: jdbc:postgresql://127.0.0.1:5432/natcash_loyalty_db?sslmode=disable
    username: natcash_loyalty
    password: Natcash$SecureDB2026!
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 30
      minimum-idle: 5
      pool-name: LoyaltyNatcashHikariCP
  redis:
    host: 127.0.0.1
    port: 6379
    password: NatCash2022
    database: 0
    timeout: 2000ms
  messages:
    basename: file:/u01/mascom/loyalty/locales/messages
    encoding: UTF-8
    cache-duration: 3600

loyalty:
  deployment-mode: ON_PREMISE
  default-tenant-id: TENANT_NATCASH
  partner-code: NATCASH_WALLET
  gateway:
    endpoint: http://10.228.37.65:8686
  security:
    timestamp-tolerance-seconds: 300
  outbox:
    max-retries: 5
    publish-interval-ms: 2000
  locales-path: /u01/mascom/loyalty/locales

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
```

---

### 4.2. Cấu hình Nginx Hợp Nhất 1 Tệp Duy Nhất (`/u01/mascom/build/nginx/conf/natcash/loyalty_game.conf`)

Toàn bộ dịch vụ Webview Game H5, API Reverse Proxy và Cổng Quản trị CMS được tích hợp khép kín trong **1 tệp cấu hình duy nhất**. Tệp này được Nginx nạp tự động qua dòng lệnh `include /u01/mascom/build/nginx/conf/natcash/*.conf;` có sẵn trong `nginx.conf`:

```nginx
# ==============================================================================
# CẤU HÌNH NGINX HỢP NHẤT CHO TOÀN BỘ HỆ SINH THÁI LOYALTY & GAMEHUB (NATCASH)
# Vị trí tệp trên máy chủ: /u01/mascom/build/nginx/conf/natcash/loyalty_game.conf
# ==============================================================================

# ------------------------------------------------------------------------------
# KHỐI UPSTREAM DÙNG CHUNG: KẾT NỐI BACKEND LOYALTY (JAVA 17 NATIVE CỔNG 8694)
# ------------------------------------------------------------------------------
upstream loyalty_backend_upstream {
    server 127.0.0.1:8694 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

# ------------------------------------------------------------------------------
# KHỐI SERVER 1: MỞ RA INTERNET (CỔNG 8443 HTTPS SSL — CHỈ MỞ WEBVIEW & API)
# Tên miền: uatloyalty.natcom.com.ht (Khóa 100% truy cập CMS từ ngoài Internet)
# ------------------------------------------------------------------------------
server {
    listen 8443 ssl;
    server_name uatloyalty.natcom.com.ht testloyalty.natcom.com.ht loyalty.natcom.com.ht;

    # Chứng chỉ SSL Wildcard *.natcom.com.ht có sẵn trên máy chủ
    ssl_certificate     /u01/mascom/build/nginx/conf/natcash/star_natcom.com.ht-nginx.crt;
    ssl_certificate_key /u01/mascom/build/nginx/conf/natcash/star_natcom.com.ht.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL_LOYALTY:10m;
    ssl_session_timeout 10m;

    access_log /u01/mascom/build/nginx/logs/loyalty_public.access.log;
    error_log  /u01/mascom/build/nginx/logs/loyalty_public.error.log;

    # Nén Gzip tối ưu băng thông
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # 1. Điểm Cuối API Loyalty Công Khai (Chuyển tiếp cho Mobile App, Webview và POS)
    location /loyalty/ {
        proxy_pass http://loyalty_backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 2. Cổng Game Webview H5 Đa Năng Cho Ứng Dụng Di Động
    location /gamehub/ {
        alias /u01/mascom/loyalty/web/webview/;
        index index.html;
        try_files $uri $uri/ /gamehub/index.html;

        # Cấu hình không lưu đệm cho file cấu hình runtime và từ điển ngôn ngữ
        location ~* /gamehub/(config|locales)/ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires 0;
        }

        # Lưu đệm tài nguyên tĩnh (JS, CSS, Ảnh, Font)
        location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    # 3. Khóa Toàn Bộ Truy Cập CMS Từ Ngoài Internet (Trả Về Mã 403 Forbidden)
    location / {
        return 403 "Forbidden: Admin CMS is only accessible via internal VPN network.";
    }
}

# ------------------------------------------------------------------------------
# KHỐI SERVER 2: CHỈ MỞ NỘI BỘ VPN (CỔNG 8992 HTTP — PHỤC VỤ CMS QUẢN TRỊ VIÊN)
# Truy cập qua VPN: http://10.228.37.65:8992/
# ------------------------------------------------------------------------------
server {
    listen 8992;
    server_name 10.228.37.65 localhost loyalty-admin.natcom.com.ht;

    access_log /u01/mascom/build/nginx/logs/loyalty_internal.access.log;
    error_log  /u01/mascom/build/nginx/logs/loyalty_internal.error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # 1. Cổng Quản Trị Trung Tâm CMS Nội Bộ
    location / {
        root /u01/mascom/loyalty/web/cms;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cấu hình không lưu đệm cho file cấu hình runtime và từ điển ngôn ngữ
        location ~* /(config|locales)/ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires 0;
        }

        # Lưu đệm tài nguyên tĩnh
        location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    # 2. Chuyển Tiếp API Cho Cổng Quản Trị CMS Nội Bộ
    location /loyalty/ {
        proxy_pass http://loyalty_backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 3. Cho Phép Kiểm Thử Cổng Game Ngay Trong Mạng Nội Bộ VPN
    location /gamehub/ {
        alias /u01/mascom/loyalty/web/webview/;
        index index.html;
        try_files $uri $uri/ /gamehub/index.html;
    }
}
```

---

### 4.3. Kịch bản Quản trị Dịch vụ (`scripts/`)

#### 1. `scripts/start.sh`: Khởi động dịch vụ Java 17 ngầm
```bash
#!/usr/bin/env bash
set -e

APP_DIR="/u01/mascom/loyalty"
JAVA_BIN="/u01/mascom/build/jdk17/bin/java"
JAR_FILE="$APP_DIR/bin/loyalty-service.jar"
CONFIG_FILE="$APP_DIR/config/application-onprem.yml"
LOG_FILE="$APP_DIR/logs/app.log"
PID_FILE="$APP_DIR/scripts/app.pid"

if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "[CẢNH BÁO] Loyalty Service đang chạy với PID: $(cat "$PID_FILE")"
    exit 0
fi

echo "[START] Đang khởi động Loyalty Service với JDK 17..."
JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+ExitOnOutOfMemoryError"

cd "$APP_DIR"
nohup $JAVA_BIN $JAVA_OPTS \
    -Dspring.config.additional-location=file:$CONFIG_FILE \
    -jar $JAR_FILE > $LOG_FILE 2>&1 &

PID=$!
echo $PID > "$PID_FILE"
echo "[START] Khởi động thành công với PID: $PID"
echo "[START] Theo dõi nhật ký: tail -f $LOG_FILE"
```

#### 2. `scripts/stop.sh`: Dừng dịch vụ êm ái
```bash
#!/usr/bin/env bash
APP_DIR="/u01/mascom/loyalty"
PID_FILE="$APP_DIR/scripts/app.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "[INFO] Không tìm thấy tệp PID. Loyalty Service không chạy."
    exit 0
fi

PID=$(cat "$PID_FILE")
echo "[STOP] Đang gửi tín hiệu dừng êm ái tới PID: $PID..."
kill -15 $PID 2>/dev/null || true

COUNT=0
while kill -0 $PID 2>/dev/null; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge 30 ]; then
        echo "[STOP] Hết thời gian chờ 30s. Bắt buộc dừng tiến trình (kill -9)..."
        kill -9 $PID 2>/dev/null || true
        break
    fi
done

rm -f "$PID_FILE"
echo "[STOP] Loyalty Service đã dừng hoàn toàn."
```

#### 3. `scripts/restart.sh`: Khởi động lại
```bash
#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
$DIR/stop.sh
sleep 2
$DIR/start.sh
```

#### 4. `scripts/healthcheck.sh`: Kiểm tra sức khỏe dịch vụ
```bash
#!/usr/bin/env bash
echo "=== KIỂM TRA SỨC KHỎE DỊCH VỤ LOYALTY ==="
curl -s -f http://127.0.0.1:8694/actuator/health/liveness || { echo "[LỖI] Liveness FAILED"; exit 1; }
echo " -> Liveness: OK (Tiến trình đang sống)"

curl -s -f http://127.0.0.1:8694/actuator/health/readiness || { echo "[LỖI] Readiness FAILED"; exit 1; }
echo " -> Readiness: OK (Sẵn sàng tiếp nhận lưu lượng)"
echo "=== TOÀN BỘ HỆ THỐNG HOẠT ĐỘNG TỐT 100% ==="
```

---

## 5. BỔ SUNG TỰ ĐỘNG HÓA VẬN HÀNH & GIÁM SÁT SỐNG (CRONTAB)

Để đảm bảo hệ thống tự phục hồi khi gặp sự cố hoặc sau khi máy chủ khởi động lại, bổ sung các tác vụ Crontab sau cho người dùng `mascom` (`crontab -e`):

```bash
# 1. Tự động khởi động lại PostgreSQL và Loyalty Service khi máy chủ Reboot
@reboot /u01/mascom/build/postgre/start.sh > /dev/null 2>&1
@reboot sleep 10 && /u01/mascom/loyalty/scripts/start.sh > /dev/null 2>&1

# 2. Giám sát tự động (Liveness Monitor) mỗi 2 phút: Tự khởi động lại nếu tiến trình bị chết
*/2 * * * * curl -s -f http://127.0.0.1:8694/actuator/health/liveness > /dev/null 2>&1 || /u01/mascom/loyalty/scripts/start.sh > /dev/null 2>&1

# 3. Tự động sao lưu dữ liệu cơ sở dữ liệu hàng ngày vào 02:00 sáng
0 2 * * * /u01/mascom/build/postgre/bin/pg_dump -h 127.0.0.1 -U natcash_loyalty natcash_loyalty_db | gzip > /u01/mascom/loyalty/backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 6. QUY TRÌNH THỰC HIỆN TRIỂN KHAI 5 BƯỚC (STEP-BY-STEP)

```mermaid
flowchart LR
    subgraph S_PREPARE ["GIAI ĐOẠN 1: CHUẨN BỊ VÀ ĐÓNG GÓI"]
        direction TB
        P1["Bước 1: Khởi Tạo Hạ Tầng Máy Chủ<br/>• Khởi tạo PostgreSQL data & tạo Database<br/>• Tạo cấu trúc thư mục /u01/mascom/loyalty/<br/>• Phân quyền thực thi cho thư mục ứng dụng"]
        P2["Bước 2: Đóng Gói Mã Nguồn Cục Bộ<br/>• Biên dịch loyalty-service.jar qua Maven<br/>• Đóng gói Cổng Quản Trị CMS ra dist/<br/>• Đóng gói Cổng Webview GameHub ra dist/"]
        P1 --> P2
    end

    subgraph S_DEPLOY ["GIAI ĐOẠN 2: CHUYỂN GIAO VÀ VẬN HÀNH"]
        direction TB
        P3["Bước 3: Đồng Bộ Và Triển Khai<br/>• Truyền JAR và gói web tĩnh qua SCP<br/>• Nạp cấu hình Nginx 8443 & 8992<br/>• Khởi động dịch vụ Java 17 qua start.sh"]
        P4["Bước 4: Thiết Lập Crontab Tự Động<br/>• Giám sát liveness tự động khởi động lại<br/>• Tự khởi chạy dịch vụ khi máy chủ Reboot<br/>• Tự động sao lưu dữ liệu lúc 02:00 sáng"]
        P5["Bước 5: Kiểm Thử Nghiệm Thu<br/>• Kiểm tra liveness & readiness qua healthcheck.sh<br/>• Kiểm thử truy cập CMS nội bộ cổng 8992<br/>• Kiểm thử truy cập Webview Internet cổng 8443"]
        P3 --> P4
        P4 --> P5
    end

    S_PREPARE --> S_DEPLOY
```

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
mkdir -p /u01/mascom/loyalty/{bin,config,locales,web/cms,web/webview,scripts,logs,backups}
chmod -R 755 /u01/mascom/loyalty
```

### Bước 2: Đóng gói mã nguồn tại máy phát triển
```bash
# 1. Đóng gói Backend Java
cd src/service
mvn clean package -DskipTests

# 2. Đóng gói Frontend CMS
cd ../cms
npm run build

# 3. Đóng gói Frontend Webview
cd ../webview
npm run build
```

### Bước 3: Đẩy tệp lên máy chủ (SCP)
```bash
# 1. Đẩy Backend JAR
scp src/service/target/loyalty-service.jar mascom@10.228.37.65:/u01/mascom/loyalty/bin/

# 2. Đẩy Frontend CMS & Webview
scp -r src/cms/dist/* mascom@10.228.37.65:/u01/mascom/loyalty/web/cms/
scp -r src/webview/dist/* mascom@10.228.37.65:/u01/mascom/loyalty/web/webview/

# 3. Đẩy cấu hình và từ điển đa ngôn ngữ
scp deploy/natcash/config/backend/application-natcash.yml mascom@10.228.37.65:/u01/mascom/loyalty/config/application-onprem.yml
scp deploy/natcash/config/frontend/env-config.json mascom@10.228.37.65:/u01/mascom/loyalty/config/env-config-cms.json
scp deploy/natcash/config/frontend/env-config.json mascom@10.228.37.65:/u01/mascom/loyalty/config/env-config-webview.json
scp -r deploy/natcash/locales/* mascom@10.228.37.65:/u01/mascom/loyalty/locales/
```

### Bước 4: Thiết lập và tải lại cấu hình Nginx
```bash
# 1. Đẩy file cấu hình Nginx
scp deploy/natcash/config/nginx/nginx-natcash.conf mascom@10.228.37.65:/u01/mascom/build/nginx/conf/natcash/loyalty_game.conf

# 2. Kiểm tra và tải lại trên máy chủ
/u01/mascom/build/nginx/sbin/nginx -t
/u01/mascom/build/nginx/sbin/nginx -s reload
```

### Bước 5: Khởi chạy và Nghiệm thu
```bash
# 1. Khởi động Loyalty Service
chmod +x /u01/mascom/loyalty/scripts/*.sh
/u01/mascom/loyalty/scripts/start.sh

# 2. Kiểm tra sức khỏe dịch vụ
/u01/mascom/loyalty/scripts/healthcheck.sh

# 3. Kiểm tra các dịch vụ và URL truy cập
# Cổng Game Webview (Public): https://uatloyalty.natcom.com.ht:8443/gamehub/
# API Gateway Loyalty (Public): https://uatloyalty.natcom.com.ht:8443/loyalty/
# Cổng Quản Trị CMS (VPN Nội bộ): http://10.228.37.65:8992/
```
