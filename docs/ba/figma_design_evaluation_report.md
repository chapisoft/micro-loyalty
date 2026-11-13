# BÁO CÁO ĐÁNH GIÁ & ĐỐI SOÁT THIẾT KẾ FIGMA HỆ THỐNG MICRO-LOYALTY

**Ngày đánh giá cập nhật:** 13/11/2026 (Rà soát toàn diện sau đợt cập nhật 13/11 trên Figma)  
**Tài liệu đối chiếu:**

* Giải pháp & Tài liệu thiết kế hệ thống: `docs/ba/solution.md`, `docs/ba/detailed_design.md`, `docs/ba/architecture_evolution_v2.md`, `docs/ba/datalake_integration_spec.md`
* Nguồn Figma chính thức: File `exk9D9x6gHQPD0feUadthB` – Trang `Loyalty` (Node `1168:2725`, tập Node cập nhật `20634:*`)
* Danh mục đối soát Google Sheet: Bảng tính `Trang tính1` (`gid=578312992`, 74 mã màn hình quy chuẩn)

---

## 1. TỔNG QUAN PHẠM VI & MỨC ĐỘ BAO PHỦ TÍNH NĂNG

Sau đợt cập nhật ngày 13/11 trên trang `Loyalty` (`1168:2725`), bản thiết kế Figma đã bổ sung đầy đủ toàn bộ các phân hệ còn thiếu, xử lý triệt để các sai lệch số liệu ngưỡng hạng và bổ sung các thành phần giao diện thiết yếu tại quầy thu ngân. Hệ thống hiện đạt **23 Section** với tổng cộng **144 màn hình** (69 màn hình Desktop khổ 1440px và 75 màn hình Mobile/Webview/USSD), bao phủ **100%** phạm vi tính năng và logic nghiệp vụ theo tài liệu thiết kế hệ thống.

| Khối sản phẩm | Số lượng Section Figma | Số màn hình / Frame Figma | Mức độ hoàn thiện tính năng | Ghi chú phân bổ màn hình |
| :--- | :---: | :---: | :---: | :--- |
| **Back Office CMS (Quản trị Natcash)** | 11 Section (Section 1–10, 12) | 55 màn hình CMS chuyên biệt | **100% Đạt chuẩn** | Bổ sung đầy đủ `QT-04`, `HV-08`, `LM-02`, `QT-06` (6 hệ thống), `GM-09`, `NV-05`, `AI-01`, `AG-03` |
| **Partner Portal (Cổng Đối tác Liên minh)** | 1 Section chuyên biệt (Section 11) + 5 màn hình lồng luồng | 14 màn hình (`9` tại Section 11 + `5` lồng trong Section 3, 10) | **100% Đạt chuẩn** | Gồm `LM-09` (`20634:5275`), 3 màn hình `QT-06` (`20634:5710..5888`), `LM-10` (`20634:15576`) và 9 màn hình tại Section 11 (đã thêm `CN-08`) |
| **Mobile App / Webview / USSD** | 7 Section (Section 1–7) | 75 màn hình | **100% Đạt chuẩn** | Bổ sung `NV-06`, `DT-01` FIFO, `VQ-02`/`VQ-03` (QR + Code128), `GM-02` Scratch, `LM-17`, `USSD`, `CN-04`, `AG-01`, `AG-02` |
| **Overview & Change Log** | 4 Section (`0 · Read me first` & `Change log · 13/11`) | – | **Đã cập nhật** | Thẻ tổng quan Back Office (`20634:1131`) ghi nhận `69 screens in 12 modules`; khối Mobile (`20634:17705`) ghi nhận `7 customer modules` |
| **TỔNG CỘNG** | **23 Section** | **144 màn hình** (`69` Desktop + `75` Mobile) | **100% (`144/144 Đạt`)** | `0` màn hình thiếu · `0` màn hình làm dở hoặc sai lệch logic |

---

