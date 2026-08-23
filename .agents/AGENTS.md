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

## 2. NGUYÊN TẮC QUẢN LÝ MÃ NGUỒN VÀ QUY TRÌNH PHÂN NHÁNH

### 2.1. Kiểm soát hành động và cấm tự động lưu vết
1. **Tuyệt đối không tự ý lưu vết (No Auto-commit):**
   * Trợ lý trí tuệ nhân tạo tuyệt đối không tự ý chạy các lệnh `git add`, `git commit` hoặc `git push` khi chưa có chỉ đạo hoặc yêu cầu rõ ràng, tường minh từ người dùng.
2. **Quy chuẩn thông điệp lưu vết:**
   * Khi được yêu cầu thực hiện commit, thông điệp phải tuân thủ chuẩn Conventional Commits với cấu trúc:
     * `feat(scope): Mô tả tính năng mới hoàn thành`
     * `fix(scope): Mô tả lỗi đã được khắc phục`
     * `refactor(scope): Mô tả tái cấu trúc mã nguồn tối ưu`
     * `test(scope): Bổ sung kịch bản kiểm thử tự động`
     * `docs(scope): Cập nhật tài liệu kỹ thuật hoặc quy chuẩn`

### 2.2. Quy trình rà soát thay đổi bắt buộc trước khi lưu vết
1. **Kiểm tra trạng thái và rà soát toàn bộ thay đổi:**
   * Trước khi đưa tệp vào vùng chờ hoặc tạo bản commit, bắt buộc chạy `git status` và `git diff` (hoặc `git diff --cached`) để tự rà soát lại toàn bộ từng dòng mã nguồn thay đổi.
2. **Làm sạch mã nguồn trước khi hợp nhất:**
   * Loại bỏ triệt để mã thử nghiệm tạm thời (`console.log`, `System.out.println`, các biến không sử dụng, mã nguồn rác chưa hoàn thiện).
   * Đảm bảo không xóa nhầm các đoạn mã nguồn nghiệp vụ thực tế đã có từ trước.

### 2.3. Quy trình phân nhánh và vòng đời phát triển
1. **Quy chuẩn nhánh chính và nhánh tính năng:**
   * Nhánh chính (`main` / `master`): Chứa mã nguồn ổn định, luôn ở trạng thái sẵn sàng phát hành.
   * Nhánh tính năng: Mọi nhánh tính năng mới bắt buộc phải tạo từ nhánh `main` mới nhất:
     ```bash
     git checkout main && git pull && git checkout -b feature/LOYALTY-<ma-yeu-cau>-<mo-ta-ngan>
     ```
   * Nhánh sửa lỗi khẩn cấp (`hotfix/LOYALTY-<ma-yeu-cau>-<mo-ta-ngan>`): Dùng để xử lý trực tiếp lỗi phát sinh trên môi trường vận hành.
2. **Kiểm thử hoàn thiện trước khi tạo yêu cầu hợp nhất:**
   * 100% các ca kiểm thử đơn vị, kiểm tra cú pháp và đóng gói bản dựng phải đạt kết quả thành công hoàn toàn ở môi trường cục bộ trước khi tạo yêu cầu hợp nhất mã nguồn.

### 2.4. Kiểm soát tệp cấu hình và ngăn chặn rò rỉ bí mật
1. **Cấu hình tệp loại trừ hoàn chỉnh:**
   * Duy trì tệp `.gitignore` chuẩn mực, loại trừ 100% các thư mục tạo tự động (`target/`, `node_modules/`, `dist/`, `build/`, `.idea/`, `.vscode/`, `logs/`, `.env`, tệp tạm hệ điều hành `.DS_Store`).
2. **Ngăn chặn rò rỉ thông tin nhạy cảm:**
   * Tuyệt đối không commit tệp chứa khóa bí mật sản xuất, chứng chỉ khóa riêng tư (`.jks`, `.p12`, `.pem`), mật khẩu cơ sở dữ liệu lên kho mã nguồn.

---

