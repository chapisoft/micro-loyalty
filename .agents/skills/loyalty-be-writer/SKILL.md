---
name: loyalty-be-writer
description: |
  Sinh mã nguồn Java 17 LTS / Spring Boot 2.7.14+ (Backend) cho các chức năng, API và tiến trình của dịch vụ độc lập loyalty-service trong hệ sinh thái micro-loyalty.
  Sử dụng khi tạo API nghiệp vụ, phân hệ tích/tiêu điểm, liên thông Ví Phần Thưởng, kiểm soát khóa phân tán Redisson RLock, Transactional Outbox Pattern, hàng đợi Redis Streams, Spring Batch Jobs và xác thực HMAC.
  Skill đảm bảo:
    (1) Kiến trúc phân lớp chuẩn hóa Hexagonal (Domain, Application, Adapter).
    (2) Tách biệt cơ sở dữ liệu độc lập PostgreSQL 15+ (loyalty_db) với natcash_db.
    (3) Chống tiêu điểm kép qua Redisson RLock (lock:burn:tenant_id:user_id) và Pessimistic Write Lock.
    (4) Xử lý sự kiện bất đồng bộ qua Transactional Outbox Pattern và Redis Streams.
    (5) Xác thực Khóa kép (X-Api-Key, SecretKey) và ký số HMAC-SHA256 với sai lệch thời gian ±300s.
---

# SKILL: Loyalty Backend Writer — Triển Khai Code Backend & Tiến Trình Cho Loyalty Service

## 1. MỤC TIÊU
Tạo mã nguồn Java Spring Boot (Java 17 LTS, Spring Boot 2.7.14+) cho dịch vụ máy chủ độc lập `loyalty-service` vận hành trên cơ sở dữ liệu quan hệ **PostgreSQL 15+** (`loyalty_db`). Mã nguồn sinh ra phải đáp ứng các tiêu chuẩn kiến trúc Lục giác (Hexagonal Architecture), an toàn tuyệt đối về mặt tài chính, xử lý bất đồng bộ tin cậy và sẵn sàng vận hành sản xuất.

---

## 2. BƯỚC 0: TẢI VÀ THAM CHIẾU TÀI LIỆU NGUỒN BẮT BUỘC

Trước khi triển khai mã nguồn, bắt buộc phải đọc và tham chiếu các tài liệu trong dự án:
1. **Tài liệu Thiết kế Kỹ thuật Chi tiết:** `docs/ba/gamehub_loyalty_detailed_design.md` (Đặc tả kiến trúc, 17 bảng cơ sở dữ liệu, danh mục API, Sequence Diagram).
2. **Tài liệu Giải pháp và Thiết kế Tổng thể:** `docs/ba/gamehub_loyalty_solution.md` (Quy trình liên thông Ví Phần Thưởng, cơ chế thanh toán bù trừ, quy tắc tích điểm).
3. **Tài liệu Kế hoạch Sản xuất Chi tiết:** `docs/ba/gamehub_loyalty_production_plan.md` (Phân rã 42 tác vụ kỹ thuật và tiêu chí hoàn thành).

---

## 3. QUY CHUẨN KIẾN TRÚC LỤC GIÁC (HEXAGONAL ARCHITECTURE)

Mọi phân hệ trong `loyalty-service` đều phải được cấu trúc theo 3 lớp phân lập rõ ràng:

```
com.natcash.loyalty.[feature_name]
├── domain/                  // LỚP TRUNG TÂM (Thuần Java, không phụ thuộc Spring)
│   ├── model/               // Entity / Value Objects / Domain Aggregates
│   ├── exception/           // Ngoại lệ nghiệp vụ (Business Exceptions)
│   └── repository/          // Cổng giao tiếp xuất (Port / Interface)
├── application/             // LỚP USE CASE (Chứa logic nghiệp vụ)
│   ├── dto/                 // Request / Response Payload DTOs
│   ├── port/in/             // Use Case Interfaces (vd: BurnPointsUseCase)
│   └── service/             // Implementation logic của Use Case
└── adapter/                 // LỚP GIAO TIẾP NGOẠI VI (Phụ thuộc Framework)
    ├── in/                  // Đầu vào
    │   ├── web/             // Spring RestController (xử lý HTTP Request)
    │   ├── stream/          // Redis Streams Consumer
    │   └── scheduler/       // Clustered Quartz / Spring Batch Jobs
    └── out/                 // Đầu ra
        ├── persistence/     // Spring Data JPA Repositories & Entity Mappers
        ├── client/          // HTTP Clients gọi Cổng Telco / Cổng Ví
        └── outbox/          // Outbox Publisher lưu bản ghi sự kiện vào DB
```