## 2. ĐỐI CHIẾU ĐỒNG BỘ GIỮA FIGMA, TÀI LIỆU THIẾT KẾ VÀ BẢNG TÍNH ĐỐI SOÁT

Các sai lệch được cảnh báo ở kỳ đánh giá trước giữa thiết kế Figma và tài liệu đặc tả nghiệp vụ đã được đội ngũ thiết kế khắc phục hoàn toàn ở phiên bản `20634:*`:

1. **Đã hợp nhất chuẩn ngưỡng hạng hội viên (1.000 / 5.000 / 15.000 điểm):** Toàn bộ bảng cấu hình ngưỡng lên hạng và giữ hạng trên CMS (`HV-04` Node `20634:3692`), biểu đồ phân bổ hạng (`HV-06` Node `20634:3967`) và thanh tiến trình Mobile (`HV-03` Node `20634:18661`) đã đồng nhất hoàn toàn mức **Bạc: 0 – 999**, **Vàng: 1.000 – 4.999**, **Bạch Kim: 5.000 – 14.999**, **Kim Cương: 15.000+**, cùng ngưỡng giữ hạng tương ứng `0 / 800 / 4.000 / 12.000 điểm`.
2. **Đã tách biệt rạch ròi 3 luồng quét mã và hoàn thiện thành phần quầy thu ngân:**
   * `VQ-02` (`20634:22215`) và `VQ-03` (`20634:23242`): Hiển thị song song **QR Code + Mã vạch Code128 Barcode + Mã chữ số** (ví dụ `DLM-50-9X8Z`) để máy quét laser và camera tại quầy đối tác đọc được trực tiếp.
   * `LM-17` (`20634:26687`): Bổ sung hoàn chỉnh màn hình **Pay at the counter · reward wallet QR 60 s** với đếm lùi bảo mật 60 giây.
3. **Đồng bộ danh mục Google Sheet (`Trang tính1` `gid=578312992`):** 100% các mã màn hình vốn bị đánh dấu thiếu ở bản Sheet cũ (`NV-06`, `DT-01` FIFO, `LM-17`, `CN-04`, `AG-01..03`, `HV-08`, `LM-02`, `GM-09`, `AI-01`, `CN-08`) nay đã có mặt đầy đủ trên Figma. Nhóm quản trị dự án chỉ cần cập nhật trạng thái đồng bộ lại trên file Google Sheet để làm hồ sơ nghiệm thu chính thức.

---

## 3. ĐÁNH GIÁ CHI TIẾT KHỐI 1: BACK OFFICE CMS (NATCASH INTERNAL ADMIN)

### 3.1. Bảng kiểm tra từng màn hình theo cụm nghiệp vụ

