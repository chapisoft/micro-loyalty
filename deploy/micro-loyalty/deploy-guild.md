# HƯỚNG DẪN TRIỂN KHAI NỀN TẢNG LOYALTY VÀ CỔNG GAME ĐỒNG HẠ TẦNG DIP VÀ SMART-OTP

**Mô hình triển khai:** Cụm Docker Compose độc lập kết hợp Nginx Master và Cloudflare Tunnel  
**Địa chỉ máy chủ:** `35.247.156.176` (IP LAN: `192.168.1.200`, Cổng SSH: `65000`, Tài khoản quản trị: `root`)  
**Hệ điều hành:** Ubuntu Linux 22.04 LTS x86_64 (Kernel 5.15.0)  
**Tên miền hệ thống chính thức:** `api.mid.io.vn`, `docs.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn`, `jenskin.mid.io.vn` (tên miền phụ tương thích: `jenkins.mid.io.vn`) (Gốc: `mid.io.vn`)  
**Thư mục cài đặt dịch vụ:** `/data/uc1-software/apps/micro-loyalty/deploy/`  
**Nguyên tắc an toàn vận hành:** Tuyệt đối không tự ý thực thi triển khai (deploy), đồng bộ tệp hay can thiệp máy chủ từ xa khi chưa có yêu cầu tường minh từ người dùng.

---

## 1. THÔNG SỐ HIỆN TRẠNG, ĐÁNH GIÁ TÀI NGUYÊN VÀ ĐIỀU KIỆN CẦN BỔ SUNG

### 1.1. Bảng Khảo Sát Hiện Trạng Hạ Tầng Máy Chủ (`35.247.156.176` / `192.168.1.200`)

Khảo sát trực tiếp toàn diện hệ thống máy chủ `35.247.156.176` (IP LAN `192.168.1.200`) ghi nhận các thông số kỹ thuật hạ tầng:

