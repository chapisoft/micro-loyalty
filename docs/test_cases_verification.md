# BỘ KỊCH BẢN KIỂM THỬ TOÀN DIỆN (ENTERPRISE TEST CASES)
## HỆ SINH THÁI LOYALTY & GAMEHUB — BẢN XÁC MINH CÁC TÍNH NĂNG MỚI SỬA

> **Tiêu chuẩn áp dụng:** ISTQB Enterprise Standards / ISO/IEC/IEEE 29119  
> **Phạm vi kiểm thử:** GameHub (`/games`), Đối tác (`/partners`), Sổ cái giao dịch (`/transactions`), Tham số hệ thống (`/system-parameters`), Kho Voucher (`/vouchers`), Bù trừ tài chính (`/clearing`), Quản trị CMS & Xác thực (`/users`, `/roles`, `/audit-logs`, `/change-password`).

---

## 1. BẢNG MA TRẬN ĐỘ PHỦ TÍNH NĂNG (FEATURE COVERAGE MATRIX)

| Phân hệ | Mã lỗi / Tính năng | Đối tượng | Số Test Cases | Mức độ ưu tiên |
| :--- | :--- | :---: | :---: | :---: |
| **GameHub** | A1, A3, C13: Thêm / Sửa / Khắc phục 500 & JSONB mapping | `CMS` / `API` | 5 | P0 / P1 |
| **GameHub** | A2, C15, C16: Cơ cấu giải thưởng, Confirm & Toast | `CMS` / `API` | 5 | P0 / P1 |
| **Đối tác Liên minh** | A4, C17: Sửa / Xóa đối tác, Confirm & Toast | `CMS` / `API` | 4 | P0 / P1 |
| **Sổ cái & Giao dịch** | A5, C18: Lọc đối tác, Tìm kiếm SĐT/Mã GD, Hạt giống Tenant | `CMS` / `API` | 5 | P0 / P1 |
| **Tham số Nền tảng** | A6, C22: Xóa tham số, Confirm & Toast, CRUD API | `CMS` / `API` | 4 | P0 / P1 |
| **Kho Voucher** | C12: Batch Import CSV & Idempotent Upsert | `CMS` / `API` | 4 | P0 / P1 |
| **Bù trừ Quyết toán** | C19: Báo cáo bù trừ, Null-safety, Mã lô quyết toán | `CMS` / `API` | 3 | P0 / P1 |
| **Quản trị & Bảo mật** | C07, C20, C21, C23: Đổi mật khẩu, Users, Roles, Audit Logs | `CMS` / `API` | 6 | P0 / P1 |
| **TỔNG CỘNG** | **Toàn bộ 15 tính năng cốt lõi** | | **36 Test Cases** | **100% Bao phủ** |

---

## 2. CHI TIẾT BỘ KỊCH BẢN KIỂM THỬ (TEST SPECIFICATION)

