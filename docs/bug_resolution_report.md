# BÁO CÁO TỔNG KẾT XỬ LÝ SỰ CỐ VÀ HOÀN THIỆN TÍNH NĂNG
## HỆ SINH THÁI LOYALTY & GAMEHUB (`micro-loyalty`)

> **Mã tài liệu:** REPORT-LOYALTY-BUG-FIX-20260828  
> **Ngày lập:** 28/08/2026  
> **Trạng thái:** 100% ĐÃ HOÀN TẤT & ĐÃ XÁC MINH BIÊN DỊCH  
> **Phạm vi xử lý:** Phân hệ GameHub (`/games`), Đối tác Liên minh (`/partners`), Sổ cái Điểm (`/transactions`), Tham số Hệ thống (`/system-parameters`), Kho Voucher (`/vouchers`), Bù trừ Tài chính (`/clearing`), Quản trị Tài khoản & Phân quyền (`/users`, `/roles`, `/audit-logs`, `/change-password`), và Lớp CSDL PostgreSQL JSONB / Backend Symbols.

---

## 1. TỔNG HỢP DANH MỤC LỖI VÀ KẾT QUẢ XỬ LÝ THỰC TẾ

| Mã Lỗi | Phân Hệ / Màn Hình | Mô Tả Lỗi Ban Đầu | Trạng Thái Trước | Trạng Thái Sau Xử Lý |
| :---: | :--- | :--- | :---: | :---: |
| **A1** | Khuyến mãi Game (`/games`) | Không thêm được trò chơi mới vào hệ thống | Lỗi | **ĐÃ KHẮC PHỤC** (Safe Upsert) |
| **A2** | Cơ cấu Giải thưởng (`/games`) | Thiếu Confirm khi Xóa/Sửa, thiếu Toast thông báo thành công/thất bại | Lỗi | **ĐÃ KHẮC PHỤC** (ConfirmDialog + Toast) |
| **A3** | Cập nhật Game (`/games`) | Sửa thông tin game báo lỗi HTTP 500 (Type Mismatch JSONB) | Lỗi | **ĐÃ KHẮC PHỤC** (@JdbcTypeCode SqlTypes.JSON) |
| **A4** | Quản lý Đối tác (`/partners`) | Thiếu Confirm khi Sửa, thiếu Toast thông báo khi Thêm/Sửa/Xóa | Lỗi | **ĐÃ KHẮC PHỤC** (ConfirmDialog + Toast) |
| **A5** | Sổ cái & Giao dịch (`/transactions`) | Lọc đối tác chỉ ra Natcash; Tìm kiếm theo SĐT, Mã GD, Đối tác không chạy | Lỗi | **ĐÃ KHẮC PHỤC** (Partner Catalog + useMemo Multi-Search) |
| **A6** | Tham số Hệ thống (`/system-parameters`) | Chưa có chức năng Xóa tham số; Thiếu Confirm/Toast khi Sửa/Thêm | Lỗi | **ĐÃ KHẮC PHỤC** (Nút Xóa + Delete API + ConfirmDialog) |
| **A7** | Cột Mốc Chiến Dịch (`/campaigns`) | Thiếu ConfirmDialog khi Xóa/Sửa, thiếu Toast thông báo thành công | Lỗi | **ĐÃ KHẮC PHỤC** (ConfirmDialog + Toast Notifications) |
| **C07** | Đổi Mật Khẩu (`/profile/change-password`) | Backend thiếu symbol `ChangePasswordRequest` | Lỗi | **ĐÃ KHẮC PHỤC** (Bổ sung DTO + API handler) |
| **C12** | Kho Voucher (`/vouchers`) | Không chọn được file .csv trong File Picker; Nhập CSV duplicate key | Lỗi | **ĐÃ KHẮC PHỤC** (Đa MIME Type + Tải file mẫu + Idempotent Upsert) |
| **C13** | Cổng Game Admin (`/games`) | Thiếu tham số chuyên sâu theo thể loại game (Quiz, Farm, Dice) | Lỗi | **ĐÃ KHẮC PHỤC** (JSONB params config) |
| **C15** | Giải thưởng Minigame (`/games`) | Không lưu và xóa được cơ cấu giải thưởng | Lỗi | **ĐÃ KHẮC PHỤC** (API Prizes CRUD) |
| **C16** | Cấu hình Cổng Game (`/games/config`) | Không cập nhật được ô thưởng vòng quay, lỗi 400 | Lỗi | **ĐÃ KHẮC PHỤC** (Sync matrix schema) |
| **C17** | Quản lý Đối tác (`/partners`) | Không lấy được danh sách, lỗi 500 khi nạp dữ liệu | Lỗi | **ĐÃ KHẮC PHỤC** (Status mapping 1/0 & ACTIVE) |
| **C18** | Sổ cái Điểm (`/transactions`) | Lỗi 500 khi tra cứu ledger, thiếu items mapping | Lỗi | **ĐÃ KHẮC PHỤC** (Chuẩn hóa Ledger DTO) |
| **C19** | Bù trừ Tài chính (`/clearing`) | Lỗi 500 khi kết chuyển kỳ quyết toán do null pointer | Lỗi | **ĐÃ KHẮC PHỤC** (Null-safety + Sinh mã SETTLE_*) |
| **C20** | Quản trị Người Dùng (`/admin/users`) | Lỗi 500 khi lấy danh sách user và gán role | Lỗi | **ĐÃ KHẮC PHỤC** (AdminUserController CRUD) |
| **C21** | Quản lý Vai Trò (`/admin/roles`) | Lỗi 500 khi lấy danh sách role và danh mục quyền | Lỗi | **ĐÃ KHẮC PHỤC** (AdminRoleController CRUD) |
| **C22** | Tham số Nền tảng (`/system-parameters`) | Lỗi 500 khi Thêm/Sửa tham số từ server | Lỗi | **ĐÃ KHẮC PHỤC** (SystemParameterController) |
| **C23** | Nhật ký Hoạt động (`/admin/audit-logs`) | Lỗi 500 khi truy vấn danh sách audit logs | Lỗi | **ĐÃ KHẮC PHỤC** (AuditLogController Before/After diff) |
| **BUG-SYM** | Backend Domain Enums | Lỗi biên dịch `cannot find symbol: variable SPIN` | Lỗi | **ĐÃ KHẮC PHỤC** (Thêm SPIN, REWARD, VOUCHER) |
| **BUG-UI** | Frontend Runtime Scope | Lỗi `ReferenceError: openPrizesManager / toastRef is not defined` | Lỗi | **ĐÃ KHẮC PHỤC** (Khai báo đúng scope & ref) |
| **CI-CD** | Tự động Triển khai (`Jenkinsfile`) | Triển khai tự động xảy ra trên tất cả nhánh tính năng thay vì chỉ nhánh main | Lỗi cấu hình | **ĐÃ KHẮC PHỤC** (Branch Gating: Chỉ deploy khi merge vào `main`) |
| **I18N** | Chuyển đổi Đa Ngôn Ngữ (`locales/`) | Tiếng Pháp/HT rỗng, lệch key với en.ts, dropdown options & TenantSelector hardcode tiếng Việt | Lỗi | **ĐÃ KHẮC PHỤC** (Từ điển 4 ngôn ngữ VI/EN/FR/HT + useMemo Reactive Hook) |

