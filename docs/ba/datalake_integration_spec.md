# ĐẶC TẢ DỮ LIỆU CUNG CẤP TỪ DATA LAKE CHO CORE LOYALTY KHAI THÁC

## Kiến Trúc Liên Hợp Dữ Liệu 360 Độ (Ví Điện Tử – Viễn Thông – Liên Minh Thương Mại)

> **Vai trò biên soạn:** Kiến trúc sư trưởng dự án  
> **Đối tượng áp dụng:** Hệ sinh thái `micro-loyalty` ([loyalty-service](../../src/service), [loyalty-cms](../../src/cms), [loyalty-webview](../../src/webview)) và Hệ thống Data Lake Trung tâm (`Natcash Core Wallet Data Lake`, `Natcom Telecom Data Lake`, `Coalition Retail Data Lake`)  
> **Tài liệu liên quan:** [architecture_evolution_v2.md](architecture_evolution_v2.md), [solution.md](solution.md), [detailed_design.md](detailed_design.md)

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC KIẾN TRÚC KẾT NỐI DATA LAKE

### 1.1. Mục tiêu nghiệp vụ

Để **Core Loyalty** chuyển dịch từ hệ thống ghi nhận điểm thưởng thụ động sang **Bộ máy Tăng trưởng Tự động**, hệ thống không thể chỉ dựa vào lịch sử tích/tiêu điểm nội bộ trong `loyalty_db`. Core Loyalty cần khai thác nguồn dữ liệu giàu ngữ cảnh từ **Data Lake** của Ví điện tử (`Natcash`), Mạng viễn thông (`Natcom`) và Mạng lưới đối tác liên minh nhằm giải quyết 7 bài toán cốt lõi:

1. **Định danh giá trị khách hàng từ ngày đầu (`Day-1 VIP Recognition`):** Nhận diện ngay các thuê bao viễn thông có cước `ARPU` cao hoặc người dùng ví có số dư lớn nhưng chưa từng tham gia Loyalty để cấp đặc quyền khởi tạo tương xứng.
2. **Cá nhân hóa ngưỡng nhiệm vụ và chiến dịch (`Dynamic Stretch Goal`):** Thiết lập mục tiêu chi tiêu trong nhiệm vụ bám sát giá trị giỏ hàng trung bình (`AOV`) và khả năng thanh khoản thực tế trong ví của từng cá nhân.
3. **Kích hoạt đúng thời điểm phát sinh nhu cầu (`Contextual Moment Marketing`):** Bắt tín hiệu tức thời khi khách hàng vừa nhận lương/kiều hối, sắp hết dung lượng Data 4G/5G hoặc đến kỳ đóng hóa đơn Điện/Nước để gợi ý nhiệm vụ có tỷ lệ chuyển đổi cao nhất.
4. **Định tuyến ưu đãi theo vị trí địa lý (`Geo-Proximity Coalition Routing`):** Ưu tiên hiển thị chiến dịch và Voucher của các siêu thị, cửa hàng đối tác nằm ngay trong cụm khu vực sinh sống hoặc làm việc của khách hàng.
5. **Đo lường hiệu quả tài chính thực chất (`True Incremental Uplift & Control Group`):** Đối chiếu doanh thu của nhóm nhận ưu đãi với **Nhóm đối chứng (`Control Group`)** và mức chi tiêu cơ sở (`Baseline GMV`) trước chiến dịch để phân biệt doanh thu tăng thêm thực sự với chi phí khuyến mại lãng phí.
6. **Bảo vệ ngân sách thưởng và chống trục lợi (`Fraud & Abuse Guardrails`):** Ngăn chặn các cụm tài khoản ảo (`Clone Farm`), hành vi chuyển tiền vòng tròn hoặc hoàn hủy giao dịch sau khi đã nhận Điểm/Coin.
7. **Thúc đẩy năng suất mạng lưới Đại lý (`Agent & Super Agent Network Enablement`):** Đo lường tự động chỉ tiêu chăm sóc khách hàng của từng `Agent` (100 khách/tháng) và tỷ lệ đạt chuẩn mạng lưới của `Super Agent` (ngưỡng 50%) để tự động trả thưởng hoặc kích hoạt kịch bản hỗ trợ.

---

### 1.2. Nguyên tắc kiến trúc khi cung cấp dữ liệu từ Data Lake sang Core Loyalty

1. **Nguyên tắc cô lập cơ sở dữ liệu vận hành:**
   * `loyalty-service` tuyệt đối không truy vấn trực tiếp vào cơ sở dữ liệu giao dịch lõi (`natcash_db` hoặc hệ thống tính cước `OCS` của viễn thông) để tránh gây suy giảm hiệu năng giao dịch tài chính.
   * Toàn bộ dữ liệu khai thác phải được trích xuất từ tầng **Data Lake / Lakehouse** thông qua `DataLakeConnectorProvider` được cấu hình theo từng thuê bao tại bảng `loyalty_tenant_integrations` ([V12__add_tenant_integrations_schema.sql](../../src/service/src/main/resources/db/migration/V12__add_tenant_integrations_schema.sql)).
2. **Nguyên tắc tối thiểu hóa dữ liệu và bảo mật quyền riêng tư (`Privacy-By-Design`):**
   * Chỉ đồng bộ **Các chỉ số đặc trưng đã tổng hợp (`Aggregated Feature Vectors`)** và **Tín hiệu sự kiện ngữ cảnh (`Contextual Event Signals`)**.
   * Tuyệt đối không đồng bộ hoặc lưu trữ dữ liệu nhạy cảm thô sang `loyalty_db` (không lấy nhật ký chi tiết cuộc gọi `CDR`, nội dung tin nhắn `SMS`, số giấy tờ tùy thân gốc, lịch sử vị trí tọa độ GPS chính xác từng giây hoặc mã `PIN`).
3. **Kiến trúc cung cấp dữ liệu Hai Tốc Độ (`Two-Speed Ingestion Pipeline`):**
   * **Luồng 1 — Đồng bộ Đặc trưng theo Lô (`Batch / Micro-Batch Feature Sync`):** Chạy định kỳ `T+1` ban đêm (01:00–04:00) hoặc mỗi 4–6 giờ qua `Trino/Presto SQL`, `ClickHouse`, `Parquet S3` hoặc `REST Feature Gateway` theo cơ chế `Delta Sync` (chỉ đồng bộ các thuê bao có biến động chỉ số trong kỳ).
   * **Luồng 2 — Tín hiệu Ngữ cảnh Thời gian thực (`Real-Time Contextual Stream`):** Đẩy qua `Kafka`, `Redis Streams` hoặc `Inbound Webhook` có ký số `HMAC-SHA256` với độ trễ dưới 5 giây ngay khi phát sinh sự kiện.