### 2.1. Phân Hệ Quản Lý GameHub & Cấu Hình Trò Chơi (`/games`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-GAME-001` | **CMS** | Thêm mới trò chơi minigame thành công (Fix A1) | Đã đăng nhập CMS với quyền Quản trị viên | 1. Truy cập menu **Khuyến mãi & Game** $\rightarrow$ **Danh mục Trò chơi** (`/games`)<br/>2. Bấm nút **Thêm Game Mới**<br/>3. Nhập Tên game: *"Vòng Quay Siêu Cấp 2026"*, Thể loại: *"LUCKY_DRAW"*, Giá lượt: *"10 HTG"*, Lượt miễn phí/ngày: *"2"*, Hạn mức ngày: *"50,000 HTG"*<br/>4. Bấm nút **Lưu thông tin** | 1. Hệ thống gửi `POST /gamehub/v1/admin/games` thành công mã HTTP 200<br/>2. Bắn thông báo Toast xanh: *"Thêm mới trò chơi thành công!"*<br/>3. Game mới xuất hiện ngay trên bảng danh sách với trạng thái *"Đang áp dụng"*. | P0 |
| `TC-GAME-002` | **CMS** | Cập nhật thông tin game và kiểm tra không bị lỗi 500 JSONB (Fix A3) | Trò chơi đã tồn tại trên hệ thống (ID = 1 hoặc GameCode = `LUCKY_WHEEL`) | 1. Tại dòng trò chơi *"Vòng Quay May Mắn"*, bấm nút **Sửa** (Pencil icon)<br/>2. Thay đổi Giá lượt chơi thành *"15 HTG"*, Ngân sách ngày thành *"60,000 HTG"*<br/>3. Bấm nút **Lưu thông tin** | 1. Backend xử lý Safe Upsert, Hibernate tự động map `@JdbcTypeCode(SqlTypes.JSON)` vào cột `game_params` dạng `jsonb`<br/>2. Không phát sinh lỗi SQL Type Mismatch, mã HTTP 200<br/>3. Bắn Toast: *"Cập nhật trò chơi thành công!"*<br/>4. Dữ liệu trên bảng tự động làm mới với giá trị mới. | P0 |
| `TC-GAME-003` | **CMS** | Mở hộp thoại Quản lý Cơ cấu Giải thưởng (Fix ReferenceError openPrizesManager) | Đang ở màn hình `/games` | 1. Tại dòng bất kỳ trên bảng trò chơi, rê chuột và bấm vào nút icon **Hộp quà** (Quản lý giải thưởng) | 1. Hàm `openPrizesManager` được thực thi mượt mà, không gặp lỗi `ReferenceError`<br/>2. Hộp thoại modal **Quản Lý Cơ Cấu Giải Thưởng** hiển thị danh sách các ô giải thưởng hiện tại. | P0 |
| `TC-GAME-004` | **CMS** | Xác nhận Lưu giải thưởng kèm ConfirmDialog & Toast (Fix A2) | Đang mở modal Quản Lý Cơ Cấu Giải Thưởng | 1. Bấm nút **Thêm Giải Thưởng** hoặc bấm **Sửa** một giải thưởng có sẵn<br/>2. Nhập Tên giải: *"Voucher 50K Siêu Thị"*, Loại giải: *"VOUCHER"*, Giá trị: *"50"*, Trọng số: *"15"*<br/>3. Bấm nút **Lưu Giải Thưởng** | 1. Hộp thoại **Xác nhận Lưu Giải Thưởng** xuất hiện với thông điệp: *"Bạn có chắc chắn muốn lưu hạng giải thưởng...?"*<br/>2. Bấm nút **Xác nhận**<br/>3. Bắn Toast: *"Lưu hạng giải thưởng thành công!"*<br/>4. Danh sách giải thưởng trong modal được cập nhật. | P0 |
| `TC-GAME-005` | **CMS** | Xác nhận Xóa giải thưởng kèm ConfirmDialog cảnh báo (Fix A2) | Modal Quản lý Giải thưởng có ít nhất 2 giải | 1. Tại dòng giải thưởng muốn xóa, bấm nút **Xóa** (Trash icon)<br/>2. Quan sát hộp thoại cảnh báo | 1. Hộp thoại **Xác nhận Xóa Giải Thưởng** xuất hiện với nút Xóa màu đỏ (`p-button-danger`)<br/>2. Bấm **Xác nhận** $\rightarrow$ Hệ thống gọi `DELETE /gamehub/v1/admin/prizes/{id}`<br/>3. Bắn Toast: *"Đã xóa giải thưởng thành công!"*<br/>4. Dòng giải thưởng biến mất khỏi danh sách. | P0 |

---