## 3. NGUYÊN TẮC VẬN HÀNH, ĐÓNG GÓI VÀ TRIỂN KHAI HỆ THỐNG

### 3.1. Cô lập môi trường cục bộ và cấm tự ý can thiệp máy chủ từ xa
1. **Nguyên tắc ưu tiên cục bộ (Local-first):**
   * Toàn bộ thao tác lập trình, sửa lỗi, tái cấu trúc mã nguồn, chạy kiểm thử và đóng gói thử nghiệm phải được thực hiện hoàn toàn ở môi trường cục bộ trên máy trạm của lập trình viên.
2. **Cấm tự ý tác động lên máy chủ từ xa:**
   * Trợ lý tuyệt đối không tự ý chạy các lệnh SSH, SCP, Rsync, `docker context` từ xa hay tác động lên môi trường máy chủ thử nghiệm/vận hành khi chưa có yêu cầu trực tiếp từ người dùng.

### 3.2. Quy chuẩn đóng gói dịch vụ phía máy chủ
1. **Đóng gói ứng dụng máy chủ:**
   * Biên dịch và đóng gói tệp thực thi Java chuẩn hóa:
     ```bash
     mvn clean package -DskipTests
     ```
2. **Xây dựng ảnh vùng chứa chuẩn hóa đa tầng:**
   * Tầng 1 (Trình dựng): Sử dụng Maven kết hợp JDK 17 để biên dịch mã nguồn và đóng gói tệp `.jar`.
   * Tầng 2 (Môi trường thực thi): Sử dụng Eclipse Temurin JRE 17 Alpine siêu nhẹ, tạo người dùng không có đặc quyền quản trị `appuser` để đảm bảo an ninh tối đa cho vùng chứa.
3. **Cấu hình tham số bộ nhớ máy ảo tối ưu:**
   * Cấu hình bộ thu gom rác G1GC và tỷ lệ cấp phát bộ nhớ tự động theo kích thước vùng chứa:
     ```bash
     -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError
     ```

### 3.3. Quy chuẩn đóng gói cổng quản trị và trang nhúng
1. **Đóng gói ứng dụng trang đơn tĩnh:**
   * Biên dịch mã nguồn Frontend ra gói trang đơn tĩnh siêu nhẹ:
     ```bash
     npm run build
     ```
2. **Phục vụ qua máy chủ Nginx tĩnh siêu nhẹ:**
   * Sử dụng máy chủ Nginx chạy trên nền Alpine Linux, mức tiêu thụ bộ nhớ RAM thực tế dưới 20MB.
   * Tuyệt đối không chạy môi trường thực thi Node.js trên máy chủ vận hành sản xuất để triệt tiêu nguy cơ rò rỉ bộ nhớ.
3. **Cấu hình bộ nhớ đệm trình duyệt chuẩn mực:**
   * Tệp điều hướng `index.html`: Cấu hình `no-cache, no-store, must-revalidate` để người dùng luôn nhận được phiên bản mới nhất ngay khi triển khai.
   * Các tệp tài nguyên tĩnh có gắn mã băm nội dung (JavaScript, CSS, Hình ảnh, Phông chữ): Cấu hình lưu đệm dài hạn `max-age=31536000, immutable`.

### 3.4. Giám sát sức khỏe dịch vụ và tắt tiến trình êm ái
1. **Điểm kiểm tra sức khỏe tự động:**
   * Cung cấp các điểm cuối kiểm tra trạng thái hoạt động:
     * Kiểm tra trạng thái sống: `GET /actuator/health/liveness`
     * Kiểm tra trạng thái sẵn sàng tiếp nhận yêu cầu: `GET /actuator/health/readiness`
2. **Cơ chế dừng tiến trình êm ái (Graceful Shutdown):**
   * Cấu hình thời gian chờ tối đa 30 giây khi nhận tín hiệu dừng máy chủ (`server.shutdown: graceful`, `spring.lifecycle.timeout-per-shutdown-phase: 30s`) để hoàn tất toàn bộ các giao dịch đang xử lý trước khi đóng tiến trình.

