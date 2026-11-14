# BẢNG THEO DÕI TIẾN ĐỘ DỰ ÁN

**Dự án:** Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh và Cổng Game Đa Thuê Bao (`micro-loyalty`)  
**Thời điểm thẩm định:** 14/11/2026 — Hoàn tất tái cấu trúc **5 Microservices + API Gateway + 3 Frontend**, vượt qua CI cục bộ `./ci-local.sh` và triển khai vận hành cụm **11 vùng chứa** trên máy chủ SaaS `35.247.156.176:65000`  
**Quy chuẩn áp dụng:** Nguyên tắc Bằng chứng thực chứng (Zero Over-Reporting) và Quy chuẩn Đánh giá Tiến độ 3 Tầng Độc lập.  
**Môi trường hiện tại:** Cụm SaaS Docker (`35.247.156.176:65000`, `11` vùng chứa gồm 5 Microservices + PostgreSQL 15 + Redis 7 + 3 Frontend + Nginx API Gateway `18095`) và gói chuẩn bị On-Premise (`deploy/natcash/`).

---

## 1. TỔNG KẾT TIẾN ĐỘ THỰC CHỨNG 3 TẦNG ĐỘC LẬP

| Tầng Đánh Giá | Hạng Mục Nghiệp Vụ & Kỹ Thuật | Điểm Tối Đa | Điểm Thực Chứng | Tình Trạng Nghiệm Thu Thực Tế |
| :--- | :--- | :---: | :---: | :--- |
| **Tầng 1** | **Mã nguồn chức năng nội bộ (BE 20 modules Maven, 5 Microservices `Thin-JAR`, V1–V27, 3 Frontend, CI cục bộ `./ci-local.sh`)** | **60%** | **60%** | **HOÀN TẤT 100%** (`109` Unit Test Backend pass qua `./ci-local.sh`, build `cms`/`webview`/`partner-portal` đạt chuẩn, cụm SaaS `11` vùng chứa `7/7` healthcheck `healthy` trên `35.247.156.176`) |
| **Tầng 2** | **Tích hợp Đối tác Thực tế (Core Ví Natcash, SMS Brandname Natcom, POS Merchant thật trên môi trường đích)** | **20%** | **0%** | **CHỜ KẾT NỐI ĐỐI TÁC THẬT (0%)** (Mã nguồn Adapter `NatcashWalletClient`, `NatcomSmsClient`, `TenantIntegrationService`, Webhook Outbox HMAC-SHA256 đã sẵn sàng; chưa cấu hình chứng thư và endpoint sản xuất thật) |
| **Tầng 3.1** | **Thực thi Load Test tải cao & Kiểm tra toàn vẹn dữ liệu đồng thời trên Staging** | **10%** | **0%** | **CHỜ THỰC THI ĐO KIỂM (0%)** (Đã chuẩn bị bộ kịch bản [lucky_wheel_loadtest.js](../scripts/loadtest/lucky_wheel_loadtest.js) và [pos_wallet_loadtest.js](../scripts/loadtest/pos_wallet_loadtest.js); chưa thực thi đo tải k6 trên hạ tầng Staging) |
| **Tầng 3.2** | **Nghiệm thu an ninh mạng độc lập (Pentest) & Pilot UAT thực tế trên Staging** | **10%** | **0%** | **CHỜ NGHIỆM THU (0%)** (Đã chuẩn bị kịch bản [security_pentest_suite.py](../scripts/security/security_pentest_suite.py); chờ thực thi Pentest độc lập và Pilot UAT cùng người dùng thật) |
| **TỔNG CỘNG** | **TOÀN BỘ HỆ SINH THÁI LOYALTY & GAMEHUB** | **100%** | **60%** | **HOÀN TẤT MÃ NGUỒN VÀ HẠ TẦNG SAAS MICROSERVICES; CHỜ TÍCH HỢP ĐỐI TÁC THẬT, LOAD TEST, PENTEST & PILOT UAT** |

---

## 2. MA TRẬN ĐÁNH GIÁ CHI TIẾT THEO TỪNG PHÂN HỆ