### Quy Tắc Cốt Lõi:
* Lớp `domain/` không chứa bất kỳ Annotation nào của Spring Framework (ngoại trừ validation JSR-303).
* Lớp `application/service/` không chứa câu lệnh SQL trực tiếp hay logic giao thức HTTP.
* Dữ liệu từ ngoài vào đi theo luồng: `Adapter In` → `Application Port In` → `Domain Service` → `Adapter Out Persistence`.
* Tuyệt đối không trả JPA Entity trực tiếp ra ngoài RestController; luôn phải ánh xạ sang Domain Model rồi chuyển thành Response DTO.

---

## 4. QUY CHUẨN CƠ SỞ DỮ LIỆU & TRANSACTION (POSTGRESQL 15+)

### 4.1. Cơ Chế Khóa Phân Tán và Chống Tiêu Điểm Kép
Khi xử lý trừ điểm tại quầy thu ngân đối tác (`reward-wallet/redeem`), bắt buộc phải bọc trong khối khóa phân tán:

```java
String lockKey = String.format("lock:burn:%s:%s", tenantId, externalUserId);
RLock lock = redissonClient.getLock(lockKey);
boolean acquired = lock.tryLock(3000, 5000, TimeUnit.MILLISECONDS);
if (!acquired) {
    throw new BusinessException(ErrorCode.CONCURRENT_TRANSACTION_CONFLICT, "Giao dịch đang được xử lý song song.");
}
try {
    // Thực thi giao dịch trừ điểm trong @Transactional với Pessimistic Write Lock
    rewardWalletService.executeRedeem(tenantId, externalUserId, request);
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

### 4.2. Cơ Chế Transactional Outbox Pattern
Tuyệt đối không gọi Webhook trực tiếp trong cùng Transaction cập nhật điểm. Khi có sự kiện cần bắn sang hệ thống khác, lưu vào bảng `WEBHOOK_OUTBOX`:

```java
WebhookOutboxEvent event = WebhookOutboxEvent.builder()
    .tenantId(tenantId)
    .eventType("LOYALTY_TIER_UPDATED")
    .payload(objectMapper.writeValueAsString(payloadDto))
    .targetUrl(partnerWebhookUrl)
    .retryCount(0)
    .status(OutboxStatus.PENDING)
    .nextRetryAt(Instant.now())
    .build();
webhookOutboxRepository.save(event);
```

Tiến trình `OutboxPublisherJob` quét định kỳ bảng `WEBHOOK_OUTBOX` mỗi 1 giây để gửi Webhook kèm cơ chế thử lại giãn cách theo cấp số nhân (1p → 5p → 30p → 2h → 6h) và đẩy vào `WEBHOOK_DEAD_LETTER` nếu quá 5 lần lỗi.

---

## 5. QUY CHUẨN XÁC THỰC BẢO MẬT & KÝ SỐ HMAC-SHA256

Mọi API B2B đều phải được kiểm tra qua `ApiKeyAuthFilter`:
1. Trích xuất `X-Api-Key`, `X-Timestamp`, `X-Signature`.
2. Kiểm tra `X-Timestamp`: Nếu sai lệch quá ±300 giây so với giờ hệ thống → Từ chối `401 Unauthorized`.
3. Tra cứu `SecretKey` từ Redis theo `X-Api-Key`.
4. Tính toán chữ ký chuẩn hóa: `CanonicalString = HttpMethod + "\n" + RequestPath + "\n" + X-Timestamp + "\n" + SHA256(RequestBodyJson)`.
5. So sánh an toàn hằng số thời gian `MessageDigest.isEqual(expectedSignature.getBytes(), receivedSignature.getBytes())`.

---

## 6. QUY CHUẨN LẬP TRÌNH BẮT BUỘC (ZERO-HARDCODE & CLEAN IMPORTS)

* **Không hardcode:** Khai báo hằng số tập trung trong `LoyaltyConstants.java`, sử dụng Enums có định danh rõ ràng.
* **Không dùng FQN:** Toàn bộ Class/DTO/Enum phải được `import` ở đầu tệp.
* **Gom nhóm 4 khối import:** Nhóm dự án → Nhóm thư viện bên ngoài → Nhóm thư viện Java JDK → Nhóm Static Imports.
