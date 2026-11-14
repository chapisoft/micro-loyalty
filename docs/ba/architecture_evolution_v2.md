# ĐẶC TẢ KIẾN TRÚC NÂNG CẤP TOÀN DIỆN (ARCHITECTURE EVOLUTION BLUEPRINT V2.0)

## Hệ Sinh Thái Universal GameHub, Core Loyalty Đa Tiền Tệ (Point & Coin), Universal Campaign Engine và AI Intelligence

> **Vai trò biên soạn:** Kiến trúc sư trưởng dự án  
> **Đối tượng áp dụng:** Toàn bộ hệ sinh thái `micro-loyalty` ([5 Microservices Backend](../../src/service), [loyalty-common](../../src/lib/loyalty-common), [loyalty-cms](../../src/cms), [loyalty-webview](../../src/webview), [loyalty-partner-portal](../../src/partner-portal), [loyalty-sandbox](../../src/sandbox))  
> **Mục tiêu kiến trúc:** Chuyển dịch hệ thống từ mô hình tích/tiêu điểm và minigame đơn lẻ hiện tại sang **Nền tảng Trò chơi hóa Mở** kết hợp **Lõi Khách hàng Thân thiết Đa tiền tệ**, **Bộ máy Chiến dịch Phổ quát** và **Tầng Trí tuệ Nhân tạo Phân tích – Đề xuất**.

---

## 1. CHẨN ĐOÁN HIỆN TRẠNG KIẾN TRÚC VÀ KHOẢNG TRỐNG NGHIỆP VỤ

Qua rà soát toàn bộ cơ sở dữ liệu từ [V1__init_loyalty_core_schema.sql](../../src/lib/loyalty-common/src/main/resources/db/migration/V1__init_loyalty_core_schema.sql) đến [V17__add_partner_payment_holds_and_enhanced_clearing.sql](../../src/lib/loyalty-common/src/main/resources/db/migration/V17__add_partner_payment_holds_and_enhanced_clearing.sql), đối chiếu với định hướng giải pháp trình bày tại [Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf) cùng mã nguồn tầng nghiệp vụ tại [GameHubService.java](../../src/service/game-service/src/main/java/com/natcash/loyalty/game/service/GameHubService.java), [PointLedgerService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/ledger/service/PointLedgerService.java), [MilestoneService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/campaign/service/MilestoneService.java) và [AccountService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/account/service/AccountService.java), hệ thống cần hoàn thiện **12 khoảng trống kiến trúc cốt lõi** để đồng bộ 100% giữa Giải pháp Kinh doanh (11 phân hệ) và Thiết kế Kỹ thuật:

| Mã khoảng trống | Phân hệ liên quan | Hiện trạng trong mã nguồn & tài liệu cũ | Hạn chế khi triển khai thực tế | Định hướng nâng cấp Kiến trúc V2.0 |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | **Cổng GameHub (Tích hợp Nội bộ & Đối tác)** | Bảng `loyalty_games` và [GameHubService.java](../../src/service/game-service/src/main/java/com/natcash/loyalty/game/service/GameHubService.java) chỉ quản lý phiên chơi ngắn hạn 30 phút (`loyalty_game_sessions`) và nhận kết quả điểm số đơn lẻ cuối ván (`submitGameResult`). | Không lưu trữ được trạng thái tiến trình dài hạn của người chơi trong game (cấp độ, vật phẩm, nông trại, mảnh ghép). Chưa tách biệt chuẩn giao thức giữa game tự phát triển (1st-Party) và game đối tác bên thứ ba (3rd-Party Studio). | Thiết kế **Universal Game Integration Gateway**, bổ sung **Cloud Save / Player State Store**, phân tách rõ chế độ **Server-Authoritative** (game nội bộ) và **Federated Signed Event / Webhook** (game đối tác). |
| **GAP-02** | **Chuỗi Sự kiện → Hành động → Thành tích → Phần thưởng trong Game** | Chỉ ghi nhận kết quả thắng/thua cuối ván vào `loyalty_game_play_history` và quay xác suất đơn giản trên `loyalty_game_prizes`. | Không bắt được các hành động chi tiết phát sinh trong lúc chơi (hạ trùm, đạt chuỗi thắng, mời bạn, sưu tầm thẻ, vượt cấp). Thiếu hệ thống Thành tích đa bậc, Huy hiệu, Bộ sưu tập mảnh ghép và Bảng xếp hạng giải đấu. | Xây dựng **Game Telemetry & Event Ingestion Pipeline**, **Achievement & Badge Engine**, **Collection / Fragment Engine**, **Real-time Leaderboard Engine** và **Universal Loot / Reward Fulfillment Engine**. |
| **GAP-03** | **Mô hình Tiền tệ Thưởng (Điểm Hạng vs. Natcash Coin)** | Bảng `loyalty_accounts` tại [V1__init_loyalty_core_schema.sql](../../src/lib/loyalty-common/src/main/resources/db/migration/V1__init_loyalty_core_schema.sql) chỉ có `current_points` và `tier_points`. Sổ cái `loyalty_point_ledger` chỉ lưu một loại điểm duy nhất. | Không phân tách rõ **Điểm hạng (`TIER_POINT`)** dùng để gắn bó/xét hạng 12 tháng (không tiêu) và **Đồng Coin (`LOYALTY_COIN` / `Natcash Coin`, `1 Coin = 1 HTG`)** dùng để tiêu dùng tại Merchant liên minh, đổi Voucher và quà Natcom. | Thiết kế **Dual-Currency Wallet & Multi-Asset Ledger** (`TIER_POINT`, `LOYALTY_COIN` và hỗ trợ mở rộng `LOYALTY_POINT`) kết hợp bảng **Currency Expiration Buckets** quản lý hạn sử dụng theo lô `FIFO` tốc độ `O(1)`. |
| **GAP-04** | **Chu kỳ Đánh giá Hạng Thành viên** | [AccountService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/account/service/AccountService.java) chỉ có hàm `checkAndUpgradeTier` cộng dồn một chiều, không bao giờ giảm. | Thiếu quy tắc: đủ điểm lên hạng ngay (giữ hạng đến hết kỳ sau), không xuống hạng giữa kỳ, báo trước 30 ngày kèm số điểm thiếu, cuối kỳ xuống tối đa 1 hạng (không rơi thẳng về Silver) và cấp đặc quyền định kỳ. | Nâng cấp **Tier Lifecycle State Machine** hỗ trợ chu kỳ xét hạng 12 tháng theo năm dương lịch (`CALENDAR_YEAR` / `ROLLING_12M`), hệ số nhân chuẩn (`×1.0, ×1.1, ×1.25, ×1.5`), cảnh báo trước 30 ngày và hạ hạng mềm tối đa 1 bậc. |
| **GAP-05** | **Khai báo Nhiệm vụ / Sự kiện / Campaign** | Bảng `loyalty_campaign_milestones` và [MilestoneService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/campaign/service/MilestoneService.java) bị khóa cứng vào 4 chỉ số trong Enum `CampaignMetric` (`BILL_AMOUNT`, `TRANSACTION_COUNT`, `EARN_POINTS`, `GAME_SPINS`). | Không thể cấu hình động trên trang quản trị theo cấu trúc `KHI – NẾU – THÌ – GIỚI HẠN` cho mọi hành vi (nạp tiền, đóng hóa đơn điện, học xong 1 bài tiếng Anh, đổ xăng + đi siêu thị trong tuần, sinh nhật). | Thiết kế **Universal Declarative Campaign & Mission Engine** theo cấu trúc DSL 5 khối (`WHEN – WHO/WHERE – HOW – THEN – GUARD`), cho phép đội vận hành tự khai báo 100% nhiệm vụ mà không cần sửa code. |
| **GAP-06** | **Liên minh Merchant & Đồng tài trợ có trần** | `loyalty_acceptance_policies` mới hỗ trợ tỷ giá đổi điểm đơn lẻ tại từng đối tác và thu phí sàn MDR cố định. | Khi chạy nhiệm vụ chéo hoặc tiêu `Natcash Coin` tại nhiều Merchant (Trạm xăng, Siêu thị, Nhà thuốc, Nhà hàng, Điểm Agent), hệ thống chưa hỗ trợ đồng tài trợ có trần ngân sách riêng cho từng bên. | Mở rộng **Merchant Coalition Clearing Engine** hỗ trợ quy tắc đồng tài trợ có trần (`Co-Funding Split & Budget Cap`), thanh toán gộp (`Coin + Voucher`) và đối soát tự động cuối kỳ. |
| **GAP-07** | **AI Phân tích & Cá nhân hóa Kết hợp Data Lake** | Chưa có phân hệ thu thập đặc trưng hành vi người dùng, chưa kết nối với Data Lake của hệ thống Core Ví (`Natcash`) và Viễn thông (`Natcom`), chưa có mô hình phân khúc động. | Mọi người dùng đều nhìn thấy danh sách nhiệm vụ và ưu đãi giống hệt nhau; chưa tự động nhận diện nhóm *Khách mới (< 30 ngày)*, *Sắp rời bỏ (21 ngày không giao dịch)*, *Chi tiêu cao (sắp lên hạng)* và thời điểm gửi tốt nhất. | Xây dựng **Multi-Source Data Lake Connector** kết hợp **AI User Intelligence & Segmentation Engine**: Hợp nhất dữ liệu `Giao dịch ví + Hạng/Coin/Nhiệm vụ + Game/Học tập + Merchant hay dùng + Khu vực BTS` để cá nhân hóa ưu đãi. |
| **GAP-08** | **Trợ lý AI Lập chương trình, Cảnh báo Trùng & Đo lường Nhóm đối chứng** | Chỉ có thống kê số lượng bản ghi đơn giản trên CMS; chưa có cơ chế chia Nhóm đối chứng (`Control Group`) và chưa có Trợ lý AI tạo chương trình từ mục tiêu/ngân sách. | Đội vận hành không đo được ưu đãi có thực sự hiệu quả hơn so với không chạy (`Control Group`), mất nhiều thời gian cấu hình thủ công và dễ tạo trùng nhiệm vụ đang chạy gây lãng phí ngân sách. | Xây dựng **Control Group / Holdout Engine** và **AI Campaign Copilot & Conflict Detector**: Nhận mục tiêu ngôn ngữ tự nhiên, gợi ý cấu hình nhiệm vụ, ước tính chi phí, **cảnh báo trùng nhiệm vụ đang chạy** và đánh dấu giao dịch nghi gian lận. |
| **GAP-09** | **Phân hệ Đại lý & Tổng Đại lý (`Agent & Super Agent`)** | Tài liệu và mã nguồn hiện tại chỉ mới thiết kế cho khách hàng cá nhân (`End-User`), hoàn toàn chưa có phân hệ dành cho mạng lưới hơn `30.000+` điểm giao dịch `Agent` và `Super Agent`. | Không thể giao nhiệm vụ phát triển/chăm sóc khách hàng cho `Agent` (ví dụ: chăm sóc 100 khách/tháng nhận Voucher, Data GB hoặc thưởng tiền) và không đánh giá được chỉ tiêu mạng lưới của `Super Agent` (ngưỡng 50% chỉ tiêu). | Xây dựng **Agent & Super Agent Loyalty Module** (Phân hệ thứ 10): Quản lý cây phân cấp `Super Agent → Agent`, theo dõi KPI chăm sóc khách hàng, xét thưởng chỉ tiêu mạng lưới và tự động kích hoạt kịch bản hỗ trợ khi dưới ngưỡng. |
| **GAP-10** | **Cổng Đối tác Thương mại Đa chi nhánh (`Merchant Partner Portal`)** | Mới chỉ có `loyalty-cms` cho Admin nội bộ và `loyalty-sandbox` cho lập trình viên; chưa có cổng tự phục vụ dành riêng cho chủ thương hiệu và quản lý chi nhánh Merchant. | Đối tác như siêu thị `Delimart` không thể tự theo dõi khách mới/khách bán chéo từ liên minh, không xem được kết quả theo từng chi nhánh (`Pétion-Ville`, `Delmas 33`, `Cap-Haïtien`), không tự đề xuất được chương trình tại quầy hay quản lý nhân viên thu ngân. | Xây dựng **Merchant Partner Portal**: Hỗ trợ quản lý đa chi nhánh & nhóm sản phẩm, tự đề xuất chương trình tại cửa hàng (`In-Store Program Proposal`), quản lý ngân sách thưởng tháng, báo cáo theo chi nhánh và phân quyền nhân viên. |
| **GAP-11** | **Mảng Game Giáo dục (`EdTech`) & Chốt chặn Pháp lý Cổng Game** | Danh mục 13 game hiện tại chỉ gồm các minigame giải trí/may rủi ngắn hạn; tài liệu cũ còn mô tả việc bán lượt chơi và trả thưởng tiền mặt trực tiếp. | Thiếu trụ cột nội dung **Giáo dục** (*Ngoại ngữ tiếng Anh/Tây Ban Nha, tập đọc tiếng Kreyòl, kiến thức quản lý tiền*) giúp khách hàng quay lại ứng dụng mỗi ngày; việc bán lượt chơi/trả tiền mặt dễ vướng quy định pháp lý về trò chơi có thưởng. | Mở rộng Cổng Game theo **ma trận phân loại 2 chiều** (*Giải trí – Trí tuệ – Giáo dục* × *Miễn phí – Thu phí đối tác*), bổ sung **Micro-Learning & Quiz Engine**, và áp dụng quy tắc: **Loyalty không bán lượt chơi, không trả thưởng bằng tiền mặt**. |
| **GAP-12** | **Tích hợp `USSD *202#`, `Natcom BCCS`, `WSO2` & Nhắc nhở 3 Bên** | Tài liệu cũ chỉ mô tả kết nối qua `natcash-eu-api` và `loyalty-webview`; cơ chế chống làm phiền mới chỉ chặn 1 thông báo/ngày cho khách hàng. | Bỏ sót tập khách hàng dùng điện thoại phổ thông/offline qua **`USSD *202#`**, thiếu luồng cộng Data/Phút gọi tự động qua **`Natcom BCCS`**, thiếu định tuyến **`WSO2`**, thiếu giới hạn **3 thông báo/tuần + nút khách tự tắt**, và thiếu luồng cảnh báo tự động cho **Đội vận hành** & **Merchant**. | Thiết kế **6 đầu mối kết nối chuẩn Natcash** (`Core Ví`, `Mobile Service`, `WSO2`, `Natcom BCCS`, `USSD *202#`, `API đối tác`) xử lý ngoài luồng giao dịch chính, cùng **Hệ thống Nhắc nhở 3 Bên** và bộ lọc chống làm phiền 4 lớp. |

---

## 2. TRỤ CỘT 1: KIẾN TRÚC CỔNG GAME HOÀN CHỈNH (UNIVERSAL GAMEHUB PLATFORM)

### 2.1. Mô Hình Tích Hợp Đa Chế Độ (1st-Party Native Games & 3rd-Party Partner Games)

Để Cổng Game vừa vận hành mượt mà các trò chơi tự phát triển (13 minigame sẵn có và các game mở rộng trong tương lai), vừa cho phép các Game Studio bên thứ ba tích hợp nhanh chóng mà vẫn kiểm soát chặt chẽ an toàn tài chính, kiến trúc `Universal GameHub` phân chia thành **3 chế độ tích hợp chuẩn hóa (Integration Modes)** thông qua một hợp đồng giao tiếp thống nhất (**Game Manifest & Sandbox Contract**):

