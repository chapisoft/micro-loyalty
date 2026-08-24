---
name: loyalty-deploy-writer
description: |
  Thiết kế, tạo và quản lý các kịch bản triển khai (Deployment Scripts, Docker Compose, Nginx, Environment Configs) cho hệ sinh thái micro-loyalty.
  Sử dụng khi xây dựng gói deploy độc lập cho nhiều môi trường (SaaS Multi-tenant Cloud, On-Premise Private Datacenter, Local Docker Testing).
  Skill đảm bảo:
    (1) Bản dựng bất biến (Immutable Build Artifacts): Tách 100% cấu hình hệ thống và từ điển ngôn ngữ ra khỏi file build/image.
    (2) Cấu hình ngoại vi (Externalized Configuration): Backend nạp --spring.config.additional-location, Frontend nạp runtime env-config.json.
    (3) Từ điển đa ngôn ngữ ngoại vi (Externalized Localization): Mount độc lập qua volumes, chỉnh sửa trực tiếp không cần build lại code.
    (4) Thư mục triển khai riêng biệt: deploy/environments/saas, deploy/environments/onpremise, deploy/environments/local-docker.
---

# SKILL: Loyalty Deploy Writer — Triển Khai Đa Môi Trường Độc Lập Cho Hệ Sinh Thái Loyalty

## 1. MỤC TIÊU CỐT LÕI
Cung cấp quy trình, mẫu cấu trúc và kịch bản đóng gói triển khai phần mềm linh hoạt, chuẩn hóa cho toàn bộ hệ sinh thái `micro-loyalty`. Hệ thống phải chạy được trơn tru trên cả môi trường **Đám mây đa thuê bao (SaaS Multi-tenant Cloud)** lẫn **Hạ tầng riêng biệt tại chỗ của đối tác (On-Premise Private Datacenter)** mà **không cần biên dịch lại mã nguồn hay tạo lại Docker Image**.

---

## 2. NGUYÊN TẮC BẤT BIẾN TRONG ĐÓNG GÓI & TRIỂN KHAI

### 2.1. Bản Dựng Bất Biến (Immutable Build Artifacts)
* **Backend (`loyalty-service.jar`):** Chỉ đóng gói mã nguồn bytecode thực thi và cấu hình mặc định (fallback). Tuyệt đối không gắn cứng mật khẩu DB, khóa bí mật, địa chỉ IP hay domain cụ thể vào trong JAR hoặc Dockerfile.
* **Frontend (`loyalty-cms` & `loyalty-webview`):** Biên dịch mã nguồn HTML/JS/CSS tĩnh một lần duy nhất (`npm run build`). Tuyệt đối không đóng cứng biến môi trường API URL, Tenant ID hoặc nhãn thương hiệu vào trong bundle tĩnh.
* **Docker Image:** Một Docker Image duy nhất được gắn thẻ phiên bản (ví dụ `loyalty-service:1.0.0`, `loyalty-cms:1.0.0`) có thể chạy ở bất kỳ môi trường nào (Dev, Staging, SaaS Production, On-Premise Production).

### 2.2. Cơ Chế Nạp Cấu Hình Ngoại Vi (Externalized Configuration)
* **Backend:** Nạp cấu hình từ thư mục mount ngoại vi:
  ```bash
  java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 \
       -Dspring.config.additional-location=file:/app/config/ \
       -jar /app/app.jar
  ```
  Thư mục `/app/config/` chứa tệp `application-override.yml` để ghi đè các tham số DB, Redis, RabbitMQ, cổng mạng và hạn mức.
* **Frontend:** Nạp cấu hình lúc runtime thông qua tệp `/config/env-config.json` do Nginx phục vụ:
  ```json
  {
    "API_GATEWAY_URL": "https://loyalty-api.natcash.com",
    "TENANT_DEFAULT": "TENANT_DELIMART",
    "BRAND_NAME": "Delimart Loyalty",
    "ENVIRONMENT": "production"
  }
  ```
  Ứng dụng đọc cấu hình này khi khởi chạy trình duyệt (`window.__RUNTIME_CONFIG__` hoặc fetch `/config/env-config.json`).