| Section Figma | Mã màn hình | Tên màn hình trên Figma | Node ID | Trạng thái | Ghi chú chi tiết sau rà soát 13/11 |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **0 · Read me first** | – | Back office overview | `20634:1128` | Đạt chuẩn | Nội dung chính (`20634:1131`) cập nhật `69 screens in 12 modules` (còn 1 dòng tiêu đề phụ nhỏ ở `20634:1252` ghi `11 MODULES · 56 SCREENS`) |
| **Change log** | – | Change log · 13/11 · cần review | `20634:17303` | Đạt chuẩn | Ghi nhận đầy đủ các màn hình bổ sung và sửa lỗi đợt 13/11 |
| **1 · Sign-in & administration** | `QT-01` | Sign in / Verify OTP / OTP not valid / OTP expired | `20634:1313`..`1574` | **Đã làm** | 4 màn hình đầy đủ luồng đăng nhập SSO và xử lý lỗi OTP |
| | `QT-02` | Users / Roles & permissions | `20634:1657`, `20634:1889` | **Đã làm** | Quản lý tài khoản nội bộ và ma trận phân quyền RBAC |
| | `QT-05` | System parameters / Audit log | `20634:2205`, `20634:2639` | **Đã làm** | Tham số hệ thống và nhật ký truy vết |
| | `QT-07` | Queue & failed events | `20634:3039` | **Đã làm** | Theo dõi hàng đợi lỗi sau khi thử lại tự động |
| | `QT-04` | Audit log · change details (before / after) | `20634:3245` | **Đã làm** | **Bổ sung 13/11:** So sánh cấu trúc JSONB trước và sau thay đổi cho từng bản ghi kiểm toán |
| **2 · Members & tiers** | `HV-04` | Tier configuration | `20634:3692` | **Đã làm** | **Đã sửa 13/11:** Sửa khớp Keep tier `0 / 800 / 4.000 / 12.000`; nút `Period settings` và `View tier distribution` nằm gọn trong banner |
| | `HV-06` | Tier distribution | `20634:3967` | **Đã làm** | **Đã sửa 13/11:** Sửa khớp nhãn biểu đồ và bảng số liệu `1.000 / 5.000 / 15.000 điểm` |
| | `HV-05` | Member lookup | `20634:4202` | **Đã làm** | Tra cứu hội viên theo số điện thoại, mã thành viên, hạng |
| | `HV-05 · HV-09` | Lock or unlock a member | `20634:4416` | **Đã làm** | Khóa/mở khóa tài khoản có luồng phê duyệt hai cấp |
| | `HV-08` | Member 360 (drawer from Member lookup) | `20634:4628` | **Đã làm** | **Bổ sung 13/11:** Hồ sơ hội viên 360 độ dạng ngăn kéo từ màn hình tra cứu |
| **3 · Partners & connections** | `LM-05` | Partner profile | `20634:4904` | **Đã làm** | Hồ sơ pháp nhân, thông tin đối tác liên minh |
| | `LM-06` | Policy approval | `20634:5425` | **Đã làm** | Phê duyệt chính sách tích/tiêu điểm của đối tác |
| | `LM-02` | Branches & payment points (Natcash side) | `20634:6003` | **Đã làm** | **Bổ sung 13/11:** Quản lý mạng lưới chi nhánh và điểm chấp nhận thanh toán phía Natcash |
| | `QT-06` | Connections overview · 6 systems | `20634:6140` | **Đã làm** | **Đã nâng cấp 13/11:** Bao phủ đầy đủ 6 kết nối hệ thống thay cho bản 4 hệ thống cũ |
| **4 · Rewards & vouchers** | `VQ-04` | Reward catalogue / Create or edit / Import (3 bước) | `20634:6294`..`7021` | **Đã làm** | 5 màn hình quản lý danh mục quà tặng và nhập lô Excel 3 bước |
| **5 · Games** | `GM-03` | Games & prizes / Add or edit / Prize table / Hub config | `20634:7152`..`8027` | **Đã làm** | 4 màn hình cấu hình trò chơi, bảng giải thưởng và Game Hub |
| | `GM-03 · GM-07` | Game statistics & play history | `20634:8508` | **Đã làm** | Thống kê lượt chơi và lịch sử trúng thưởng |
| | `GM-09` | Learning & quiz question bank | `20634:8889` | **Đã làm** | **Bổ sung 13/11:** Ngân hàng câu hỏi trắc nghiệm và học tập nhận thưởng |
| **6 · Programs & missions** | `NV-04`, `NV-05`, `QT-04`, `NV-06`, `NS-03` | Programs / Create from template / Approval / Tracking / Effectiveness | `20634:9052`..`9956` | **Đã làm** | 5 màn hình quản trị vòng đời chiến dịch |
| | `NV-05` | Rule builder · WHEN – IF – THEN – LIMITS (9 mission types) | `20634:10206` | **Đã làm** | **Bổ sung 13/11:** Bộ dựng luật động 4 tầng hỗ trợ đủ 9 loại nhiệm vụ |
| | `AI-01` | AI campaign assistant · draft and conflict check | `20634:10367` | **Đã làm** | **Bổ sung 13/11:** Trợ lý AI phác thảo chiến dịch và kiểm tra xung đột chính sách |
| **7 · Segments & messaging** | `CN-03` | Customer segments | `20634:10485` | **Đã làm** | Phân khúc khách hàng động |
| | `CN-04` | Reminder scenarios & send log | `20634:10717` | **Đã làm** | Kịch bản gợi nhắc tự động và nhật ký gửi tin |
| **8 · Dashboard, budget & alerts** | `NS-02`, `NS-01`, `NS-03`, `CN-05`, `NS-05`, `NS-06`, `NS-07` | Dashboard / Budget / Program effectiveness / Alert center / Cross-sell / Liability / Scheduled reports | `20634:10974`..`12834` | **Đã làm** | 7 màn hình đầy đủ chỉ số tài chính, công nợ điểm và xuất báo cáo định kỳ |
| **9 · Points ledger & adjustments** | `DT-03`, `DT-02`, `QT-04` | Points ledger / Create & approve adjustment / Approval queue | `20634:13056`..`14328` | **Đã làm** | 3 màn hình sổ cái kế toán điểm và điều chỉnh hai cấp |
| **10 · Clearing & partner payment** | `LM-07` | Clearing, claims & payment batches (5 màn hình CMS) | `20634:14589`..`15433` | **Đã làm** | Đối soát sai lệch, xử lý khiếu nại `KN-0611-001`, tạo và theo dõi lô thanh toán `PAY-2026-11-W2` |
| **12 · Agent & Super Agent** | `AG-03` | Agent targets, reward settlement & support playbook | `20634:17129` | **Đã làm** | **Bổ sung 13/11:** Chỉ tiêu đại lý, thanh quyết toán thưởng và cẩm nang hỗ trợ |