4. **Cơ chế chịu lỗi và vận hành độc lập (`Circuit Breaker & Last-Known Snapshot`):**
   * Mỗi bản ghi đặc trưng tại `loyalty_user_ai_profiles` đều lưu thời điểm đồng bộ gần nhất (`last_synced_at`) và thời hạn hiệu lực (`feature_ttl_hours`). Khi kết nối Data Lake gián đoạn, `Resilience4j Circuit Breaker` tự động chuyển sang dùng bản chụp đặc trưng gần nhất (`Last-Known Snapshot`), đảm bảo mọi luồng giao dịch và hiển thị trên ứng dụng phản hồi dưới 50ms.

---

## 2. ĐẶC TẢ CHI TIẾT 7 NHÓM DỮ LIỆU CẦN CUNG CẤP TỪ DATA LAKE

### 2.1. Nhóm 1: Dữ liệu Định danh Liên thông, Vòng đời & Nhân khẩu học Ẩn danh (`Identity & Lifecycle Profile`)

Nhóm dữ liệu này cung cấp thông tin nền tảng về trạng thái pháp lý, thâm niên gắn bó và thuộc tính vòng đời của khách hàng trên toàn hệ sinh thái.

| STT | Mã trường dữ liệu | Kiểu dữ liệu | Nguồn gốc | Chu kỳ đồng bộ | Ý nghĩa nghiệp vụ & Mục đích khai thác tại Core Loyalty |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `external_user_id` | `VARCHAR(100)` | Core IAM / Telco | Thời gian thực | Mã định danh duy nhất của khách hàng liên thông giữa Ví điện tử, Viễn thông và `loyalty_accounts`. |
| 2 | `kyc_tier_status` | `ENUM` | Data Lake Ví | 4 giờ / Sự kiện | Trạng thái định danh điện tử (`UNVERIFIED`, `BASIC_KYC`, `FULL_EKYC`, `MERCHANT_AGENT`). Dùng làm điều kiện bắt buộc trước khi cho phép tiêu Điểm/Coin mệnh giá lớn tại quầy `POS` và kích hoạt nhiệm vụ hoàn tất `eKYC`. |
| 3 | `wallet_tenure_days` | `INT` | Data Lake Ví | `T+1` | Số ngày kể từ khi khách hàng kích hoạt ví điện tử. Giúp phân tách tệp khách hàng mới (`New Users` ≤ 30 ngày) để hiển thị chuỗi nhiệm vụ tân thủ (`Onboarding Quest`). |
| 4 | `sim_tenure_months` | `INT` | Data Lake Viễn thông | `T+1` | Số tháng hoạt động của thuê bao di động trên mạng `Natcom`. Phục vụ chính sách cộng thưởng điểm xét hạng thâm niên mỗi năm hoặc xét nâng hạng đặc cách. |
| 5 | `birth_month_day` | `VARCHAR(5)` | Core IAM | `T+1` | Ngày và tháng sinh định dạng `MM-DD` (lược bỏ năm sinh để bảo mật). Phục vụ `Tier Lifecycle Engine` tự động cấp phát gói Voucher sinh nhật và nhân 2 điểm thưởng trong tuần sinh nhật. |
| 6 | `preferred_lang_code` | `VARCHAR(10)` | Core App / Telco | `T+1` | Ngôn ngữ giao diện khách hàng đang sử dụng (`vi`, `en`, `fr`, `ht`). Đảm bảo `Engagement Engine` gửi thông báo đẩy, `SMS` và hiển thị nội dung nhiệm vụ đúng ngôn ngữ bản địa. |
| 7 | `ecosystem_vip_flag` | `BOOLEAN` | Data Lake Tổng hợp | `T+1` | Cờ đánh dấu khách hàng thuộc nhóm `VIP` đặc biệt của tập đoàn/ngân hàng/viễn thông để áp dụng cơ chế chăm sóc ưu tiên và miễn giảm phí. |

---

### 2.2. Nhóm 2: Dữ liệu Thanh khoản & Hành vi Tài chính từ Data Lake Core Ví (`Wallet Liquidity & Financial Habits`)

Đây là nhóm dữ liệu quan trọng nhất từ **Data Lake Core Ví (`Natcash`)**, cho phép Core Loyalty đánh giá chính xác sức mua hiện hữu, thói quen nạp/rút và chu kỳ chi tiêu định kỳ của từng hộ gia đình.

