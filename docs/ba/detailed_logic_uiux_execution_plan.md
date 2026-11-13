# KẾ HOẠCH THỰC THI CHI TIẾT HOÀN THIỆN LOGIC NGHIỆP VỤ VÀ UI/UX THEO THIẾT KẾ FIGMA

> **Mã tài liệu:** `EXEC-PLAN-LOYALTY-V2.2`  
> **Ngày lập:** 13/11/2026  
> **Tài liệu gốc liên kết:** [project_implementation_plan.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/project_implementation_plan.md), [figma_design_evaluation_report.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/figma_design_evaluation_report.md), [detailed_design.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/detailed_design.md), [architecture_evolution_v2.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/architecture_evolution_v2.md)  
> **Phạm vi thực thi:** Toàn bộ logic nghiệp vụ trên `src/service` (`V18..V23`, Service, Controller, Job) và 100% UI/UX cho **144 màn hình Figma** (`1168:2725`, tập Node `20634:*`) trên `src/cms`, `src/webview`, `natcash-eu-app` và `USSD *202#`.

---

## 1. CHUẨN HÓA NỀN TẢNG, ZERO-HARDCODE VÀ LOẠI BỎ DỮ LIỆU GIẢ LẬP

Trước khi triển khai các phân hệ v2.1, toàn bộ mã nguồn hiện hữu phải được dọn dẹp để đáp ứng tiêu chuẩn Zero-Hardcode và Zero Fake Default Values:

### 1.1. Dọn dẹp trạng thái giả lập trên Webview và CMS
* Tại [App.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/webview/src/App.tsx#L80-L109), loại bỏ hoàn toàn các giá trị khởi tạo giả lập gồm: `userPoints` mặc định `2480`, `freeTurns` mặc định `2`, `perpetualTurns` gán cứng `5`, `checkinStreak` gán cứng `3`, và `qrToken` tạo bằng `Math.random()` (`'NATCASH_PAY_TOKEN_' + ...`) ở trình duyệt.
* Thay thế bằng luồng nạp 100% từ API máy chủ (`GET /loyalty/v1/accounts/me`, `POST /loyalty/v1/wallet/qr-token`), hiển thị khung chờ tải `Skeleton` trong lúc gọi API và hiển thị `Empty State` nếu người dùng chưa có dữ liệu.
* Rà soát loại bỏ chuỗi gán cứng trên toàn bộ các tệp `.tsx`, `.ts` và `.java`, đảm bảo mọi chuỗi hiển thị giao diện đi qua hàm dịch `t(...)` và khai báo đầy đủ trong:
  * CMS: `src/cms/src/language/locales/` (`vi.ts`, `en.ts`, `fr.ts`, `ht.ts`).
  * Webview: `src/webview/src/language/locales/` (`vi.ts`, `en.ts`, `fr.ts`, `ht.ts`).

### 1.2. Mở rộng Domain Enums và Constants tập trung
* Bổ sung các Enum chuẩn hóa tại `src/service/src/main/java/com/natcash/loyalty/domain/enums/`: `CurrencyAssetType` (`TIER_POINT`, `LOYALTY_COIN`), `ApprovalTargetType` (`POLICY`, `PROGRAM`, `POINT_ADJUSTMENT`, `PAYMENT_BATCH`, `SYSTEM_PARAM`), `ApprovalStatus` (`PENDING`, `APPROVED`, `REJECTED`), `PartnerHierarchyLevel` (`PARTNER`, `BRANCH`, `PRODUCT_GROUP`, `PRODUCT`), `CampaignMissionCategory` (`FIRST_TX`, `SPEND_TIERED`, `TX_COUNT`, `STREAK`, `CHECKIN_7D`, `WIN_BACK`, `PARTNER_PURCHASE`, `CROSS_SELL`, `REFERRAL`), `CustomerSegmentCode` (7 mã phân khúc), `GameCategory` (`ENTERTAINMENT`, `PUZZLE_BRAIN`, `LEARNING_EDTECH`), `AgentRoleType` (`AGENT`, `SUPER_AGENT`).
* Bổ sung các hằng số thời hạn, ngưỡng ngân sách, khung giờ yên tĩnh và mẫu khóa Redis tại [LoyaltyConstants.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/constant/LoyaltyConstants.java), [RedisKeys.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/constant/RedisKeys.java), [SecurityConstants.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/constant/SecurityConstants.java) và [ErrorCode.java](file:///Users/micro/Source/chapisoft/micro-loyalty/src/service/src/main/java/com/natcash/loyalty/constant/ErrorCode.java).

---

## 2. KẾ HOẠCH CHI TIẾT HOÀN THIỆN LOGIC NGHIỆP VỤ BACKEND & DATABASE (`src/service`)

### 2.1. Gói `BE-01` — `V18__add_fifo_buckets_and_approval_queue.sql`
* **Cấu trúc bảng mới và nâng cấp:**
  * `point_expiration_buckets`: Lưu các lô điểm theo từng lần phát sinh (`bucket_id`, `tenant_id`, `account_id`, `asset_type`, `initial_points`, `remaining_points`, `earned_at`, `expired_at`, `source_ref`, `status`), đánh chỉ mục `(tenant_id, account_id, remaining_points, expired_at)` phục vụ truy vấn `FIFO`.
  * `approval_requests`: Hàng đợi duyệt hai cấp dùng chung (`request_id`, `tenant_id`, `target_type`, `target_id`, `action_type`, `payload_before JSONB`, `payload_after JSONB`, `maker_id`, `checker_id`, `status`, `reason`, `reviewed_at`).
  * Nâng cấp `loyalty_tiers` & `loyalty_accounts`: Bổ sung `keep_tier_points` (`0 / 800 / 4.000 / 12.000`), `upgrade_points` (`0 / 1.000 / 5.000 / 15.000`), `cycle_end_at`, `tier_locked_until`.
  * Nâng cấp `system_audit_logs`: Bổ sung cột `before_value JSONB` và `after_value JSONB` cho màn `QT-04` (`20634:3245`).
* **Kịch bản chuyển đổi dữ liệu an toàn:**
  * Thực hiện câu lệnh Backfill trong `V18` khởi tạo 1 lô `point_expiration_buckets` tương ứng cho mọi tài khoản có số dư dương hiện tại, đảm bảo bất biến `SUM(remaining_points) == loyalty_accounts.point_balance`.
* **Service, Job và API triển khai:**
  * `PointBucketFifoService`: Trừ điểm theo vòng lặp khóa hàng `SELECT ... FOR UPDATE ORDER BY expired_at ASC`; trả danh sách phân rã từng lô sắp hết hạn cho `GET /loyalty/v1/ledger/expiring-buckets`.
  * `ApprovalQueueService` & `ApprovalQueueController`: Bắt buộc `maker_id != checker_id`, tự động ghi `before_value` / `after_value` vào `AuditLog` khi Checker phê duyệt.
  * Nâng cấp `TierEvaluationJob`: Cộng điểm hạng tức thời khi đạt ngưỡng; trước khi hết chu kỳ 12 tháng 30 ngày phát cảnh báo thiếu điểm giữ hạng; hết chu kỳ hạ tối đa 1 bậc.

### 2.2. Gói `BE-02` — `V19__add_4level_partner_hierarchy_and_payment_batches.sql`
* **Cấu trúc bảng mới và nâng cấp:**
  * `partner_branches` (`branch_id`, `partner_id`, `branch_code`, `payment_point_code`, `province`, `address`, `latitude`, `longitude`, `status`), `partner_product_groups`, `partner_products`, `partner_staff_accounts` (`staff_id`, `partner_id`, `branch_id`, `role_code`, `status`).
  * Nâng cấp `loyalty_acceptance_policies`: Hỗ trợ kế thừa 4 cấp (`PARTNER → BRANCH → PRODUCT_GROUP → PRODUCT`) và đánh số phiên bản (`version_no`, `is_active_version`).
  * `partner_api_keys`: Lưu `key_hash`, `key_prefix`, `expires_at`, `grace_expires_at` (`now + 7 ngày`), `revoked_at` phục vụ xoay vòng khóa hiển thị 1 lần (`QT-06` `20634:5799`, `20634:5888`).
  * `clearing_payment_batches`: Quản lý lô thanh toán `PAY-...`, tổng giá trị `gross_amount`, `discount_amount`, `mdr_fee_amount`, `net_payable_amount`, danh sách khiếu nại `KN-...` bị tách riêng và hạn xác nhận 3 ngày làm việc của đối tác.
* **Service, Controller và Quy tắc bảo mật:**
  * `PartnerHierarchyService`, `PartnerApiKeyService` (tạo khóa ngẫu nhiên `SecureRandom`, trả plaintext duy nhất 1 lần khi tạo/xoay vòng, hỗ trợ thu hồi khẩn cấp `POST /partner-portal/v1/api-keys/{id}/revoke`), `NatcashPaymentPointController` (`LM-02` `20634:6003`).
  * Cụm `PartnerPortalController` (`/loyalty/v1/partner-portal/*`): Chặn tuyệt đối lỗi `IDOR` bằng cơ chế `Default Deny`, mọi truy vấn đều lọc cứng `partner_id` và `branch_id` lấy từ phiên đăng nhập hợp lệ.

### 2.3. Gói `BE-03` — `V20__add_campaign_rules_control_group_and_budgets.sql`
* **Cấu trúc bảng mới:** `campaign_rule_conditions` (lưu DSL 4 tầng `WHEN – IF – THEN – LIMITS`), `campaign_control_groups` (`campaign_id`, `user_id`, `bucket_group` `TEST` hoặc `CONTROL`), `loyalty_monthly_budgets` (`budget_month`, `sponsor_type`, `budget_cap`, `consumed_amount`, `alert_80_sent`).
* **Logic cốt lõi:**
  * `CampaignRuleEngineService`: Xử lý đủ 9 loại nhiệm vụ (`NV-05` `20634:10206`); kiểm tra trùng điều kiện khuyến mãi, hỗ trợ nhận thưởng thủ công `POST /loyalty/v1/missions/{id}/claim` và khóa phân tán `RedisKeys.lockMissionClaim(...)`.
  * `ControlGroupService`: Tách cố định 5–10% người dùng bằng `SHA-256(user_id + campaign_code) mod 100 < control_pct`; tổng hợp chỉ số `Lift vs Control Group` cho `NS-03`.
  * `MonthlyBudgetGuardService`: Dùng `Redis DECRBY` kiểm tra trần ngân sách theo thời gian thực; chạm `80%` bắn cảnh báo vào `system_alerts` (`CN-05`); chạm `100%` tự động chuyển trạng thái chiến dịch sang `PAUSED_BUDGET_EXCEEDED`.

### 2.4. Gói `BE-04` — `V21__add_segments_and_antispam_notification_engine.sql`
* **Cấu trúc bảng mới:** `customer_segments`, `customer_segment_members`, `user_notification_preferences` (`opt_out_marketing`, `preferred_locale`), `system_alerts`, `partner_notifications` (`CN-08` `20634:16976`), `reminder_scenarios` (`CN-04` `20634:10717`).
* **Logic cốt lõi:**
  * `SegmentCalculationJob` (chạy `02:00` hằng ngày): Phân loại 7 phân khúc (`NEW_CUSTOMER`, `LOW_ACTIVITY`, `HIGH_VALUE`, `SINGLE_SERVICE`, `WIN_BACK`, `PARTNER_SHOPPER`, `GENERAL`), cung cấp API xuất CSV cho `CN-03` (`20634:10485`).
  * `EngagementAntiSpamFilter` trong `EngagementService`: Kiểm tra tuần tự 4 lớp trước khi đẩy tin: (1) Khung giờ yên tĩnh `20:00–08:00`, (2) Giới hạn `1 Push/ngày` và `3 Push/tuần` lưu bộ đếm trên Redis, (3) Chống trùng thông điệp cùng sự kiện trong cửa sổ cấu hình, (4) Bỏ qua toàn bộ tin tiếp thị nếu `opt_out_marketing = true`.

### 2.5. Gói `BE-05` — `V22__add_learning_quiz_bank_and_leaderboard.sql`
* **Cấu trúc bảng mới:** `learning_courses`, `learning_questions` (`course_id`, `question_text JSONB`, `options JSONB`, `correct_option_index`, `audio_url`), `learning_user_progress`, `game_monthly_leaderboards`.
* **Logic cốt lõi:**
  * `LearningQuizService` & `LearningQuizController`: Khởi tạo bài học trừ 1 lượt chơi, chấm điểm đáp án hoàn toàn phía máy chủ, cấp thưởng theo bậc `5 / 10 / 15` câu đúng, cập nhật `Redis Sorted Set` bảng xếp hạng tháng (`ZINCRBY`).
  * Bổ sung `POST /loyalty/v1/admin/learning/questions/import` (nhập CSV câu hỏi cho `GM-09` `20634:8889`), `GET /loyalty/v1/admin/games/statistics` (`GM-07` `20634:8508`) và `POST /gamehub/v1/scratch-card/play` dùng `SecureRandom` trả kết quả thẻ cào `Lucky Scratch Card` (`20634:25913`).

### 2.6. Gói `BE-06` — `V23__add_agent_loyalty_and_ai_copilot_schemas.sql`
* **Cấu trúc bảng mới:** `agent_loyalty_programs`, `agent_monthly_kpis`, `super_agent_network_kpis`, `support_playbooks`, `ai_campaign_suggestions`.
* **Logic cốt lõi:**
  * `AgentLoyaltyService`: Đồng bộ số liệu định danh `eKYC` + giao dịch đầu từ Data Lake/WSO2; tính thưởng Agent đạt `100` khách hàng mới/tháng (`2.000 HTG` hoặc `2.000 Natcash Coin`) và Super Agent đạt `≥ 50%` mạng lưới (`10.000 HTG`).
  * `AiCampaignCopilotService` & `CampaignConflictDetector`: Sinh đề xuất cấu hình chiến dịch từ mục tiêu ngân sách và rà soát xung đột khi trùng phân khúc, trùng hành vi kích hoạt và giao nhau khung thời gian cho `AI-01` (`20634:10367`).

---

## 3. KẾ HOẠCH CHI TIẾT HOÀN THIỆN UI/UX KHỐI 1: BACK OFFICE CMS (`src/cms`)

Toàn bộ route mới phải được khai báo tập trung trong [paths.ts](file:///Users/micro/Source/chapisoft/micro-loyalty/src/cms/src/paths.ts), không dùng đường dẫn chuỗi tự do. Các bảng dữ liệu có cột mã dài phải thiết lập `minWidth` cố định, `font-mono` và `white-space: nowrap` (`FE-UX-03`).

| Section Figma | Mã màn hình & Node ID | Đường dẫn mã nguồn (`src/cms/src/pages/`) | Yêu cầu hoàn thiện UI/UX & Liên kết Logic |
| :--- | :--- | :--- | :--- |
| **1 · Sign-in & Admin** | `QT-01`..`QT-07` (`20634:1313`..`3245`) | Nâng cấp `admin/audit-management.tsx`, `deadletter/DeadLetterPage.tsx` | Bổ sung Modal `QT-04 Audit log · change details` (`20634:3245`) hiển thị bảng so sánh `before / after` dạng `JSONB Diff`; chuẩn hóa cột ID trên `Audit log` (`20634:2639`) và `Queue & failed events` (`20634:3039`). |
| **2 · Members & Tiers** | `HV-04` (`3692`), `HV-06` (`3967`), `HV-05` (`4202`), `HV-09` (`4416`), `HV-08` (`4628`) | Nâng cấp `tiers/TierManagementPage.tsx` & `customers/customers.tsx` | Cập nhật `HV-04` đúng ngưỡng nâng hạng `0 / 1.000 / 5.000 / 15.000` và giữ hạng `0 / 800 / 4.000 / 12.000`, đặt nút `Period settings` và `View tier distribution` gọn trong banner; thêm tab `HV-06`; thêm Modal `HV-09` khóa/mở khóa gửi duyệt và Drawer `HV-08 Member 360`. |
| **3 · Partners & Connections** | `LM-05` (`4904`), `LM-06` (`5425`), `LM-02` (`6003`), `QT-06` (`6140`) | Nâng cấp `partners/partners.tsx`, `policy/PolicyConfigurationPage.tsx`; tạo mới `partners/NatcashBranchesPaymentPointsPage.tsx` | Xây dựng mới trang `LM-02` quản lý chi nhánh và mã `Payment Point` phía Natcash; nâng cấp `QT-06 Connections overview` hiển thị đủ `6` hệ thống nội bộ (`WSO2`, `Mobile Service`, `Payment Point`, `BCCS`, `USSD *202#`, `Data Lake`). |
| **4 · Rewards & Vouchers** | `VQ-04` (`20634:6294`..`7021`) | Nâng cấp `vouchers/VoucherManagementPage.tsx` | Bổ sung Wizard 3 bước nhập CSV (`Import · file check → confirm → done`), kiểm tra lỗi từng dòng trước khi xác nhận lưu. |
| **5 · Games** | `GM-03` (`7152..8027`), `GM-07` (`8508`), `GM-09` (`8889`) | Nâng cấp `games/GameManagementPage.tsx`; tạo mới `games/GameStatisticsPage.tsx`, `games/LearningQuizBankPage.tsx` | Xây dựng trang thống kê và lịch sử phiên chơi (`GM-07`), trang quản trị khóa học và ngân hàng câu hỏi kèm nhập CSV + tệp âm thanh (`GM-09`). |
| **6 · Programs & Missions** | `NV-04..06`, `QT-04`, `NS-03`, `AI-01` (`9052`..`10367`) | Nâng cấp `campaigns/CampaignMilestonesPage.tsx`; tạo mới `admin/ApprovalQueuePage.tsx`, `campaigns/AiCampaignCopilotDrawer.tsx` | Xây dựng bộ dựng luật 4 tầng `WHEN – IF – THEN – LIMITS` cho 9 loại nhiệm vụ (`NV-05` `20634:10206`), màn theo dõi `NV-06`, hàng đợi duyệt `QT-04` dùng chung và Drawer trợ lý AI `AI-01` cảnh báo xung đột chiến dịch. |
| **7 · Segments & Messaging** | `CN-03` (`10485`), `CN-04` (`10717`) | Tạo mới `engagement/CustomerSegmentsPage.tsx`, `engagement/ReminderScenariosPage.tsx` | Giao diện 7 phân khúc động kèm tải CSV (`CN-03`) và cấu hình kịch bản nhắc 3 bên đa ngôn ngữ + nhật ký gửi (`CN-04`). |
| **8 · Dashboard, Budget & Alerts** | `NS-02`, `NS-01`, `NS-03`, `CN-05`, `NS-05..07` (`10974`..`12834`) | Nâng cấp `dashboard/dashboard.tsx`; tạo mới `reports/BudgetManagementPage.tsx`, `ProgramEffectivenessPage.tsx`, `AlertCenterPage.tsx`, `PartnerCrossSellReportPage.tsx`, `PointsLiabilityReportPage.tsx`, `ScheduledReportsPage.tsx` | Hoàn thiện bảng ngân sách tháng cảnh báo 80%/dừng 100%, biểu đồ `Lift vs Control Group`, trung tâm cảnh báo `CN-05`, ma trận bán chéo `NS-05`, nghĩa vụ điểm tồn `NS-06` và lập lịch email báo cáo `NS-07`. |
| **9 · Points Ledger & Adjustments** | `DT-03` (`13056`), `DT-02` (`14115`), `QT-04` (`14328`) | Nâng cấp `transactions/transactions.tsx`; tạo mới `transactions/PointAdjustmentPage.tsx` | Thêm luồng tạo điều chỉnh điểm thủ công có kiểm tra hạn mức và đẩy sang hàng đợi phê duyệt `QT-04`. |
| **10 · Clearing & Payment** | `LM-07` (`20634:14589`..`15433`) | Nâng cấp `clearing/ClearingSettlementPage.tsx` | Hoàn thiện 5 màn hình xử lý sai lệch, giải quyết khiếu nại `KN-...`, tạo lô thanh toán `PAY-...`, theo dõi tiến trình và bổ sung cột/Tooltip `MDR Fee` (`FE-UX-02`). |
| **12 · Agent & Super Agent** | `AG-03` (`20634:17129`) | Tạo mới `agents/AgentLoyaltyManagementPage.tsx` | Quản trị chỉ tiêu `100` khách/tháng cho Agent, tỷ lệ `≥ 50%` mạng lưới cho Super Agent, duyệt thưởng và tra cứu cẩm nang hỗ trợ `Support Playbook`. |

---

## 4. KẾ HOẠCH CHI TIẾT HOÀN THIỆN UI/UX KHỐI 2: MERCHANT PARTNER PORTAL (`14` MÀN HÌNH)

Toàn bộ màn hình đặt tại `src/cms/src/pages/partner-portal/`, dùng chung lõi React + Ant Design nhưng tách biệt Layout, thanh điều hướng và Route Guard theo vai trò `PARTNER_OWNER`, `PARTNER_BRANCH_MANAGER`, `PARTNER_CASHIER`:

| Vị trí Section Figma | Mã màn hình & Node ID | Tệp đích (`src/cms/src/pages/partner-portal/`) | Chi tiết UI/UX & Tích hợp Backend |
| :--- | :--- | :--- | :--- |
| **3 · Partners** | `QT-06` (`20634:5710`, `5799`, `5888`) | `PartnerWebhookApiKeyPage.tsx` | Cấu hình IP whitelist & Webhook URL; Modal xoay vòng `API Key` hiển thị khóa mới 1 lần; bộ đếm lùi `Grace Period` 7 ngày kèm nút thu hồi tức thời `Revoke old key now` (`FE-UX-01`). |
| **11 · Partner Portal** | `NS-04` (`20634:15763`) | `PartnerDashboardPage.tsx` | Thẻ KPI khách thanh toán, giao dịch tiêu điểm, khách mới, ngân sách đồng tài trợ và tỷ lệ bán chéo liên minh. |
| **11 · Partner Portal** | `LM-08` (`20634:15940`) | `PartnerBranchesProductsPage.tsx` | Bảng quản lý chi nhánh, mã `Payment Point`, nhóm sản phẩm và danh mục sản phẩm áp dụng. |
| **3 & 11 · Partner Portal** | `LM-09` (`5275`, `16086`) | `PartnerPointsPolicyPage.tsx` | Form thiết lập tỷ lệ tích/tiêu điểm kế thừa 4 cấp và gửi duyệt lên Natcash (`LM-06`). |
| **11 · Partner Portal** | `QT-03` (`20634:16236`) | `PartnerStaffAccountsPage.tsx` | Cấp phát và khóa tài khoản thu ngân/quản lý theo đúng `branch_id`. |
| **11 · Partner Portal** | `NV-07` (`20634:16385`) | `PartnerProgramProposalPage.tsx` | Đề xuất chương trình ưu đãi tại cửa hàng với ngân sách tự tài trợ hoặc đồng tài trợ. |
| **11 · Partner Portal** | `VQ-05` (`20634:16473`) | `PartnerVouchersPage.tsx` | Danh sách voucher đối tác kèm tính năng đối chiếu và gạch nợ voucher khi khách đưa mã tại quầy. |
| **11 · Partner Portal** | `LM-11` (`20634:16627`) | `PartnerTransactionsPage.tsx` | Tra cứu lịch sử giao dịch tích/tiêu điểm theo chi nhánh, bộ lọc thời gian, chuẩn `minWidth` + `nowrap`, xuất Excel. |
| **10 & 11 · Partner Portal** | `LM-10` (`15576`, `16793`) | `PartnerSettlementPage.tsx` | Xem bảng kê đối soát kỳ (`Gross – Discount – Net` kèm `MDR Fee` `FE-UX-02`), bấm xác nhận kỳ hoặc mở form khiếu nại `Raise a claim` đính kèm chứng từ. |
| **11 · Partner Portal** | `CN-08` (`20634:16976`) | `PartnerNotificationsPage.tsx` | Trung tâm thông báo riêng cho đối tác (trạng thái duyệt chính sách, lịch chốt công nợ), có `Empty State` & `Skeleton` (`FE-UX-05`). |

---

## 5. KẾ HOẠCH CHI TIẾT HOÀN THIỆN UI/UX KHỐI 3: MOBILE APP, WEBVIEW & USSD (`75` MÀN HÌNH)

Toàn bộ giao diện trong `src/webview/src/` thiết kế theo chuẩn Mobile-First, tích hợp sẵn [LoyaltyJSBridge.ts](file:///Users/micro/Source/chapisoft/micro-loyalty/src/webview/src/bridge/LoyaltyJSBridge.ts) và [LanguageSelector.tsx](file:///Users/micro/Source/chapisoft/micro-loyalty/src/webview/src/components/LanguageSelector.tsx) để đồng bộ chuyển đổi 3 ngôn ngữ (`Kreyòl / Français / English`):

| Section Figma | Mã màn hình & Node ID tiêu biểu | Thành phần thực thi (`src/webview/src/` & `natcash-eu-app`) | Yêu cầu UI/UX & Logic chi tiết |
| :--- | :--- | :--- | :--- |
| **1 · Entry & Membership** (10 màn) | `HV-02`, `HV-03` (`18661`), `HV-01` (`18927`), `NC-HM-01` (`19462`), `NC-TB-01` (`18979`, `19060`), `NC-PF-01` (`18262`) | Cập nhật `HomePage.tsx` (tách từ `App.tsx`), `TierBenefitsModal.tsx`, màn `Terms`, và điểm chạm trên `natcash-eu-app` | Hiển thị đồng bộ ngưỡng `0–999 / 1.000–4.999 / 5.000–14.999 / 15.000+`, tách rõ `Natcash Coin` và `Điểm xét hạng`; triển khai `NC-HM-01` đúng bản chuẩn C trên Figma. |
| **2 · Earn · Missions & Check-in** (16 màn) | `NV-01..03`, `NV-06 Invite friends` (`21546`), `DT-01 FIFO` (`21855`) | Nâng cấp `MissionsPage.tsx`, `PointHistoryPage.tsx`; tạo mới `InviteFriendsPage.tsx`, `FifoExpiringPopup.tsx` | Bộ lọc nhiệm vụ theo chiến dịch, nút `Claim` có kiểm tra hạn nhận; trang `Invite friends` có mã QR, link chia sẻ và trạng thái bạn bè đã `eKYC`; trang `DT-01` mở popup từng lô điểm sắp hết hạn `FIFO`. |
| **3 · Redeem · Rewards & Vouchers** (13 màn) | `VQ-01` (`22007`), `VQ-02` (`22215`), `VQ-03` (`23242`) | Nâng cấp `UserVoucherPage.tsx`, `VoucherBarcodeModal.tsx`, `VoucherRedeemResultModal.tsx` | Bổ sung thẻ `Scan at the counter` ngay trên màn kết quả `VQ-02` và màn thanh toán `VQ-03` gồm `QR Code` + `Code128 Barcode` + mã chữ số (mẫu `DLM-50-9X8Z`); thêm trạng thái `Awaiting confirmation`, `Sold out` và `Empty State` (`FE-UX-05`). |
| **4 · Play · Games** (15 màn) | `GM-01`, `GM-02`, `Lucky Scratch Card · play` (`25913`) | Nâng cấp `GameHubPage.tsx`; tạo mới `LearningCourseListPage.tsx`, `LearningQuizPage.tsx`, `LuckyScratchCardPage.tsx`, `GamePlayHistoryPage.tsx` | Nhóm game `Learning` (khóa học, trắc nghiệm có âm thanh, bảng xếp hạng tháng); trò chơi cào thẻ `Lucky Scratch Card` lấy kết quả từ API máy chủ trước khi cho người dùng cào lớp phủ canvas; trang lịch sử chơi. |
| **5 · Use Points at Partners** (9 màn) | `LM-04` (`26100`), `LM-01`, `USSD` (`26594..26656`), `LM-17 QR 60 s` (`26687`) | Tạo mới `WhereToUsePage.tsx`, `RewardWalletQrModal.tsx`; cập nhật `natcash-eu-app` & `UssdMenuController.java` | Màn `LM-04` tìm đối tác theo ngành hàng/vị trí; màn `LM-17` sinh token động từ máy chủ với đồng hồ đếm lùi 60 giây tự làm mới; luồng `USSD *202#` đủ menu gốc và 2 nhánh con (`1. Where to use coins`, `2. My vouchers`); tích hợp gợi ý dùng điểm/voucher trên màn QR `natcash-eu-app`. |
| **6 · Targeted Content** (10 màn) | `CN-01` (`27266..28694`), `CN-02`, `CN-04 Notification settings` (`29224`) | Tạo mới `InboxPage.tsx`, `NotificationSettingsPage.tsx`, `SegmentBannerRenderer.tsx` | Giao diện trang chủ biến thiên theo 7 mã phân khúc trả về từ API; hộp thư `CN-02` phân loại thông báo; màn `CN-04` cho phép bật/tắt `Opt-out` tiếp thị và chọn nhanh 3 ngôn ngữ (`FE-UX-04`). |
| **7 · Agent & Super Agent** (2 màn) | `AG-01` (`29302`), `AG-02` (`29373`) | Tạo mới `AgentMissionsPage.tsx`, `SuperAgentKpiPage.tsx` | Màn `AG-01` theo dõi tiến độ `100` khách hàng mới/tháng và phần thưởng `2.000 HTG / Coin`; màn `AG-02` theo dõi danh sách đại lý tuyến dưới, tỷ lệ đạt chuẩn `≥ 50%` và kích hoạt hỗ trợ. |

---

## 6. DANH MỤC KIỂM TRA NGHIỆM THU KỸ THUẬT THEO TỪNG BƯỚC

Mỗi Sprint kết thúc chỉ được xác nhận hoàn tất khi vượt qua toàn bộ các cổng kiểm tra thực chứng sau:

1. **Kiểm tra Database & Migration:** Chạy toàn bộ `V1..V23` trên PostgreSQL 15+ sạch; xác nhận 0 lỗi Flyway checksum và chạy câu truy vấn xác minh `SUM(point_expiration_buckets.remaining_points) == loyalty_accounts.point_balance`.
2. **Kiểm tra Biên dịch & Unit Test Backend (`src/service`):** Chạy `mvn clean test` đạt `100%` pass, 0 cảnh báo import thừa hoặc FQN, 0 chuỗi hardcode vi phạm Enum.
3. **Kiểm tra Biên dịch & Kiểm soát Kiểu dữ liệu Frontend (`src/cms` & `src/webview`):** Chạy `npm run lint && npm run build` trên cả hai dự án với `0` lỗi TypeScript, kiểm tra đầy đủ khóa dịch đa ngôn ngữ tại `vi.ts`, `en.ts`, `fr.ts`, `ht.ts`.
4. **Kiểm tra Tích hợp Thực tế & Bảo mật (Tầng 2 & Tầng 3):**
   * Thực thi kịch bản tải cao trong `test/load/` (`k6_pos_wallet_burn.js`, `k6_lucky_wheel_spin.js`, `k6_minigame_submit.js` cùng kịch bản mở rộng `FIFO`/`Budget`/`Clearing`) kết hợp `sql_concurrency_audit.sql` trên Staging.
   * Thực hiện kiểm thử `IDOR` và `Default Deny` trên 100% endpoint Hội viên và Partner Portal.
   * Triển khai chọn lọc từng phân hệ qua [Jenkinsfile](file:///Users/micro/Source/chapisoft/micro-loyalty/Jenkinsfile) lên môi trường `deploy/micro-loyalty/` sau khi vượt qua kiểm thử cục bộ.