| Chế độ tích hợp | Mã định danh (`IntegrationMode`) | Đối tượng áp dụng | Cơ chế thực thi & Lưu trữ trạng thái | Cơ chế chống gian lận & Xác thực phần thưởng |
| :--- | :--- | :--- | :--- | :--- |
| **Chế độ 1: Game Nội bộ Máy chủ Quyết định** | `FIRST_PARTY_AUTHORITATIVE` | Các game may rủi, giải đố ngắn hạn tự phát triển (Vòng quay, Vé cào, Đập trứng, Lắc xúc xắc, Plinko, Leo tháp). | Giao diện dựng sẵn trên `loyalty-webview`. Toàn bộ kết quả rơi thưởng và tính điểm do `game-service` quyết định 100% bằng `SecureRandom` trước khi trả về trình duyệt diễn hoạt. | Tuyệt đối an toàn: Trình duyệt chỉ đóng vai trò hiển thị hiệu ứng đồ họa theo kết quả máy chủ đã chốt trong phiên. |
| **Chế độ 2: Game Nội bộ / Đối tác Nhúng Qua SDK & Cầu nối** | `HYBRID_WEBVIEW_SDK` | Các game kỹ năng, hành động, nuôi trồng hoặc game HTML5 của đối tác nhúng qua `iframe` / `Webview` sử dụng `gamehub-sdk.js` và `LoyaltyJSBridge`. | Game chạy trên CDN nội bộ hoặc CDN đối tác, gọi API `Cloud Save` để đọc/ghi trạng thái người chơi (`level`, `inventory`, `energy`) và bắn luồng sự kiện hành động (`Game Event Telemetry`) về GameHub. | Kiểm tra chữ ký phiên (`session_token`), kiểm tra tốc độ gửi sự kiện (`Rate & Velocity Limiter`), đối chiếu trần điểm số/thời gian chơi hợp lý (`Playtime Entropy Check`). |
| **Chế độ 3: Game Đối tác Độc lập Kết nối Máy chủ – Máy chủ** | `THIRD_PARTY_S2S_FEDERATED` | Các game quy mô lớn của đối tác có máy chủ Backend riêng (RPG, Chiến thuật, Nông trại mạng xã hội, Giải đấu trực tuyến). | Máy chủ Game Studio quản lý logic ván chơi nội bộ và đồng bộ các sự kiện trọng yếu (`LEVEL_UP`, `QUEST_COMPLETED`, `PURCHASE_REQUEST`, `MATCH_WON`) sang `game-service` / `partner-service` qua `Inbound S2S Webhook` có ký số `HMAC-SHA256`. | Xác thực khóa kép (`X-Api-Key` + `X-Signature`), kiểm tra `Idempotency-Key`, kiểm soát hạn mức ngân sách thưởng tối đa cấp cho từng đối tác (`Partner Reward Quota`). |

---

### 2.2. Kiến Trúc Chuỗi Xử Lý: Sự Kiện → Hành Động → Thành Tích → Phần Thưởng (Event → Action → Achievement → Reward Pipeline)

Thay vì gắn cứng logic trả thưởng vào từng trò chơi, toàn bộ Cổng Game được thiết kế lại theo kiến trúc hướng sự kiện (**Event-Driven Gamification Pipeline**) gồm 5 tầng tách biệt:

#### Tầng 1 — Chuẩn hóa Sự kiện & Hành động Trò chơi (`Game Telemetry & Action Schema`)

Mọi trò chơi (dù là tự làm hay của đối tác) khi tương tác với người dùng đều phát sinh các bản tin sự kiện chuẩn hóa (`GameActionEvent`) gửi về điểm cuối `/gamehub/v1/events/ingest` hoặc qua `Redis Streams`:

* **Nhóm sự kiện Phiên & Lượt chơi (`SESSION_LIFECYCLE`):** `GAME_STARTED`, `GAME_COMPLETED`, `TURN_CONSUMED`, `TURN_PURCHASED`, `ENERGY_RECHARGED`.
* **Nhóm hành động Kỹ năng & Tiến trình (`GAMEPLAY_ACTION`):** `SCORE_REACHED`, `LEVEL_CLEARED`, `COMBO_ACHIEVED`, `BOSS_DEFEATED`, `HIGH_SCORE_BROKEN`, `STREAK_WIN`.
* **Nhóm hành động Sưu tầm & Kinh tế trong Game (`IN_GAME_ECONOMY`):** `ITEM_COLLECTED`, `PUZZLE_PIECE_FOUND`, `CHEST_OPENED`, `ITEM_CRAFTED`, `CROP_HARVESTED` (cho game nông trại).
* **Nhóm hành động Xã hội & Tương tác (`SOCIAL_VIRAL`):** `FRIEND_INVITED`, `GIFT_SENT_TO_FRIEND`, `LEADERBOARD_TOP_RANKED`, `SHARE_RESULT`.

Cấu trúc bản tin `GameActionEvent` chuẩn hóa:

```json
{
  "eventId": "GEVT_20261113_9f8a7b6c",
  "tenantId": "TENANT_NATCASH",
  "gameCode": "FARM_DELI",
  "partnerCode": "STUDIO_INTERNAL",
  "externalUserId": "50937123456",
  "sessionToken": "GS_8899aabbccdd",
  "actionType": "CROP_HARVESTED",
  "actionValue": 1,
  "numericMetrics": {
    "score": 450,
    "combo": 5,
    "level": 12,
    "durationSeconds": 65
  },
  "attributes": {
    "cropType": "GOLDEN_COFFEE",
    "toolUsed": "MAGIC_WATERING_CAN",
    "difficulty": "HARD"
  },
  "clientTimestamp": 1794533096000,
  "signature": "a8f9c2e1..."
}
```

#### Tầng 2 — Lưu trữ Trạng thái Người chơi Đa thiết bị (`Player Cloud State & Inventory Store`)

Bổ sung bảng `loyalty_game_player_states` và `loyalty_user_collectibles` để giải quyết bài toán lưu trữ tiến trình cho cả game tự làm và game đối tác nhẹ (Serverless H5 Games):

* Lưu trữ cấp độ hiện tại (`current_level`), điểm kinh nghiệm trong game (`game_xp`), năng lượng/lượt chơi tích lũy, điểm cao nhất (`high_score`) và dữ liệu trạng thái tùy biến dạng `state_blob JSONB` (có kiểm soát kích thước tối đa 64KB và khóa lạc quan `version_etag` chống ghi đè khi mở trên 2 thiết bị).
* Quản lý **Túi đồ & Mảnh ghép (`User Inventory & Collectible Fragments`)**: Cho phép người chơi thu thập các mảnh ghép từ nhiều game khác nhau hoặc từ giao dịch thanh toán hóa đơn để hợp thành vật phẩm/giải thưởng lớn.

#### Tầng 3 — Bộ máy Thành tích, Huy hiệu & Bảng xếp hạng (`Achievement, Badge & Leaderboard Engine`)

Khi một `GameActionEvent` đi vào hệ thống, **Achievement Engine** tự động đối chiếu với danh mục thành tích (`loyalty_game_achievements`):

1. **Thành tích Đơn bậc & Đa bậc (Multi-Tiered Achievements):**
   * Ví dụ: Thành tích *"Cao Thủ Sút Phạt"* có 3 cấp độ: Đồng (Ghi 10 bàn → thưởng 50 Coin), Bạc (Ghi 50 bàn → thưởng 200 Coin + Huy hiệu Bạc), Vàng (Ghi 200 bàn → thưởng 1.000 Coin + 1 Voucher + Huy hiệu Vàng).
2. **Thành tích Liên Game (Cross-Game Meta Achievements):**
   * Ví dụ: *"Nhà Thám Hiểm Toàn Năng"* — Chơi ít nhất 3 tựa game khác nhau trong tuần và đạt tổng điểm ≥ 5.000.
3. **Thành tích Ẩn / Bất ngờ (Hidden / Easter Egg Achievements):**
   * Khuyến khích sự tò mò của người chơi (ví dụ: Thắng ván chơi ở giây cuối cùng hoặc mở rương đúng khung giờ 12:00).
4. **Bảng Xếp Hạng & Giải Đấu Thời Gian Thực (`Leaderboard & Tournament Engine`):**
   * Sử dụng `Redis Sorted Set` (`ZINCRBY` / `ZADD` với khóa `leaderboard:{tenantId}:{tournamentCode}:{period}`) để xếp hạng thời gian thực cho hàng triệu người chơi với độ trễ dưới 5ms, tự động chốt bảng và trao thưởng vào cuối ngày/tuần/mùa giải.

#### Tầng 4 — Bộ máy Phân phối Phần thưởng Phổ quát (`Universal Reward Fulfillment Engine`)

Khi người chơi hoàn thành ván chơi, hoàn thành bài học, mở khóa thành tích, ghép đủ bộ sưu tập hoặc lọt Top bảng xếp hạng, **Reward Fulfillment Engine** hỗ trợ trả thưởng theo **Gói phần thưởng đa tài sản (`RewardBundle`)** và **Bảng xác suất rơi đồ (`LootTable`)**:

* Hỗ trợ 6 loại phần thưởng chuẩn (tuân thủ nguyên tắc pháp lý **không trả thưởng trực tiếp bằng tiền mặt** từ quỹ Loyalty cho người chơi game):
  1. `LOYALTY_COIN` (`Natcash Coin` cộng tức thì vào Ví Coin, quy đổi `1 Coin = 1 HTG` khi tiêu tại Merchant hoặc đổi quà).
  2. `TIER_POINT` (Điểm xét thăng hạng hội viên).
  3. `VOUCHER` (Phát hành mã phiếu ưu đãi tự động vào kho quà).
  4. `TELCO_DATA_VOICE_PACK` (Gói dung lượng Data 4G `MB/GB` hoặc phút gọi cấp phát tự động qua `Natcom BCCS`).
  5. `GAME_TURN` (Cộng lượt chơi miễn phí cho game hiện tại hoặc game chỉ định).
  6. `COLLECTIBLE_ITEM` (Tặng mảnh ghép sự kiện hoặc huy hiệu độc quyền).
* Hỗ trợ cơ chế **Bảo hiểm Nhân phẩm (`Pity Timer / Guaranteed Drop`)**: Ví dụ sau 10 lần quay/mở rương chưa trúng giải hiếm, lần thứ 10 chắc chắn rơi phần thưởng cấp `RARE` hoặc `EPIC` để giữ chân người chơi.

---

### 2.3. Phân Loại Cổng Game Theo 2 Chiều, Phân Hệ Học Tập Tương Tác (`Micro-Learning & EdTech`) và Nguyên Tắc Kiểm Soát

Đồng bộ với thiết kế trình bày tại Slide 11 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), Cổng Game được định vị là **một cổng tích hợp tập trung duy nhất** phục vụ cả giải trí, rèn luyện trí tuệ và học tập hàng ngày:

#### 1. Ma trận Phân loại Trò chơi & Nội dung theo 2 Chiều (`Two-Dimensional Game Taxonomy`)

* **Chiều 1 — Phân loại theo Mục đích & Thể loại (`GameCategory`):**
  1. **`ENTERTAINMENT` (Giải trí):** Vòng quay may mắn (`Rewards Wheel`), đua xe, cờ Domino trực tuyến (`Jwètlakay`), game giải trí đối tác.
  2. **`PUZZLE_BRAIN` (Trí tuệ):** `2048 Natcash`, xếp khối, giải đố tư duy, thử thách điểm số hàng ngày (`Daily Challenge`).
  3. **`EDUCATION_LEARNING` (Giáo dục & Học tập):** Các ứng dụng/trò chơi học tập ngắn (`Micro-Learning` từ 2–5 phút/bài) giúp người dùng nâng cao kỹ năng mỗi ngày:
     * *Ngoại ngữ:* Học tiếng Anh giao tiếp hàng ngày (`English Daily` — 15 từ vựng/ngày), tiếng Tây Ban Nha cơ bản (`Spanish Start`).
     * *Tập đọc & Ngôn ngữ bản địa:* Học đọc và đánh vần tiếng Kreyòl Haiti (`Aprann Li — Learn to read in Kreyòl, step by step`).
     * *Kiến thức Tài chính Cá nhân (`Financial Literacy`):* Trắc nghiệm kỹ năng tiết kiệm, quản lý chi tiêu và sử dụng ví an toàn (`Money Smart — 5 quick questions about saving and paying`).
* **Chiều 2 — Phân loại theo Cơ chế Tài chính (`MonetizationModel`):**
  1. **`FREE_TO_PLAY` (Miễn phí):** Áp dụng cho toàn bộ mini game nội bộ và các trò chơi giáo dục/học tập; người dùng sử dụng lượt miễn phí định kỳ hoặc làm nhiệm vụ để chơi.
  2. **`PARTNER_MONETIZED` (Thu phí đối tác):** Áp dụng cho các tựa game chuyên sâu của đối tác tích hợp; khi người dùng nạp hoặc mua vật phẩm trong game đối tác, giao dịch thanh toán đi theo **luồng thanh toán ví hiện có** của đối tác với Core Ví.

#### 2. Sáu Lớp Dùng Chung của Cổng Game & Nguyên tắc Pháp lý Bất biến

Toàn bộ các trò chơi cắm vào Cổng Game đều thừa hưởng **6 lớp hạ tầng dùng chung**:

1. **Đăng nhập một lần (`Single Sign-On`):** Cấp vé phiên `session_ticket` tự động nhận diện người dùng ví, đối tác không phải xây dựng lại luồng đăng nhập.
2. **Quản lý Lượt chơi & Coin tập trung:** Đồng bộ số dư lượt chơi miễn phí và ví `Natcash Coin` xuyên suốt mọi trò chơi.
3. **Nhiệm vụ & Bảng xếp hạng chung:** Mọi hành vi trong game hoặc hoàn thành bài học đều tự động kết nối vào hệ thống Nhiệm vụ (`Missions`) và Bảng xếp hạng.
4. **Chống gian lận tập trung (`Centralized Anti-Cheat`):** Kiểm tra chữ ký phiên, tốc độ gửi điểm và giới hạn trần phần thưởng.
5. **Quản lý Ngân sách thưởng có trần:** Mỗi trò chơi và mỗi sự kiện đều có trần ngân sách Coin/Voucher theo ngày và toàn kỳ.
6. **Báo cáo hiệu quả thống nhất:** Đo lường tần suất quay lại (`Retention`), thời gian tương tác và chi phí thưởng trên cùng một hệ thống số liệu.

> **Nguyên tắc kiểm soát pháp lý và rủi ro tài chính:** Dịch vụ Loyalty **không bán lượt chơi bằng tiền mặt** và **không trả thưởng trực tiếp bằng tiền mặt**. Toàn bộ phần thưởng từ Cổng Game là `Natcash Coin`, `Điểm hạng`, `Voucher` hoặc `Quà viễn thông Natcom`.

#### 3. Kiến trúc Động cơ Học tập Tương tác (`Micro-Learning & Quiz Engine`)

Để vận hành nhóm nội dung **Giáo dục (`EDUCATION_LEARNING`)** mà không phụ thuộc hoàn toàn vào bên thứ ba, `game-service` và `loyalty-webview` bổ sung mô-đun **Micro-Learning Engine**:

* **Cấu trúc Khóa học → Bài học → Thẻ tương tác (`Course → Lesson → Interactive Card`):**
  * Hỗ trợ 4 dạng câu hỏi tương tác trên giao diện di động:
    1. `AUDIO_WORD_MATCH`: Nghe phát âm chuẩn (`Listen`) kết hợp hình ảnh minh họa và chọn từ vựng đúng (ví dụ: nghe `/bæs.kɪt/` → chọn `Basket`).
    2. `SPEECH_PRONUNCIATION`: Bấm giữ nút `Say it` (sử dụng `Web Speech API` / `MediaRecorder` trên Webview) để luyện đọc từ vựng tiếng Anh/Kreyòl.
    3. `SCENARIO_QUIZ`: Câu hỏi tình huống quản lý tài chính 4 đáp án (ví dụ trong `Money Smart`: cách nhận biết cuộc gọi giả mạo nhân viên ví yêu cầu mã PIN).
    4. `FLASHCARD_STREAK`: Chuỗi ôn tập từ vựng/kiến thức theo ngày (`Day 1 → Day 7`).