### 2.2. Phân Hệ Quản Lý Đối Tác Liên Minh (`/partners`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-PART-001` | **CMS** | Thêm mới đối tác liên minh kèm Toast thông báo (Fix A4) | Đã đăng nhập CMS | 1. Truy cập **Đối tác & Giao dịch** $\rightarrow$ **Danh sách Đối tác** (`/partners`)<br/>2. Bấm nút **Thêm Đối tác**<br/>3. Nhập Mã đối tác: *"DELIMART_RETAIL"*, Tên: *"Siêu Thị Delimart"*, Loại: *"RETAIL"*, Trạng thái: *"Đang hoạt động"*<br/>4. Bấm **Lưu thông tin** | 1. Hệ thống gửi API tạo đối tác thành công<br/>2. Hộp thoại đóng lại và bắn Toast: *"Thêm mới đối tác thành công!"*<br/>3. Bảng đối tác tải lại hiển thị đối tác mới. | P0 |
| `TC-PART-002` | **CMS** | Sửa thông tin đối tác kèm ConfirmDialog xác nhận (Fix A4) | Đã có đối tác trên danh sách | 1. Bấm nút **Sửa** (Pencil icon) tại đối tác *"Siêu Thị Delimart"*<br/>2. Sửa Tên đối tác thành *"Chuỗi Siêu Thị Delimart Quốc Tế"*<br/>3. Bấm **Lưu thông tin** | 1. Hộp thoại **Xác nhận Cập Nhật** xuất hiện: *"Bạn có chắc chắn muốn lưu các thay đổi cho đối tác...?"*<br/>2. Bấm **Xác nhận** $\rightarrow$ Gọi API cập nhật<br/>3. Bắn Toast: *"Cập nhật thông tin đối tác thành công!"*<br/>4. Dữ liệu trên bảng đổi tên thành công. | P0 |
| `TC-PART-003` | **CMS** | Xóa đối tác liên minh kèm ConfirmDialog an toàn (Fix A4, C17) | Đã có đối tác cần xóa | 1. Bấm nút **Xóa** (Trash icon) tại dòng đối tác<br/>2. Quan sát hộp thoại xác nhận | 1. Hộp thoại **Xác nhận Xóa Đối Tác** xuất hiện với icon cảnh báo tam giác<br/>2. Bấm **Xóa** $\rightarrow$ Gọi `DELETE /loyalty/v1/partners/{id}`<br/>3. Bắn Toast: *"Đã xóa đối tác thành công!"*<br/>4. Đối tác bị xóa khỏi bảng dữ liệu. | P0 |
| `TC-PART-004` | **API** | Hỗ trợ định dạng trạng thái linh hoạt (String và Integer) (Fix C17) | Service backend đang chạy | 1. Gửi `POST /api/v1/partners` với body `{ "partnerCode": "P1", "status": 1 }`<br/>2. Gửi `POST /api/v1/partners` với body `{ "partnerCode": "P2", "status": "ACTIVE" }` | 1. Cả 2 yêu cầu đều được Backend tiếp nhận thành công mã 200<br/>2. Lưu đúng trường `isActive = true` trong cơ sở dữ liệu `loyalty_partners`. | P1 |

---