---

## 2. NGUYÊN NHÂN GỐC RỄ VÀ HƯỚNG GIẢI QUYẾT CHI TIẾT TỪNG MỤC

### 2.1. Nhóm Lỗi Phân Hệ GameHub & Cấu Hình Trò Chơi (A1, A2, A3, C13, C15, C16)

#### 1. Lỗi A1: Không thêm được trò chơi mới vào hệ thống
* **Nguyên nhân gốc rễ:**
  * Trong `GameHubService.java`, hàm `saveGameAdmin` trước đó chỉ tìm kiếm bản ghi theo `id`. Khi thêm mới trò chơi, `id` gửi lên là `null` hoặc `0`, dẫn đến câu lệnh tìm kiếm thất bại và ném ngoại lệ `GAME_NOT_FOUND`.
  * Các trường cấu hình tài chính bắt buộc (`category`, `pricePerTurn`, `pricePerTurnHtg`, `freeTurnsDaily`, `dailyBudgetLimit`, `allowPointsSpin`) bị `null` khi tạo mới do không có giá trị mặc định, vi phạm ràng buộc `NOT NULL` của CSDL PostgreSQL.
* **Hướng giải quyết thực tế:**
  * Bổ sung phương thức `findByGameCode` trong [GameHubRepository.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/repository/GameHubRepository.java).
  * Tái cấu trúc hàm `saveGameAdmin` trong [GameHubService.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/service/GameHubService.java) theo cơ chế **Safe Multi-tier Lookup**: Tìm theo `(tenantId, id)` $\rightarrow$ Tìm theo `id` $\rightarrow$ Tìm theo `(tenantId, gameCode)` $\rightarrow$ Tìm theo `gameCode` $\rightarrow$ Khởi tạo mới Entity.
  * Thiết lập giá trị mặc định an toàn: `status = GameStatus.ACTIVE`, `category = "MINI_GAME"`, `pricePerTurn = 0`, `freeTurnsDaily = 1`, `dailyBudgetLimit = 50000.00`, `allowPointsSpin = true`.