* **Liên thông Sự kiện Học tập sang Động cơ Nhiệm vụ:**
  * Khi người dùng hoàn thành bài học với tỷ lệ trả lời đúng `≥ 80%`, hệ thống phát sinh sự kiện chuẩn hóa `LEARNING_LESSON_COMPLETED` (kèm `courseCode`, `lessonId`, `score`, `accuracyPct`).
  * `Universal Campaign Engine` tự động bắt sự kiện này để hoàn thành các nhiệm vụ như *"Học xong 1 bài tiếng Anh (+30 Coin)"* hoặc *"Hoàn thành bài học Money Smart 5 ngày liên tiếp"*.

---

## 3. TRỤ CỘT 2: KIẾN TRÚC CORE LOYALTY (ĐIỂM HẠNG & NATCASH COIN), LIÊN MINH MERCHANT VÀ UNIVERSAL CAMPAIGN ENGINE

### 3.1. Mô Hình Sổ Cái Kép Chuẩn Hóa: Điểm Hạng Để Gắn Bó – Natcash Coin Để Tiêu Dùng

Đồng bộ với mô hình trình bày tại Slide 8 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), Core Loyalty chuẩn hóa thành **2 đơn vị giá trị tách biệt rõ ràng** cho người dùng cuối (trong khi tầng CSDL vật lý vẫn hỗ trợ mở rộng đa tài sản `currency_type` cho các bên thuê bao khác):

| Thuộc tính | 1. Điểm Hạng (`TIER_POINT`) | 2. Đồng Xu Tiêu Dùng (`LOYALTY_COIN` / `Natcash Coin`) |
| :--- | :--- | :--- |
| **Vai trò cốt lõi** | **"Điểm hạng để gắn bó"** — Thước đo mức độ gắn bó của khách hàng để xét nâng hạng và duy trì hạng hội viên VIP (`Silver → Gold → Platinum → Diamond`). | **"Coin để tiêu"** — Đơn vị tiền tệ thưởng thanh khoản cao, quy đổi trực tiếp **`1 Coin = 1 HTG`** để tiêu dùng trong toàn mạng lưới liên minh. |
| **Nguồn tích lũy** | Phát sinh từ các giao dịch thanh toán hợp lệ trên ví, nạp cước viễn thông, thanh toán hóa đơn và hoàn thành nhiệm vụ gắn kết (ví dụ: Thanh toán 500 HTG → `+50 điểm hạng`). | Nhận từ hoàn thành **Nhiệm vụ (`Missions`)**, chơi **Game & Học tập**, hoặc giao dịch tại **Merchant liên minh** (nhân với hệ số hạng hội viên: ví dụ `+5 coin × hệ số hạng`). |
| **Mục đích sử dụng (Burn)** | **Chỉ tích lũy, không tiêu.** Không bị khấu trừ khi khách hàng đổi quà hay thanh toán tại điểm bán. | 1. Quét mã QR trả tiền trực tiếp tại Merchant liên minh (`1 Coin = 1 HTG`, có trần % trên mỗi hóa đơn).<br/>2. Đổi lấy Voucher giảm giá của đối tác.<br/>3. Đổi quà viễn thông Natcom (Gói Data 4G, phút gọi). |
| **Quy tắc chu kỳ & hết hạn** | Xét lại mỗi **12 tháng** (theo năm dương lịch). Đủ điểm là lên hạng ngay và giữ hạng mới đến hết kỳ sau. | Hết hạn sau **12 tháng kể từ ngày nhận** (hoặc cấu hình động 3–12 tháng theo chính sách từng chiến dịch), quản lý trừ lùi tự động theo lô `FIFO` gần hạn nhất. |
| **Hạch toán bù trừ tài chính** | Không phát sinh công nợ tiền mặt giữa các đối tác. | Hạch toán tự động vào sổ cái bù trừ đối soát `clearing_transactions` theo tỷ lệ đồng tài trợ (`Co-Funding Split`) giữa Merchant và Natcash. |

#### Thiết kế Quản lý Lô Hết hạn `FIFO` Tốc độ Cao (`loyalty_currency_buckets`):

Thay vì phải chạy câu lệnh quét toàn bộ lịch sử bảng `loyalty_point_ledger` mỗi đêm, mọi khoản cộng `LOYALTY_COIN` (hoặc `LOYALTY_POINT`) đều được gom nhóm theo **Ngày hết hạn (`expires_at`)** và **Nguồn phát hành / Tài trợ (`issuer_partner_id`)** trong bảng `loyalty_currency_buckets`:

* Khi người dùng tiêu Coin hoặc đổi quà: Hệ thống tự động trừ lùi (`remaining_amount`) từ các lô có `expires_at` gần nhất (`ORDER BY expires_at ASC`).
* Hệ thống tự động tính chính xác số lượng Coin sắp hết hạn trong 30 ngày tới (ví dụ hiển thị trên ứng dụng: *"150 Coin · Hết hạn 30/11 — Đổi quà trước khi hết hạn"*) và xác định chính xác 100% đơn vị phát hành gốc phải quyết toán cho đơn vị chấp nhận tiêu Coin.

---

### 3.2. Ma Trận Quyền Lợi 4 Hạng Hội Viên & Quy Tắc Bảo Hộ Không Rớt Hạng Giữa Kỳ (`Tier Lifecycle & Perks Engine`)

Đồng bộ chính xác với Slide 8 và Slide 9 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), hệ thống vận hành 4 hạng hội viên chính thức (`SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`) với ma trận quyền lợi và 5 quy tắc vận hành chuẩn hóa:

#### 1. Bảng Ma trận Quyền lợi theo Hạng Hội viên:

| Quyền lợi theo hạng | SILVER (Mặc định) | GOLD | PLATINUM | DIAMOND |
| :--- | :---: | :---: | :---: | :---: |
| **Tỷ trọng phân bố mục tiêu (từ dữ liệu thật)** | ~58% khách cơ bản | Khoảng **Top 30%** | Khoảng **Top 10%** | Khoảng **Top 2%** |
| **Hệ số nhân Coin từ nhiệm vụ (`coin_multiplier`)** | **`× 1.0`** | **`× 1.1`** | **`× 1.25`** | **`× 1.5`** |
| **Hạn mức dùng Coin tại Merchant (`merchant_burn_cap_bonus`)** | Chuẩn (ví dụ tối đa 30% hóa đơn) | Chuẩn | **`+10%`** (nâng trần dùng Coin) | **`+20%`** (nâng trần dùng Coin) |
| **Voucher riêng của Merchant (`exclusive_merchant_voucher`)** | Không áp dụng | Có | Có | **Ưu tiên** (Kho quà giới hạn VIP) |
| **Lượt chơi miễn phí định kỳ (`free_periodic_turns`)** | **1 lượt** | **2 lượt** | **3 lượt** | **5 lượt** |
| **Quà tặng dịp Sinh nhật (`birthday_benefit_pack`)** | Không áp dụng | **Voucher ưu đãi** | **Voucher + Coin thưởng** | **Gói quà đặc biệt VIP** |
| **Dịch vụ Chăm sóc khách hàng (`customer_care_level`)** | Tiêu chuẩn | Tiêu chuẩn | **Ưu tiên** | **Ưu tiên đặc biệt** |

#### 2. Năm Quy tắc Vận hành Vòng đời Hạng Hội viên (`Tier State Machine Rules`):

1. **Tự động là hội viên & Kỳ xét hạng 12 tháng:** Mọi người dùng ví Natcash tự động là hội viên hạng `SILVER` mà không cần đăng ký hay opt-in. Kỳ xét hạng kéo dài **12 tháng theo năm dương lịch** (ngưỡng điểm của từng hạng được tính từ phân vị dữ liệu giao dịch thực tế và giữ cố định trong suốt năm).
2. **Đủ điểm là lên hạng ngay (`Instant Upgrade & Next-Period Lock`):** Ngay tại giao dịch làm tổng `tier_points` trong kỳ chạm ngưỡng hạng mới, hội viên được thăng hạng tức thì và **được giữ hạng mới này suốt phần còn lại của năm hiện tại cộng thêm toàn bộ kỳ 12 tháng tiếp theo**.
3. **Không xuống hạng giữa kỳ (`Zero Mid-Cycle Downgrade`):** Trong suốt kỳ hiệu lực, dù tần suất giao dịch có giảm, khách hàng tuyệt đối không bị hạ hạng giữa kỳ để yên tâm sử dụng quyền lợi.
4. **Báo trước 30 ngày (`30-Day Pre-Evaluation Notice`):** Trước ngày chốt xét hạng cuối kỳ đúng **30 ngày**, hệ thống tự động tính toán số điểm hạng còn thiếu để giữ hạng hiện tại (`points_needed_to_retain`) và gửi thông báo nhắc nhở kèm gợi ý nhiệm vụ tăng tốc điểm hạng.
5. **Cuối kỳ xuống tối đa 1 hạng (`Soft Landing — Max 1 Tier Drop`):** Khi kết thúc kỳ xét hạng 12 tháng, nếu hội viên không đủ điểm duy trì hạng hiện tại (ví dụ đang ở `DIAMOND` hoặc `PLATINUM`), hệ thống **chỉ hạ tối đa 1 bậc liền kề** (`DIAMOND → PLATINUM`, `PLATINUM → GOLD`), tuyệt đối không rớt thẳng về `SILVER`.

---

### 3.3. Thiết Kế Hệ Thống Khai Báo Nhiệm Vụ / Sự Kiện / Campaign Phổ Quát (Universal Declarative Campaign & Mission Engine)

Để hiện thực hóa nguyên tắc trên Slide 7 (*"Mọi hành vi đều có thể thành nhiệm vụ — Trên trang quản trị, không cần sửa code: KHI → NẾU → THÌ → GIỚI HẠN"*), kiến trúc **Universal Campaign & Mission Rule Engine** chuẩn hóa cấu trúc luật **5 Khối Khai Báo (WHEN – WHO/WHERE – HOW – THEN – GUARD)** đáp ứng đầy đủ 9 nhóm kịch bản thực tế cho cả **Khách hàng** và **Mạng lưới Đại lý (`Agent & Super Agent`)**:

#### 1. Bảng phân loại 9 nhóm Nhiệm vụ / Sự kiện / Campaign thực tế được đáp ứng 100%:

| Nhóm hình thức triển khai | Kịch bản thực tế điển hình trên Slide & Thực địa | Cách cấu hình trên Universal Engine (Không cần sửa code) |
| :--- | :--- | :--- |
| **1. Nhiệm vụ Giao dịch Định kỳ (Recurring Payment Quests)** | Nạp tiền điện thoại 3 lần/tuần; Trả hóa đơn điện (`EDH`); Mua gói Data Natcom; Đổ xăng 3 lần nhận thưởng theo từng mốc (`Goal 1: +50, Goal 2: +50, Goal 3: +50`). | Đặt `reset_cycle = WEEKLY` hoặc `MONTHLY`, khai báo `step_rewards` cho từng mốc lần giao dịch `1, 2, 3`. |
| **2. Nhiệm vụ Chuỗi Điểm danh Liên tiếp (Streak & Check-in Missions)** | Điểm danh 7 ngày trong tuần (`Mon → Sun`) nhận quà cuối tuần (`Weekend Gift`); hỗ trợ dùng Coin khôi phục chuỗi nếu quên 1 ngày. | Đặt `aggregation_mode = CONSECUTIVE_PERIOD`, khai báo `step_rewards` cho từng mốc ngày 1..7 và cấu hình `streak_recovery_coin_cost`. |
| **3. Nhiệm vụ Kích hoạt Hành vi Mới (First-Time / Onboarding Quests)** | Lần đầu dùng QR thanh toán tại siêu thị (dành cho khách mở ví dưới 30 ngày): nhận ngay `+50 Coin`. | Đặt `trigger = POS_PAYMENT_SUCCESS`, bộ lọc `user_segment = NEW_USERS_30D`, `max_claims_lifetime = 1`. |
| **4. Nhiệm vụ Liên hoàn / Chéo Liên minh (Cross-Merchant Quest)** | **"Đổ xăng + đi siêu thị trong tuần: +100 Coin"** (Hai merchant cùng tài trợ theo tỷ lệ cấu hình). | Đặt `aggregation_mode = DISTINCT_MERCHANT_CATEGORY_SET`, `required_categories = [FUEL_STATION, SUPERMARKET]`, cấu hình `coFundingSplit`. |
| **5. Chiến dịch Cột mốc Chi tiêu Tháng (Tiered Spending Ladder)** | Chi tiêu hàng tháng (`Monthly spending: 2,200 / 5,000 HTG`): đạt Mốc 1 nhận `+50 Coin`, Mốc 2 nhận `+100 Coin`, Mốc 3 nhận `+200 Coin`. | Khai báo mảng `milestones[]` dùng chung bộ đếm tích lũy `SUM(bill_amount)` trong kỳ tháng. |
| **6. Nhiệm vụ Chơi Game Đạt Điểm (Game Challenge Missions)** | **"Chơi 2048 đạt 1.000 điểm"** trong thử thách hàng ngày (`Daily Challenge`) nhận `+50 Coin`. | Đặt `trigger = GAME_SCORE_SUBMITTED`, `game_code = 2048_NATCASH`, điều kiện `score ≥ 1000`. |
| **7. Nhiệm vụ Học tập & Giáo dục (`Micro-Learning Quests`)** | **"Học xong 1 bài tiếng Anh"** (`English Daily`), hoàn thành 1 bài tập đọc tiếng Kreyòl (`Aprann Li`) hoặc vượt qua 5 câu hỏi quản lý tiền (`Money Smart`). | Đặt `trigger = LEARNING_LESSON_COMPLETED`, điều kiện `accuracyPct ≥ 80`, thưởng `LOYALTY_COIN` + `TIER_POINT`. |
| **8. Chiến dịch Chăm sóc Vòng đời & Sinh nhật (Lifecycle & Win-back)** | Tặng quà tuần **Sinh nhật**; hoặc nhiệm vụ **Khách sắp rời bỏ** (*"Lâu rồi không gặp! Nạp tiền tuần này được ×2 Coin"* cho khách không giao dịch 21 ngày). | Đặt `trigger = BIRTHDAY_WEEK` hoặc nhắm mục tiêu `includedUserSegments = [AT_RISK_INACTIVE_21D]` với công thức `MULTIPLIER(2.0)`. |
| **9. Nhiệm vụ Mạng lưới Đại lý (`Agent & Super Agent Missions`)** | • **Agent:** Chăm sóc thành công 100 khách/tháng → thưởng Voucher, Data (GB) hoặc thưởng tiền hoa hồng.<br/>• **Super Agent:** Đạt từ 50% chỉ tiêu mạng lưới → được xét thưởng; dưới ngưỡng kích hoạt kịch bản hỗ trợ. | Đặt `actor_type = AGENT` hoặc `SUPER_AGENT`, `trigger = AGENT_MONTHLY_KPI_EVALUATED`, liên kết với động cơ `AgentNetworkKpiService`. |

#### 2. Cấu trúc Đặc tả JSON DSL của Universal Campaign & Mission (`campaign_rule_dsl`):

Mỗi chương trình trong bảng `loyalty_campaigns` được định nghĩa tường minh qua cấu trúc JSONB có kiểm tra Schema nghiêm ngặt:

