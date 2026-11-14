# SỔ TAY VẬN HÀNH PILOT VÀ XỬ LÝ SỰ CỐ 24/7

Tài liệu quy trình bàn giao vận hành, hướng dẫn kết nối thí điểm tại Siêu thị Delimart và sổ tay trực ca ứng cứu sự cố 24/7 cho hệ thống `micro-loyalty`.

---

## 1. QUY TRÌNH KẾT NỐI VẬN HÀNH THỬ NGHIỆM PILOT TẠI SIÊU THỊ DELIMART

### 1.1. Cấu Hình Thiết Bị & Khóa Bảo Mật Điểm Bán POS
1. **Thông tin định danh Đối tác Siêu thị:**
   * `X-Tenant-Id`: `TENANT_DELIMART`
   * `X-Api-Key`: `KEY_CRM_DELIMART`
   * `SecretKey`: `SEC_CRM_DELI_01` (Dùng để sinh chữ ký số HMAC-SHA256 trên từng request).
2. **Quy trình Quét Mã & Thanh Toán Tại Quầy Thu Ngân:**
   * Khách hàng mở ứng dụng Natcash hoặc thẻ thành viên xuất trình mã QR động 60 giây.
   * Thu ngân quét mã QR → POS gửi `POST /loyalty/api/v1/wallet/inquiry` kiểm tra số dư điểm khả dụng và danh sách voucher còn hiệu lực.
   * Thu ngân xác nhận trừ điểm / áp mã giảm giá → POS gửi `POST /loyalty/api/v1/wallet/redeem` có chữ ký HMAC-SHA256.

---

## 2. QUY TRÌNH ỨNG CỨU SỰ CỐ VẬN HÀNH 24/7

### 2.1. Sự Cố 1: Lỗi Xung Đột Khóa Phân Tán (`CONCURRENT_LOCK_BUSY` / HTTP 429)
* **Hiện tượng:** Khách hàng hoặc thu ngân thao tác nhấp đúp hoặc nhiều máy POS gửi đồng thời cùng 1 tài khoản.
* **Cơ chế xử lý tự động:** Hệ thống tự động giải phóng khóa phân tán Redisson sau tối đa 5.000ms.
* **Hành động của hỗ trợ viên:** Hướng dẫn thu ngân đợi 3 giây và thực hiện quét lại mã giao dịch mới.

### 2.2. Sự Cố 2: Bản Tin Webhook Bị Lỗi / Treo Hàng Đợi (`DEAD_LETTER`)
* **Hiện tượng:** Máy chủ của đối tác mất mạng hoặc phản hồi HTTP 500 khi nhận thông báo biến động điểm hoặc thăng hạng (`partner-service`).
* **Cơ chế xử lý tự động:** Tiến trình `OutboxDeadLetterJob` tự động thử lại 5 lần theo cấp số nhân (1s, 2s, 4s, 8s, 16s).
* **Xử lý thủ công trên CMS:**
  * Truy cập Cổng Quản Trị CMS → Menu **Hàng đợi Dead-Letter**.
  * Chọn bản ghi bị lỗi → Bấm nút **"Gửi Lại"** để hệ thống tái phát bản tin ngay tức thì.

### 2.3. Sự Cố 3: Cảnh Báo Ngân Sách Quà Tặng Ngày Cạn Kiệt
* **Hiện tượng:** Nhận cảnh báo vượt hạn mức ngân sách ngày (`daily_budget_limit`) trên một trò chơi hoặc vòng quay (`game-service`).
* **Cơ chế an toàn:** Hệ thống tự động chuyển tỷ lệ trúng thưởng sang các giải thưởng không tốn ngân sách (như "Chúc bạn may mắn lần sau" hoặc tặng điểm thưởng nhỏ) qua lệnh nguyên tử `DECRBY` trên Redis.
* **Thao tác điều chỉnh:** Quản trị viên truy cập CMS → Menu **Quản lý Game / Vòng quay** → Nâng hạn mức ngân sách ngày nếu được phê duyệt.

---

## 3. LỆNH QUẢN TRỊ, KIỂM TRA MICROSERVICES & SAO LƯU DỮ LIỆU

### 3.1. Vận Hành Theo Từng Microservice (Môi Trường SaaS `/data/uc1-software/apps/micro-loyalty/deploy`)
```bash
cd /data/uc1-software/apps/micro-loyalty/deploy

# 1. Kiểm tra trạng thái toàn bộ 11 vùng chứa và API Gateway
docker compose ps
curl -s -f http://127.0.0.1:18095/gateway-health

# 2. Kiểm tra sức khỏe toàn diện cụm dịch vụ
bash /data/uc1-software/apps/micro-loyalty/deploy/scripts/healthcheck.sh

# 3. Xem nhật ký hoặc khởi động lại độc lập từng Microservice bị sự cố
docker logs --tail 100 loyalty-saas-cms-service
docker logs --tail 100 loyalty-saas-customer-service
docker logs --tail 100 loyalty-saas-game-service
docker logs --tail 100 loyalty-saas-campaign-service
docker logs --tail 100 loyalty-saas-partner-service

# Khởi động lại riêng 1 dịch vụ (không gián đoạn các dịch vụ khác)
docker compose restart game-service
```

### 3.2. Sao Lưu Và Khôi Phục Cơ Sở Dữ Liệu Thủ Công
```bash
# 1. Sao lưu nóng cơ sở dữ liệu PostgreSQL
mkdir -p /data/uc1-software/apps/micro-loyalty/deploy/backups
docker exec loyalty-saas-postgres pg_dump -U loyalty_app -d loyalty_db | gzip > /data/uc1-software/apps/micro-loyalty/deploy/backups/loyalty_db_$(date +%Y%m%d_%H%M%S).sql.gz

# 2. Phục hồi cơ sở dữ liệu từ bản sao lưu khi có sự cố
gunzip -c /path/to/backup.sql.gz | docker exec -i loyalty-saas-postgres psql -U loyalty_app -d loyalty_db
```