### 2.3. Cơ Chế Nạp Từ Điển Đa Ngôn Ngữ Ngoại Vi (Externalized Localization)
* Tệp từ điển JSON (`vi.json`, `en.json`, `fr.json`, `ht.json`...) được đặt ở thư mục ngoại vi `locales/` trên máy chủ và mount vào Nginx `/usr/share/nginx/html/locales/`.
* Khi đối tác On-Premise muốn tùy biến câu chữ, thay đổi tên gọi điểm thưởng hoặc sửa đổi thông điệp thông báo, quản trị viên chỉ cần mở tệp JSON sửa trực tiếp và lưu lại; ứng dụng webview/cms sẽ tự động nạp bản dịch mới sau khi người dùng F5 mà không cần build lại mã nguồn.

### 2.4. Nguyên Tắc Tuyệt Đối Không Tự Ý Triển Khai Lên Máy Chủ (No Auto-deploy Rule)
* **Cô lập cục bộ (Local-first):** Quá trình viết mã, sửa lỗi, đóng gói và chạy kiểm thử tự động chỉ được thực hiện trên môi trường máy trạm nội bộ của lập trình viên.
* **Cấm tự động triển khai:** Trợ lý AI tuyệt đối KHÔNG ĐƯỢC TỰ Ý kết nối SSH/SCP/Rsync, chạy lệnh triển khai hoặc tái tạo vùng chứa trên máy chủ từ xa khi chưa nhận được yêu cầu tường minh từ người dùng. Mọi thao tác deploy chỉ được kích hoạt khi có chỉ đạo rõ ràng từ người dùng.

---

## 3. CẤU TRÚC THƯ MỤC TRIỂN KHAI PHÂN TÁCH THEO MÔI TRƯỜNG

Toàn bộ gói triển khai được tổ chức chặt chẽ trong thư mục `deploy/environments/`:

```
deploy/
├── backend/
│   └── Dockerfile                  // Dockerfile bất biến cho Spring Boot
├── frontend/
│   └── Dockerfile                  // Dockerfile bất biến cho Nginx SPA
├── micro-loyalty/                  // 1. MÔ HÌNH SAAS ĐA THUÊ BAO (Server: 210.211.102.99:65000 dip / Docker Co-location DIP & Smart-OTP)
│   ├── docker-compose.yml
│   ├── .env
│   ├── .env.example
│   ├── deploy-guild.md             // Tài liệu hướng dẫn triển khai môi trường SaaS
│   ├── config/
│   │   ├── backend/
│   │   │   └── application-saas.yml
│   │   ├── frontend/
│   │   │   └── env-config.json
│   │   └── nginx/
│   │       └── nginx-saas.conf
│   ├── locales/                    // Từ điển chuẩn hệ sinh thái SaaS
│   │   ├── vi.json
│   │   └── en.json
│   └── scripts/
│       ├── start.sh
│       ├── stop.sh
│       └── healthcheck.sh
└── natcash/                        // 2. MÔ HÌNH ON-PREMISE VÍ NATCASH (Server: 10.228.37.65:22 mascom / CentOS Native Service)
    ├── docker-compose.yml
    ├── .env
    ├── .env.example
    ├── deploy-guild.md             // Tài liệu hướng dẫn triển khai môi trường On-Premise
    ├── config/
    │   ├── backend/
    │   │   └── application-natcash.yml
    │   ├── frontend/
    │   │   └── env-config.json
    │   └── nginx/
    │       └── nginx-natcash.conf
    ├── locales/                    // Từ điển tùy biến riêng nhận diện Ví Natcash
    │   ├── vi.json
    │   └── en.json
    └── scripts/
        ├── install.sh
        ├── start.sh
        ├── stop.sh
        └── backup.sh
```

---

## 4. NGUYÊN TẮC PHÂN LẬP MÔI TRƯỜNG TRIỂN KHAI TUYỆT ĐỐI (ZERO CROSS-ENVIRONMENT POLLUTION)

