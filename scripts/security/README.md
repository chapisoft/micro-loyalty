# HƯỚNG DẪN KIỂM THỬ AN TOÀN THÔNG TIN & PENTEST (SEC-01)

Tài liệu hướng dẫn rà soát lỗ hổng an ninh và kiểm thử thâm nhập (Penetration Testing) đối với hệ thống `micro-loyalty`.

---

## 1. MỤC TIÊU KIỂM THỬ BẢO MẬT
* **Chống tấn công phát lại (Replay Attack):** Xác thực cơ chế kiểm tra `X-Timestamp` lệch quá ±300 giây.
* **Chống giả mạo dữ liệu (Tampering):** Xác thực chữ ký số `HMAC-SHA256` với khóa bí mật `SecretKey` của từng đối tác.
* **Phân lập dữ liệu đa thuê bao (Multi-tenant Isolation):** Ngăn chặn hoàn toàn tình trạng dùng API Key của đối tác này để đọc/ghi dữ liệu của đối tác khác.
* **Kháng tấn công tiêm nhiễm mã độc (SQL Injection & XSS):** Xác thực toàn bộ câu truy vấn được tham số hóa qua JPA/Hibernate Parameterized Queries.

---

## 2. CHẠY BỘ KIỂM THỬ PENTEST

```bash
# Chạy bộ kiểm thử an toàn thông tin tự động bằng Python
python3 scripts/security/security_pentest_suite.py
```