```json
{
  "dslVersion": "2.0",
  "campaignType": "CROSS_MERCHANT_QUEST",
  "resetPolicy": {
    "cycle": "WEEKLY",
    "timezone": "America/Port-au-Prince",
    "allowStreakFreeze": true,
    "streakFreezeCostCoins": 30
  },
  "when": {
    "eventTypes": ["POS_PAYMENT_SUCCESS", "IN_APP_BILL_PAID", "GAME_EVENT_INGESTED"]
  },
  "whoAndWhere": {
    "includedTiers": ["SILVER", "GOLD", "PLATINUM", "DIAMOND"],
    "includedUserSegments": ["POTENTIAL_LOYALISTS", "AT_RISK_HIGH_VALUE"],
    "allowedPartnerCodes": ["DELIMART_RETAIL", "NATCOM_TELECOM", "HIGHLANDS_FB"],
    "channels": ["POS_QR", "MOBILE_APP", "WEBVIEW"],
    "scheduleWindow": {
      "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
      "happyHours": [{"from": "08:00", "to": "22:00"}]
    }
  },
  "how": {
    "evaluationMode": "COMPOSITE_PIPELINE",
    "operator": "AND",
    "steps": [
      {
        "stepOrder": 1,
        "stepCode": "STEP_TOPUP",
        "titleKey": "campaign.step.topup_natcom",
        "eventType": "IN_APP_BILL_PAID",
        "partnerCode": "NATCOM_TELECOM",
        "aggregation": "SUM",
        "metricField": "billAmount",
        "operator": "GTE",
        "targetValue": 50.00
      },
      {
        "stepOrder": 2,
        "stepCode": "STEP_SHOPPING",
        "titleKey": "campaign.step.shop_delimart",
        "eventType": "POS_PAYMENT_SUCCESS",
        "partnerCode": "DELIMART_RETAIL",
        "aggregation": "COUNT",
        "metricField": "transactionId",
        "operator": "GTE",
        "targetValue": 1,
        "filterExpression": "billAmount >= 150.00"
      },
      {
        "stepOrder": 3,
        "stepCode": "STEP_PLAY_GAME",
        "titleKey": "campaign.step.play_any_game",
        "eventType": "GAME_EVENT_INGESTED",
        "aggregation": "COUNT",
        "metricField": "eventId",
        "operator": "GTE",
        "targetValue": 1
      }
    ]
  },
  "then": {
    "claimMode": "AUTO_GRANT_OR_MANUAL_CLAIM",
    "stepRewards": {
      "STEP_TOPUP": [{"assetType": "LOYALTY_COIN", "formula": "FIXED", "value": 20}],
      "STEP_SHOPPING": [{"assetType": "LOYALTY_POINT", "formula": "PERCENTAGE_OF_METRIC", "value": 5.0, "maxCap": 100}]
    },
    "completionRewards": [
      {"assetType": "LOYALTY_COIN", "formula": "FIXED", "value": 200},
      {"assetType": "TIER_POINT", "formula": "FIXED", "value": 50},
      {"assetType": "VOUCHER", "voucherCode": "VCHR_DELI_50HTG", "quantity": 1},
      {"assetType": "GAME_TURN", "gameCode": "LUCKY_WHEEL_NATCASH", "quantity": 2}
    ]
  },
  "guardrails": {
    "maxClaimsPerUserPerCycle": 1,
    "maxClaimsPerUserLifetime": 4,
    "cooldownSecondsBetweenProgress": 60,
    "totalBudgetCoins": 500000.00,
    "totalBudgetPoints": 200000.00,
    "dailyBudgetCapCoins": 25000.00,
    "coFundingSplit": {
      "PLATFORM": 40.0,
      "ISSUER_MERCHANT": 60.0
    }
  }
}
```

---

### 3.4. Liên Minh Merchant Chấp Nhận Quy Đổi & Sử Dụng Điểm / Coin (`Coalition Redemption & Co-Funding Network`)

Mở rộng phân hệ Liên minh Đối tác ([PartnerPaymentGatewayService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/wallet/service/PartnerPaymentGatewayService.java) và [ClearingSettlementService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/clearing/service/ClearingSettlementService.java)) theo đúng 3 cơ chế liên minh trên Slide 10 (*"Tích ở nơi này, tiêu ở nơi khác"*):

1. **Cơ chế 01 — Tích ở đây, tiêu ở kia (`Earn Anywhere, Burn Anywhere`):**
   * Khách hàng tích lũy `Natcash Coin` từ Trạm xăng, Siêu thị, Natcom, Nhà hàng, Nhà thuốc, Điểm Agent và tự do dùng `Natcash Coin` (`1 Coin = 1 HTG`) để giảm trừ trực tiếp vào hóa đơn quét mã QR tại bất kỳ điểm chấp nhận nào trong mạng lưới hoặc đổi lấy Voucher riêng của từng Merchant.
   * Mỗi Merchant cấu hình trần giảm giá bằng Coin trên mỗi đơn hàng (ví dụ: chuẩn `30%`, hạng `PLATINUM` được cộng thêm `+10%`, hạng `DIAMOND` được cộng thêm `+20%`).
2. **Cơ chế 02 — Nhiệm vụ chéo Liên minh (`Cross-Merchant Quest`):**
   * Cho phép 2 hoặc nhiều Merchant thuộc các ngành hàng bổ trợ nhau cùng tạo nhiệm vụ liên hoàn (ví dụ: *"Đổ xăng + đi siêu thị trong tuần: +100 Coin"*), giúp khách hàng của trạm xăng trở thành khách hàng mới của siêu thị.
3. **Cơ chế 03 — Đồng tài trợ có trần & Đối soát tự động (`Capped Co-Funding & Automated Clearing`):**
   * Merchant góp ưu đãi hoặc ngân sách thưởng, Natcash ghi nhận Coin cho khách hàng.
   * Ngân sách đồng tài trợ của mỗi bên (`co_funding_budget_cap`) có giới hạn trần theo tháng/chiến dịch; khi chạm trần hệ thống tự động dừng phần tài trợ tương ứng. Cuối kỳ quyết toán, `ClearingSettlementService` tự động bù trừ công nợ ròng minh bạch giữa các bên.

---

### 3.5. Hệ Thống Nhắc Nhở 3 Bên (`Khách Hàng – Đội Vận Hành – Merchant`) & Quy Tắc Chống Làm Phiền 4 Lớp

Đồng bộ với thiết kế tại Slide 12 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), phân hệ Gợi nhắc & Truyền thông được nâng cấp từ mô hình chỉ gửi tin cho người dùng cuối sang **Kiến trúc Điều phối Nhắc nhở 3 Bên (`Tri-Party Notification & Alerting Hub`)**:

#### 1. Ma trận Kịch bản Nhắc nhở & Cảnh báo cho Cả 3 Bên:

| Đối tượng nhận | Nhóm kịch bản kích hoạt tự động (`Trigger Scenarios`) | Kênh truyền thông (`Delivery Channels`) | Mục đích vận hành |
| :--- | :--- | :--- | :--- |
| **1. Khách hàng (`Customer`)** | • **Coin / Voucher sắp hết hạn:** Cảnh báo trước hạn (ví dụ *"150 Coin · Dùng trước 30/11"*).<br/>• **Hạng hội viên:** Gợi nhắc khi sắp đủ điểm lên hạng mới (*"Còn 300 điểm hạng nữa là lên Platinum"*) hoặc báo trước **30 ngày** số điểm còn thiếu để giữ hạng.<br/>• **Nhiệm vụ cá nhân hóa mới:** Kích hoạt theo 3 nhóm trọng tâm:<br/>  - *Khách mới (Mở ví < 30 ngày):* *"Lần đầu quét QR tại siêu thị: nhận 50 Coin"*.<br/>  - *Sắp rời bỏ (Không giao dịch 21 ngày):* *"Lâu rồi không gặp! Nạp tiền tuần này được ×2 Coin"*.<br/>  - *Chi tiêu cao (Gold, sắp lên Platinum):* Hiển thị thẻ tiến độ trên Banner tab Rewards. | • Thông báo đẩy (`Push Notification`)<br/>• Tin nhắn `SMS`<br/>• Thẻ thông báo trong ứng dụng (`In-App Banner`) | Tăng tỷ lệ quay lại ứng dụng, thúc đẩy tiêu dùng Coin trước khi hết hạn và giữ chân khách hàng có nguy cơ rời bỏ. |
| **2. Đội vận hành (`Operations Team`)** | • **Cảnh báo ngân sách:** Ngân sách chương trình/chiến dịch tiêu thụ đạt ngưỡng **`80%`**.<br/>• **Cảnh báo hiệu quả kém:** Tỷ lệ chuyển đổi hoặc `GMV` của chương trình **thấp hơn nhóm đối chứng (`Control Group`)**.<br/>• **Cảnh báo trục lợi (`Fraud Alert`):** Phát hiện cụm tài khoản hoặc giao dịch/lượt chơi có dấu hiệu bất thường.<br/>• **Cảnh báo đối soát:** Phát sinh sai lệch số liệu trong kỳ đối soát bù trừ (`Reconciliation Mismatch`). | • Trang quản trị trung tâm (`loyalty-cms`)<br/>• Thư điện tử (`Email`) | Giúp đội vận hành kiểm soát rủi ro tài chính tức thời, dừng sớm các chương trình kém hiệu quả và xử lý gian lận. |
| **3. Đối tác Thương mại (`Merchant`)** | • **Kết quả đối soát định kỳ:** Thông báo hoàn tất bảng kê quyết toán kỳ và số tiền bù trừ ròng.<br/>• **Cảnh báo kho Voucher:** Số lượng mã Voucher do Merchant tài trợ sắp chạm ngưỡng cạn kho (`< 10%`).<br/>• **Cảnh báo sụt giảm khách quay lại:** Lượng khách hàng quay lại chi tiêu tại điểm bán giảm mạnh so với trung bình tháng trước. | • Cổng đối tác (`Merchant Partner Portal`)<br/>• Tin nhắn `SMS` | Giúp Merchant chủ động bổ sung kho Voucher, nắm bắt sức khỏe kinh doanh tại từng chi nhánh và đề xuất chương trình kích cầu kịp thời. |

#### 2. Quy tắc Chống làm phiền 4 Lớp đối với Khách hàng (`4-Layer Anti-Spam Guardrails`):

Mọi thông báo đẩy gửi tới khách hàng bắt buộc phải đi qua bộ lọc `NotificationFrequencyGuardService` kiểm tra đồng thời 4 điều kiện:

1. **Giới hạn theo Ngày (`Daily Cap`):** Tối đa **1 thông báo đẩy / ngày** trên mỗi khách hàng.
2. **Giới hạn theo Tuần (`Weekly Sliding Window Cap`):** Tối đa **3 thông báo đẩy / tuần** (7 ngày liên tiếp) trên mỗi khách hàng.
3. **Khung giờ thân thiện (`Quiet Hours Enforcement`):** Chỉ được phép gửi trong khung giờ **08:00 – 20:00** giờ địa phương; các bản tin phát sinh ngoài khung giờ được xếp vào hàng đợi chuyển sang sáng hôm sau.
4. **Quyền tự quyết của Khách hàng (`Customer Opt-Out Control`):** Cung cấp công tắc bật/tắt nhận thông báo nhắc nhở chương trình ngay trên giao diện `Rewards` của ứng dụng (`notification_opt_out = true/false`). Khi khách hàng tắt, hệ thống chỉ hiển thị thẻ âm thầm trong ứng dụng (`In-app`) mà không bắn Push/SMS.

---

## 4. TRỤ CỘT 3: TẦNG TRÍ TUỆ NHÂN TẠO PHÂN TÍCH NGƯỜI DÙNG & TỐI ƯU HÓA CAMPAIGN (AI INTELLIGENCE LAYER)

Để hệ thống không chỉ là công cụ ghi nhận thụ động mà trở thành **Bộ não Tăng trưởng Tự động (Autonomous Growth Engine)**, kiến trúc bổ sung phân hệ `AI Intelligence Layer` gồm 2 bộ máy chuyên biệt:

### 4.1. AI Phân Tích, Phân Loại Người Dùng Kết Hợp Data Lake Core Ví & Viễn Thông (`Data Lake Federated AI User Segmentation & Recommender`)

Điểm khác biệt chiến lược của hệ sinh thái `micro-loyalty` là không chỉ phân tích dữ liệu lịch sử tích/tiêu điểm nội bộ mà còn **liên kết trực tiếp với Data Lake của Core Ví điện tử (`Natcash`) và Mạng Viễn thông (`Natcom`)** để tạo lập bức tranh **Chân dung Khách hàng 360 độ (`Customer 360 Feature Store`)**.

#### 1. Kiến trúc Kết nối Liên hợp vào Data Lake Core Ví & Viễn thông (`Federated Data Lake Ingestion Architecture`)

Để đảm bảo nguyên tắc tách biệt cơ sở dữ liệu vận hành (không truy vấn trực tiếp vào `natcash_db` hay cơ sở dữ liệu tính cước Online Charging System của viễn thông gây ảnh hưởng hiệu năng giao dịch), phân hệ AI kết nối với **Data Lake / Lakehouse** của Core Ví và Viễn thông qua khung tích hợp đa nguồn (`DataLakeConnectorProvider`, khai báo động trong `loyalty_tenant_integrations`):

* **Luồng 1 — Đồng bộ Đặc trưng Hàng loạt từ Data Lake (`Batch & Micro-Batch Feature Sync Pipeline`):**
  * Hỗ trợ đa giao thức truy xuất Data Lake: `Trino / Presto SQL`, `ClickHouse HTTP/JDBC`, `Apache Iceberg / Parquet S3`, hoặc `REST Feature Gateway`.
  * Tiến trình `DataLakeFeatureSyncJob` (chạy định kỳ mỗi 4 giờ hoặc `T+1` ban đêm theo lô phân trang `Chunk 1.000 bản ghi`) trích xuất các chỉ số đã tổng hợp của thuê bao từ **Data Lake Core Ví** và **Data Lake Viễn thông**, hợp nhất với dữ liệu nội tại của `loyalty_db` vào bảng `loyalty_user_ai_profiles`.
* **Luồng 2 — Bắt Tín hiệu Ngữ cảnh Thời gian thực (`Real-Time Contextual Signal Stream`):**
  * Các sự kiện biến động tức thời từ Core Ví và Viễn thông được đẩy qua `Kafka / Redis Streams / Inbound Webhook` vào cụm Microservices Loyalty (`campaign-service` / `customer-service` / `partner-service`) để kích hoạt gợi ý chiến dịch ngay tại thời điểm phát sinh nhu cầu:
    * `TELCO_DATA_LOW_WARNING`: Dung lượng Data 4G/5G của thuê bao xuống dưới 100MB.
    * `TELCO_MAIN_BALANCE_LOW`: Tài khoản chính viễn thông sắp cạn (< 10 HTG).
    * `WALLET_REMITTANCE_RECEIVED` / `WALLET_CASH_IN_LARGE`: Khách hàng vừa nhận tiền kiều hối hoặc nạp tiền mặt lớn vào ví (thời điểm vàng có sẵn thanh khoản để chi tiêu).
    * `WALLET_BILL_DUE_SOON`: Đến kỳ thanh toán hóa đơn Điện lực (`EDH`), Nước (`DINEPA`) hoặc Internet hàng tháng.
* **Cơ chế Bảo vệ An toàn, Quyền riêng tư & Chịu lỗi (`Privacy-By-Design & Circuit Breaker`):**
  * Chỉ đồng bộ các **chỉ số đặc trưng hành vi đã tổng hợp (`Aggregated Feature Vectors`)**, tuyệt đối không lưu trữ dữ liệu nhạy cảm thô (như nội dung tin nhắn, chi tiết cuộc gọi `CDR`, số giấy tờ tùy thân gốc, mã `PIN` ví).
  * Áp dụng `Resilience4j Circuit Breaker`: Khi kết nối tới Data Lake bảo trì hoặc chậm, AI Engine tự động sử dụng bản chụp đặc trưng gần nhất (`Last-Known Snapshot`) tại `loyalty_db`, đảm bảo luồng người dùng trên App/Webview phản hồi dưới 50ms.

