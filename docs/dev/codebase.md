# BÁO CÁO NGHIÊN CỨU ĐỐI SÁNH VÀ KẾ HOẠCH TÁI SỬ DỤNG MÃ NGUỒN TỪ DỰ ÁN SMART-OTP CHO MICRO-LOYALTY

> **Mã tài liệu:** TECH-REPORT-LOYALTY-REUSE-SMART-OTP  
> **Đơn vị xây dựng:** Nhóm Kiến trúc và Giải pháp Số — Natcash  
> **Mục đích:** Đánh giá chi tiết khả năng kế thừa kiến trúc đa thuê bao, bộ thư viện nền tảng lõi (`ims-libraries`), cơ chế bảo mật khóa kép, khung giao diện quản trị CMS, hạ tầng triển khai và mô hình tích hợp đối tác từ dự án `smart-otp` sang dự án `micro-loyalty` nhằm tiết kiệm nguồn lực và tối ưu hóa thời gian phát triển.  
> **Dự án tham chiếu:** Mã nguồn `smart-otp` (`../smart-otp`).

---

## 1. TỔNG QUAN VỀ SỰ TƯƠNG ĐỒNG GIỮA HAI HỆ THỐNG

Qua nghiên cứu đối soát kiến trúc và mã nguồn thực tế của dự án `smart-otp`, hai hệ thống có sự tương đồng rất lớn về mặt chiến lược công nghệ và quy trình vận hành:
1. **Mô hình kiến trúc dịch vụ đa thuê bao độc lập (Multi-tenant Standalone Platform):** Cả hai hệ thống đều thiết kế cơ sở dữ liệu quan hệ và cụm dịch vụ nghiệp vụ hoàn toàn tách biệt với hệ thống ví lõi `natcash_db`.
2. **Mô hình tích hợp đối tác B2B & Cổng kết nối (Partner Gateway):** Sử dụng chung cơ chế xác thực Khóa kép (`X-Api-Key`, `SecretKey`), ký số `HMAC-SHA256` và kiểm soát sai lệch thời gian `X-Timestamp` (±300 giây).
3. **Lộ trình triển khai thực tế (Phased Roadmap):** Đều bắt đầu thử nghiệm thực tế với ứng dụng ví **Natcash** (`natcash-eu-app` & `natcash-eu-api`), sau đó mở rộng mạng lưới liên minh sang các đối tác bên ngoài (siêu thị Delimart, chuỗi trạm xăng, ngân hàng và đối tác dịch vụ số).
4. **Mô hình mạng nội bộ linh hoạt (Private LAN / Co-location):** Hỗ trợ kết nối trực tiếp qua mạng Private Subnet nội bộ (IP `172.18.0.1:18090` hoặc Docker Network) khi máy chủ Backend của Natcash bị chặn kết nối Internet ra ngoài theo tiêu chuẩn an ninh ngân hàng PCI-DSS.

---

## 2. MA TRẬN ĐỐI SÁNH VÀ KHẢ NĂNG TÁI SỬ DỤNG MÃ NGUỒN