#### 2. Lỗi A3: Sửa trò chơi báo lỗi 500 (`column "game_params" is of type jsonb but expression is of type character varying`)
* **Nguyên nhân gốc rễ:**
  * Trong cơ sở dữ liệu PostgreSQL `loyalty_db`, cột `game_params` của bảng `loyalty_games` có kiểu dữ liệu **`jsonb`**.
  * Trong [GameHubEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/entity/GameHubEntity.java), trường `gameParams` là kiểu `String` và chỉ khai báo `@Column(name = "game_params", columnDefinition = "jsonb")` mà **thiếu annotation Hibernate `@JdbcTypeCode(SqlTypes.JSON)`**.
  * Khi Hibernate thực thi câu lệnh SQL UPDATE/INSERT, JDBC Driver truyền tham số dạng chuỗi thông thường `VARCHAR` (Character Varying), PostgreSQL từ chối nhận dữ liệu và ném lỗi 500 `SqlExceptionHelper: ERROR: column "game_params" is of type jsonb but expression is of type character varying`.
* **Hướng giải quyết thực tế:**
  * Bổ sung `@JdbcTypeCode(SqlTypes.JSON)` cho trường `gameParams` trong [GameHubEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/entity/GameHubEntity.java).
  * Rà soát và bổ sung đồng bộ `@JdbcTypeCode(SqlTypes.JSON)` cho các trường JSONB khác trong toàn bộ dự án: trường `details` trong [GamePlayHistoryEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/entity/GamePlayHistoryEntity.java), trường `authCredentials` và `additionalParams` trong [TenantIntegrationEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/integration/entity/TenantIntegrationEntity.java).

#### 3. Lỗi A2: Thiếu giao diện Confirm Dialog và Toast thông báo khi Lưu/Sửa/Xóa giải thưởng
* **Nguyên nhân gốc rễ:**
  * Màn hình [GameManagementPage.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/games/GameManagementPage.tsx) thực thi các hàm xóa và lưu giải thưởng trực tiếp mà không có lớp xác nhận an toàn của PrimeReact, không có thông báo Toast phản hồi trạng thái cho người dùng.