#### 2. Ma trận Đặc trưng Dữ liệu Hợp nhất 3 Nguồn: Core Ví + Viễn Thông + Loyalty (`Customer 360 Feature Matrix`)

Hệ thống hợp nhất 3 nguồn dữ liệu để tạo thành **Vector 6 nhóm đặc trưng `RFM-EWT`** cho từng người dùng:

| Nguồn dữ liệu | Nhóm chỉ số đặc trưng | Các trường dữ liệu trích xuất cụ thể | Ý nghĩa ứng dụng cho AI Phân loại & Đề xuất Campaign |
| :--- | :--- | :--- | :--- |
| **1. Data Lake Viễn Thông (`Telco Data Lake`)** | **`T` (Telecom Profile & Usage)** | • `telco_arpu_30d`, `telco_arpu_90d` (Cước bình quân tháng)<br/>• `sim_tenure_months` (Thâm niên dùng SIM)<br/>• `sub_type` (`PREPAID` / `POSTPAID`)<br/>• `data_usage_gb_30d` & `data_exhaustion_count` (Tần suất hết Data 4G/5G giữa kỳ)<br/>• `topup_freq_30d` & `preferred_topup_denomination`<br/>• `home_work_bts_cluster` (Cụm khu vực địa lý thường xuyên hoạt động theo trạm BTS) | • Nhận diện thuê bao `ARPU` cao nhưng chưa dùng Ví hoặc chưa tham gia Loyalty để tung gói đặc quyền VIP.<br/>• Người dùng hay hết Data giữa tháng → Tự động đề xuất nhiệm vụ hoặc đổi Điểm/Coin lấy gói `Data 4G/5G` tức thì.<br/>• Dựa vào `home_work_bts_cluster` để ưu tiên hiển thị các chiến dịch của Merchant bán lẻ/siêu thị nằm gần khu vực sinh sống của khách hàng. |
| **2. Data Lake Core Ví (`e-Wallet Data Lake`)** | **`W` (Wallet Liquidity & Financial Habits)** | • `wallet_kyc_tier` (`BASIC`, `FULL_EKYC`) & `wallet_tenure_days`<br/>• `avg_wallet_balance_30d` (Số dư ví bình quân)<br/>• `cash_in_volume_30d`, `p2p_transfer_count_30d`<br/>• `remittance_inflow_flag` (Có nhận kiều hối quốc tế)<br/>• `recurring_bill_types` (Danh sách hóa đơn Điện, Nước, Internet đang đóng hàng tháng và ngày đến hạn)<br/>• `qr_merchant_payment_ratio` (Tỷ lệ quét QR thanh toán so với rút tiền mặt) | • Phân biệt người dùng **"Có tiền sẵn trong ví nhưng ít tiêu tại Merchant"** (`High Balance – Low Merchant Spend`) để tung chiến dịch hoàn Coin kích cầu thanh toán QR.<br/>• Tự động tạo nhiệm vụ cá nhân hóa *"Thanh toán hóa đơn Điện/Nước đúng hạn nhận 100 Coin"* đúng vào ngày 15–20 hàng tháng của từng hộ gia đình.<br/>• Chuyển đổi người dùng chuyên rút tiền mặt tại đại lý sang thanh toán không tiền mặt tại siêu thị liên minh. |
| **3. Cơ sở dữ liệu Nội tại (`Loyalty & GameHub DB`)** | **`RFM-EG` (Loyalty & Gamification Behavior)** | • `recency_days`, `tx_count_30d`, `gmv_30d`, `aov_30d`<br/>• `current_points`, `current_coins`, `expiring_30d_amount`<br/>• `burn_to_earn_ratio` (Tỷ lệ tiêu trên tích lũy)<br/>• `cross_merchant_breadth`, `top_partner_categories`<br/>• `game_plays_30d`, `preferred_game_category`, `reward_elasticity_type` | • Đánh giá mức độ gắn kết với hệ sinh thái điểm thưởng, trò chơi hóa và độ nhạy cảm với từng loại phần thưởng (`Coin`, `Voucher`, `Data 4G` hay `Lượt quay`). |

#### 3. Phân loại Người dùng Động 10 Phân khúc Liên hợp (`Federated AI User Segments`)

Nhờ kết hợp dữ liệu từ Data Lake Core Ví và Viễn thông, thuật toán phân cụm (`Clustering + Gradient Boosted Propensity Scoring`) phân loại chính xác người dùng vào **10 Phân khúc Hành vi Chuyên sâu**:

1. **`TELCO_HIGH_ARPU_UNTAPPED` (VIP Viễn thông chưa kích hoạt Ví/Loyalty):** Cước viễn thông `ARPU` cao, thâm niên SIM > 2 năm nhưng ít giao dịch trên Ví hoặc chưa tiêu điểm tại Merchant → **Đề xuất:** Chương trình "Đặc quyền Thuê bao Vàng" tặng sẵn hạng Vàng tạm thời 30 ngày + nhiệm vụ thanh toán QR đầu tiên hoàn ngay 200 Coin.
2. **`WALLET_LIQUID_NON_SPENDERS` (Số dư Ví cao nhưng ít mua sắm Liên minh):** Thường xuyên nhận tiền P2P/kiều hối, `avg_wallet_balance_30d` cao nhưng chủ yếu rút tiền mặt, ít quét QR tại siêu thị/cửa hàng → **Đề xuất:** Chiến dịch hoàn Coin bậc thang khi quét QR tại Delimart/F&B để giữ dòng tiền ở lại trong hệ sinh thái.
3. **`DATA_HUNGRY_GAMERS` (Game thủ khát dung lượng Data 4G/5G):** Tiêu thụ Data 4G cao (`data_exhaustion_count ≥ 2 lần/tháng`) và tích cực chơi game trên GameHub → **Đề xuất:** Nhiệm vụ chuỗi chơi game + nạp tiền tự động thưởng gói `Voucher Data 4G 1GB` hoặc dùng Coin đổi trực tiếp lưu lượng Data.
4. **`UTILITY_BILL_REGULARS` (Khách hàng thanh toán hóa đơn định kỳ):** Đóng tiền điện, nước, cước trả sau đều đặn qua Ví mỗi tháng nhưng chưa mua sắm bán lẻ → **Đề xuất:** Nhiệm vụ liên hoàn (*"Đóng hóa đơn Điện/Nước → Nhận Voucher giảm 15% + nhân đôi Coin khi đi siêu thị cuối tuần"*).
5. **`CHAMPIONS_OMNICHANNEL` (Khách hàng VIP đa kênh):** Hoạt động mạnh trên cả Viễn thông, Ví điện tử và mạng lưới Merchant liên minh → **Đề xuất:** Nhiệm vụ duy trì hạng Kim Cương, ưu đãi đối tác cao cấp, không cần tốn ngân sách khuyến mại kích hoạt cơ bản.
6. **`POTENTIAL_TIER_CLIMBERS` (Tiềm năng thăng hạng):** Đạt 70%–95% điểm xét hạng tiếp theo và có số dư ví khả dụng tốt → **Đề xuất:** Nhiệm vụ tăng tốc điểm xét hạng (`Tier Point Booster x2`) trong 7 ngày cuối kỳ.
7. **`GAMER_COIN_HUNTERS` (Săn Coin qua Game nhưng ít mua hàng):** Chơi game và điểm danh mỗi ngày nhưng giá trị chi tiêu `GMV` thấp → **Đề xuất:** Nhiệm vụ cầu nối yêu cầu phát sinh 1 giao dịch thanh toán thực tế từ 50 HTG để mở khóa Rương Báu Hoàng Kim trong game.
8. **`PROMO_SENSITIVE_STRETCHERS` (Nhạy cảm khuyến mại):** Chỉ giao dịch khi có ưu đãi hoàn Coin → **Đề xuất:** Nhiệm vụ cá nhân hóa đặt ngưỡng hóa đơn mục tiêu bằng `1.25 × AOV` lịch sử để kéo tăng giá trị giỏ hàng.
9. **`HOARDERS_UNSPENT` (Tích trữ Điểm/Coin lớn chưa tiêu):** Tích lũy nhiều Điểm/Coin sắp đến hạn nhưng `burn_to_earn_ratio < 10%` → **Đề xuất:** Chiến dịch `Flash Burn` giảm 30% số Coin khi đổi Voucher hoặc đổi cước viễn thông.
10. **`AT_RISK_CHURN_MULTICHANNEL` (Nguy cơ rời bỏ trên cả Ví & Viễn thông):** Tần suất giao dịch Ví và lưu lượng Data/Thoại giảm mạnh đồng thời trong 14 ngày qua → **Đề xuất:** Kích hoạt khẩn cấp chiến dịch giữ chân tự động (`Win-back Mission`) tặng gói quà kép (Coin + Data 4G) khi thực hiện lại 1 giao dịch bất kỳ.

#### 4. Công thức Chấm điểm Đề xuất Chiến dịch Cá nhân hóa (`360-Aware Campaign Matching Score`)

Khi xếp hạng các chương trình/nhiệm vụ để hiển thị hoặc gửi thông báo cho từng người dùng, **Recommendation Engine** tính điểm tương thích có trọng số từ cả 3 nguồn dữ liệu:

```text
MatchingScore(User360, Campaign) = 
    w1 × SegmentAffinity(User360.primarySegment, Campaign.targetSegments)
  + w2 × WalletLiquidityFit(User360.avgWalletBalance, Campaign.requiredBillAmount)
  + w3 × TelcoNeedFit(User360.dataDepletionRisk, Campaign.hasTelcoDataReward)
  + w4 × GeoMerchantProximity(User360.btsCluster, Campaign.merchantLocations)
  + w5 × RewardTypePreference(User360.preferredReward, Campaign.rewardTypes)
  + w6 × TimingUrgencyBoost(User360.billDueDate, User360.expiringCoins)
```

Nhờ công thức này, hệ thống biết chính xác **ai đang có sẵn số dư trong ví**, **ai đang sắp hết Data 4G**, **ai sắp đến ngày đóng tiền điện**, và **ai đang ở gần siêu thị đối tác nào** để đề xuất chương trình có tỷ lệ chuyển đổi thực tế cao nhất!

---

### 4.2. AI Phân Tích Hiệu Quả Sự Kiện / Campaign & Gợi Ý Campaign Tiếp Theo (`AI Campaign Effectiveness Analyzer & Next-Campaign Copilot`)

#### 1. Bộ chỉ số Đo lường Hiệu quả Chiến dịch Đa tầng (`Campaign Telemetry & Attribution Matrix`)

Hệ thống tự động thu thập và tính toán bảng chỉ số hiệu quả cho từng chiến dịch/sự kiện (`loyalty_campaign_analytics_daily`):

* **Chỉ số Phễu Chuyển đổi (`Funnel Metrics`):**
  * `Impressions` (Số người dùng nhìn thấy) → `Participants` (Số người bắt đầu có tiến độ > 0) → `Step_N_Completions` (Số người qua từng bước) → `Full_Completions` (Số người hoàn thành 100%) → `Reward_Claimed` (Số người nhận thưởng) → `Post_Campaign_Retention_7d` (Tỷ lệ quay lại giao dịch sau khi chiến dịch kết thúc 7 ngày).
* **Chỉ số Hiệu quả Tài chính & Tăng trưởng (`Financial & Uplift Metrics`):**
  * `Total_Campaign_GMV`: Tổng giá trị giao dịch gắn với chiến dịch.
  * `Baseline_Expected_GMV`: Doanh số cơ sở trung bình của cùng tập người dùng trước chiến dịch.
  * `Incremental_GMV_Uplift = Total_Campaign_GMV - Baseline_Expected_GMV` (Doanh thu tăng thêm thực chất nhờ chiến dịch).
  * `Total_Reward_Cost_Fiat`: Tổng chi phí Điểm + Coin + Voucher đã phát hành quy đổi ra tiền tệ chuẩn.
  * `Net_ROAS = Incremental_GMV_Uplift ÷ Total_Reward_Cost_Fiat` (Tỷ suất sinh lời trên mỗi đồng ngân sách thưởng).
  * `Drop_Off_Hotspot`: Bước nhiệm vụ có tỷ lệ người dùng bỏ cuộc cao nhất (`max_dropoff_step_code`).

#### 2. Động cơ AI Chẩn đoán & Kiến tạo Chiến dịch Tiếp theo (`Next-Campaign AI Advisor & Generator`)

Dựa trên dữ liệu từ `loyalty_campaign_analytics_daily` và phân bố `loyalty_user_ai_profiles`, dịch vụ `AiCampaignIntelligenceService` thực hiện **3 bước tự động**:

1. **Bước 1 — Chẩn đoán Tự động (`Automated Post-Mortem & Live Diagnosis`):**
   * Phát hiện các bất thường của chiến dịch đang chạy hoặc vừa kết thúc:
     * *Cảnh báo rò rỉ ngân sách (`Cannibalization Alert`):* Chiến dịch tiêu hết 90% ngân sách Coin rất nhanh nhưng `Incremental_GMV_Uplift` thấp (do chỉ thưởng cho các giao dịch vốn dĩ khách hàng vẫn làm hàng ngày mà không nâng ngưỡng `min_bill_amount`).
     * *Cảnh báo rào cản quá cao (`Friction Alert`):* Tỷ lệ tham gia cao nhưng tỷ lệ hoàn thành dưới 10% tại Bước 2 do yêu cầu chi tiêu vượt quá 2.5 lần `AOV` của phân khúc mục tiêu.
     * *Cảnh báo lệch kênh/thời gian:* Nhóm người dùng mục tiêu hoạt động mạnh lúc 19:00–21:00 nhưng chiến dịch lại cấu hình khung giờ vàng 10:00–12:00.
2. **Bước 2 — Đề xuất Chiến dịch Tiếp theo (`Next-Best-Campaign Blueprint Generation`):**
   * AI tự động sinh danh sách **Đề xuất Chiến dịch Kế tiếp (`loyalty_ai_campaign_recommendations`)** cho Quản trị viên trên CMS với đầy đủ:
     * Lý do đề xuất dựa trên số liệu thực chứng (*Evidence-based Rationale*).
     * Phân khúc người dùng mục tiêu nên nhắm tới (ví dụ: Đang có 4.200 hội viên thuộc nhóm `POTENTIAL_TIER_CLIMBERS` cần thêm trung bình 180 điểm để lên hạng Vàng trong tháng này).
     * Cấu hình ngưỡng nhiệm vụ tối ưu (`Recommended Threshold` = `1.25 × AOV` của phân khúc) và cơ cấu thưởng Điểm/Coin tối ưu hóa `Net_ROAS`.
     * Bản nháp cấu hình `campaign_rule_dsl JSONB` hoàn chỉnh để Quản trị viên chỉ cần **1 chạm "Áp dụng tạo Chiến dịch"** (`One-Click Apply to Draft`).
3. **Bước 3 — Mô phỏng Trước khi Phát hành (`Pre-Launch Impact Simulator`):**
   * Trước khi kích hoạt một chiến dịch mới trên CMS, hệ thống chạy mô phỏng trên dữ liệu lịch sử 30 ngày gần nhất của tập khách hàng mục tiêu để dự báo:
     * Số lượng người dùng dự kiến tham gia và hoàn thành (`Estimated Reach & Conversions`).
     * Ngân sách Điểm và Coin dự kiến tiêu thụ (`Projected Point/Coin Burn`).
     * Doanh thu gia tăng kỳ vọng (`Projected Incremental GMV` & `Estimated ROAS`).

---

### 4.3. Bộ Máy Thử Nghiệm Nhóm Đối Chứng (`Control Group / Holdout Experimentation Engine`)

