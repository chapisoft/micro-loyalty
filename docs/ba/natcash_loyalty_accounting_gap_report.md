# BÁO CÁO PHÂN TÍCH VƯỚNG MẮC, GAP TÍCH HỢP HẠCH TOÁN LOYALTY VÀ ĐỀ XUẤT NÂNG CẤP HỆ THỐNG NATCASH

> **Mục tiêu tài liệu:** Làm rõ cơ chế hạch toán sẵn có trên Natcash Core (`$AMOUNT$`, `$FEE$`, `$DISCOUNT$`, `BONUS1`, `BONUS2`, `TARIFF_PLAN`), chỉ ra chính xác hạng mục nào tái sử dụng được ngay cho **Point/Hạng thẻ**, hạng mục nào vướng GAP đối với **Voucher, Coin**, và thiết kế **Phương án Ví Chung (`W_LOYALTY_POOL`) kết hợp bóc tách hậu kỳ tại Loyalty** tối giản cho **Core, Mobile App, USSD, Payment Gateway, Payment Point** và **micro-loyalty**.

---

## 1. NGUYÊN LÝ HẠCH TOÁN ĐANG CÓ SẴN TRÊN NATCASH CORE & KHẢ NĂNG TẬN DỤNG

Để thấy rõ Loyalty lắp vào đâu được và kẹt ở đâu, cần nhìn đúng cách Natcash Core đang di chuyển tiền thật trong Oracle (`PCK_ACCOUNTING` / `PCK_JAVA_ACCOUNTING` + bảng `PROCESS_MAPPING` + bảng `TARIFF`).

### 1.1. Luồng hạch toán chuẩn hiện tại (Ví dụ luồng 2 bước `576100` → `577100`)

