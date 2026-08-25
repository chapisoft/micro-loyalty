/**
 * Động cơ Tổng hợp Âm thanh (Web Audio API) & Phản hồi Rung Xúc giác (Vibration API)
 * Tổng hợp 100% âm thanh thời gian thực từ phần cứng âm thanh trình duyệt, không cần tải tệp mp3/wav ngoại vi!
 */

class SoundHapticsEngine {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Khôi phục trạng thái bật/tắt âm thanh từ localStorage
    try {
      const savedMute = localStorage.getItem('MICRO_LOYALTY_SOUND_MUTED');
      this.muted = savedMute === 'true';
    } catch {
      this.muted = false;
    }
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('MICRO_LOYALTY_SOUND_MUTED', String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Kích hoạt rung xúc giác trên thiết bị di động
   */
  public triggerHaptic(pattern: number | number[] = 50): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * 1. Tiếng nhấp chuột / Chạm nút (Click)
   */
  public playClick(): void {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch {}
  }

  /**
   * 2. Tiếng phi dao cắm vào thớt gỗ (Knife Hit)
   */
  public playKnifeHit(): void {
    if (this.muted) return;
    this.triggerHaptic(40);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      // Âm va chạm kim loại + gỗ
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {}
  }

  /**
   * 3. Tiếng dao đập trúng dao gãy (Knife Break / Fail)
   */
  public playKnifeBreak(): void {
    this.triggerHaptic([100, 50, 100]);
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch {}
  }

  /**
   * 4. Tiếng chém hoa quả vút gió (Fruit Slice Swoosh)
   */
  public playFruitSlice(): void {
    if (this.muted) return;
    this.triggerHaptic(30);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.12);
    } catch {}
  }

  /**
   * 5. Tiếng nổ bom (Bomb Explosion)
   */
  public playBombExplosion(): void {
    this.triggerHaptic([150, 50, 150, 50, 200]);
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch {}
  }

  /**
   * 6. Tiếng nổ bóng Kanaval (Bubble Pop)
   */
  public playBubblePop(): void {
    if (this.muted) return;
    this.triggerHaptic(25);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {}
  }

  /**
   * 7. Tiếng vỗ cánh bay / Nhảy (Flap / Jump)
   */
  public playFlap(): void {
    if (this.muted) return;
    this.triggerHaptic(20);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {}
  }

  /**
   * 8. Tiếng lật thẻ bài (Card Flip)
   */
  public playCardFlip(): void {
    if (this.muted) return;
    this.triggerHaptic(30);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, this.audioCtx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.06);
    } catch {}
  }

  /**
   * 9. Tiếng ghép đúng cặp thẻ / Xếp gạch ăn điểm (Match Success)
   */
  public playMatchSuccess(): void {
    if (this.muted) return;
    this.triggerHaptic([40, 30, 60]);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.3, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.12);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.12);
      });
    } catch {}
  }

  /**
   * 10. Tiếng nhặt tiền xu / Điểm thưởng (Coin Pickup)
   */
  public playCoinPickup(): void {
    if (this.muted) return;
    this.triggerHaptic(30);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  /**
   * 11. Nhạc thắng Fanfare rực rỡ (Victory Fanfare)
   */
  public playVictoryFanfare(): void {
    this.triggerHaptic([80, 50, 80, 50, 150]);
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      // Hợp âm C-E-G-C (Đô - Mi - Sol - Đố)
      const notes = [
        { f: 523.25, t: 0.0, d: 0.12 },
        { f: 659.25, t: 0.12, d: 0.12 },
        { f: 783.99, t: 0.24, d: 0.12 },
        { f: 1046.5, t: 0.36, d: 0.4 },
      ];

      notes.forEach((n) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.4, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } catch {}
  }

  /**
   * 12. Âm thanh thất bại (Game Over Buzzer)
   */
  public playGameOver(): void {
    this.triggerHaptic([120, 60, 150]);
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const notes = [
        { f: 400, t: 0.0, d: 0.15 },
        { f: 350, t: 0.15, d: 0.15 },
        { f: 300, t: 0.3, d: 0.15 },
        { f: 220, t: 0.45, d: 0.35 },
      ];

      notes.forEach((n) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.35, now + n.t);
        gain.gain.linearRampToValueAtTime(0.01, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } catch {}
  }

  /**
   * 13. Tiếng tạch tạch quay vòng quay (Wheel Tick)
   */
  public playWheelTick(): void {
    if (this.muted) return;
    this.triggerHaptic(15);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.03);
    } catch {}
  }

  /**
   * 14. Tiếng tháo ốc vít (Screw Turn)
   */
  public playScrewTurn(): void {
    if (this.muted) return;
    this.triggerHaptic(35);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch {}
  }

  /**
   * 15. Tiếng rút chốt pin (Pin Pull)
   */
  public playPinPull(): void {
    if (this.muted) return;
    this.triggerHaptic(40);
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch {}
  }
}

export const soundHaptics = new SoundHapticsEngine();