Để thực thi nghiêm ngặt nguyên tắc thứ 5 trên Slide 4 (*"Đo bằng đối chứng — Quyết định dựa trên số liệu"*) và Slide 12 (*"Nhóm đối chứng: Giữ ưu đãi hiệu quả, dừng ưu đãi kém"*), mọi chương trình nhiệm vụ và ưu đãi trên nền tảng đều tích hợp cơ chế phân tách **Nhóm Tác động (`Treatment Group`)** và **Nhóm Đối chứng (`Control Group`)**:

1. **Phân bổ Ngẫu nhiên Xác định Không Lệch (`Deterministic Hash Bucketing`):**
   * Khi một chương trình được cấu hình `control_group_pct` (mặc định `10%`, có thể cấu hình từ `5%` đến `20%`), hệ thống tính giá trị băm cho mỗi người dùng thuộc tập mục tiêu:

     ```text
     bucket = ABS(MurmurHash3_32(tenantId + ":" + campaignCode + ":" + externalUserId)) % 100
     ```

   * Nếu `bucket < control_group_pct` → Người dùng được gán vào `CONTROL_GROUP` (không nhìn thấy nhiệm vụ, không nhận thông báo nhắc nhở và không nhận thưởng của chương trình đó).
   * Nếu `bucket ≥ control_group_pct` → Người dùng được gán vào `TREATMENT_GROUP` (nhận đầy đủ nhiệm vụ, thông báo và phần thưởng).
2. **Đo lường Hiệu quả Gia tăng Thực chất (`True Incremental Uplift Calculation`):**
   * Hệ thống tự động theo dõi song song hành vi giao dịch của cả 2 nhóm trong suốt thời gian chạy chương trình:
     * `Treatment_Conversion_Rate` vs `Control_Conversion_Rate` (Tỷ lệ khách thực hiện hành vi mục tiêu, ví dụ nạp tiền điện thoại ≥ 3 lần).
     * `Avg_GMV_Per_Treatment_User` vs `Avg_GMV_Per_Control_User` (Doanh số giao dịch trung bình trên mỗi đầu người).
     * `True_Net_Uplift_GMV = (Avg_GMV_Per_Treatment_User - Avg_GMV_Per_Control_User) × Total_Treatment_Users`.
     * `Net_Incremental_ROAS = True_Net_Uplift_GMV ÷ Total_Reward_Coin_Cost`.
3. **Cơ chế Cảnh báo & Tự động Đề xuất Dừng Chương trình Kém:**
   * Nếu sau chu kỳ đánh giá tối thiểu (ví dụ 7 ngày và `≥ 500` người tham gia), `Avg_GMV_Per_Treatment_User ≤ Avg_GMV_Per_Control_User` hoặc `Net_Incremental_ROAS < 1.0`, hệ thống tự động phát cảnh báo ***"Chương trình kém hơn nhóm đối chứng"*** lên trang Quản trị (`loyalty-cms`) và gửi Email cho Đội vận hành để dừng hoặc điều chỉnh.

---

### 4.4. Trợ Lý AI Lập Chương Trình Nhanh Hơn & Phát Hiện Trùng Lặp (`AI Campaign Copilot & Conflict Detector`)

Đồng bộ 100% với thiết kế tại Slide 14 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), phân hệ **Trợ lý AI** (`AiCampaignCopilotService`) đóng vai trò công cụ hỗ trợ đội vận hành theo nguyên tắc quản trị cốt lõi: **"AI chỉ gợi ý. Con người duyệt và chịu trách nhiệm."**

1. **Vai trò 01 — Gợi ý chương trình từ mục tiêu và ngân sách (`Goal-to-Program Recommender`):**
   * Quản trị viên nhập mục tiêu kinh doanh bằng ngôn ngữ tự nhiên trên giao diện CMS, ví dụ: *"Tăng 20% giao dịch nạp tiền điện thoại trong tháng 12, ngân sách 300.000 HTG"*.
   * Trợ lý AI phân tích dữ liệu lịch sử nạp tiền trong `loyalty_user_ai_profiles` và sinh ra bản đề xuất có cấu trúc:
     * **Nhiệm vụ đề xuất:** Nạp tiền điện thoại `3 lần/tháng`, thưởng `+30 Coin` (kèm `+50 điểm hạng`).
     * **Nhóm khách hàng mục tiêu:** Khách đang nạp `1–2 lần/tháng`, chưa phát sinh giao dịch nạp trong tháng này.
     * **Giải thích lý do (`Explainable Rationale`):** Hiển thị rõ căn cứ số liệu lịch sử để người vận hành kiểm tra lại trước khi bấm nút **"Áp dụng"** hoặc **"Sửa"**.
2. **Vai trò 02 — Dự báo chi phí & Cảnh báo trùng nhiệm vụ trước khi chạy (`Pre-Launch Cost Forecaster & Conflict Detector`):**
   * **Dự báo ngân sách (`Budget Simulation`):** Ước tính chi phí thực tế trước khi chạy (ví dụ: *"Dự báo chi: ~240.000 HTG (80% ngân sách)"*) và cảnh báo ngay nếu cấu hình mức thưởng có nguy cơ vượt trần ngân sách.
   * **Thuật toán Phát hiện Trùng lặp & Chồng lấn Chiến dịch (`Campaign Overlap & Conflict Detection Engine`):**
     * Hàm `detectCampaignConflicts(draftCampaign)` tự động quét toàn bộ các chương trình đang ở trạng thái `ACTIVE` hoặc `SCHEDULED`:
       1. Giao thoa thời gian hiệu lực: `[draft.startDate, draft.endDate] ∩ [active.startDate, active.endDate] ≠ ∅`.
       2. Trùng sự kiện kích hoạt: `draft.triggerEventTypes ∩ active.triggerEventTypes ≠ ∅` (ví dụ cùng bắt sự kiện `TELECOM_TOPUP_SUCCESS`).
       3. Tỷ lệ chồng lấn tập người dùng mục tiêu (`Jaccard Similarity` của `targetSegments` và `allowedPartnerCodes` `≥ 25%`).
     * Khi phát hiện trùng lặp → Hiển thị cảnh báo đỏ: **"Cảnh báo: trùng 1 nhiệm vụ nạp tiền đang chạy"**, ngăn chặn trả thưởng kép ngoài ý muốn.
3. **Vai trò 03 — Phát hiện bất thường & Đánh dấu nghi gian lận (`Anomaly & Fraud Flagging`):**
   * Tự động đánh dấu các giao dịch hoặc lượt chơi nghi vấn trục lợi/gian lận (`FLAGGED_FOR_REVIEW`) và đẩy cảnh báo về trang quản trị để nhân sự vận hành kiểm tra.

---

## 5. TRỤ CỘT 4: PHÂN HỆ MẠNG LƯỚI ĐẠI LÝ (`AGENT & SUPER AGENT`), CỔNG ĐỐI TÁC (`MERCHANT PORTAL`) VÀ KIẾN TRÚC TÍCH HỢP 6 HỆ THỐNG NATCASH

Để hoàn thiện trọn vẹn **11 phân hệ trên một nền tảng** và mô hình **4 nhóm cùng có lợi** (*Khách hàng – Merchant liên minh – Đối tác tích hợp – Agent & Super Agent*) theo đúng Slide 2, 3, 6, 7, 10, 13, 15 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), kiến trúc bổ sung đặc tả chi tiết cho 3 mảng nghiệp vụ và hạ tầng kết nối dưới đây:

### 5.1. Kiến Trúc Phân Hệ Đại Lý & Tổng Đại Lý (`Agent & Super Agent Loyalty Engine` — Phân Hệ 10)

Tại thị trường Haiti, mạng lưới hơn **`30.000+` điểm giao dịch ủy quyền (`Agent / Pwen Natcash`)** và các **`Super Agent`** (Tổng đại lý phân phối vùng) là lực lượng tuyến đầu tiếp xúc trực tiếp với khách hàng. Phân hệ `Agent & Super Agent` biến mạng lưới đại lý thành động lực mở rộng và chăm sóc hội viên:

1. **Mô hình Phân cấp và Định danh Đại lý (`Agent Hierarchy & Identity`):**
   * Mỗi đại lý được định danh trong bảng `loyalty_agent_profiles` với phân loại `agent_role` (`AGENT`, `SUPER_AGENT`), mã kênh bán hàng (`agent_code` từ hệ thống Core Ví / BCCS), khu vực địa lý (`province_code`, `commune_code`, `bts_cluster_code`) và liên kết khóa ngoại `parent_super_agent_id` tạo cây phân cấp **`Super Agent (1) → Agent (N)`**.
2. **Cơ chế Nhiệm vụ và Trả thưởng cho `Agent` (`Frontline Agent Missions` — Slide 7):**
   * **Hành vi tính chỉ tiêu nhiệm vụ cho `Agent`:**
     * `AGENT_CUSTOMER_CARE_ACTIVE`: Chăm sóc khách hàng thành công trong tháng (khách hàng do Agent phát triển/hỗ trợ nạp tiền và phát sinh tối thiểu 2 giao dịch chi tiêu thực tế trong tháng).
     * `AGENT_NEW_WALLET_EKYC`: Mở mới và định danh `FULL_EKYC` thành công cho khách hàng mới.
     * `AGENT_QR_ONBOARDING`: Hướng dẫn khách hàng thực hiện giao dịch quét mã QR đầu tiên.
   * **Kịch bản chuẩn & Phần thưởng cho `Agent`:**
     * Nhiệm vụ: *"Chăm sóc thành công 100 khách/tháng"*.
     * Phần thưởng: Tặng **Voucher**, gói dung lượng **Data 4G (`GB`)** cộng trực tiếp vào số thuê bao Natcom của Agent qua `Natcom BCCS`; đối với một số nhiệm vụ phát triển trọng điểm có cấu hình `allow_agent_cash_payout = true`, hệ thống kiểm tra chống giao dịch vòng tròn (`Circular Wash Trading Check`) và phát lệnh thưởng tiền hoa hồng sang ví đại lý trên Core Ví.
3. **Cơ chế Đánh giá Chỉ tiêu Mạng lưới & Kịch bản Hỗ trợ cho `Super Agent` (`Network Quota & Support Playbook` — Slide 7):**
   * **Công thức tính tỷ lệ hoàn thành chỉ tiêu mạng lưới:**

     ```text
     NetworkAttainmentPct = (SUM(SubAgent.achievedMetric) ÷ SuperAgent.monthlyTargetMetric) × 100%
     ```

   * **Hai nhánh xử lý tự động theo ngưỡng 50% chỉ tiêu:**
     * *Nhánh Đạt Ngưỡng (`NetworkAttainmentPct ≥ 50%`):* Mở khóa trạng thái đủ điều kiện xét thưởng (`ELIGIBLE_FOR_REWARD`) cho `Super Agent` theo bậc thang hoàn thành.
     * *Nhánh Dưới Ngưỡng (`NetworkAttainmentPct < 50%` vào kỳ kiểm tra giữa tháng):* Tự động kích hoạt **Kịch bản Hỗ trợ (`Support & Coaching Playbook`)** — trích xuất danh sách các `Agent` tuyến dưới đang sụt giảm sản lượng và gửi cảnh báo kèm danh sách điểm nghẽn tới `Super Agent` và nhân viên quản lý địa bàn để hỗ trợ điểm bán kịp thời.

---

### 5.2. Kiến Trúc Cổng Đối Tác Thương Mại Đa Chi Nhánh (`Merchant Partner Portal`)

Đồng bộ với thiết kế giao diện `Delimart · Loyalty partner portal` trên Slide 13 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), hệ thống cung cấp phân hệ **Cổng Đối tác cho Merchant (`Merchant Partner Portal`)** tách biệt rõ quyền hạn với Trang Quản trị nội bộ (`loyalty-cms`):

1. **Bảng điều khiển Đối tác (`Partner Dashboard`):**
   * Hiển thị trực quan 3 cụm chỉ số kinh doanh theo thời gian thực cho chủ thương hiệu (ví dụ: `Delimart · All branches · November 2026`):
     * **Cụm Lưu lượng & Tiêu Coin:** Tổng số khách hàng thanh toán (`Paying customers`), tổng số giao dịch có dùng Coin (`Coin-use transactions`), số lượng khách hàng mới lần đầu đến cửa hàng (`New customers`), và chi phí ưu đãi đồng tài trợ trong kỳ (`Shared cost`).
     * **Cụm Ngân sách Thưởng Tháng (`Monthly Reward Budget`):** Thanh tiến độ theo dõi số tiền ngân sách đồng tài trợ đã dùng trên tổng hạn mức tháng (`Used / Limit`, ví dụ `40,000 / 100,000 HTG — 40% of budget · 60,000 HTG left`).
     * **Cụm Bán chéo Liên minh (`Alliance Cross-Sell`):** Số lượng khách hàng đến từ các đối tác khác trong liên minh (`Customers from other partners`), số khách hàng quay lại trong tháng (`Returning customers this month`) và tổng giá trị giao dịch bán chéo (`Transaction value`).
2. **Báo cáo Kết quả theo từng Chi nhánh (`Results by Branch`):**
   * Bảng phân tích chi tiết hiệu quả theo từng điểm bán vật lý (ví dụ: Chi nhánh `Pétion-Ville`, `Delmas 33`, `Cap-Haïtien`) với các cột: Tên chi nhánh (`Branch`), Số khách hàng (`Customers`), Lượng Coin đã tiêu (`Coin used`), Khách hàng mới (`New customer`), và Chi phí đồng tài trợ phân bổ (`Shared cost`).
3. **Đề xuất Chương trình tại Cửa hàng (`Propose an In-Store Program`):**
   * Cho phép chủ đối tác (`Partner Owner`) tự điền biểu mẫu đề xuất chương trình khuyến mại tại điểm bán (chọn chi nhánh áp dụng, nhóm sản phẩm, điều kiện hóa đơn tối thiểu, mức thưởng Coin hoặc Voucher, trần ngân sách tài trợ và thời gian chạy) → Đẩy sang `loyalty-cms` ở trạng thái `PENDING_APPROVAL` để Đội vận hành Natcash phê duyệt.
4. **Quản lý Chi nhánh, Nhóm sản phẩm & Tài khoản Nhân viên (`Branches, Product Groups & Staff Accounts`):**
   * Khai báo danh sách chi nhánh cửa hàng, tọa độ cụm `BTS`, mã thiết bị `POS / QR Terminal` và phân quyền 3 cấp nội bộ của Merchant: `PARTNER_OWNER`, `BRANCH_MANAGER`, `CASHIER_STAFF`.

---

### 5.3. Kiến Trúc Kết Nối 6 Hệ Thống Natcash & Nguyên Tắc Tích Điểm Ngoài Luồng Giao Dịch

Đồng bộ với sơ đồ kiến trúc trên Slide 13 ([Loyalty Natcash · Giải pháp & thiết kế.pdf](Loyalty%20Natcash%20%C2%B7%20Gia%CC%89i%20pha%CC%81p%20%26%20thie%CC%82%CC%81t%20ke%CC%82%CC%81.pdf)), nền tảng Loyalty kết nối chuẩn hóa với **6 hệ thống trong hạ tầng Natcash – Natcom** và tuân thủ nguyên tắc sống còn: **"Tích điểm nằm ngoài luồng giao dịch — Loyalty chậm hay dừng, ví vẫn chạy bình thường."**