| STT | Mã trường dữ liệu | Kiểu dữ liệu | Nguồn gốc | Chu kỳ đồng bộ | Ý nghĩa nghiệp vụ & Mục đích khai thác tại Core Loyalty |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `avg_wallet_balance_7d` | `NUMERIC(18,2)` | Data Lake Ví | `T+1` | Số dư khả dụng bình quân trong 7 ngày gần nhất. Phản ánh sức mua tức thời của khách hàng trong tuần hiện tại. |
| 2 | `avg_wallet_balance_30d` | `NUMERIC(18,2)` | Data Lake Ví | `T+1` | Số dư khả dụng bình quân 30 ngày. Khi kết hợp với tần suất quét mã `QR` thấp, hệ thống nhận diện chính xác phân khúc `WALLET_LIQUID_NON_SPENDERS` (có tiền nhàn rỗi trong ví nhưng chưa mua sắm tại đối tác) để tung ưu đãi hoàn Coin kích cầu. |
| 3 | `liquidity_tier` | `ENUM` | Data Lake Ví | `T+1` | Phân tầng khả năng thanh khoản (`LOW`, `MEDIUM`, `HIGH`, `ULTRA_HIGH`). Giúp `Recommendation Engine` lọc bỏ các nhiệm vụ yêu cầu hóa đơn lớn đối với người dùng đang ở mức `LOW`, thay bằng nhiệm vụ điểm danh hoặc trò chơi miễn phí. |
| 4 | `cash_in_volume_30d` | `NUMERIC(18,2)` | Data Lake Ví | `T+1` | Tổng giá trị tiền nạp vào ví trong 30 ngày (từ đại lý, ngân hàng, chuyển khoản). |
| 5 | `cash_out_to_spend_ratio` | `NUMERIC(5,2)` | Data Lake Ví | `T+1` | Tỷ lệ giữa số tiền rút mặt tại đại lý trên tổng dòng tiền ra (`0.00` đến `1.00`). Nếu tỷ lệ `≥ 0.80` (khách chỉ dùng ví để nhận rồi rút tiền mặt), Core Loyalty tự động đề xuất nhiệm vụ giữ tiền trong ví thanh toán hóa đơn/siêu thị để nhận hoàn Coin cao. |
| 6 | `remittance_receiver_flag` | `BOOLEAN` | Data Lake Ví | `T+1` / Sự kiện | Đánh dấu thuê bao có nhận kiều hối quốc tế trong 90 ngày qua. Đây là tệp khách hàng có nguồn ngoại tệ và sức mua bán lẻ cao nhất trên hệ thống. |
| 7 | `typical_payday_of_month` | `INT` | Data Lake Ví | Hàng tháng | Ngày trong tháng (`1..31`) mà tài khoản thường xuyên nhận lương hoặc nhận tiền định kỳ lớn. Giúp `Smart Nudge Engine` tự động kích hoạt chiến dịch mua sắm cá nhân hóa đúng vào ngày khách hàng vừa có tiền. |
| 8 | `wallet_aov_30d` | `NUMERIC(18,2)` | Data Lake Ví | `T+1` | Giá trị giao dịch thanh toán trung bình (`Average Order Value`) trong 30 ngày. Dùng làm biến số đầu vào để `Universal Campaign Engine` tự động tính ngưỡng nhiệm vụ kéo giãn giỏ hàng (`target_bill_amount = 1.25 × wallet_aov_30d`). |
| 9 | `baseline_gmv_30d` | `NUMERIC(18,2)` | Data Lake Ví | `T+1` | Tổng giá trị chi tiêu thanh toán thương mại trong 30 ngày chuẩn (không tính chuyển tiền cá nhân `P2P`). Là mốc tham chiếu bắt buộc để tính `Incremental GMV Uplift` khi đánh giá hiệu quả chiến dịch. |
| 10 | `p2p_active_contacts_30d` | `INT` | Data Lake Ví | `T+1` | Số lượng người nhận/gửi tiền `P2P` khác nhau của khách hàng trong 30 ngày. Người dùng có mạng lưới `P2P` rộng là ứng viên lý tưởng cho các chiến dịch **Giới thiệu bạn bè (`Referral & Viral Missions`)** hoặc **Tặng quà/Chia sẻ mảnh ghép GameHub**. |
| 11 | `recurring_bill_profiles` | `JSONB` | Data Lake Ví | `T+1` | Mảng cấu trúc lưu các loại hóa đơn khách hàng thường đóng (Điện `EDH`, Nước `DINEPA`, Internet, Học phí) kèm `typical_due_day` và `avg_bill_amount`. Giúp hệ thống tự động sinh nhiệm vụ nhắc đóng hóa đơn trước ngày đến hạn 3 ngày. |

---

### 2.3. Nhóm 3: Dữ liệu Tiêu dùng Viễn thông & Vị trí Địa lý từ Data Lake Viễn thông (`Telco Usage & Geo-Mobility Features`)

Nhóm dữ liệu từ **Data Lake Viễn thông (`Natcom`)** giúp biến lưu lượng Data 4G/5G, phút gọi và vị trí trạm phát sóng `BTS` thành lợi thế cạnh tranh độc quyền của hệ sinh thái.

| STT | Mã trường dữ liệu | Kiểu dữ liệu | Nguồn gốc | Chu kỳ đồng bộ | Ý nghĩa nghiệp vụ & Mục đích khai thác tại Core Loyalty |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `telco_sub_type` | `ENUM` | Data Lake Viễn thông | `T+1` | Phân loại thuê bao (`PREPAID`, `POSTPAID`, `HYBRID`, `FTTH_BROADBAND`). Dùng để áp dụng quy tắc tích điểm và nhiệm vụ riêng cho thuê bao trả trước và trả sau. |
| 2 | `telco_arpu_30d` | `NUMERIC(18,2)` | Data Lake Viễn thông | `T+1` | Doanh thu cước viễn thông bình quân 30 ngày gần nhất. |
| 3 | `telco_arpu_90d` | `NUMERIC(18,2)` | Data Lake Viễn thông | `T+1` | Doanh thu cước viễn thông bình quân 90 ngày. Dùng để phát hiện phân khúc `TELCO_HIGH_ARPU_UNTAPPED` (thuê bao cước cao nhưng chưa dùng Ví/Loyalty) và tính xu hướng biến động cước (`arpu_30d ÷ arpu_90d`). |
| 4 | `data_usage_gb_30d` | `NUMERIC(10,2)` | Data Lake Viễn thông | `T+1` | Tổng lưu lượng Data 4G/5G đã sử dụng trong 30 ngày (tính bằng `GB`). |
| 5 | `data_exhaustion_count_30d` | `INT` | Data Lake Viễn thông | `T+1` | Số lần thuê bao bị hết lưu lượng Data tốc độ cao trước khi hết chu kỳ gói cước trong 30 ngày qua. Nếu `≥ 2`, khách hàng rất nhạy cảm với phần thưởng `Data 4G/5G`; hệ thống sẽ ưu tiên đẩy các nhiệm vụ thưởng gói Data hoặc đổi Coin lấy Data tức thì. |
| 6 | `preferred_data_pkg_code` | `VARCHAR(50)` | Data Lake Viễn thông | `T+1` | Mã gói cước Data khách hàng thường đăng ký nhất (ngày/tuần/tháng) để đề xuất Voucher nâng cấp gói cước phù hợp. |
| 7 | `topup_freq_30d` | `INT` | Data Lake Viễn thông | `T+1` | Số lần nạp tiền điện thoại trong 30 ngày. |
| 8 | `avg_topup_denomination` | `NUMERIC(18,2)` | Data Lake Viễn thông | `T+1` | Mệnh giá thẻ nạp trung bình. Dùng để gợi ý nhiệm vụ nâng mệnh giá nạp (ví dụ: khách quen nạp `50 HTG` sẽ nhận nhiệm vụ nạp `100 HTG` qua Ví để được tặng thêm `30 Coin`). |
| 9 | `digital_topup_ratio` | `NUMERIC(5,2)` | Data Lake Viễn thông | `T+1` | Tỷ lệ nạp tiền qua kênh số (Ví điện tử) so với nạp bằng thẻ cào giấy truyền thống. Phục vụ chiến dịch chuyển đổi người dùng từ thẻ cào vật lý sang nạp trực tuyến trên ứng dụng. |
| 10 | `home_bts_cluster_code` | `VARCHAR(50)` | Data Lake Viễn thông | Hàng tuần | Mã cụm khu vực địa lý nơi thuê bao thường trú ban đêm (21:00–06:00) xác định qua cụm trạm thu phát sóng `BTS` (đã gom cụm cấp Phường/Quận để bảo vệ quyền riêng tư). |
| 11 | `work_bts_cluster_code` | `VARCHAR(50)` | Data Lake Viễn thông | Hàng tuần | Mã cụm khu vực địa lý nơi thuê bao hoạt động ban ngày (08:00–17:00). Kết hợp với `home_bts_cluster_code` giúp `Recommendation Engine` tính điểm `GeoMerchantProximity`, ưu tiên hiển thị chiến dịch của các Merchant đối tác nằm ngay gần khách hàng. |