---

## 4. QUY CHUẨN LẬP TRÌNH VÀ CHẤT LƯỢNG MÃ NGUỒN (CODING CONVENTIONS)

### 4.1. Tiêu Chuẩn Ngăn Chặn Tuyệt Đối Hardcode (Enterprise Zero-Hardcode Standard)

Hệ thống bắt buộc áp dụng tiêu chuẩn Zero-Hardcode toàn diện trên cả 5 trụ cột: Giao diện (i18n), Nghiệp vụ lõi (Business Logic), Cấu hình môi trường (Environment Config), Cơ sở dữ liệu (Database Schemas) và Định tuyến kết nối (API & Integration).

#### 1. Trụ Cột Giao Diện Người Dùng (100% Zero Hardcoded Text / i18n Standard):
* **Cấm hoàn toàn việc viết trực tiếp chuỗi chữ (Hardcoded String)** bằng tiếng Việt, tiếng Anh hay bất kỳ ngôn ngữ nào trong các tệp `.tsx`, `.jsx`, `.vue`, `.html`, `.json` giao diện.
* **100% Nội dung hiển thị phải lấy qua hàm dịch `t("namespace.key")`**:
  * Tiêu đề trang, tiêu đề thẻ Card, thanh điều hướng Breadcrumb, tiêu đề Modal / Dialog / Drawer.
  * Tên các cột trên bảng dữ liệu DataTable, nhãn nút bấm (Action buttons), nhãn trường biểu mẫu (Form labels).
  * Văn bản gợi ý nhập liệu (Placeholder), chú giải công cụ (Tooltip), thông báo xác nhận (Confirm Dialog).
  * Thông báo trạng thái (Toast, Alert, Banner), thông điệp lỗi kiểm tra tính hợp lệ dữ liệu (Validation Errors).
  * Dòng trạng thái rỗng (Empty State / No Data), văn bản đếm lùi thời gian hoặc nhãn phân trang.
* **Bắt buộc cấu hình đồng bộ đa từ điển ngôn ngữ**:
  * Tất cả các khóa mới phải được khai báo song song và đồng nhất ở các tệp từ điển (`src/language/locales/vi.ts`, `en.ts`, `fr.ts`, `ht.ts`...).
  * Khóa ngôn ngữ phải được phân cấp theo tiền tố nghiệp vụ rõ ràng: `nav.*`, `common.*`, `policy.*`, `tier.*`, `campaign.*`, `game.*`, `voucher.*`, `clearing.*`, `validation.*`.

#### 2. Trụ Cột Nghiệp Vụ Lõi Backend (Zero Magic Values & Domain Enums Standard):
* **Tuyệt đối KHÔNG sử dụng Magic Strings và Magic Numbers**:
  * Cấm ghi trực tiếp các số liệu cấu hình như: thời gian chờ (lock timeouts, query timeouts), thời gian sống Redis TTL, hệ số nhân điểm mặc định, tỷ lệ khấu trừ, số lần thử lại tối đa (max retries), kích thước phân trang mặc định, ngưỡng phần trăm cảnh báo, dung sai thời gian lệch (drift tolerance).
  * Mọi số liệu nghiệp vụ phải được khai báo tập trung trong các lớp Constants (`LoyaltyConstants.java`, `SecurityConstants.java`, `RedisKeys.java`, `BatchJobConstants.java`) hoặc nạp động từ `application.yml` thông qua `@ConfigurationProperties`.
* **100% Trạng thái và Phân loại phải sử dụng Domain Enums**:
  * Bắt buộc dùng Enums có kiểu tường minh: `TierLevel`, `PointActionType`, `VoucherStatus`, `ClearingStatus`, `TriggerType`, `ErrorCode`, `DiscountType`, `GameStatus`, `WebhookStatus`.
  * Tuyệt đối cấm so sánh hoặc gán giá trị trạng thái dạng chuỗi thuần như `"ACTIVE"`, `"SUCCESS"`, `"PENDING"`, `"BURN"`, `"EARN"`.
  * Ánh xạ với cơ sở dữ liệu PostgreSQL bắt buộc dùng `@Enumerated(EnumType.STRING)` hoặc JPA AttributeConverter để đảm bảo tính toàn vẹn dữ liệu.
