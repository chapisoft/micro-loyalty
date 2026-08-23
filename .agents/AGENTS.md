# Quy Tắc Phiên Làm Việc — Hệ Sinh Thái Loyalty & GameHub (micro-loyalty)

---

## 1. TỔNG QUAN DỰ ÁN VÀ KIẾN TRÚC HỆ THỐNG

`micro-loyalty` là hệ sinh thái **Nền Tảng Khách Hàng Thân Thiết Liên Minh và Cổng Game Đa Thuê Bao (Standalone Loyalty & Multi-tenant GameHub Platform)** của Chapisoft/Natcash. Hệ thống cung cấp cơ chế tích điểm hợp nhất, phân tầng hội viên, liên thông Ví Phần Thưởng (Reward Wallet) tại quầy thu ngân đối tác, động cơ cột mốc chiến dịch, gợi nhắc thông minh và phân hệ Cổng Game HTML5 đa năng.

### Bộ Sản Phẩm Bàn Giao Cốt Lõi:
1. **`loyalty-service`:** Máy chủ nghiệp vụ độc lập (Java 17 LTS / Spring Boot 2.7.14+), cơ sở dữ liệu độc lập `loyalty_db` trên **PostgreSQL 15+** (tách biệt 100% với `natcash_db`).
2. **`loyalty-cms`:** Cổng thông tin quản trị trung tâm (ReactJS 18+ / TypeScript / Vite / Ant Design 5.x / Nginx).
3. **`loyalty-webview`:** Cổng trải nghiệm Webview nhúng đa nền tảng (ReactJS 18+ / TypeScript / Vite / TailwindCSS Mobile-First / Nginx) với cầu nối `LoyaltyJSBridge`.
4. **`natcash-eu-app`:** Tích hợp màn hình Trung tâm Loyalty, Mã QR Ví Phần Thưởng động 60 giây và Cổng Game trên React Native.
5. **`natcash-eu-api`:** Cổng kết nối chuyển tiếp (Spring Boot Reverse Proxy) xác thực JWT, gán tiêu đề `X-Tenant-Id` và tiếp nhận Webhook.

---

## 2. NGUYÊN TẮC KIỂM SOÁT MÃ NGUỒN VÀ GIT (SOURCE CONTROL)

1. **Tuyệt đối KHÔNG tự động commit mã nguồn (No Auto-commit):**
   Agent tuyệt đối không tự ý chạy lệnh `git add` hoặc `git commit` khi chưa có chỉ đạo hoặc yêu cầu rõ ràng, tường minh từ người dùng.
2. **Bắt buộc kiểm tra `git diff` trước khi commit:**
   Trước khi commit mã nguồn (khi được yêu cầu), bắt buộc phải chạy `git diff` hoặc `git diff --cached` để tự rà soát lại toàn bộ thay đổi. Đảm bảo không xóa mất mã nguồn nghiệp vụ thực tế hoặc chèn mã rác (skeleton/fixme).
3. **Quy trình phân nhánh Git chuẩn:**
   * Mọi nhánh tính năng mới bắt buộc tạo từ nhánh `main`: `git checkout main && git pull && git checkout -b feature/LOYALTY-<ticket>-<desc>`.
   * Kiểm thử hoàn thiện 100% trên môi trường cục bộ trước khi tạo yêu cầu hợp nhất (Merge Request).

---

## 3. NGUYÊN TẮC VẬN HÀNH VÀ TRIỂN KHAI MÁY CHỦ (DEPLOYMENT RULES)

1. **Tuyệt đối KHÔNG tự ý deploy lên Server từ xa:**
   Mọi thao tác lập trình, sửa lỗi, tái cấu trúc mã nguồn và kiểm thử phải được thực hiện hoàn toàn ở môi trường cục bộ (Local). Agent tuyệt đối không tự ý chạy các lệnh SSH, rsync, `docker compose build` hay tác động lên máy chủ từ xa khi chưa có yêu cầu trực tiếp từ người dùng.
2. **Nguyên tắc đóng gói và triển khai chuẩn:**
   * Backend: Đóng gói tệp `.jar` tại môi trường cục bộ (`mvn clean package -DskipTests` hoặc `./gradlew bootJar`), xây dựng Docker Image chuẩn hóa.
   * Frontend (CMS & Webview): Đóng gói ứng dụng trang đơn tĩnh (`npm run build`) và phục vụ qua máy chủ Nginx tĩnh siêu nhẹ (< 20MB RAM), không chạy Node.js runtime trên môi trường vận hành.