---

### 2.4. Nhóm 4: Dữ liệu Sở thích Ngành hàng & Tương tác Liên minh (`Merchant Affinity & Time-Slot Behavior`)

Nhóm dữ liệu này tổng hợp hành vi mua sắm đa ngành hàng từ cả hệ thống thanh toán `QR` của Ví và dữ liệu đối tác liên minh.

| STT | Mã trường dữ liệu | Kiểu dữ liệu | Nguồn gốc | Chu kỳ đồng bộ | Ý nghĩa nghiệp vụ & Mục đích khai thác tại Core Loyalty |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `top_mcc_categories_90d` | `JSONB` | Data Lake Ví & POS | `T+1` | Danh sách 3 mã ngành hàng (`MCC` / `Category`) khách hàng chi tiêu nhiều nhất trong 90 ngày (`SUPERMARKET`, `FNB_CAFE`, `PHARMACY`, `FUEL`, `ELECTRONICS`, `ENTERTAINMENT`). Giúp cá nhân hóa danh mục kho Voucher hiển thị đầu trang. |
| 2 | `category_spend_shares_json` | `JSONB` | Data Lake Ví & POS | `T+1` | Tỷ trọng chi tiêu theo từng ngành hàng. |
| 3 | `unvisited_lookalike_categories` | `JSONB` | Data Lake AI | Hàng tuần | Danh sách ngành hàng mà nhóm người dùng tương đồng (`Lookalike Cohort`) chi tiêu mạnh nhưng khách hàng này chưa từng giao dịch. Dùng để thiết kế nhiệm vụ **Khám phá Đối tác Mới (`First-Time Partner Bonus`)** và **Thẻ tích tem Liên minh (`Cross-Merchant Stamp Card`)**. |
| 4 | `preferred_active_hour_slot` | `ENUM` | Data Lake App/Ví | Hàng tuần | Khung giờ khách hàng thường mở ứng dụng và phát sinh giao dịch nhất (`MORNING_06_10`, `LUNCH_11_14`, `AFTERNOON_14_18`, `EVENING_18_22`, `LATE_NIGHT`). Giúp hệ thống lên lịch gửi thông báo gợi nhắc cá nhân hóa vào đúng khung giờ khách hàng dễ tương tác nhất. |
| 5 | `preferred_shopping_days` | `ENUM` | Data Lake Ví & POS | Hàng tuần | Nhóm ngày mua sắm chủ lực (`WEEKDAY_REGULAR`, `FRIDAY_PEAK`, `WEEKEND_SHOPPER`). |

---

### 2.5. Nhóm 5: Dữ liệu Tín hiệu Sự kiện Ngữ cảnh Thời gian thực (`Real-Time Contextual Event Signals`)

Đây là các bản tin sự kiện đẩy thời gian thực (`Streaming Signals`) từ Data Lake / Event Bus sang `loyalty-service` thông qua `Kafka`, `Redis Streams` hoặc `Inbound Webhook` để kích hoạt luồng xử lý tức thì trong vòng 1–5 giây:

| STT | Mã tín hiệu (`signal_type`) | Nguồn phát sinh | Điều kiện kích hoạt tại nguồn | Cấu trúc dữ liệu đính kèm (`signal_payload`) | Kịch bản khai thác tức thời tại Core Loyalty |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `TELCO_DATA_LOW_WARNING` | Streaming Viễn thông | Dung lượng Data 4G/5G tốc độ cao còn lại `< 100 MB` hoặc đạt `90%` gói cước. | `remainingMb`, `packageCode`, `estimatedDepletionHours` | Kích hoạt thông báo gợi nhắc trong ứng dụng: *"Đổi 40 Coin nhận ngay 500MB Data 4G"* hoặc mở khóa nhiệm vụ nạp gói Data nhận thêm lượt quay Vòng quay may mắn. |
| 2 | `TELCO_MAIN_BALANCE_LOW` | Streaming Viễn thông | Tài khoản gốc trả trước giảm xuống dưới ngưỡng cấu hình (ví dụ `< 10 HTG`). | `currentBalance`, `lastTopupAmount`, `currency` | Mở khóa **Nhiệm vụ Chớp nhoáng (`Flash Mission` 2 giờ)**: Nạp tiền điện thoại qua Ví Natcash ngay trong 2 giờ tới để được nhân đôi `LOYALTY_COIN`. |
| 3 | `WALLET_LARGE_INFLOW_RECEIVED` | Streaming Core Ví | Khách hàng vừa nhận kiều hối, nhận lương hoặc nạp tiền mặt lớn (`≥ ngưỡng cấu hình`). | `inflowAmount`, `inflowSource` (`REMITTANCE`, `PAYROLL`, `CASH_IN`), `newBalance` | Thời điểm vàng khi ví khách hàng dồi dào thanh khoản: Tự động đẩy ưu đãi hoàn Coin bậc thang tại siêu thị `Delimart` hoặc chuỗi nhiệm vụ mua sắm cuối tuần lên đầu màn hình. |
| 4 | `WALLET_BILL_INVOICE_GENERATED` | Streaming Core Ví | Nhà cung cấp Điện (`EDH`), Nước (`DINEPA`), Internet vừa xuất hóa đơn kỳ mới cho thuê bao. | `billerCode`, `invoiceId`, `invoiceAmount`, `dueDate` | Tự động khởi tạo tiến độ bước 1 của nhiệm vụ *"Thanh toán hóa đơn đúng hạn trước ngày `dueDate` để nhận 100 Coin + 1 Vé cào trúng thưởng"*. |
| 5 | `EKYC_STATUS_UPGRADED` | Streaming Core IAM | Khách hàng vừa được duyệt nâng cấp lên `FULL_EKYC` thành công. | `previousTier`, `newTier`, `verifiedAt` | Tự động cộng thưởng nhiệm vụ định danh hoàn tất, mở khóa hạn mức tiêu Điểm/Coin tại quầy `POS` và tặng lượt chơi GameHub chào mừng. |
| 6 | `GEO_FENCE_MERCHANT_ENTERED` | Streaming App / Telco | Thuê bao di chuyển vào vùng phủ sóng của trung tâm thương mại hoặc chuỗi siêu thị đối tác liên minh. | `btsClusterCode`, `partnerCodes[]`, `timestamp` | Làm nổi bật nút mở **Mã QR Ví Phần Thưởng động 60 giây** và danh sách Voucher khả dụng của đúng đối tác đó khi người dùng mở ứng dụng. |

