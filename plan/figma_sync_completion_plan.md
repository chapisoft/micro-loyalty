# Kế hoạch code hoàn thiện theo Figma 18/11 và tài liệu

**Phạm vi:** đưa `src/webview`, `src/cms`, `src/partner-portal` và 5 service khớp với Figma bản 18/11 (file `XszF0HjkSaaBr8JDRTcrsz`: trang App 274:2, trang CMS 320:2) và tài liệu giải pháp. Không làm lại phần đã chạy được.
**Nhánh đề xuất:** `feature/figma-sync-1811`, mỗi giai đoạn một PR.

## 1. Hiện trạng và khoảng cách

| Khu vực | Đã có trong code | Còn thiếu so với Figma 18/11 |
|---|---|---|
| Webview `figma-ui` | 10 màn (Home, Missions, Rewards, Games, CoinsHistory, Inbox, Invite, MemberTiers, UseCoins, Agent); SSO ticket; 12 mini game | Thuật ngữ vẫn là "Redeem"; chưa có voucher miễn phí (Collect), "Cách dùng", Store/My vouchers kiểu mới, bộ lọc, thanh tab dưới, bảng More, Leaderboard theo game pts, các màn Agent/Super Agent (mới chỉ có `AgentHome`), popup nhắc khi mở app; màn LM-04 `WhereToUse` đã bỏ trong Figma nhưng route vẫn còn |
| Backend | `LoyaltyVoucherEntity` có `pointCost`, `totalQuantity`, `minBillAmount`; POS inquiry/redeem; `GameMonthlyLeaderboardEntity`; `AgentLoyaltyController`; migration đến V32 | Voucher chưa có cách nhận, cách dùng, ngành hàng, đối tượng, cấu hình đợt phát; chưa có API Collect; chưa có sổ game pts theo nguồn kèm trần ngày và giải theo hạng; mission chưa có đối tượng (Agent/SA); chưa có banner, popup, ưu đãi gửi riêng; JWT chưa mang vai trò |
| CMS | VoucherManagement, GameHubConfig, CampaignMilestones, Segments, ReminderScenarios, SystemParameters, Agent… | Form VQ-04 bản mới; trang mới GM-10 Leaderboard và CN-06 Banners/popups/offers; Rule builder thêm "Who can join"; tham số mới của QT-05 |
| App Natcash (ngoài repo) | — | Thẻ Rewards trên Home, thẻ Account theo vai trò (NC-PF-02), màn LM-01 chỉ hiển thị phần thu ngân đã áp. Cần phối hợp với team app |

## 2. Quy tắc nghiệp vụ đã chốt (code phải tuân theo)

1. **Thuật ngữ trên app:**
   - "Get voucher": đổi coin lấy voucher.
   - "Collect": lưu voucher miễn phí.
   - "Use": dùng voucher.
   - "Claim": chỉ dùng cho thưởng mission.
   - Không dùng "Redeem" trên app.
   - Coin trên app tương ứng với points trong CMS.
2. **Thanh toán tại quầy:**
   - Khách đưa mã (QR/Barcode, sống 60 s), thu ngân quét.
   - Coin và voucher được chọn trên POS (`wallet/inquiry` rồi `wallet/redeem`), app không có công tắc coin.
   - Quét xong là trả xong. Màn PIN chỉ hiện khi vượt `PAY_AT_COUNTER_PIN_LIMIT_HTG`, và chỉ hiển thị phần thu ngân đã áp.
3. **Cách dùng (`usage_type`):**
   - `NATCASH_STORE`: Use mở Pay at counter, có sẵn voucher.
   - `PARTNER_CODE`: Use hiện QR/Barcode của đối tác.
   - `ONLINE`: Use mở màn thanh toán dịch vụ, voucher đã áp.