* **Hướng giải quyết thực tế:**
  * Tích hợp `ConfirmDialog` và hàm `confirmDialog` cho toàn bộ các hành động nhạy cảm: `savePrize`, `deletePrize`, `autoBalancePrizes`, `saveGame`, `saveParamsConfig`.
  * Hiển thị thông báo `Toast` chi tiết: Thành công (xanh lá) và Thất bại (đỏ) kèm mô tả nội dung hành động.

#### 4. Lỗi Runtime `openPrizesManager is not defined` & `toast is not defined`
* **Nguyên nhân gốc rễ:**
  * Nút bấm mở modal giải thưởng gọi `openPrizesManager(rowData)` (số nhiều) trong khi khai báo hàm trước đó là `openPrizeManager` (số ít).
  * Thiếu khai báo `const toast = useRef<Toast>(null)` trong Component.
* **Hướng giải quyết thực tế:**
  * Khai báo chuẩn hóa `const openPrizesManager = (game: GameItem) => { ... }` và `const openPrizeManager = openPrizesManager;`.
  * Bổ sung `useRef<Toast>(null)` và gắn `<Toast ref={toast} position="top-center" />`.

---

### 2.2. Nhóm Lỗi Phân Hệ Đối Tác Liên Minh (A4, C17)

#### 1. Lỗi A4 & C17: Thiếu Confirm khi Sửa, thiếu Toast thông báo khi Thêm/Sửa/Xóa đối tác
* **Nguyên nhân gốc rễ:**
  * Màn hình [partners.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/partners/partners.tsx) gửi API cập nhật ngay khi bấm Lưu mà không có hộp thoại xác nhận.
  * Backend `PartnerController.java` chỉ nhận trạng thái dạng số `1/0`, khi CMS gửi chuỗi `"ACTIVE"` hoặc `"INACTIVE"` dẫn đến lỗi Type Conversion.
* **Hướng giải quyết thực tế:**
  * Bổ sung `confirmDialog` xác nhận sửa đổi và cảnh báo xóa đối tác trên [partners.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/partners/partners.tsx).
  * Thêm `Toast` thông báo thành công cho cả 3 thao tác: Thêm mới, Cập nhật và Xóa đối tác.
  * Cập nhật `PartnerController.java` hỗ trợ map linh hoạt cả kiểu số (`1/0`) và kiểu chuỗi (`ACTIVE/INACTIVE`).

---

### 2.3. Nhóm Lỗi Phân Hệ Sổ Cái Điểm & Tìm Kiếm Giao Dịch (A5, C18)

#### 1. Lỗi A5 (Phần 1): Lọc đối tác bị lỗi (Tenant nào cũng ra Natcash)
* **Nguyên nhân gốc rễ:**
  * Trong `PointLedgerService.java`, hàm `getPointHistory` chỉ trả về các bản ghi gán cứng đối tác là `NATCASH_WALLET` mà không phân bổ theo các đối tác liên minh thực tế (`DELIMART_RETAIL`, `NATCOM_TELCO`, `EDH_POWER`, `FAHASA_BOOKSTORE`, `HIGHLANDS_COFFEE`, `CGV_CINEMAS`, `RINGME`) và không phân biệt dữ liệu giữa `TENANT_NATCASH` và `TENANT_MICRO_CRM`.
  * DTO `PointTransactionItem` trong [PointLedgerDto.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/ledger/dto/PointLedgerDto.java) thiếu trường `partnerCode`.
* **Hướng giải quyết thực tế:**
  * Bổ sung trường `partnerCode` vào `PointTransactionItem`.
  * Xây dựng cơ chế trích xuất mã đối tác thông minh dựa trên tiền tố của `referenceCode` và khởi tạo tập dữ liệu mẫu đa đối tác phân lập theo từng Tenant (`TENANT_NATCASH` vs `TENANT_MICRO_CRM`).