---

### 2.6. Nhóm 6: Dữ liệu Tín nhiệm, Rủi ro & Chống Trục lợi Khuyến mại (`Risk, Fraud & Reversal Intelligence`)

Nhóm dữ liệu này bảo vệ toàn vẹn tài chính cho quỹ Điểm và quỹ Coin trước các hành vi gian lận công nghệ cao.

| STT | Mã trường dữ liệu | Kiểu dữ liệu | Nguồn gốc | Chu kỳ đồng bộ | Ý nghĩa nghiệp vụ & Mục đích khai thác tại Core Loyalty |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `account_trust_score` | `INT` (`0..100`) | Data Lake Risk Engine | `T+1` / Sự kiện | Điểm tín nhiệm tổng hợp của thuê bao. Nếu `account_trust_score < 40`, Core Loyalty tự động áp dụng quy tắc hạn chế: không cho phép đổi quà tiền mặt trực tiếp (`DIRECT_CASHBACK`), giảm xác suất trúng giải đặc biệt và yêu cầu xác thực bổ sung khi tiêu điểm tại `POS`. |
| 2 | `device_sharing_degree` | `INT` | Data Lake Device Graph | `T+1` | Số lượng tài khoản khác nhau đăng nhập trên cùng một thiết bị vật lý (`device_fingerprint`) trong 30 ngày. Nếu `> 3`, hệ thống gắn cờ nghi vấn cụm tài khoản cày thuê (`Clone Farm`) và chặn thưởng chiến dịch Giới thiệu bạn bè (`Referral`). |
| 3 | `sybil_network_cluster_id` | `VARCHAR(100)` | Data Lake Fraud Graph | `T+1` | Mã cụm đồ thị phát hiện các tài khoản có hành vi chuyển tiền vòng tròn (`Circular P2P`) hoặc thanh toán khống tại các điểm bán tự lập để rút ruột ngân sách hoàn Coin. |
| 4 | `refund_reversal_rate_90d` | `NUMERIC(5,2)` | Data Lake Ví & POS | `T+1` | Tỷ lệ giá trị giao dịch bị hủy/hoàn tiền sau khi thanh toán trong 90 ngày. Với tài khoản có `refund_reversal_rate_90d > 15%`, mọi khoản cộng `LOYALTY_POINT` và `LOYALTY_COIN` từ giao dịch mua hàng sẽ được đưa vào trạng thái **Tạm giữ (`PENDING_HOLD`)** cho đến khi hết thời hạn đổi trả. |
| 5 | `churn_probability_score` | `NUMERIC(5,4)` | Data Lake ML Model | `T+1` | Xác suất rời bỏ dịch vụ (`0.0000` đến `1.0000`) được mô hình học máy trên Data Lake dự báo từ sự sụt giảm đồng thời của lưu lượng viễn thông và giao dịch ví. Khi `≥ 0.70`, Core Loyalty tự động đưa khách hàng vào phân khúc `AT_RISK_CHURN_MULTICHANNEL` để kích hoạt gói nhiệm vụ giữ chân tự động (`Win-back Mission`). |

---

### 2.7. Nhóm 7: Dữ liệu Hiệu suất Mạng lưới Đại lý (`Agent & Super Agent Performance Features`)

Nhóm dữ liệu này phục vụ riêng cho phân hệ số 10 (**`Agent & Super Agent`** — đã trình bày trên Slide 3, 6, 7, 13, 15), giúp Core Loyalty tự động đánh giá nhiệm vụ chăm sóc khách hàng của từng `Agent` và tỷ lệ hoàn thành chỉ tiêu mạng lưới của từng `Super Agent`.