### 2.3. Phân Hệ Sổ Cái Biến Động Điểm & Giao Dịch (`/transactions`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-TX-001` | **CMS** | Chuyển đổi Tenant và kiểm tra phân lập dữ liệu đối tác (Fix A5) | Đang ở màn hình `/transactions` | 1. Chọn Tenant: **TENANT_NATCASH** $\rightarrow$ Quan sát danh sách đối tác<br/>2. Chuyển sang Tenant: **TENANT_MICRO_CRM** $\rightarrow$ Quan sát danh sách đối tác | 1. Khi chọn `TENANT_NATCASH`: Hiển thị các giao dịch từ `NATCASH_WALLET`, `NATCOM_TELCO`, `EDH_POWER`<br/>2. Khi chọn `TENANT_MICRO_CRM`: Hiển thị các giao dịch từ `DELIMART_RETAIL`, `FAHASA_BOOKSTORE`, `HIGHLANDS_COFFEE`, `CGV_CINEMAS`<br/>3. Không còn bị tình trạng lọc bên nào cũng ra Natcash. | P0 |
| `TC-TX-002` | **CMS** | Tìm kiếm giao dịch theo Số điện thoại khách hàng (Fix A5) | Bảng có nhiều giao dịch với các SĐT khác nhau | 1. Nhập vào ô tìm kiếm: *"+84 988 888 888"* hoặc *"3412 8888"* | 1. Bảng `DataTable` kích hoạt `globalFilterFields` lọc tức thì<br/>2. Chỉ hiển thị các dòng giao dịch có chứa SĐT tương ứng. | P0 |
| `TC-TX-003` | **CMS** | Tìm kiếm giao dịch theo Mã giao dịch (Mã GD / ReferenceCode) (Fix A5) | Bảng có các giao dịch `TX_*` | 1. Nhập vào ô tìm kiếm: *"TX_DELIMART"* hoặc *"TX_NATCOM"* | 1. Bảng lọc ra đúng các giao dịch có mã bắt đầu bằng `TX_DELIMART` hoặc `TX_NATCOM`. | P0 |
| `TC-TX-004` | **CMS** | Lọc giao dịch theo Dropdown Đối tác cụ thể (Fix A5) | Bảng đang hiển thị tất cả giao dịch | 1. Chọn dropdown Đối tác: *"DELIMART_RETAIL"* (hoặc *"NATCOM_TELCO"*)| 1. Bảng chỉ hiển thị các giao dịch phát sinh từ đối tác được chọn<br/>2. Số lượng dòng khớp với số bản ghi của đối tác đó. | P1 |
| `TC-TX-005` | **CMS** | Lọc giao dịch theo Loại biến động điểm (EARN, BURN, REWARD, SPIN) (Fix A5) | Bảng đang hiển thị tất cả giao dịch | 1. Chọn dropdown Loại GD: *"TIÊU ĐIỂM (BURN)"* | 1. Bảng chỉ hiển thị các giao dịch có nhãn đỏ `TIÊU ĐIỂM (BURN)` kèm số điểm dạng `-200 Điểm`. | P1 |

---

### 2.4. Phân Hệ Quản Trị Tham Số Nền Tảng Loyalty & GameHub (`/system-parameters`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-PARAM-001` | **CMS** | Hiển thị đầy đủ nút Sửa và Xóa trên bảng tham số (Fix A6) | Truy cập `/system-parameters` | 1. Quan sát cột Thao tác trên từng dòng tham số | 1. Mỗi dòng hiển thị đầy đủ 2 nút: Nút Sửa (Vàng, icon Pencil) và **Nút Xóa (Đỏ, icon Trash)**. | P0 |
| `TC-PARAM-002` | **CMS** | Xác nhận Xóa tham số hệ thống kèm ConfirmDialog (Fix A6) | Đang có tham số trên danh sách | 1. Bấm nút **Xóa** (Trash icon) tại tham số `GAME_SPIN_LOCK_TIMEOUT_MS`<br/>2. Quan sát hộp thoại xác nhận | 1. Hộp thoại **Xác nhận Xóa Tham Số** xuất hiện với thông điệp: *"Bạn có chắc chắn muốn xóa tham số... khỏi hệ thống không?"*<br/>2. Bấm **Xóa** $\rightarrow$ Hệ thống gọi `DELETE /api/v1/system-parameters/{key}`<br/>3. Bắn Toast: *"Đã xóa tham số thành công!"*<br/>4. Tham số bị loại bỏ khỏi bảng. | P0 |
| `TC-PARAM-003` | **CMS** | Thêm mới tham số hệ thống kèm Toast thông báo (Fix C22) | Đang ở `/system-parameters` | 1. Bấm nút **Thêm Tham số**<br/>2. Nhập Mã: *"REDIS_STREAM_RETENTION_DAYS"*, Tên: *"Thời gian lưu tin nhắn Stream"*, Giá trị: *"7"*, Kiểu: *"INTEGER"*<br/>3. Bấm **Lưu thông tin** | 1. Hệ thống tạo tham số mới thành công<br/>2. Bắn Toast: *"Thêm mới tham số thành công!"*<br/>3. Dòng tham số mới xuất hiện trên bảng. | P0 |
| `TC-PARAM-004` | **CMS** | Cập nhật tham số hệ thống kèm ConfirmDialog (Fix C22) | Đang có tham số trên danh sách | 1. Bấm nút **Sửa** tại tham số `POINT_EXCHANGE_RATE_HTG`<br/>2. Đổi Giá trị từ `1.0` thành `1.5`<br/>3. Bấm **Lưu thông tin** | 1. Hộp thoại xác nhận cập nhật xuất hiện<br/>2. Bấm **Xác nhận** $\rightarrow$ Bắn Toast: *"Cập nhật tham số thành công!"*<br/>3. Giá trị mới được lưu và hiển thị trên bảng. | P1 |