---

## 4. ĐÁNH GIÁ CHI TIẾT KHỐI 2: PARTNER PORTAL (CỔNG ĐỐI TÁC LIÊN MINH)

Toàn bộ **14 màn hình Partner Portal** (9 màn hình tại Section 11 và 5 màn hình tích hợp trực tiếp trong Section 3 & Section 10) đã hoàn thiện đầy đủ luồng nghiệp vụ B2B tự phục vụ:

| Vị trí Section | Mã màn hình | Tên màn hình trên Figma | Node ID | Trạng thái | Ghi chú chuyên sâu |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **3 · Partners & connections** | `LM-09` | Partner portal · points policy | `20634:5275` | **Đã làm** | Chính sách tích/tiêu điểm phía đối tác |
| **3 · Partners & connections** | `QT-06` | IP & webhook / Create or rotate API key / New key shown once | `20634:5710`, `20634:5799`, `20634:5888` | **Đã làm** | Quy trình bảo mật hiển thị khóa bí mật một lần khi cấp/xoay vòng khóa |
| **10 · Clearing & payment** | `LM-10` | Partner portal · settlement results | `20634:15576` | **Đã làm** | Xem kết quả chốt công nợ ngay cuối luồng đối soát |
| **11 · Partner portal** | `NS-04` | Partner dashboard | `20634:15763` | **Đã làm** | Bảng điều khiển tổng quan đối tác |
| | `LM-08` | Branches & product groups | `20634:15940` | **Đã làm** | Quản lý chi nhánh và nhóm sản phẩm áp dụng |
| | `LM-09` | Points policy | `20634:16086` | **Đã làm** | Thiết lập tỷ lệ thưởng và giới hạn điểm tại cửa hàng |
| | `QT-03` | Staff accounts | `20634:16236` | **Đã làm** | Phân quyền tài khoản thu ngân/quản lý cửa hàng |
| | `NV-07` | Propose an in-store program | `20634:16385` | **Đã làm** | Đề xuất chương trình khuyến mãi tại điểm bán gửi Natcash duyệt |
| | `VQ-05` | Vouchers | `20634:16473` | **Đã làm** | Tra cứu và kiểm soát trạng thái mã ưu đãi đối tác |
| | `LM-11` | Point transactions | `20634:16627` | **Đã làm** | Lịch sử giao dịch tích điểm và gạch nợ tại cửa hàng |
| | `LM-10` | Settlement results | `20634:16793` | **Đã làm** | Bảng kê thanh quyết toán định kỳ và tải chứng từ |
| | `CN-08` | Notifications | `20634:16976` | **Đã làm** | **Bổ sung 13/11:** Trung tâm thông báo dành riêng cho cổng đối tác |