| STT | Mã trường dữ liệu | Kiểu dữ liệu | Nguồn gốc | Chu kỳ đồng bộ | Ý nghĩa nghiệp vụ & Mục đích khai thác tại Core Loyalty |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `agent_code` & `agent_role` | `VARCHAR(50)` | Core Ví & BCCS | `T+1` | Mã định danh điểm giao dịch và vai trò trong mạng lưới (`AGENT` hoặc `SUPER_AGENT`). |
| 2 | `parent_super_agent_code` | `VARCHAR(50)` | Core Ví & BCCS | `T+1` | Mã `Super Agent` cấp trên quản lý trực tiếp `Agent` này (phục vụ tổng hợp chỉ tiêu mạng lưới cấp 2). |
| 3 | `active_cared_customers_month` | `INT` | Data Lake Aggregator | `T+1` | Số lượng khách hàng định danh duy nhất (`Unique MSISDN`) được `Agent` hỗ trợ nạp tiền, rút tiền, thanh toán hóa đơn hoặc mở ví thành công trong tháng hiện tại (đối chiếu trực tiếp với mốc **Chăm sóc thành công 100 khách/tháng**). |
| 4 | `new_ekyc_onboarded_month` | `INT` | Core IAM / eKYC | `T+1` | Số lượng khách hàng mới được `Agent` hướng dẫn đăng ký ví và duyệt `FULL_EKYC` thành công trong tháng. |
| 5 | `agent_cash_in_volume_month` | `NUMERIC(18,2)` | Core Ví Natcash | `T+1` | Tổng doanh số nạp tiền mặt (`Cash-in`) qua quầy `Agent` trong tháng. |
| 6 | `sub_agent_network_attainment_pct` | `NUMERIC(5,2)` | Data Lake Aggregator | `T+1` | Tỷ lệ phần trăm (%) đạt chỉ tiêu tổng hợp của toàn bộ mạng lưới `Agent` trực thuộc một `Super Agent`. Nếu `≥ 50.00%`, kích hoạt luồng xét thưởng doanh số cho `Super Agent`; nếu `< 50.00%`, tự động kích hoạt **Kịch bản hỗ trợ kinh doanh (`Support Playbook`)** cho khu vực đó. |
| 7 | `agent_self_dealing_risk_flag` | `BOOLEAN` | Data Lake Fraud Graph | `T+1` | Cờ cảnh báo hành vi `Agent` tự chia nhỏ giao dịch hoặc chuyển tiền qua lại giữa các số điện thoại người nhà để cày khống chỉ tiêu 100 khách/tháng. |

---

## 3. MA TRẬN ÁNH XẠ KHAI THÁC DỮ LIỆU TẠI TỪNG PHÂN HỆ CORE LOYALTY

Bảng dưới đây tổng hợp cách thức từng phân hệ bên trong [loyalty-service](../../src/service) tiêu thụ các trường dữ liệu từ Data Lake để vận hành nghiệp vụ:

| Phân hệ Core Loyalty | Dữ liệu Data Lake đầu vào | Cơ chế vận hành và Khai thác nghiệp vụ tại Core Loyalty |
| :--- | :--- | :--- |
| **1. Máy Trạng Thái Hạng Hội Viên (`Tier Lifecycle & Perks Engine`)** | • `telco_arpu_90d`<br/>• `sim_tenure_months`<br/>• `kyc_tier_status`<br/>• `birth_month_day`<br/>• `ecosystem_vip_flag` | • **Cơ chế Đặc cách Hạng (`Tier Fast-Track`):** Khách hàng có `telco_arpu_90d` thuộc Top 5% hoặc `sim_tenure_months ≥ 60` khi mở Ví được cấp ngay **Thẻ Vàng Trải Nghiệm 30 ngày**, chỉ cần phát sinh 2 giao dịch quét `QR` để giữ hạng chính thức.<br/>• **Xét hạng đa tiêu chí:** Kết hợp `TIER_POINT` nội tại với điều kiện `kyc_tier_status == FULL_EKYC`.<br/>• **Cấp phát đặc quyền sinh nhật:** Dựa vào `birth_month_day` để tặng gói quà định kỳ theo hạng. |
| **2. Bộ Máy Chiến Dịch & Nhiệm Vụ Phổ Quát (`Universal Campaign Engine`)** | • `wallet_aov_30d`<br/>• `recurring_bill_profiles`<br/>• `typical_payday_of_month`<br/>• `unvisited_lookalike_categories`<br/>• `p2p_active_contacts_30d` | • **Đặt ngưỡng động theo cá nhân (`Personalized Threshold`):** Trong khối luật `HOW` của JSON DSL, cho phép khai báo biểu thức `targetValue = MAX(100, 1.25 * user360.walletAov30d)` để mỗi người dùng nhận một mốc thử thách vừa sức.<br/>• **Nhiệm vụ Chu kỳ Hóa đơn:** Tự động mở nhiệm vụ đóng tiền Điện/Nước trước `typical_due_day` 3 ngày.<br/>• **Nhiệm vụ Khám phá Chéo:** Ghép 2 ngành hàng trong `top_mcc_categories_90d` với 1 ngành hàng trong `unvisited_lookalike_categories` thành chuỗi nhiệm vụ 3 bước. |
| **3. Bộ Máy AI Phân Khúc & Gợi Ý (`AI Segmentation & Recommender`)** | • Toàn bộ vector `RFM-EWT`<br/>• `liquidity_tier`<br/>• `home_bts_cluster_code`<br/>• `work_bts_cluster_code`<br/>• `churn_probability_score` | • **Phân cụm 10 Phân khúc Liên hợp:** Tự động gán nhãn `primary_segment` và `secondary_tags_json` trong bảng `loyalty_user_ai_profiles`.<br/>• **Xếp hạng danh sách Chiến dịch (`360-Aware Ranking`):** Tính điểm tương thích `MatchingScore` dựa trên sự khớp nhau giữa số dư ví hiện có (`liquidity_tier`), nhu cầu Data (`data_exhaustion_count_30d`) và khoảng cách từ `home/work_bts_cluster_code` tới cửa hàng đối tác. |
| **4. Cổng GameHub & Phân Phối Phần Thưởng (`Universal GameHub & LootTable`)** | • `data_exhaustion_count_30d`<br/>• `preferred_data_pkg_code`<br/>• `top_mcc_categories_90d`<br/>• `account_trust_score` | • **Tối ưu hóa Bảng Rơi Thưởng (`Smart LootTable`):** Khi người chơi mở Rương báu hoặc quay Vòng quay, trong cùng một bậc giá trị giải thưởng (`Prize Tier`), hệ thống ưu tiên chọn loại Voucher phù hợp với nhu cầu thực tế (tặng `Voucher Data 4G` cho người có `data_exhaustion_count_30d ≥ 2`, tặng `Voucher Siêu thị` cho người hay mua sắm bán lẻ).<br/>• **Kiểm soát Bảo hiểm Nhân phẩm & Chống Bot:** Chỉ kích hoạt rơi giải thưởng hiếm cho tài khoản đạt `account_trust_score ≥ 60`. |
| **5. Trợ Lý AI Phân Tích Hiệu Quả Chiến Dịch (`Campaign Analytics & Copilot`)** | • `baseline_gmv_30d`<br/>• `wallet_aov_30d`<br/>• `preferred_active_hour_slot` | • **Tính toán Doanh thu Gia tăng Thực chất (`Incremental Uplift`):** Kết hợp so sánh với **Nhóm đối chứng (`Control Group`)** và `baseline_gmv_30d` từ Data Lake để tính `Net ROAS` chính xác.<br/>• **Chẩn đoán Lệch Khung Giờ & Trùng Nhiệm Vụ:** Phát hiện trường hợp chiến dịch cấu hình khung giờ lệch với `preferred_active_hour_slot` hoặc trùng với nhiệm vụ đang chạy để cảnh báo ngay trên CMS. |
| **6. Kiểm Soát An Toàn Tài Chính & Đối Soát (`Fraud & Clearing Guardrails`)** | • `account_trust_score`<br/>• `device_sharing_degree`<br/>• `sybil_network_cluster_id`<br/>• `refund_reversal_rate_90d` | • **Bảo vệ Quỹ Thưởng Giới Thiệu (`Referral Shield`):** Chặn trả thưởng nếu người mời và người được mời có cùng `sybil_network_cluster_id` hoặc thiết bị có `device_sharing_degree > ngưỡng`.<br/>• **Tạm giữ Điểm/Coin có điều kiện (`Conditional Escrow`):** Giữ điểm/coin ở trạng thái chờ đối với người dùng có `refund_reversal_rate_90d` cao để tránh thất thoát tiền bù trừ liên minh. |
| **7. Phân Hệ Đại Lý & Tổng Đại Lý (`Agent & Super Agent Loyalty Engine`)** | • `active_cared_customers_month`<br/>• `new_ekyc_onboarded_month`<br/>• `sub_agent_network_attainment_pct`<br/>• `agent_self_dealing_risk_flag` | • **Trả thưởng nhiệm vụ Agent:** Tự động trao thưởng Voucher, gói Data (GB) qua `Natcom BCCS` hoặc thưởng tiền về ví đại lý khi đạt mốc chăm sóc 100 khách thực/tháng (`agent_self_dealing_risk_flag == false`).<br/>• **Xét thưởng & Hỗ trợ Super Agent:** Xét thưởng khi `sub_agent_network_attainment_pct ≥ 50%`, hoặc tự động mở phiếu hỗ trợ vận hành khi dưới ngưỡng `50%`. |

