# SỔ TAY VẬN HÀNH PILOT VÀ XỬ LÝ SỰ CỐ 24/7 (OPERATIONS RUNBOOK)

Tài liệu quy trình bàn giao vận hành, hướng dẫn kết nối thí điểm (Pilot Rollout) tại Siêu thị Delimart và sổ tay trực ca ứng cứu sự cố 24/7 cho hệ thống `micro-loyalty`.

---

## 1. QUY TRÌNH KẾT NỐI VẬN HÀNH THỬ NGHIỆM PILOT TẠI SIÊU THỊ DELIMART

### 1.1. Cấu Hình Thiết Bị & Khóa Bảo Mật Điểm Bán POS
1. **Thông tin định danh Đối tác Siêu thị:**
   * `X-Tenant-Id`: `TENANT_DELIMART`
   * `X-Api-Key`: `KEY_CRM_DELIMART`
   * `SecretKey`: `SEC_CRM_DELI_01` (Dùng để sinh chữ ký số HMAC-SHA256 trên từng request).
2. **Quy trình Quét Mã & Thanh Toán Tại Quầy Thu Ngân:**
   * Khách hàng mở ứng dụng Natcash hoặc thẻ thành viên xuất trình mã QR động 60 giây.
   * Thu ngân quét mã QR $\rightarrow$ POS gửi `POST /wallet/v1/inquiry` kiểm tra số dư điểm khả dụng và danh sách voucher còn hiệu lực.
   * Thu ngân xác nhận trừ điểm / áp mã giảm giá $\rightarrow$ POS gửi `POST /wallet/v1/redeem` có chữ ký HMAC-SHA256.

---

## 2. QUY TRÌNH ỨNG CỨU SỰ CỐ VẬN HÀNH 24/7

### 2.1. Sự Cố 1: Lỗi Xung Đột Khóa Phân Tán (`CONCURRENT_LOCK_BUSY` / HTTP 429)
* **Hiện tượng:** Khách hàng hoặc thu ngân thao tác nhấp đúp (Double-click) hoặc nhiều máy POS gửi đồng thời cùng 1 tài khoản.
* **Cơ chế xử lý tự động:** Hệ thống tự động giải phóng khóa phân tán Redisson sau tối đa 5.000ms.
* **Hành động của hỗ trợ viên:** Hướng dẫn thu ngân đợi 3 giây và thực hiện quét lại mã giao dịch mới.

### 2.2. Sự Cố 2: Bản Tin Webhook Bị Lỗi / Treo Hàng Đợi (`DEAD_LETTER`)
* **Hiện tượng:** Máy chủ của đối tác mất mạng hoặc phản hồi HTTP 500 khi nhận thông báo biến động điểm hoặc thăng hạng.
* **Cơ chế xử lý tự động:** Tiến trình `OutboxDeadLetterJob` tự động thử lại 5 lần theo cấp số nhân (Backoff: 1s, 2s, 4s, 8s, 16s).
* **Xử lý thủ công trên CMS:**
  * Truy cập Cổng Quản Trị CMS $\rightarrow$ Menu **Hàng đợi Dead-Letter**.
  * Chọn bản ghi bị lỗi $\rightarrow$ Bấm nút **"Gửi Lại (Retrigger)"** để hệ thống tái phát bản tin ngay tức thì.

### 2.3. Sự Cố 3: Cảnh Báo Ngân Sách Quà Tặng Ngày Cạn Kiệt
* **Hiện tượng:** Nhận cảnh báo qua Telegram/Grafana: `daily_budget_limit exceeded` trên một trò chơi hoặc vòng quay.
* **Cơ chế an toàn:** Hệ thống tự động chuyển tỷ lệ trúng thưởng sang các giải thưởng không tốn ngân sách (Ví dụ: "Chúc bạn may mắn lần sau" hoặc tặng điểm thưởng nhỏ) qua lệnh nguyên tử `DECRBY`.
* **Thao tác điều chỉnh:** Quản trị viên truy cập CMS $\rightarrow$ Menu **Quản lý Game / Vòng quay** $\rightarrow$ Nâng hạn mức ngân sách ngày nếu được phê duyệt.

---

## 3. LỆNH QUẢN TRỊ & SAO LƯU DỮ LIỆU ĐỊNH KỲ

```bash
# 1. Sao lưu cơ sở dữ liệu thủ công
bash /home/dip/micro-loyalty/deploy/scripts/backup.sh

# 2. Phục hồi cơ sở dữ liệu từ bản sao lưu
bash /home/dip/micro-loyalty/deploy/scripts/restore.sh /path/to/backup.sql.gz

# 3. Kiểm tra sức khỏe toàn diện các dịch vụ
bash /home/dip/micro-loyalty/deploy/scripts/healthcheck.sh
```
