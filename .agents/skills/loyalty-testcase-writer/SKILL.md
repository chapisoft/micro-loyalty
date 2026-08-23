---
name: loyalty-testcase-writer
description: |
  Thiết kế và sinh kịch bản kiểm thử (Test Cases) chi tiết, chuẩn mực theo chuẩn Doanh nghiệp (Enterprise Standards / ISTQB) cho hệ sinh thái micro-loyalty.
  Đảm bảo bao phủ 100% nghiệp vụ (Zero Missing Test Cases), phân định rõ ràng các tầng kiểm thử (MobileApp, POS, Webview, CMS, API, Batch Job).
  Tập trung vào:
    (1) Khấu trừ Ví Phần Thưởng tại POS siêu thị & Chống tiêu điểm kép (Redisson Lock).
    (2) Đồng bộ hai chiều và thử lại Webhook Outbox khi mất mạng.
    (3) Quy trình thăng/hạ hạng hội viên 4 cấp và chu kỳ đánh giá 12 tháng.
    (4) Vòng quay may mắn, ma trận xác suất và khống chế ngân sách trúng thưởng nguyên tử Redis DECRBY.
    (5) Đối soát thanh toán bù trừ tài chính đa phương giữa Đơn vị phát hành và Đơn vị chấp nhận tiêu điểm.
---

# SKILL: Loyalty Test Case Writer — Thiết Kế Kịch Bản Kiểm Thử Chuẩn Doanh Nghiệp Cho Loyalty

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI

Skill này chuẩn hóa quy trình viết Kịch bản Kiểm thử theo đúng chuẩn nghiệm thu thực tế của Tester và biểu mẫu doanh nghiệp (`Testcase.xlsx`):
* **Sử dụng tiếng Việt chuẩn mực:** Toàn bộ tiêu đề, điều kiện tiên quyết, các bước thực hiện và kết quả mong đợi sử dụng 100% tiếng Việt tự nhiên, chuyên nghiệp. Không dùng tiếng Anh trừ các thuật ngữ chuyên ngành bắt buộc (`MobileApp`, `POS`, `Webview`, `CMS`, `API`, `Job`, `Redis`, `HMAC`, `P0`, `P1`, `P2`, `HTG`, `QR`).
* **Phân định rõ ràng loại kịch bản:** Gán nhãn chính xác thuộc **`MobileApp`** (Ứng dụng ví), **`POS`** (Máy quầy thu ngân siêu thị), **`Webview`** (Cổng nhúng), **`CMS`** (Quản trị), **`API`** (Backend RESTful/Webhook), hoặc **`Job`** (Tiến trình ngầm).
* **Mô tả thao tác người dùng tường minh:** Nêu rõ truy cập chức năng nào, bấm nút gì, nhập/chọn thông tin gì và kết quả hiển thị trên màn hình.

---

## 2. PHÂN LOẠI KỊCH BẢN KIỂM THỬ TRONG HỆ SINH THÁI LOYALTY

| Ký hiệu | Đối tượng kiểm thử | Ví dụ kịch bản |
| :---: | :--- | :--- |
| **`MobileApp`** | Màn hình Trung tâm Loyalty, Mã QR Ví Phần Thưởng động 60s, Vòng quay trên app ví. | `APP_QR_01`: Mở mã QR tiêu điểm động 60 giây, kiểm tra đồng hồ đếm lùi và tự động làm mới mã. |
| **`POS`** | Máy tính tiền / Quầy thu ngân siêu thị Delimart, Cây xăng Total. | `POS_BURN_01`: Quét mã QR của khách, tra cứu Ví Phần Thưởng và trừ 200 điểm giảm 200 HTG trên hóa đơn. |
| **`Webview`** | Cổng nhúng `loyalty-webview` trên ứng dụng đối tác. | `WV_SSO_01`: Mở Webview từ app đối tác qua vé phiên 60s, kiểm tra nạp dữ liệu hội viên và gọi JSBridge. |
| **`CMS`** | Cổng điều hành trung tâm quản lý chính sách, hạn mức, đối soát công nợ. | `CMS_POLICY_01`: Quản trị viên thay đổi tỷ lệ khấu trừ tối đa tại siêu thị từ 30% lên 50%. |
| **`API`** | Các RESTful endpoints, Webhook Outbox, kiểm tra chữ ký HMAC-SHA256. | `API_EARN_01`: Gọi API tích điểm từ giao dịch ví, kiểm tra ghi sổ cái và cập nhật tổng điểm xét hạng. |
| **`Job`** | Các Batch Jobs Spring Batch, Clustered Quartz, quét hết hạn điểm lúc 00:30, gợi nhắc lúc 08:00. | `JOB_EXP_01`: Tiến trình quét điểm hết hạn định kỳ, tự động trừ điểm và ghi sổ nhật ký. |

---

## 3. CẤU TRÚC BẢNG KỊCH BẢN KIỂM THỬ CHUẨN DOANH NGHIỆP