* **Quy chuẩn Định dạng Khóa Redis & Kênh Tin (Redis Keys & Stream Channels):**
  * Tất cả các tiền tố khóa Redis, khuôn mẫu khóa phân tán Redisson (`lock:burn:tenant_id:user_id`, `lock:spin:tenant_id:game_id:user_id`) và tên kênh Redis Streams (`loyalty.events.tenant_id`) phải được sinh qua các phương thức tĩnh trong lớp `RedisKeys.java`. Cấm nối chuỗi thủ công trong tầng Service.

#### 3. Trụ Cột Phân Hệ Frontend (Zero Hardcoded Business State & Constants):
* **Cấm so sánh trạng thái bằng chuỗi trần**:
  * Cấm viết `rowData.status === 'ACTIVE'` hoặc `tier === 'GOLD'`.
  * Bắt buộc khai báo và import các Enums / Constants tập trung tại `src/types/` hoặc `src/constants/` (ví dụ `TierLevel.GOLD`, `VoucherStatus.ACTIVE`, `PolicyStatus.ACTIVE`).
* **Hằng số đường dẫn và tham số**:
  * Đường dẫn trang web phải lấy từ `paths.*` trong [paths.ts](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/loyalty-cms/src/paths.ts).
  * Cấu hình phân trang, định dạng ngày giờ (`DD/MM/YYYY HH:mm:ss`), tỷ lệ màn hình phải lấy từ `AppConstants`.

#### 4. Trụ Cột Cấu Hình Môi Trường & Bảo Mật (Zero Secret Hardcoding Standard):
* **Tuyệt đối cấm ghi cứng thông tin bảo mật trong mã nguồn**:
  * Mật khẩu cơ sở dữ liệu, API Keys, Webhook Secret Keys, JWT Signing Keys, địa chỉ máy chủ nội bộ (PostgreSQL, Redis, RabbitMQ, Elasticsearch) tuyệt đối không được viết trực tiếp trong mã nguồn Java hoặc JavaScript.
  * Phải sử dụng cơ chế nạp biến môi trường (`ENV`) kết hợp thư viện mã hóa bảo mật `ims-jasypt` (`ENC(...)`) để giải mã an toàn khi khởi động máy chủ.

#### 5. Cơ Chế Kiểm Soát Tự Động (Enforcement & Pre-commit Verification):
* Mọi thay đổi mã nguồn trước khi hợp nhất bắt buộc phải vượt qua bộ lọc kiểm tra cú pháp và kiểu dữ liệu:
  * Backend: `mvn clean test` (Không có lỗi biên dịch, 100% unit tests pass).
  * Frontend: `npm run lint && npm run build` (0 lỗi TypeScript, 0 biến/import thừa, 100% bundle đóng gói thành công).

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

## 5. NGUYÊN TẮC BẢO MẬT VÀ TOÀN VẸN TÀI CHÍNH

Hệ thống bắt buộc tuân thủ bộ tiêu chuẩn bảo mật ngân hàng và kiểm soát toàn vẹn tài chính đa phương trên 6 trụ cột:

### 5.1. Kiểm soát đồng thời và chống tiêu điểm kép đa tầng
1. **Tầng 1 — Khóa phân tán Redisson RLock:**
   * Mọi giao dịch trừ điểm, áp mã giảm giá hoặc quay số trúng thưởng bắt buộc phải chiếm giữ khóa phân tán `RLock` của Redisson:
     * Trừ điểm: `lock:burn:tenant_id:user_id` (chờ tối đa 3.000ms, tự động nhả sau 5.000ms).
     * Quay thưởng: `lock:spin:tenant_id:game_id:user_id` (chờ tối đa 2.000ms, tự động nhả sau 4.000ms).
   * Khi không chiếm được khóa trong thời gian chờ, hệ thống phải ném ngay lỗi `CONCURRENT_LOCK_BUSY` (mã HTTP 429 hoặc 409) kèm thông điệp đa ngôn ngữ, tuyệt đối không để yêu cầu chờ vô tận gây nghẽn bể kết nối.