Theo cấu hình thực tế tại [GUIDE.md](/docs/policy/GUIDE.md#L135-L197) và [process_mapping.xlsx](/docs/policy/process_mapping.xlsx) (cũng như luồng `BUY_MY_SHOP` của Payment Point), một giao dịch thanh toán tiêu chuẩn (ví dụ hóa đơn **1.000 HTG**, phí **11 HTG**, chiết khấu **100 HTG**) đang hạch toán qua các bước sau:

| Bước | Tên luồng | Tài khoản nguồn → Đích | Công thức trong `PROCESS_MAPPING` | Ví dụ số tiền thực tế |
| :--- | :--- | :--- | :--- | :--- |
| **Bước 0** | Hỏi phí (`311005`) | Đọc bảng tĩnh `TARIFF` | Tính trước `$FEE$`, `$DISCOUNT$`, `$BONUS1$`, `$BONUS2$` | Trả ra: Phí `11`, Chiết khấu `100` |
| **Bước 1** | Giữ tiền (`576100`) | Ví khách (`FROM_ACC_ID`) → Ví tạm giữ (`W_Temp`) | `` `$AMOUNT$` + `$FEE$` - `$DISCOUNT$` `` | Khách bị trừ: `1.000 + 11 - 100 = 911 HTG` |
| **Bước 2a** | Thành công (`577100`, state `1`) | 1. `W_Temp` → Ví thu gom đối tác (`W_Col`)<br>2. `W_Temp` → Tài khoản Thuế (`5`)<br>3. `W_Temp` → Tài khoản Doanh thu phí (`17`) | 1. `` `$AMOUNT$` - `$DISCOUNT$` ``<br>2. `` `ROUND($FEE$/1.1, 2)` ``<br>3. `` `$FEE$ - ROUND($FEE$/1.1, 2)` `` | 1. Đối tác nhận: `1.000 - 100 = 900 HTG`<br>2. Thuế nhận: `10 HTG`<br>3. Phí ròng Natcash: `1 HTG` |
| **Bước 2b** | Thất bại (`577100`, state `-1`) | `W_Temp` → Ví khách (`TO_ACC_ID`) | `` `$AMOUNT$` + `$FEE$` - `$DISCOUNT$` `` | Hoàn lại khách: `911 HTG` |

> **Điểm mấu chốt cần nắm:** Trong công thức hiện tại của Core, số tiền đối tác nhận (`W_Col`) luôn bị trừ đi đúng bằng `$DISCOUNT$` (`` `$AMOUNT$` - `$DISCOUNT$` ``). Nghĩa là **Core đang mặc định đối tác tự chịu 100% tiền giảm giá**, hoàn toàn không có vế nào tự trích tiền từ quỹ khuyến mãi hay Quỹ Loyalty của Natcash để bù cho đối tác trong cùng giao dịch.

---

### 1.2. Đánh giá từng tham số hạch toán đang có sẵn trên ISO & Core

| Tham số / Cơ chế sẵn có | Bản chất hoạt động hiện tại trong mã nguồn | Dùng được ngay cho Loyalty không? | Giới hạn khi áp dụng thực tế |
| :--- | :--- | :--- | :--- |
| **`$AMOUNT$`** *(ISO Field 5)* | Tham số tiền duy nhất truyền từ Java ([EWMapProcess.java](/core-app/EwalletDBUtils/src/main/java/com/viettel/ewallet/database/mapprocess/EWMapProcess.java#L170-L171)) vào Stored Procedure `transaction_process`. | **Dùng ngay được** cho phần **tiền ví khách thực trả** (`WalletPaid = Hóa đơn - Coin - Voucher`). | Nếu khách trả 100% bằng Coin/Voucher (`WalletPaid = 0`), `RULE_CONDITION` min `1` hoặc `20 HTG` sẽ chặn giao dịch ([JWETLAKAY_CORE.sql](/docs/policy/JWETLAKAY/JWETLAKAY_CORE.sql#L290-L349)). |
| **`$FEE$`** *(ISO Field 28)* | Lấy từ bảng `TARIFF` theo `TARIFF_PLAN_ID`, tự động tách thuế VAT vào TK `5` và doanh thu ròng vào TK `17`. | **Dùng ngay được** cho **Point / Hạng thẻ (`TIER`)** để cấu hình giảm/miễn phí giao dịch theo cấp hạng. | Cần mapping tổ hợp `(KYC_TIER × LOYALTY_TIER)` sang `TARIFF_PLAN_ID` (xem Mục 3.1). |
| **`$DISCOUNT$`** *(ISO Field 29)* | Trong [EWMapProcessServices.java](/core-app/EwalletDBUtils/src/main/java/com/viettel/ewallet/database/mapprocess/EWMapProcessServices.java#L80-L95) và [EWMapProcessServicesNew.java](/core-app/EwalletDBUtils/src/main/java/com/viettel/ewallet/database/mapprocess/EWMapProcessServicesNew.java#L60-L77), tham số thứ 14 (`discount`) là **OUTPUT** do Oracle `TARIFF` tự tính trả ra, không nhận giá trị động Gateway gửi vào. | **Dùng được cho ưu đãi cố định theo Hạng thẻ (`TIER`)** nếu đúng đối tượng chịu chiết khấu; **KHÔNG dùng được** cho Coin/Voucher động. | 1. Không nhận được số tiền Voucher/Coin biến thiên từng đơn hàng từ ISO F29.<br>2. Theo công thức `` `$AMOUNT$` - `$DISCOUNT$` ``, bất kỳ khoản `$DISCOUNT$` nào cũng bị trừ trực tiếp vào tiền về `W_Col` của đối tác. |
| **`ORG_AMOUNT`** *(ISO Field 4)* | Có khai báo trong [CoreFieldMap.java](/core-app/EwUtils/src/main/java/com/viettel/ewallet/utils/iso/wrapper/CoreFieldMap.java#L19), nhưng các Business (`571000`, `576000`, `576100`, `577100`) chưa đọc để tách với `AMOUNT`; `EWMapProcess` tự gán `org_amount = amount`. | **Tận dụng làm trường truyền Tổng hóa đơn gốc** trong phương án Ví Chung (`Giảm trừ Loyalty = F4 - F5`). | Cần chỉnh nhẹ Business handler để đọc tách `F4 (ORG_AMOUNT)` và `F5 (AMOUNT)`. |
| **`$BONUS1$`, `$BONUS2$`** *(ISO Field 30, 31)* | Đọc từ bảng `TARIFF` (`TARIFF_ITEM_ID = 2, 3`), thường dùng tính hoa hồng đại lý/kênh. | Không phù hợp để hạch toán tiêu Coin/Voucher. | Chỉ phản ánh hoa hồng cố định theo bảng cước, không nhận giá trị quy đổi động từ ví Loyalty. |
| **Luồng `575000` (`PayOnBehalf`) & `035404` (`BatchPayment`)** | • `575000` ([PayOnBehalfBusiness.java](/core-app/EwalletBusiness-parent/Business-575000/src/main/java/com/viettel/ewallet/core/business/PayOnBehalfBusiness.java)): Trích từ `MASTER_ACCOUNT` cộng trực tiếp vào ví khách.<br>• `035404` ([PayTransactionBusinessByProcess.java](/core-app/EwalletBusiness-parent/Business-035404/src/main/java/com/viettel/ewallet/core/business/PayTransactionBusinessByProcess.java)): Chuyển tiền giữa 2 `MASTER_ACCOUNT`. | **Dùng ngay được** (chỉ cấu hình SQL, không sửa Java Core). | Là công cụ lý tưởng để **bơm bù cuối chu kỳ** từ Quỹ Marketing Natcash / Công nợ đối tác vào Ví Chung `W_LOYALTY_POOL`. |
| **Nhánh Voucher sẵn có (`571003` + `571000` step `3/4`)** | Khi gọi `571000` với `F35 = "571003"` và `F117 = voucherId`, [PayMerchantServiceBussiness.java](/core-app/EwalletBusiness-parent/Business-571000/src/main/java/com/viettel/ewallet/core/business/PayMerchantServiceBussiness.java#L155-L212) bỏ PIN và chạy `STEP_1_VOUCHER = 3`, `STEP_2_VOUCHER = 4` trừ quỹ khuyến mãi nội bộ cho gói Telco/Paryajkado. | **Dùng ngay được** cho **Voucher Natcash tặng trọn gói 100%** (Airtime, Data, Postpaid, FTTH, Paryajkado). | Không hỗ trợ giảm giá một phần, không áp dụng được cho Merchant ngoài hệ thống Telco, và đang giới hạn 1 voucher tồn tại/ví. |

---

## 2. PHẦN I — CHI TIẾT VƯỚNG MẮC & GAP THEO 3 LOẠI TÀI SẢN (POINT, VOUCHER, COIN)

### 2.1. Đối với Point & Hạng thẻ (`TIER_POINT`, `GamePoint`)

1. **Khả thi dùng cấu hình Core có sẵn cho ưu đãi Hạng thẻ:** Vì `TIER_POINT` và `GamePoint` không quy đổi trực tiếp thành tiền, không cần hạch toán số dư điểm vào Core. Quyền lợi theo hạng thẻ (`SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`) hoàn toàn có thể khai báo bằng **`TARIFF` (`$FEE$` / `$DISCOUNT$`)** theo từng `TARIFF_PLAN_ID`.
2. **GAP cần xử lý khi mapping `TIER`:**
   * Theo [TARIFF_PLAN_DEFAULT.xlsx](/docs/policy/TARIFF_PLAN_DEFAULT.xlsx), cột `TIER` của khách hàng (`ROLE_ID = 4`) hiện đang khóa cứng cho **cấp độ eKYC**: `0` (`2073` — Customer chưa KYC), `1` (`2075` — Customer đã KYC), `2` (`2098` — `MINI_WALLET_NEW`), đồng thời gắn với hạn mức `RULE_CONDITION` ([DBUtils.java](/core-app/EwalletDBUtils/src/main/java/com/viettel/ewallet/database/query/DBUtils.java#L4000)). Do đó **không được ghi đè trực tiếp cột `TIER` KYC**, mà phải mapping qua tổ hợp `TARIFF_PLAN_ID`.
   * Khi Core `Revert` giao dịch (`577100` state `-1` hoặc hủy đơn `payment-gw`), `micro-loyalty` chưa nhận sự kiện để thu hồi `TIER_POINT` và `LOYALTY_COIN` đã tích trước đó.

### 2.2. Đối với Voucher (`LoyaltyVoucherEntity` vs. Voucher Core)

1. **Bắt buộc nâng cấp mới hạch toán được:** Cơ chế `571003`/`571004`/`571005` + `571000` (step `3/4`) chỉ tặng trọn gói 100% dịch vụ Telco/Paryajkado từ `NATCASH_PROMOTION.VOUCHER_ORDER`, giới hạn giữ 1 voucher chưa dùng (`isVoucherExist`) và hiển thị tối đa 3 bản ghi (`571004`). Không thể áp dụng cho Voucher giảm giá theo `%` hoặc giảm một phần hóa đơn tại Merchant/Payment Point/Payment GW.
2. **Thiếu hỗ trợ nhiều mã Voucher & ghi nhận vào đối soát trong `micro-loyalty`:**
   * Hiện [RewardWalletService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/wallet/service/RewardWalletService.java#L423-L424) và [PartnerPaymentGatewayService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/wallet/service/PartnerPaymentGatewayService.java#L428-L429) mới cho nhập 1 `voucherCode` và chỉ gán `ClearingTransactionEntity.fiatAmount = pointDiscount` (bỏ quên tiền giảm giá của Voucher).
   * [LoyaltyVoucherEntity.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/wallet/entity/LoyaltyVoucherEntity.java) chưa có cấu hình nguồn tài trợ tường minh (`NATCASH` / `PARTNER` / tỷ lệ đồng tài trợ) để quy đổi công nợ cuối chu kỳ.

### 2.3. Đối với Coin (`LOYALTY_COIN` — Quy đổi `1 Coin = 1 HTG`)

1. **Bắt buộc nâng cấp mới hạch toán được:** Core chưa có `MASTER_ACCOUNT` làm quỹ thanh toán bù trừ Coin (hằng số `COIN_TRANS_MIN`/`COIN_TRANS_MAX` trong `DBUtils.java` chỉ là tên biến cũ chỉ hạn mức tiền thật HTG).
2. **Chưa hỗ trợ thanh toán hỗn hợp & trường hợp `0 HTG`:** `576000`, `576100`/`577100`, `571000` chỉ nhận 1 số tiền từ ví khách và bị `RULE_CONDITION` min `1`/`20 HTG` chặn nếu ví khách trả `0 HTG`.
3. **Thiếu API thật hai chiều & phân rã nguồn Coin trong `micro-loyalty`:** [NatcashWalletClient.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/integration/NatcashWalletClient.java) và [NatcashPaymentProvider.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/integration/provider/NatcashPaymentProvider.java) vẫn ở trạng thái fallback/stub; `PartnerPaymentGatewayService` đang gán cứng `issuerPartnerId(1L)` thay vì lưu bóc tách từng lô Coin FIFO (`loyalty_currency_buckets`) để biết phải thu từ đơn vị nào.

---

## 3. PHẦN II — GIẢI PHÁP KIẾN TRÚC ĐƠN GIẢN & TỐI ƯU ĐỀ XUẤT

Thay vì ép Core phải hiểu từng mã Voucher, từng nguồn Coin hay tỷ lệ đồng tài trợ ngay tại thời điểm thanh toán, kiến trúc tối ưu tách bạch rạch ròi theo nguyên tắc:

1. **Point / Hạng thẻ (`TIER`)** → Khai báo tĩnh trong `TARIFF` theo tổ hợp `TARIFF_PLAN_ID` trên Core.
2. **Voucher & Coin** → **Core chỉ hạch toán tổng số tiền giảm trừ gắn với 1 Ví Chung duy nhất (`W_LOYALTY_POOL`)**; toàn bộ việc bóc tách chi tiết *(mã voucher nào, bao nhiêu Coin, bên nào tài trợ, thu của đơn vị nào)* giao cho **`micro-loyalty` tính toán theo cấu hình từng chương trình và tổng hợp bù trừ vào cuối chu kỳ (T+ / Tuần / Tháng)**.

### 3.1. Mô hình khai báo `TIER` cho Point / Hạng thẻ trên Core

* **Nguyên tắc Mapping `TARIFF_PLAN_ID`:** Giữ nguyên cột `TIER` (`0`, `1`, `2`) cho eKYC và hạn mức `RULE_CONDITION`. Khai báo thêm bộ `TARIFF_PLAN_ID` theo ma trận `(KYC_TIER × LOYALTY_TIER)` trong `TARIFF_PLAN_DEFAULT` và `TARIFF_PLAN_MAPPING` (ví dụ: `Customer_KYC_SILVER`, `Customer_KYC_GOLD`, `Customer_KYC_PLATINUM`, `Customer_KYC_DIAMOND`). Khi khách thăng/hạ hạng trên `micro-loyalty`, Webhook cập nhật lại `TARIFF_PLAN_ID` của tài khoản trên Core.
* **Quy tắc dùng `$FEE$` và `$DISCOUNT$`:**
  * Ưu tiên cấu hình **giảm `$FEE$`** trên các `TARIFF_PLAN_ID` hạng cao (miễn/giảm phí chuyển tiền, thanh toán) vì không làm hụt tiền về `W_Col` của đối tác.
  * Chỉ cấu hình **`$DISCOUNT$`** cho hạng thẻ đối với **dịch vụ nội bộ Natcom/Natcash** hoặc **đối tác chấp nhận tự chịu chiết khấu VIP** (do công thức Core trừ `W_Col = $AMOUNT$ - $DISCOUNT$`).

### 3.2. Mô hình Ví Chung `W_LOYALTY_POOL` tại Core + Bóc tách hậu kỳ tại `micro-loyalty` (cho Voucher & Coin)

#### A. Định nghĩa Ví Chung trên Core (`MASTER_ACCOUNT`)
Khởi tạo **duy nhất 1 tài khoản Ví Chung** trên Oracle:
* **Mã tài khoản:** `W_LOYALTY_POOL` *(Ví Tổng Thanh Toán & Tạm Ứng Giảm Trừ Loyalty)*.
* **Loại tài khoản (`ACCOUNT_TYPE_ID`):** `5` (`TEMP`) hoặc `3` (`REVENUE` chuyên biệt).
* **Vốn đệm (Prefund / Float):** Nạp sẵn hạn mức vốn đệm (đủ chi trong 1–2 chu kỳ) để `PCK_ACCOUNTING` không báo lỗi `10839` (*thiếu số dư*) khi trích tức thời. Cuối chu kỳ sẽ bơm bù đúng số tiền đã chi để quay về mức vốn đệm ban đầu.

#### B. Ví dụ minh họa luồng hạch toán 1 giao dịch (Hóa đơn 1.000 HTG)

Giả sử khách thanh toán hóa đơn **1.000 HTG** (phí `11 HTG`), được giảm tổng **250 HTG** gồm:
* Mã Voucher `VC_DELI_100`: giảm `100 HTG` *(cấu hình chương trình: Đồng tài trợ Delimart `60%` — Natcash `40%`)*.
* Mã Voucher `VC_NAT_50`: giảm `50 HTG` *(cấu hình chương trình: Natcash tài trợ `100%`)*.
* Dùng `100 LOYALTY_COIN`: quy đổi `100 HTG` *(trừ theo lô FIFO gồm `70 Coin` từ chương trình Natcash và `30 Coin` từ chiến dịch đối tác Total)*.
* Khách trả từ Ví Natcash: **`750 HTG`**.

**Bước 1 — Tại thời điểm giao dịch trên Core (Siêu đơn giản, không phân biệt nguồn):**
* Gateway gửi ISO: `F4 (ORG_AMOUNT) = 1000`, `F5 (AMOUNT) = 750`, `F114/F117 = holdCode`.
* Core tính tổng giảm trừ: `LoyaltyOffset = F4 - F5 = 250 HTG`.
* Gọi 2 bút toán qua `EWMapProcess.Execute` (không cần sửa Stored Procedure `PCK_ACCOUNTING`):
  1. `Ví khách` → `W_Temp`: **`750 + 11 = 761 HTG`**.
  2. `W_LOYALTY_POOL` → `W_Temp`: **`250 HTG`**.
* Khi giao dịch thành công (`577100` state `1` / `571000` step `2` / `576000`):
  * `W_Temp` → `W_Col` *(đối tác / Payment Point)*: **Đủ `1.000 HTG` (100% hóa đơn ngay lập tức)**.
  * `W_Temp` → TK Thuế (`5`): `10 HTG`; TK Phí (`17`): `1 HTG`.
* Nếu giao dịch thất bại / Revert (`577100` state `-1`): Core hoàn `761 HTG` về `Ví khách`, hoàn `250 HTG` về `W_LOYALTY_POOL`, và Gateway gọi `cancel` mở khóa Coin/Voucher ở Loyalty.

**Bước 2 — Cuối chu kỳ (Tuần / Tháng / T+) trên `micro-loyalty` (Bóc tách thu hồi về `W_LOYALTY_POOL`):**
`micro-loyalty` căn cứ `holdCode` của các giao dịch đã `CAPTURED`, tra cứu cấu hình từng chương trình Voucher và từng lô Coin FIFO để xuất **Bảng kê bù trừ hoàn trả về `W_LOYALTY_POOL`**:

| Thành phần trong `250 HTG` giảm trừ | Cấu hình chương trình tương ứng | Số tiền bóc tách phải thu về `W_LOYALTY_POOL` |
| :--- | :--- | :--- |
| `VC_DELI_100` (`100 HTG`) | Đồng tài trợ: Delimart `60%`, Natcash `40%` | Thu từ **Delimart**: `60 HTG` · Thu từ **Quỹ Natcash**: `40 HTG` |
| `VC_NAT_50` (`50 HTG`) | Natcash tài trợ `100%` | Thu từ **Quỹ Natcash**: `50 HTG` |
| `100 LOYALTY_COIN` (`100 HTG`) | FIFO: `70 Coin` nguồn Natcash + `30 Coin` chiến dịch Total | Thu từ **Quỹ Natcash**: `70 HTG` · Thu từ **Total**: `30 HTG` |
| **Lệnh chốt bù cuối chu kỳ về Core** | Gom theo từng đơn vị chịu chi phí (`035404` / Công nợ đối tác) | • **Ngân sách Natcash** → `W_LOYALTY_POOL`: **`160 HTG`**<br>• **Delimart** → `W_LOYALTY_POOL`: **`60 HTG`**<br>• **Total** → `W_LOYALTY_POOL`: **`30 HTG`**<br>*(Tổng = `250 HTG`, bù khít 100% với số tiền `W_LOYALTY_POOL` đã tạm ứng)* |

> **Phương trình đối soát hàng ngày / cuối chu kỳ:**  
> `Vốn đệm ban đầu (W_LOYALTY_POOL) - Số dư hiện tại (W_LOYALTY_POOL) == Tổng (Coin + Voucher) đã CAPTURED trên micro-loyalty == Tổng (Natcash bù + Các đối tác bù) trên bảng kê chốt kỳ`.

*(Ghi chú cho Voucher trọn gói Telco `571003`/`571000` step `3/4`: vẫn có thể giữ luồng riêng hiện có của Core nếu muốn giữ trải nghiệm bỏ PIN cũ, hoặc quy đồng bộ hết về cơ chế `W_LOYALTY_POOL` ở trên để quản lý tập trung toàn bộ Voucher ở `micro-loyalty`.)*

---

## 4. PHẦN III — CÁC HẠNG MỤC CẦN NÂNG CẤP TRÊN 5 HỆ THỐNG NATCASH & `micro-loyalty`

Nhờ đẩy toàn bộ logic bóc tách nguồn tài trợ về `micro-loyalty` và dùng `W_LOYALTY_POOL` trên Core, khối lượng sửa đổi ở các hệ thống Natcash được tối giản như sau:

| Hệ thống | Hiện trạng / Vướng mắc chính | Hạng mục nâng cấp tối giản & tối ưu |
| :--- | :--- | :--- |
| **1. Core** (`core-app` & Oracle DB) | • Chưa có `MASTER_ACCOUNT` Ví Chung Loyalty.<br>• `571000`, `576000`, `576100`/`577100` chỉ trừ 1 dòng tiền từ `FROM_ACC_ID` theo `F5`, chưa đọc `F4 (ORG_AMOUNT)`, và `RULE_CONDITION` chặn `F5 = 0`.<br>• Chưa có `TARIFF_PLAN_ID` cho hạng VIP Loyalty và chưa bắn sự kiện Revert sang Loyalty. | • Tạo **1 tài khoản `W_LOYALTY_POOL`** + 1 cặp cấu hình `PROCESS_MAPPING` trích/hoàn `W_LOYALTY_POOL ↔ W_Temp` *(không cần sửa Stored Procedure `PCK_ACCOUNTING` / `PCK_JAVA_ACCOUNTING`)*.<br>• Tại `576100`/`577100`, `576000`, `571000`: đọc `F4 (ORG_AMOUNT)` và `F5 (AMOUNT)`; nếu `F4 > F5`, gọi `EWMapProcess.Execute` trích `F4 - F5` từ `W_LOYALTY_POOL`; cho phép `F5 = 0` trong `check_rule_new` khi `F4 > 0`.<br>• Khai báo `TARIFF_PLAN_ID` cho tổ hợp `(KYC_TIER × LOYALTY_TIER)` để dùng `$FEE$` / `$DISCOUNT$` theo hạng thẻ.<br>• Kích hoạt `035404` cuối chu kỳ để bơm bù lại `W_LOYALTY_POOL`; đẩy Outbox event khi Core thành công/Revert sang `micro-loyalty`. |
| **2. Payment Point** (`payment-point`) | • [RevenueRecordingService.java](/payment-point/service/api-service/src/main/java/io/natcash/payment/api/service/RevenueRecordingService.java#L84-L114) tính `netAmount = amount + commissionAmount`, chỉ lưu `discountAmount` thụ động.<br>• Nếu Core chỉ gửi `Net` thì [WithdrawalService.java](/payment-point/service/api-service/src/main/java/io/natcash/payment/api/service/WithdrawalService.java) sẽ hụt tiền khi shop rút. | • **Không phải sửa công thức thanh khoản hay khóa rút tiền:** Vì Core đã trích bù từ `W_LOYALTY_POOL` vào `W_Col_PAYMENT_POINT` đủ `100% ORG_AMOUNT`, Payment Point vẫn nhận đủ `amount = ORG_AMOUNT` và shop rút tiền bình thường.<br>• Chỉ cần mở rộng [RecordRevenueRequest.java](/payment-point/service/api-service/src/main/java/io/natcash/payment/api/dto/RecordRevenueRequest.java) nhận thêm `walletPaidAmount`, `loyaltyDiscountAmount`, `loyaltyHoldCode` để hiển thị/in chi tiết trên lịch sử & hóa đơn cho chủ shop. |
| **3. Mobile App** (`natcash-eu-app` & `natcash-eu-api`) | • [LoyaltyServices.tsx](/mobile/natcash-eu-app/src/services/LoyaltyServices.tsx) đã có trên App nhưng `natcash-eu-api` thiếu Controller `/loyalty/*` ở nhánh hiện tại.<br>• [MyVoucher/index.tsx](/mobile/natcash-eu-app/src/screens/MyVoucher/index.tsx) chỉ đọc tối đa 3 voucher Core.<br>• `PaymentPointDepositController`, `TopUpController`, `OnlinePaymentTransController` chưa nối `micro-loyalty`. | • **Trên `natcash-eu-api`:** Bổ sung Controller `/loyalty/*`, endpoint `/wallet/v1/credit-cashback` (`575000`), Webhook cập nhật `TARIFF_PLAN_ID` theo hạng, và **Orchestrator 2 pha**: `Hold` ở `micro-loyalty` → gửi Core `F4 = Bill`, `F5 = Bill - Giảm trừ`, `F114/F117 = holdCode` → `Confirm` hoặc `Cancel`.<br>• **Trên `natcash-eu-app`:** Thêm Widget chọn dùng Coin & nhiều mã Voucher ở màn hình xác nhận thanh toán; hợp nhất hiển thị kho voucher tại `MyVoucher`. |
| **4. USSD** (`ussd-app`) | • [PaymentPointShortCutService.java](/ussd-app/Source/src/main/java/com/viettel/ewallet/ussdapp/customer/PaymentPointShortCutService.java), [TopUpMobileService.java](/ussd-app/Source/src/main/java/com/viettel/ewallet/ussdapp/customer/TopUpMobileService.java) chưa có bước áp dụng Coin/Voucher.<br>• [StartSessionVoucherService.java](/ussd-app/Source/src/main/java/com/viettel/ewallet/ussdapp/customer/StartSessionVoucherService.java) chỉ đọc Voucher Core (`571004`). | • Bổ sung gọi 1 API `inquiry-best-offer` từ `micro-loyalty` để hiển thị tối đa 2 lựa chọn ngắn gọn trên màn hình USSD (`[1] Trả bằng Ví X HTG`, `[2] Dùng Coin/Voucher còn Y HTG`), sau đó gọi `Hold → Core (F4, F5, holdCode) → Confirm/Cancel`.<br>• Thêm menu Loyalty rút gọn trên `*202#` (xem Coin/Hạng, đổi Coin lấy Data/Airtime). |
| **5. Payment Gateway** (`payment-gw`) | • [PaymentMerchantServiceImpl.java](/payment-gw/payment-gw-be/natcash-payment-apigw/src/main/java/ht/natcom/natcash/service/PaymentMerchantServiceImpl.java) chạy `311005` → `576000` chỉ nhận 1 số tiền và `cancel-trans` chỉ revert bên Core. | • Bổ sung tham số Coin/Voucher tại `initTransaction` & `confirmOtp` → `Hold Loyalty → Core 576000 (F4, F5, holdCode) → Confirm/Cancel`.<br>• Webhook trả về website đối tác giữ nguyên `originalAmount` kèm chi tiết `walletPaid` & `loyaltyDiscount`; `cancel-trans` gọi hoàn đồng bộ cả Core và `micro-loyalty`. |
| **6. Đồng bộ tại `micro-loyalty`** | • Mới hỗ trợ 1 mã voucher đơn lẻ; `ClearingTransactionEntity` chưa lưu tiền giảm Voucher; `PartnerPaymentGatewayService` gán cứng `issuerPartnerId(1L)`; `NatcashWalletClient`/`NatcashPaymentProvider` đang stub/fallback. | • *(Đã hoàn thiện cơ chế mã động 5 phút)* `VoucherDynamicCodeService` ẩn mã cố định ở người dùng cuối, sinh mã động 8 ký tự `Crockford Base32` (ký `Ed25519` + `AES-256-GCM`, TTL 300s) và xác thực qua API `checkVoucher` trước khi tiêu thụ.<br>• Mở rộng hỗ trợ áp dụng **mảng nhiều mã voucher động + `pointsToBurn`** trong cùng 1 `holdCode`.<br>• Bổ sung **bảng phân rã chi tiết nguồn tài trợ** theo từng mã Voucher (tỷ lệ tài trợ chương trình) và từng lô Coin FIFO (`loyalty_currency_buckets`).<br>• Nâng cấp [ClearingSettlementService.java](../../src/lib/loyalty-common/src/main/java/com/natcash/loyalty/clearing/service/ClearingSettlementService.java) tổng hợp công nợ cuối chu kỳ T+/Tuần/Tháng theo từng **đơn vị tài trợ** để hoàn bù về `W_LOYALTY_POOL`.<br>• Bỏ cơ chế fallback trả `true` ở `NatcashWalletClient` / `NatcashPaymentProvider`. |

---

## 5. LỘ TRÌNH TRIỂN KHAI 3 GIAI ĐOẠN

| Giai đoạn | Phạm vi thực hiện | Hệ thống tham gia | Giá trị bàn giao |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1: Hạng thẻ `TIER` & Nền tảng kết nối** | • Khai báo `TARIFF_PLAN_ID` theo `(KYC_TIER × LOYALTY_TIER)` để giảm `$FEE$`/`$DISCOUNT$` theo hạng thẻ.<br>• Tạo `W_LOYALTY_POOL` + cấp vốn đệm + nối `/loyalty/*` trên `natcash-eu-api`.<br>• Bổ sung lưu phân rã chi tiết Voucher + Coin FIFO trên `micro-loyalty`. | `core-app` (SQL), `natcash-eu-api`, `micro-loyalty` | Áp dụng được ngay ưu đãi theo hạng thẻ (`Point`) trên Core và hoàn thiện API nền cho App. |
| **Giai đoạn 2: Checkout Ví Chung `W_LOYALTY_POOL` đa kênh** | • Bổ sung xử lý `F4 (ORG_AMOUNT)` / `F5 (AMOUNT)` + trích `W_LOYALTY_POOL` vào `576100`/`577100`, `576000`, `571000` và cho phép `F5 = 0`.<br>• Triển khai Hold/Confirm/Cancel trên Mobile App, USSD và Payment GW.<br>• Giữ nguyên luồng rút tiền Payment Point với `100% ORG_AMOUNT`. | `core-app`, `natcash-eu-app`, `natcash-eu-api`, `ussd-app`, `payment-gw`, `payment-point` | Khách hàng toàn hệ sinh thái tiêu được **nhiều mã Voucher + Coin** mượt mà; Merchant nhận đủ 100% tiền ngay. |
| **Giai đoạn 3: Tự động hóa Bóc tách & Bù trừ cuối chu kỳ** | • Vận hành Job đối soát 1-1 giữa nhật ký `W_LOYALTY_POOL` trên Core với `holdCode` trên `micro-loyalty`.<br>• Tự động sinh lệnh `035404` / công nợ đối tác cuối Tuần / Tháng / T+ bơm bù chính xác về `W_LOYALTY_POOL`. | `micro-loyalty`, `core-app` (`035404`), CMS Đối soát | Khép kín 100% dòng tiền tài trợ, đồng tài trợ và thu hồi công nợ đối tác cuối chu kỳ. |