4. **Cách nhận (`acquire_type`):**
   - `COINS`: có popup "Voucher added".
   - `FREE_COLLECT`: hiện toast; lưu là giữ chỗ; mỗi khách 1 lượt; bắt buộc eKYC; hạn N ngày, ghi ngày cố định.
   - `GIVEN`: phát qua mission, game hoặc chiến dịch.
5. **Leaderboard:**
   - Xếp hạng theo game pts, reset ngày 1 hằng tháng.
   - Mỗi nguồn có trần ngày; coin mua lượt chơi không cộng pts.
   - Giải theo hạng cấu hình trong CMS, trả giải cần người duyệt thứ hai.
6. **Agent / Super Agent:**
   - Dùng chung webview, vai trò lấy từ JWT, không lấy từ tham số app gửi lên.
   - Không có game.
   - Thanh tab: Agent có Home · Missions · Vouchers; Super Agent có thêm Network.
7. **Popup khi mở app:**
   - Tối đa 1 popup mỗi lần mở.
   - Ưu tiên: thưởng chờ nhận > voucher sắp hết hạn > mission sắp hết hạn > popup chiến dịch.
   - Chỉ hiện trong khung 08:00–20:00.

## 3. Các giai đoạn

### GĐ 0 · Chuẩn bị (0.5 ngày)
- Đổi thuật ngữ trên webview: `Redeem` → `Get voucher`/`Collect` trong `Rewards.tsx`, `LoyaltyHome.tsx`, `UseCoins.tsx`, `Root.tsx` và file ngôn ngữ.
- Bỏ route `/use-coins` (LM-04), chuyển hướng sang `/rewards`.
- Thêm migration **V33** cho tham số hệ thống:
  - đổi `REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS` thành `CUSTOMER_PAY_CODE_TTL_SECONDS`;
  - `MAX_DAILY_BURN_PERCENTAGE` = 30;
  - thêm `PAY_AT_COUNTER_PIN_LIMIT_HTG` = 2000, `COIN_EXPIRY_MONTHS` = 12, `FREE_VOUCHER_REQUIRE_EKYC` = true.
- Tìm mọi chỗ code đọc key cũ và sửa theo.

### GĐ 1 · Voucher: cách nhận, cách dùng, Collect (BE 3 ngày, CMS 2 ngày)
- **V34 `loyalty_vouchers` thêm cột:**
  - `acquire_type`, `usage_type`, `category_code`, `audience_role`, `eligible_tiers` (jsonb);
  - `per_customer_limit`, `batch_quantity`, `batch_schedule` (cron), `valid_days_after_collect`;
  - `require_ekyc`, `show_in_free_strip`, `strip_order`, `service_link`, `branch_scope` (jsonb), `i18n` (jsonb, gồm name và condition cho EN/FR/HT).
  - Dữ liệu cũ mặc định `COINS` + `PARTNER_CODE`.
- **API (campaign-service / customer-service):**
  - `GET /vouchers` lọc theo category, partner, acquireType, usableAt, sort, affordable.
  - `POST /vouchers/{id}/collect`: giữ chỗ bằng Redis `DECRBY` theo đợt, kiểm tra eKYC và giới hạn mỗi khách hoặc thiết bị, trả về voucher của khách kèm `expiresAt`.
  - Job tạo đợt mới theo `batch_schedule`.
  - `GET /me/vouchers?tab=all|ready|used|expired` trả thêm `usageType` và `serviceLink`.
  - POS `wallet/inquiry` trả coin và voucher theo `usage_type = NATCASH_STORE`, lọc theo chi nhánh.
- **Test:**
  - Collect đồng thời không vượt số lượng của đợt (theo mẫu `ConcurrentPointBurnTest`).
  - Collect không có eKYC bị từ chối.
  - Mỗi khách chỉ được 1 lượt.
- **CMS:** dựng lại form `VoucherManagementPage` theo VQ-04 (Figma 320:4236):
  - mục cách nhận, cách dùng, ngành hàng, 3 ngôn ngữ, đối tượng, khung xem trước;
  - bảng danh sách thêm cột Cách nhận / Cách dùng.
