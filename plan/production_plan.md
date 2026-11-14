# KẾ HOẠCH SẢN XUẤT VÀ LỘ TRÌNH KHẮC PHỤC ĐỦ ĐIỀU KIỆN GO-LIVE
## Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh và Cổng Game Đa Thuê Bao (`micro-loyalty`)

> **Người lập kế hoạch:** Giám đốc Sản phẩm  
> **Cập nhật:** 14/11/2026 — Hoàn thành tái cấu trúc 5 Microservices + API Gateway + 3 Frontend và triển khai ổn định trên cụm SaaS `35.247.156.176:65000`  
> **Mục tiêu sản xuất:** Hoàn thiện kiến trúc Microservices triển khai độc lập từng phân hệ, nâng cấp trải nghiệm người dùng, chuẩn bị khung tích hợp đối tác nạp động và hoàn tất các bước kiểm thử tải / Pentest / Pilot UAT để đạt đủ điều kiện kinh doanh thương mại.

---

## 1. TỔNG QUAN LỘ TRÌNH 5 GIAI ĐOẠN

| Giai Đoạn | Tên Giai Đoạn | Hạng Mục Trọng Tâm | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **Giai đoạn 1** | Khắc phục lõi & lưu vết cơ sở dữ liệu | Đấu nối 13 minigame với sổ cái thật, xóa mock CMS, batch quét hạn điểm `PointExpirationJob` theo lô 500 FIFO, đối soát bù trừ `ClearingSettlementService` | Hoàn tất mã nguồn |
| **Giai đoạn 2** | Nâng cấp Gamification & Ví | Âm thanh Web Audio & rung xúc giác, chuỗi điểm danh 7 ngày & hồi lượt 4 giờ, mã vạch Code128 SVG & cảnh báo hạn điểm | Hoàn tất mã nguồn |
| **Giai đoạn 3** | An ninh, chống gian lận & kịch bản đo tải | `SecureRandom` cho GameHub/Vòng quay, trần điểm số mỗi ván, chuẩn bị bộ kịch bản [lucky_wheel_loadtest.js](../scripts/loadtest/lucky_wheel_loadtest.js), [pos_wallet_loadtest.js](../scripts/loadtest/pos_wallet_loadtest.js) và [security_pentest_suite.py](../scripts/security/security_pentest_suite.py) | Mã kịch bản sẵn sàng; **chờ thực thi đo kiểm** |
| **Giai đoạn 4** | Khung đa thuê bao & E2E tự động | Bảng `loyalty_tenant_integrations`, `NatcashWalletClient`, `NatcomSmsClient`, `TenantIntegrationService`, `FullLifecycleE2ETest` | Hoàn tất mã nguồn; **chờ kết nối đối tác thật** |
| **Giai đoạn 5** | Tách 5 Microservices, API Gateway & CI/CD SaaS | Chuyển sang 20 module Maven (`5 Thin-JAR` + `245 lib/` + `etc/`), API Gateway (`18095` SaaS / `8443`,`8080` On-Premise), bổ sung `loyalty-partner-portal`, CI `./ci-local.sh` (`109` Unit Tests pass) & triển khai sống `11` vùng chứa tại `35.247.156.176:65000` | **Hoàn tất & Đang chạy ổn định** |

---

## 2. KẾT QUẢ NGHIỆM THU CHI TIẾT TỪNG GIAI ĐOẠN

---

### GIAI ĐOẠN 1: KHẮC PHỤC LÕI, ĐẤU NỐI DỮ LIỆU THỰC & BATCH CHUNK (SPRINT 7 — ĐÃ HOÀN TẤT 100%)