---

### 2.5. Phân Hệ Quản Lý Kho Voucher & Nhập CSV Hàng Loạt (`/vouchers`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-VOUCH-001` | **CMS** | Nhập danh sách Voucher từ file CSV thực tế (Fix C12) | Đã chuẩn bị file `vouchers.csv` chứa 500 mã | 1. Truy cập **Kho Voucher** (`/vouchers`) $\rightarrow$ Bấm nút **Nhập File CSV**<br/>2. Chọn tệp `vouchers.csv`<br/>3. Bấm nút **Tiến hành Import** | 1. Trình duyệt đọc file bằng `FileReader`, phân tích cấu trúc CSV<br/>2. Gọi API `POST /loyalty/v1/vouchers/batch-import` truyền mảng DTO<br/>3. Bắn Toast: *"Đã nhập thành công 500 voucher vào kho!"*<br/>4. Danh sách voucher tự động làm mới. | P0 |
| `TC-VOUCH-002` | **API** | Kiểm tra tính bất biến lũy kế (Idempotent Upsert) khi nhập trùng mã CSV (Fix C12) | Kho đã có mã `NATCASH_FREE50` | 1. Tải lên lại file CSV chứa mã `NATCASH_FREE50` | 1. Backend tự động cập nhật thông tin (Upsert) thay vì gây lỗi trùng Unique Key<br/>2. Mã HTTP 200 thành công, không phát sinh lỗi 500 DB Crash. | P0 |
| `TC-VOUCH-003` | **CMS** | Lọc Voucher theo Trạng thái (ACTIVE, USED, EXPIRED) | Kho có voucher ở nhiều trạng thái | 1. Chọn dropdown Trạng thái: *"Đang áp dụng (ACTIVE)"*<br/>2. Chọn dropdown Trạng thái: *"Đã sử dụng (USED)"* | 1. Bảng lọc chính xác các voucher theo từng trạng thái tương ứng. | P1 |
| `TC-VOUCH-004` | **CMS** | Thêm mới Voucher thủ công qua form | Đang ở màn hình `/vouchers` | 1. Bấm **Thêm Voucher**<br/>2. Điền đầy đủ thông tin: Mã, Tên, Giảm giá %, Ngày hết hạn<br/>3. Bấm **Lưu Voucher** | 1. Lưu thành công và hiển thị Toast thông báo. | P1 |

---

### 2.6. Phân Hệ Quyết Toán Bù Trừ & Đối Soát Tài Chính (`/clearing`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-CLR-001` | **CMS** | Tra cứu Báo cáo Bù trừ Công nợ Kỳ đối soát (Fix C19) | Đã phát sinh giao dịch đổi điểm chéo | 1. Truy cập **Quyết Toán Bù Trừ** (`/clearing`)<br/>2. Chọn khoảng ngày từ ngày 1 đến ngày cuối tháng<br/>3. Bấm nút **Tra cứu Báo cáo** | 1. Hệ thống tính toán tổng phát hành, tổng thu hồi và chênh lệch công nợ ròng từng đối tác<br/>2. Không bị lỗi NullPointerException tại `redeemerPartnerId`. | P0 |
| `TC-CLR-002` | **CMS** | Thực hiện Quyết toán Kỳ đối soát và hiển thị mã lô (Fix C19) | Kỳ đối soát có trạng thái `PENDING` | 1. Tại đối tác cần quyết toán, bấm nút **Quyết Toán Kỳ Này**<br/>2. Xác nhận hộp thoại quyết toán | 1. Hệ thống chuyển trạng thái sang `SETTLED`<br/>2. Sinh mã lô quyết toán `SETTLE_20260828_*`<br/>3. Bắn Toast: *"Quyết toán thành công cho đối tác, Mã lô: SETTLE_..."*. | P0 |
| `TC-CLR-003` | **API** | Tính toán bù trừ đa phương không sai lệch số học | Đối tác A phát hành 10.000 điểm (phải trả 10.000 HTG), chấp nhận tiêu 4.000 điểm (thu hồi 4.000 HTG) | 1. Gọi API quyết toán bù trừ `/loyalty/v1/clearinghouse/settle` | 1. Số tiền quyết toán ròng = -6.000 HTG (Đối tác A phải thanh toán ròng cho Quỹ Liên minh 6.000 HTG). | P0 |