---

## 4. ĐẶC TẢ HỢP ĐỒNG GIAO TIẾP DỮ LIỆU (`DATA CONTRACT & SCHEMAS`)

### 4.1. Cấu trúc Bản ghi Đồng bộ Đặc trưng Lô (`Batch Feature Sync Schema`)

Dữ liệu đồng bộ định kỳ từ Data Lake sang bảng `loyalty_user_ai_profiles` của Core Loyalty tuân thủ cấu trúc chuẩn hóa dưới đây (hỗ trợ định dạng `JSONL`, `Apache Parquet` hoặc kết quả truy vấn `JDBC/Trino`):

```json
{
  "schemaVersion": "2.0",
  "snapshotDate": "2026-11-13",
  "syncedAtEpochMs": 1794535200000,
  "featureTtlHours": 24,
  "tenantId": "TENANT_NATCASH",
  "externalUserId": "50937123456",
  "identityProfile": {
    "kycTierStatus": "FULL_EKYC",
    "walletTenureDays": 420,
    "simTenureMonths": 36,
    "birthMonthDay": "11-20",
    "preferredLangCode": "fr",
    "ecosystemVipFlag": false
  },
  "walletFeatures": {
    "avgWalletBalance7d": 5120.00,
    "avgWalletBalance30d": 4850.00,
    "liquidityTier": "HIGH",
    "cashInVolume30d": 15000.00,
    "cashOutToSpendRatio": 0.65,
    "remittanceReceiverFlag": true,
    "typicalPaydayOfMonth": 15,
    "walletAov30d": 320.00,
    "baselineGmv30d": 6400.00,
    "p2pActiveContacts30d": 8,
    "recurringBillProfiles": [
      {
        "billerCode": "EDH_ELECTRIC",
        "category": "UTILITY_ELECTRIC",
        "typicalDueDay": 18,
        "avgBillAmount": 1200.00
      },
      {
        "billerCode": "DINEPA_WATER",
        "category": "UTILITY_WATER",
        "typicalDueDay": 22,
        "avgBillAmount": 450.00
      }
    ]
  },
  "telcoFeatures": {
    "telcoSubType": "PREPAID",
    "telcoArpu30d": 850.00,
    "telcoArpu90d": 810.00,
    "dataUsageGb30d": 18.50,
    "dataExhaustionCount30d": 3,
    "preferredDataPkgCode": "DATA_WEEKLY_5GB",
    "topupFreq30d": 4,
    "avgTopupDenomination": 200.00,
    "digitalTopupRatio": 0.75,
    "homeBtsClusterCode": "PAP_DELMAS_33",
    "workBtsClusterCode": "PAP_PETION_VILLE_01"
  },
  "merchantAffinity": {
    "topMccCategories90d": ["SUPERMARKET", "TELECOM_TOPUP", "FNB_FASTFOOD"],
    "categorySpendShares": {
      "SUPERMARKET": 0.55,
      "TELECOM_TOPUP": 0.25,
      "FNB_FASTFOOD": 0.20
    },
    "unvisitedLookalikeCategories": ["PHARMACY", "BOOKSTORE"],
    "preferredActiveHourSlot": "EVENING_18_22",
    "preferredShoppingDays": "WEEKEND_SHOPPER"
  },
  "riskAndPropensity": {
    "accountTrustScore": 92,
    "deviceSharingDegree": 1,
    "sybilNetworkClusterId": null,
    "refundReversalRate90d": 0.00,
    "churnProbabilityScore": 0.0820
  },
  "agentNetworkFeatures": {
    "agentCode": "AG_DELMAS_0192",
    "agentRole": "AGENT",
    "parentSuperAgentCode": "SA_PAP_WEST_01",
    "activeCaredCustomersMonth": 108,
    "newEkycOnboardedMonth": 14,
    "agentCashInVolumeMonth": 485000.00,
    "subAgentNetworkAttainmentPct": null,
    "agentSelfDealingRiskFlag": false
  }
}
```

---