| Hạng mục cấu phần | Trạng thái trong dự án Smart-OTP | Khả năng tận dụng cho Micro-Loyalty | Mức độ tái sử dụng | Ước tính tiết kiệm nguồn lực |
| :--- | :--- | :--- | :---: | :---: |
| **Bộ Thư Viện Lõi (`ims-libraries`)** | Đã hoàn thiện 11 module Java chuẩn hóa: `ims-bom`, `ims-core`, `ims-excel`, `ims-file`, `ims-i18n`, `ims-jasypt`, `ims-kafka`, `ims-redis`, `ims-rest`, `ims-security`, `ims-word`. | Sử dụng làm bộ khung dùng chung qua `src/lib/ims-libraries` cho `loyalty-common` và toàn bộ 5 Microservices trong `src/service/*`. | **95%** | **Tiết kiệm 2 – 3 tuần** lập trình hạ tầng lõi. |
| **Xác Thực Khóa Kép & Quản Trị Đối Tác (`partner-service`)** | Đã có thực thể `PartnerEntity`, tiện ích băm `SignatureUtils`, cơ chế xác thực HMAC-SHA256 và chính sách xoay vòng khóa không gián đoạn. | Kế thừa nguyên vẹn logic xác thực B2B vào `loyalty-common` & `partner-service` cho Cổng POS và đối tác liên minh. | **90%** | **Tiết kiệm 1.5 – 2 tuần** phát triển tầng bảo mật B2B. |
| **Bộ Nhớ Đệm & Khóa Phân Tán (`ims-redis`)** | Đã tích hợp Redisson Cluster, cấu hình khóa phân tán, cơ chế kiểm tra tính sẵn sàng và dịch vụ cache. | Tận dụng trực tiếp để triển khai khóa phân tán chống tiêu điểm kép `lock:burn:tenant_id:user_id` và đếm nguyên tử `DECRBY`. | **95%** | **Tiết kiệm 1 tuần** cấu hình cụm Redis & Khóa. |
| **Khung Giao Diện Quản Trị (`loyalty-cms` & `loyalty-partner-portal`)** | Xây dựng trên React 18 / TypeScript / Vite / PrimeReact, cấu trúc Layout Admin, phân quyền vai trò RBAC, hệ thống i18n, bảng dữ liệu DataTable và biểu đồ thống kê. | Kế thừa khung giao diện chuẩn hóa để phát triển `src/cms` và `src/partner-portal` gọi API qua API Gateway. | **75%** | **Tiết kiệm 2 – 2.5 tuần** lập trình giao diện quản trị. |
| **Cổng Developer Sandbox & Tài Liệu (`sandbox-portal`)** | Cổng tự phục vụ dành cho nhà phát triển đối tác: Sandbox Credentials, trình xem tài liệu Markdown động, tải Postman Collections và Simulator. | Tận dụng để cung cấp Cổng Sandbox cho các nhà phát triển game lẻ đưa game lên GameHub và đối tác POS tích hợp API Ví Phần Thưởng. | **70%** | **Tiết kiệm 1.5 – 2 tuần** xây dựng Developer Portal. |
| **Hạ Tầng Triển Khai & Container Hóa (`deploy/`)** | Đã có `docker-compose.yml` 9 dịch vụ, cấu hình Nginx Virtual Hosts đa tên miền (`out`, `api`, `cms`, `sandbox`), CI/CD pipeline và scripts vận hành. | Kế thừa toàn bộ cấu trúc phân bổ mạng, quy hoạch port, Dockerfile và kịch bản deploy tự động. | **85%** | **Tiết kiệm 1 tuần** thiết lập DevOps / Hạ tầng. |
| **Mô Hình Điều Phối API Gateway (`natcash-eu-api`)** | Đã có luồng Reverse Proxy giải mã JWT, gán tiêu đề `X-Tenant-Id`, ký số HMAC và chuyển tiếp yêu cầu sang dịch vụ độc lập. | Kế thừa chính xác luồng điều phối này để chuyển tiếp các API `/loyalty/*`, `/gamehub/*`, `/luckydraw/*`. | **90%** | **Tiết kiệm 1 tuần** nâng cấp Gateway. |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC THÀNH PHẦN TẬN DỤNG CỐT LÕI

### 3.1. Bộ Thư Viện Nền Tảng Dùng Chung (`ims-libraries`)
Thay vì phải xây dựng lại từ đầu các tiện ích kết nối hạ tầng cho cụm 5 Microservices Loyalty, dự án đóng gói và tái sử dụng trực tiếp bộ thư viện `ims-libraries`:
* **`ims-core`:**
  * Cung cấp sẵn cơ chế bắt lỗi tập trung `GlobalBaseExceptionHandler`, cấu trúc phản hồi chuẩn hóa `ApiResponse<T>`, `PageResponse<T>`, `ResponseError`.
  * Bộ lọc ghi vết nhật ký `LogMDCFilter`, `CustomStrategy` tích hợp Logbook đo đạc hiệu năng từng request.
  * Bộ thư viện kiểm tra an toàn dữ liệu đầu vào: chống tấn công XSS (`ValidStoredXSS`), kiểm tra định dạng tệp an toàn (`SafeFileNameConstraint`), kiểm tra tính duy nhất (`ValidUniqueField`).
* **`ims-redis`:**
  * Đã đóng gói sẵn `RedissonAutoConfiguration` và `RedisService`. Giúp cụm dịch vụ Loyalty kích hoạt ngay cơ chế khóa phân tán chống tiêu điểm kép đa máy POS mà không cần viết lại mã cấu hình Redisson Client.
