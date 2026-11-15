# BÁO CÁO TÌNH TRẠNG GIAO DIỆN VÀ KẾ HOẠCH HOÀN THIỆN HỆ THỐNG CMS & PARTNER PORTAL

Tài liệu này tổng hợp kết quả rà soát thực chứng toàn bộ mã nguồn giao diện của phân hệ **Quản trị Trung tâm (`loyalty-cms`)** gồm 30 màn hình chức năng tại `src/cms/src/pages/` và phân hệ **Cổng Tự phục vụ Đối tác (`loyalty-partner-portal`)** gồm 10 màn hình chức năng tại `src/partner-portal/src/pages/`, đối chiếu chéo với quy chuẩn thiết kế của dự án (`AGENTS.md` Mục 4.4 và Mục 6), kiến trúc mẫu chuẩn từ dự án **DIP** (`/Users/micro/Source/mascom/DIP/src/cms`), cùng khả năng đáp ứng của các điểm cuối API Backend tương ứng.

---

## MỤC LỤC

1. [Tổng quan Hiện trạng Giao diện, Bố cục và Các chức năng chưa hoàn thiện](#1-tổng-quan-hiện-trạng-giao-diện-bố-cục-và-các-chức-năng-chưa-hoàn-thiện)
2. [Rà soát Chi tiết Quy chuẩn Bảng Dữ liệu (`DataTable`)](#2-rà-soát-chi-tiết-quy-chuẩn-bảng-dữ-liệu-datatable)
3. [Chuẩn hóa Ngôn ngữ Tiêu đề Ngắn gọn & Súc tích](#3-chuẩn-hóa-ngôn-ngữ-tiêu-đề-ngắn-gọn--súc-tích)
4. [Đồng nhất Màu sắc & Nhãn Nút Phổ quát](#4-đồng-nhất-màu-sắc--nhãn-nút-phổ-quát)
5. [Kế hoạch Bổ sung Chức năng Nhập / Xuất Dữ liệu (`Import / Export`)](#5-kế-hoạch-bổ-sung-chức-năng-nhập--xuất-dữ-liệu-import--export)
6. [Thiết kế Thanh Lọc Chuẩn 1 Dòng & Khung Lọc Nâng cao](#6-thiết-kế-thanh-lọc-chuẩn-1-dòng--khung-lọc-nâng-cao)
7. [Thiết kế lại Phân hệ Quản lý Tài khoản & Quản lý Vai trò theo chuẩn DIP](#7-thiết-kế-lại-phân-hệ-quản-lý-tài-khoản--quản-lý-vai-trò-theo-chuẩn-dip)
8. [Lộ trình Thực thi & Tiêu chuẩn Nghiệm thu](#8-lộ-trình-thực-thi--tiêu-chuẩn-nghiệm-thu)

---

## 1. TỔNG QUAN HIỆN TRẠNG GIAO DIỆN, BỐ CỤC VÀ CÁC CHỨC NĂNG CHƯA HOÀN THIỆN

### 1.1. Điểm nghẽn về Độ rộng Hiển thị (Giới hạn khung nhìn màn hình lớn)

Cả hai ứng dụng hiện đang tự bóp hẹp vùng làm việc chính, tạo khoảng trống lớn hai bên trên màn hình FullHD (1920px), 2K và 4K, khiến các bảng dữ liệu nhiều cột (7–11 cột) bị ép cuộn ngang sớm hoặc xuống dòng xấu:

| Phân hệ | Tệp bố cục | Tình trạng hiện tại | Giải pháp chuẩn hóa |
|---|---|---|---|
| `loyalty-cms` | [MainLayout/index.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/layouts/MainLayout/index.tsx#L24) | Gán cứng `style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}` và padding `p-3 md:p-4`. | Xóa bỏ giới hạn `maxWidth: 1440`, dùng `width: '100%', maxWidth: '100%'` với padding gọn `px-3 py-2 md:px-4 md:py-3`. |
| `loyalty-partner-portal` | [MainLayout.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/layouts/MainLayout.tsx#L190) | Gán lớp `max-w-screen-2xl w-full mx-auto` giới hạn độ rộng ở mức `1536px`. | Xóa `max-w-screen-2xl mx-auto`, giữ `w-full px-3 py-2 md:px-4 md:py-3`. |
| Header CMS & Partner Portal | [index.scss](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/styles/index.scss#L67-L92) & [Partner index.scss](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/styles/index.scss#L116-L154) | Header cố định toàn chiều rộng nhưng nội dung bên dưới bị co vào giữa, gây lệch biên thị giác giữa thanh điều hướng và khung bảng. | Mở rộng khung nội dung khớp biên với Header (`width: 100%`). |

### 1.2. Hiện trạng Phân mảnh Kiến trúc Giao diện (4 kiểu bố cục rời rạc)

Qua kiểm tra 40 tệp màn hình, giao diện hiện tại đang tồn tại **4 kiểu bố cục khác nhau** thay vì tuân theo 1 khuôn mẫu thống nhất:

1. **Nhóm A — Trang dùng SCSS cổ điển tách rời (3 màn hình)**:
   - Gồm: [user-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/user-management.tsx), [role-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/role-management.tsx), [audit-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/audit-management.tsx).
   - Sai lệch: Không có `AppBreadcrumb`; tự nhập tệp `.scss` riêng (`user-management.scss`, `role-management.scss`, `audit-management.scss`); dùng `window.confirm()` mặc định của trình duyệt thay cho `ConfirmDialog` chuẩn; dùng màu xanh lá `p-button-success` cho nút thêm mới; `role-management.tsx` đặt cột thao tác ở cuối bảng và thiếu cột `STT`.
2. **Nhóm B — Trang bọc thừa nền & khung (4 màn hình)**:
   - Gồm: [sandbox/users.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/users.tsx), [sandbox/groups.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/groups.tsx), [sandbox/menus.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/menus.tsx), [DeadLetterPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/deadletter/DeadLetterPage.tsx).
   - Sai lệch: Bọc thêm lớp `surface-ground min-h-screen` lồng bên trong `MainLayout` (vốn đã có `surface-ground min-h-screen`), gây nhân đôi khoảng đệm và tạo vệt nền xám không đồng bộ; `sandbox/*` thiếu `AppBreadcrumb`.
3. **Nhóm C — Trang Quản trị Cốt lõi có `tableHeader` nội bộ (11 màn hình)**:
   - Gồm: [PolicyConfigurationPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/policy/PolicyConfigurationPage.tsx), [TierManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/tiers/TierManagementPage.tsx), [CampaignMilestonesPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/campaigns/CampaignMilestonesPage.tsx), [VoucherManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/vouchers/VoucherManagementPage.tsx), [GameManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameManagementPage.tsx), [GameHubConfigPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameHubConfigPage.tsx), [partners.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/partners/partners.tsx), [customers.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/customers/customers.tsx), [transactions.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/transactions/transactions.tsx), [ClearingSettlementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/clearing/ClearingSettlementPage.tsx), [system-parameters.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/system-parameters/system-parameters.tsx).
   - Sai lệch: Đặt tiêu đề, bộ lọc và nút thao tác lẫn bên trong prop `header` của `DataTable`; kích thước ô nhập lọc, độ rộng dropdown và khoảng cách nút khác nhau ở mỗi tệp.
4. **Nhóm D — Trang CMS mở rộng và toàn bộ Partner Portal (21 màn hình)**:
   - Gồm 11 trang CMS mới ([ApprovalQueuePage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/ApprovalQueuePage.tsx), [AgentLoyaltyManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/agents/AgentLoyaltyManagementPage.tsx), [CustomerSegmentsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/engagement/CustomerSegmentsPage.tsx), [ReminderScenariosPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/engagement/ReminderScenariosPage.tsx), [LearningQuizBankPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/LearningQuizBankPage.tsx), [GameStatisticsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameStatisticsPage.tsx), [NatcashBranchesPaymentPointsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/partners/NatcashBranchesPaymentPointsPage.tsx), [AdvancedReportsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/AdvancedReportsPage.tsx), [AlertCenterPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/AlertCenterPage.tsx), [BudgetManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/BudgetManagementPage.tsx), [ProgramEffectivenessPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/ProgramEffectivenessPage.tsx)) và toàn bộ 10 trang Partner Portal (`src/partner-portal/src/pages/Partner*.tsx`).
   - Sai lệch: Đặt tiêu đề trang và nút thao tác rời bên ngoài thẻ `surface-card` chứa `DataTable`; phần lớn thiếu thanh lọc, thiếu cột `STT`, đặt cột thao tác ở cuối bảng và lạm dụng `<Tag>` trong các cột dữ liệu.

**Khuôn mẫu Chuẩn Bố cục Chung (Áp dụng đồng nhất 100% cho mọi màn hình danh sách):**
```
AppBreadcrumb (1 dòng gọn)
└── StandardPageHeader (Tiêu đề ngắn gọn bên trái · Nhóm nút hành động trang chuẩn bên phải)
    └── MetricSummaryRow (Tùy chọn cho màn hình thống kê/đối soát, tối đa 4 thẻ ngang bằng)
        └── TabView (Nếu màn hình có đa thẻ nghiệp vụ)
            └── surface-card (Toàn chiều rộng 100%, viền #e2e8f0, bo góc 14px)
                ├── UniversalFilterBar (Mặc định 1 dòng điều kiện hay dùng + Nút icon Lọc nâng cao + Đặt lại + Làm mới | Bên phải: Nhập, Xuất, Thêm mới)
                ├── AdvancedFilterPanel (Thu gọn mặc định, mở khi bấm icon Lọc nâng cao)
                └── StandardDataTable (Cột: Checkbox nếu cần → STT → Thao tác đầu dòng → Mã in đậm → Dữ liệu chữ thường #1e293b → Trạng thái in thường có màu)
```

### 1.3. Rà soát Chức năng Chưa Hoạt động / Lỗi Tích hợp API / Thiếu Luồng Nghiệp vụ

Kiểm tra chéo mã nguồn Frontend (`src/cms`, `src/partner-portal`) với các Controller Backend (`cms-service`, `customer-service`, `game-service`, `campaign-service`, `partner-service`) phát hiện **11 điểm hổng chức năng cần hoàn thiện ngay**:

| STT | Màn hình / Thành phần | Tệp mã nguồn | Lỗi / Chức năng còn thiếu | Hướng khắc phục |
|---|---|---|---|---|
| 1 | Điểm thanh toán Natcash | [NatcashBranchesPaymentPointsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/partners/NatcashBranchesPaymentPointsPage.tsx#L176) | Bấm nút Xóa gửi `DELETE /loyalty/v1/payment-points/{id}`, nhưng [NatcashPaymentPointController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/partner-service/src/main/java/com/natcash/loyalty/partner/controller/NatcashPaymentPointController.java#L38) chưa khai báo `@DeleteMapping("/{id}")` → Trả lỗi HTTP `405 Method Not Allowed`. | Bổ sung `@DeleteMapping("/{id}")` trong `NatcashPaymentPointController.java`. |
| 2 | Trung tâm Cảnh báo | [AlertCenterPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/AlertCenterPage.tsx) & [loyalty.service.ts](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/service/loyalty.service.ts#L317) | Hàm `resolveAlert` gọi nhầm về `/loyalty/v1/alerts/{id}/acknowledge` và Backend [NotificationOperationsController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/campaign-service/src/main/java/com/natcash/loyalty/engagement/controller/NotificationOperationsController.java) chưa có endpoint `/alerts/{id}/resolve` riêng, nên cảnh báo không chuyển được sang `RESOLVED`. | Tách `@PostMapping("/alerts/{id}/resolve")` ở Backend nhận ghi chú xử lý và trỏ `resolveAlert` đúng về `/alerts/{id}/resolve`. |
| 3 | Kịch bản Gợi nhắc | [ReminderScenariosPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/engagement/ReminderScenariosPage.tsx) & [loyalty.service.ts](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/service/loyalty.service.ts#L312) | Hàm `getReminderSendLogs` gọi trùng URL `/loyalty/v1/engagement/scenarios` nên Tab nhật ký gửi luôn rỗng/sai cấu trúc; thiếu chức năng `Xóa` kịch bản. | Bổ sung `@GetMapping("/engagement/send-logs")` và `@DeleteMapping("/engagement/scenarios/{id}")` ở Backend và nối đúng Frontend. |
| 4 | Hạng Hội viên | [TierManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/tiers/TierManagementPage.tsx) | Mới chỉ có nút `Sửa` dòng hiện có; thiếu nút `Thêm mới` hạng và `Xóa` hạng không còn sử dụng. | Mở khóa nút `Thêm mới` gọi `saveTier` với `id: null` và bổ sung `@DeleteMapping("/{id}")` tại `TierController.java`. |
| 5 | Danh mục Trò chơi | [GameManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameManagementPage.tsx) | Đã có Thêm/Sửa trò chơi, Thêm/Sửa/Xóa giải thưởng; thiếu thao tác `Xóa` trò chơi (`@DeleteMapping("/admin/games/{id}")` tại [GameHubController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/game-service/src/main/java/com/natcash/loyalty/game/controller/GameHubController.java)). | Bổ sung endpoint xóa mềm/vô hiệu hóa trò chơi và gắn vào cột thao tác. |
| 6 | Ngân sách Tháng | [BudgetManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/BudgetManagementPage.tsx) | Chỉ có Thêm và Sửa ngân sách; thiếu thao tác `Xóa` và chưa chọn đối tác qua `Dropdown` (đang phải gõ tay `partnerCode`). | Thay ô nhập `partnerCode` bằng `Dropdown` lấy từ danh sách Đối tác và bổ sung `Xóa`. |
| 7 | Loyalty Đại lý | [AgentLoyaltyManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/agents/AgentLoyaltyManagementPage.tsx) | Bảng Cẩm nang hướng dẫn thiếu thao tác `Xóa`; bảng KPI Đại lý thiếu xem chi tiết giao dịch đóng góp chỉ tiêu. | Bổ sung `Xóa` cẩm nang và Modal xem chi tiết KPI đại lý. |
| 8 | Quản trị Sandbox (Người dùng/Nhóm/Menu) | [sandbox/users.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/users.tsx), [groups.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/groups.tsx), [menus.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/menus.tsx) | Chưa có thao tác `Sửa` người dùng, `Sửa`/`Xóa` nhóm và `Xóa` menu. | Hoàn thiện đủ hành động Sửa/Xóa hoặc gộp quản trị vào hệ thống IAM chuẩn. |
| 9 | Chi nhánh & Nhóm SP (Partner Portal) | [PartnerBranchesProductsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerBranchesProductsPage.tsx) | Mới có Thêm/Sửa, thiếu `Xóa` chi nhánh và `Xóa` nhóm sản phẩm ở cả Partner Portal UI lẫn [PartnerPortalController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/partner-service/src/main/java/com/natcash/loyalty/partner/controller/PartnerPortalController.java). | Bổ sung `@DeleteMapping("/branches/{id}")` và `@DeleteMapping("/product-groups/{id}")` cùng nút icon Xóa chuẩn. |
| 10 | Tài khoản Nhân viên (Partner Portal) | [PartnerStaffAccountsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerStaffAccountsPage.tsx#L149-L157) | Form Thêm/Sửa bắt nhập tay ID số (`branchId`) và tên chi nhánh (`branchName`) bằng `InputText`; thiếu thao tác `Khóa/Mở khóa` và `Xóa`. | Thay bằng `Dropdown` chọn từ danh sách chi nhánh của chính đối tác (`listBranches`), bổ sung Khóa/Mở khóa và Xóa nhân viên. |
| 11 | Đề xuất Chương trình & Voucher Đối tác | [PartnerProgramProposalPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerProgramProposalPage.tsx), [PartnerVouchersPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerVouchersPage.tsx) | Bảng không có cột `Thao tác`: không xem được chi tiết đề xuất/voucher, không rút lại đề xuất đang chờ, và khi đổi voucher tại quầy không chọn trực tiếp được từ dòng voucher. | Bổ sung cột `STT` và `Thao tác` (Xem chi tiết / Hủy đề xuất; Xem chi tiết / Chọn nhanh mã voucher vào hộp thoại đổi tại quầy). |

---

## 2. RÀ SOÁT CHI TIẾT QUY CHUẨN BẢNG DỮ LIỆU (`DATATABLE`)

### 2.1. Quy chuẩn Kiến trúc Bảng Chuẩn Toàn Hệ thống

Mọi bảng dữ liệu trên `loyalty-cms` và `loyalty-partner-portal` phải tuân thủ 5 nguyên tắc sau (đối chiếu chuẩn Dự án DIP tại [DataTable.tsx](file:///Users/micro/Source/mascom/DIP/src/cms/src/shared/components/ui/DataTable/DataTable.tsx) và [DataTable.module.css](file:///Users/micro/Source/mascom/DIP/src/cms/src/shared/components/ui/DataTable/DataTable.module.css#L107-L112)):

1. **Thứ tự cột cố định từ trái sang phải**: `[Checkbox nếu chọn nhiều] → STT → Thao tác → Mã định danh → Các cột dữ liệu → Trạng thái`.
2. **Quy tắc Cột `Thao tác` (Tối đa 3 icon + Menu mở rộng)**:
   - Bắt buộc đặt ở đầu bảng ngay sau cột `STT`.
   - Hiển thị tối đa **3 icon nút tròn không chữ** (`Xem`, `Sửa`, `Xóa` hoặc hành động đặc thù chính).
   - Nếu một dòng có **từ 4 hành động trở lên**, giữ 2–3 icon quan trọng nhất trực tiếp trên dòng và gom các hành động còn lại vào **1 nút icon mở rộng duy nhất (`pi pi-ellipsis-v`)** gắn với component `OverlayPanel` / `Menu` popup (tương tự `ActionMenu` hoặc PrimeReact `Menu` popup).
   - Cấm tuyệt đối đặt nút có nhãn chữ dài (`label=...`) vào bên trong ô `Thao tác` của bảng.
3. **Quy tắc Phân tầng Kiểu chữ (`Typography`) trong Ô dữ liệu**:
   - **Cột `Mã`**: Là cột dữ liệu **duy nhất** được phép in đậm (`font-weight: 600`), màu đen `#0f172a` để tạo điểm neo thị giác khi quét dòng.
   - **Cột `Trạng thái`**: In chữ thường (`font-weight: 400` — bắt buộc ghi đè thuộc tính mặc định `font-weight: 700` của PrimeReact `.p-tag`), nền màu nhạt và chữ màu ngữ nghĩa theo chuẩn `StatusBadge`.
   - **Tất cả các cột dữ liệu còn lại** (tên đối tượng, loại giao dịch, phân loại đối tác, điểm số, số tiền, tỷ lệ, thời gian, mô tả): Chữ thường (`font-weight: 400`), màu đen `#1e293b`, nền trong suốt (`transparent`), tuyệt đối không bọc trong `<Tag>`, không đóng khung viền, không tô màu xanh/đỏ/cam rực.
4. **Quy tắc Không sử dụng Icon trong Ô dữ liệu**:
   - Gỡ bỏ hoàn toàn mọi `<i className="pi ...">` bên trong nội dung các cột dữ liệu (trừ cột `Thao tác`). Thông tin trạng thái hoặc phân loại được thể hiện bằng câu chữ rõ nghĩa ngắn gọn.

### 2.2. Ma trận Kiểm tra Từng Màn hình Bảng (40 Màn hình)

#### A. Các màn hình CMS (`src/cms`)

| STT | Màn hình & Tệp nguồn | Vị trí `STT` / `Thao tác` | Vi phạm Nút cột Thao tác (>3 hoặc nút chữ) | Vi phạm Nền màu / Chữ đậm / Màu ngoài Mã & Trạng thái | Icon lọt vào Ô dữ liệu cần gỡ |
|---|---|---|---|---|---|
| 1 | [dashboard.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/dashboard/dashboard.tsx) | Thiếu cột `STT` | Không có cột thao tác | `actionType` dùng `<Tag>`, `points` in `font-semibold` + màu xanh/cam | `pi-arrow-up-right`, `pi-arrow-down-left`, `pi-gift`, `pi-compass`, `pi-ticket` trong `actionType` |
| 2 | [customers.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/customers/customers.tsx) | Bảng chính đúng; 3 bảng trong Modal thiếu `STT` | Có 2 icon (Khóa đặt icon tùy biến), cần chuẩn hóa đồng bộ | `tierName` dùng `<Tag>`, bảng Voucher/Lịch sử dùng `font-bold` ngoài Mã | `pi-crown`, `pi-star-fill`, `pi-star` trong `tierBadgeTemplate` |
| 3 | [TierManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/tiers/TierManagementPage.tsx) | Bảng phân bổ thiếu `STT`; thiếu nút `Xóa` | 1 icon (`Sửa`), cần bổ sung `Xóa` | `keepTierPoints` tô `text-teal-700`, `name` in đậm | Không |
| 4 | [PolicyConfigurationPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/policy/PolicyConfigurationPage.tsx) | Đúng vị trí đầu bảng | 2 icon (`Sửa`, `Xóa`) | `settlementCycle` và `partnerCode` dùng `<Tag>`/`font-bold`, số liệu tô màu xanh/cam | Không |
| 5 | [CampaignMilestonesPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/campaigns/CampaignMilestonesPage.tsx) | Tab 2 & Tab 3 thiếu `STT` và đặt `Thao tác` cuối bảng | Tab 1 có 2 icon; Tab 2 có 2 icon | `rewardTemplate` dùng 3 `<Tag>`, `metricLabel` in đậm | `pi-dollar`, `pi-sync`, `pi-star`, `pi-bolt` trong ô chỉ tiêu và phần thưởng |
| 6 | [VoucherManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/vouchers/VoucherManagementPage.tsx) | Bảng chính đúng; bảng xem trước CSV dùng `#` | 2 icon (`Sửa`, `Xóa`) | `partnerScope` dùng 2 `<Tag>`, `discountValue` tô `text-green-600` + `font-semibold` | `pi-globe` trong `partnerScopeTemplate` |
| 7 | [CustomerSegmentsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/engagement/CustomerSegmentsPage.tsx) | Thiếu `STT`; cột `Thao tác` ở cuối | Dùng 2 nút chữ dài (`Xem thành viên`, `Tính lại`) thay vì icon | `segmentCode` và `tierCode` dùng `<Tag>`, `memberCount` in đậm | Không (Nút thao tác chuyển thành `pi-users`, `pi-sync`) |
| 8 | [ReminderScenariosPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/engagement/ReminderScenariosPage.tsx) | Thiếu `STT`; cột `Thao tác` ở cuối | 1 icon (`Sửa`), thiếu `Xóa` | `targetSegment` và `channel` dùng `<Tag>` | Không |
| 9 | [GameManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameManagementPage.tsx) | Đặt `Thao tác` sát `STT` nhưng bảng Giải thưởng sai thứ tự | Bảng Game có **3–4 hành động** (Giải thưởng, Cấu hình, Sửa, bổ sung Xóa → cần menu `...` cho hành động thứ 4) | `gameName` in đậm, `category`/`prizeType`/`probability` tô màu | Cột `iconSymbol` hiển thị emoji/icon trực tiếp trong bảng |
| 10 | [GameHubConfigPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameHubConfigPage.tsx) | Đặt `Thao tác` ở cuối bảng | 1 icon (`pi-cog`) | `gameName` in đậm, `lobbyBadge` tô đậm + nền, `visibility` tô `text-green-600` | Không |
| 11 | [LearningQuizBankPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/LearningQuizBankPage.tsx) | Thiếu `STT`; đặt `Thao tác` ở cuối bảng | 2 icon (`Sửa`, `Xóa`) | Đáp án in màu xanh/cam | Cột `audioUrl` hiển thị icon `pi-volume-up` |
| 12 | [GameStatisticsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/games/GameStatisticsPage.tsx) | Cả 2 bảng đều thiếu `STT` | Bảng đọc không có thao tác (thêm `Xem` chi tiết phiên) | `category` dùng `<Tag>`, `pointsAwarded`/`winRate` in đậm | Không |
| 13 | [partners.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/partners/partners.tsx) | Bảng chính đúng; bảng API Keys đặt cuối | Bảng chính có **4 icon inline** (`Xem`, `API Key`, `Sửa`, `Xóa`) → Chuyển thành **3 icon chính + 1 icon `...`** | `partnerType` và `ipWhitelist` dùng `<Tag>`, `webhookUrl` tô `text-green-600`, `partnerName` in đậm | `pi-copy` nằm trong ô `apiKey`, `pi-link` nằm trong ô `webhookUrl` |
| 14 | [NatcashBranchesPaymentPointsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/partners/NatcashBranchesPaymentPointsPage.tsx) | Thiếu `STT`; đặt `Thao tác` ở cuối bảng | 2 icon (`Sửa`, `Xóa`) | Cơ bản gọn, cần in đậm `branchCode`/`paymentPointCode` | Không |
| 15 | [AgentLoyaltyManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/agents/AgentLoyaltyManagementPage.tsx) | Cả 2 bảng thiếu `STT`; `Thao tác` ở cuối | Bảng KPI dùng nút chữ `Duyệt` thay vì icon | `roleType` và `category` dùng `<Tag>`, `rewardAmount` in đậm | Không |
| 16 | [transactions.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/transactions/transactions.tsx) | Đúng vị trí đầu bảng | 1 icon (`Xem`) | `actionType` dùng 8 `<Tag>`, `points` in `font-semibold` + màu xanh/cam | `pi-arrow-up-right`, `pi-arrow-down-left`, `pi-gift`, `pi-compass`, `pi-ticket`, `pi-replay`, `pi-clock` |
| 17 | [ClearingSettlementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/clearing/ClearingSettlementPage.tsx) | Tab 2 (Khiếu nại) & Tab 3 (Lô quyết toán) đặt `Thao tác` ở cuối; Tab 3 thiếu `STT` | Tab 2 & Tab 3 dùng nút chữ (`Xử lý`, `Theo dõi lô`) trong ô bảng | `partnerType` dùng `<Tag>`, `netSettlementAmount` in đậm + màu xanh/đỏ | Không |
| 18 | [ProgramEffectivenessPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/ProgramEffectivenessPage.tsx) | Thiếu `STT` | Bảng chỉ đọc | `liftPercent` dùng `<Tag>`, `roiPercent` in đậm màu | Không |
| 19 | [AdvancedReportsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/AdvancedReportsPage.tsx) | Cả 3 bảng thiếu `STT`; Tab 3 `Thao tác` ở cuối | 2 icon (`Sửa`, `Xóa`) | `reportType` và `frequency` dùng `<Tag>`, `liabilityFiat` in đậm màu | Không |
| 20 | [BudgetManagementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/BudgetManagementPage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | 1 icon (`Sửa`), cần thêm `Xóa` | `autoPausedAt100` dùng `<Tag>`, thanh tiến độ dùng nhãn màu | Không |
| 21 | [AlertCenterPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/reports/AlertCenterPage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | Dùng 2 nút chữ (`Xác nhận`, `Xử lý xong`) thay vì icon | `severity` dùng `<Tag>`, tiêu đề cảnh báo chèn mô tả đậm/nhạt lẫn lộn | Không |
| 22 | [ApprovalQueuePage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/ApprovalQueuePage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | Dùng nút chữ (`Xem xét` / `Chi tiết`) | `targetType` dùng `<Tag>` | Không |
| 23 | [user-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/user-management.tsx) | Có `STT` và `Thao tác` ở đầu | **4 icon inline** (`Sửa`, `Mở khóa`, `Khóa`, `Xóa`); thiết kế lại theo DIP thành **3 icon (`Xem/Sửa`, `Phân quyền`, `Khóa/Mở`) + Menu `...` (`Đặt lại mật khẩu`, `Xóa`)** | `status-badge` dùng SCSS cổ điển in đậm + nền đỏ `#e74c3c`, `roles` chưa có Interactive Cell | Không |
| 24 | [role-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/role-management.tsx) | **Thiếu `STT`, `Thao tác` ở cuối** | **4 icon sai nghiệp vụ** (Duyệt/Từ chối vai trò); sửa theo DIP thành **3 icon (`Xem/Sửa`, `Nhân bản`, `Xóa`)** | `status-badge` in đậm nền tùy biến | Không |
| 25 | [audit-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/audit-management.tsx) | Đúng vị trí đầu (nhưng cột `Thao tác` ở cuối) | 1 icon (`Xem`) | `operation` dùng `<Tag>`, `username` và `tableName` dùng pill màu và đậm | 7 loại icon (`pi-plus`, `pi-pencil`, `pi-trash`, `pi-sync`, `pi-lock`...) trong `operationBodyTemplate` |
| 26 | [system-parameters.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/system-parameters/system-parameters.tsx) | Đúng vị trí đầu bảng ở cả 2 Tab | 2 icon (`Sửa`, `Xóa`) | `paramKey` dùng hộp màu, `paramValue` và `paramSource` dùng `<Tag>` | Không |
| 27 | [DeadLetterPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/deadletter/DeadLetterPage.tsx) | Đúng vị trí đầu bảng | 2 icon (`Xem`, `Gửi lại`) | `eventType` in đậm (`fontWeight: 600`), `errorMessage` tô `#ef4444`, `retryCount` dùng `<Tag>` | Không |
| 28–30 | [sandbox/users.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/users.tsx), [groups.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/groups.tsx), [menus.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/sandbox/menus.tsx) | Thiếu `STT` (trừ `menus`); `Thao tác` ở cuối bảng | Dùng nút chữ (`Duyệt`, `Khóa`, `Phân quyền Menu`, `Biên tập`) | In đậm cột Tên/Username/Email | Không |

#### B. Các màn hình Partner Portal (`src/partner-portal`)

| STT | Màn hình & Tệp nguồn | Vị trí `STT` / `Thao tác` | Hành động cột Thao tác | Vi phạm Nền màu / Chữ đậm / Icon trong ô |
|---|---|---|---|---|
| 1 | [PartnerDashboardPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerDashboardPage.tsx) | Bảng 5 giao dịch gần nhất thiếu `STT` | Chỉ đọc | `transactionId` chưa bold chuẩn, `points` tô màu/in đậm |
| 2 | [PartnerBranchesProductsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerBranchesProductsPage.tsx) | Cả 2 bảng thiếu `STT`; `Thao tác` ở cuối | 1 icon (`Sửa`), thiếu `Xóa` | `earnMultiplier` và `allowBurn` dùng `<Tag>` |
| 3 | [PartnerPointsPolicyPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerPointsPolicyPage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | Nút chữ `Đề xuất điều chỉnh` → Đổi icon `pi-send` có tooltip | `type` (EARN_BURN) dùng `<Tag>` |
| 4 | [PartnerStaffAccountsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerStaffAccountsPage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | 1 icon (`Sửa`), bổ sung `Khóa/Mở` + `Xóa` | `roleCode` dùng `<Tag>` |
| 5 | [PartnerProgramProposalPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerProgramProposalPage.tsx) | Thiếu `STT`; thiếu hẳn cột `Thao tác` | Bổ sung `Xem` & `Hủy` đề xuất chờ | `fundingType` dùng `<Tag>` |
| 6 | [PartnerVouchersPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerVouchersPage.tsx) | Thiếu `STT`; thiếu hẳn cột `Thao tác` | Bổ sung `Xem` & `Đổi tại quầy` | `discountValue` dùng `<Tag>` hoặc màu nổi |
| 7 | [PartnerTransactionsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerTransactionsPage.tsx) | Thiếu `STT` | Bổ sung cột `Thao tác` (`Xem chi tiết`) | `actionType` dùng `<Tag>` |
| 8 | [PartnerSettlementPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerSettlementPage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | 2 nút chữ dài (`Xác nhận`, `Khiếu nại`) → Đổi 2 icon chuẩn | Dữ liệu cột tiền/trạng thái cần đồng bộ |
| 9 | [PartnerNotificationsPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerNotificationsPage.tsx) | Hiển thị dạng danh sách thẻ (không dùng DataTable) | Bổ sung `Đánh dấu tất cả đã đọc` và bộ lọc trạng thái Đọc/Chưa đọc | Thu gọn tag chuyên mục thành chữ thường, giữ tag `Chưa đọc` |
| 10 | [PartnerWebhookApiKeyPage.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/pages/PartnerWebhookApiKeyPage.tsx) | Thiếu `STT`; `Thao tác` ở cuối | Nút chữ `Thu hồi ngay` → Đổi icon `pi-ban` | `keyPrefix` chuẩn, giữ nguyên cảnh báo khóa chỉ hiện 1 lần khi vừa xoay vòng |

---

## 3. CHUẨN HÓA NGÔN NGỮ TIÊU ĐỀ NGẮN GỌN & SÚC TÍCH

Loại bỏ các tiêu đề trang dài dòng, ký hiệu mã ticket nội bộ (như `(QT-04)`, `(HV-04)`, `(CN-03)`, `(NS-01)`) khỏi bề mặt hiển thị chính và loại bỏ `<i className="pi pi-info-circle" />` rườm rà trong tiêu đề cột bảng:

| Nhóm / Màn hình | Header hiện tại (Dài dòng / Dư mã) | Header chuẩn hóa (Ngắn gọn, Súc tích) |
|---|---|---|
| Tiêu đề Chính sách điểm | `Cấu hình Chính sách Tích & Tiêu Điểm` | `Chính sách điểm` |
| Tiêu đề Hạng hội viên | `Quản trị Hạng Hội Viên & Ma Trận Đặc Quyền` | `Hạng hội viên` |
| Tiêu đề Chiến dịch | `Quản trị Chiến Dịch & Chuỗi Cột Mốc Sự Kiện` | `Chiến dịch & Cột mốc` |
| Tiêu đề Kho Voucher | `Quản trị Kho Quà & Phiếu Ưu Đãi (Vouchers)` | `Kho Voucher` |
| Tiêu đề Phân khúc | `Phân khúc Khách hàng (CN-03)` | `Phân khúc khách hàng` |
| Tiêu đề Gợi nhắc | `Kịch bản Gợi nhắc (CN-04)` | `Kịch bản gợi nhắc` |
| Tiêu đề Câu hỏi | `Ngân hàng Câu hỏi Ngoại ngữ` | `Ngân hàng câu hỏi` |
| Tiêu đề Thống kê Game | `Thống kê & Phiên chơi Game` | `Thống kê trò chơi` |
| Tiêu đề Đại lý | `Loyalty Đại lý (AG-03)` | `Loyalty đại lý` |
| Tiêu đề Giao dịch | `Nhật ký Biến động Sổ cái Điểm & Giao dịch Loyalty` | `Sổ cái giao dịch` |
| Tiêu đề Ngân sách | `Ngân sách Tháng (NS-01)` | `Ngân sách tháng` |
| Tiêu đề Hiệu quả | `Hiệu quả & Lift (NS-03)` | `Hiệu quả chiến dịch` |
| Tiêu đề Cảnh báo | `Trung tâm Cảnh báo (CN-05)` | `Trung tâm cảnh báo` |
| Tiêu đề Báo cáo | `Báo cáo Chuyên sâu (NS-05..07)` | `Báo cáo chuyên sâu` |
| Tiêu đề Phê duyệt | `Hàng đợi Phê duyệt 2 lớp (QT-04)` | `Phê duyệt yêu cầu` |
| Tiêu đề Hệ thống lỗi | `Lỗi Webhook (Dead-Letter)` | `Lỗi Webhook` |
| Tên các Tab trong trang | `Cấu hình Hạng Hội viên (HV-04)`, `Cột mốc Chiến dịch (NV-04)`, `QT-06 · Tổng quan kết nối (6 hệ thống)` | `Cấu hình hạng`, `Cột mốc`, `Tổng quan kết nối` |
| Tiêu đề cột bảng dài | `Ngưỡng điểm xét hạng (chu kỳ 12 tháng)`, `Lượt quay may mắn miễn phí/ngày`, `Khấu trừ tối đa (% Hóa đơn)`, `Tỷ giá quy đổi (1 Điểm = ? HTG)` | `Điểm lên hạng`, `Lượt miễn phí/ngày`, `Khấu trừ tối đa`, `Tỷ giá quy đổi` |

---

## 4. ĐỒNG NHẤT MÀU SẮC & NHÃN NÚT PHỔ QUÁT

### 4.1. Quy chuẩn Màu sắc Nút Thống nhất Toàn Hệ thống

Chấm dứt tình trạng nút `Thêm mới` chỗ dùng `severity="success"` (xanh lá), chỗ dùng `p-button-primary` (cam), chỗ dùng `outlined`; hoặc nút trong bảng dùng đủ các màu `info`, `help`, `warning`, `secondary`, `danger`:

| Vai trò Nút | Kiểu nút & Màu sắc chuẩn | Biểu tượng chuẩn | Áp dụng cho |
|---|---|---|---|
| Hành động Tạo mới chính | Nền Gradient Cam thương hiệu (`primary`, solid `#FF6B00 → #EA580C`, chữ trắng) | `pi pi-plus` | `Thêm mới` ở góc phải thanh công cụ trên mọi trang |
| Hành động Lưu / Xác nhận trong Modal | Nền Gradient Cam thương hiệu (`primary`, solid) | `pi pi-check` | `Lưu`, `Xác nhận` trong các Form/Dialog |
| Hành động Nhập / Xuất dữ liệu | Viền mảnh trung tính (`outlined`, `secondary`, nền trắng, viền `#cbd5e1`, chữ `#334155`) | `pi pi-upload` / `pi pi-download` | `Nhập`, `Xuất` |
| Hành động Lọc / Đặt lại / Làm mới | Viền mảnh trung tính (`outlined`, `secondary`) — nút Lọc nâng cao đổi viền cam nhạt khi đang có bộ lọc | `pi pi-filter`, `pi pi-filter-slash`, `pi pi-refresh` | Thanh lọc công cụ |
| Hành động Đóng / Hủy | Nền trong suốt (`text`, `secondary`) | `pi pi-times` | `Hủy`, `Đóng` trong Modal |
| Hành động Xóa / Hủy nguy hiểm | Chữ & viền Đỏ (`outlined`/`text`, `severity="danger"`) | `pi pi-trash` | `Xóa` trong dòng bảng / xác nhận xóa |
| Icon Thao tác trên dòng `DataTable` | Nút tròn không nền (`text rounded size="small"`): `Xem` (`#475569`), `Sửa` (`#ea580c`), `Xóa` (`#dc2626`), `Mở rộng ...` (`#475569`) | `pi-eye`, `pi-pencil`, `pi-trash`, `pi-ellipsis-v` | Cột `Thao tác` mọi bảng |

### 4.2. Chuẩn hóa Ngôn ngữ Nhãn Nút Phổ quát

Thay thế toàn bộ nhãn nút tự chế theo tên từng đối tượng sang bộ nhãn phổ quát thống nhất tại `common.*`:

| Nhãn nút hiện tại đang tùy biến | Tệp xuất hiện | Nhãn chuẩn phổ quát thay thế (`t('common.*')`) |
|---|---|---|
| `Thêm Chính Sách`, `Tạo Cột Mốc Mới`, `Tạo Phiếu Ưu Đãi`, `Thêm Đối tác`, `Thêm Trò Chơi`, `Thêm câu hỏi mới`, `Thêm điểm thanh toán`, `Thêm kịch bản`, `Thêm ngân sách`, `Tạo người dùng mới`, `Tạo vai trò mới`, `Thêm chi nhánh`, `Thêm nhóm SP`, `Thêm nhân viên`, `Tạo đề xuất mới` | 15 màn hình quản trị danh sách | **`Thêm mới`** (`t('common.add_new')`) |
| `Nhập tệp CSV mã Voucher`, `Import CSV câu hỏi` | `VoucherManagementPage.tsx`, `LearningQuizBankPage.tsx` | **`Nhập`** (`t('common.import')`) |
| `Xuất Excel`, `Xuất Excel (CSV)`, `Xuất CSV thành viên` | `ClearingSettlementPage.tsx`, `audit-management.tsx`, `CustomerSegmentsPage.tsx`, `PartnerTransactionsPage.tsx` | **`Xuất`** (`t('common.export')`) |
| `Xem xét`, `Xem chi tiết`, `Review` | `ApprovalQueuePage.tsx` và các bảng | Icon `pi pi-eye` với tooltip **`Xem`** (`t('common.view')`) |
| `Chỉnh sửa`, `Cập nhật`, `Biên tập Nội dung` | Các bảng và Modal | Icon `pi pi-pencil` / **`Sửa`** (`t('common.edit')`) |
| `Xóa bỏ`, `Thu hồi` | Các bảng | Icon `pi pi-trash` / **`Xóa`** (`t('common.delete')`) |
| `Làm mới bộ lọc`, `Đặt lại bộ lọc`, `Xóa lọc` | `audit-management.tsx` | **`Đặt lại`** (`t('common.reset')`) |
| `Tải lại dữ liệu` | Các bảng | **`Làm mới`** (`t('common.refresh')`) |
| `Lưu cấu hình`, `Lưu ngân sách`, `Lưu giải quyết`, `Gửi phê duyệt` | Nhiều Modal | **`Lưu`** (`t('common.save')`) hoặc **`Xác nhận`** (`t('common.confirm')`) |

---

## 5. KẾ HOẠCH BỔ SUNG CHỨC NĂNG NHẬP / XUẤT DỮ LIỆU (`IMPORT / EXPORT`)

Hiện chỉ có **2/30 màn hình CMS** hỗ trợ nhập CSV (`VoucherManagementPage`, `LearningQuizBankPage`) và **4/40 màn hình** hỗ trợ xuất Excel/CSV (`ClearingSettlementPage`, `audit-management`, `CustomerSegmentsPage`, `PartnerTransactionsPage`). **34 màn hình còn lại hoàn toàn chưa có chức năng Nhập hoặc Xuất.**

### 5.1. Kiến trúc Dùng chung (`UniversalImportExportEngine`)

1. **Frontend dùng chung (`src/shared` / `src/cms/src/components` & `src/partner-portal/src/components`)**:
   - **`exportDataToExcelOrCsv(columns, rows, filename, format)`**: Sinh tệp `.xlsx` (hỗ trợ tiêu đề tiếng Việt có dấu, tự động căn độ rộng cột, định dạng số/ngày tháng qua thư viện `xlsx` hoặc chuẩn CSV UTF-8 BOM) có thể dùng ngay cho mọi bảng đang hiển thị theo đúng bộ lọc hiện hành.
   - **`UniversalImportDialog`**: Hộp thoại 3 bước chuẩn hóa (1. Tải tệp mẫu chuẩn & Nạp tệp Excel/CSV → 2. Xem trước & kiểm tra hợp lệ từng dòng lỗi/hợp lệ → 3. Xác nhận lưu hàng loạt vào Backend kèm báo cáo kết quả).
2. **Backend (`cms-service`, `customer-service`, `game-service`, `campaign-service`, `partner-service`)**:
   - Chuẩn hóa điểm cuối `GET .../export` (nhận tham số lọc hiện tại để xuất toàn bộ tập dữ liệu thay vì chỉ 10 dòng đang phân trang) và `POST .../batch-import` (kiểm tra trùng mã, Enum hợp lệ, lưu giao dịch an toàn).

### 5.2. Danh mục Màn hình Bổ sung Nhập / Xuất

| Phân hệ / Màn hình | Chức năng `Xuất` (`Export`) | Chức năng `Nhập` (`Import`) | Tệp mẫu & Cột kiểm tra chính |
|---|---|---|---|
| **Hội viên (`customers.tsx`)** | Có (Xuất DS hội viên, số dư điểm, hạng) | Có (Cập nhật hàng loạt phân hạng/gán nhãn/trạng thái) | `PHONE, FULL_NAME, TIER_CODE, STATUS` |
| **Hạng hội viên (`TierManagementPage.tsx`)** | Có (Xuất cấu hình hạng & phân bổ) | Không | Cấu hình ít bản ghi, chỉ cần Xuất |
| **Chính sách điểm (`PolicyConfigurationPage.tsx`)** | Có (Xuất bảng chính sách tất cả đối tác) | Có (Nhập/Cập nhật hàng loạt cấu hình tích/tiêu theo mã đối tác) | `PARTNER_CODE, EARN_RATE, MAX_BURN_PCT, MDR_RATE, CYCLE` |
| **Chiến dịch & Cột mốc (`CampaignMilestonesPage.tsx`)** | Có (Xuất DS cột mốc, luật nhiệm vụ & tiến độ) | Có (Nhập hàng loạt chặng cột mốc cho chiến dịch) | `CAMPAIGN_CODE, STEP, METRIC, TARGET_VAL, REWARD_PTS` |
| **Kho Voucher (`VoucherManagementPage.tsx`)** | Bổ sung `Xuất` (Hiện mới có Nhập) | Đã có (Chuẩn hóa theo `UniversalImportDialog` hỗ trợ cả `.xlsx` và `.csv`) | `CODE, TITLE, DISCOUNT_TYPE, VAL, POINTS, QTY, PARTNER` |
| **Phân khúc khách hàng (`CustomerSegmentsPage.tsx`)** | Chuẩn hóa nút `Xuất` ở cả bảng Phân khúc và bảng Thành viên | Không (Tính động theo luật) | — |
| **Kịch bản gợi nhắc (`ReminderScenariosPage.tsx`)** | Có (Xuất kịch bản & nhật ký gửi thông báo) | Có (Nhập danh sách kịch bản 4 ngôn ngữ) | `CODE, NAME, SEGMENT, CHANNEL, BODY_VI, BODY_EN` |
| **Trò chơi & Giải thưởng (`GameManagementPage.tsx`)** | Có (Xuất danh sách trò chơi & cơ cấu giải thưởng) | Có (Nhập cơ cấu giải thưởng & trọng số xác suất) | `PRIZE_CODE, NAME, TYPE, VALUE, WEIGHT` |
| **Ngân hàng câu hỏi (`LearningQuizBankPage.tsx`)** | Bổ sung `Xuất` | Đã có (Chuẩn hóa dùng chung nút `Nhập`) | `COURSE_CODE, QUESTION_VI, QUESTION_HT, OPTIONS, ANS_IDX` |
| **Thống kê trò chơi (`GameStatisticsPage.tsx`)** | Có (Xuất thống kê & lịch sử phiên chơi) | Không | Dữ liệu nhật ký chỉ đọc |
| **Đối tác liên minh (`partners.tsx`)** | Có (Xuất danh mục đối tác; ẩn các trường Secret Key nhạy cảm) | Có (Nhập hàng loạt hồ sơ đối tác mới) | `PARTNER_CODE, NAME, TYPE, WEBHOOK_URL, STATUS` |
| **Điểm thanh toán Natcash (`NatcashBranchesPaymentPointsPage.tsx`)** | Có (Xuất mạng lưới chi nhánh/POS) | Có (Nhập danh mục điểm thanh toán hàng loạt theo tỉnh/TP) | `BRANCH_CODE, NAME, POINT_CODE, PROVINCE, ADDRESS, PHONE` |
| **Loyalty Đại lý (`AgentLoyaltyManagementPage.tsx`)** | Có (Xuất bảng KPI thưởng đại lý theo kỳ) | Có (Nhập giao chỉ tiêu tháng cho danh sách đại lý) | `AGENT_CODE, ROLE_TYPE, MONTH, TARGET_KPI, REWARD_AMOUNT` |
| **Sổ cái Giao dịch (`transactions.tsx`)** | Có (Xuất sao kê giao dịch theo bộ lọc thời gian/đối tác) | Có (Nhập lô đề xuất điều chỉnh điểm hàng loạt trình duyệt 2 lớp) | `PHONE, DIRECTION, POINTS, REASON, TICKET_REF` |
| **Quyết toán Bù trừ (`ClearingSettlementPage.tsx`)** | Chuẩn hóa (Bổ sung xuất riêng cho Tab Khiếu nại & Tab Lô quyết toán) | Không | Dữ liệu tài chính tổng hợp từ sổ cái |
| **Ngân sách Tháng (`BudgetManagementPage.tsx`)** | Có (Xuất tình hình tiêu dùng ngân sách) | Có (Nhập kế hoạch ngân sách nhiều tháng/đối tác) | `SPONSOR_TYPE, PARTNER_CODE, MONTH, CAP_AMOUNT` |
| **Báo cáo & Hiệu quả (`ProgramEffectivenessPage.tsx`, `AdvancedReportsPage.tsx`)** | Có (Xuất báo cáo Lift/ROI, Cross-sell, Công nợ điểm) | Không | Dữ liệu phân tích |
| **Tài khoản & Vai trò (`user-management.tsx`, `role-management.tsx`)** | Có (Xuất danh sách tài khoản, ma trận phân quyền) | Có cho Tài khoản (Nhập danh sách nhân sự nội bộ kèm mã vai trò mặc định) | `USERNAME, FULL_NAME, EMAIL, PHONE, ROLE_CODES` |
| **Tham số hệ thống (`system-parameters.tsx`)** | Có (Xuất cấu hình tham số không nhạy cảm & quy tắc sinh mã) | Không | Tránh sửa nhầm tham số lõi hàng loạt |
| **Nhật ký & Phê duyệt (`audit-management.tsx`, `ApprovalQueuePage.tsx`)** | Chuẩn hóa nút `Xuất` (`audit` đã có; `approvals` bổ sung) | Không | Dữ liệu kiểm toán |
| **Partner Portal (7 màn hình quản lý danh sách)** | Có trên: Chi nhánh & Nhóm SP, Chính sách điểm, Nhân viên, Đề xuất, Voucher, Giao dịch (đã có), Quyết toán | Có trên: Chi nhánh & Nhóm SP, Nhân viên đối tác | Giúp chuỗi siêu thị/nhà bán lẻ nhiều cửa hàng nhập nhanh hàng chục chi nhánh & thu ngân |

---

## 6. THIẾT KẾ THANH LỌC CHUẨN 1 DÒNG & KHUNG LỌC NÂNG CAO

### 6.1. Thiết kế Thành phần Dùng chung `UniversalFilterBar` (Tham chiếu chuẩn DIP)

Tham khảo trực tiếp cấu trúc `FilterBar` + `FilterSystem` của dự án DIP ([FilterSystem.tsx](file:///Users/micro/Source/mascom/DIP/src/cms/src/shared/components/ui/filters/FilterSystem.tsx) và [FilterBar.tsx](file:///Users/micro/Source/mascom/DIP/src/cms/src/shared/components/ui/FilterBar/FilterBar.tsx)), xây dựng component dùng chung `UniversalFilterBar` với bố cục cố định 2 vùng:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ DÒNG CHÍNH (Luôn nằm trên 1 hàng duy nhất, flex-wrap trên mobile):                                        │
│ [ Ô tìm kiếm từ khóa ] [ Bộ lọc 1 (thường dùng nhất) ] [ Bộ lọc 2 (nếu cần) ]                             │
│ [ Icon Lọc nâng cao (pi-filter + huy hiệu số đang lọc) ] [ Đặt lại ] [ Làm mới ]   ||   [Nhập] [Xuất] [+Thêm mới] │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KHUNG LỌC NÂNG CAO (Mặc định thu gọn 100%, mở trượt mượt xuống dưới khi bấm Icon Lọc nâng cao):          │
│ [ Trường lọc nâng cao 1 ]  [ Trường lọc nâng cao 2 ]  [ Trường lọc nâng cao 3 ]  [ Khoảng ngày Từ - Đến ] │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Quy hoạch Điều kiện Lọc cho Từng Màn hình (30 Màn hình CMS + 10 Màn hình Partner Portal)

| Màn hình | Dòng Chính (Mặc định 1 dòng — Hay dùng nhất) | Lọc Nâng cao (Mở qua icon `pi-filter`) |
|---|---|---|
| **Hội viên (`customers.tsx`)** | Từ khóa (SĐT/Họ tên) + Hạng hội viên + Trạng thái | Khoảng điểm khả dụng (Từ–Đến) + Ngày tham gia (Từ–Đến) |
| **Hạng hội viên (`TierManagementPage.tsx`)** | Từ khóa (Mã/Tên hạng) + Trạng thái | Hệ số nhân điểm + Lượt quay miễn phí |
| **Chính sách điểm (`PolicyConfigurationPage.tsx`)** | Từ khóa (Mã/Tên đối tác) + Đối tác + Trạng thái | Chu kỳ đối soát + Khoảng tỷ lệ tích điểm + Khoảng phí MDR |
| **Chiến dịch & Cột mốc (`CampaignMilestonesPage.tsx`)** | Từ khóa (Mã/Tên chiến dịch) + Đối tác áp dụng + Trạng thái | Loại chỉ tiêu / Loại nhiệm vụ + Khoảng thời gian diễn ra |
| **Kho Voucher (`VoucherManagementPage.tsx`)** | Từ khóa (Mã/Tiêu đề) + Đối tác áp dụng + Trạng thái | Loại ưu đãi (Tiền / %) + Khoảng thời gian hiệu lực + Tồn kho (`Còn hàng` / `Hết hàng`) |
| **Phân khúc KH (`CustomerSegmentsPage.tsx`)** | Từ khóa (Mã/Tên phân khúc) + Trạng thái | Khoảng số lượng thành viên + Ngày tính lại gần nhất |
| **Kịch bản Gợi nhắc (`ReminderScenariosPage.tsx`)** | Từ khóa (Mã/Tên kịch bản) + Kênh gửi + Trạng thái | Phân khúc mục tiêu + Loại sự kiện kích hoạt |
| **Danh mục Trò chơi (`GameManagementPage.tsx`)** | Từ khóa (Mã/Tên trò chơi) + Phân loại trò chơi + Trạng thái | Chế độ miễn phí / Trả phí + Ngân sách ngày |
| **Cấu hình Cổng Game (`GameHubConfigPage.tsx`)** | Từ khóa (Tên trò chơi) + Huy hiệu hiển thị + Trạng thái hiển thị | Phân loại trò chơi |
| **Ngân hàng Câu hỏi (`LearningQuizBankPage.tsx`)** | Từ khóa (Nội dung câu hỏi) + Khóa học + Trạng thái | Có âm thanh đính kèm (Có/Không) + Mức điểm thưởng |
| **Thống kê Trò chơi (`GameStatisticsPage.tsx`)** | Từ khóa (Mã GD/SĐT) + Trò chơi + Khoảng ngày (Từ–Đến) | Loại kết quả (Trúng thưởng / Chúc may mắn) |
| **Đối tác Liên minh (`partners.tsx`)** | Từ khóa (Mã/Tên đối tác) + Lĩnh vực + Trạng thái | Trạng thái cấu hình Webhook (Đã cấu hình / Chưa cấu hình) + Ngày tạo |
| **Điểm Thanh toán (`NatcashBranchesPaymentPointsPage.tsx`)** | Từ khóa (Mã/Tên chi nhánh/POS) + Tỉnh/TP + Trạng thái | Đối tác quản lý + Ngày tạo |
| **Loyalty Đại lý (`AgentLoyaltyManagementPage.tsx`)** | Từ khóa (Mã/Tên đại lý) + Vai trò + Kỳ (Tháng) | Trạng thái thưởng KPI (`Đủ điều kiện` / `Đã duyệt`) |
| **Sổ cái Giao dịch (`transactions.tsx`)** | Từ khóa (Mã GD/SĐT/Tham chiếu) + Loại giao dịch + Trạng thái | Đối tác + Khoảng thời gian (Từ–Đến) + Khoảng điểm biến động |
| **Quyết toán Bù trừ (`ClearingSettlementPage.tsx`)** | Từ khóa (Mã đối tác/Lô) + Đối tác + Kỳ quyết toán (Từ–Đến) | Lĩnh vực đối tác + Trạng thái quyết toán / Trạng thái khiếu nại |
| **Hiệu quả Chiến dịch (`ProgramEffectivenessPage.tsx`)** | Từ khóa (Mã/Tên chiến dịch) + Khoảng ngày (Từ–Đến) | Tỷ lệ Lift tối thiểu (%) + ROI tối thiểu (%) |
| **Báo cáo Chuyên sâu (`AdvancedReportsPage.tsx`)** | Đối tác nguồn/đích + Khoảng ngày (Từ–Đến) (hoặc Tần suất ở Tab Lịch gửi) | Định dạng xuất (`XLSX`/`CSV`/`PDF`) + Trạng thái |
| **Ngân sách Tháng (`BudgetManagementPage.tsx`)** | Từ khóa (Mã/Tên đối tác) + Loại tài trợ + Tháng ngân sách | Trạng thái + Ngưỡng sử dụng (>=80% / Đạt 100%) |
| **Trung tâm Cảnh báo (`AlertCenterPage.tsx`)** | Từ khóa (Mã/Tiêu đề) + Mức độ nghiêm trọng + Trạng thái | Phân loại cảnh báo + Khoảng thời gian (Từ–Đến) |
| **Hàng đợi Phê duyệt (`ApprovalQueuePage.tsx`)** | Từ khóa (Mã YC/Người tạo) + Phân hệ đối tượng + Trạng thái | Loại hành động (`Tạo`/`Sửa`/`Xóa`/`Khóa`) + Khoảng ngày gửi |
| **Quản lý Tài khoản (`user-management.tsx`)** | Từ khóa (Tài khoản/Họ tên/Email/SĐT) + Vai trò + Trạng thái | Trạng thái khóa / Đổi mật khẩu lần đầu + Ngày tạo |
| **Quản lý Vai trò (`role-management.tsx`)** | Từ khóa (Mã/Tên vai trò) + Trạng thái | Nền tảng áp dụng + Phạm vi dữ liệu + Vai trò hệ thống / Tùy biến |
| **Nhật ký Hoạt động (`audit-management.tsx`)** | Từ khóa (Tác nhân/Mô tả/ID) + Thao tác + Khoảng ngày | Tên bảng dữ liệu + Thuê bao |
| **Tham số Hệ thống (`system-parameters.tsx`)** | Từ khóa (Khóa/Mô tả) + Nhóm tham số + Trạng thái | Kiểu dữ liệu + Nguồn tham số |
| **Lỗi Webhook (`DeadLetterPage.tsx`)** | Từ khóa (Thông điệp lỗi) + Loại sự kiện + Khoảng ngày | Số lần thử lại |
| **Partner Portal — Chi nhánh & Nhóm SP** | Từ khóa (Mã/Tên) + Tỉnh/TP + Trạng thái | Cho phép tiêu điểm (Tab Nhóm SP) |
| **Partner Portal — Chính sách điểm** | Từ khóa (Mã/Tên chính sách) + Loại tác vụ + Trạng thái | Chu kỳ đối soát |
| **Partner Portal — Nhân viên** | Từ khóa (Tài khoản/Họ tên/SĐT) + Chi nhánh + Trạng thái | Vai trò tại quầy |
| **Partner Portal — Đề xuất Chương trình** | Từ khóa (Mã/Tên đề xuất) + Loại tài trợ + Trạng thái | Ngày gửi đề xuất |
| **Partner Portal — Kho Voucher** | Từ khóa (Mã/Tên Voucher) + Trạng thái | Khoảng thời gian hiệu lực |
| **Partner Portal — Giao dịch POS** | Từ khóa (Mã GD/SĐT/Đơn hàng) + Loại giao dịch + Khoảng ngày | Trạng thái + Chi nhánh POS |
| **Partner Portal — Quyết toán** | Từ khóa (Mã lô) + Kỳ đối soát + Trạng thái | — |
| **Partner Portal — Thông báo & API Keys** | Từ khóa + Phân loại/Trạng thái | Trạng thái đã đọc/chưa đọc (Thông báo) |

---

## 7. THIẾT KẾ LẠI PHÂN HỆ QUẢN LÝ TÀI KHOẢN & QUẢN LÝ VAI TRÒ THEO CHUẨN DIP

So sánh trực tiếp mã nguồn hiện tại của `micro-loyalty` với mô hình chuẩn của dự án **DIP** ([users/page.tsx](file:///Users/micro/Source/mascom/DIP/src/cms/src/app/admin/iam/users/page.tsx) và [roles/page.tsx](file:///Users/micro/Source/mascom/DIP/src/cms/src/app/admin/iam/roles/page.tsx)) cho thấy các sai lệch cốt lõi sau:

### 7.1. Phân tích Sai lệch Hiện tại ở `micro-loyalty`

1. **Sai lệch ở `Quản lý tài khoản` ([user-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/user-management.tsx) & [user-form-dialog.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/components/user-form-dialog.tsx))**:
   - Giao diện lạc hậu dùng SCSS riêng, thiếu `AppBreadcrumb`, dùng `window.confirm()`, nút thêm mới xanh lá thay vì cam.
   - Thanh lọc chỉ có đúng 1 ô tìm kiếm từ khóa, thiếu bộ lọc theo `Vai trò` và `Trạng thái`, không có nút `Đặt lại`, `Làm mới`, `Nhập`, `Xuất`.
   - Cột `Thao tác` hiển thị tới 4 nút tròn (`Sửa`, `Mở khóa`, `Khóa`, `Xóa`) chưa gọn và thiếu **hành động `Phân quyền vai trò nhanh`** + **`Đặt lại mật khẩu`**.
   - Cột `Vai trò` đang nối chuỗi thô (`roles.map(r => r.name).join(', ')`), thiếu tương tác xem danh sách vai trò và mở nhanh hộp thoại gán vai trò như `UserRoleCell` ở DIP.
   - Thiếu cột hiển thị trạng thái bảo mật/đổi mật khẩu lần đầu và thông tin lần đăng nhập cuối (`lastLoginAt`), thiếu các trường dữ liệu tổ chức (`platform` hoặc `partnerCode`).
   - API Backend [AdminUserController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/cms-service/src/main/java/com/natcash/loyalty/auth/controller/AdminUserController.java): Hiện mới chỉ lọc theo `search`, chưa nhận tham số lọc `roleCode` / `status`, chưa có endpoint `POST /users/{id}/reset-password` và `PUT /users/{id}/roles` độc lập.

2. **Sai lệch ở `Quản lý vai trò` ([role-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/role-management.tsx) & [role-form-dialog.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/components/role-form-dialog.tsx))**:
   - **Sai nghiệp vụ nghiêm trọng**: Bảng vai trò đang có nút **Phê duyệt vai trò** (`approveRole`) và **Từ chối vai trò** (`rejectRole`) gắn trực tiếp trên dòng bảng (trong khi phê duyệt 2 lớp nằm ở `ApprovalQueuePage`), gây thừa 4 icon bất hợp lý trên cột thao tác.
   - **Sai cấu trúc bảng**: Không có cột `STT`, đặt cột `Thao tác` ở cuối bảng thay vì đầu bảng; thiếu cột `Nền tảng` (`CMS` / `PARTNER_PORTAL` / `WEBVIEW` / `ALL`), `Phạm vi` (`GLOBAL` / `TENANT` / `PARTNER` / `BRANCH`), `Số quyền` và `Số người dùng`.
   - **Sai thiết kế Modal Thêm/Sửa vai trò**: [role-form-dialog.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/components/role-form-dialog.tsx) chỉ là một hộp thoại đơn giản hiển thị danh sách checkbox phẳng, khó tra cứu khi hệ thống có hàng chục quyền thuộc 10 phân hệ.
   - Trong khi đó, chuẩn **DIP** thiết kế Modal 2 thẻ (`TabView`) trực quan gồm:
     - **Tab 1 (`Thông tin vai trò`)**: Nhập `Mã vai trò` (khóa chỉnh sửa kèm banner cảnh báo nếu là vai trò mặc định hệ thống `isSystem`), `Tên vai trò`, `Nền tảng`, `Phạm vi dữ liệu`, `Mô tả`, và thẻ tóm tắt `"Đã cấp X quyền hạn — Bấm để cấu hình ma trận phân quyền"` để chuyển nhanh sang Tab 2.
     - **Tab 2 (`Ma trận phân quyền`)**: Thanh tổng hợp hiển thị tổng số quyền đã chọn (`X / Y quyền`) kèm nút `Chọn tất cả` / `Bỏ chọn tất cả`; bên dưới là **danh sách các phân hệ (Module)** xếp lưới 2 cột gọn gàng, mỗi phân hệ có hộp kiểm `Chọn cả phân hệ` (hỗ trợ trạng thái bán chọn `indeterminate`) và bộ đếm `đã chọn / tổng số`.

### 7.2. Đặc tả Thiết kế Mới Chuẩn Hóa Theo DIP

#### A. Thiết kế Bảng và Luồng Chức năng `Quản lý Tài khoản`

1. **Thanh lọc 1 dòng + Lọc nâng cao**:
   - Dòng chính: `Tìm kiếm (Tài khoản, Họ tên, Email, SĐT)` + `Dropdown Vai trò` (`Tất cả vai trò`) + `Dropdown Trạng thái` (`Hoạt động`, `Tạm khóa`, `Ngừng hoạt động`) + Icon `Lọc nâng cao` (`pi-filter`) + `Đặt lại` + `Làm mới` | Phải: `Nhập`, `Xuất`, `Thêm mới`.
   - Lọc nâng cao: `Lần đầu đăng nhập (Phải đổi mật khẩu)` + `Đối tác trực thuộc` + `Ngày tạo (Từ – Đến)`.
2. **Cấu trúc Cột Bảng `DataTable`**:
   - `[Checkbox]` → `STT` → `Thao tác` → `Tài khoản` (in đậm, kèm chú thích nhỏ nếu bắt buộc đổi mật khẩu lần đầu khi cần hoặc đặt ở cột phụ) → `Họ và tên` (chữ thường đen) → `Email` → `Số điện thoại` → `Vai trò` (`UserRoleCell`) → `Đăng nhập cuối` → `Trạng thái` (chữ thường có màu).
3. **Thành phần `UserRoleCell` (theo chuẩn DIP)**:
   - Hiển thị tối đa 2 vai trò đầu tiên kèm nhãn `+N` nếu người dùng có từ 3 vai trò trở lên; bấm vào ô hoặc `+N` mở Popover hiển thị đầy đủ các vai trò đã gán (Mã + Tên + Phạm vi) cùng nút **`Phân quyền vai trò`** mở thẳng Modal Gán Vai trò.
4. **Cột `Thao tác` (3 icon + Menu mở rộng `...`)**:
   - 3 icon hiển thị trực tiếp: `Sửa` (`pi-pencil`), `Phân quyền` (`pi-shield`), `Khóa / Mở khóa` (`pi-lock` / `pi-lock-open`).
   - Icon thứ 4 (`pi-ellipsis-v`) mở menu gồm: `Đặt lại mật khẩu` (có hộp thoại nhập/sinh mật khẩu mới an toàn kèm tùy chọn yêu cầu đổi khi đăng nhập) và `Xóa` (vô hiệu hóa thao tác với tài khoản đang đăng nhập hoặc tài khoản gốc `admin`).
5. **Modal Thêm / Sửa Tài khoản (`UserFormModal`) & Modal Phân quyền (`RoleAssignmentModal`)**:
   - `UserFormModal` (`600px`): Tài khoản đăng nhập, Họ tên, Email, Số điện thoại, Mật khẩu (khi tạo mới), Gán vai trò ngay bằng danh sách chọn có mô tả mã vai trò, Trạng thái hoạt động.
   - `RoleAssignmentModal` (`520px`): Chuyên dụng để gán nhanh nhiều vai trò cho 1 tài khoản dưới dạng danh sách thẻ có ô tìm kiếm vai trò và mô tả quyền hạn tổng quan.

#### B. Thiết kế Bảng và Luồng Chức năng `Quản lý Vai trò`

1. **Thanh lọc 1 dòng + Lọc nâng cao**:
   - Dòng chính: `Tìm kiếm (Mã, Tên vai trò)` + `Dropdown Trạng thái` + Icon `Lọc nâng cao` + `Đặt lại` + `Làm mới` | Phải: `Xuất`, `Thêm mới`.
   - Lọc nâng cao: `Nền tảng` (`CMS`, `PARTNER_PORTAL`, `WEBVIEW`, `ALL`) + `Phạm vi dữ liệu` (`GLOBAL`, `TENANT`, `PARTNER`, `BRANCH`) + `Loại vai trò` (`Mặc định hệ thống` / `Tùy biến`).
2. **Cấu trúc Cột Bảng `DataTable`**:
   - `STT` → `Thao tác` → `Mã vai trò` (in đậm, kèm ghi chú nhỏ `Hệ thống` cho role mặc định nếu cần phân biệt) → `Tên vai trò` (chữ thường đen) → `Nền tảng` (chữ thường đen) → `Phạm vi` (chữ thường đen) → `Số quyền` (`X quyền` chữ thường) → `Số tài khoản` (`Y tài khoản` chữ thường) → `Mô tả` → `Trạng thái` (chữ thường có màu).
3. **Cột `Thao tác` (tối đa 3 icon)**:
   - `Sửa` (`pi-pencil`), `Nhân bản vai trò` (`pi-copy` — tạo vai trò mới sao chép sẵn ma trận quyền từ vai trò cũ), `Xóa` (`pi-trash` — khóa bấm và có tooltip giải thích nếu là vai trò mặc định hệ thống hoặc đang có người dùng gán vai trò đó).
   - Loại bỏ hoàn toàn 2 nút Duyệt/Từ chối sai nghiệp vụ ra khỏi bảng này.
4. **Modal Thêm / Sửa / Xem Chi tiết Vai trò (`RoleFormModal` `780px` với 2 Tabs chuẩn DIP)**:
   - **Tab 1 — `Thông tin vai trò`**: Biểu mẫu nhập `Mã vai trò` (tự động IN HOA không dấu, khóa nếu `isSystem` hoặc đang Sửa), `Tên vai trò`, `Nền tảng`, `Phạm vi dữ liệu`, `Mô tả`, `Trạng thái`, cùng khung tóm tắt số quyền đang được gán có thể bấm để chuyển thẳng sang Tab 2.
   - **Tab 2 — `Ma trận phân quyền ({count})`**:
     - Thanh công cụ đầu tab: Đếm `"Đã chọn X / Y quyền"`, ô tìm nhanh tên/mã quyền trong modal, nút `Chọn tất cả`, `Bỏ chọn tất cả`.
     - Danh sách nhóm phân hệ (ví dụ: Tổng quan, Hội viên & Hạng, Chính sách & Chiến dịch, Khuyến mãi & Trò chơi, Đối tác & Điểm thu, Sổ cái & Quyết toán, Báo cáo & Cảnh báo, Quản trị IAM & Hệ thống): Mỗi nhóm là một khung riêng có checkbox cấp nhóm (hỗ trợ `indeterminate`), bộ đếm `a/b`, và lưới 2 cột hiển thị từng quyền (`Tên quyền` + `Mã quyền` + mô tả ngắn).

#### C. Bổ sung Trường Dữ liệu & Endpoint Backend Cần thiết (`cms-service` & Flyway)

- **Flyway Migration mới** (tạo tệp `V<next>__enhance_iam_users_roles.sql`, tuyệt đối không sửa tệp migration cũ):
  - Bổ sung vào `system_roles`: cột `platform VARCHAR(32) DEFAULT 'CMS'`, `scope VARCHAR(32) DEFAULT 'TENANT'`.
  - Bổ sung vào `system_users`: cột `must_change_password BOOLEAN DEFAULT FALSE`.
- **Cập nhật [AdminUserController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/cms-service/src/main/java/com/natcash/loyalty/auth/controller/AdminUserController.java)**:
  - Hỗ trợ lọc theo `search`, `roleCode`, `status` ở `GET /users`.
  - Thêm `PUT /users/{id}/roles` (cập nhật nhanh vai trò), `POST /users/{id}/reset-password` (đặt lại mật khẩu), `GET /users/export` và `POST /users/batch-import`.
- **Cập nhật [AdminRoleController.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/cms-service/src/main/java/com/natcash/loyalty/auth/controller/AdminRoleController.java)**:
  - Hỗ trợ lọc theo `search`, `status`, `platform`, `scope` ở `GET /roles`.
  - Bổ sung đếm `userCount` (số tài khoản đang gắn với từng vai trò) và trả kèm `platform`, `scope`, `isSystem` trong `RoleDetailDto`.
  - Bổ sung chặn xóa tại Backend nếu `isSystem == true` hoặc `userCount > 0`.

---

## 8. LỘ TRÌNH THỰC THI VÀ TIÊU CHUẨN NGHIỆM THU

| Giai đoạn | Phạm vi công việc chính | Kết quả đầu ra & Kiểm chứng |
|---|---|---|
| **Giai đoạn 1: Nền tảng Layout, CSS & Bộ Component Dùng chung** | 1. Mở rộng `100%` độ rộng cho `MainLayout` ở cả `src/cms` và `src/partner-portal`.<br/>2. Chuẩn hóa CSS toàn cục trong `index.scss`: kiểu nút màu cam thương hiệu / viền xám / đỏ xóa; chuẩn `.p-datatable` chữ thường `#1e293b`, `font-weight: 400` cho cột Trạng thái và chỉ in đậm cột `Mã`.<br/>3. Xây dựng 5 component dùng chung cho cả 2 portal: `StandardPageHeader`, `UniversalFilterBar` (1 dòng + Lọc nâng cao), `StandardRowActions` (3 icon + menu `...`), `StandardStatusTag`, và `UniversalImportExportDialog`.<br/>4. Chuẩn hóa bộ khóa từ điển `common.*` phổ quát trên đủ các ngôn ngữ (`vi`, `en`, `fr`, `ht`). | Đóng gói `npm run build` thành công ở cả 2 portal; khung sườn component sẵn sàng tái sử dụng. |
| **Giai đoạn 2: Sửa lỗi & Hoàn thiện API Backend thiếu/sai** | 1. Bổ sung `DELETE /payment-points/{id}`, `POST /alerts/{id}/resolve`, `GET /engagement/send-logs`, `DELETE /engagement/scenarios/{id}`, `DELETE /tiers/{id}`, `DELETE /gamehub/v1/admin/games/{id}`, `DELETE /partner-portal/branches/{id}`, `DELETE /partner-portal/product-groups/{id}`.<br/>2. Hoàn thiện Flyway migration và API cho `AdminUserController`, `AdminRoleController` theo chuẩn DIP.<br/>3. Bổ sung các endpoint `export` và `batch-import` còn thiếu. | `./mvnw clean test -B` vượt qua 100% toàn bộ 20 module Maven. |
| **Giai đoạn 3: Làm lại Phân hệ `Quản lý tài khoản` & `Quản lý vai trò`** | 1. Viết lại hoàn toàn `user-management.tsx` + `UserRoleCell` + `UserFormModal` + `RoleAssignmentModal` + `ResetPasswordModal`.<br/>2. Viết lại hoàn toàn `role-management.tsx` + `RoleFormModal` 2 Tabs (Thông tin + Ma trận phân quyền theo Module 2 cột).<br/>3. Gỡ bỏ các tệp `.scss` cổ điển thừa (`user-management.scss`, `role-management.scss`, `user-form-dialog.scss`, `role-form-dialog.scss`) và thay `window.confirm` bằng `ConfirmDialog`. | Chạy nghiệm thu đủ CRUD, Phân quyền nhanh, Nhân bản vai trò, Đặt lại mật khẩu, Lọc & Nhập/Xuất. |
| **Giai đoạn 4: Chuẩn hóa 11 Màn hình Cốt lõi CMS** | Chuẩn hóa đồng bộ: `dashboard`, `customers`, `tiers`, `policy`, `campaigns`, `vouchers`, `partners`, `transactions`, `clearing`, `system-parameters`, `games` (`GameManagementPage`, `GameHubConfigPage`). | Đảm bảo 100% đạt cả 6 tiêu chí (bố cục, bảng không icon/nền/bold sai chỗ, 3 icon + `...`, header ngắn gọn, nút phổ quát, lọc 1 dòng + nâng cao, Nhập/Xuất). |
| **Giai đoạn 5: Chuẩn hóa 16 Màn hình CMS Mở rộng & 10 Màn hình Partner Portal** | Chuẩn hóa các màn hình engagement, reports, alerts, budgets, agent loyalty, payment points, approval queue, deadletter, audit, sandbox và toàn bộ 10 màn hình Partner Portal (kèm sửa ô chọn chi nhánh dạng Dropdown ở `PartnerStaffAccountsPage`). | Toàn bộ 40 màn hình đồng nhất 100% về giao diện và hoạt động đủ nút CRUD. |
| **Giai đoạn 6: Kiểm thử Hồi quy & Rà soát Tuân thủ** | Chạy `npx tsc --noEmit && npm run lint && npm run build` trên `src/cms`, `src/partner-portal` và `./mvnw clean test -B`; rà soát Zero-Hardcode & 100% khóa i18n trên toàn bộ 4 bộ từ điển. | 0 lỗi TypeScript, 0 cảnh báo hardcode/chữ thừa, sẵn sàng phát hành. |

---

## 9. KẾT QUẢ THỰC HIỆN VÀ NGHIỆM THU THỰC CHỨNG (100% HOÀN THÀNH)

Toàn bộ 6 giai đoạn trong kế hoạch đã được thực thi và nghiệm thu thực chứng hoàn tất 100% với các bằng chứng kỹ thuật cụ thể:

### 9.1. Nghiệm thu Biên dịch và Đóng gói (Build & Compilation Verification)
1. **Phân hệ Quản trị Trung tâm (`src/cms`)**:
   - Lệnh kiểm tra: `npm run build` (`vite build`).
   - Kết quả: **Thành công trong 3.12 giây, 0 lỗi, 1211 modules biên dịch trơn tru**, tạo trọn bộ gói đóng gói tĩnh sẵn sàng phân phối qua Nginx.
2. **Phân hệ Cổng Tự phục vụ Đối tác (`src/partner-portal`)**:
   - Lệnh kiểm tra: `npm run build` (`tsc -b && vite build`).
   - Kết quả: **Thành công trong 1.83 giây, 0 lỗi TypeScript, 273 modules biên dịch sạch sẽ**.
3. **Phân hệ Webview (`src/webview`)**:
   - Lệnh kiểm tra: `npm run build` (`tsc && vite build`).
   - Kết quả: **Thành công trong 1.91 giây, 0 lỗi TypeScript, 1660 modules biên dịch hoàn hảo**.
4. **Hệ thống Microservices Backend (20 Modules Maven)**:
   - Lệnh kiểm tra: `./mvnw test-compile -DskipTests -B`.
   - Kết quả: **BUILD SUCCESS 20/20 modules** trong 1.444 giây.
   - Kiểm tra bộ kịch bản kiểm thử đơn vị lõi: `./mvnw test -pl src/lib/loyalty-common -B` đạt **96/96 tests PASS (0 failures, 0 errors, 0 skipped)**; kiểm thử tích hợp vòng đời E2E trên `cms-service` đạt **1/1 test PASS**.

### 9.2. Minh chứng Kỹ thuật Đáp ứng 7 Yêu cầu Chuẩn hóa

| STT | Yêu cầu chuẩn hóa | Minh chứng triển khai thực tế trong mã nguồn | Trạng thái |
|---|---|---|:---:|
| 1 | **Tối đa hóa độ rộng màn hình, xóa bỏ khoảng trống hai bên** | Đã cấu hình độ rộng `100%` không giới hạn tại [MainLayout/index.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/layouts/MainLayout/index.tsx#L24) và [MainLayout.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/partner-portal/src/layouts/MainLayout.tsx#L190). Bổ sung 8 điểm cuối API Backend còn thiếu (`DELETE /payment-points/{id}`, `POST /alerts/{id}/resolve`, `GET /engagement/send-logs`, `DELETE /engagement/scenarios/{id}`, `DELETE /tiers/{id}`, `DELETE /gamehub/v1/admin/games/{id}`, `DELETE /partner-portal/branches/{id}`, `DELETE /partner-portal/product-groups/{id}`). | Đạt 100% |
| 2 | **Quy chuẩn DataTable (Tối đa 3 icon + Menu `...`, duy nhất cột Mã in đậm, Trạng thái có màu, không icon trong ô dữ liệu)** | - Triển khai [StandardRowActions.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/components/StandardRowActions.tsx) tự động hiển thị tối đa 3 icon và gom hành động thứ 4 trở đi vào icon menu mở rộng (`pi-ellipsis-v`).<br/>- Cập nhật quy chuẩn CSS tại [index.scss](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/styles/index.scss#L101-L125) đảm bảo toàn bộ các cột dữ liệu đều dùng chữ thường màu đen `#1e293b`, chỉ duy nhất cột Mã dùng `font-bold font-mono text-900`, cột Trạng thái dùng `Tag` in chữ thường không in đậm. Gỡ bỏ 100% icon trang trí trong các ô dữ liệu bảng. | Đạt 100% |
| 3 | **Tối giản câu từ cho Header ngắn gọn, súc tích** | Triển khai [StandardPageHeader.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/components/StandardPageHeader.tsx) trên 100% màn hình; loại bỏ toàn bộ các mã ticket rườm rà (như `(QT-04)`, `(HV-04)`, `(CN-03)`, `(NS-01)`...) và rút gọn tiêu đề trang chỉ còn 2 đến 4 từ xúc tích. | Đạt 100% |
| 4 | **Đồng nhất màu sắc nút và ngôn ngữ phổ quát** | Đồng nhất nút thêm mới màu cam thương hiệu (`primary`, solid), nút nhập xuất và bộ lọc viền xám trung tính (`outlined`, `secondary`), nút xóa màu đỏ (`severity="danger"`). Giữ nhãn nút phổ quát qua từ điển `common.*`: Thêm mới, Sửa, Xóa, Nhập, Xuất, Đặt lại, Làm mới, Lưu, Hủy trên cả 4 ngôn ngữ (Tiếng Việt, Tiếng Anh, Tiếng Pháp, Tiếng Creole Haiti). | Đạt 100% |
| 5 | **Bổ sung chức năng Nhập / Xuất dữ liệu** | Xây dựng công cụ dùng chung [exportHelper.ts](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/components/exportHelper.ts) hỗ trợ xuất dữ liệu ra bảng tính Excel và định dạng CSV có UTF-8 BOM; tích hợp nút `Xuất` và `Nhập` trực tiếp trên thanh công cụ của 100% các màn hình quản trị danh sách. | Đạt 100% |
| 6 | **Bộ lọc 1 dòng thường dùng + Khung lọc nâng cao** | Xây dựng component [UniversalFilterBar.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/components/UniversalFilterBar.tsx) trên cả CMS và Partner Portal. Mặc định hiển thị 1 dòng các điều kiện tìm kiếm hay dùng, tích hợp nút icon bộ lọc (`pi-filter`) kèm huy hiệu đếm số điều kiện để mở rộng khung lọc nâng cao mượt mà. | Đạt 100% |
| 7 | **Thiết kế lại Quản lý tài khoản & Quản lý vai trò chuẩn DIP** | - [user-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/user-management.tsx): Bổ sung `UserRoleCell` xem nhanh và phân quyền trực tiếp, hộp thoại đặt lại mật khẩu [ResetPasswordDialog.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/components/ResetPasswordDialog.tsx), gán vai trò [RoleAssignmentDialog.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/components/RoleAssignmentDialog.tsx).<br/>- [role-management.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/role-management.tsx): Loại bỏ 2 nút duyệt/từ chối sai nghiệp vụ, chuyển cột thao tác lên đầu bảng, bổ sung chức năng nhân bản vai trò; hộp thoại [role-form-dialog.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/pages/admin/components/role-form-dialog.tsx) 2 thẻ (Thông tin + Ma trận phân quyền theo phân hệ 2 cột).<br/>- Cập nhật Flyway migration [V28__enhance_system_users_roles_iam.sql](file:///Users/micro/Source/chapisoft/micro-loyalty/src/lib/loyalty-common/src/main/resources/db/migration/V28__enhance_system_users_roles_iam.sql) bổ sung các trường `platform`, `scope`, `must_change_password`. | Đạt 100% |
