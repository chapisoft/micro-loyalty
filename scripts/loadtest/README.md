# HƯỚNG DẪN KIỂM THỬ TẢI HIỆU NĂNG CAO (LOAD TESTING GUIDE)

Bộ công cụ kiểm thử tải hệ thống `micro-loyalty` sử dụng **k6** (hoặc Apache JMeter) nhằm đo lường năng lực chịu tải, thời gian phản hồi (P95 latency), và độ ổn định của các phân hệ nghiệp vụ cốt lõi.

---

## 1. CÀI ĐẶT CÔNG CỤ KIỂM THỬ TẢI K6

* **Trên macOS (Homebrew):**
  ```bash
  brew install k6
  ```
* **Trên Ubuntu / Debian Linux:**
  ```bash
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update && sudo apt-get install k6
  ```

---

## 2. KỊCH BẢN KIỂM THỬ TẢI

### 2.1. Kịch Bản 1: Kiểm Thử Tải 1.000 RPS API Điểm Bán POS (`pos_wallet_loadtest.js`)
* **Mục tiêu:** Mô phỏng 1.000 giao dịch tra cứu và trừ điểm mỗi giây tại quầy siêu thị Delimart.
* **Tiêu chí chấp nhận (SLA):** P95 < 150ms, tỷ lệ lỗi < 0.1%.
* **Lệnh thực thi:**
  ```bash
  k6 run --env BASE_URL=http://localhost:8088 scripts/loadtest/pos_wallet_loadtest.js
  ```

### 2.2. Kịch Bản 2: Kiểm Thử Tải 500 CCU Vòng Quay May Mắn (`lucky_wheel_loadtest.js`)
* **Mục tiêu:** Mô phỏng 500 người dùng quay thưởng đồng thời trong cùng 1 giây, kiểm tra độ ổn định của khóa phân tán Redisson và cơ chế trừ ngân sách tiền mặt nguyên tử Redis `DECRBY`.
* **Tiêu chí chấp nhận (SLA):** P95 < 200ms, tỷ lệ lỗi < 1.0%, tuyệt đối không chi vượt ngân sách ngày.
* **Lệnh thực thi:**
  ```bash
  k6 run --env BASE_URL=http://localhost:8088 scripts/loadtest/lucky_wheel_loadtest.js
  ```