* **`ims-rest`:**
  * Cung cấp `RestClientFactory` tích hợp sẵn bộ ngắt mạch quá tải Resilience4j Circuit Breaker, cơ chế tự động thử lại `CustomRetryStrategy` và cấu hình Connection Pool Apache HttpClient 5 tối ưu hóa cho các kết nối B2B với Cổng viễn thông Natcom và Cổng ví Natcash.
* **`ims-jasypt`:**
  * Mã hóa an toàn các thông tin cấu hình nhạy cảm (mật khẩu cơ sở dữ liệu PostgreSQL, mật khẩu Redis, Master Key) trong tệp cấu hình `application.yml`.

---

### 3.2. Kiến Trúc Xác Thực Khóa Kép & Quản Trị Đối Tác B2B
Dự án Smart-OTP đã hoàn thiện và kiểm thử thành công cơ chế xác thực giữa máy chủ đối tác và hệ thống lõi:
* **Mô hình Khóa Kép:** Mỗi đối tác (Siêu thị Delimart, Cây xăng Total, Cổng nạp Natcom) được cấp một cặp khóa gồm `X-Api-Key` (công khai) và `SecretKey` (bí mật dùng để ký số HMAC).
* **Công thức ký số chuẩn hóa:**
  * Chuỗi chuẩn hóa: `CanonicalString = HttpMethod + "\n" + RequestPath + "\n" + X-Timestamp + "\n" + SHA256(RequestBodyJson)`
  * Chữ ký số: `X-Signature = Hex(HMAC-SHA256(SecretKey, CanonicalString))`
* **Kiểm tra an toàn hằng số thời gian:** Sử dụng `MessageDigest.isEqual()` để triệt tiêu hoàn toàn nguy cơ bị tấn công phân tích thời gian thực thi (Timing Attack).
* **Chính sách xoay vòng khóa không gián đoạn:** Cho phép đối tác tạo khóa mới và duy trì khóa cũ song song trong 7 ngày chuyển tiếp.

Toàn bộ thực thể `PartnerEntity`, `PartnerRepository`, `SignatureUtils` và các bộ lọc bảo mật được chuẩn hóa trong `loyalty-common` để phục vụ dùng chung cho `partner-service` và toàn cụm 5 Microservices.

---

### 3.3. Cổng Quản Trị Trung Tâm, Cổng Đối Tác & Cổng Developer Sandbox
* **Cổng Quản trị `loyalty-cms` (`src/cms`) & Cổng Đối tác `loyalty-partner-portal` (`src/partner-portal`):**
  * Áp dụng khung giao diện React 18 / TypeScript / Vite / PrimeReact thống nhất, phân quyền theo vai trò RBAC, hệ thống lưu trữ phiên JWT và đa ngôn ngữ i18n.
  * Tập trung vào các màn hình nghiệp vụ đặc thù: Chính sách tích/tiêu điểm, Quản trị 4 hạng hội viên, Cột mốc chiến dịch, Kho voucher, Đối soát bù trừ công nợ và quản trị chi nhánh đối tác.
* **Cổng Developer Sandbox Portal (`src/sandbox`):**
  * Kế thừa module `src/sandbox` để cung cấp Cổng tự phục vụ cho các nhà phát triển game lẻ và đối tác chuỗi bán lẻ.
  * Cung cấp sẵn giao diện tra cứu tài liệu API tương tác, lấy khóa thử nghiệm, kiểm tra định dạng Webhook và tải Postman Collection.

---

### 3.4. Hạ Tầng Container Hóa & Kịch Bản Triển Khai (`deploy/`)
Hệ thống mạng và phân bổ cổng dịch vụ của dự án được quy hoạch theo kiến trúc đa module Maven (`20` module) và đóng gói `Thin-JAR` vận hành qua **API Gateway**:
* **Kiến trúc Reactor 20 Module Maven:** Bao gồm `11` module nền tảng trong `src/lib/ims-libraries`, lõi nghiệp vụ dùng chung (`src/lib/loyalty-engine`, `src/lib/loyalty-common`), và `5` Microservices chạy độc lập trong `src/service/` (`cms-service:8081`, `customer-service:8082`, `game-service:8083`, `campaign-service:8084`, `partner-service:8085`).
* **Quy trình kiểm thử và đóng gói đồng nhất (`./ci-local.sh`):** Biên dịch sạch toàn bộ 20 module, chạy `109` Unit Test Backend, đóng gói `5 Thin-JAR` dùng chung `245` thư viện `lib/` + `etc/`, đóng gói 3 Frontend (`cms`, `webview`, `partner-portal`) và thẩm định cú pháp Docker Compose / Nginx trước khi triển khai.
* **Phân lập tuyệt đối hai môi trường triển khai:**
  * `deploy/micro-loyalty/`: Cụm 11 vùng chứa SaaS trên `35.247.156.176:65000` (API Gateway cổng `18095`, PostgreSQL `15435`, Redis `16385`).
  * `deploy/natcash/`: Gói On-Premise Natcash (`10.228.37.65:22`) chạy 5 `Thin-JAR` Native JVM (`8081..8085`), Nginx phân lập cổng `8443` / `8080`.

