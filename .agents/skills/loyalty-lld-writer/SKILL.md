---
name: loyalty-lld-writer
description: |
  Sinh tài liệu Thiết kế Chi tiết Cấp độ Thấp (Low-Level Design - LLD) cho một phân hệ nghiệp vụ cụ thể trong hệ sinh thái micro-loyalty.
  Sử dụng khi cần đặc tả kỹ thuật chuyên sâu cho từng phân hệ (Liên thông Ví Phần Thưởng, Sổ cái điểm & Phân hạng, Cột mốc & Gợi nhắc, Cổng Game & Vòng quay, Bù trừ tài chính liên minh).
  Skill đảm bảo:
    (1) Đầy đủ cấu trúc 11 Sections chuẩn mực như dự án DIP.
    (2) Tương thích 100% với PostgreSQL 15+, Spring Boot 2.7.14+, Redis Cluster và ReactJS/Vite.
    (3) Chi tiết đến mức Lập trình viên có thể code ngay và Tester có thể viết Test Cases trực tiếp.
---

# SKILL: Loyalty LLD Writer — Thiết Kế Chi Tiết Cấp Độ Thấp (Low-Level Design) Cho Loyalty

## 1. MỤC TIÊU
Sinh tài liệu thiết kế kỹ thuật chi tiết (`LLD_[Domain_Name].md`) cho từng phân hệ nghiệp vụ của hệ thống `micro-loyalty`. Tài liệu có độ sâu toàn diện, chuẩn xác về mặt cấu trúc cơ sở dữ liệu PostgreSQL 15+, đặc tả API, biểu đồ tuần tự Sequence Diagram, thuật toán xử lý và bộ kịch bản kiểm thử mẫu.

---

## 2. BƯỚC 0: TẢI TOÀN BỘ TÀI LIỆU NGUỒN THAM CHIẾU

Trước khi viết LLD cho một phân hệ, bắt buộc phải đọc:
1. **Tài liệu Kỹ thuật Chi tiết:** `docs/ba/gamehub_loyalty_detailed_design.md`
2. **Tài liệu Giải pháp Tổng thể:** `docs/ba/gamehub_loyalty_solution.md`
3. **Tài liệu Kế hoạch Sản xuất:** `docs/ba/gamehub_loyalty_production_plan.md`
4. **Bộ Quy tắc Phiên làm việc:** `.agents/AGENTS.md`

---

## 3. CẤU TRÚC BẮT BUỘC 11 SECTIONS CỦA TÀI LIỆU LLD

Tệp tài liệu đầu ra được lưu trữ tại `docs/lld/LLD_[Ten_Phan_He].md` và phải tuân thủ nghiêm ngặt 11 phần sau:

### SECTION 0 — COMMON & SHARED DEPENDENCIES
* **0.1. Frontend Shared:** Danh sách component dùng chung (DataTable, StatusBadge, Modal), các i18n keys mới trong `vi.json` / `en.json`, CSS Variables màu sắc.
* **0.2. Backend Shared:** Danh sách Constants (`LoyaltyConstants`), Redis keys (`lock:burn:*`), Error codes, JPA Converters.

### SECTION 1 — TỔNG QUAN & PHẠM VI NGHIỆP VỤ
* **1.1. Mục tiêu phân hệ:** Giải quyết bài toán nghiệp vụ gì trong hệ sinh thái Loyalty.
* **1.2. Danh mục Use Cases & Màn hình:** Bảng ánh xạ mã màn hình, mã UC, vai trò người dùng (Khách hàng, Thu ngân POS, Quản trị viên CMS).
* **1.3. Phạm vi In-Scope / Out-of-Scope:** Ranh giới trách nhiệm rõ ràng của phân hệ.

### SECTION 2 — PHỤ THUỘC & TÍCH HỢP HỆ THỐNG
* **2.1. Phụ thuộc nội bộ:** Giao tiếp với các phân hệ khác trong `loyalty-service`.
* **2.2. Tích hợp ngoại vi:** Giao tiếp với Hệ thống ví Natcash (`natcash_db`), Cổng nạp cước Natcom, Máy POS siêu thị Delimart.

### SECTION 3 — THIẾT KẾ CƠ SỞ DỮ LIỆU CHI TIẾT (POSTGRESQL 15+)
* **3.1. Sơ đồ Mermaid ERD:** Thực thể quan hệ của các bảng trong phân hệ.
* **3.2. Bảng đặc tả trường dữ liệu:** Tên cột, Kiểu dữ liệu PostgreSQL, PK/FK/UQ/NOT NULL, Giá trị mặc định, Diễn giải nghiệp vụ.
* **3.3. Chiến lược Chỉ mục (Index Strategy):** Danh sách các Index phục vụ tăng tốc truy vấn.
* **3.4. Tập lệnh SQL DDL mẫu:** Script SQL Flyway Migration chuẩn hóa.

### SECTION 4 — ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATION)
* Danh mục Endpoint, Giao thức HTTP, Header bắt buộc (`X-Tenant-Id`, `X-Api-Key`, `X-Signature`, `X-Timestamp`).
* Cấu trúc JSON Request Body & Response Body chuẩn hóa kèm ví dụ cụ thể cho các trường hợp thành công (HTTP 200) và thất bại (HTTP 400, 401, 429, 500).

### SECTION 5 — BẢO MẬT, KHÓA PHÂN TÁN & CHỐNG GIAN LẬN
* Đặc tả cơ chế khóa Redisson `RLock` theo tài khoản, khóa cơ sở dữ liệu `Pessimistic Write Lock`.
* Kiểm tra chữ ký HMAC-SHA256, kiểm tra sai lệch thời gian ±300s, kiểm tra hạn mức tần suất (Rate Limiting).

### SECTION 6 — BIỂU ĐỒ TUẦN TỰ TIẾN TRÌNH XỬ LÝ (SEQUENCE DIAGRAMS)
* Vẽ biểu đồ `sequenceDiagram` chi tiết luồng xử lý từ Client → Gateway → Loyalty Service → Redis → PostgreSQL → Webhook Outbox.

### SECTION 7 — TIẾN TRÌNH NGẦM & XỬ LÝ SỰ KIỆN BẤT ĐỒNG BỘ
* Đặc tả Consumer lắng nghe sự kiện từ Redis Streams.
* Đặc tả tiến trình quét bảng `WEBHOOK_OUTBOX` và các Batch Jobs Spring Batch / Quartz.

### SECTION 8 — THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG & TÍCH HỢP JSBRIDGE
* Bố cục màn hình trên CMS / Webview / App di động.
* Cấu trúc bảng DataTable chuẩn (Checkbox → STT → Thao tác → Dữ liệu).
* Thao tác gọi và phản hồi của thư viện `LoyaltyJSBridge`.

### SECTION 9 — MA TRẬN XỬ LÝ NGOẠI LỆ (EXCEPTION HANDLING MATRIX)
* Bảng mã lỗi (`ErrorCode`), thông điệp tiếng Việt, nguyên nhân phát sinh và giải pháp khắc phục.

### SECTION 10 — MA TRẬN KỊCH BẢN KIỂM THỬ (TEST CASES MATRIX)
* Bảng kịch bản kiểm thử theo chuẩn thao tác người dùng (ID, Nền tảng POS/App/CMS/API/Job, Tiêu đề, Điều kiện, Các bước, Kết quả mong đợi, Priority P0/P1).