---

## 5. ĐÁNH GIÁ CHI TIẾT KHỐI 3: MOBILE APP / WEBVIEW / USSD

Tổng cộng **75 màn hình** trải dài qua 7 Section nghiệp vụ người dùng cuối và đại lý, cùng thẻ tổng quan `20634:17705` và nhật ký cập nhật `20634:29469`:

| Section Figma | Số màn hình | Mã màn hình & Điểm nổi bật đã hoàn thiện | Node ID tiêu biểu | Trạng thái |
| :--- | :---: | :--- | :--- | :---: |
| **1 · Entry & membership** | 10 | `HV-02` (Hội viên mới/Vàng/Webview), `NC-PF-01`, `HV-03` (Ngưỡng hạng 1.000/5.000/15.000 khớp chuẩn), `HV-01`, `NC-TB-01`, `NC-HM-01` (giữ bản chuẩn C, đã dọn bản nháp cũ), `Slide types` | `20634:17948`..`19682` | **Đã làm** |
| **2 · Earn · Missions & check-in** | 16 | `NV-01`, `NV-02`, `NV-03`, `CN-02`, `DT-01`; **Bổ sung 13/11:** `NV-06 Invite friends` (`20634:21546`) và `DT-01 Coins expiring · by batch (FIFO)` (`20634:21855`) | `20634:19813`..`21855` | **Đã làm** |
| **3 · Redeem · Rewards & vouchers** | 13 | `VQ-01`, `VQ-02`, `VQ-03`; **Đã sửa & bổ sung 13/11:** `VQ-02 Result · reward ready` (`20634:22215`) và `VQ-03 Show voucher at checkout` (`20634:23242`) tích hợp đủ QR Code + Code128 Barcode + mã `DLM-50-9X8Z` | `20634:22007`..`23242` | **Đã làm** |
| **4 · Play · Games** | 15 | `GM-01`, `GM-02` (bao gồm `Lucky Scratch Card · play` tại `20634:25913`) | `20634:23670`..`25913` | **Đã làm** |
| **5 · Use points at partners** | 9 | `LM-04`, `LM-01`, `DT-01`; **Bổ sung 13/11:** Luồng menu `USSD` (`20634:26594..26656`) và `LM-17 Pay at the counter · reward wallet QR 60 s` (`20634:26687`) | `20634:26100`..`26687` | **Đã làm** |
| **6 · Targeted content** | 10 | `CN-02`, 7 biến thể trang chủ theo phân khúc (`CN-01`); **Bổ sung 13/11:** `CN-04 Notification settings` (`20634:29224`) | `20634:27110`..`29224` | **Đã làm** |
| **7 · Agent & Super Agent** | 2 | **Bổ sung 13/11:** Màn hình đại lý `AG-01` (`20634:29302`) và Tổng đại lý `AG-02` (`20634:29373`) | `20634:29302`, `20634:29373` | **Đã làm** |

---

## 6. BẢNG NGHIỆM THU CÁC HẠNG MỤC ĐÃ KHẮC PHỤC & BỔ SUNG (ĐỢT 13/11)

### 6.1. Nghiệm thu 13 hạng mục thiết kế từng thiếu (Tất cả đã hoàn tất 13/13)