1. **Phân Định Bản Chất Hai Môi Trường:**
   * **Môi trường SaaS `micro-loyalty` (`deploy/micro-loyalty/`):**
     * Triển khai trên máy chủ đám mây `210.211.102.99:65000` (User `dip`, Ubuntu 22.04 LTS).
     * Chạy theo mô hình vùng chứa Docker Compose / Docker Swarm đồng máy chủ (Co-located) cùng nền tảng **DIP** và **Smart-OTP**.
     * Cổng mạng chuyên dụng: PostgreSQL `15435`, Redis `16385`, Nginx Gateway nội bộ `18095`, Backend lõi `8088`. Tận dụng Host Nginx (`80/443`), Prometheus APM (`9090`), Grafana (`3000`), ELK Logging (`9200`/`5601`), Jenkins CI/CD (`9191`).
   * **Môi trường On-Premise `natcash` (`deploy/natcash/`):**
     * Triển khai trên máy chủ vật lý độc lập `10.228.37.65:22` (User `mascom`, CentOS Linux 7).
     * Chạy dịch vụ Native trực tiếp qua máy ảo JDK 17 (Cổng `8085`), PostgreSQL có sẵn (Cổng `5432`, DB `natcash_loyalty_db`), Redis có sẵn (Cổng `6379`, Mật khẩu `NatCash2022`), Nginx 1.20.2 phân lập cổng `8443` (Webview/API công khai ngoài Internet) và cổng `8080` (CMS nội bộ VPN).
2. **Quy Tắc Quản Trị Cấu Hình:**
   * **Tuyệt đối không cập nhật chung hoặc sao chép thông số cấu hình qua lại giữa 2 thư mục này.**
   * Bất kỳ thay đổi cấu hình, kịch bản, địa chỉ IP, cổng mạng hoặc tài liệu hướng dẫn nào chỉ được cập nhật độc lập và khép kín trong thư mục của môi trường đó.

## 5. BẢNG SO SÁNH ĐẶC TÍNH TRIỂN KHAI SAAS VS ON-PREMISE

| Tiêu chí kỹ thuật | Mô hình SaaS Multi-tenant Cloud | Mô hình On-Premise Private Datacenter |
|:---|:---|:---|
| **Mục tiêu triển khai** | Cụm máy chủ tập trung Natcash phục vụ hàng trăm đối tác đồng thời | Máy chủ nội bộ hoặc Private Cloud độc lập của đối tác (Siêu thị Delimart, Ngân hàng) |
| **Cơ chế xác thực Tenant** | Động qua `X-Tenant-Id` header và JWT Token | Cố định cho 1 Tenant duy nhất (`TENANT_DEFAULT`) |
| **Cơ sở dữ liệu** | PostgreSQL 15+ Cluster cô lập dữ liệu theo `tenant_id` | PostgreSQL 15+ riêng biệt của đối tác |
| **Bộ nhớ đệm & Khóa** | Redis 7.x Cluster phân vùng theo tiền tố khóa Tenant | Redis 7.x độc lập tại chỗ |
| **Địa chỉ API Gateway** | Public Domain có SSL/TLS (ví dụ `https://loyalty-api.natcash.com`) | IP nội bộ hoặc Private DNS (ví dụ `https://loyalty-local.delimart.ht`) |
| **Tùy biến ngôn ngữ (i18n)** | Nạp từ điển chuẩn hóa đa ngôn ngữ toàn cầu | Cho phép biên tập trực tiếp file JSON tại `deploy/environments/onpremise/locales/` |
| **Cập nhật & Nâng cấp** | Tự động qua CI/CD Pipeline đẩy container mới | Chạy script cài đặt offline `install-onprem.sh` nạp image `.tar.gz` |

---

## 5. QUY TRÌNH THỰC THI KHI TẠO HOẶC NÂNG CẤP BẢN DEPLOY

Khi người dùng yêu cầu tạo hoặc cập nhật bản deploy cho một môi trường mới:
1. **Kiểm tra tính độc lập cấu hình:** Đảm bảo không có bất kỳ IP, mật khẩu hay chuỗi văn bản nào bị ghi cứng trong Dockerfile hoặc mã nguồn.
2. **Khởi tạo thư mục môi trường:** Tạo đúng cấu trúc `deploy/environments/[env_name]/` với đầy đủ 4 thành phần: `docker-compose.yml`, `config/`, `locales/`, `scripts/`.
3. **Thiết lập Volume Mounts:**
   * Backend: Mount `./config/backend:/app/config:ro` và `./locales:/app/locales:ro`.
   * Frontend: Mount `./config/frontend/env-config.json:/usr/share/nginx/html/config/env-config.json:ro` và `./locales:/usr/share/nginx/html/locales:ro`.
   * Nginx: Mount `./config/nginx/nginx-[env].conf:/etc/nginx/conf.d/default.conf:ro`.
4. **Cấp quyền thực thi kịch bản:** Đảm bảo các file shell script (`.sh`) có quyền thực thi `chmod +x` và xử lý an toàn tín hiệu dừng/khởi động.