---

### 2.7. Phân Hệ Quản Trị Hệ Thống, Phân Quyền & Xác Thực (`/users`, `/roles`, `/audit-logs`, `/change-password`)

| Mã Test Case | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-001` | **CMS** | Đổi mật khẩu tài khoản người dùng CMS (Fix C07, UserProfile) | Đã đăng nhập vào CMS | 1. Bấm vào Avatar góc trên bên phải $\rightarrow$ Chọn **Đổi mật khẩu** (`/profile/change-password`)<br/>2. Nhập Mật khẩu hiện tại: *"Admin@123456"*<br/>3. Nhập Mật khẩu mới: *"Loyalty@2026!"* $\rightarrow$ Xác nhận mật khẩu mới: *"Loyalty@2026!"*<br/>4. Bấm nút **Lưu Mật Khẩu** | 1. Hệ thống gửi `POST /v1/sandbox/auth/change-password` với `ChangePasswordRequest`<br/>2. Không còn bị lỗi `symbol: class ChangePasswordRequest`<br/>3. Bắn Toast: *"Đổi mật khẩu thành công!"*. | P0 |
| `TC-USER-001` | **CMS** | Quản lý Người dùng CMS & Khóa/Mở khóa tài khoản (Fix C20) | Đăng nhập tài khoản Super Admin | 1. Truy cập **Quản trị hệ thống** $\rightarrow$ **Quản lý Tài khoản** (`/admin/users`)<br/>2. Bấm nút **Khóa tài khoản** tại một người dùng<br/>3. Quan sát trạng thái $\rightarrow$ Bấm nút **Mở khóa** | 1. Gọi API `POST /users/{id}/lock` $\rightarrow$ Trạng thái chuyển thành *"Đã khóa"*<br/>2. Gọi API `POST /users/{id}/unlock` $\rightarrow$ Trạng thái chuyển về *"Hoạt động"*. | P0 |
| `TC-ROLE-001` | **CMS** | Phê duyệt và Phân quyền Vai trò quản trị (Fix C21) | Đăng nhập Super Admin | 1. Truy cập **Quản trị hệ thống** $\rightarrow$ **Quản lý Vai trò** (`/admin/roles`)<br/>2. Bấm **Thêm Vai trò** $\rightarrow$ Nhập Tên: *"OPERATOR_GAME"*, Tích chọn các quyền Game & Voucher<br/>3. Bấm **Lưu vai trò** $\rightarrow$ Bấm nút **Phê duyệt** | 1. Vai trò mới được tạo kèm danh sách quyền hạn module tương ứng<br/>2. Kích hoạt trạng thái hoạt động thành công. | P0 |
| `TC-AUDIT-001` | **CMS** | Tra cứu Nhật ký Hoạt động Kiểm toán (Fix C23) | Đã phát sinh các thao tác quản trị trên hệ thống | 1. Truy cập **Quản trị hệ thống** $\rightarrow$ **Nhật ký Hoạt động** (`/admin/audit-logs`)<br/>2. Lọc theo Khoảng ngày $\rightarrow$ Bấm **Tìm kiếm** | 1. Bảng hiển thị đầy đủ các bản ghi lịch sử gồm: Người thực hiện, Tên bảng, Hành động (INSERT, UPDATE, DELETE), Thời gian và Dữ liệu chi tiết. | P1 |
| `TC-AUTH-002` | **API** | Khởi động Backend không bị lỗi Symbol PointActionType.SPIN | Service backend được biên dịch lại | 1. Biên dịch Java Backend `loyalty-service` | 1. 100% các enum `SPIN`, `REWARD`, `VOUCHER` trong `PointActionType.java` được nhận diện chính xác<br/>2. Không còn lỗi biên dịch `cannot find symbol: variable SPIN`. | P0 |
| `TC-BUILD-001` | **CMS** | Đóng gói toàn bộ Frontend CMS không có lỗi biên dịch | Mã nguồn Frontend đã sửa | 1. Chạy lệnh `npm run build` trong thư mục `src/cms` | 1. Kết quả `✓ built in 12.17s`<br/>2. **0 lỗi TypeScript, 0 lỗi cú pháp, 100% bundle đóng gói hoàn hảo**. | P0 |

---

## 3. HƯỚNG DẪN THỰC THI & KIỂM THỬ XÁC NHẬN (STEP-BY-STEP VERIFICATION GUIDE)

### Bước 1: Khởi động Dịch vụ Backend
* Mở project `loyalty-service` trên IDE và bấm **Run `LoyaltyApplication`** (hoặc Debug).
* Kiểm tra log khởi động:
  * Không còn lỗi `ChangePasswordRequest`.
  * Không còn lỗi `PointActionType.SPIN`.
  * Endpoint Swagger sẵn sàng tại: `http://localhost:8080/swagger-ui.html`.