| STT | Mã màn hình | Phân hệ | Tên màn hình nghiệm thu | Node ID Figma | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `QT-04` | CMS (Section 1) | Audit log · change details (before / after JSONB diff) | `20634:3245` | **Đã hoàn tất** |
| 2 | `HV-08` | CMS (Section 2) | Member 360 (drawer from Member lookup) | `20634:4628` | **Đã hoàn tất** |
| 3 | `LM-02` | CMS (Section 3) | Branches & payment points (Natcash side) | `20634:6003` | **Đã hoàn tất** |
| 4 | `GM-09` | CMS (Section 5) | Learning & quiz question bank | `20634:8889` | **Đã hoàn tất** |
| 5 | `NV-05` | CMS (Section 6) | Rule builder · WHEN – IF – THEN – LIMITS (9 mission types) | `20634:10206` | **Đã hoàn tất** |
| 6 | `AI-01` | CMS (Section 6) | AI campaign assistant · draft and conflict check | `20634:10367` | **Đã hoàn tất** |
| 7 | `AG-03` | CMS (Section 12) | Agent targets, reward settlement & support playbook | `20634:17129` | **Đã hoàn tất** |
| 8 | `CN-08` | Partner Portal (Section 11) | Partner portal notifications | `20634:16976` | **Đã hoàn tất** |
| 9 | `NV-06` | Mobile (Section 2) | Invite friends | `20634:21546` | **Đã hoàn tất** |
| 10 | `DT-01` | Mobile (Section 2) | Coins expiring · by batch (FIFO) | `20634:21855` | **Đã hoàn tất** |
| 11 | `LM-17` | Mobile (Section 5) | Pay at the counter · reward wallet QR 60 s | `20634:26687` | **Đã hoàn tất** |
| 12 | `CN-04` | Mobile (Section 6) | Notification settings | `20634:29224` | **Đã hoàn tất** |
| 13 | `AG-01` & `AG-02` | Mobile (Section 7) | Agent & Super Agent | `20634:29302`, `20634:29373` | **Đã hoàn tất** |

### 6.2. Nghiệm thu các lỗi dữ liệu, thành phần giao diện & màn hình phụ trợ đã xử lý

| STT | Hạng mục kiểm tra | Phân hệ | Kết quả xác minh thực tế trên Figma (`20634:*`) | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Đồng bộ ngưỡng giữ hạng `Keep tier` | `HV-04` (`20634:3692`) | Đã sửa thành `0 / 800 / 4.000 / 12.000 pts`, khớp logic hạ hạng theo tỷ lệ ngưỡng chuẩn | **Đã sửa** |
| 2 | Lỗi tràn nút banner `HV-04` | `HV-04` (`20634:3692`) | Hai nút `Period settings` và `View tier distribution` căn lề gọn trong vùng banner | **Đã sửa** |
| 3 | Đồng bộ ngưỡng trên biểu đồ & bảng `HV-06` | `HV-06` (`20634:3967`) | Sửa khớp hoàn toàn `Gold (from 1.000)`, `Platinum (from 5.000)`, `Diamond (from 15.000)` | **Đã sửa** |
| 4 | Thẻ quét QR + Code128 Barcode trên màn kết quả | `VQ-02` (`20634:22215`), `VQ-03` (`20634:23242`) | Bổ sung thẻ `Scan at the counter` kèm đủ QR, Code128 Barcode và mã `DLM-50-9X8Z` | **Đã hoàn tất** |
| 5 | Kết nối `6 systems`, luồng `USSD` & Game Scratch | `QT-06`, `USSD`, `GM-02` | `QT-06 Connections overview · 6 systems` (`20634:6140`), đủ 3 màn hình `USSD` (`20634:26594..26656`), bổ sung `Lucky Scratch Card · play` (`20634:25913`) | **Đã hoàn tất** |

---

## 7. ĐÁNH GIÁ LOGIC HỆ THỐNG & KHUYẾN NGHỊ TINH CHỈNH UI/UX KHI TRIỂN KHAI FRONTEND

### 7.1. Kết luận đánh giá tính năng & logic theo tài liệu thiết kế hệ thống

