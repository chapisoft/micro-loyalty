---
name: loyalty-ui-writer
description: |
  Sinh mã nguồn giao diện Frontend cho Cổng Quản trị Trung tâm (loyalty-cms) và Cổng Webview Nhúng Đối Tác (loyalty-webview) trong hệ sinh thái micro-loyalty.
  Sử dụng khi xây dựng màn hình CMS (ReactJS 18+, Vite, Ant Design 5.x, Nginx) hoặc màn hình Webview (Vite, TailwindCSS Mobile-First, cầu nối LoyaltyJSBridge, đĩa quay Canvas Lucky Draw, xác thực SSO Ticket).
  Skill đảm bảo:
    (1) Khớp 100% thiết kế giao diện, Design Tokens và luồng nghiệp vụ.
    (2) 100% Zero-Hardcoded Text: Toàn bộ text lấy qua hệ thống đa ngôn ngữ i18n t("key").
    (3) Quy chuẩn bảng DataTable: Cột Checkbox -> Cột STT -> Cột Thao tác/Hành động -> Cột Dữ liệu.
    (4) Thư viện cầu nối LoyaltyJSBridge hai chiều (requestPayment, requestScanQR, closeWebview).
    (5) Đóng gói ứng dụng trang đơn tĩnh (SPA) phục vụ qua Nginx siêu nhẹ (< 20MB RAM).
---

# SKILL: Loyalty UI Writer — Triển Khai Giao Diện CMS & Webview Cho Hệ Sinh Thái Loyalty

## 1. MỤC TIÊU
Tạo mã nguồn giao diện Frontend hoàn chỉnh, tối ưu hiệu năng và bảo mật cho 2 phân hệ:
1. **`loyalty-cms`:** Cổng thông tin điều hành trung tâm dành cho quản trị viên Natcash và đối tác liên minh (ReactJS 18+, TypeScript, Vite, Ant Design 5.x, đóng gói Nginx).
2. **`loyalty-webview`:** Cổng trải nghiệm nhúng vào ứng dụng di động của đối tác (ReactJS 18+, Vite, TailwindCSS Mobile-First, CSS Variables tùy biến theo thương hiệu đối tác, cầu nối `LoyaltyJSBridge`).

---

## 2. BƯỚC 0: TẢI VÀ THAM CHIẾU TÀI LIỆU NGUỒN BẮT BUỘC

Trước khi viết mã nguồn giao diện, bắt buộc phải đọc:
1. **Tài liệu Kế hoạch Sản xuất:** `docs/ba/gamehub_loyalty_production_plan.md` (Mục 2: Đặc tả Webview & JSBridge; Mục 3: Cấu trúc 7 module CMS).
2. **Tài liệu Thiết kế Kỹ thuật:** `docs/ba/gamehub_loyalty_detailed_design.md` (Mục 5.2: Giao thức SSO Ticket; Mục 10: Thiết kế màn hình).
3. **Quy tắc phiên làm việc:** `.agents/AGENTS.md` (Quy chuẩn DataTable, Zero-Hardcode Text i18n).

---

## 3. QUY CHUẨN CỔNG QUẢN TRỊ TRUNG TÂM (`loyalty-cms`)

### 3.1. Cấu Trúc Bảng Dữ Liệu Chuẩn Hóa (DataTable)
Tất cả các bảng danh sách trên CMS bắt buộc phải sắp xếp thứ tự cột từ trái sang phải:
1. **Cột Checkbox:** Chọn nhiều bản ghi để thực hiện thao tác hàng loạt.
2. **Cột STT:** Số thứ tự tự động theo phân trang: `(pageIndex - 1) * pageSize + index + 1`.
3. **Cột Thao tác / Hành động:** Các nút Xem chi tiết, Chỉnh sửa, Đổi trạng thái, Thu hồi khóa.
4. **Các cột dữ liệu nghiệp vụ:** Mã, Tên, Hạng hội viên, Điểm, Ngân sách, Trạng thái, Ngày tạo.

### 3.2. Tiêu Chuẩn 100% Zero-Hardcoded Text (i18n)
Tuyệt đối không viết text trực tiếp trong file `.tsx`. Mọi tiêu đề, nhãn nút, cột bảng, thông báo thành công/thất bại phải được định nghĩa trong `src/locales/vi.json` và `src/locales/en.json`:

```tsx
import { useTranslation } from 'react-i18next';

export const PartnerManagementPage: React.FC = () => {
  const { t } = useTranslation('partner');
  return (
    <div>
      <h1>{t('title.list')}</h1>
      <Button type="primary">{t('action.create_new')}</Button>
    </div>
  );
};
```

---

## 4. QUY CHUẨN CỔNG WEBVIEW NHÚNG CHO ĐỐI TÁC (`loyalty-webview`)

### 4.1. Quy Trình Khởi Tạo Phiên SSO & Tùy Biến Giao Diện
Khi Webview được mở từ ứng dụng đối tác với đường dẫn: `https://loyalty.natcash.com/hub?ticket={session_ticket}&theme={partner_theme}`:
1. Hook `useSSOAuth` lấy tham số `ticket` từ URL, gọi API `POST /loyalty/v1/sso/exchange-token` để nhận JWT Access Token và lưu vào `sessionStorage`.
2. Áp dụng biến CSS Variables tương ứng với mã `partner_theme` (ví dụ: `--primary-color: #2E7D32` cho Siêu thị Delimart, `--primary-color: #F28230` cho Natcash).

### 4.2. Bộ Thư Viện Cầu Nối `LoyaltyJSBridge`
Giao tiếp hai chiều với ứng dụng gốc của đối tác:

```typescript
export interface BridgePaymentPayload {
  amount: number;
  orderCode: string;
  description: string;
}

export const LoyaltyJSBridge = {
  requestPayment: (payload: BridgePaymentPayload) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_PAYMENT', payload }));
    } else if (window.LoyaltyNativeBridge) {
      window.LoyaltyNativeBridge.requestPayment(JSON.stringify(payload));
    }
  },
  requestScanQR: () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_SCAN_QR' }));
    }
  },
  closeWebview: () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLOSE_WEBVIEW' }));
    }
  }
};
```

### 4.3. Đĩa Quay May Mắn HTML5 Canvas (Lucky Draw)
* Kết xuất đĩa quay mượt mà 60 FPS trên Canvas.
* Phát âm thanh quay thưởng sống động từ tệp tĩnh.
* Nhận góc dừng ô trúng thưởng chính xác từ API máy chủ (`POST /luckydraw/v1/spin`), hiển thị popup chúc mừng kèm hiệu ứng pháo hoa.