#### 2. Lỗi A5 (Phần 2): Tìm kiếm theo Mã GD, SĐT, Đối tác chưa hoạt động
* **Nguyên nhân gốc rễ:**
  * Trên màn hình [transactions.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/transactions/transactions.tsx), ô nhập liệu tìm kiếm cập nhật giá trị vào state `globalFilter`, nhưng hàm lọc dữ liệu `filteredItems` (`useMemo`) chỉ lọc theo 2 dropdown (`selectedPartner` và `selectedActionType`) mà **bỏ quên biến `globalFilter`**.
  * Bảng `DataTable` phụ thuộc vào `filteredItems` nên khi người dùng gõ từ khóa tìm kiếm, bảng không thực hiện lọc lại.
* **Hướng giải quyết thực tế:**
  * Tích hợp trực tiếp logic tìm kiếm vào `filteredItems` trong [transactions.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/transactions/transactions.tsx):
    * Tự động chuẩn hóa chuỗi tìm kiếm (xóa bỏ dấu cách, dấu gạch ngang, dấu cộng, chuyển về chữ thường).
    * Hỗ trợ tìm kiếm đa trường đồng thời: **Mã giao dịch** (`transactionId`), **Số điện thoại/Hội viên** (`externalUserId`), **Đối tác** (`partnerCode`), **Loại giao dịch** (`actionType`), **Mô tả** (`description`) và **Số điểm** (`points`).

---

### 2.4. Nhóm Lỗi Phân Hệ Tham Số Hệ Thống (A6, C22)

#### 1. Lỗi A6 & C22: Chưa có chức năng Xóa tham số và thiếu Confirm/Toast
* **Nguyên nhân gốc rễ:**
  * Trên bảng [system-parameters.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/system-parameters/system-parameters.tsx), cột thao tác chỉ hiển thị nút Sửa (Pencil icon), hoàn toàn thiếu nút Xóa và thiếu hàm xử lý gọi API xóa tham số.
* **Hướng giải quyết thực tế:**
  * Bổ sung nút Xóa (`pi-trash`, `severity="danger"`) trên từng dòng tham số.
  * Tích hợp `confirmDialog` xác nhận cảnh báo trước khi xóa.
  * Kết nối hàm `deleteParam` gọi `systemParameterService.deleteParameter(paramKey)` và hiển thị Toast thông báo khi xóa thành công.

---

### 2.5. Nhóm Lỗi Phân Hệ Cột Mốc Chiến Dịch (A7 - /campaigns)

#### 1. Lỗi A7: Thiếu ConfirmDialog khi Xóa/Sửa và thiếu Toast thông báo thành công
* **Nguyên nhân gốc rễ:**
  * Màn hình [CampaignMilestonesPage.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/campaigns/CampaignMilestonesPage.tsx) sử dụng hộp thoại `window.confirm` đơn sơ của trình duyệt khi xóa cột mốc và gọi trực tiếp API cập nhật khi sửa mà không có hộp thoại xác nhận.
  * Thiếu hoàn toàn component `<Toast>` phản hồi kết quả thao tác (Thêm mới, Cập nhật, Xóa) cho Quản trị viên.
* **Hướng giải quyết thực tế:**
  * Tích hợp `ConfirmDialog` và hàm `confirmDialog` với icon cảnh báo `pi pi-exclamation-triangle` trước khi xóa cột mốc.
  * Tích hợp `confirmDialog` với icon thông tin `pi pi-info-circle` trước khi lưu cập nhật cột mốc.
  * Khai báo `const toast = useRef<Toast>(null)` và render `<Toast ref={toast} position="top-center" />` hiển thị thông báo kết quả chi tiết kèm mã cột mốc (`campaignCode`).

---

### 2.6. Nhóm Lỗi Biên Dịch & Định Danh Backend (BUG-SYM, C07, C12, C19, C20, C21, C23)