| Thành phần | Hiện trạng thực tế trên máy chủ 35.247.156.176 | Đánh giá và Yêu cầu đáp ứng |
|:---|:---|:---|
| **Hệ điều hành** | Ubuntu Linux 22.04.4 LTS x86_64 (Kernel 5.15.0) | Môi trường vùng chứa Docker hiện đại, ổn định. |
| **Năng lực xử lý CPU** | 8 Cores (Intel Xeon CPU E5450 @ 3.00GHz) | Mức tải trung bình dưới 25%, năng lực xử lý rất tốt. |
| **Bộ nhớ RAM vật lý** | Tổng 32.0 GB (Đang sử dụng: ~21.0 GB, Khả dụng: **~8.5 GB**) | Đạt chuẩn xuất sắc, đủ bộ nhớ cấp phát cho hệ thống. |
| **Dung lượng lưu trữ** | Phân vùng gốc dung lượng 272 GB (Đã dùng: **86 GB**, Khả dụng: **173 GB**, chiếm **34%**) | Đã dọn dẹp giải phóng 134 GB và cấu hình chu kỳ tự động dọn dẹp nhật ký 3 ngày. |
| **Môi trường điều phối** | Docker Engine 24.x, Docker Compose v2, Docker Swarm | Đạt chuẩn, sẵn sàng quản trị vùng chứa tự động. |
| **Máy chủ Web Nginx Host** | Nginx Gateway cổng `80/443` (Chứng chỉ SSL Let's Encrypt) | Đạt chuẩn, cấu hình Virtual Hosts cho `*.mid.io.vn`. |
| **Hệ thống giám sát APM** | Prometheus cổng `9090`, Grafana cổng `3000`, Alertmanager cổng `9093` | Có sẵn, tích hợp thu thập chỉ số hiệu năng trực tiếp. |
| **Hệ thống lưu vết ELK** | Elasticsearch cổng `9200`, Logstash cổng `5044`, Kibana cổng `5601` | Có sẵn, tập trung toàn bộ nhật ký dịch vụ qua Filebeat. |
| **Định tuyến Công khai** | Cloudflare Tunnel (`cloudflared`) + Nginx Master (`/data/uc3-infra/nginx-master/conf.d/loyalty.conf` và `jenkins.conf`) | Đã cấu hình sẵn, định tuyến 5 tên miền dịch vụ về cổng `18095` và tên miền Jenkins CI/CD (`jenskin.mid.io.vn`, `jenkins.mid.io.vn`) về cổng `18099`. |

---

### 1.2. Đánh Giá Tài Nguyên Thực Tế Và Khả Năng Vận Hành Cùng DIP Và Smart-OTP

Máy chủ hiện đang vận hành đồng thời ba nhóm hệ thống chính:
1. **Cụm Nền tảng DIP:** Cơ sở dữ liệu Oracle XE 21c (4GB RAM), PostgreSQL 15 (cổng `5432`), Redis 7 (cổng `6379`), MinIO S3 (cổng `9000/9001`), Apache Kafka (cổng `9092`), cụm microservices DIP (`iam-service`, `core-service`, `notification-service`...).
2. **Cụm Smart-OTP:** Nginx Gateway (cổng `18090`), 4 microservices Java (`authentication-service` cổng `8080`, `partner-service` cổng `8081`, `customer-service` cổng `8082`, `cms-service` cổng `8085`), CMS Admin Web (cổng `80`), PostgreSQL 16 (cổng `15433`), Redis 7 (cổng `16380`).
3. **Cụm Micro-CRM:** Nginx Gateway (cổng `18080`), PostgreSQL 16 (cổng `15432`), Redis 7 (cổng `16379`), Kafka (cổng `19094`).

#### Bảng Cân Đối Bộ Nhớ RAM Trước Và Sau Khi Triển Khai

| Phân nhóm hệ thống | Dung lượng RAM chiếm dụng | Tỷ lệ phần trăm | Ghi chú và Phân bổ tài nguyên |
|:---|:---:|:---:|:---|
| **Hệ điều hành và Bộ đệm Kernel** | 3.0 GB | 9.4% | Duy trì hoạt động nhân Linux và bộ nhớ ảo. |
| **Hạ tầng Nền tảng DIP** | 9.0 GB | 28.1% | Oracle XE, Kafka, Redis, PostgreSQL và 7 dịch vụ DIP. |
| **Cụm ghi vết ELK và Giám sát APM** | 3.5 GB | 10.9% | Elasticsearch, Kibana, Prometheus, Grafana. |
| **Cụm hệ thống Micro-CRM** | 4.0 GB | 12.5% | Các dịch vụ quản trị quan hệ khách hàng. |
| **Cụm hệ thống Smart-OTP** | 2.5 GB | 7.8% | 4 dịch vụ xác thực Soft OTP, PostgreSQL và Redis. |
| **Hệ sinh thái Loyalty thực tế (11 vùng chứa)** | **~3.45 GB** | **10.8%** | 5 Microservices Thin-JAR (`~3.35 GB`), 3 Frontend + Gateway (`~95 MB`), PostgreSQL + Redis (`~85 MB`). |
| **Bộ nhớ RAM dự phòng an toàn** | **~6.55 GB** | **20.5%** | Vùng đệm tài nguyên an toàn cho toàn bộ máy chủ. |
| **Tổng dung lượng bộ nhớ** | **32.0 GB** | **100.0%** | Năng lực phần cứng vật lý của máy chủ. |

#### Ma Trận Phân Bổ Cổng Mạng Chống Xung Đột

| Dịch vụ và Phân hệ | Cổng mạng Host | Giao thức | Dự án sở hữu | Trạng thái xung đột |
|:---|:---:|:---:|:---|:---:|
| **DIP PostgreSQL & Redis** | `5432`, `6379` | TCP | Hệ thống DIP | Đang chạy, không giao thoa |
| **Micro-CRM PostgreSQL & Redis** | `15432`, `16379` | TCP | Hệ thống Micro-CRM | Đang chạy, không giao thoa |
| **Smart-OTP PostgreSQL & Redis** | `15433`, `16380` | TCP | Hệ thống Smart-OTP | Đang chạy, không giao thoa |
| **Smart-OTP Nginx Gateway** | `18090` | TCP HTTP | Hệ thống Smart-OTP | Đang chạy, không giao thoa |
| **Loyalty PostgreSQL Chuyên Dụng** | **`15435`** | TCP | Hệ sinh thái Loyalty | Cấp phát mới, độc lập hoàn toàn |
| **Loyalty Redis Chuyên Dụng** | **`16385`** | TCP | Hệ sinh thái Loyalty | Cấp phát mới, độc lập hoàn toàn |
| **Loyalty Nginx API Gateway Nội Bộ** | **`18095`** | TCP HTTP | Hệ sinh thái Loyalty | Cấp phát mới, độc lập hoàn toàn |
| **Cụm 5 Microservices Loyalty** | `8081`–`8085` (chỉ mở nội bộ Docker qua `expose`) | TCP HTTP | Hệ sinh thái Loyalty | Cách ly hoàn toàn trong `loyalty-saas-network`, tránh xung đột cổng Host `8081`/`8085` |

#### Chiến Lược Tận Dụng Hạ Tầng Sẵn Có Để Tiết Kiệm Tài Nguyên
1. **Tận dụng Nginx Host (`80/443`):** Cấu hình Virtual Hosts điều hướng 5 tên miền `api.mid.io.vn`, `docs.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn` vào cổng nội bộ `18095`, đồng thời điều hướng `jenskin.mid.io.vn` (song song `jenkins.mid.io.vn`) vào cổng Jenkins `18099`.
2. **Tận dụng Prometheus và Grafana:** Nạp điểm kiểm tra `/actuator/prometheus` của dịch vụ Loyalty vào máy chủ Prometheus có sẵn (cổng `9090`) và hiển thị bảng biểu giám sát trên Grafana (cổng `3000`).
3. **Tận dụng ELK Stack:** Đẩy nhật ký dịch vụ dạng cấu trúc JSON về cụm Elasticsearch (cổng `9200`) để tra cứu tập trung trên Kibana (cổng `5601`).
4. **Triển khai trực tiếp qua SSH + Docker Compose:** Đóng gói bản dựng bất biến tại máy trạm, đồng bộ lên `/data/uc1-software/apps/micro-loyalty/deploy` và khởi chạy lại các container mục tiêu qua SSH.

**Kết luận đánh giá:** Máy chủ `35.247.156.176` (`192.168.1.200`) hoàn toàn đáp ứng đầy đủ các tiêu chuẩn kỹ thuật để vận hành ổn định hệ sinh thái Loyalty.

---

## 2. KIẾN TRÚC MẠNG PHÂN TẦNG VÀ DANH MỤC TÊN MIỀN BẮT BUỘC

Hệ thống được thiết kế theo mô hình mạng phân tầng đa lớp, phân định rõ ràng luồng truy cập công khai từ Internet qua API Gateway và luồng liên lạc nội bộ giữa 11 vùng chứa Docker:

| Tầng kiến trúc | Thành phần | Vùng chứa / Cổng | Nhiệm vụ định tuyến & Xử lý |
| :--- | :--- | :--- | :--- |
| **Tầng 1: Cửa ngõ công khai** | Cloudflare Tunnel & Nginx Host Master | `80/443` → `172.18.0.1:18095` | Tiếp nhận 5 tên miền `*.mid.io.vn`, kiểm tra an toàn và chuyển tiếp về Gateway cụm Loyalty |
| **Tầng 2: API Gateway nội bộ** | Nginx Gateway (`loyalty-saas-gateway`) | `18095:80` | Ánh xạ tiền tố URI bằng `map $uri $loyalty_api_upstream` về đúng Microservice và 3 Frontend |
| **Tầng 3: 5 Microservices Thin-JAR** | `cms-service`, `customer-service`, `game-service`, `campaign-service`, `partner-service` | `8081`–`8085` (nội bộ Docker) | Xử lý độc lập từng miền nghiệp vụ, triển khai tách biệt không gián đoạn dịch vụ khác |
| **Tầng 4: 3 Cổng giao diện SPA** | `loyalty-cms`, `loyalty-webview`, `loyalty-partner-portal` | `80` (nội bộ Docker) | Phục vụ tệp tĩnh bất biến, nạp động `config/env-config.json` và `locales/*.json` lúc thực thi |
| **Tầng 5: Dữ liệu & Khóa phân tán** | `loyalty-saas-postgres`, `loyalty-saas-redis` | Host `15435` (`5432`), `16385` (`6379`) | Lưu trữ `loyalty_db` (`V1`–`V27`) và khóa phân tán Redisson RLock dùng chung cho 5 Microservices |

---

### 2.1. Phân Định Hai Tầng Kết Nối

#### Tầng 1: Kết Nối Ngoại Vi Từ Internet Qua Nginx Host
* Người dùng, quản trị viên và đối tác truy cập thông qua 5 Tên miền chuẩn với chứng chỉ SSL:
  * **Cổng API Lõi Backend:** `https://api.mid.io.vn/`
  * **Tài Liệu Kỹ Thuật OpenAPI / Swagger:** `https://docs.mid.io.vn/`
  * **Cổng Quản Trị Trung Tâm CMS:** `https://cms.mid.io.vn/`
  * **Cổng Trải Nghiệm Khách Hàng Webview & GameHub:** `https://portal.mid.io.vn/`
  * **Cổng Thông Tin Đối Tác Partner Portal:** `https://partner.mid.io.vn/`
  * **Cổng Quản Trị Và Theo Dõi CI/CD Jenkins:** `https://jenskin.mid.io.vn/` (tên miền phụ tương thích: `https://jenkins.mid.io.vn/`)
* Nginx Master tiếp nhận yêu cầu và chuyển tiếp nội bộ tới vùng chứa `loyalty-saas-gateway` trên cổng `18095` (riêng lưu lượng `jenskin.mid.io.vn` và `jenkins.mid.io.vn` chuyển tiếp tới vùng chứa `loyalty-jenkins` trên cổng `18099`).

#### Tầng 2: Mạng Riêng Nội Bộ Docker Bridge
* Mạng riêng `loyalty-saas-network` cô lập 100% các luồng giao tiếp giữa 11 vùng chứa:
  * `loyalty-saas-gateway` định tuyến API theo tiền tố URI tới `cms-service:8081`, `customer-service:8082`, `game-service:8083`, `campaign-service:8084`, `partner-service:8085`.
  * `loyalty-saas-gateway` phục vụ giao diện tới `loyalty-cms:80`, `loyalty-webview:80` và `loyalty-partner-portal:80`.
  * Cả 5 Microservices kết nối tới `loyalty-saas-postgres:5432` (cổng Host `15435`, giới hạn Hikari Pool tối đa `12` kết nối/dịch vụ) và `loyalty-saas-redis:6379` (cổng Host `16385`).

---

### 2.2. Danh Mục Tên Miền Và Điểm Cuối Dịch Vụ

| Phân hệ dịch vụ đích | Đối tượng gọi dịch vụ | Phạm vi mạng | Địa chỉ Tên miền và URL | Cổng và Giao thức | Mục đích sử dụng |
|:---|:---|:---|:---|:---|:---|
| **Cổng API RESTful Backend** | • Ứng dụng di động<br/>• Quầy thu ngân đối tác<br/>• Hệ thống ngân hàng | Công khai Internet | `https://api.mid.io.vn/` | `80/443` (HTTPS) | Tra cứu số dư, đổi điểm, sinh mã QR, trừ điểm tại quầy và kiểm tra sức khỏe (`/gateway-health`, `/actuator/health/liveness`). |
| **Tài Liệu Kỹ Thuật OpenAPI** | • Lập trình viên đối tác<br/>• Đội ngũ kỹ thuật | Công khai Internet | `https://docs.mid.io.vn/` | `80/443` (HTTPS) | Tra cứu đặc tả API Swagger UI và tải tệp đặc tả `/v3/api-docs`. |
| **Cổng Quản Trị Trung Tâm CMS** | • Ban quản trị hệ thống<br/>• Nhân viên vận hành liên minh | Công khai Internet có xác thực | `https://cms.mid.io.vn/` | `80/443` (HTTPS) | Cấu hình chính sách tích/tiêu điểm, chiến dịch, phát hành voucher và đối soát bù trừ tài chính. |
| **Cổng Webview & GameHub** | • Ứng dụng di động nhúng Webview<br/>• Trình duyệt di động của khách hàng | Công khai Internet | `https://portal.mid.io.vn/` | `80/443` (HTTPS) | Mở Trung tâm Loyalty Hội viên, Vòng quay may mắn Canvas 60 FPS và Cổng Game HTML5. |
| **Cổng Thông Tin Đối Tác** | • Đối tác liên minh thương mại<br/>• Nhân viên thu ngân / đại lý | Công khai Internet có xác thực | `https://partner.mid.io.vn/` | `80/443` (HTTPS) | Tự đối soát bù trừ kỳ, quản lý chi nhánh, kho Voucher đối tác và khóa Webhook API. |
| **Cửa Ngõ Nginx Nội Bộ** | • Nginx Host Master chuyển tiếp | Mạng riêng máy chủ | `http://127.0.0.1:18095/` | `18095` (HTTP Nội bộ) | API Gateway điều phối luồng dữ liệu tới 5 Microservices và 3 Frontend. |
| **Cơ Sở Dữ Liệu PostgreSQL** | • Cụm 5 Microservices | Mạng riêng máy chủ | `127.0.0.1:15435` | `15435` (TCP) | Lưu trữ sổ cái điểm thưởng, tài khoản hội viên và giao dịch bù trừ. |
| **Bộ Nhớ Đệm Redis** | • Cụm 5 Microservices | Mạng riêng máy chủ | `127.0.0.1:16385` | `16385` (TCP) | Lưu vết vé định danh, khóa phân tán Redisson và kiểm soát trùng lặp. |
| **Cổng Quản Trị CI/CD Jenkins** | • Ban phát triển kỹ thuật<br/>• Quản trị viên hệ thống<br/>• GitHub Webhook | Công khai Internet có xác thực | `https://jenskin.mid.io.vn/`<br/>(phụ: `https://jenkins.mid.io.vn/`) | `80/443` (HTTPS) → `127.0.0.1:18099` | Truy cập giao diện web theo dõi tiến trình build, nhật ký console theo thời gian thực và tiếp nhận sự kiện `/github-webhook/`. |

---

### 2.3. Ma Trận Luồng Kết Nối Hai Chiều Chi Tiết

| Thứ tự | Luồng kết nối nghiệp vụ | Nguồn phát | Đích tiếp nhận | Tuyến đường và Giao thức | Nội dung xử lý |
|:---:|:---|:---|:---|:---|:---|
| **1** | **Mở Giao Diện Cổng Game** | Ứng dụng di động | Nginx Master | `https://portal.mid.io.vn/?ticket=...` | Tải giao diện Webview và nạp cấu hình thời gian thực `env-config.json`. |
| **2** | **Chuyển Tiếp Vào Gateway** | Nginx Master | `loyalty-saas-gateway` | `http://172.18.0.1:18095/` | Chuyển tiếp lưu lượng theo `Host` header vào vùng chứa API Gateway `18095`. |
| **3** | **Định Tuyến Microservice** | `loyalty-saas-gateway` | 1 trong 5 Microservices (`8081..8085`) | `http://customer-service:8082/loyalty/v1/...`, `http://game-service:8083/gamehub/v1/...` | Định tuyến tự động qua `map $uri $loyalty_api_upstream` về đúng dịch vụ sở hữu API. |
| **4** | **Kiểm Soát Khóa Phân Tán** | Microservices (`8082..8085`) | `loyalty-saas-redis` | `redis:6379` (Host: `16385`) | Chiếm giữ khóa phân tán Redisson chống tiêu điểm kép và trừ ngân sách nguyên tử. |
| **5** | **Ghi Nhận Sổ Cái Bất Biến** | Microservices (`8081..8085`) | `loyalty-saas-postgres` | `postgres:5432` (Host: `15435`) | Thực thi khóa dòng bi quan và ghi nhận biến động vào sổ cái điểm bất biến. |
| **6** | **Đẩy Webhook Outbox** | `partner-service` (`8085`) | Cổng đối tác ngoài / Core Ví | HTTPS / `HMAC-SHA256` | Xử lý Outbound Webhook kèm chữ ký số và dead-letter retry. |
| **7** | **Thu Thập Chỉ Số Sức Khỏe & APM** | Prometheus / Healthcheck | Gateway & 5 Microservices | `http://cms-service..partner-service:8081..8085/actuator/prometheus` | Giám sát liveness, readiness và chỉ số hiệu năng từng Microservice độc lập. |

---

### 2.4. Cấu Hình Mở Cổng Tường Lửa Trên Máy Chủ

1. **Cổng công khai phục vụ lưu lượng người dùng bên ngoài:**
   * Cổng `80` (TCP HTTP): Tiếp nhận yêu cầu chuyển hướng sang HTTPS.
   * Cổng `443` (TCP HTTPS): Tiếp nhận toàn bộ lưu lượng mã hóa bảo mật SSL.
   * Cổng `65000` (TCP SSH): Cổng quản trị máy chủ từ xa an toàn.
2. **Cổng nội bộ máy chủ (Chỉ cho phép kết nối nội bộ `127.0.0.1`, không mở ra mạng ngoài):**
   * Cổng `18095` (TCP): Cổng Nginx Gateway nội bộ cụm Loyalty.
   * Cổng `15435` (TCP): Cổng cơ sở dữ liệu PostgreSQL cụm Loyalty.
   * Cổng `16385` (TCP): Cổng bộ nhớ đệm Redis cụm Loyalty.

---

## 3. CÁC HẠNG MỤC CẦN BỔ SUNG VÀ THIẾT LẬP TRÊN MÁY CHỦ

### 3.1. Thiết Lập Thư Mục Ứng Dụng Trên Máy Chủ
Đăng nhập SSH vào máy chủ `35.247.156.176:65000` (IP LAN `192.168.1.200`) với tài khoản `root` (`ssh micro-server`):

```bash
mkdir -p /data/uc1-software/apps/micro-loyalty/deploy/{backend,frontend,config/backend,config/frontend,config/nginx,locales,scripts,logs,backups,data/postgres,data/redis}
chmod -R 755 /data/uc1-software/apps/micro-loyalty/deploy
```

---

### 3.2. Cấu Hình Khởi Tạo Cơ Sở Dữ Liệu PostgreSQL 15 (`loyalty-postgres`)
Tệp khởi tạo quyền và cơ sở dữ liệu `/data/uc1-software/apps/micro-loyalty/deploy/config/init-db.sql`:

```sql
CREATE USER loyalty_app WITH PASSWORD 'Loyalty_SecureDB2026!';
CREATE DATABASE loyalty_db OWNER loyalty_app ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE loyalty_db TO loyalty_app;
```

---

### 3.3. Cấu Hình Bộ Nhớ Đệm Redis 7 (`loyalty-redis`)
Tệp cấu hình `/data/uc1-software/apps/micro-loyalty/deploy/config/redis.conf`:

```ini
requirepass Loyalty_RedisPass2026!
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

---

## 4. CẤU HÌNH ĐIỀU PHỐI VÀ BỘ KỊCH BẢN VẬN HÀNH

### 4.1. Cấu Hình Docker Compose Cụm Microservices (`docker-compose.yml`)

Tệp điều phối chính tại [docker-compose.yml](docker-compose.yml) (kết hợp mẫu biến môi trường [`.env.example`](.env.example)) tổ chức cụm **11 vùng chứa** trên mạng nội bộ `loyalty-saas-network`, giới hạn bộ nhớ chặt chẽ để tổng mức tiêu thụ RAM thực tế đạt khoảng **3.45 GB**:

- **Hạ tầng dữ liệu (2 vùng chứa):** `loyalty-saas-postgres` (`postgres:15-alpine`, cổng `127.0.0.1:15435:5432`, DB `loyalty_db`) và `loyalty-saas-redis` (`redis:7-alpine`, cổng `127.0.0.1:16385:6379`).
- **Nhóm 5 Microservices Backend (`Thin-JAR`):** `loyalty-saas-cms-service` (`8081`), `loyalty-saas-customer-service` (`8082`), `loyalty-saas-game-service` (`8083`), `loyalty-saas-campaign-service` (`8084`) và `loyalty-saas-partner-service` (`8085`). Các dịch vụ dùng chung ảnh runtime Java 17 LTS Alpine, cấu hình JVM `-Xms128m -Xmx512m`, HikariCP pool `12` kết nối/service, chỉ dùng `expose` cổng nội bộ trong mạng `loyalty-saas-network` để tránh xung đột với cổng host `8081`/`8085`, và nạp cấu hình qua `SPRING_CONFIG_IMPORT=optional:file:/app/etc/,optional:file:/app/config/`.
- **Nhóm 3 vùng chứa Frontend SPA:** `loyalty-saas-cms`, `loyalty-saas-webview` và `loyalty-saas-partner-portal` phục vụ giao diện qua Nginx tĩnh kèm cấu hình runtime `config/env-config.json` và `locales/*.json`.
- **Cổng điều phối API Gateway (1 vùng chứa):** `loyalty-saas-gateway` (`nginx:alpine`), ánh xạ duy nhất cổng nội bộ `127.0.0.1:18095:80`, định tuyến API tới 5 Microservices (`8081..8085`) và phân luồng lưu lượng cho 3 cổng giao diện Frontend.
- **Giám sát hạ tầng:** Tận dụng Prometheus (`9090`), Grafana (`3000`) và ELK có sẵn trên máy chủ để thu thập chỉ số `/actuator/prometheus` của 5 Microservices.

---

### 4.2. Cấu Hình API Gateway Nội Bộ (`config/nginx/nginx-saas.conf`)

Tệp cấu hình [nginx-saas.conf](config/nginx/nginx-saas.conf) đóng vai trò **API Gateway** tại cổng `18095`, tự động định tuyến yêu cầu theo tiền tố URI tới đúng Microservice Backend và phân tách 3 ứng dụng Frontend:

| Tiền Tố Đường Dẫn / Tên Miền | Đích Định Tuyến Nội Bộ | Vai Trò Xử Lý |
| :--- | :--- | :--- |
| `/gateway-health` | Nginx Gateway (`200 OK`) | Điểm kiểm tra trạng thái sống của API Gateway |
| `/loyalty/api/v1/admin/**`, `/loyalty/api/v1/cms/**` | `cms-service:8081` | Quản trị danh mục, cấu hình hệ thống, phê duyệt chiến dịch |
| `/loyalty/api/v1/customers/**`, `/loyalty/api/v1/wallets/**`, `/loyalty/api/v1/tiers/**` | `customer-service:8082` | Hồ sơ hội viên, sổ cái điểm, phân hạng, Ví Phần Thưởng |
| `/loyalty/api/v1/games/**`, `/loyalty/api/v1/spin/**` | `game-service:8083` | Cổng Game HTML5, vòng quay may mắn, trả thưởng lượt chơi |
| `/loyalty/api/v1/campaigns/**`, `/loyalty/api/v1/vouchers/**` | `campaign-service:8084` | Động cơ chiến dịch, cột mốc, kho Voucher, gợi nhắc |
| `/loyalty/api/v1/partners/**`, `/loyalty/api/v1/pos/**`, `/loyalty/api/v1/webhooks/**` | `partner-service:8085` | Cổng đối tác, giao dịch POS, đối soát bù trừ liên minh |
| `/swagger-ui/**`, `/v3/api-docs/**` | Dịch vụ OpenAPI tương ứng | Tài liệu chuẩn đặc tả API trực tuyến (`docs.mid.io.vn`) |
| `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn` | Gói tĩnh `/usr/share/nginx/html/{cms,webview,partner-portal}/` | Phục vụ SPA kèm cấu hình runtime `config/env-config.json` (`no-cache`) |

---

### 4.3. Cấu Hình Nginx Host Reverse Proxy Trên Máy Chủ (`config/nginx/host-loyalty-vhost.conf`)

Trên máy chủ `35.247.156.176`, tệp Virtual Host [host-loyalty-vhost.conf](config/nginx/host-loyalty-vhost.conf) (triển khai tại `/data/uc3-infra/nginx-master/conf.d/loyalty.conf` cho hệ sinh thái Loyalty và `/data/uc3-infra/nginx-master/conf.d/jenkins.conf` cho Jenkins CI/CD, kết hợp Cloudflare Tunnel `cloudflared`) chuyển tiếp toàn bộ lưu lượng HTTPS của 5 tên miền dịch vụ công khai (`api.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn`, `docs.mid.io.vn`) về cổng nội bộ `127.0.0.1:18095` và chuyển tiếp `jenskin.mid.io.vn`, `jenkins.mid.io.vn` về cổng `127.0.0.1:18099`.

---

### 4.4. Bộ Kịch Bản Quản Trị Vận Hành (`scripts/`)

| Kịch Bản | Đường Dẫn | Chức Năng Chính |
| :--- | :--- | :--- |
| Khởi chạy cụm | [scripts/start.sh](scripts/start.sh) | Kiểm tra biến môi trường `.env` và khởi động toàn cụm (`./scripts/start.sh`) hoặc cập nhật cuốn chiếu từng phân hệ (`./scripts/start.sh game-service ...` qua `docker compose up -d --build --no-deps`) |
| Dừng cụm an toàn | [scripts/stop.sh](scripts/stop.sh) | Dừng cụm vùng chứa êm ái qua `docker compose down`, giữ nguyên dữ liệu PostgreSQL/Redis trên volume |
| Khởi động lại | [scripts/restart.sh](scripts/restart.sh) | Khởi động lại cụm dịch vụ đang chạy qua `docker compose restart` |
| Kiểm tra sức khỏe | [scripts/healthcheck.sh](scripts/healthcheck.sh) | Kiểm tra `/gateway-health` trên cổng `18095`, kiểm tra trạng thái sống của 5 Microservices (`8081..8085`), Gateway và 3 cổng giao diện Web |

---

## 5. THIẾT LẬP TỰ ĐỘNG HÓA VẬN HÀNH VÀ SAO LƯU

Cấu hình lịch tiến trình tự động Crontab cho người dùng `root` (`crontab -e`):

```bash
# 1. Tự động kiểm tra và phục hồi dịch vụ mỗi 2 phút nếu container bị lỗi
*/2 * * * * cd /data/uc1-software/apps/micro-loyalty/deploy && ./scripts/healthcheck.sh > /dev/null 2>&1 || docker compose up -d

# 2. Tự động sao lưu cơ sở dữ liệu PostgreSQL định kỳ vào 02:00 sáng mỗi ngày
0 2 * * * docker exec loyalty-saas-postgres pg_dump -U loyalty_app loyalty_db | gzip > /data/uc1-software/apps/micro-loyalty/deploy/backups/db_$(date +\%Y\%m\%d).sql.gz

# 3. Tự động dọn dẹp toàn bộ tệp nhật ký (log) cũ hơn 3 ngày trên môi trường UAT vào 03:00 sáng mỗi ngày
0 3 * * * find /data/uc1-software/apps/micro-loyalty/deploy/logs/ -type f \( -name "*.log" -o -name "*.log.gz" -o -name "*.out" -o -name "*.log.*" -o -name "*_log" \) -mtime +3 -delete > /dev/null 2>&1

# 4. Tự động dọn dẹp Docker Build Cache và container/image rác cũ hơn 3 ngày vào 03:30 sáng mỗi ngày
30 3 * * * docker builder prune -a --filter "until=72h" -f > /dev/null 2>&1 && docker container prune -f > /dev/null 2>&1 && docker image prune -f > /dev/null 2>&1

# 5. Dọn dẹp bản sao lưu cơ sở dữ liệu cũ hơn 7 ngày vào 04:00 sáng Chủ Nhật hàng tuần
0 4 * * 0 find /data/uc1-software/apps/micro-loyalty/deploy/backups/ -type f -name "*.sql.gz" -mtime +7 -delete > /dev/null 2>&1
```

---

## 6. QUY TRÌNH TRIỂN KHAI VÀ TỰ ĐỘNG HÓA CI/CD

| Bước | Giai Đoạn | Thao Tác Chuẩn Hóa | Kết Quả Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Bước 1** | Kiểm thử & Đóng gói tại máy trạm | Chạy `./ci-local.sh` tại thư mục gốc | Biên dịch 20 module Maven, pass `109` Unit Test Backend, đóng gói 5 `Thin-JAR` + `245` thư viện `lib/`, build 3 Frontend (`cms`, `webview`, `partner-portal`) |
| **Bước 2** | Đồng bộ gói triển khai lên `35.247.156.176` | Chạy `rsync` qua SSH cổng `65000` (có sao lưu bản trước trên server) | Đồng bộ sạch `deploy/micro-loyalty/`, 5 `Thin-JAR` + `lib/` + `etc/` vào `backend/`, và 3 gói `dist/` vào `frontend/` |
| **Bước 3** | Khởi tạo hoặc cập nhật cuốn chiếu Docker | Chạy `docker compose up -d --build --remove-orphans` (hoặc `--no-deps <service>` khi cập nhật 1 phân hệ) | Toàn bộ 11 vùng chứa trạng thái `Up`, `7/7` healthcheck chuyển `healthy`, Flyway đồng bộ schema |
| **Bước 4** | Kiểm tra Nginx Master & Cloudflare | Kiểm tra và nạp lại Nginx Host (`nginx -t && nginx -s reload`) | Định tuyến 5 tên miền công khai về `127.0.0.1:18095` thông suốt |
| **Bước 5** | Nghiệm thu sức khỏe & điểm cuối | Chạy `bash scripts/healthcheck.sh` và kiểm tra HTTP 200 trên 5 tên miền | `healthcheck.sh` trả về mã `0`; `api.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn`, `docs.mid.io.vn` đạt `HTTP 200` |
| **Bước 6** | Tự động hóa CI/CD chọn lọc (Jenkins) | Kích hoạt tự động qua `githubPush()` kết hợp `pollSCM('* * * * *')` trên nhánh `main` qua `Jenkinsfile` | Chỉ build và deploy lại Microservice hoặc Frontend bị thay đổi, gửi cảnh báo Telegram và theo dõi trực tiếp tại `https://jenskin.mid.io.vn/` |

### Bước 1: Kiểm thử toàn diện và đóng gói bản dựng tại máy trạm
```bash
# Chạy CI đầy đủ: biên dịch 20 module Maven, chạy Unit Tests,
# đóng gói 5 Thin-JAR + lib/ + etc/, build 3 Frontend và kiểm tra cấu hình Docker/Nginx
./ci-local.sh

# Hoặc chạy CI chọn lọc đúng 1 Microservice / Frontend cần cập nhật (giữ nguyên các .jar còn lại)
./ci-local.sh --service game-service

# Hoặc tự động phát hiện và kiểm thử chỉ các phân hệ có thay đổi trên Git
./ci-local.sh --changed
```

### Bước 2: Đồng bộ gói triển khai lên máy chủ `35.247.156.176` (`192.168.1.200`)
```bash
# Đồng bộ cấu hình triển khai, tệp Thin-JAR + lib/ và 3 gói Frontend dist/ qua SSH cổng 65000
rsync -avz --delete -e "ssh -p 65000" --exclude='.env' --exclude='data/' --exclude='logs/' --exclude='backups/' \
  deploy/micro-loyalty/ root@35.247.156.176:/data/uc1-software/apps/micro-loyalty/deploy/
```

### Bước 3: Khởi tạo hoặc cập nhật cụm Docker trên máy chủ
```bash
# Cập nhật toàn cụm 11 vùng chứa
ssh -p 65000 root@35.247.156.176 "
cd /data/uc1-software/apps/micro-loyalty/deploy
chmod +x scripts/*.sh
docker compose up -d --build --remove-orphans
"

# Hoặc triển khai cuốn chiếu độc lập 1 Microservice (ví dụ chỉ cập nhật game-service)
ssh -p 65000 root@35.247.156.176 "
cd /data/uc1-software/apps/micro-loyalty/deploy && docker compose up -d --build --no-deps game-service
"
```

### Bước 4: Kiểm tra và nạp cấu hình Nginx Host
```bash
ssh -p 65000 root@35.247.156.176 "nginx -t && nginx -s reload"
```

### Bước 5: Nghiệm thu sức khỏe cụm dịch vụ và tên miền công khai
```bash
# Chạy kiểm tra sức khỏe toàn bộ API Gateway, 5 Microservices và 3 cổng giao diện Web
ssh -p 65000 root@35.247.156.176 "
cd /data/uc1-software/apps/micro-loyalty/deploy && bash scripts/healthcheck.sh
"
```

### Bước 6: Tự động hóa CI/CD chọn lọc với Jenkins nội bộ trên máy chủ `35.247.156.176` (`192.168.1.200`)
Pipeline tại [Jenkinsfile](../../Jenkinsfile) (đồng bộ cùng [deploy/micro-loyalty/ci-cd/jenkins/Jenkinsfile](ci-cd/jenkins/Jenkinsfile)) chạy độc lập ngay trên máy chủ `35.247.156.176` / `192.168.1.200` (không tích hợp qua hạ tầng ngoài), mặc định chạy chế độ `TARGET_SERVICE=auto` trên nhánh `main` (hỗ trợ chọn tay từng phân hệ: `cms-service`, `customer-service`, `game-service`, `campaign-service`, `partner-service`, `loyalty-cms`, `loyalty-webview`, `loyalty-partner-portal`, `gateway`, `all-backend`, `all`):
- Tự động kích hoạt khi nhánh `main` nhận commit mới nhờ cơ chế kép `githubPush()` kết hợp `pollSCM('* * * * *')` (kiểm tra tự động mỗi phút kể cả khi GitHub Webhook gián đoạn); tách bạch từng Microservice (`src/service/<tên-service>/`) và Frontend (`src/cms/`, `src/webview/`, `src/partner-portal/`), chỉ biên dịch `-pl` và đồng bộ tệp `.jar` của service thay đổi (giữ nguyên các `.jar` còn lại trong `backend/module/`), bỏ qua các thay đổi tài liệu (`docs/`, `*.md`), kỹ năng (`.agents/`), hoặc cấu hình `deploy/natcash/`.
- Triển khai trực tiếp vào `/data/uc1-software/apps/micro-loyalty/deploy` qua volume mount + `/var/run/docker.sock` (hoặc fallback qua SSH LAN `192.168.1.200:65000`): build lại image và thay thế cuốn chiếu bằng `docker compose up -d --build --no-deps <phân_hệ_thay_đổi>` cho các phân hệ đổi mã nguồn, hoặc chỉ `docker compose restart <phân_hệ>` khi chỉ thay đổi cấu hình ngoại vi `config/backend/` / `locales/`.
- Kiểm tra `/actuator/health/liveness` ngay bên trong từng container vừa cập nhật và xác nhận `HTTP 200` trên 4 tên miền công khai (`api.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn`).
- Bộ dựng Jenkins chuyên dụng được khai báo tại [deploy/micro-loyalty/ci-cd/jenkins/Dockerfile](ci-cd/jenkins/Dockerfile) và [deploy/micro-loyalty/ci-cd/jenkins/docker-compose.yml](ci-cd/jenkins/docker-compose.yml) (tích hợp sẵn JDK 17, Node.js 20, Docker CLI, Docker Compose v2, `rsync`, lắng nghe nội bộ tại cổng `127.0.0.1:18099`).

#### Thông Tin Truy Cập Trực Tiếp Và Theo Dõi Jenkins CI/CD

| Hạng Mục | Giá Trị Cấu Hình Chính Thức | Ghi Chú Vận Hành |
| :--- | :--- | :--- |
| **URL truy cập trực tiếp** | `https://jenskin.mid.io.vn/` | Tên miền phụ tương thích: `https://jenkins.mid.io.vn/` (đều trỏ về `127.0.0.1:18099`) |
| **URL theo dõi Pipeline** | `https://jenskin.mid.io.vn/job/micro-loyalty/` | Xem trạng thái các giai đoạn, lịch sử build và nhật ký console trực tiếp |
| **Tài khoản quản trị** | `admin` | Tài khoản quản trị mặc định của máy chủ Jenkins |
| **Mật khẩu quản trị** | `QxYe6PSDPTn4PMNTActe` | Quản lý qua biến môi trường `JENKINS_ADMIN_PASSWORD` tại `/data/uc3-infra/jenkins/.env` |
| **Cơ chế kích hoạt tự động** | GitHub Webhook (`https://jenskin.mid.io.vn/github-webhook/`) + `pollSCM('* * * * *')` | Tự động phát hiện commit mới trên nhánh `main` qua Webhook hoặc polling mỗi phút |
| **Cảnh báo Telegram tự động** | `scripts/notify_telegram.sh` → Nhóm giám sát (`Chat ID: -5397937309`) | Tự động gửi thông báo khi bắt đầu triển khai (`INFO`), khi hoàn tất (`SUCCESS`) hoặc gặp lỗi (`FAILED`) |