2. **Tầng 2 — Khóa bi quan cơ sở dữ liệu:**
   * Trong phạm vi một khối `@Transactional`, sau khi đã có `RLock`, câu lệnh truy vấn tài khoản hội viên phải sử dụng cơ chế khóa bi quan: `SELECT ... FOR UPDATE` (`LockModeType.PESSIMISTIC_WRITE`) trên bảng `loyalty_accounts` để khóa dòng dữ liệu tại PostgreSQL, ngăn chặn tuyệt đối hiện tượng xung đột dữ liệu đồng thời ở cấp độ lưu trữ.
3. **Tầng 3 — Ràng buộc sổ cái bất biến:**
   * Kiểm tra nghiêm ngặt điều kiện tiên quyết: số dư hiện tại phải lớn hơn hoặc bằng số điểm trừ.
   * Ghi nhận giao dịch vào bảng `loyalty_point_ledger` theo nguyên tắc bất biến chỉ ghi thêm, tính toán và ghi nhận chính xác: số dư trước, số điểm biến động, số dư sau giao dịch.
   * Tuyệt đối cấm cập nhật trực tiếp trường số dư trên tài khoản mà không có bản ghi tương ứng trong sổ cái điểm.

### 5.2. Kiểm soát tính lũy kế và chống trùng lặp giao dịch
1. **Kiểm soát mã giao dịch duy nhất:**
   * Mọi yêu cầu tích điểm, trừ điểm, hoàn trả, áp phiếu giảm giá bắt buộc phải truyền kèm mã giao dịch duy nhất của phía đối tác `transaction_code` (hoặc `requestId`).
2. **Cơ chế kiểm tra hai lớp qua bộ nhớ đệm và cơ sở dữ liệu:**
   * **Lớp 1 (Kiểm tra nhanh qua Redis):** Lưu vết giao dịch đang xử lý `idempotency:tenant_id:tx_code` trên Redis với thời gian sống 24 giờ (`SET NX EX 86400`). Nếu đã tồn tại, lập tức trả về kết quả đã xử lý thành công trước đó mà không thực hiện lại nghiệp vụ trừ điểm.
   * **Lớp 2 (Ràng buộc duy nhất tại PostgreSQL):** Thiết lập ràng buộc duy nhất bất biến `UNIQUE (tenant_id, transaction_code)` trên các bảng `loyalty_point_ledger`, `loyalty_voucher_redemptions`, và `clearing_transactions` để chặn đứng hoàn toàn việc ghi trùng bản ghi do sự cố mạng gửi lại yêu cầu.

### 5.3. Xác thực khóa kép, chữ ký số HMAC-SHA256 và chống tấn công phát lại
1. **Quy chuẩn tiêu đề xác thực giữa các hệ thống:**
   * Mọi kết nối từ đối tác ngoài (quầy thu ngân siêu thị, hệ thống viễn thông, cổng thanh toán) bắt buộc phải truyền đủ 5 tiêu đề xác thực:
     * `X-Tenant-Id`: Mã định danh đơn vị thuê bao (`TENANT_DELIMART`, `TENANT_NATCASH`).
     * `X-Api-Key`: Khóa định danh API của đối tác (tra cứu trạng thái hoạt động trong bảng `partner_api_keys`).
     * `X-Timestamp`: Thời gian phát sinh yêu cầu theo chuẩn ISO-8601 UTC hoặc Unix Epoch (mili-giây).
     * `X-Nonce`: Chuỗi ngẫu nhiên duy nhất (UUID) sinh bởi phía đối tác cho mỗi yêu cầu để chống tấn công phát lại.
     * `X-Signature`: Chữ ký số mật mã sinh qua thuật toán `HMAC-SHA256(SecretKey, CanonicalString)`.