* **Mục tiêu:** Chấm dứt hoàn toàn tình trạng cộng điểm ảo trên bộ nhớ trình duyệt và dữ liệu giả lập trên Cổng quản trị CMS.
* **Thời gian hoàn thành:** 25/08/2026.
* **Kết quả nghiệm thu kỹ thuật:**
  1. **Đấu nối 13 trò chơi HTML5 với API máy chủ thực tế:** Hoàn tất gọi hàm `LoyaltyApi.submitGameResult(...)` đồng bộ với sổ cái PostgreSQL `loyalty_point_ledger`.
  2. **Chuyển đổi toàn bộ Cổng Quản Trị CMS sang API Máy chủ thật:** Bổ sung đầy đủ các phương thức `POST / PUT / DELETE` cho Policy, Voucher, Milestone, Clearing; xóa bỏ 100% `setTimeout` giả lập.
  3. **Viết lại Tiến trình Quét điểm Hết hạn `PointExpirationJob`:** Phân trang Spring Batch Chunk 500 bản ghi, trừ điểm FIFO theo hạn `expired_at`.
  4. **Hoàn thiện Động cơ Bù trừ Tài chính `ClearingSettlementService`:** Nối bảng thực thể `loyalty_partners`, tính toán công nợ 2 chiều và kết chuyển kỳ quyết toán.
  5. **Kiểm thử tự động:** `62/62` bài test backend pass 100%, CMS và Webview build pass 0 lỗi TypeScript.

---

### GIAI ĐOẠN 2: NÂNG CẤP GAMIFICATION & TRẢI NGHIỆM NGƯỜI DÙNG CHUẨN THỊ TRƯỜNG (SPRINT 8 — ĐÃ HOÀN TẤT 100%)

* **Mục tiêu:** Nâng cấp trải nghiệm tương tác ngang tầm các siêu ứng dụng Shopee, Grab, Momo.
* **Thời gian hoàn thành:** 25/08/2026.
* **Kết quả nghiệm thu kỹ thuật:**
  1. **Bộ Tổng hợp Âm thanh (Web Audio API) và Rung Phản hồi (Vibration API) cho 13 Game (`soundHaptics.ts`):** Tích hợp 15 âm thanh thời gian thực (click, chém hoa quả, cắm dao, nổ bom, lật thẻ, fanfare, game over, wheel tick...) và rung phản hồi xúc giác. Bổ sung nút Bật/Tắt âm thanh toàn cục trên Header.
  2. **Chuỗi Điểm Danh 7 Ngày Nhận Rương Quà Bí Mật (`DailyCheckinModal.tsx`):** Thưởng lũy tiến từ Ngày 1 (+10đ) đến Ngày 7 (Mở Rương Báu Hoàng Kim: +200 điểm + 1 Voucher đặc quyền), âm thanh mở rương rộn ràng.
  3. **Đồng Hồ Đếm Ngược Hồi Phục Lượt Chơi (`TurnRegenCountdown.tsx`):** Đếm lùi hồi phục 1 lượt miễn phí sau mỗi 4 giờ (tối đa 3 lượt/ngày), hiển thị trực quan trên GameHub.
  4. **Màn Hình Chi Tiết Mã Ưu Đãi (`VoucherBarcodeModal.tsx` & `barcode128.ts`):** Phóng to Mã vạch chuẩn Code128 vector SVG và Mã QR độ nét cao cho quầy thu ngân quét; tích hợp 3 tab trạng thái và sao chép mã.
  5. **Dự Báo Hạn Điểm Thông Minh Trên Thẻ VIP:** Thẻ cảnh báo điểm sắp hết hạn trong 30 ngày dẫn trực tiếp sang kho quà để người dùng đổi voucher kịp thời.

---

### GIAI ĐOẠN 3: AN NINH, CHỐNG GIAN LẬN & CHUẨN BỊ ĐO KIỂM TẢI CAO

* **Mục tiêu:** Bảo vệ an toàn tài chính, ngăn chặn gian lận điểm số và chuẩn bị bộ công cụ đo kiểm tải / an ninh.
* **Thời gian cập nhật:** 14/11/2026.
* **Kết quả nghiệm thu kỹ thuật:**
  1. **An Toàn Mật Mã & Chống Gian Lận Điểm Minigame:** Sử dụng `java.security.SecureRandom` cho Vòng quay và GameHub; kiểm tra và khống chế trần điểm số tối đa mỗi ván; kiểm tra hạn mức ngân sách ngày qua Redis Atomic.
  2. **Bộ Kịch Bản Đo Kiểm Tải Cao k6 (đã tạo mã kịch bản, chờ chạy thực tế trên Staging):**
     * [lucky_wheel_loadtest.js](../scripts/loadtest/lucky_wheel_loadtest.js): Đo tải kịch bản Vòng quay may mắn.
     * [pos_wallet_loadtest.js](../scripts/loadtest/pos_wallet_loadtest.js): Đo tải giao dịch quầy thu ngân POS và kiểm tra tính nhất quán số dư.
  3. **Bộ Kiểm Thử An Ninh Tự Động (`scripts/security/`):** Chuẩn bị kịch bản [security_pentest_suite.py](../scripts/security/security_pentest_suite.py), sẵn sàng chạy rà soát lỗ hổng bảo mật trên Staging.