- **Partner portal:** `PartnerVouchersPage` hiện cách dùng và tồn kho mã đối tác.

### GĐ 2 · Webview: Store, My vouchers, Pay at counter (FE 4 ngày)
- **Khung chung trong `ui.tsx`:**
  - thanh tab dưới Home · Missions · Games · Vouchers;
  - header cam có ⋯ và ✕, trong đó ✕ gọi JSBridge `close`;
  - bảng More dạng overlay: Share Rewards, Language, Notification settings, Terms;
  - quy tắc Back: màn chi tiết thì lùi một bước, màn sau thao tác về gốc của luồng, màn gốc của tab về Loyalty Home.
- **Store (`Rewards.tsx`):**
  - 2 tab Store / My vouchers, thẻ danh sách theo chuẩn My vouchers;
  - viên lọc ngành hàng và bảng Filter (Sort, Where to use, How to get, Category, Partner search, Coins);
  - dải "Free to collect" cùng các trạng thái Collect / Collected / Locked / All gone.
- **Lấy voucher:**
  - Get voucher → popup Voucher added, Not enough coins, Sold out, Data pack added hoặc Activating.
  - Collect → toast "Saved to My vouchers · View".
- **My vouchers:**
  - tab All / Ready / Used / Expired;
  - My voucher details;
  - Use rẽ nhánh theo `usageType`.
- **Pay at counter (`UseCoins.tsx`):**
  - tab QR / Barcode, dãy số luôn hiện, tự làm mới 60 s, chỉ có ví nguồn;
  - không có công tắc coin;
  - có voucher chọn sẵn khi mở từ My voucher;
  - kết quả nhận qua push hoặc polling `GET /pay-codes/{id}/status`; không tự chuyển màn theo thời gian.
- **ONLINE:** mở deep link màn thanh toán dịch vụ của app Natcash qua JSBridge `openService(serviceLink, voucherId)`.

### GĐ 3 · Mission, check-in, mời bạn (BE 2 ngày, FE 2 ngày, CMS 1 ngày)
- **V35:** `campaign_rules.audience_role` (CUSTOMER, AGENT, SUPER_AGENT). Check-in là mission dạng Streak, chỉ hiện khi có chương trình. Invite là mission dạng Referral, lặp lại được.
- **API:** `GET /me/missions` lọc theo vai trò lấy từ JWT. Claim có hạn nhận.
- **FE:**
  - Danh sách mission, chi tiết mission (điều kiện, thanh tiến độ, hạn ghi ngày cố định), popup Claim.
  - Bỏ nút Check-in cố định. Route `/checkin` chỉ mở khi có chương trình.
- **CMS:** thêm ô "Who can join" vào Rule builder.

### GĐ 4 · Game points và Leaderboard (BE 3 ngày, FE 2 ngày, CMS 2 ngày)
- **V36:**
  - bảng `game_point_ledger` (user, source, pts, ngày);
  - bảng `game_point_rules` (source, công thức, trần ngày);
  - bảng `leaderboard_prizes` (board, hạng từ–đến, loại giải, giá trị, nhà tài trợ);
  - bảng `leaderboard_payouts` (tháng, hạng, trạng thái duyệt).
  - Tận dụng `GameMonthlyLeaderboardEntity` có sẵn.
- **Logic:**
  - Cộng pts khi game kết thúc (gồm cả `submit-result` của game đối tác có ký), có kiểm trần ngày.
  - Mua lượt chơi bằng coin không cộng pts.
  - Job 00:00 ngày 1: khóa kết quả, tạo payout chờ duyệt qua QT-04, sau đó gửi thông báo.
- **FE:** Game hub có Leaderboard theo pts, bảng Rules, Play history 4 tab (Prizes, Wheel, Mini games…).
- **CMS:** trang mới `LeaderboardPrizesPage` theo GM-10 (Figma 831:3).