2. **Khuôn mẫu chuỗi chuẩn hóa:**
   ```text
   HTTP_METHOD + "\n" + REQUEST_URI + "\n" + X-Timestamp + "\n" + X-Nonce + "\n" + SHA256(REQUEST_BODY)
   ```
3. **Kiểm tra dung sai thời gian:**
   * So sánh thời gian máy chủ: độ lệch thời gian không vượt quá ±300 giây (5 phút).
   * Từ chối ngay lập tức với mã lỗi `REQUEST_EXPIRED` (HTTP 401) nếu độ lệch thời gian vượt quá ngưỡng an toàn.

### 5.4. Cách ly đa thuê bao tuyệt đối và phân quyền theo ngữ cảnh
1. **Bộ lọc ngữ cảnh tự động:**
   * Mọi yêu cầu HTTP đi vào hệ thống bắt buộc phải đi qua `TenantContextFilter` để trích xuất và xác thực `tenant_id`, nạp vào `TenantContextHolder` (sử dụng `InheritableThreadLocal`).
   * Bắt buộc dọn dẹp sạch sẽ ngữ cảnh `TenantContextHolder.clear()` trong khối `finally` để triệt tiêu nguy cơ ô nhiễm luồng giữa các yêu cầu trong bể luồng xử lý.
2. **Lọc dữ liệu tự động cấp cơ sở dữ liệu:**
   * 100% các câu lệnh truy vấn dữ liệu nghiệp vụ phải được gắn điều kiện lọc `WHERE tenant_id = :currentTenantId` tự động, triệt tiêu hoàn toàn rủi ro rò rỉ dữ liệu giữa các đối tác hoặc các thị trường khác nhau.
3. **Mã hóa bí mật cấu hình:**
   * Khóa bí mật ký số `SecretKey`, mật khẩu cơ sở dữ liệu và chứng chỉ kết nối bắt buộc mã hóa qua thư viện `ims-jasypt` (`ENC(...)`) và nạp động từ biến môi trường.

### 5.5. Đảm bảo tính nhất quán giao dịch và xử lý sự kiện bất đồng bộ
1. **Không gửi thông báo trực tiếp trong giao dịch cơ sở dữ liệu:**
   * Tuyệt đối không thực hiện các cuộc gọi HTTP ra bên ngoài hoặc đẩy thông điệp qua mạng khi đang giữ giao dịch cơ sở dữ liệu chính.
   * Sự kiện gửi thông báo đối tác bắt buộc phải được ghi vào bảng `WEBHOOK_OUTBOX` cùng chung một giao dịch với dữ liệu điểm.
2. **Tiến trình quét gửi độc lập và thử lại theo cấp số nhân:**
   * Tiến trình nền `OutboxPublisher` quét định kỳ các bản ghi đang chờ xử lý, gửi Webhook kèm chữ ký HMAC.
   * Khi gặp lỗi mạng hoặc máy chủ đối tác trả về mã lỗi 5xx, tự động lên lịch thử lại theo công thức lũy thừa: Lần 1 (60 giây), Lần 2 (120 giây), Lần 3 (240 giây), Lần 4 (480 giây), Lần 5 (960 giây).
3. **Cách ly thất bại qua hàng đợi xử lý ngoại lệ:**
   * Sau 5 lần thử lại không thành công, bản ghi được tự động chuyển sang bảng `WEBHOOK_DEAD_LETTER` với trạng thái thất bại, lưu đầy đủ lý do lỗi và phát cảnh báo đến đội ngũ vận hành.