| STT | Hệ thống kết nối | Giao thức & Cơ chế Tích hợp | Vai trò Nghiệp vụ Chi tiết trong Hệ sinh thái Loyalty |
| :---: | :--- | :--- | :--- |
| **1** | **`Core Ví` (`Natcash Core Wallet`)** | • **Luồng tích điểm (Bất đồng bộ 100%):** `Core Ví` đẩy bản tin sự kiện giao dịch vào Hàng đợi sự kiện (`Redis Streams / Kafka`) ngay sau khi đã trả kết quả giao dịch thành công cho khách.<br/>• **Luồng thanh toán/bù trừ:** REST API nội bộ có khóa `Idempotency-Key` và `Resilience4j Circuit Breaker`. | • Cung cấp nguồn sự kiện giao dịch gốc (nạp tiền, thanh toán hóa đơn, quét QR, kiều hối) để tính `Điểm hạng`, `Natcash Coin` và tiến độ nhiệm vụ.<br/>• Thực thi hạch toán quyết toán bù trừ định kỳ cho Merchant và chi thưởng hoa hồng cho `Agent`. |
| **2** | **`Mobile Service` (`natcash-eu-api`)** | • Reverse Proxy RESTful API & `SSO Session Ticket` (TTL 60s).<br/>• Nhận Webhook cập nhật hạng hội viên từ `Transactional Outbox`. | • Hiển thị thông tin hạng, số dư `Natcash Coin`, cảnh báo Coin sắp hết hạn và nhiệm vụ đang chạy ngay trên màn hình chính ứng dụng Natcash.<br/>• Mở Cổng Rewards, Nhiệm vụ và Cổng Game mượt mà không cần đăng nhập lại. |
| **3** | **`WSO2` (`WSO2 API Manager / ESB`)** | • Cổng quản trị và điều phối API tập trung (`OAuth2 Bearer Token` + `HMAC-SHA256` + `Mutual TLS`). | • Kiểm soát an ninh tập trung, định tuyến lưu lượng giữa vùng mạng nội bộ Natcash/Natcom và vùng DMZ đối tác.<br/>• Áp dụng chính sách giới hạn tần suất gọi (`Throttling / Rate Limiting`) và ghi nhật ký kiểm toán truy cập tập trung. |
| **4** | **`Natcom BCCS` (`Billing & Customer Care System`)** | • Giao thức `SOAP / REST Provisioning Gateway` qua `WSO2` với cơ chế hàng đợi thử lại tự động (`Outbox Retry`). | • **Cấp phát quà viễn thông tức thì:** Cộng trực tiếp dung lượng **Data 4G (`MB/GB`)**, **Phút gọi**, hoặc **Gói cước** vào tài khoản thuê bao di động khi khách hàng dùng `Natcash Coin` đổi quà Natcom hoặc khi `Agent` nhận thưởng nhiệm vụ.<br/>• Đồng bộ thông tin thuê bao trả trước/trả sau và thâm niên dùng mạng. |
| **5** | **`USSD *202#` (`Natcash / Natcom USSD Gateway`)** | • Giao thức `HTTP/XML` hoặc `JSON REST` siêu nhẹ qua `WSO2`, cam kết thời gian phản hồi **`P95 < 800ms`** để không làm đứt phiên USSD của nhà mạng. | • **Phục vụ khách hàng dùng điện thoại phổ thông (Feature Phone) hoặc khi không có kết nối Internet/4G:**<br/>  1. Giao dịch ví thực hiện qua `*202#` tự động đẩy sự kiện về Loyalty để cộng `Điểm hạng` & `Natcash Coin`.<br/>  2. Cung cấp nhánh menu USSD ngắn gọn (hỗ trợ 3 ngôn ngữ `Kreyòl / Pháp / Anh`, ≤ 160 ký tự/màn hình) cho phép khách hàng: **(a) Xem số dư Coin & Hạng**, **(b) Đổi Coin lấy gói Data/Phút gọi Natcom**, **(c) Đổi Coin lấy mã Voucher số tại siêu thị/trạm xăng**, **(d) Xem nhiệm vụ trong tuần**. |
| **6** | **`API Đối tác` (`B2B Partner & Game Studio API`)** | • RESTful API ký số khóa kép (`X-Api-Key` + `X-Signature HMAC-SHA256` + `X-Timestamp ±300s`) và `gamehub-sdk.js`. | • Kết nối máy `POS` siêu thị, trạm xăng, nhà thuốc để quét QR trừ `Natcash Coin` (`Hold/Capture` hoặc `Direct`).<br/>• Kết nối các đối tác nội dung đưa game giải trí, trí tuệ, giáo dục lên Cổng Game dùng chung. |

---

### 5.4. Kiến Trúc Tổng Thể 11 Phân Hệ Trên Một Nền Tảng (Đồng Bộ 100% Với Slide 13)

Toàn bộ nền tảng `micro-loyalty` được tổ chức chuẩn hóa thành **11 phân hệ nghiệp vụ** phân bố trong **4 nhóm chức năng**:

| Nhóm chức năng | Mã & Tên Phân hệ (11 Phân hệ chuẩn) | Thành phần Kỹ thuật & Dịch vụ phụ trách trong `micro-loyalty` |
| :--- | :--- | :--- |
| **I. Nhóm Khách hàng** | **1. Hội viên & hạng** | `AccountService`, `TierLifecycleEngine` (`loyalty_accounts`, `loyalty_tiers` — Tự động là hội viên, 4 hạng `Silver → Diamond`, xét hạng 12 tháng, báo trước 30 ngày, hạ tối đa 1 hạng). |
| | **2. Điểm hạng & coin** | `PointLedgerService`, `CurrencyBucketService` (`loyalty_point_ledger`, `loyalty_currency_buckets` — Điểm hạng để gắn bó, `Natcash Coin` `1 Coin = 1 HTG` để tiêu, quản lý hạn dùng `FIFO`). |
| | **3. Voucher & kho quà** | `VoucherCatalogService`, `TelcoRewardFulfillmentService` (`loyalty_vouchers`, `loyalty_voucher_redemptions` — Đổi Voucher merchant, đổi gói Data 4G/Phút gọi qua `Natcom BCCS`, mã vạch `Code128` & `QR`). |
| **II. Nhóm Tương tác** | **4. Nhiệm vụ & mốc** | `UniversalCampaignEngine`, `MilestoneService` (`loyalty_universal_campaigns`, `loyalty_user_campaign_states` — Khai báo động `KHI – NẾU – THÌ – GIỚI HẠN` không cần sửa code). |
| | **5. Cổng game** | `GameHubService`, `GameEventIngestionService`, `LearningQuizService` (`loyalty_games`, `loyalty_learning_lessons` — 1 cổng dùng chung cho *Giải trí, Trí tuệ, Giáo dục*; tích hợp 1 lần qua SDK/API). |
| | **6. Cá nhân hóa** | `EngagementNudgeService`, `NotificationFrequencyGuardService` (`loyalty_engagement_triggers`, `loyalty_communication_logs` — Ưu đãi theo nhóm khách, nhắc nhở 3 bên, chống làm phiền 1/ngày & 3/tuần, khách được tắt). |
| **III. Nhóm Merchant & Vận hành** | **7. Merchant liên minh** | `PartnerPaymentGatewayService`, `MerchantPortalService` (`loyalty_partners`, `loyalty_partner_branches`, `loyalty_merchant_program_proposals` — Tích nơi này tiêu nơi khác, nhiệm vụ chéo, đồng tài trợ có trần, Cổng đối tác đa chi nhánh). |
| | **8. Ngân sách & báo cáo** | `ClearingSettlementService`, `ControlGroupAnalyticsService` (`loyalty_clearinghouse_settlements`, `loyalty_campaign_analytics_daily` — Trần ngân sách từng chương trình, đo hiệu quả bằng nhóm đối chứng, đối soát tự động cuối kỳ). |
| | **9. Quản trị hệ thống** | `TenantIntegrationService`, `SystemAuditLogService` (`loyalty_tenant_integrations`, `system_audit_logs`, `webhook_outbox` — Cấu hình đa thuê bao, quản lý khóa B2B, kiểm toán bất biến). |
| **IV. Nhóm Đại lý & AI** | **10. Agent & Super Agent** | `AgentLoyaltyService`, `AgentNetworkKpiService` (`loyalty_agent_profiles`, `loyalty_agent_network_kpis` — Nhiệm vụ chăm sóc khách cho Agent, đánh giá ngưỡng 50% chỉ tiêu mạng lưới & kịch bản hỗ trợ cho Super Agent). |
| | **11. Trợ lý AI** | `UserSegmentationEngine`, `AiCampaignCopilotService`, `CampaignConflictDetector` (`loyalty_user_ai_profiles`, `loyalty_ai_campaign_recommendations` — Gợi ý chương trình từ mục tiêu & ngân sách, dự báo chi phí, cảnh báo trùng nhiệm vụ, đánh dấu nghi gian lận). |

---

## 6. THIẾT KẾ CƠ SỞ DỮ LIỆU MỞ RỘNG (DATABASE SCHEMA DESIGN — FLYWAY V18 ĐẾN V23)

Dưới đây là thiết kế chi tiết các bảng cơ sở dữ liệu cốt lõi bổ sung (tuân thủ chuẩn PostgreSQL 15+ của dự án) để hiện thực hóa đầy đủ toàn bộ 11 phân hệ trên:

### 6.1. Nhóm Bảng Đa Tiền Tệ (Điểm Hạng & Natcash Coin) và Lô Hết Hạn FIFO

#### 1. Mở rộng bảng `loyalty_accounts` và `loyalty_point_ledger`:

* Bổ sung cột quản lý số dư **Natcash Coin** (`current_coins NUMERIC(18,2)`, `lifetime_coins_earned NUMERIC(18,2)`), chu kỳ xét hạng 12 tháng (`tier_eval_date TIMESTAMPTZ`, `tier_maintenance_points NUMERIC(18,2)`, `tier_grace_until TIMESTAMPTZ`, `tier_locked_until_year INT`), và cờ tùy chọn nhận thông báo của khách hàng (`notification_opt_out BOOLEAN NOT NULL DEFAULT FALSE`) vào bảng `loyalty_accounts`.
* Bổ sung cột `currency_type VARCHAR(30) NOT NULL DEFAULT 'LOYALTY_COIN'` (`LOYALTY_COIN`, `TIER_POINT`) và `campaign_id BIGINT` vào bảng `loyalty_point_ledger`.

#### 2. Bảng Quản lý Lô Điểm & Coin theo Hạn Sử Dụng (`loyalty_currency_buckets`):