| Phân hệ | Tên Phân Hệ & Thành Phần Mã Nguồn | BE % | UI % | Tích hợp / QA thực tế | Tiến Độ Tổng | Tình Trạng & Bằng Chứng Thực Tế |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **D0** | **Kiến Trúc 20 Module Maven & Hạ Tầng Docker** (`pom.xml`, `ims-libraries`, `loyalty-common`, `deploy/`) | 100% | N/A | CI + SaaS Live | **80%** | Đóng gói 5 `Thin-JAR` (`8081..8085`) + `245` thư viện `lib/` + `etc/`; SaaS `11` vùng chứa đang `Up` & `healthy` tại `35.247.156.176:65000`. |
| **D1** | **Đa Thuê Bao & Đối Tác** (`partner-service:8085`, `loyalty-common`) | 100% | 100% | Chờ nối đối tác | **70%** | Lọc `tenant_id`, HMAC-SHA256, `TenantIntegrationService`, Migration `V1`–`V27`. Chờ chứng thư môi trường thật. |
| **D2** | **Sổ Cái Điểm & Phân Hạng** (`customer-service:8082`) | 100% | 100% | Chờ Load Test | **70%** | Khóa phân tán Redisson + `PointBucketFifoService`, sổ cái `loyalty_point_ledger`. |
| **D3** | **Kho Quà Phiếu Ưu Đãi Điện Tử** (`campaign-service:8084`) | 100% | 100% | Unit Test OK | **70%** | Mã vạch Code128 vector SVG & Mã QR động; CMS nhập lô và kiểm kho DB thật. |
| **D4** | **Liên Thông Ví Phần Thưởng POS** (`customer-service:8082`, `partner-service:8085`) | 100% | 100% | Chờ UAT POS | **70%** | QR động 60 giây, khấu trừ an toàn đa luồng (`ConcurrentPointBurnTest`), chờ kết nối POS thật. |
| **D5** | **Cột Mốc Chiến Dịch & Gợi Nhắc** (`campaign-service:8084`) | 100% | 100% | Unit Test OK | **70%** | Điểm danh 7 ngày, rương thưởng, bộ lọc chống làm phiền 4 lớp (`EngagementAntiSpamFilterTest`). |
| **D6** | **Cổng GameHub & Vòng Quay** (`game-service:8083`, `loyalty-webview`) | 100% | 100% | `12` Game Tests OK | **70%** | Web Audio, rung xúc giác, Cloud Save, `SecureRandom`, `DECRBY` Redis; tách service triển khai riêng không gián đoạn core. |
| **D7** | **Đối Soát Bù Trừ Tài Chính Đa Phương** (`partner-service:8085`, `loyalty-partner-portal`) | 100% | 100% | Unit Test OK | **70%** | Tách riêng ứng dụng `loyalty-partner-portal` (`partner.mid.io.vn`), tính công nợ 2 chiều và quyết toán kỳ. |
| **D8** | **Đồng Bộ Webhook Hai Chiều & Outbox** (`partner-service:8085`, `loyalty-common`) | 100% | N/A | Unit Test OK | **70%** | Transactional Outbox + Redis Streams ký số HMAC-SHA256. |
| **D9** | **Cổng Quản Trị & Đối Tác Web** (`loyalty-cms`, `loyalty-partner-portal`) | N/A | 100% | Build Pass | **80%** | Đóng gói qua Vite + PrimeReact, nạp runtime `env-config.json`, truy cập `HTTP 200` tại `cms.mid.io.vn` và `partner.mid.io.vn`. |
| **D10** | **Cổng Webview Nhúng** (`loyalty-webview`) | N/A | 100% | Build Pass | **80%** | Đồ họa vector, Web Audio, đa ngôn ngữ ngoại vi, truy cập `HTTP 200` tại `portal.mid.io.vn`. |
| **GW** | **API Gateway Định Tuyến Microservices** (`nginx-saas.conf`, `nginx-natcash.conf`) | 100% | N/A | SaaS Live | **80%** | Cổng `18095` định tuyến 5 dải API về `8081..8085`, `/gateway-health` + `docs.mid.io.vn/swagger-ui/index.html` trả `HTTP 200`. |
| **QA** | **Kịch Bản Đo Tải & Kiểm Tra An Ninh** (`scripts/loadtest/`, `scripts/security/`) | 100% | N/A | **0% Thực thi** | **30%** | Đã có kịch bản `lucky_wheel_loadtest.js`, `pos_wallet_loadtest.js`, `security_pentest_suite.py`; chờ lệnh thực thi đo kiểm tải & Pentest trên Staging. |
| **OPS** | **CI Cục Bộ & Sổ Tay Vận Hành** (`ci-local.sh`, `deploy/`, `docs/ops/`) | 100% | N/A | SaaS Live | **75%** | `./ci-local.sh` vượt qua toàn bộ build + `109` Unit Test; SaaS `11` container chạy ổn định; On-Premise Natcash sẵn sàng chờ chỉ thị triển khai. |