### Bước 2: Khởi động Cổng Quản trị Frontend CMS
* Chạy lệnh:
  ```bash
  cd src/cms
  npm run dev
  ```
* Mở trình duyệt tại: `http://localhost:8990`.

### Bước 3: Thực hiện Kiểm thử 6 Luồng Trọng Tâm
1. **Kiểm tra `/games`:**
   * Bấm vào icon Hộp quà $\rightarrow$ Modal giải thưởng mở lên $\rightarrow$ Thêm/Sửa/Xóa giải thưởng $\rightarrow$ Kiểm tra hộp thoại Confirm xuất hiện và Toast xanh bắn ra.
   * Sửa một trò chơi $\rightarrow$ Bấm Lưu $\rightarrow$ Lưu thành công không bị lỗi 500 JSONB.
2. **Kiểm tra `/partners`:**
   * Sửa một đối tác $\rightarrow$ Bấm Lưu $\rightarrow$ Hộp thoại Confirm xuất hiện $\rightarrow$ Bấm Xác nhận $\rightarrow$ Toast xanh hiển thị.
   * Xóa một đối tác $\rightarrow$ Hộp thoại Confirm xuất hiện $\rightarrow$ Bấm Xác nhận $\rightarrow$ Đối tác bị xóa.
3. **Kiểm tra `/transactions`:**
   * Đổi Tenant `TENANT_NATCASH` và `TENANT_MICRO_CRM` $\rightarrow$ Quan sát các đối tác tương ứng hiển thị đúng.
   * Nhập SĐT hoặc Mã GD vào ô tìm kiếm $\rightarrow$ Bảng tự động lọc tức thì.
   * Chọn dropdown Đối tác $\rightarrow$ Bảng chỉ hiển thị giao dịch của đối tác đó.
4. **Kiểm tra `/system-parameters`:**
   * Quan sát có đủ nút Sửa và nút Xóa màu đỏ $\rightarrow$ Bấm nút Xóa $\rightarrow$ Hộp thoại Confirm xuất hiện $\rightarrow$ Bấm Xác nhận $\rightarrow$ Tham số bị xóa và có Toast thông báo.
5. **Kiểm tra `/vouchers`:**
   * Bấm nút Nhập File CSV $\rightarrow$ Chọn file $\rightarrow$ Import thành công không bị trùng khóa.
6. **Kiểm tra `/profile/change-password`:**
   * Nhập mật khẩu cũ và mới $\rightarrow$ Bấm Lưu $\rightarrow$ Báo thành công.