### GĐ 5 · Home, banner, popup, ưu đãi gửi riêng, thông báo (BE 2 ngày, FE 2 ngày, CMS 2 ngày)
- **V37:** bảng `content_banners` (vị trí, i18n, deep link, nhóm khách, thời gian, thứ tự), `popup_rules` (ưu tiên, điều kiện, bật/tắt), `targeted_offers` (nhóm khách, voucher, kênh).
- **API:**
  - `GET /me/home` trả banner theo vị trí.
  - `GET /me/popup` trả tối đa 1 popup theo thứ tự ưu tiên, nhớ đã hiện trong 24 h và chỉ trong khung 08:00–20:00.
  - Gửi ưu đãi: đẩy vào inbox kèm push.
- **FE:**
  - Loyalty Home có header cam, banner và popup khi mở.
  - Inbox, chi tiết ưu đãi, ⚙ mở Notification settings.
  - Coins history có 3 tab Earned / Used / Expired.
- **CMS:** trang mới `BannersPopupsOffersPage` theo CN-06 (Figma 832:3).

### GĐ 6 · Agent / Super Agent (BE 3 ngày, FE 3 ngày)
- **SSO:** khi đổi ticket, tra loại tài khoản (BCCS/IAM) và ghi claim `role` vào JWT. Khi BCCS báo đổi loại tài khoản thì thu hồi token.
- **Màn Agent:**
  - AG-00 Home, AG-01b danh sách mission, AG-01 khách đã chăm sóc (có nút Remind), AG-04 chi tiết mission;
  - AG-05 popup đạt chỉ tiêu (tự hiện);
  - Vouchers và My vouchers.
- **Màn Super Agent:**
  - AG-10 Home, AG-02 Network, sheet Playbook, sheet chi tiết agent;
  - AG-11 Missions, AG-12 chi tiết mission.
- **API:** mở rộng `AgentLoyaltyController` cho network, remind (kênh gửi chờ Natcash chốt) và chi trả thưởng (AG-03 đã có trên CMS).

### GĐ 7 · Ngôn ngữ, hoàn thiện, kiểm thử (3 ngày)
- Chuỗi giao diện EN/FR/Kreyòl; nội dung lấy từ trường `i18n`. Bảng Language trong More.
- So từng màn với Figma bằng ảnh chụp ở khung 390×844.
- Chạy `./ci-local.sh`; viết unit test cho các logic mới (Collect, trần pts, chọn popup).
- Mở rộng k6 cho Collect đồng thời.
- Cập nhật `plan/project_status.md`.
- Cập nhật PTTK: bỏ LM-04, LM-17, thêm Cách nhận / Cách dùng, game pts, CN-06, Agent.

## 4. Thứ tự và phụ thuộc

GĐ 0 → GĐ 1 (schema voucher) → GĐ 2 (dựa trên API của GĐ 1). GĐ 3, 4, 5 làm song song sau GĐ 0. GĐ 6 cần claim vai trò trong SSO. GĐ 7 làm cuối.

Ước lượng: BE khoảng 18 ngày, FE khoảng 13 ngày, CMS khoảng 9 ngày. Với 1 BE, 1 FE web và 1 FE CMS song song: khoảng **4 tuần**, chưa tính tích hợp thật với Natcash.

## 5. Câu hỏi cần Natcash trả lời (chặn một phần)

| Câu hỏi | Chặn |
|---|---|
| Coin của Agent dùng chung ví với khách hay tách riêng? Có catalogue voucher riêng cho Agent không? | GĐ 6 |
| Agent dùng app Natcash (chuyển vai trò) hay app riêng? | GĐ 6, tab My rewards |
| Kênh gửi Remind của Agent (SMS / push / Zalo…) | GĐ 6 |
| Hạn mức PIN chính thức (đang tạm 2,000 HTG) | GĐ 0 (chỉ là tham số) |
| Giá trị pts từng nguồn và ngân sách giải tháng | GĐ 4 (CMS cấu hình được) |
| Deep link màn thanh toán dịch vụ của app Natcash và sự kiện báo kết quả thanh toán tại quầy | GĐ 2 |
| Tab Rewards / My rewards: nhúng webview tóm tắt hay làm native | Ngoài phạm vi webview hiện tại |