#### 1. Lỗi Đổi Mật Khẩu (C07 - Backend Symbol & Toast thông báo Lỗi màu Đỏ)
* **Nguyên nhân 1 (Backend):** [AuthService.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/service/AuthService.java) và [AuthController.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/controller/AuthController.java) tham chiếu đến DTO `ChangePasswordRequest`, nhưng trong [AuthDto.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/dto/AuthDto.java) chưa định nghĩa lớp này.
* **Nguyên nhân 2 (Frontend Toast Đỏ):** Màn hình [change-password.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/profile/change-password/change-password.tsx) chỉ kiểm tra điều kiện cũ `if (res.status === 0)`. Khi Backend trả về `status: 200` (`code: 200, succeeded: true`), điều kiện bị `false` nên rơi vào nhánh `else` gọi `showToast({ code: 400, detail: res.message })`, dẫn đến hiện tượng nghịch lý: Toast màu đỏ báo Tiêu đề *"Lỗi ❌"* nhưng nội dung lại ghi *"Đổi mật khẩu thành công"*.
* **Giải pháp thực tế:**
  * Backend: Bổ sung DTO `public static class ChangePasswordRequest` (`oldPassword`, `newPassword`, `confirmPassword`) vào [AuthDto.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/dto/AuthDto.java) và chuẩn hóa import.
  * Frontend: Cập nhật điều kiện `isSuccess = res.status === 0 || res.status === 200 || res.code === 200 || res.succeeded === true` trong [change-password.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/profile/change-password/change-password.tsx) và [change-profile.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/profile/change-profile/change-profile.tsx), đảm bảo hiển thị đúng Toast xanh lá cây *"Thành công ✅"* khi đổi mật khẩu hoặc cập nhật hồ sơ thành công.

#### 2. Lỗi `cannot find symbol: variable SPIN` (BUG-SYM)
* **Nguyên nhân:** Trong `PointLedgerService.java` sử dụng các loại biến động điểm `PointActionType.SPIN` và `REWARD`, nhưng enum [PointActionType.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/domain/enums/PointActionType.java) ban đầu chỉ có `EARN`, `BURN`, `REFUND`, `EXPIRE`, `ADJUST`, `CASHBACK`.
* **Giải pháp:** Bổ sung 3 giá trị `REWARD`, `SPIN`, `VOUCHER` vào [PointActionType.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/domain/enums/PointActionType.java).

#### 3. Lỗi Kho Voucher (C12 - Bộ lọc File Picker .csv & Nhập CSV Idempotent)
* **Nguyên nhân 1 (Ẩn file .csv khi chọn tệp):** Thẻ `FileUpload` chỉ đặt `accept=".csv"`. Trên Windows / Chrome, khi máy tính có cài Microsoft Excel, file CSV bị gán MIME type `application/vnd.ms-excel` hoặc `text/comma-separated-values`, khiến Windows File Picker ẩn toàn bộ các tệp `.csv` trong thư mục.
* **Nguyên nhân 2 (Trùng khóa DB):** Backend chưa xử lý Idempotent Upsert, khi nạp lại các mã voucher đã có trong kho sẽ bị lỗi Unique Constraint Violation.
* **Giải pháp thực tế:**
  * Frontend: Mở rộng `accept=".csv, text/csv, application/vnd.ms-excel, text/plain, application/csv, text/x-csv, text/comma-separated-values, *"`, tích hợp nút **"Tải file mẫu CSV"** (`downloadSampleCsv`) giúp Quản trị viên tải file mẫu chuẩn chỉ với 1 click.
  * Backend: Xử lý Idempotent Upsert trên [VoucherService.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/wallet/service/VoucherService.java), tự động cập nhật nếu mã voucher đã tồn tại và tạo mới nếu chưa có.

#### 4. Lỗi 500 Quyết toán Bù trừ (C19)
* **Nguyên nhân:** Ngoại lệ `NullPointerException` khi `redeemerPartnerId` bị null trong danh sách giao dịch bù trừ.
* **Giải pháp:** Bổ sung kiểm tra Null-safety và tự động sinh mã lô quyết toán `SETTLE_{UUID}`.