| STT | Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `BIGINT` | `PRIMARY KEY IDENTITY` | Khóa chính tự tăng. |
| 2 | `tenant_id` | `VARCHAR(50)` | `NOT NULL` | Mã định danh bên thuê bao. |
| 3 | `account_id` | `BIGINT` | `NOT NULL FK` | Tham chiếu tài khoản hội viên `loyalty_accounts(id)`. |
| 4 | `currency_type` | `VARCHAR(30)` | `NOT NULL` | Loại đơn vị thưởng: `LOYALTY_COIN` hoặc `TIER_POINT`. |
| 5 | `issuer_partner_id` | `BIGINT` | `FK NULLABLE` | Đối tác phát hành lô coin (phục vụ đối soát bù trừ chính xác). |
| 6 | `campaign_id` | `BIGINT` | `FK NULLABLE` | Chiến dịch sinh ra lô coin này (nếu có). |
| 7 | `initial_amount` | `NUMERIC(18,2)` | `NOT NULL` | Tổng số lượng điểm/coin ban đầu của lô. |
| 8 | `remaining_amount` | `NUMERIC(18,2)` | `NOT NULL` | Số dư còn lại khả dụng để tiêu hoặc quét hết hạn `FIFO`. |
| 9 | `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Thời điểm hết hạn của lô. |
| 10 | `status` | `VARCHAR(30)` | `NOT NULL` | Trạng thái lô: `ACTIVE`, `DEPLETED`, `EXPIRED`. |

---

### 6.2. Nhóm Bảng Universal GameHub & Micro-Learning (Trạng Thái, Sự Kiện, Thành Tích & Bài Học)

#### 1. Bảng Trạng thái Người chơi & Lưu trữ Đám mây theo Game (`loyalty_game_player_states`):

| STT | Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `BIGINT` | `PRIMARY KEY IDENTITY` | Khóa chính tự tăng. |
| 2 | `tenant_id` | `VARCHAR(50)` | `NOT NULL` | Mã định danh bên thuê bao. |
| 3 | `game_code` | `VARCHAR(100)` | `NOT NULL` | Mã trò chơi. |
| 4 | `external_user_id` | `VARCHAR(100)` | `NOT NULL` | Mã người dùng. |
| 5 | `current_level` | `INT` | `NOT NULL DEFAULT 1` | Cấp độ hiện tại của người chơi trong game. |
| 6 | `experience_points` | `BIGINT` | `NOT NULL DEFAULT 0` | Điểm kinh nghiệm tích lũy trong game. |
| 7 | `high_score` | `BIGINT` | `NOT NULL DEFAULT 0` | Kỷ lục điểm số cao nhất của người chơi. |
| 8 | `total_matches_played` | `INT` | `NOT NULL DEFAULT 0` | Tổng số ván đã tham gia. |
| 9 | `total_wins` | `INT` | `NOT NULL DEFAULT 0` | Tổng số ván thắng. |
| 10 | `state_blob` | `JSONB` | `NOT NULL DEFAULT '{}'` | Dữ liệu Cloud Save tùy biến của game (vật phẩm, bản đồ, nông trại). |
| 11 | `inventory_blob` | `JSONB` | `NOT NULL DEFAULT '[]'` | Danh sách mảnh ghép, đạo cụ trong game của người chơi. |
| 12 | `version_etag` | `BIGINT` | `NOT NULL DEFAULT 1` | Phiên bản chống ghi đè đồng thời (Optimistic Locking). |

#### 2. Bảng Nhật ký Sự kiện & Hành động Trong Game (`loyalty_game_action_events`):

| STT | Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `BIGINT` | `PRIMARY KEY IDENTITY` | Khóa chính tự tăng. |
| 2 | `tenant_id` | `VARCHAR(50)` | `NOT NULL` | Mã định danh bên thuê bao. |
| 3 | `event_id` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Mã định danh sự kiện duy nhất (Idempotency Key). |
| 4 | `game_code` | `VARCHAR(100)` | `NOT NULL` | Mã trò chơi phát sinh sự kiện. |
| 5 | `external_user_id` | `VARCHAR(100)` | `NOT NULL` | Mã người chơi. |
| 6 | `session_token` | `VARCHAR(100)` | `NULLABLE` | Mã phiên chơi (nếu phát sinh từ Client/Webview). |
| 7 | `action_type` | `VARCHAR(100)` | `NOT NULL` | Loại hành động (`LEVEL_UP`, `BOSS_DEFEATED`, `LESSON_COMPLETED`, `QUIZ_PASSED`...). |
| 8 | `action_value` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 1` | Giá trị định lượng của hành động. |
| 9 | `metrics_json` | `JSONB` | `NULLABLE` | Các chỉ số đi kèm (`score`, `combo`, `durationSeconds`...). |
| 10 | `rewards_granted_json` | `JSONB` | `NULLABLE` | Danh sách phần thưởng (Điểm hạng, Coin, Thành tích) đã kích hoạt từ sự kiện này. |
| 11 | `source_mode` | `VARCHAR(30)` | `NOT NULL` | Nguồn gửi: `INTERNAL_ENGINE`, `WEBVIEW_SDK`, `PARTNER_S2S_WEBHOOK`. |
| 12 | `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Thời điểm ghi nhận sự kiện. |

#### 3. Bảng Định nghĩa Thành tích (`loyalty_game_achievements`), Tiến độ Thành tích (`loyalty_user_achievements`) & Học tập (`loyalty_learning_lessons`):

* `loyalty_game_achievements` & `loyalty_user_achievements`: Lưu cấu hình thành tích (`achievement_code`, `game_code`, `category`, `tier_definitions_json`) và tiến độ thực đạt của từng người dùng (`current_value`, `unlocked_tier_level`, `unclaimed_tiers_json`).
* `loyalty_learning_lessons` & `loyalty_user_learning_progress`: Lưu danh mục khóa học và bài học ngắn 3–5 phút (`course_code`: `ENGLISH_DAILY`, `SPANISH_START`, `APRANN_LI`, `MONEY_SMART`, `lesson_order`, `quiz_questions_json`, `pass_score_pct`, `reward_coins`, `reward_tier_points`) cùng tiến độ hoàn thành và chuỗi ngày học liên tiếp (`learning_streak_days`) của từng học viên.

---

### 6.3. Nhóm Bảng Universal Campaign Engine, Nhóm Đối Chứng & AI Intelligence

#### 1. Bảng Định nghĩa Chiến dịch / Nhiệm vụ / Sự kiện Phổ quát (`loyalty_universal_campaigns`):

| STT | Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `BIGINT` | `PRIMARY KEY IDENTITY` | Khóa chính tự tăng. |
| 2 | `tenant_id` | `VARCHAR(50)` | `NOT NULL` | Mã định danh bên thuê bao. |
| 3 | `campaign_code` | `VARCHAR(100)` | `NOT NULL` | Mã chiến dịch duy nhất theo Tenant. |
| 4 | `campaign_name` | `VARCHAR(255)` | `NOT NULL` | Tên chiến dịch / nhiệm vụ / sự kiện. |
| 5 | `actor_type` | `VARCHAR(30)` | `NOT NULL DEFAULT 'CUSTOMER'` | Đối tượng áp dụng: `CUSTOMER`, `AGENT`, `SUPER_AGENT`, `MERCHANT`. |
| 6 | `campaign_archetype` | `VARCHAR(50)` | `NOT NULL` | Phân loại: `DAILY_MISSION`, `STREAK_CHECKIN`, `MULTIPLIER_BOOST`, `CROSS_MERCHANT_QUEST`, `MILESTONE_LADDER`, `REFERRAL_VIRAL`, `AGENT_CARE_QUOTA`, `SUPER_AGENT_NETWORK_QUOTA`. |
| 7 | `trigger_event_types` | `VARCHAR(500)` | `NOT NULL` | Danh sách mã sự kiện kích hoạt (đánh chỉ mục để lọc nhanh). |
| 8 | `target_segments` | `VARCHAR(500)` | `DEFAULT 'ALL'` | Các phân khúc AI được nhắm mục tiêu (`CHAMPIONS_VIP`, `AT_RISK_CHURN`...). |
| 9 | `control_group_pct` | `NUMERIC(5,2)` | `NOT NULL DEFAULT 10.0` | Tỷ lệ phần trăm tách vào Nhóm đối chứng (`Control Group` — mặc định `10%`). |
| 10 | `rule_dsl_json` | `JSONB` | `NOT NULL` | Toàn bộ cấu trúc luật `KHI - NẾU - THÌ - GIỚI HẠN` chuẩn DSL 2.0. |
| 11 | `total_coin_budget` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0` | Ngân sách Coin tối đa cấp cho chiến dịch. |
| 12 | `consumed_coin_budget` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0` | Ngân sách Coin đã sử dụng thực tế. |
| 13 | `total_point_budget` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0` | Ngân sách Điểm hạng tối đa cấp cho chiến dịch. |
| 14 | `consumed_point_budget` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0` | Ngân sách Điểm hạng đã sử dụng thực tế. |
| 15 | `priority_order` | `INT` | `NOT NULL DEFAULT 100` | Độ ưu tiên xét luật và hiển thị. |
| 16 | `stackable` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Cho phép cộng dồn thưởng với các chiến dịch khác hay độc quyền. |
| 17 | `start_date` | `TIMESTAMPTZ` | `NOT NULL` | Thời gian bắt đầu hiệu lực. |
| 18 | `end_date` | `TIMESTAMPTZ` | `NOT NULL` | Thời gian kết thúc hiệu lực. |
| 19 | `status` | `VARCHAR(30)` | `NOT NULL` | Trạng thái: `DRAFT`, `SCHEDULED`, `ACTIVE`, `PAUSED`, `COMPLETED`. |

#### 2. Bảng Trạng thái Tiến độ Chiến dịch Đa bước của Người dùng (`loyalty_user_campaign_states`):

* Quản lý tiến độ theo từng chu kỳ (`cycle_key`: ví dụ `2026-11-13` cho nhiệm vụ ngày, `2026-W46` cho nhiệm vụ tuần, `LIFETIME` cho chiến dịch toàn kỳ).
* Bổ sung cột `experiment_group VARCHAR(20) NOT NULL DEFAULT 'TREATMENT'` (`TREATMENT` hoặc `CONTROL_HOLDOUT`) để tách bạch người dùng nhận ưu đãi và người dùng thuộc nhóm đối chứng.
* Lưu trữ `step_progress_json JSONB` (tiến độ chi tiết của từng bước trong chuỗi nhiệm vụ liên hoàn), `streak_count INT`, `last_action_date DATE`, `claims_count INT`, `total_points_earned NUMERIC(18,2)`, `total_coins_earned NUMERIC(18,2)`.

#### 3. Bảng Hồ sơ Phân khúc AI (`loyalty_user_ai_profiles`) & Đề xuất Chiến dịch AI (`loyalty_ai_campaign_recommendations`):

* `loyalty_user_ai_profiles`: Lưu trữ các chỉ số `RFM-EG` (`recency_days`, `tx_freq_30d`, `gmv_30d`, `aov_30d`, `game_plays_30d`, `cross_merchant_count`), nhãn phân khúc chính (`primary_segment`), điểm nguy cơ rời bỏ (`churn_risk_score`), điểm tiềm năng nâng hạng (`upgrade_propensity_score`), loại phần thưởng ưa thích (`preferred_reward_type`), và danh sách mã chiến dịch được AI đề xuất (`recommended_campaign_codes_json`).
* `loyalty_ai_campaign_recommendations`: Lưu câu mục tiêu đầu vào (`prompt_goal_text`), bản phân tích hiệu quả so với nhóm đối chứng (`treatment_conversion_rate`, `control_conversion_rate`, `incremental_gmv_uplift`, `net_roas`), cảnh báo trùng lặp (`conflict_warnings_json`) và cấu hình đề xuất chiến dịch (`suggested_campaign_name`, `target_segment`, `expected_reach`, `forecast_cost_htg`, `draft_rule_dsl_json`, `status`).

---

### 6.4. Nhóm Bảng Đại Lý (`Agent & Super Agent`), Cổng Đối Tác (`Merchant Portal`) & Cảnh Báo Vận Hành

#### 1. Bảng Hồ sơ Đại lý & Cấp bậc Mạng lưới (`loyalty_agent_profiles`) và Chỉ tiêu Mạng lưới (`loyalty_agent_network_kpis`):

* `loyalty_agent_profiles`: Lưu trữ định danh Đại lý (`agent_code`, `msisdn`, `agent_role`: `AGENT` hoặc `SUPER_AGENT`, `parent_super_agent_code`, `province_zone`, `assigned_monthly_target_customers`, `status`).
* `loyalty_agent_network_kpis`: Lưu trữ kết quả thực hiện chỉ tiêu theo tháng (`cycle_month` dạng `YYYY-MM`, `cared_customers_count`, `new_ekyc_count`, `sub_agent_total_count`, `sub_agent_passed_count`, `network_attainment_pct`, `qualification_status`: `QUALIFIED_REWARD`, `BELOW_THRESHOLD_SUPPORT_TRIGGERED`, `commission_reward_htg`, `support_ticket_id`).

#### 2. Bảng Chi nhánh Đối tác (`loyalty_partner_branches`), Tài khoản Nhân viên (`loyalty_partner_staff_accounts`) & Đề xuất Chương trình (`loyalty_merchant_program_proposals`):

* `loyalty_partner_branches`: Quản lý danh sách cửa hàng/chi nhánh thuộc từng Merchant (ví dụ `Delimart` có `branch_code`: `DELIMART_PETION_VILLE`, `DELIMART_DELMAS_33`, `DELIMART_CAP_HAITIEN`, địa chỉ, tọa độ GPS, hạn mức ngân sách chi nhánh).
* `loyalty_partner_staff_accounts`: Quản lý tài khoản đăng nhập Cổng đối tác (`Merchant Partner Portal`) và nhân viên thu ngân POS theo phân quyền (`STORE_OWNER`, `BRANCH_MANAGER`, `POS_CASHIER`).
* `loyalty_merchant_program_proposals`: Lưu các đề xuất chương trình tại điểm bán do Merchant gửi từ `Merchant Partner Portal` (`partner_id`, `branch_scope_json`, `product_category_codes`, `proposed_coin_multiplier`, `merchant_cofund_pct`, `monthly_budget_cap_htg`, `approval_status`: `PENDING_REVIEW`, `APPROVED`, `REJECTED`).

#### 3. Bảng Cảnh báo Tự động 3 Bên (`loyalty_operational_alerts`):

* Lưu trữ và theo dõi trạng thái xử lý các cảnh báo gửi cho **Đội vận hành** (`BUDGET_REACHED_80_PCT`, `WORSE_THAN_CONTROL_GROUP`, `FRAUD_ANOMALY_DETECTED`, `RECONCILIATION_MISMATCH`) và **Merchant** (`SETTLEMENT_READY`, `VOUCHER_STOCK_LOW`, `RETURNING_CUSTOMER_DROP`).

---

## 7. LỘ TRÌNH HIỆN THỰC HÓA KỸ THUẬT (IMPLEMENTATION ROADMAP — 6 PHA)

Để triển khai nâng cấp toàn diện 11 phân hệ trên một nền tảng thống nhất mà không làm gián đoạn 67 ca kiểm thử tự động và các luồng hiện hữu, lộ trình phát triển được chia thành **6 Pha Kỹ Thuật Tuần Tự**:

| Pha triển khai | Hạng mục công việc trọng tâm | Thành phần thay đổi chính | Tiêu chí nghiệm thu (Definition of Done) |
| :--- | :--- | :--- | :--- |
| **Pha 1: Lõi Đa Tiền Tệ (Điểm Hạng & Natcash Coin) & Chu kỳ 4 Hạng** | • Tạo Migration `V18` bổ sung Ví `Natcash Coin` (`1 Coin = 1 HTG`), bảng lô hạn sử dụng `loyalty_currency_buckets` và chu kỳ xét hạng 12 tháng (`Silver ×1.0, Gold ×1.1, Platinum ×1.25, Diamond ×1.5`).<br/>• Nâng cấp `TierLifecycleEngine` đảm bảo đủ điểm lên hạng ngay, không hạ hạng giữa kỳ, báo trước 30 ngày và hạ tối đa 1 hạng. | • `V18__multi_currency_and_buckets.sql`<br/>• `PointLedgerService.java`<br/>• `TierLifecycleEngine.java` | • Tích điểm hạng, tích `Natcash Coin`, tiêu Coin (`1 Coin = 1 HTG`) chạy nguyên tử với khóa Redisson.<br/>• Quét hết hạn `FIFO` và xét hạng cuối năm chuẩn xác 100%. |
| **Pha 2: Universal GameHub & Học Tập Đổi Thưởng (`Micro-Learning`)** | • Tạo Migration `V19` cho `loyalty_game_player_states`, `loyalty_game_action_events`, `loyalty_game_achievements`, `loyalty_learning_lessons`.<br/>• Xây dựng 6 lớp dùng chung của `GameHub` và mô-đun Học tập (`English Daily`, `Spanish Start`, `Aprann Li`, `Money Smart`), khóa chặt quy tắc không bán lượt chơi và không trả thưởng tiền mặt. | • `V19__universal_gamehub_and_learning.sql`<br/>• `GameEventIngestionService.java`<br/>• `LearningQuizService.java`<br/>• `gamehub-sdk.ts` | • Game Giải trí, Trí tuệ, Giáo dục dùng chung 1 cổng và tích hợp 1 lần qua SDK/API.<br/>• Hoàn thành bài học 3–5 phút cộng thưởng tự động. |
| **Pha 3: Động cơ Nhiệm vụ Động (`KHI – NẾU – THÌ – GIỚI HẠN`) & Nhóm Đối Chứng** | • Tạo Migration `V20` cho `loyalty_universal_campaigns` (hỗ trợ `control_group_pct`) và `loyalty_user_campaign_states` (`experiment_group`).<br/>• Xây dựng `UniversalCampaignEngine` và bộ phân luồng `Control Group` bằng `MurmurHash3`. | • `V20__universal_campaign_and_control_group.sql`<br/>• `UniversalCampaignEngine.java`<br/>• `ControlGroupBucketingService.java` | • Khai báo động cả 9 nhóm nhiệm vụ trên CMS không cần sửa code.<br/>• Tách chính xác nhóm nhận ưu đãi và nhóm đối chứng để đo hiệu quả thực. |
| **Pha 4: Phân hệ `Agent & Super Agent` & Cổng `Merchant Partner Portal`** | • Tạo Migration `V21` cho `loyalty_agent_profiles`, `loyalty_agent_network_kpis`, `loyalty_partner_branches`, `loyalty_partner_staff_accounts`, `loyalty_merchant_program_proposals`.<br/>• Xây dựng luồng nhiệm vụ Agent (100 khách/tháng), Super Agent (ngưỡng 50% chỉ tiêu mạng lưới & kịch bản hỗ trợ) và giao diện `Merchant Partner Portal` đa chi nhánh. | • `V21__agent_network_and_merchant_portal.sql`<br/>• `AgentLoyaltyService.java`<br/>• `MerchantPortalService.java`<br/>• `MerchantPortalApp` (Frontend) | • Agent & Super Agent theo dõi tiến độ nhiệm vụ và nhận thưởng tự động.<br/>• Merchant xem báo cáo từng chi nhánh (`Pétion-Ville`, `Delmas 33`, `Cap-Haïtien`) và gửi đề xuất chương trình tại quầy. |
| **Pha 5: Kết nối `USSD *202#`, `Natcom BCCS` & Nhắc nhở 3 Bên** | • Tạo Migration `V22` cho `loyalty_operational_alerts` và bộ lọc chống làm phiền 4 lớp.<br/>• Xây dựng `UssdGatewayAdapter` (`*202#`), `NatcomBccsFulfillmentAdapter` (nạp Data GB/phút gọi tức thời) và `NotificationFrequencyGuardService` (tối đa 1 tin/ngày, 3 tin/tuần, 08:00–20:00, khách được tắt). | • `V22__ussd_bccs_and_triparty_alerts.sql`<br/>• `UssdLoyaltyController.java`<br/>• `NatcomBccsAdapter.java`<br/>• `NotificationFrequencyGuardService.java` | • Khách hàng tra cứu số dư/đổi quà qua `*202#` dưới 1,5 giây.<br/>• Chặn 100% thông báo vượt ngưỡng hoặc ngoài khung giờ 08:00–20:00. |
| **Pha 6: Trợ lý AI (`AI Campaign Copilot`) & Cảnh báo Trùng lặp** | • Tạo Migration `V23` cho `loyalty_user_ai_profiles` và `loyalty_ai_campaign_recommendations`.<br/>• Xây dựng `AiCampaignCopilotService` (nhập mục tiêu & ngân sách → gợi ý nhiệm vụ + dự báo chi phí) và `CampaignConflictDetector` (cảnh báo trùng nhiệm vụ đang chạy + đánh dấu nghi gian lận). | • `V23__ai_copilot_and_conflict_detector.sql`<br/>• `AiCampaignCopilotService.java`<br/>• `CampaignConflictDetector.java`<br/>• `AiCampaignCopilotModal.tsx` (CMS) | • Nhập mục tiêu trên CMS sinh ngay bản nháp nhiệm vụ, dự báo ngân sách và cảnh báo chính xác nếu trùng nhiệm vụ đang chạy; đảm bảo nguyên tắc AI gợi ý, con người duyệt. |