### 5.6. Khống chế ngân sách phần thưởng và bù trừ đối soát đa phương
1. **Khống chế ngân sách phần thưởng nguyên tử:**
   * Các giải thưởng giá trị lớn (tiền mặt, quà tặng giá trị cao) trong Vòng quay may mắn bắt buộc phải được khống chế hạn mức ngân sách hàng ngày bằng các lệnh nguyên tử của Redis (`DECRBY` hoặc mã lệnh Lua).
   * Khi số lượng giải thưởng hoặc ngân sách trong ngày chạm mốc 0, hệ thống tự động điều chỉnh xác suất trúng thưởng về giải khuyến khích mà không làm thâm hụt ngân sách chiến dịch.
2. **Sổ cái bù trừ công nợ tài chính đa phương:**
   * Mọi giao dịch tiêu điểm chéo giữa Đơn vị phát hành và Đơn vị chấp nhận phải được hạch toán ngay vào bảng `clearing_transactions` với tỷ giá quy đổi chính xác, sẵn sàng cho quy trình đối soát và quyết toán tài chính định kỳ giữa các bên.

---

## 6. QUY CHUẨN GIAO DIỆN NGƯỜI DÙNG

Hệ thống tuân thủ nghiêm ngặt bộ tiêu chuẩn thiết kế giao diện doanh nghiệp chuẩn mực trên cả Cổng quản trị trung tâm (`loyalty-cms`) và Cổng trải nghiệm nhúng (`loyalty-webview`):

### 6.1. Quy chuẩn bảng dữ liệu toàn diện:
1. **Thứ tự cột chuẩn hóa bất biến từ trái sang phải:**
   * **Cột 1: Hộp kiểm chọn dòng (Checkbox Selection)** — Chọn một hoặc nhiều dòng để thực hiện các thao tác hàng loạt.
   * **Cột 2: Số thứ tự (STT)** — Số thứ tự tăng dần tự động tính theo trang: `(pageIndex - 1) * pageSize + rowIndex + 1`, căn giữa (`align="center"`), độ rộng cố định (60px - 80px).
   * **Cột 3: Thao tác / Hành động** — Nhóm các nút bấm tương tác nhanh trên từng bản ghi.
   * **Cột 4 trở đi: Các cột dữ liệu nghiệp vụ** — Mã định danh, Tên, Hạng, Điểm số, Trạng thái, Ngày tạo/cập nhật.
2. **Quy chuẩn nút bấm thao tác:**
   * Sử dụng nút biểu tượng bo tròn viền ngoài `rounded outlined size="small"` với màu sắc phân cấp chuẩn:
     * **Xanh lam (`severity="info"` / `primary`):** Xem chi tiết bản ghi.
     * **Vàng cam (`severity="warning"`):** Chỉnh sửa cấu hình bản ghi.
     * **Đỏ (`severity="danger"`):** Xóa bản ghi, Khóa tài khoản, Dừng kích hoạt.
     * **Xanh lá (`severity="success"`):** Phê duyệt, Kích hoạt lại bản ghi.
   * 100% nút bấm phải có chú giải công cụ (Tooltip) lấy từ từ điển đa ngôn ngữ: `t("common.view")`, `t("common.edit")`, `t("common.delete")`.
3. **Thanh công cụ đầu bảng:**
   * Phía trái: Tiêu đề danh mục kèm huy hiệu hiển thị tổng số lượng bản ghi thực tế.
   * Phía phải: Ô tìm kiếm nhanh, Bộ lọc trạng thái, Nút xuất dữ liệu, và Nút thêm mới chính.
4. **Cơ chế phân trang và trạng thái tải dữ liệu:**
   * Hỗ trợ chọn số dòng linh hoạt: `rows={10}`, `rowsPerPageOptions={[10, 20, 50, 100]}`.
   * Chuỗi báo cáo phân trang chuẩn đa ngôn ngữ: `currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} bản ghi"`.
   * Hiển thị hiệu ứng khung xương (Skeleton) khi đang tải dữ liệu và thẻ thông báo không có dữ liệu khi danh sách rỗng.

