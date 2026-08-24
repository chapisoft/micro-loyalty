/**
 * GameHub TypeScript SDK - Version 1.0.0
 * Dành cho Nhà phát triển Trò chơi Bên Thứ Ba xây dựng Game bằng TypeScript / ES Module
 */

export interface GameHubInitConfig {
  apiBase?: string;
  tenantId?: string;
  gameCode?: string;
  sessionToken?: string;
  externalUserId?: string;
  locale?: string;
  debug?: boolean;
}

export interface SubmitScoreResponse {
  transactionRef: string;
  gameCode: string;
  gameName: string;
  score: number;
  rewardType: string;
  rewardValue: number;
  pointsAwarded: number;
  voucherCode?: string;
  newPointBalance: number;
  turnsRemaining: number;
  message: string;
  timestamp: string;
}

export interface BuyTurnsResponse {
  transactionCode: string;
  sessionToken: string;
  totalTurnsAvailable: number;
  amountDeducted: number;
  paymentMethod: string;
  remainingPointBalance: number;
  message: string;
  timestamp: string;
}

class GameHubSDKInstance {
  private config: GameHubInitConfig = {
    apiBase: '',
    tenantId: 'TENANT_NATCASH',
    gameCode: '',
    sessionToken: '',
    externalUserId: '',
    locale: 'vi',
    debug: false,
  };

  private listeners: Record<string, ((data: any) => void)[]> = {};

  public init(customConfig?: GameHubInitConfig) {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const autoSession = urlParams.get('sessionToken') || '';
    const autoTenant = urlParams.get('tenantId') || 'TENANT_NATCASH';
    const autoGame = urlParams.get('gameCode') || '';
    const autoUser = urlParams.get('externalUserId') || '';
    const autoLocale = urlParams.get('locale') || 'vi';

    const defaultApiBase = typeof window !== 'undefined' ? window.location.origin : '';

    this.config = {
      apiBase: customConfig?.apiBase || defaultApiBase,
      tenantId: customConfig?.tenantId || autoTenant,
      gameCode: customConfig?.gameCode || autoGame,
      sessionToken: customConfig?.sessionToken || autoSession,
      externalUserId: customConfig?.externalUserId || autoUser,
      locale: customConfig?.locale || autoLocale,
      debug: customConfig?.debug || false,
    };

    return {
      sessionToken: this.config.sessionToken,
      tenantId: this.config.tenantId,
      gameCode: this.config.gameCode,
      locale: this.config.locale,
    };
  }

  public getConfig(): GameHubInitConfig {
    return { ...this.config };
  }

  public async submitScore(score: number, details?: Record<string, any> | string): Promise<SubmitScoreResponse> {
    if (!this.config.gameCode) {
      throw new Error('GameCode không được để trống.');
    }

    const detailStr = typeof details === 'object' ? JSON.stringify(details) : details || '';
    const payload = {
      externalUserId: this.config.externalUserId || 'GUEST_USER',
      gameCode: this.config.gameCode,
      sessionToken: this.config.sessionToken,
      score: Number(score) || 0,
      details: detailStr,
    };

    const res = await fetch(`${this.config.apiBase}/gamehub/v1/games/submit-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.config.tenantId || 'TENANT_NATCASH',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi gửi kết quả chơi game (HTTP ${res.status})`);
    }

    const result: SubmitScoreResponse = await res.json();
    this.emit('scoreSubmitted', result);
    return result;
  }

  public async buyTurns(turns: number = 1, paymentAmount: number = 10, paymentMethod: 'POINTS' | 'WALLET' = 'POINTS'): Promise<BuyTurnsResponse> {
    if (typeof window !== 'undefined' && (window as any).LoyaltyJSBridge && paymentMethod === 'WALLET') {
      (window as any).LoyaltyJSBridge.requestPayment(paymentAmount, `Mua ${turns} lượt chơi game ${this.config.gameCode}`);
      return {
        transactionCode: 'REQ_BRIDGE',
        sessionToken: this.config.sessionToken || '',
        totalTurnsAvailable: turns,
        amountDeducted: paymentAmount,
        paymentMethod: 'WALLET',
        remainingPointBalance: 0,
        message: 'Đã gửi yêu cầu thanh toán tới ví ứng dụng',
        timestamp: new Date().toISOString(),
      };
    }

    const payload = {
      externalUserId: this.config.externalUserId || 'GUEST_USER',
      gameCode: this.config.gameCode,
      sessionToken: this.config.sessionToken,
      turnsToBuy: turns,
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
    };

    const res = await fetch(`${this.config.apiBase}/gamehub/v1/billing/in-game-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.config.tenantId || 'TENANT_NATCASH',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi mua lượt chơi (HTTP ${res.status})`);
    }

    const result: BuyTurnsResponse = await res.json();
    this.emit('paymentCompleted', result);
    return result;
  }

  public closeGame(): void {
    if (typeof window !== 'undefined' && (window as any).LoyaltyJSBridge) {
      (window as any).LoyaltyJSBridge.closeWebview();
    } else if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      window.history.back();
    }
  }

  public on(event: string, handler: (data: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  public off(event: string, handler: (data: any) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[GameHub SDK Event Error] ${event}`, e);
        }
      });
    }
  }
}

export const GameHub = new GameHubSDKInstance();
export default GameHub;
