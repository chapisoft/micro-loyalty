import { SandboxMenu, SandboxContent } from '../types/sandbox';

const API_BASE = '/api/v1';

export async function fetchSandboxApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function loginSandbox(username: string, password?: string) {
  try {
    const res = await fetch(`${API_BASE}/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) return json.data;
    }
  } catch (e) {
    console.warn('[loginSandbox] Backend offline, using demo fallback session:', e);
  }

  return {
    username: username || 'developer',
    role: 'PARTNER_DEVELOPER',
    partnerCode: 'PARTNER_DEMO_01',
    token: 'sbx_token_demo_98412894',
    partnerName: 'Microtec Partner Sandbox',
  };
}

export async function getPortalMenus(username?: string): Promise<SandboxMenu[]> {
  try {
    const headers: Record<string, string> = {};
    if (username) headers['X-Sandbox-Username'] = username;

    const res = await fetch(`${API_BASE}/portal/menus`, { headers });
    const json = await res.json();
    if (json && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
  } catch (e) {
    console.warn('[getPortalMenus] Fallback to default menus:', e);
  }

  // Standard clean Smart OTP menus (technical terms kept in English)
  return [
    { id: 1, name: 'Overview & Test Credentials', path: '/dashboard', icon: 'LuCompass', menuOrder: 1 },
    { id: 2, name: '1. Device Provisioning', path: '/docs/2', icon: 'LuSmartphone', menuOrder: 2 },
    { id: 3, name: '2. Challenge Init', path: '/docs/3', icon: 'LuShieldAlert', menuOrder: 3 },
    { id: 4, name: '3. Verify Smart OTP', path: '/docs/4', icon: 'LuCheckCircle2', menuOrder: 4 },
    { id: 5, name: '4. Mobile SDK Integration', path: '/docs/5', icon: 'LuCode2', menuOrder: 5 },
    { id: 6, name: '5. Simulator User Guide', path: '/docs/6', icon: 'LuBookOpen', menuOrder: 6 },
    { id: 7, name: '6. Live Simulator & Inspector', path: '/simulator', icon: 'LuPlaySquare', menuOrder: 7 },
  ];
}

export async function getPortalContent(menuId: number | string): Promise<SandboxContent> {
  try {
    const res = await fetch(`${API_BASE}/portal/contents/${menuId}`);
    const json = await res.json();
    if (json && json.data) {
      return json.data;
    }
  } catch (e) {
    console.warn('[getPortalContent] Fallback content:', e);
  }

  const id = Number(menuId);

  // 1. TỔNG QUAN
  if (id === 1) {
    return {
      menuId: 1,
      title: 'Overview - Smart OTP Platform',
      bodyMarkdown: `# Overview - Smart OTP Platform

Smart OTP là giải pháp xác thực hai yếu tố (2FA) bảo mật cao cấp dựa trên chuẩn quốc tế **RFC 6287 (OCRA - OATH Challenge-Response Algorithm)** và chuẩn mã hóa phần cứng của Ngân hàng Nhà nước Việt Nam (Quyết định 2345/QĐ-NHNN & Quyết định 630/QĐ-NHNN).

---

## 1. Kiến Trúc Hoạt Động Của Hệ Thống

\`\`\`mermaid
flowchart LR
    subgraph Client["Client App"]
        Mobile["📱 Mobile App (iOS / Android / RN / Flutter)"]
        Enclave["🔒 Secure Enclave / Keystore (Seed Key)"]
    end

    subgraph Partner["Partner Server"]
        Backend["🏢 Partner Core Banking / Merchant"]
    end

    subgraph Core["Smart OTP Core Platform"]
        Gateway["🌐 Smart OTP API Gateway"]
        AuthSvc["⚡ Auth & Validation Service"]
        HsmDb["🛡️ Database / HSM Cluster"]
    end

    Mobile <--> |1. Sign Challenge Offline| Enclave
    Mobile --> |2. Gửi 8-digit OTP| Backend
    Backend --> |3. POST /otp/verify| Gateway
    Gateway --> AuthSvc --> HsmDb
\`\`\`

---

## 2. Các Trụ Cột Công Nghệ Cốt Lõi:
1. **Zero SMS Cost:** Mã OTP được tính toán ngay tại phần cứng thiết bị của khách hàng, loại bỏ 100% chi phí gửi SMS Brandname hàng tháng.
2. **Transaction-Bound OTP:** Mã OTP gắn liền với Amount, Beneficiary Account và Challenge Code, vô hiệu hóa hoàn toàn các cuộc tấn công Man-in-the-Middle hoặc lừa đảo chuyển tiền.
3. **Hardware Security Cấp Ngân Hàng:** Seed Key 128-bit/256-bit được mã hóa và lưu trong phân vùng phần cứng biệt lập (Apple Secure Enclave trên iPhone và Android Hardware Keystore), tự động khóa vĩnh viễn khi nhập sai PIN quá 5 lần.
`,
      codeDemo: `curl -X GET "https://api.miotp.io.vn/api/v1/health" \\
  -H "X-Partner-Code: PARTNER_DEMO_01"`,
      testAccountInfo: `Base URL: https://api.miotp.io.vn/api/v1\nPartner Code: PARTNER_DEMO_01\nSecret Key: sec_uat_9f83b2a74c10e5d6\nAlgorithm: HMAC-SHA256 (RFC 6287 OCRA-1)`,
    };
  }

  // 2. DEVICE PROVISIONING
  if (id === 2) {
    return {
      menuId: 2,
      title: '1. Device Provisioning',
      bodyMarkdown: `# Quy Trình Device Provisioning

Device Provisioning được thực hiện khi người dùng lần đầu đăng ký Smart OTP trên thiết bị di động mới hoặc cài đặt lại ứng dụng.

---

## 1. Sơ Đồ Device Provisioning

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Khách Hàng
    participant App as Mobile App (SmartOtpSDK)
    participant Partner as Backend Đối Tác
    participant Core as Smart OTP Core

    User->>App: 1. Nhập Số Điện Thoại
    App->>Partner: 2. Gửi yêu cầu đăng ký thiết bị (DeviceId)
    Partner->>Core: 3. POST /api/v1/provision/register
    Core-->>User: 4. Gửi Activation Code 6 số (qua SMS hoặc eKYC)
    User->>App: 5. Nhập Activation Code & Thiết lập PIN 6 số
    App->>App: 6. Lưu Seed Key mã hóa vào Secure Enclave
    App-->>User: 7. Provision thành công (Thiết bị sẵn sàng)
\`\`\`

---

## 2. Đặc Tả API Device Provisioning (Backend):
- **Endpoint:** \`POST https://api.miotp.io.vn/api/v1/provision/register\`
- **Headers:**
  - \`Content-Type: application/json\`
  - \`X-Partner-Code: PARTNER_DEMO_01\`

### Request Body:
\`\`\`json
{
  "customerId": "0988123456",
  "deviceId": "UUID-DEVICE-994821-X",
  "deviceModel": "iPhone 16 Pro Max",
  "osType": "IOS",
  "clientPublicKey": "04a29f8b4c10e5d67a9c3f0b2e8174..."
}
\`\`\`

### Response (200 OK):
\`\`\`json
{
  "succeeded": true,
  "code": 200,
  "message": "Provisioning request accepted",
  "data": {
    "activationCode": "ACT-9821-X4K9",
    "encryptedSeedKey": "a9f4c3b8e21074d6f9a0c1e8b7d5a3f2",
    "keyExpiry": 31536000
  }
}
\`\`\`
`,
      codeDemo: `curl -X POST "https://api.miotp.io.vn/api/v1/provision/register" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "deviceId": "UUID-DEVICE-994821-X",
    "deviceModel": "iPhone 16 Pro Max",
    "osType": "IOS"
  }'`,
      testAccountInfo: `Endpoint: POST /api/v1/provision/register\nPartner Code: PARTNER_DEMO_01\nActivation Code Mẫu: ACT-9821-X4K9\nSeed Key Hex Mẫu: a9f4c3b8e21074d6f9a0c1e8b7d5a3f2`,
    };
  }

  // 3. CHALLENGE INIT
  if (id === 3) {
    return {
      menuId: 3,
      title: '2. Challenge Init',
      bodyMarkdown: `# Quy Trình Challenge Init

Khi khách hàng thực hiện một giao dịch thanh toán hoặc chuyển khoản trên Web/App của đối tác, Backend của đối tác cần gọi API Smart OTP để phát sinh một **Challenge Code** duy nhất gắn liền với thông tin giao dịch.

---

## 1. Sơ Đồ Challenge Init

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Khách Hàng
    participant Partner as Web / Backend Đối Tác
    participant Core as Smart OTP Server

    User->>Partner: 1. Bấm xác nhận chuyển khoản (Amount, To Account)
    Partner->>Core: 2. POST /api/v1/challenge/init
    Core-->>Partner: 3. Trả về Challenge Code (vd: CHAL-994821)
    Partner-->>User: 4. Hiển thị Challenge Code cho User mở Smart OTP App
\`\`\`

---

## 2. Đặc Tả API Challenge Init:
- **Endpoint:** \`POST https://api.miotp.io.vn/api/v1/challenge/init\`
- **Headers:** \`X-Partner-Code: PARTNER_DEMO_01\`

### Request Body:
\`\`\`json
{
  "customerId": "0988123456",
  "transId": "TX_994820153",
  "amount": 5000000,
  "currency": "VND",
  "toAccount": "0011004567890",
  "toBank": "VCB",
  "content": "Chuyen tien thanh toan hop dong"
}
\`\`\`

### Response Body:
\`\`\`json
{
  "succeeded": true,
  "code": 200,
  "message": "Challenge initialized",
  "data": {
    "challengeCode": "CHAL-994821",
    "expiredAt": "2026-08-20T18:45:00Z",
    "ttlSeconds": 120
  }
}
\`\`\`
`,
      codeDemo: `curl -X POST "https://api.miotp.io.vn/api/v1/challenge/init" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "transId": "TX_994820153",
    "amount": 5000000,
    "toAccount": "0011004567890"
  }'`,
      testAccountInfo: `Endpoint: POST /api/v1/challenge/init\nPartner Code: PARTNER_DEMO_01\nChallenge Code Mẫu: CHAL-994821\nTTL: 120 seconds`,
    };
  }

  // 4. VERIFY SMART OTP
  if (id === 4) {
    return {
      menuId: 4,
      title: '3. Verify Smart OTP',
      bodyMarkdown: `# Quy Trình Verify Smart OTP

Sau khi khách hàng Sign Challenge bằng Smart OTP trên Mobile App và nhận mã OTP 8 chữ số, Backend của đối tác gửi mã này lên máy chủ Smart OTP để Verify tính toàn vẹn.

---

## 1. Sơ Đồ Verify OTP

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Khách Hàng
    participant Partner as Backend Đối Tác
    participant Core as Smart OTP Server

    User->>Partner: 1. Gửi 8-digit OTP (vd: 48291037)
    Partner->>Core: 2. POST /api/v1/otp/verify
    Core->>Core: 3. Băm HMAC-SHA256 & So khớp RFC 6287 OCRA
    Core-->>Partner: 4. Trả kết quả: SUCCESS (200 OK)
    Partner-->>User: 5. Giao dịch thành công 100%
\`\`\`

---

## 2. Đặc Tả API Verify:
- **Endpoint:** \`POST https://api.miotp.io.vn/api/v1/otp/verify\`
- **Headers:** \`X-Partner-Code: PARTNER_DEMO_01\`

### Request Body:
\`\`\`json
{
  "customerId": "0988123456",
  "challengeCode": "CHAL-994821",
  "otp": "48291037"
}
\`\`\`

### Bảng Mã Lỗi Phản Hồi:
| HTTP Code | Error Code | Ý Nghĩa |
| :--- | :--- | :--- |
| **200 OK** | \`SUCCESS\` | Mã OTP chính xác, giao dịch hợp lệ |
| **400 Bad Request** | \`INVALID_OTP\` | Mã OTP sai hoặc đã hết hạn |
| **403 Forbidden** | \`DEVICE_LOCKED\` | Thiết bị đã bị khóa do nhập sai PIN 5 lần |
| **404 Not Found** | \`CHALLENGE_EXPIRED\` | Challenge Code không tồn tại hoặc quá hạn |
`,
      codeDemo: `curl -X POST "https://api.miotp.io.vn/api/v1/otp/verify" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "challengeCode": "CHAL-994821",
    "otp": "48291037"
  }'`,
      testAccountInfo: `Endpoint: POST /api/v1/otp/verify\nPartner Code: PARTNER_DEMO_01\nTest OTP: 48291037\nAlgorithm: HMAC-SHA256 (RFC 6287 OCRA-1)`,
    };
  }

  // 5. MOBILE SDK INTEGRATION
  if (id === 5) {
    return {
      menuId: 5,
      title: '4. Mobile SDK Integration',
      bodyMarkdown: `# Hướng Dẫn Tích Hợp Mobile SDK Đa Nền Tảng

Bộ thư viện **SmartOtpSDK** được phát triển chuyên biệt cho từng nền tảng di động với hỗ trợ đầy đủ phần cứng an toàn (Secure Enclave / Hardware Keystore) và giải thuật **RFC 6287 OCRA**.

---

## 📦 1. Tải Bộ Cài Đặt SDK (Download Packages)

Tải gói mã nguồn SDK đã đóng gói sẵn cho từng nền tảng:

| Platform | Ngôn ngữ hỗ trợ | Phiên bản | Link Tải Trọn Gói |
| :--- | :--- | :--- | :--- |
| 🍏 **iOS SDK** | Swift 5.9+ / Objective-C | \`v1.0.0\` | [⬇️ Tải SmartOtpSDK-iOS.zip](/downloads/SmartOtpSDK-iOS.zip) |
| 🤖 **Android SDK** | Kotlin 1.9+ / Java 17 | \`v1.0.0\` | [⬇️ Tải SmartOtpSDK-Android.zip](/downloads/SmartOtpSDK-Android.zip) |
| ⚛️ **React Native** | TypeScript / JavaScript | \`v1.0.0\` | [⬇️ Tải SmartOtpSDK-ReactNative.zip](/downloads/SmartOtpSDK-ReactNative.zip) |
| 🐦 **Flutter Plugin** | Dart 3.0+ | \`v1.0.0\` | [⬇️ Tải SmartOtpSDK-Flutter.zip](/downloads/SmartOtpSDK-Flutter.zip) |
| 🌐 **Web / JS SDK** | JavaScript (ES6) | \`v1.0.0\` | [⬇️ Tải SmartOtpSDK-Web.zip](/downloads/SmartOtpSDK-Web.zip) |
| 📦 **All Platforms Bundle** | All Platforms | \`v1.0.0\` | [⬇️ Tải SmartOtpSDK-AllPlatforms.zip](/downloads/SmartOtpSDK-AllPlatforms.zip) |

---

## 2. Ma Trận Tính Năng Bảo Mật Nền Tảng (Security Matrix)

| Platform | Ngôn ngữ | Cơ chế bảo mật phần cứng | Chuẩn mật mã | Vị trí SDK mã nguồn |
| :--- | :--- | :--- | :--- | :--- |
| **iOS** | Swift / Objective-C | Apple Secure Enclave & Keychain | RFC 6287 OCRA-1 | \`src/lib/sdk/ios/\` |
| **Android** | Kotlin / Java | Android Hardware Keystore & AES-256 GCM | RFC 6287 OCRA-1 | \`src/lib/sdk/android/\` |
| **React Native** | TypeScript / JS | TurboModule / Native Bridge | RFC 6287 OCRA-1 | \`src/lib/sdk/react-native/\` |
| **Flutter** | Dart | MethodChannel Plugin | RFC 6287 OCRA-1 | \`src/lib/sdk/flutter/\` |

---

## 3. Quy Trình 3 Bước Tích Hợp Chung:

### Bước 1: Device Provisioning
Lưu trữ Seed Key 256-bit được mã hóa đối xứng vào phân vùng bộ nhớ bảo vệ phần cứng.

### Bước 2: PIN Setup & Biometrics
Bảo vệ bằng Face ID, Vân tay hoặc mã PIN 6 số trước khi mở khóa Secret Key.

### Bước 3: Sign Challenge Offline
Nhận Challenge Code (\`challenge\`, \`amount\`, \`toAccount\`) &rarr; Băm HMAC-SHA256 & Dynamic Truncation &rarr; Trả về mã Smart OTP 8 chữ số tức thì.
`,
      codeDemo: `// Swift (iOS)
import SmartOtpSDK

let otp = SmartOtpSDK.shared.generateOtp(
    challengeCode: "CHAL-994821",
    amount: "5000000",
    toAccount: "0011004567890"
)`,
      testAccountInfo: `Link Tải Trực Tiếp:
- iOS: /downloads/SmartOtpSDK-iOS.zip
- Android: /downloads/SmartOtpSDK-Android.zip
- React Native: /downloads/SmartOtpSDK-ReactNative.zip
- Flutter: /downloads/SmartOtpSDK-Flutter.zip
- Full Package: /downloads/SmartOtpSDK-AllPlatforms.zip`,
    };
  }

  // 6. SIMULATOR USER GUIDE
  if (id === 6) {
    return {
      menuId: 6,
      title: '5. Simulator User Guide',
      bodyMarkdown: `# Hướng Dẫn Sử Dụng Live Simulator & Crypto Inspector

Trình giả lập **Smart OTP Live Simulator** (chuẩn iPhone 16 Pro Max 6.9" OLED) cho phép đối tác kiểm thử 100% vòng đời Smart OTP trực tiếp trên Web.

---

## 1. Sơ Đồ Luồng Xác Thực Simulator

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Người Dùng
    participant Phone as iPhone 16 Pro Max Simulator
    participant Inspector as Live Inspector
    participant Backend as Smart OTP Server

    User->>Phone: 1. Nhập PIN (123456)
    Phone->>Phone: 2. Mở khóa Seed Key từ Secure Enclave
    User->>Inspector: 3. Tùy chỉnh Amount, To Account, Challenge Code
    Inspector->>Phone: 4. Đồng bộ Challenge Code sang điện thoại
    Phone->>Phone: 5. Tính toán HMAC-SHA256 & Modulo 10^8
    Phone-->>User: 6. Hiển thị 8-digit OTP (đếm ngược 60s)
    User->>Inspector: 7. Bấm "Verify Online"
    Inspector->>Backend: 8. POST /api/v1/otp/verify
    Backend-->>Inspector: 9. HTTP 200 OK (SUCCESS)
\`\`\`

---

## 2. Đối Soát 4 Bước Mật Mã Trong Live Inspector:
1. **Bước 1 (Normalized Challenge Payload):** Ghép chuỗi chuẩn hóa \`<Challenge Code>\\|<Amount>\\|<To Account>\\|T=<TimeWindow>\`.
2. **Bước 2 (Device Secret Key):** Secret Key thiết bị được giải mã an toàn.
3. **Bước 3 (HMAC-SHA256 256-bit Digest):** Băm 256-bit ra 64 ký tự Hex.
4. **Bước 4 (RFC 6287 Dynamic Truncation & Binary Modulo 10^8):** Lấy 4 bit cuối xác định Offset, trích xuất 4 byte nhị phân và chia dư cho $10^8$ ra 8 chữ số Smart OTP.
`,
      codeDemo: `curl -X POST "https://api.miotp.io.vn/api/v1/otp/verify" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "challengeCode": "CHAL-994821",
    "otp": "48291037"
  }'`,
      testAccountInfo: `Base URL: https://api.miotp.io.vn/api/v1
Partner Code: PARTNER_DEMO_01
Secret Key: sec_uat_9f83b2a74c10e5d6
Algorithm: HMAC-SHA256 (RFC 6287 OCRA-1)`,
    };
  }

  // General fallback
  return {
    menuId: id,
    title: 'Smart OTP Platform Documentation',
    bodyMarkdown: `# Smart OTP Platform Documentation\n\nNền tảng Smart OTP hỗ trợ chuẩn bảo mật ngân hàng **RFC 6287 (OCRA)** và **AES-256 GCM**.\n\n### Endpoint Sandbox:\n\`POST https://api.miotp.io.vn/api/v1/otp/verify\`\n\n### Đặc Tả Dữ Liệu:\n\`\`\`json\n{\n  "customerId": "0988123456",\n  "challengeCode": "CHAL-994821",\n  "otp": "48291037"\n}\n\`\`\``,
    codeDemo: `curl -X POST "https://api.miotp.io.vn/api/v1/otp/verify" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Partner-Code: PARTNER_DEMO_01" \\\n  -d '{"customerId":"0988123456","challengeCode":"CHAL-994821","otp":"48291037"}'`,
    testAccountInfo: `Base URL: https://api.miotp.io.vn/api/v1\nPartner Code: PARTNER_DEMO_01\nSecret Key: sec_uat_9f83b2a74c10e5d6\nAlgorithm: HMAC-SHA256 (RFC 6287)`,
  };
}