### 6.2. Quy chuẩn biểu mẫu và hộp thoại:
1. **Hộp thoại tương tác:**
   * Luôn có tiêu đề rõ ràng, biểu tượng phân loại, nút đóng góc phải, chân hộp thoại gồm nút "Hủy" và nút "Lưu thay đổi".
   * Chiếm độ rộng hợp lý theo nội dung (500px cho biểu mẫu đơn giản, 750px - 900px cho cấu hình phức tạp hoặc ma trận).
2. **Kiểm soát tính hợp lệ và phản hồi lỗi:**
   * Thông báo lỗi hiển thị màu đỏ trực tiếp dưới trường nhập liệu ngay khi trường bị mất tiêu điểm hoặc khi bấm Lưu.
   * Các trường bắt buộc phải có dấu sao đỏ `*` cạnh nhãn trường.
3. **Chống bấm liên tiếp và xử lý bất đồng bộ:**
   * Khi gửi dữ liệu lên máy chủ, nút bấm chính bắt buộc phải chuyển sang trạng thái chờ và khóa vô hiệu hóa để ngăn chặn thao tác trùng lặp.
4. **Hộp thoại xác nhận hành động nhạy cảm:**
   * Mọi thao tác xóa, khóa tài khoản, thu hồi phiếu giảm giá, thay đổi trạng thái chính sách bắt buộc phải mở hộp thoại xác nhận nêu rõ tên đối tượng bị ảnh hưởng.

### 6.3. Quy chuẩn thẻ trạng thái trực quan:
* Toàn bộ trạng thái nghiệp vụ phải được trực quan hóa qua thẻ trạng thái với quy ước màu sắc thống nhất:
  * **Xanh lá (`severity="success"`):** `ACTIVE`, `APPROVED`, `SETTLED`, `SUCCESS`, `COMPLETED`.
  * **Vàng cam (`severity="warning"`):** `PENDING`, `IN_REVIEW`, `PROCESSING`, `EXPIRING_SOON`.
  * **Đỏ (`severity="danger"`):** `INACTIVE`, `LOCKED`, `REJECTED`, `FAILED`, `CANCELLED`, `DISPUTED`.
  * **Tím / Xanh đậm (`severity="info"`):** `DRAFT`, `DIAMOND`, `PLATINUM`, `GOLD`.

### 6.4. Quy chuẩn trải nghiệm nhúng di động và cầu nối:
1. **Thiết kế ưu tiên di động:**
   * Tối ưu hóa kích thước vùng chạm (tối thiểu 44x44px), khoảng cách lề an toàn cho vùng tai thỏ và thanh điều hướng đáy.
   * Hỗ trợ cử chỉ vuốt mượt mà, phản hồi rung nhẹ khi quay số trúng thưởng hoặc nhận quà.
2. **Thư viện cầu nối hai chiều `LoyaltyJSBridge`:**
   * Tự động bắt tay và xác thực vé SSO hai chiều khi mở giao diện nhúng.
   * Cung cấp các hàm tương tác bản địa: đóng giao diện, yêu cầu quét mã QR, yêu cầu thanh toán, chia sẻ mạng xã hội.
3. **Hiệu năng đồ họa trò chơi:**
   * Đĩa quay may mắn và hoạt cảnh trò chơi phải được dựng trên Canvas đạt tốc độ 60 khung hình/giây, tuyệt đối không dùng ảnh động dung lượng lớn gây giật lag.

### 6.5. Quy chuẩn thông báo tinh tế và chăm sóc khách hàng:
1. **Thông điệp gợi nhắc âm thầm trong ứng dụng:**
   * Lời nhắc nâng hạng hội viên hoặc cảnh báo điểm sắp hết hạn phải được hiển thị trang nhã dưới dạng thẻ thông tin nhỏ trong giao diện, không tự ý phát chuông gây phiền toái.
2. **Kiểm soát tần suất thông báo đẩy:**
   * Giới hạn tối đa 1 thông báo đẩy mỗi ngày cho mỗi khách hàng.
   * Tuyệt đối không gửi thông báo trong khung giờ nghỉ ngơi (chỉ gửi từ 8h00 sáng đến 20h00 tối theo giờ địa phương).

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