* **Tính đầy đủ & nhất quán nghiệp vụ (100% Đạt):** Toàn bộ luồng cốt lõi từ quản trị RBAC/Maker-Checker (`QT-01..07`), sổ cái điểm FIFO (`DT-01..03`), vòng đời hạng hội viên (`HV-01..09`), bộ dựng luật 9 loại nhiệm vụ (`NV-01..07`), hệ sinh thái đổi thưởng đa kênh App/Webview/USSD (`VQ-01..05`, `LM-17`), GameHub (`GM-01..09`), đối soát liên minh (`LM-01..11`) đến luồng Đại lý (`AG-01..03`) và Trợ lý AI (`AI-01`) đều khớp logic trong `detailed_design.md` và `solution.md`.
* **Tính sẵn sàng lập trình:** Đội ngũ thiết kế không cần chỉnh sửa thêm bản vẽ tính năng nào để bắt đầu cắt giao diện và tích hợp API.

### 7.2. 6 gợi ý tinh chỉnh UI/UX bổ sung trực tiếp trong mã nguồn Frontend (Tùy chọn)

Các điểm sau không phải lỗi thiếu chức năng trên Figma mà là khuyến nghị tối ưu trải nghiệm thực tế khi lập trình `loyalty-cms` và `loyalty-webview`:

1. **Hiển thị đếm lùi `Grace Period` 7 ngày khi xoay vòng API Key (`QT-06` – `20634:5888`):** Tài liệu `detailed_design.md` quy định khóa cũ giữ hiệu lực chuyển tiếp 7 ngày khi Rotate Key. Khi code trên Partner Portal, cần hiển thị bộ đếm ngày hết hạn của khóa cũ kèm nút `Revoke old key now` để đối tác chủ động thu hồi sớm nếu nghi ngờ lộ khóa.
2. **Bổ sung cột hoặc chú giải phí thanh toán `MDR Fee` trên màn hình đối soát (`LM-07`, `LM-10`):** Hiện bảng kê hiển thị `Gross` – `Discount` – `Net` ở mức tổng hợp; khi code bảng chi tiết quyết toán nên bổ sung cột hoặc Tooltip giải thích công thức khấu trừ `MDR Fee` khớp với logic tài chính trong `detailed_design.md`.
3. **Chuẩn hóa độ rộng tối thiểu và `nowrap` cho cột mã kỹ thuật trên bảng CMS:** Các cột chứa ID dài (`Audit log` `20634:2639`, `Queue & failed events` `20634:3039`, `Points ledger` `20634:13056`) khi chuyển từ mock Figma sang dữ liệu thật cần dùng phông `monospace`, `white-space: nowrap` và `minWidth` cố định để tránh xuống dòng vỡ hàng.
4. **Nút chuyển nhanh 3 ngôn ngữ (`Kreyòl / Français / English`) trên Webview:** Bên cạnh trang `Notification settings` (`20634:29224`), nên gắn sẵn bộ chọn ngôn ngữ nhanh trên thanh tiêu đề hoặc trang cài đặt tài khoản Webview để người dùng chuyển ngữ không cần thoát ra app mẹ.
5. **Bổ sung `Empty State` và `Skeleton` đồng bộ:** Bổ sung đầy đủ các trạng thái chưa có voucher, chưa có lịch sử điểm, chưa có thông báo đối tác khi lập trình màn hình `My vouchers`, `Points history` và `CN-08`.
6. **Đồng bộ dòng tiêu đề phụ nhỏ trên thẻ tổng quan Figma (`20634:1252`):** Dòng chữ phụ nhỏ `MODULE MAP · 11 MODULES · 56 SCREENS` trong khung giới thiệu Back Office (`20634:1128`) có thể cập nhật thành `12 MODULES · 69 SCREENS` cho đồng bộ hoàn toàn với nội dung chính `20634:1131` (không ảnh hưởng đến màn hình sản phẩm).