---

## 4. KIẾN TRÚC PHÂN TÁCH MODULE ĐÃ TRIỂN KHAI CHO MICRO-LOYALTY

Hệ thống kết hợp giữa **70% – 80%** nền tảng kỹ thuật kế thừa (tầng thư viện lõi, bảo mật, đa ngôn ngữ, Gateway) và bộ **5 Microservices** cùng **3 Frontend** chuyên biệt hóa cho nghiệp vụ Loyalty:

| Tầng Kế Thừa & Phát Triển Mới | Module / Thành Phần | Trách Nhiệm Cốt Lõi | Đóng Gói & Cổng |
| :--- | :--- | :--- | :--- |
| **Thư viện Nền Tảng Kế Thừa** | `src/lib/ims-libraries` (`11` module) & `loyalty-engine` | Ngoại lệ tập trung, Logbook MDC, Jasypt, Redisson, Resilience4j REST, JWT/HMAC Security | JAR thư viện biên dịch dùng chung |
| **Lõi Dữ Liệu & Chia Sẻ** | `src/lib/loyalty-common` | Entities, Repositories, Services lõi (Ledger, Tier, Milestone, Clearing, Outbox), Flyway `V1`–`V27` | Thư viện lõi chia sẻ cho 5 services |
| **Microservice Quản Trị** | `src/service/cms-service` | Cấu hình hệ thống, chính sách điểm, danh mục, phê duyệt 2 bước | `Thin-JAR` (`8081`) |
| **Microservice Hội Viên** | `src/service/customer-service` | Tài khoản hội viên, phân hạng 12 tháng, sổ cái điểm FIFO, Ví Phần Thưởng QR POS | `Thin-JAR` (`8082`) |
| **Microservice GameHub** | `src/service/game-service` | Vòng quay may mắn, 13 minigame H5, Cloud Save, ngân sách Redis nguyên tử `DECRBY` | `Thin-JAR` (`8083`) |
| **Microservice Chiến Dịch** | `src/service/campaign-service` | Động cơ cột mốc, kho Voucher Code128/QR, gợi nhắc ngữ cảnh & chống làm phiền | `Thin-JAR` (`8084`) |
| **Microservice Đối Tác** | `src/service/partner-service` | Tiếp nhận giao dịch POS, xác thực HMAC-SHA256, Webhook Outbox, đối soát bù trừ công nợ | `Thin-JAR` (`8085`) |
| **Cổng Điều Phối & Frontend** | `loyalty-cms`, `loyalty-webview`, `loyalty-partner-portal`, `loyalty-sandbox`, API Gateway | Giao diện quản trị, Webview `LoyaltyJSBridge`, Cổng đối tác, định tuyến `/loyalty/api/v1/**` | Nginx Gateway (`18095` SaaS / `8443`,`8080` On-Premise) |

---

## 5. KẾT LUẬN VÀ GIÁ TRỊ KIẾN TRÚC ĐẠT ĐƯỢC

1. **Rút ngắn thời gian phát triển và mở rộng độc lập theo từng Microservice:**
   * Kế thừa hoàn chỉnh tầng thư viện `ims-libraries` giúp tiết kiệm thời gian thiết lập hạ tầng, bảo mật B2B và tích hợp mạng riêng.
   * Phân tách 5 Microservices `Thin-JAR` dùng chung CSDL `loyalty_db` cho phép cập nhật và triển khai cuốn chiếu riêng từng dịch vụ (như `game-service`) mà không gây gián đoạn các dịch vụ lõi khác (`customer-service`, `partner-service`).
2. **Bảo đảm tính nhất quán và an toàn vận hành:**
   * Duy trì đồng nhất bộ chuẩn `Zero-Hardcode`, `Clean Imports`, mã hóa cấu hình `ims-jasypt`, và kiểm chứng tự động qua `./ci-local.sh` trước mọi đợt phát hành.
