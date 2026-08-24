/**
 * Thư viện Cầu nối LoyaltyJSBridge hai chiều giữa Cổng Webview và Ứng dụng Di động Native (natcash-eu-app)
 */

export interface PaymentPayload {
  amount: number;
  itemCode: string;
  itemName: string;
  transactionRef: string;
  gameId?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  message?: string;
}

export interface ScanQRResponse {
  success: boolean;
  qrData?: string;
  errorCode?: string;
}

export interface SharePayload {
  title: string;
  content: string;
  url: string;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    LoyaltyJSBridge?: {
      onNativeCallback: (callbackId: string, data: any) => void;
      onNativeEvent: (eventName: string, data: any) => void;
    };
  }
}

class LoyaltyJSBridgeManager {
  private callbacks: Map<string, (response: any) => void> = new Map();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.LoyaltyJSBridge = {
        onNativeCallback: (callbackId: string, data: any) => {
          const callback = this.callbacks.get(callbackId);
          if (callback) {
            callback(data);
            this.callbacks.delete(callbackId);
          }
        },
        onNativeEvent: (eventName: string, data: any) => {
          const listeners = this.eventListeners.get(eventName);
          if (listeners) {
            listeners.forEach((listener) => listener(data));
          }
        },
      };
    }
  }

  private sendToNative(action: string, payload: any = {}): Promise<any> {
    return new Promise((resolve) => {
      const callbackId = 'cb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      this.callbacks.set(callbackId, resolve);

      const message = JSON.stringify({
        action,
        callbackId,
        payload,
      });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message);
      } else {
        // Mock fallback khi chạy thử nghiệm trên trình duyệt PC / Sandbox
        console.warn(`[LoyaltyJSBridge] Đang chạy trên trình duyệt web, giả lập gọi action: ${action}`, payload);
        setTimeout(() => {
          if (action === 'requestPayment') {
            resolve({ success: true, transactionId: 'TXN_SIMULATED_' + Date.now() });
          } else if (action === 'requestScanQR') {
            resolve({ success: true, qrData: 'QR:NATCASH:USR001:1724400000:hash' });
          } else if (action === 'getUserToken') {
            resolve({ success: true, token: 'mock_jwt_token' });
          } else {
            resolve({ success: true });
          }
          this.callbacks.delete(callbackId);
        }, 500);
      }
    });
  }

  /**
   * Gọi yêu cầu mở modal xác thực mã PIN ví trên Native App để thanh toán mua lượt/vật phẩm in-game
   */
  public async requestPayment(payload: PaymentPayload): Promise<PaymentResponse> {
    return this.sendToNative('requestPayment', payload);
  }

  /**
   * Gọi mở Camera Native để quét mã QR hóa đơn hoặc mã khuyến mại
   */
  public async requestScanQR(): Promise<ScanQRResponse> {
    return this.sendToNative('requestScanQR');
  }

  /**
   * Đóng cửa sổ Webview và quay lại màn hình chính của ứng dụng
   */
  public closeWebview(): void {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'closeWebview' }));
    } else {
      window.history.back();
    }
  }

  /**
   * Chia sẻ thông điệp lên mạng xã hội qua Native Share Sheet
   */
  public shareSocial(payload: SharePayload): void {
    this.sendToNative('shareSocial', payload);
  }

  /**
   * Lấy token phiên JWT người dùng hiện tại từ Native App
   */
  public async getUserToken(): Promise<string | null> {
    const res = await this.sendToNative('getUserToken');
    return res && res.token ? res.token : null;
  }

  /**
   * Đăng ký lắng nghe sự kiện phát ra từ Native App (ví dụ: onAppResume, onPaymentSuccess)
   */
  public addEventListener(eventName: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);

    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }
}

export const LoyaltyJSBridge = new LoyaltyJSBridgeManager();