## 6. Tiến độ

**18/11 · nhánh `feature/webview-figma` · làm webview trước, backend để sau:**
- **Khung chung (`ui.tsx`):**
  - thanh tab dưới cho khách (Home · Missions · Games · Vouchers), Agent (Home · Missions · Vouchers) và Super Agent (thêm Network);
  - header cam trên các màn gốc của tab;
  - bảng More và bảng Language (EN/FR/Kreyòl);
  - toast, nút chuyển tab, thẻ danh sách chuẩn;
  - mọi màn căn giữa ở độ rộng 430 px; đã kiểm tra ở 320, 390 và 430 px.
- **Vouchers:**
  - Store có bộ lọc và dải "Free to collect"; Get voucher báo kết quả bằng popup, Collect báo bằng toast.
  - My vouchers có 4 tab và màn chi tiết.
  - Use rẽ nhánh theo `usageType`; màn hiện mã có tab QR / Barcode.
  - Đã bỏ chữ "Redeem".
- **Pay at counter (LM-17):**
  - tab QR / Barcode, chỉ có ví nguồn, không có công tắc coin;
  - có voucher chọn sẵn khi mở từ My voucher;
  - hạn mức PIN đọc từ tham số CMS.
  - Route `/use-coins` (LM-04) chuyển sang Store.
- **Loyalty Home:**
  - bỏ hàng icon nhanh và thẻ Invite ghim, đưa Game lên cao;
  - popup nhắc khi mở app (tạm tính ở client).
- **Missions:** chỉ hiện dải check-in khi CMS có cấu hình check-in.
- **Coins history:** 3 tab Earned / Used / Expired.
- **Đổi tên:** màn Inbox đổi thành Notifications.
- **Agent / Super Agent:**
  - các màn Home, Missions, chi tiết mission, Network (SA), Vouchers / My vouchers, popup AG-05 đạt chỉ tiêu;
  - playbook lấy từ API, gọi điện cho agent.
  - Thêm hàm chuyển đổi dữ liệu của `GET /agents/me`: API trả cấu trúc lồng nhau, trước đây màn Agent đọc sai.

**Cập nhật tiến độ tiếp theo (hoàn tất GĐ 0, GĐ 1, GĐ 2, GĐ 3, GĐ 4 & GĐ 5 — đủ 100% đầu màn hình CMS theo Figma 320:2):**
- **GĐ 0 & GĐ 1 (Voucher & POS):**
  - Đã có migration `V33`, `V34`, `VoucherService.collectVoucher` + lazy batch + unit test `VoucherFreeBatchTest`, CMS `VoucherManagementPage` theo VQ-04.
  - Bổ sung lọc `usage_type = NATCASH_STORE` và `branchScope` trong `RewardWalletService.inquiry` / `verifyQrToken` (kèm unit test `BE-13.8`).
  - Cập nhật `PartnerVouchersPage` (`src/partner-portal`) hiển thị cột Cách nhận (`acquireType`), Cách dùng (`usageType`) và tồn kho mã đối tác (i18n VI/EN/FR/HT).
- **GĐ 3 (Mission & Rule builder):**
  - Đã có `V35` (`audience_role` cho cả `loyalty_campaign_milestones` và `campaign_rule_conditions`), `MilestoneService`/`CampaignRuleEngineService` và Webview `Missions.tsx`.
  - Bổ sung ô chọn **"Who can join" (`audienceRole`: Customer / Agent / Super Agent)** vào cả bảng và dialog Milestone & Rule Builder trong CMS `CampaignMilestonesPage`.