---

## 3. NHẬT KÝ HOÀN THIỆN KIẾN TRÚC VÀ MÃ NGUỒN ĐÃ NGHIỆM THU

1. **Chuyển đổi hoàn toàn sang Kiến trúc 5 Microservices + API Gateway:**
   * Tách `loyalty-service` đơn khối trước đây thành **5 Microservices độc lập** (`cms-service:8081`, `customer-service:8082`, `game-service:8083`, `campaign-service:8084`, `partner-service:8085`) dùng chung `loyalty-common` (`V1`–`V27`) và `loyalty-engine`, đóng gói dạng `Thin-JAR` dùng chung `245` thư viện `lib/`.
   * Thiết lập API Gateway qua `nginx-saas.conf` (`18095`) và `nginx-natcash.conf` (`8443`/`8080`), phục vụ đồng bộ 3 ứng dụng Frontend (`loyalty-cms`, `loyalty-webview`, `loyalty-partner-portal`).
2. **Thiết lập Cổng Kiểm Thử & Đóng Gói Cục Bộ (`./ci-local.sh`):**
   * Xác thực toàn bộ 20 module Maven, chạy `109` Unit Test Backend (`96` `loyalty-common`, `1` `cms-service`, `12` `game-service`), build `3` Frontend và kiểm tra cú pháp cả 2 tệp `docker-compose.yml` + 2 tệp Nginx trong một lệnh duy nhất.
3. **Khắc phục lỗ hổng Hardcode & Chuẩn hóa Cấu Hình DB:**
   * Đưa các tham số hệ thống (`PERCENT_DIVISOR`, `ISO_LOCAL_DATE_LENGTH`, `DEFAULT_WHEEL_CODE`, cấu hình game/chiến dịch) sang quản trị tập trung và enum chuẩn mực.
4. **Triển khai Thành Công Trên Hạ Tầng SaaS (`35.247.156.176:65000`):**
   * Toàn bộ **11 vùng chứa** đang hoạt động ổn định (`7/7` healthcheck `healthy`), `bash scripts/healthcheck.sh` thoát mã `0`, và 5 tên miền công khai (`api.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn`, `docs.mid.io.vn/swagger-ui/index.html`) đạt `HTTP 200`.

---

## 4. KẾT LUẬN VÀ CÁC HẠNG MỤC CẦN LÀM TIẾP THEO

* **Kết quả hiện tại:** Hoàn tất **100% Tầng 1** (mã nguồn Microservices + Frontend + `109` Unit Tests + CI cục bộ) và đã triển khai vận hành ổn định trên môi trường **SaaS (`35.247.156.176:65000`)**. Theo quy chuẩn đánh giá 3 tầng, điểm thực chứng hiện đạt **60% / 100%**.
* **Các bước tiếp theo để đạt 100% Go-Live:**
  1. Cung cấp chứng thư và thông số kết nối thực tế tới Core Ví Natcash / SMS Brandname Natcom để hoàn tất Tầng 2 (`20%`).
  2. Thực thi bộ kịch bản tải cao `scripts/loadtest/{lucky_wheel_loadtest.js,pos_wallet_loadtest.js}` trên Staging kết hợp truy vấn đối soát DB sau tải (`10%`).
  3. Thực thi rà soát an ninh `scripts/security/security_pentest_suite.py`, Pentest độc lập và Pilot UAT cùng người dùng thật (`10%`), sau đó triển khai On-Premise Natcash (`10.228.37.65`) khi có yêu cầu.
