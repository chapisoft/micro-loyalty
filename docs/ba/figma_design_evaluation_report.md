# BÁO CÁO ĐÁNH GIÁ THIẾT KẾ GIAO DIỆN FIGMA SO VỚI TÀI LIỆU PHÂN TÍCH THIẾT KẾ (BA / LLD)

> **Dự án:** Hệ sinh thái Khách hàng Thân thiết Liên minh & Cổng Game Đa thuê bao (`Natcash Loyalty & GameHub Platform`)
> **Nguồn thiết kế đối chiếu:** [Figma — Natcash (Page: Loyalty `1168:2725`)](https://www.figma.com/design/exk9D9x6gHQPD0feUadthB/Natcash?node-id=1168-2725)
> **Bảng tổng hợp đối chiếu:** [Danh_sach_man_hinh_Figma_Loyalty.xlsx](https://docs.google.com/spreadsheets/d/1_Ju5RVeXap_g95ipCXK5Bg5nbZGznkjY/edit?gid=578312992#gid=578312992)
> **Tài liệu đối chiếu:**
> - [solution.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/solution.md) (Tài liệu Giải pháp Tổng thể v2.1)
> - [detailed_design.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/detailed_design.md) (Tài liệu Thiết kế Chi tiết Cấp thấp v2.1)
> - [architecture_evolution_v2.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/architecture_evolution_v2.md) (Kiến trúc Tiến hóa v2.1)
> - [datalake_integration_spec.md](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/datalake_integration_spec.md) (Đặc tả Tích hợp Data Lake v1.1)
> - [Loyalty Natcash · Giải pháp & thiết kế.pdf](file:///Users/micro/Source/chapisoft/micro-loyalty/docs/ba/Loyalty%20Natcash%20%C2%B7%20Gi%E1%BA%A3i%20ph%C3%A1p%20%26%20thi%E1%BA%BFt%20k%E1%BA%BF.pdf) (Slide trình bày giải pháp 16 trang)
> **Ngày đánh giá:** 13/11/2026

---

## 1. TỔNG QUAN QUY MÔ VÀ PHẠM VI RÀ SOÁT TRÊN FIGMA

Qua trích xuất trực tiếp cây cấu trúc (`1168:2725` — trang `Loyalty`) từ Figma MCP Server và đối chiếu chéo với bảng tổng hợp `Danh_sach_man_hinh_Figma_Loyalty.xlsx`, bản thiết kế hiện tại bao phủ **cả 3 nền tảng giao diện** với tổng cộng **19 Section** và **122 thẻ màn hình (Screen Cards)**:

1. **Khối Quản trị Nội bộ (`Back Office CMS` — dành cho nhân sự vận hành Natcash):**
   - Gồm **10 Section** (`20584:1259` đến `20584:11931`) + 1 Section Tổng quan (`20584:1079`).
   - Tổng số màn hình: **45 màn hình Desktop (`1440px`)** (48 thẻ màn hình nếu tính cả 3 màn hình Cổng đối tác đặt chung trong Section 3 và Section 10 để minh họa luồng).
2. **Khối Cổng Đối tác Liên minh (`Merchant Partner Portal` — dành cho chủ thương hiệu và nhân viên điểm bán):**
   - Gồm **Section 11** (`20584:13105` — 8 màn hình) và **3 màn hình luồng đối tác** đặt trong Section 3 (`20584:4298`) & Section 10 (`20584:12924`).
   - Tổng số màn hình: **8 màn hình độc lập** (11 thẻ màn hình `1440px` trên toàn trang).
3. **Khối Khách hàng Cuối (`Natcash Mobile App`, `Loyalty Webview` & `USSD *202#`):**
   - Gồm **6 Section** (`20609:2064` đến `20609:9854`) + 1 Section Tổng quan (`20609:1925`).
   - Tổng số màn hình: **66 thẻ màn hình Mobile (`390px` / `375px`)** (gồm 59 màn hình trong danh sách cũ + 3 màn phương án trang chủ `NC-HM-01` + 4 màn hình mới thuộc nhóm Game Học tập `GM-01 / GM-02 English Daily`).

### Bảng tổng hợp độ phủ thiết kế theo 3 nền tảng

| Nền tảng giao diện | Số Section trên Figma | Số thẻ màn hình đã thiết kế | Số màn hình / tính năng hoàn chỉnh (`Đủ`) | Số hạng mục `Một phần` (Cần sửa / bổ sung) | Số màn hình `Thiếu` (Cần vẽ mới) | Tỷ lệ đáp ứng so với BA / LLD |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Back Office CMS (Quản trị Natcash)** | 10 Sections | 45 màn hình | 38 màn hình | 7 hạng mục | 8 màn hình | **~82%** |
| **2. Merchant Partner Portal (Cổng Đối tác)** | 1 Section (+2 luồng) | 11 màn hình (8 màn độc lập) | 8 màn hình | 0 hạng mục | 1 màn hình (`CN-08`) | **~90%** |
| **3. Mobile App / Webview / USSD (Khách hàng & Đại lý)** | 6 Sections | 66 màn hình | 54 màn hình | 7 hạng mục | 4 màn hình | **~83%** |
| **TỔNG CỘNG TOÀN HỆ THỐNG** | **19 Sections** | **122 thẻ màn hình** | **100 màn hình** | **14 hạng mục** | **13 màn hình** | **~83%** |

---

## 2. PHÁT HIỆN QUAN TRỌNG KHI ĐỐI CHIẾU VỚI FILE TỔNG HỢP CŨ (`Trang tính1`)

Khi rà soát đối chiếu từng dòng trong tab `Trang tính1` (`gid=578312992`) với cây thiết kế thực tế trên Figma (`1168:2725`), phát hiện **3 điểm sai lệch lớn** trong bản tổng hợp cũ cần cập nhật lại:

1. **6 chức năng trong tab `Trang tính1` cũ đang ghi nhận `Đủ` và dẫn chiếu tên màn hình Figma không tồn tại trên thực tế:**
   - **`HV-09` (Khóa/mở khóa hội viên):** Ghi có màn `HV-05 Lock or unlock a member`, nhưng trên Figma (`20584:3708`) mới chỉ có bảng danh sách hội viên, **chưa có frame hộp thoại khóa/mở khóa**.
   - **`GM-07` (Thống kê game trên CMS):** Ghi có màn `GM-03 Game statistics & play history`, nhưng trên Figma Section 5 (`20584:6087`) chỉ có 4 màn (`Games & prizes`, `Add or edit game`, `Prize table`, `Game hub configuration`), **chưa có frame thống kê & lịch sử chơi phía CMS**.
   - **`CN-08` (Nhắc cho đối tác trên Cổng đối tác):** Ghi có màn `CN-08 Partner notifications`, nhưng trên Figma Section 11 (`20584:13105`) chỉ có 8 màn hình, **hoàn toàn chưa có frame `CN-08`**.
   - **`NS-05` (Báo cáo đối tác & bán chéo trên CMS):** Ghi có màn `NS-05 Partner report · cross-sell`, nhưng trên Figma chỉ có `NS-04 Partner dashboard` phía Cổng đối tác, **chưa có frame `NS-05` phía CMS**.
   - **`NS-06` (Báo cáo điểm tồn và nghĩa vụ tài chính dự kiến):** Ghi có màn `NS-06 Points liability report`, nhưng trên Figma **chưa có frame `NS-06`** (mới có 1 ô KPI nhỏ trên Dashboard `NS-02`).
   - **`NS-07` (Xuất báo cáo Excel; gửi báo cáo định kỳ qua email):** Ghi có màn `NS-07 Scheduled reports & export`, nhưng trên Figma **hoàn toàn chưa có frame `NS-07`**.
2. **4 màn hình mới thuộc nhóm Game Học tập (`Learning / EdTech`) đã được thiết kế thêm trên Figma App nhưng chưa được cập nhật vào cả 2 tab `App` và `Trang tính1`:**
   - `GM-01 · Category · Learning (See all)` (`20609:8938`)
   - `GM-02 · Game details · before play (English Daily)` (`20609:9027`)
   - `GM-02 · English Daily · lesson` (`20609:9118`)
   - `GM-02 · English Daily · lesson complete (popup)` (`20609:9193`)
3. **Các phân hệ mới từ Slide Giải pháp & Kiến trúc v2.1 chưa được đưa vào bảng đối chiếu `Trang tính1`:**
   - Quản trị kho câu hỏi Học tập / Đố vui trên CMS (`GM-09`).
   - Mã QR/Barcode Ví Phần Thưởng động 60 giây tại quầy POS (`LM-17`).
   - Phân hệ Đại lý & Tổng đại lý (`Agent & Super Agent`: `AG-01`, `AG-02`, `AG-03`).
   - Trợ lý AI thiết kế chiến dịch & Cảnh báo xung đột chiến dịch (`AI-01`).

---

## 3. ĐÁNH GIÁ CHI TIẾT KHỐI 1: BACK OFFICE CMS (QUẢN TRỊ NỘI BỘ NATCASH)

### 3.1. Danh sách 10 Section và 45 màn hình CMS trên Figma

| Section trên Figma | Mã màn | Tên màn hình trên Figma (`Node ID`) | Tình trạng | Đánh giá chi tiết so với BA / LLD |
| :--- | :---: | :--- | :---: | :--- |
| **Section 1: Sign-in & administration** (`20584:1259`) | `QT-01` | 1. `Sign in` (`20584:1264`)<br>2. `Verify OTP` (`20584:1359`)<br>3. `OTP not valid` (`20584:1443`)<br>4. `OTP expired` (`20584:1525`) | **Đã làm** | Đầy đủ luồng đăng nhập 2 lớp (Mật khẩu + SMS OTP 6 số) và các trạng thái lỗi/hết hạn mã OTP. |
| | `QT-02` | 5. `Users` (`20584:1608`)<br>6. `Roles & permissions` (`20584:1840`) | **Đã làm** | Đầy đủ danh sách tài khoản quản trị và phân quyền RBAC. |
| | `QT-05` | 7. `System parameters` (`20584:2156`)<br>8. `Audit log` (`20584:2590`) | **Một phần** | Màn `Audit log` (`20584:2590`) mới có bảng danh sách phẳng, **thiếu Modal/Drawer xem chi tiết `JSONB Diff` (`Dữ liệu trước` và `Dữ liệu sau`)** theo yêu cầu `QT-04` trong PTTK. |
| | `QT-07` | 9. `Queue & failed events` (`20584:2990`) | **Đã làm** | Đầy đủ bảng giám sát hàng đợi sự kiện và nút `Resend all (batch re-trigger)`. |
| **Section 2: Members & tiers** (`20584:3193`) | `HV-04` | 10. `Tier configuration` (`20584:3198`) | **Một phần** | Đã có cấu hình 4 hạng (`Silver`, `Gold`, `Platinum`, `Diamond`) và chu kỳ 12 tháng, nhưng **ngưỡng điểm đang ghi `0 / 3,000 / 10,000 / 30,000`**, lệch với đặc tả chính sách (`0 / 1,000 / 5,000 / 15,000`). |
| | `HV-06` | 11. `Tier distribution` (`20584:3473`) | **Đã làm** | Đầy đủ biểu đồ phân bố hội viên theo 4 hạng và danh sách sắp lên hạng / nguy cơ tụt hạng. |
| | `HV-05` | 12. `Member lookup` (`20584:3708`) | **Một phần** | Mới có bảng tìm kiếm hội viên. **Thiếu màn hình/Drawer chi tiết Hồ sơ Hội viên 360** (`HV-08`: lịch sử hạng, biến động điểm, nhiệm vụ, voucher, giao dịch dùng điểm) và **thiếu hộp thoại Khóa/Mở khóa hội viên** (`HV-09`). |
| **Section 3: Partners & connections** (`20584:3921`) | `LM-05`<br>`LM-06` | 13. `Partner profile` (`20584:3926`)<br>15. `Policy approval` (`20584:4447`) | **Đã làm** | Đầy đủ danh sách đối tác liên minh và màn hình phê duyệt chính sách tỷ lệ tích/tiêu điểm 4 cấp. *(Màn 14 `20584:4297` là màn hình của Partner Portal).* |
| | `QT-06` | 16. `Connection · IP & webhook` (`20584:4732`)<br>17. `Create or rotate API key` (`20584:4821`)<br>18. `New key · shown once` (`20584:4910`)<br>19. `Connections overview` (`20584:4998`) | **Một phần** | Màn `Connections overview` (`20584:4998`) mới hiển thị 4 kết nối (`WSO2`, `Mobile Service`, `Payment Point`, `BCCS · WsPromotion`), **thiếu 2 thẻ kết nối `USSD Gateway (*202#)` và `Data Lake / DWH`** theo Slide 16. |
| **Section 4: Rewards & vouchers** (`20584:5229`) | `VQ-04` | 20. `Reward catalogue` (`20584:5234`)<br>21. `Create or edit reward` (`20584:5551`)<br>22. `Import · file check` (`20584:5675`)<br>23. `Import · confirm` (`20584:5818`)<br>24. `Import · done` (`20584:5961`) | **Đã làm** | Thiết kế rất chi tiết luồng quản lý kho quà và 3 bước nhập lô mã Voucher từ tệp CSV (kiểm tra dòng lỗi, xác nhận lô, hoàn tất nhập kho). |
| **Section 5: Games** (`20584:6087`) | `GM-03` | 25. `Games & prizes` (`20584:6092`)<br>26. `Add or edit game` (`20584:6611`)<br>27. `Prize table` (`20584:6735`)<br>28. `Game hub configuration` (`20584:6967`) | **Một phần** | Đã có quản lý danh mục game, bảng xác suất trúng thưởng (`Tổng = 100%`) và cấu hình sảnh. **Thiếu màn hình quản trị bộ câu hỏi Học tập / Đố vui (`GM-09`)** và **thiếu màn hình thống kê & lịch sử chơi chi tiết trên CMS (`GM-07`)**. |
| **Section 6: Programs & missions** (`20584:7447`) | `NV-04`<br>`NV-05`<br>`QT-04`<br>`NV-06`<br>`NS-03` | 29. `Programs` (`20584:7452`)<br>30. `Create program from template` (`20584:7764`)<br>31. `Approval queue` (`20584:7926`)<br>32. `Program tracking` (`20584:8160`)<br>33. `Program effectiveness` (`20584:8356`) | **Một phần** | Đã có danh sách chương trình, hàng đợi duyệt hai người (`Maker-Checker`) và báo cáo `Lift vs control group`. Tuy nhiên màn `NV-05` (`20584:7764`) mới minh họa 1 mẫu đơn lẻ (`Number of transactions`), **cần bổ sung bộ dựng quy tắc đa tầng (`KHI – NẾU – THÌ – GIỚI HẠN`) cho đủ 9 nhóm nhiệm vụ** và **cảnh báo xung đột chiến dịch**. |
| **Section 7: Segments & messaging** (`20584:8603`) | `CN-03`<br>`CN-04` | 34. `Customer segments` (`20584:8608`)<br>35. `Reminder scenarios & send log` (`20584:8840`) | **Đã làm** | Màn `CN-03` (`20584:8608`) đã có bảng 7 phân khúc và khu vực `Edit segment` theo điều kiện quy tắc ở nửa dưới màn hình; màn `CN-04` (`20584:8840`) đã có danh sách kịch bản nhắc, giới hạn tần suất `max 1 push/day, 3/week · 08:00–20:00` và mẫu đa ngôn ngữ (`Kreyòl / Français / English`). |
| **Section 8: Dashboard, budget & alerts** (`20584:9092`) | `NS-02`<br>`NS-01`<br>`NS-03`<br>`CN-05` | 36. `Dashboard` (`20584:9097`)<br>37. `Budget` (`20584:9741`)<br>38. `Program effectiveness` (`20584:9958`)<br>39. `Alert center` (`20584:10177`) | **Một phần** | Đã có 4 màn hình Dashboard tổng quan, Ngân sách tháng, Đo lường hiệu quả Control Group và Trung tâm cảnh báo 12 sự kiện. Tuy nhiên **còn thiếu 3 màn hình báo cáo chuyên sâu trong PTTK: `NS-05` (Báo cáo đối tác & bán chéo trên CMS), `NS-06` (Báo cáo chi tiết điểm tồn & nghĩa vụ tài chính), `NS-07` (Cấu hình lập lịch gửi báo cáo định kỳ qua email)**. |
| **Section 9: Points ledger & adjustments** (`20584:10398`) | `DT-03`<br>`DT-02`<br>`QT-04` | 40. `Points ledger` (`20584:10403`)<br>41. `Create & approve adjustment` (`20584:11462`)<br>42. `Approval queue` (`20584:11675`) | **Đã làm** | Đầy đủ sổ cái điểm bất biến, tạo yêu cầu điều chỉnh điểm thủ công có kiểm tra hạn mức phê duyệt (`max 5,000 pts per request`) và hàng đợi duyệt 2 lớp. |
| **Section 10: Clearing & partner payment** (`20584:11931`) | `LM-07` | 43. `Clearing, claims & payment batches` (`20584:11936`)<br>44. `Mismatches & claims` (`20584:12388`)<br>45. `Handle claim KN-0611-001` (`20584:12522`)<br>46. `Create payment batch` (`20584:12637`)<br>47. `Track batch PAY-2026-11-W2` (`20584:12780`) | **Đã làm** | Thiết kế rất hoàn chỉnh toàn bộ quy trình đối soát bù trừ ròng đa phương (`Multilateral Netting`), xử lý khiếu nại lệch giao dịch (`KN-0611-001`), tạo lô thanh toán và theo dõi trạng thái chuyển tiền. *(Màn 48 `20584:12923` là màn hình của Partner Portal).* |

---

## 4. ĐÁNH GIÁ CHI TIẾT KHỐI 2: MERCHANT PARTNER PORTAL (CỔNG ĐỐI TÁC LIÊN MINH)

| Mã màn | Tên màn hình trên Figma (`Node ID`) | Tình trạng | Đánh giá chi tiết so với BA / LLD |
| :---: | :--- | :---: | :--- |
| `NS-04` | 49. `Partner dashboard` (`20584:13110`) | **Đã làm** | Đầy đủ KPI khách thanh toán, giao dịch dùng điểm, khách mới, chi phí đồng tài trợ và hiệu quả bán chéo liên minh (`Alliance cross-sell`). |
| `LM-08` | 50. `Branches & product groups` (`20584:13287`) | **Đã làm** | Đầy đủ quản lý chi nhánh, mã điểm thanh toán (`Payment Point code`), nhóm sản phẩm và danh mục sản phẩm. *(Lưu ý: phía CMS Natcash chưa có màn xem/duyệt danh sách chi nhánh này).* |
| `LM-09` | 51. `Points policy` (`20584:13433` & `20584:4297`) | **Đã làm** | Đầy đủ cấu hình chính sách chấp nhận điểm kế thừa 4 cấp (`Partner → Branch → Product groups → Products`) và gửi Natcash phê duyệt. |
| `QT-03` | 52. `Staff accounts` (`20584:13583`) | **Đã làm** | Đầy đủ quản lý tài khoản nhân viên đối tác theo vai trò và phạm vi chi nhánh. |
| `NV-07` | 53. `Propose an in-store program` (`20584:13732`) | **Đã làm** | Đầy đủ biểu mẫu đối tác đề xuất chương trình ưu đãi tại cửa hàng và gửi Natcash duyệt. |
| `VQ-05` | 54. `Vouchers` (`20584:13820`) | **Đã làm** | Đã thiết kế song song 2 cột trên cùng màn hình: cột trái `Create voucher` (tạo voucher trong hạn mức được duyệt) và cột phải `Record voucher use` (nhập mã/quét mã voucher, kiểm tra trạng thái hợp lệ và xác nhận gạch mã kèm số hóa đơn). |
| `LM-11` | 55. `Point transactions` (`20584:13974`) | **Đã làm** | Đầy đủ tra cứu lịch sử giao dịch tích/trừ điểm theo chi nhánh và xuất tệp Excel. |
| `LM-10` | 56. `Settlement results` (`20584:14140` & `20584:12923`) | **Đã làm** | Đã có bảng tổng hợp kỳ đối soát, danh sách giao dịch trong kỳ, kèm biểu mẫu `Raise a claim` (chọn giao dịch, nhập lý do lệch, đính kèm chứng từ PDF/ảnh) và nút `Confirm period figures` ở nửa dưới màn hình. |
| `CN-08` | *(Chưa có trên Figma)* `Partner notifications` | **Thiếu (Chưa làm)** | Trong PTTK (`CN-08`) yêu cầu màn hình thông báo/nhắc việc cho đối tác trên Cổng đối tác (kết quả đối soát, voucher sắp hết kho, chương trình sắp kết thúc, khách quay lại giảm), nhưng trên Figma Section 11 chưa có frame này. |

---

## 5. ĐÁNH GIÁ CHI TIẾT KHỐI 3: MOBILE APP, WEBVIEW & USSD (KHÁCH HÀNG CUỐI)

| Section trên Figma | Mã màn | Số thẻ màn hình & Các màn hình tiêu biểu (`Node ID`) | Tình trạng | Đánh giá chi tiết so với BA / LLD |
| :--- | :---: | :--- | :---: | :--- |
| **Section 1: Entry & membership** (`20609:2064`) | `NC-HM-01`<br>`NC-TB-01`<br>`NC-PF-01`<br>`HV-01..03` | **11 màn hình:**<br>- `NC-HM-01` Natcash Home (3 phương án: `20609:3099`, `3844`, `4045`)<br>- `NC-TB-01` Rewards tab (`3322`, `3431`)<br>- `NC-PF-01` Account entry (`2382`)<br>- `HV-02` Loyalty home (`2068`, `2460`, `3522`)<br>- `HV-03` Member tiers (`2781`)<br>- `HV-01` Program terms (`3047`) | **Một phần** | Đã thiết kế đầy đủ các điểm chạm từ Natcash Home, Tab Rewards, Account và trang chủ Loyalty. Tuy nhiên màn `HV-03 Member tiers` (`20609:2781`) đang ghi ngưỡng điểm `0 / 3,000 / 10,000 / 30,000` (lệch với `0 / 1,000 / 5,000 / 15,000` trong đặc tả chính sách) và chưa phân tách rõ nhãn `Natcash Coin` so với `Điểm xét hạng`. |
| **Section 2: Earn · Missions & check-in** (`20609:4257`) | `NV-01`<br>`NV-02`<br>`NV-03`<br>`CN-02`<br>`DT-01` | **14 màn hình:**<br>- `NV-01` Missions list (`4262`, `4962`, `5292`, `5486`)<br>- `NV-02` Mission details & Claim popup (`4485`, `5047`, `5151`, `5873`, `5962`)<br>- `NV-03` Daily check-in & popup (`4842`, `5634`, `5745`)<br>- `CN-02` Inbox (`4654`)<br>- `DT-01` Points history (`4740`) | **Một phần** | Đã có đầy đủ luồng nhiệm vụ tự động, nhiệm vụ bấm nhận (`Claim`) và điểm danh 7 ngày. Tuy nhiên **thiếu màn hình nhiệm vụ Giới thiệu bạn bè (`Referral` — mã mời, chia sẻ link, tiến độ bạn bè định danh/giao dịch đầu)** và trên màn `DT-01 Points history` (`20609:4740`) **thiếu popup/drawer xem chi tiết từng lô điểm sắp hết hạn theo cơ chế `FIFO`**. |
| **Section 3: Redeem · Rewards & vouchers** (`20609:6057`) | `VQ-01`<br>`VQ-02`<br>`VQ-03` | **12 màn hình:**<br>- `VQ-01` Reward store (`6062`)<br>- `VQ-02` Reward details & Results (`6202`, `6282`, `6475`, `6545`, `6613`, `6688`, `6752`, `6827`, `6891`, `6966`)<br>- `VQ-03` My vouchers (`6357`) | **Một phần** | Đã có đủ các trạng thái đổi quà thành công, chờ đối tác Natcom cấp gói cước (`Awaiting confirmation`) và hết kho (`Sold out`). Tuy nhiên trên màn `VQ-02` (`20609:6282`) và `VQ-03` (`20609:6357`) mới chỉ hiển thị chuỗi mã chữ (`DLM-50-9X8Z`), **thiếu mã vạch `Code128` và mã `QR`** để thu ngân quầy đối tác quét trực tiếp qua máy POS. |
| **Section 4: Play · Games** (`20609:7059`) | `GM-01`<br>`GM-02` | **14 màn hình:**<br>- `GM-01` Game hub (có Leaderboard ở cuối trang `7064`), Get plays (`7916`, `7990`), Open partner game (`8151`), Play history (`8695`), Category Learning (`8937`)<br>- `GM-02` Rewards Wheel (`7620`, `7775`, `7846`, `8060`), 2048 Natcash (`8604`), English Daily (`9026`, `9117`, `9192`) | **Một phần** | Màn `GM-01 Game hub` (`20609:7064`) đã có khối `November leaderboard` ở cuối màn hình và 4 màn hình mới cho nhóm game `Learning (English Daily)`. Tuy nhiên màn `20609:8060` (`No prize this time`) ghi `Game: Lucky Scratch Card` nhưng **chưa có màn hình tương tác cào thẻ (`Lucky Scratch Card` play screen)** trước khi ra kết quả. |
| **Section 5: Use points at partners** (`20609:9295`) | `LM-04`<br>`LM-01`<br>`DT-01` | **6 màn hình:**<br>- `LM-04` Where to use points (`9300`)<br>- `LM-01` Natcash payment · points suggested (`9410`), voucher applied (`9630`), Payment successful (`9738`)<br>- `DT-01` Points history (`9504`), USSD `*202#` (`9821`) | **Một phần** | Đã có luồng thanh toán trên ứng dụng Natcash tự gợi ý trừ điểm (tối đa 30% hóa đơn) và tự áp voucher (Luồng A). Tuy nhiên **thiếu màn hình hiển thị Mã QR/Barcode Ví Phần Thưởng động 60 giây (`TOTP`)** để thu ngân quét trừ điểm tại quầy POS (Luồng B), và màn `USSD *202#` (`20609:9821`) mới có 1 menu gốc, chưa có các màn hình phản hồi nhánh con (`1. Where to use points`, `2. My vouchers`). |
| **Section 6: Targeted content** (`20609:9854`) | `CN-01`<br>`CN-02` | **9 màn hình:**<br>- `CN-02` Inbox (`9859`) & Targeted offer details (`9945`)<br>- `CN-01` 7 biến thể màn hình Home theo 7 nhóm khách hàng (`10015` đến `11443`) | **Một phần** | Đã thiết kế đầy đủ 7 biến thể giao diện trang chủ theo 7 phân khúc khách hàng. Tuy nhiên ghi chú trên Figma đang khóa quyền tắt thông báo của khách hàng, **mâu thuẫn với Slide 12 Giải pháp ("Khách hàng được quyền tắt thông báo") và PTTK `CN-04`**; cần bổ sung nút bật/tắt nhận thông báo tiếp thị (`Opt-out`). |

---

## 6. DANH MỤC TỔNG HỢP CÁC HẠNG MỤC CẦN BỔ SUNG VÀ HOÀN THIỆN TRÊN FIGMA

### 6.1. Nhóm 1 — Các phân hệ và màn hình chưa thiết kế (`Thiếu` — 13 màn hình cần vẽ mới)

| STT | Mã chức năng | Nền tảng | Tên màn hình cần thiết kế mới | Mô tả chi tiết các thành phần giao diện cần có |
| :---: | :---: | :---: | :--- | :--- |
| 1 | `AG-01` | Mobile App / Webview | **Nhiệm vụ Đại lý (`Agent Loyalty Missions`)** | Thẻ tiến độ phát triển khách hàng mới trong tháng (ví dụ: `68 / 100 khách hàng mới`), đếm ngược thời gian chốt kỳ, mức thưởng (`2.000 HTG` hoặc `2.000 Natcash Coin`), danh sách khách hàng vừa giới thiệu kèm trạng thái định danh/giao dịch đầu. |
| 2 | `AG-02` | Mobile App / Webview | **Bảng điều khiển KPI Tổng đại lý (`Super Agent Dashboard`)** | Biểu đồ tỷ lệ Agent tuyến dưới đạt chuẩn trong tháng (mục tiêu `≥ 50%` mạng lưới đạt chỉ tiêu để nhận thưởng `10.000 HTG`), bộ lọc danh sách Agent tuyến dưới theo nhóm (Đã đạt / Sắp đạt / Chưa phát sinh) để đôn đốc. |
| 3 | `AG-03` | Back Office CMS | **Quản trị Chỉ tiêu Đại lý, Đối soát thưởng & `Support Playbook`** | Cấu hình định mức chỉ tiêu tháng cho Agent / Super Agent, bảng đối soát phê duyệt chi trả thưởng mạng lưới và trang tra cứu Kịch bản hỗ trợ vận hành (`Support Playbook`) cho CSKH. |
| 4 | `AI-01` | Back Office CMS | **Trợ lý AI Thiết kế Chiến dịch (`AI Campaign Copilot`) & Cảnh báo Xung đột** | Khung nhập mục tiêu tự nhiên (ngân sách, tệp mục tiêu, KPI kỳ vọng) để AI tự sinh cấu hình chiến dịch nháp; kèm hộp thoại cảnh báo khi 2 chiến dịch trùng tệp khách hàng và trùng sự kiện kích hoạt trong cùng khung giờ. |
| 5 | `GM-09` | Back Office CMS | **Quản trị Kho Câu hỏi Học tập & Đố vui (`Learning & Quiz Question Bank`)** | Quản lý các chủ đề học tập (`English Daily`, `Spanish Start`, `Aprann Li`, `Money Smart`), danh sách câu hỏi trắc nghiệm, tệp âm thanh phát âm, đáp án đúng, thang điểm thưởng (`5 câu: +10 pts`, `10 câu: +30 pts`, `15/15 câu: +100 pts`) và nhập lô câu hỏi từ Excel/CSV. |
| 6 | `GM-07` | Back Office CMS | **Thống kê & Lịch sử Chơi Game (`GM-03 Game Statistics & Play History`)** | Màn hình báo cáo thống kê lượt chơi, tỷ lệ trúng giải theo từng trò chơi và bảng tra cứu lịch sử phiên chơi phía CMS (đã ghi tên trong `Trang tính1` nhưng chưa có frame trên Figma). |
| 7 | `NS-05` | Back Office CMS | **Báo cáo Đối tác & Bán chéo Liên minh (`NS-05 Partner Report · Cross-sell`)** | Màn hình báo cáo tổng hợp giao dịch dùng điểm, khách hàng mới, ma trận bán chéo giữa các đối tác liên minh và chi phí đồng tài trợ phía CMS Natcash (đã ghi tên trong `Trang tính1` nhưng chưa có frame trên Figma). |
| 8 | `NS-06` | Back Office CMS | **Báo cáo Điểm tồn & Nghĩa vụ Tài chính Dự kiến (`NS-06 Points Liability Report`)** | Màn hình báo cáo phân tích số dư điểm đang lưu hành theo từng lô hạn sử dụng, tỷ lệ quy đổi dự kiến (`Breakage / Redemption rate`) và nghĩa vụ tài chính phải trích lập (đã ghi tên trong `Trang tính1` nhưng chưa có frame trên Figma). |
| 9 | `NS-07` | Back Office CMS | **Lập lịch Gửi Báo cáo Định kỳ & Xuất Dữ liệu (`NS-07 Scheduled Reports & Export`)** | Màn hình cấu hình lịch gửi báo cáo tự động (hằng ngày/tuần/tháng) qua email cho ban vận hành và tài chính (đã ghi tên trong `Trang tính1` nhưng chưa có frame trên Figma). |
| 10 | `CN-08` | Partner Portal | **Trung tâm Thông báo Đối tác (`CN-08 Partner Notifications`)** | Màn hình/Drawer thông báo trên Cổng đối tác: nhắc xác nhận kỳ đối soát, cảnh báo voucher sắp hết kho, chương trình tại cửa hàng sắp kết thúc, tỷ lệ khách quay lại giảm (đã ghi tên trong `Trang tính1` nhưng chưa có frame trên Figma). |
| 11 | `LM-02` | Back Office CMS | **Quản lý & Liên kết Chi nhánh Điểm bán trên CMS (`LM-02 Branches & Payment Points`)** | Màn hình phía CMS Natcash để vận hành xem, kiểm tra và liên kết mã `Merchant / Payment Point` cho các chi nhánh của đối tác (hiện mới có màn `LM-08` phía Cổng đối tác). |
| 12 | `LM-17` | Mobile App / Webview | **Mã QR/Barcode Ví Phần Thưởng Động 60 Giây (`Reward Wallet Dynamic QR`)** | Màn hình hiển thị mã `QR` và `Barcode` động tự làm mới mỗi 60 giây (`TOTP`) kèm đồng hồ đếm ngược để khách hàng xuất trình cho thu ngân quét trừ điểm trực tiếp tại máy POS đối tác (Luồng B). |
| 13 | `NV-06` | Mobile App / Webview | **Nhiệm vụ Giới thiệu Bạn bè (`Referral · Invite Friends`)** | Màn hình hiển thị mã giới thiệu cá nhân, mã QR mời bạn, nút chia sẻ qua mạng xã hội/SMS và danh sách theo dõi trạng thái bạn bè đã đăng ký, hoàn tất định danh `eKYC` và phát sinh giao dịch đầu tiên. |

### 6.2. Nhóm 2 — Các màn hình đã có trên Figma nhưng cần bổ sung chi tiết (`Một phần` — 14 hạng mục)

| STT | Mã chức năng | Nền tảng | Màn hình Figma cần chỉnh sửa (`Node ID`) | Nội dung cần hoàn thiện |
| :---: | :---: | :---: | :--- | :--- |
| 1 | `HV-02`<br>`HV-06` | Mobile App & CMS | `HV-03 Member tiers` (`20609:2781`)<br>`HV-04 Tier configuration` (`20584:3198`) | Thống nhất ngưỡng điểm xét hạng giữa Figma (`0 / 3,000 / 10,000 / 30,000`) và đặc tả chính sách (`0 / 1,000 / 5,000 / 15,000`); chuẩn hóa nhãn hiển thị 2 đơn vị điểm (`Natcash Coin` và `Điểm xét hạng`). |
| 2 | `HV-08` | Back Office CMS | `HV-05 Member lookup` (`20584:3708`) | Bổ sung Drawer/Trang **Hồ sơ Hội viên 360** khi bấm vào 1 dòng hội viên (hiển thị lịch sử xét hạng, sổ cái điểm, nhiệm vụ đang làm, kho voucher và giao dịch dùng điểm). |
| 3 | `HV-09` | Back Office CMS | `HV-05 Member lookup` (`20584:3708`) | Bổ sung frame hộp thoại **`HV-05 Lock or unlock a member`** (nhập lý do khóa/mở khóa, đính kèm bằng chứng nghi ngờ trục lợi và gửi duyệt hai người). |
| 4 | `DT-01` | Mobile App & USSD | `DT-01 Points history` (`20609:4740`)<br>`DT-01 USSD` (`20609:9821`) | Bổ sung popup/drawer phân rã chi tiết **Điểm sắp hết hạn theo từng lô `FIFO`** (`point_expiration_buckets`: số điểm, ngày nhận, ngày hết hạn); bổ sung 2 màn hình USSD nhánh con khi chọn phím `1. Where to use points` và `2. My vouchers`. |
| 5 | `NV-01` | Back Office CMS | `NV-05 Create program from template` (`20584:7764`) | Mở rộng biểu mẫu cấu hình điều kiện đa tầng (`KHI – NẾU – THÌ – GIỚI HẠN`) đáp ứng đủ 9 nhóm nhiệm vụ trong tài liệu giải pháp (Chuỗi liên tiếp, Bán chéo liên minh, Giới thiệu bạn bè, Mốc chi tiêu bậc thang...). |
| 6 | `VQ-02`<br>`VQ-03` | Mobile App / Webview | `VQ-02 Result · reward ready` (`20609:6282`)<br>`VQ-03 My vouchers` (`20609:6357`) | Bổ sung hình ảnh **Mã vạch (`Barcode Code128`)** và **Mã `QR`** bên dưới chuỗi mã chữ (`DLM-50-9X8Z`) để thu ngân quầy đối tác có thể dùng súng quét mã vạch tại POS. |
| 7 | `GM-03` | Mobile App / Webview | Section 4 `Play · Games` (`20609:8060`) | Bổ sung màn hình tương tác cào thẻ **`GM-02 Lucky Scratch Card`** (trước khi ra màn kết quả `20609:8060`). |
| 8 | `CN-04` | Mobile App / Webview | `CN-02 Inbox` (`20609:9859`) | Bổ sung công tắc cho phép khách hàng **Bật / Tắt nhận thông báo tiếp thị (`Opt-out`)** theo đúng yêu cầu tại Slide 12 Giải pháp (*"Khách hàng được quyền tắt thông báo"*). |
| 9 | `QT-04` | Back Office CMS | `QT-05 Audit log` (`20584:2590`) | Bổ sung Modal/Drawer xem chi tiết **`JSONB Diff` (`Dữ liệu trước` và `Dữ liệu sau`)** khi bấm vào một bản ghi nhật ký thao tác. |
| 10 | `QT-06` | Back Office CMS | `QT-06 Connections overview` (`20584:4998`) | Bổ sung thêm **2 thẻ giám sát kết nối hệ thống nội bộ**: `USSD Gateway (*202#)` và `Data Lake / DWH Sync` để đủ 6 hệ thống tích hợp theo Slide 16 Giải pháp. |