---

## 4. QUY CHUẨN LẬP TRÌNH VÀ CHẤT LƯỢNG MÃ NGUỒN (CODING CONVENTIONS)

### 4.1. Tiêu Chuẩn Ngăn Chặn Tuyệt Đối Hardcode (Zero-Hardcode Standard)
* **Backend Java Spring Boot:**
  * Tuyệt đối **KHÔNG hardcode magic strings, magic numbers, mã mặc định** (như `"DEFAULT"`, `"ACTIVE"`, `"SYSTEM"`, `"SUCCESS"`, pool sizes, query timeouts, header names, API path prefixes...).
  * Bắt buộc khai báo tập trung trong các lớp Constants (`LoyaltyConstants.java`, `SecurityConstants.java`, `RedisKeys.java`) và sử dụng các Domain Enums (`TierLevel`, `PointActionType`, `VoucherStatus`, `ClearingStatus`, `TriggerType`, `ErrorCode`).
  * Sử dụng `@Enumerated(EnumType.STRING)` hoặc JPA `@Converter` khi ánh xạ Enum với cơ sở dữ liệu PostgreSQL.
* **Frontend (CMS & Webview):**
  * Tuyệt đối KHÔNG hardcode chuỗi trạng thái, mã cấu hình hay magic numbers. Phải sử dụng Enums và Constants trong tầng `types/` hoặc `constants/`.
  * **100% Zero Hardcoded Text (i18n):** Tất cả chuỗi hiển thị trên giao diện, tiêu đề modal, tên cột bảng, placeholder, tooltip, nhãn nút bấm, thông báo toast/confirm bắt buộc phải lấy qua hệ thống đa ngôn ngữ `t("key")` (từ `src/locales/vi.json` và `src/locales/en.json`).
  * Tuyệt đối cấm viết chuỗi tiếng Việt hoặc tiếng Anh trực tiếp trong mã nguồn `.tsx` / `.jsx`.

### 4.2. Quy Chuẩn Khai Báo Import Gọn Gàng (Clean Imports Standard)
* **Tuyệt đối KHÔNG sử dụng Fully Qualified Names (FQN)** trong khai báo biến, tham số, kiểu trả về hoặc constructor (ví dụ: cấm viết `public void process(com.natcash.loyalty.dto.EarnRequest req)`). Bắt buộc phải import ở đầu tệp và dùng tên ngắn gọn (Simple Name).
* **Zero Unused Imports:** Loại bỏ 100% các câu lệnh import thừa sau khi sửa đổi mã nguồn.
* **Quy chuẩn 4 nhóm import phân cách bằng 1 dòng trống:**
  1. **Nhóm mã nguồn dự án:** `import com.natcash.loyalty.*` (Domain models, DTOs, Services, Repositories, Utils).
  2. **Nhóm thư viện bên thứ ba / Framework:** `import org.springframework.*`, `import com.fasterxml.jackson.*`, `import lombok.*`, `import org.redisson.*`...
  3. **Nhóm thư viện chuẩn Java:** `import java.util.*`, `import java.time.*`, `import java.math.*`, `import java.io.*`...
  4. **Nhóm Static Imports:** `import static ...` (đặt ở cuối cùng của khối import).

### 4.3. Quy Chuẩn Cơ Sở Dữ Liệu và Flyway Migration (PostgreSQL 15+)
1. **Tuyệt đối không sửa đổi tệp SQL Migration đã được áp dụng:**
   Khi tệp Migration (ví dụ `V1__init_loyalty_core_schema.sql`) đã được commit hoặc chạy trên bất kỳ môi trường nào, tuyệt đối không sửa đổi nội dung tệp cũ để tránh lỗi sai lệch mã băm (Checksum Mismatch). Mọi thay đổi cấu trúc bảng bắt buộc phải tạo tệp mới với số phiên bản tăng dần (ví dụ `V2__add_partner_metadata.sql`).