---

### GIAI ĐOẠN 4 & 5: TÍCH HỢP ĐA THUÊ BAO, TÁCH 5 MICROSERVICES & TRIỂN KHAI SAAS

* **Mục tiêu:** Tách nhỏ dịch vụ thành **5 Microservices độc lập + API Gateway**, sẵn sàng kết nối hạ tầng đối tác thật (SaaS & On-Premise) và đảm bảo kiểm thử tự động qua `./ci-local.sh`.
* **Thời gian hoàn thành:** 14/11/2026.
* **Kết quả nghiệm thu kỹ thuật:**
  1. **Khung Tích Hợp Đa Thuê Bao Nạp Động (`loyalty_tenant_integrations` & `TenantIntegrationService`):**
     * Hỗ trợ lưu trữ cấu hình Cổng Ngân hàng/Ví và Cổng SMS Brandname riêng biệt cho từng Tenant trong PostgreSQL 15+ (Migration `V1` đến `V27`).
     * Nạp động cấu hình theo `tenantId`, tối ưu tốc độ bằng Redis Cache, tự động giải phóng cache khi cập nhật.
     * Cung cấp `NatcashPaymentProvider`, `NatcomSmsProvider` cùng `NatcashWalletClient.java` và `NatcomSmsClient.java`.
  2. **Kiến Trúc 5 Microservices & API Gateway (`./ci-local.sh`):**
     * Tách cụm Backend thành 5 Microservices `Thin-JAR` (`cms-service:8081`, `customer-service:8082`, `game-service:8083`, `campaign-service:8084`, `partner-service:8085`) dùng chung `245` thư viện `lib/`, kết hợp `loyalty-saas-gateway` (`18095`) và 3 Frontend (`loyalty-cms`, `loyalty-webview`, `loyalty-partner-portal`).
     * **Nghiệm thu CI cục bộ (`./ci-local.sh`):** Biên dịch sạch `20` module Maven, pass `109` Unit Test Backend (`96` `loyalty-common`, `1` `cms-service` `FullLifecycleE2ETest`, `12` `game-service`), build pass `3` Frontend (`cms`, `webview`, `partner-portal`) và hợp lệ hóa cả 2 cấu hình Docker Compose / Nginx.

---

## 3. HẠNG MỤC VẬN HÀNH ĐÃ HOÀN THÀNH VÀ CÁC BƯỚC TIẾP THEO

1. **Đã triển khai ổn định trên môi trường SaaS (`35.247.156.176:65000`):** Khởi chạy thành công **11 vùng chứa** Docker (`7/7` healthcheck `healthy`), đồng bộ schema Flyway và xác nhận `HTTP 200` trên cả 5 tên miền (`api.mid.io.vn`, `cms.mid.io.vn`, `portal.mid.io.vn`, `partner.mid.io.vn`, `docs.mid.io.vn/swagger-ui/index.html`).
2. **Các bước tiếp theo để hoàn tất thương mại hóa (Go-Live):**
   * Kết nối chứng thư & endpoint thật tới Core Ví Natcash / SMS Brandname Natcom và triển khai gói On-Premise (`deploy/natcash/` lên `10.228.37.65:22`) khi có chỉ thị.
   * Thực thi các bài đo tải [lucky_wheel_loadtest.js](../scripts/loadtest/lucky_wheel_loadtest.js), [pos_wallet_loadtest.js](../scripts/loadtest/pos_wallet_loadtest.js) và đối soát toàn vẹn sổ cái DB sau tải trên môi trường Staging.
   * Thực thi bộ rà soát an ninh [security_pentest_suite.py](../scripts/security/security_pentest_suite.py), nghiệm thu Pentest độc lập và triển khai Pilot UAT cùng tập người dùng thật.