| Mã ID | Loại | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi | Ưu tiên |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-RW-001` | **POS** | Tra cứu Ví Phần Thưởng và trừ điểm tại quầy thu ngân | Khách hàng Hạng Vàng có 1.000 điểm; Hóa đơn siêu thị 1.500 HTG | 1. Thu ngân quét mã QR trên ứng dụng của khách<br/>2. Hệ thống POS hiển thị thông tin Ví Phần Thưởng: Hạng Vàng, 1.000 điểm khả dụng, cho phép trừ tối đa 500 điểm<br/>3. Thu ngân chọn phương án: 'Trừ 500 điểm'<br/>4. Bấm nút 'Thanh toán' | 1. Hệ thống Loyalty trừ 500 điểm trong sổ cái của khách<br/>2. Ghi nhận giao dịch chéo vào sổ cái bù trừ công nợ liên minh<br/>3. Máy POS in hóa đơn giảm trực tiếp 500 HTG tiền mặt (Khách chỉ trả 1.000 HTG) | P0 |
| `TC-RW-002` | **API** | Chống tiêu điểm kép từ 2 máy POS song song | Tài khoản khách hàng có số dư đúng 500 điểm | 1. Gửi đồng thời 2 yêu cầu trừ 500 điểm từ 2 máy POS khác nhau trong cùng 1 thời điểm (sai lệch < 10ms) | 1. Khóa phân tán Redisson RLock tuần tự hóa 2 yêu cầu<br/>2. Yêu cầu 1 thành công (Trừ 500 điểm, số dư về 0)<br/>3. Yêu cầu 2 bị từ chối với lỗi 'Số dư điểm không đủ' | P0 |
| `TC-OUT-001` | **Job** | Tự động thử lại Webhook Outbox khi máy chủ ví tạm thời mất kết nối | Người dùng được thăng hạng Vàng; Máy chủ ví tạm thời mất mạng | 1. Hệ thống Loyalty kích hoạt thăng hạng và ghi bản ghi vào bảng WEBHOOK_OUTBOX<br/>2. Tiến trình Outbox gửi Webhook lần 1 bị lỗi kết nối 504 Gateway Timeout | 1. Sự kiện giữ nguyên trạng thái PENDING, tăng retry_count = 1<br/>2. Lên lịch thử lại lần 2 sau 1 phút, lần 3 sau 5 phút<br/>3. Khi máy chủ ví hoạt động trở lại, sự kiện gửi thành công và chuyển sang PROCESSED | P0 |
| `TC-SPIN-001` | **MobileApp** | Quay Vòng quay may mắn và trừ ngân sách tiền mặt nguyên tử | Người dùng có 1 lượt quay; Ngân sách giải đặc biệt 1.000 HTG còn 1 giải trong ngày | 1. Mở màn hình LuckyDraw trên ứng dụng ví<br/>2. Bấm nút 'Quay thưởng'<br/>3. Đĩa quay hoạt họa mượt mà và dừng tại ô Giải Đặc Biệt 1.000 HTG | 1. Lệnh nguyên tử Redis DECRBY trừ hạn ngạch giải ngày về 0<br/>2. Gọi API ví cộng 1.000 HTG vào số dư ví của khách<br/>3. Hiển thị popup trúng thưởng và cập nhật lịch sử trúng thưởng | P0 |

---

## 4. BẢNG KIỂM TRA 10 ĐIỂM CHỐNG SÓT KỊCH BẢN KIỂM THỬ (10-POINT CHECKLIST)

Trước khi hoàn thiện bộ kịch bản kiểm thử, bắt buộc rà soát qua 10 điểm vàng:
1. **Khóa phân tán & Xung đột đồng thời:** Tiêu điểm cùng lúc từ nhiều nguồn, quay thưởng đồng thời tại khung giờ vàng.
2. **Khống chế ngân sách thời gian thực:** Kiểm tra cơ chế trừ ngân sách giải thưởng nguyên tử qua Redis `DECRBY`.
3. **Đồng bộ hai chiều & Mất mạng:** Ngắt mạng đột ngột khi gửi Webhook, kiểm tra bảng `WEBHOOK_OUTBOX` và `WEBHOOK_DEAD_LETTER`.
4. **Xác thực bảo mật:** Sai lệch thời gian `X-Timestamp` quá ±300s, sai chữ ký HMAC-SHA256, vé SSO quá hạn 60s.
5. **Cô lập đa thuê bao:** Gọi API với `X-Tenant-Id` khác, đảm bảo không xem được dữ liệu của bên thuê khác.
6. **Chu kỳ thăng hạng & Điểm xét hạng:** Kiểm tra mốc 1.000 điểm (Vàng), 5.000 điểm (Bạch Kim), 15.000 điểm (Kim Cương) và chu kỳ 12 tháng.
7. **Quy tắc tính toán số học:** Tỷ giá quy đổi 1 điểm = 1 HTG, tỷ lệ trừ tối đa 30%, 50%, 100%, làm tròn điểm thưởng giao dịch.
8. **Kiểm soát tần suất thông báo đẩy:** Đảm bảo tối đa 1 thông báo/ngày, chỉ gửi từ 8h00 đến 20h00.
9. **Nhập liệu & Giới hạn tệp:** Tải tệp CSV 10.000 mã voucher, mã QR quá hạn 60 giây.
10. **Xác minh Cơ sở dữ liệu (SQL Verify):** Viết câu lệnh SQL đối soát số dư trong `LOYALTY_ACCOUNTS`, sổ cái `LOYALTY_POINT_LEDGER` và bảng bù trừ công nợ `LOYALTY_CLEARINGHOUSE_SETTLEMENTS`.