- **GĐ 4 (Game points & Leaderboard):**
  - Thêm migration **`V36__game_points_and_leaderboard_prizes.sql`** (`game_point_rules`, `game_point_ledger`, `leaderboard_prizes`, `leaderboard_payouts`, thêm `board_type` cho `game_monthly_leaderboards` và seed luật + giải thưởng chuẩn Figma 18/11).
  - Bổ sung `GameLeaderboardService` & `GameLeaderboardController` trong `game-service`: cộng `game pts` theo nguồn có kiểm trần ngày, chặn cộng pts khi mua lượt bằng Coin (`coinPurchasedPlay = true`), 3 bảng `ALL / LEARNING / MINI_GAMES`, API thể lệ `/gamehub/v1/leaderboard/rules`, job chốt tháng 00:00 ngày 1 tạo `leaderboard_payouts` chờ duyệt QT-04 + API duyệt/từ chối, kèm unit test `GameLeaderboardServiceTest`.
  - Nối `GameHubService`, `LearningQuizService` và `LuckyWheelService` sang `GameLeaderboardService`.
  - Cập nhật Webview `Games.tsx` (`GM-01` Leaderboard theo `pts`, 3 tab `All / Learning / Mini games`, sheet `Rules ›` đọc từ API).
  - Tạo trang CMS mới **`LeaderboardPrizesPage` (`GM-10`)** + route `/games/leaderboard-prizes` + menu Header + i18n VI/EN/FR/HT.
- **GĐ 5 (Home, Banner, Popup & Targeted Offers · CN-06):**
  - Thêm migration **`V37__content_banners_popups_and_targeted_offers.sql`** (`content_banners`, `popup_rules`, `popup_impression_logs`, `targeted_offers`, kèm seed 4 luật ưu tiên popup + banner mẫu).
  - Bổ sung `ContentEngagementService` (`loyalty-common`) & `ContentEngagementController` (`campaign-service`): `GET /loyalty/v1/engagement/me/home` (banner theo vị trí, lịch & phân khúc), `GET /loyalty/v1/engagement/me/popup` (khung 08:00–20:00, cooldown 24h, ưu tiên 1→4), API quản trị CRUD và `POST /admin/targeted-offers/{id}/send` đẩy vào Inbox + Push log, kèm unit test `ContentEngagementServiceTest`.
  - Nối Webview `LoyaltyHome.tsx` gọi `GET /me/home` & `GET /me/popup` (hiển thị banner động + popup từ CMS, giữ fallback khi offline) và cập nhật CTA `Inbox.tsx` từ `/use-coins` sang `/rewards`.
  - Tạo trang CMS còn thiếu duy nhất **`BannersPopupsOffersPage` (`CN-06`)** với 3 tab Banners / Startup Popups / Targeted Offers, gắn route `/engagement/banners-popups`, menu Header và i18n VI/EN/FR/HT.

**Còn tiếp theo theo kế hoạch (GĐ 6 BE & GĐ 7):**
- **GĐ 6 (BE & SSO):** Claim `role` trong SSO JWT (thu hồi khi BCCS đổi loại tài khoản), mở rộng `AgentLoyaltyController` cho tiến độ từng agent trong mạng lưới và nút Remind.
- **GĐ 7:** Hoàn thiện i18n EN/FR/Kreyòl đọc từ `i18n_json`, chụp đối chiếu 390×844, chạy full `./ci-local.sh`, k6 Collect đồng thời, cập nhật `plan/project_status.md` và PTTK.
- **Phụ thuộc Natcash:** Deep link màn thanh toán dịch vụ (`ONLINE`), sự kiện báo kết quả thanh toán tại quầy, kênh gửi Remind.

## 7. Không làm trong đợt này
- Menu USSD (giai đoạn 2).
- QR tại cửa hàng để Collect (giai đoạn 2).
- Thay "points" bằng "coins" trong toàn bộ CMS: chỉ áp ở các form làm mới, phần còn lại theo bảng thuật ngữ trong Figma CMS section 0.
- Tích hợp thật 6 hệ thống Natcash (Tầng 2 trong `project_status.md`).