### 4.2. Cấu trúc Bản tin Tín hiệu Ngữ cảnh Thời gian thực (`Real-Time Contextual Signal Schema`)

Các sự kiện thời gian thực đẩy từ Streaming Data Lake / Event Bus vào điểm cuối `/api/v1/datalake/signals/ingest` hoặc kênh `Redis Streams` (`loyalty.datalake.signals.{tenantId}`) tuân thủ cấu trúc:

```json
{
  "signalId": "DL_SIG_20261113_8899aabb",
  "tenantId": "TENANT_NATCASH",
  "externalUserId": "50937123456",
  "signalType": "TELCO_DATA_LOW_WARNING",
  "sourceSystem": "NATCOM_STREAMING_LAKE",
  "occurredAtEpochMs": 1794536100000,
  "ttlSeconds": 7200,
  "signalPayload": {
    "remainingMb": 45.5,
    "currentPackageCode": "DATA_WEEKLY_5GB",
    "estimatedDepletionHours": 3
  },
  "signature": "e4d909c290d0fb1ca068ffaddf22cbd0..."
}
```

---

## 5. QUY CHUẨN CHẤT LƯỢNG DỮ LIỆU, CAM KẾT SLA VÀ LỘ TRÌNH TÍCH HỢP

### 5.1. Cam kết chất lượng dữ liệu và SLA vận hành

1. **Độ tươi của dữ liệu (`Data Freshness SLA`):**
   * **Luồng Lô (`Batch T+1`):** Toàn bộ dữ liệu đặc trưng tính đến `23:59:59` ngày `T` phải sẵn sàng trên bảng xuất của Data Lake trước `02:30:00` sáng ngày `T+1` để tiến trình `DataLakeFeatureSyncJob` của `loyalty-service` hoàn tất đồng bộ trước `04:30:00` sáng (trước khung giờ người dùng thức dậy).
   * **Luồng Thời gian thực (`Real-Time Signals`):** Độ trễ từ lúc phát sinh sự kiện tại Core Ví / Viễn thông đến khi `loyalty-service` nhận được bản tin P95 ≤ `5 giây`.
2. **Cơ chế Đồng bộ Vi sai (`Delta / Incremental Sync`):**
   * Để tránh phải quét và truyền lại hàng triệu bản ghi không thay đổi mỗi ngày, bảng xuất trên Data Lake bắt buộc có cột `feature_hash` (mã băm `SHA-256` của toàn bộ các trường đặc trưng) và `updated_date`. Tiến trình đồng bộ của Core Loyalty chỉ nạp các bản ghi có `feature_hash` thay đổi so với kỳ trước.
3. **Quy tắc Kiểm tra Hợp lệ Đầu vào (`Zero Fake Default & Schema Validation`):**
   * Nếu một trường dữ liệu từ Data Lake chưa tính toán được (ví dụ thuê bao chưa có lịch sử vị trí trạm `BTS`), Data Lake bắt buộc truyền giá trị `null` tường minh. Core Loyalty tuyệt đối không gán giá trị giả lập mặc định làm sai lệch thuật toán phân khúc AI.

---

### 5.2. Lộ trình tích hợp phân kỳ theo 3 giai đoạn

| Giai đoạn | Phạm vi dữ liệu tích hợp | Phương thức kết nối | Giá trị nghiệp vụ mang lại ngay cho Core Loyalty |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1: Nền tảng Chân dung 360 (`Batch T+1 Core`)** | • **Nhóm 1** (Định danh, `eKYC`, Thâm niên, Tháng-Ngày sinh)<br/>• **Nhóm 2** (`avg_wallet_balance_30d`, `wallet_aov_30d`, `baseline_gmv_30d`, `recurring_bill_profiles`)<br/>• **Nhóm 3** (`telco_arpu_30d`, `data_exhaustion_count_30d`, `home_bts_cluster_code`) | Đồng bộ lô `T+1` qua View `ClickHouse / Trino` hoặc tệp `Parquet/JSONL` mỗi đêm vào bảng `loyalty_user_ai_profiles`. | • Vận hành ngay **10 Phân khúc AI Liên hợp**.<br/>• Cá nhân hóa ngưỡng nhiệm vụ theo `1.25 × AOV`.<br/>• Tính toán chính xác `Incremental Uplift` và `Net ROAS` của mọi chiến dịch trên CMS. |
| **Giai đoạn 2: Kích hoạt Ngữ cảnh Tức thời (`Real-Time Signals`)** | • **Nhóm 4** (Sở thích ngành hàng & Khung giờ tương tác)<br/>• **Nhóm 5** (6 tín hiệu thời gian thực: Cạn Data 4G, Cạn tài khoản chính, Nhận kiều hối/Nạp tiền lớn, Có hóa đơn Điện/Nước mới, Hoàn tất `eKYC`, Vào vùng gần Merchant) | Đẩy sự kiện thời gian thực qua `Kafka` / `Redis Streams` hoặc `Inbound Webhook` vào `loyalty-service`. | • Tự động kích hoạt **Flash Missions** và gợi nhắc thông minh đúng thời điểm khách hàng cần Data 4G hoặc vừa có sẵn tiền trong ví.<br/>• Đẩy tăng tỷ lệ chuyển đổi nhiệm vụ từ 2–3 lần so với thông báo đại trà. |
| **Giai đoạn 3: Mạng lưới Đại lý (`Agent & Super Agent`) & Lá chắn Gian lận** | • **Nhóm 6** (`account_trust_score`, `device_sharing_degree`, `sybil_network_cluster_id`, `refund_reversal_rate_90d`, `churn_probability_score`)<br/>• **Nhóm 7** (`active_cared_customers_month`, `new_ekyc_onboarded_month`, `sub_agent_network_attainment_pct`, `agent_self_dealing_risk_flag`) | Kết hợp đồng bộ điểm rủi ro hàng ngày, chỉ tiêu đại lý và cảnh báo gian lận tức thời từ Fraud Engine của Data Lake. | • Tự động xét thưởng nhiệm vụ 100 khách/tháng cho `Agent` và ngưỡng 50% chỉ tiêu mạng lưới cho `Super Agent`.<br/>• Chặn triệt để rủi ro cày thưởng tài khoản ảo (`Clone Farm`), đại lý tự giao dịch khống và hoàn hủy đơn hàng. |