2. **Tuân thủ đúng cú pháp PostgreSQL 15+ (SQL Dialect):**
   * Sử dụng kiểu dữ liệu `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `TIMESTAMPTZ`, `DECIMAL(18,2)`, và `JSONB` cho dữ liệu Webhook / Metadata.
   * Tạo chỉ mục (Indexes) có tiền tố `idx_` rõ ràng cho các trường tìm kiếm thường xuyên (`tenant_id`, `external_user_id`, `status`, `created_at`).

---

## 5. NGUYÊN TẮC BẢO MẬT VÀ TOÀN VẸN TÀI CHÍNH (SECURITY & INTEGRITY)

1. **Khóa phân tán chống tiêu điểm kép:**
   Mọi giao dịch trừ điểm tại quầy thu ngân siêu thị bắt buộc phải chiếm giữ khóa phân tán `RLock` của Redisson theo mẫu `lock:burn:tenant_id:user_id` với thời gian chờ tối đa 3.000ms kết hợp mức cô lập giao dịch `Pessimistic Write Lock` trong cơ sở dữ liệu.
2. **Kiểm soát tính lũy kế (Idempotency Control):**
   Mọi API trừ điểm, áp voucher và nạp tiền in-game bắt buộc phải kiểm tra mã giao dịch duy nhất `transaction_code` trong Redis với thời gian sống 24 giờ và ràng buộc `UNIQUE` trong PostgreSQL để chống trùng lặp do gửi lại yêu cầu.
3. **Xác thực Khóa kép và Ký số HMAC-SHA256:**
   Mọi giao dịch B2B giữa máy chủ đối tác (siêu thị, viễn thông) và Loyalty bắt buộc phải gửi kèm tiêu đề `X-Api-Key`, `X-Timestamp` và chữ ký số `X-Signature = HMAC-SHA256(SecretKey, CanonicalString)`. Từ chối các yêu cầu có thời gian chênh lệch quá ±300 giây so với giờ máy chủ.
4. **Cô lập đa thuê bao tuyệt đối:**
   Mọi câu lệnh truy vấn cơ sở dữ liệu phải được lọc tự động theo mã định danh thuê bao `tenant_id` thông qua `TenantContextFilter` và `Hibernate Filter`, triệt tiêu hoàn toàn nguy cơ rò rỉ dữ liệu giữa các thị trường hoặc các đối tác khác nhau.
5. **Xử lý sự kiện bất đồng bộ qua Transactional Outbox Pattern:**
   Không bắn Webhook trực tiếp trong luồng giao dịch cơ sở dữ liệu chính. Lưu sự kiện vào bảng `WEBHOOK_OUTBOX` trong cùng một Transaction và để tiến trình nền quét gửi độc lập kèm cơ chế thử lại theo cấp số nhân (5 lần) và đẩy vào `WEBHOOK_DEAD_LETTER` nếu quá hạn.

---

## 6. QUY CHUẨN GIAO DIỆN NGƯỜI DÙNG (UI IMPLEMENTATION RULES)

1. **Nguyên tắc cấu trúc bảng dữ liệu (DataTable):**
   Tất cả các bảng danh sách trên CMS Quản trị bắt buộc phải sắp xếp các cột từ trái sang phải theo thứ tự chuẩn hóa:
   * Cột 1: `Checkbox` (chọn nhiều dòng để thực hiện thao tác hàng loạt).
   * Cột 2: `STT` (số thứ tự tự động).
   * Cột 3: `Thao tác / Hành động` (các nút Xem chi tiết, Sửa, Khóa, Đổi trạng thái).
   * Cột 4 trở đi: `Các cột dữ liệu nghiệp vụ` (Mã đối tác, Tên, Hạng, Điểm, Trạng thái, Ngày tạo).
2. **Hiển thị thông điệp gợi nhắc âm thầm:**
   Các thông báo chăm sóc khách hàng (nhắc nâng hạng, điểm sắp hết hạn) phải được hiển thị tinh tế dưới dạng thẻ thông tin nhỏ trên giao diện ứng dụng, không phát sinh âm thanh hoặc rung làm phiền khi người dùng chưa mở ứng dụng.
3. **Kiểm soát tần suất thông báo đẩy:**
   Giới hạn tối đa 1 thông báo đẩy mỗi ngày cho mỗi khách hàng và tuyệt đối không gửi thông báo ngoài khung giờ từ 8h00 sáng đến 20h00 tối.

---

## 7. KIỂM THỬ VÀ XÁC THỰC CỤC BỘ (PRE-COMMIT VERIFICATION)

Trước khi báo cáo hoàn thành một tác vụ có thay đổi mã nguồn, bắt buộc phải chạy lệnh kiểm tra kiểm thử cục bộ:
```bash
# Kiểm thử Backend
mvn clean test
# Kiểm thử Frontend (CMS & Webview)
npm run lint && npm run build
```
Đảm bảo 100% các ca kiểm thử đơn vị, kiểm tra kiểu dữ liệu TypeScript và ESLint đều đạt kết quả thành công hoàn toàn, không có bất kỳ lỗi đỏ nào.