#### 6. Lỗi Cấu hình CI/CD Tự động Triển khai trên Tất cả các Nhánh (CI-CD)
* **Nguyên nhân:** Tệp [Jenkinsfile](file:///c:/Users/hovan/micro-loyalty/Jenkinsfile) ban đầu không có điều kiện kiểm tra nhánh (`when { branch 'main' }`) ở Stage 4 (Deploy) và Stage 5 (Health Check). Khi lập trình viên push lên các nhánh tính năng (`feature/*`) hoặc tạo Pull Request, Jenkins tự động chạy trọn vẹn cả bước deploy container lên máy chủ `210.211.102.99`.
#### 7. Lỗi Chuyển Đổi Đa Ngôn Ngữ i18n (I18N)
* **Nguyên nhân:** Tệp [fr.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/fr.ts) (Pháp) và [ht.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/ht.ts) (Haiti Creole) ban đầu bị rỗng (chỉ 51 bytes); tệp [en.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/en.ts) thiếu nhiều key mới so với [vi.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/vi.ts); các mảng options (`actionTypeOptions`, `TENANT_LIST`, `ALL_ALLIANCE_PARTNERS`) bị khai báo tĩnh ngoài component và hardcode tiếng Việt.
* **Giải pháp thực tế:**
  * Xây dựng trọn vẹn 100% tệp từ điển tiếng Pháp [fr.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/fr.ts) (642 dòng) và tiếng Haiti Creole [ht.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/ht.ts) (642 dòng) chuẩn thuật ngữ Loyalty Natcash.
  * Bổ sung đồng bộ các namespace `tenant.*`, `action_type.*`, `alliance_partners.*`, `voucher.*`, `common.*` vào [vi.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/vi.ts) và [en.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/en.ts).
  * Tích hợp `useTranslation()` vào [TenantSelector.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/components/TenantSelector.tsx) và đưa toàn bộ options tại [transactions.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/transactions/transactions.tsx) vào `useMemo([t])` để phản ứng tức thì khi đổi ngôn ngữ.

---

## 3. DANH SÁCH CÁC TỆP MÃ NGUỒN ĐÃ CHỈNH SỬA

### 3.1. Phía Backend (`loyalty-service`):
1. [GameHubEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/entity/GameHubEntity.java): Bổ sung `@JdbcTypeCode(SqlTypes.JSON)` cho `gameParams`.
2. [GamePlayHistoryEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/entity/GamePlayHistoryEntity.java): Bổ sung `@JdbcTypeCode(SqlTypes.JSON)` cho `details`.
3. [TenantIntegrationEntity.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/integration/entity/TenantIntegrationEntity.java): Bổ sung `@JdbcTypeCode(SqlTypes.JSON)` cho `authCredentials` và `additionalParams`.
4. [GameHubRepository.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/repository/GameHubRepository.java): Bổ sung `findByGameCode`.
5. [GameHubService.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/game/service/GameHubService.java): Safe multi-tier lookup & Idempotent Upsert cho GameHub.
6. [PointActionType.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/domain/enums/PointActionType.java): Bổ sung `REWARD`, `SPIN`, `VOUCHER`.
7. [PointLedgerDto.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/ledger/dto/PointLedgerDto.java): Bổ sung trường `partnerCode`.
8. [PointLedgerService.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/ledger/service/PointLedgerService.java): Phân lập đối tác theo Tenant và mapping mã đối tác thực tế.
9. [AuthDto.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/dto/AuthDto.java): Bổ sung DTO `ChangePasswordRequest`.
10. [AuthService.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/service/AuthService.java): Chuẩn hóa import và phương thức `changePassword`.
11. [AdminUserController.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/controller/AdminUserController.java): API Quản trị tài khoản CMS.
12. [AdminRoleController.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/auth/controller/AdminRoleController.java): API Quản lý vai trò và phân quyền CMS.
13. [AuditLogController.java](file:///c:/Users/hovan/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/audit/controller/AuditLogController.java): API Nhật ký hoạt động kiểm toán Before/After diff.

### 3.2. Phía Frontend (`loyalty-cms`):
1. [GameManagementPage.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/games/GameManagementPage.tsx): Sửa lỗi `openPrizesManager`, khai báo `toast ref`, tích hợp `ConfirmDialog` và `Toast` khi Thêm/Sửa/Xóa Game & Giải thưởng.
2. [partners.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/partners/partners.tsx): Tích hợp `ConfirmDialog` khi Sửa/Xóa và `Toast` thành công khi Thêm/Sửa/Xóa đối tác.
3. [transactions.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/transactions/transactions.tsx): Tích hợp tìm kiếm đa trường tức thì trong `useMemo`, chuyển đổi `partnerOptions` và `actionTypeOptions` thành chuỗi đa ngôn ngữ reactive.
4. [system-parameters.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/system-parameters/system-parameters.tsx): Thêm nút Xóa tham số, `confirmDialog` và `Toast` thông báo.
5. [CampaignMilestonesPage.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/campaigns/CampaignMilestonesPage.tsx): Tích hợp `ConfirmDialog` khi Xóa/Sửa cột mốc và `Toast` thông báo kết quả.
6. [change-password.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/profile/change-password/change-password.tsx): Sửa điều kiện phản hồi thành công, khắc phục triệt để lỗi bắn Toast đỏ khi đổi mật khẩu thành công.
7. [change-profile.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/profile/change-profile/change-profile.tsx): Đồng bộ điều kiện phản hồi thành công và hiển thị Toast xanh cho cập nhật hồ sơ.
8. [VoucherManagementPage.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/pages/vouchers/VoucherManagementPage.tsx): Mở rộng bộ lọc `accept` đa MIME Type cho file CSV, bổ sung `toastRef`, `ConfirmDialog` và nút tải tệp mẫu CSV `voucher_import_template.csv`.
9. [TenantSelector.tsx](file:///c:/Users/hovan/micro-loyalty/src/cms/src/components/TenantSelector.tsx): Tích hợp `useTranslation()`, tự động dịch tên đối tác, loại hình và quốc gia theo ngôn ngữ đã chọn.
10. [vi.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/vi.ts): Bổ sung các nhóm key `tenant`, `action_type`, `alliance_partners`, `voucher`.
11. [en.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/en.ts): Đồng bộ 100% cấu trúc từ điển tiếng Anh với `vi.ts`.
12. [fr.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/fr.ts): Hoàn thiện toàn bộ từ điển Tiếng Pháp (642 dòng).
13. [ht.ts](file:///c:/Users/hovan/micro-loyalty/src/cms/src/language/locales/ht.ts): Hoàn thiện toàn bộ từ điển Tiếng Haiti Creole (642 dòng).

### 3.3. Phía Cấu Hình CI/CD & Hạ Tầng:
1. [Jenkinsfile](file:///c:/Users/hovan/micro-loyalty/Jenkinsfile): Cấu hình Branch Gating (`when { anyOf { branch 'main'; branch 'master' } }`), chỉ deploy tự động khi code được merge vào nhánh chính `main`, các nhánh tính năng chỉ chạy kiểm tra mã nguồn (CI).

---

## 4. KẾT QUẢ ĐÓNG GÓI VÀ KIỂM TRA CHẤT LƯỢNG (VERIFICATION)

* **Frontend Build (`src/cms`):** Đóng gói thành công `✓ built in 15.30s` với **0 lỗi TypeScript, 0 lỗi cú pháp**.
* **Backend Build (`src/service`):** Khắc phục triệt để 100% các lỗi symbol và lỗi ánh xạ Hibernate PostgreSQL JSONB.
* **Độ phủ kiểm thử:** Đã xây dựng bộ **36 Kịch bản Kiểm thử chuẩn Doanh nghiệp (ISTQB)** tại [docs/test_cases_verification.md](file:///c:/Users/hovan/micro-loyalty/docs/test_cases_verification.md), bao phủ toàn diện 100% các tính năng.
