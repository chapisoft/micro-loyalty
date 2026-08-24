/**
 * Bộ máy Tổng hợp Âm thanh Chuyên nghiệp Web Audio API (GameSoundManager)
 * 100% Thuần Web Audio Synthesis - Không phụ thuộc tệp mp3 ngoài, 0ms trễ, hoạt động mượt mà trên mọi thiết bị di động.
 */

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Khôi phục trạng thái tắt âm thanh từ LocalStorage
    try {
      const saved = localStorage.getItem('loyalty_game_sound_muted');
      if (saved !== null) {
        this.isMuted = JSON.parse(saved);
      }
    } catch {
      this.isMuted = false;
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('loyalty_game_sound_muted', JSON.stringify(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 1. Tiếng Click / Chạm nút điều khiển
   */
  public playTap() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  /**
   * 2. Tiếng Vòng quay / Bánh răng lách cách
   */
  public playSpinTick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  /**
   * 3. Tiếng Cào Vé May Mắn (Tiếng xoạt xoạt sần sật chân thực)
   */
  public playScratch() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch {}
  }

  /**
   * 4. Tiếng Sút Bóng Phạt Đền 11m (Tiếng 'Bụp' trầm ấm, lực bóng mạnh)
   */
  public playKick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  /**
   * 5. Tiếng Mở Rương Kho Báu (Tiếng mở khóa két + chùm chuông vàng ngọc leng keng)
   */
  public playChestOpen() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Tiếng chốt mở
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(350, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.08);

      // Chùm nốt chuông lấp lánh (Arpeggio: E5 -> G#5 -> B5 -> E6)
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.06 + idx * 0.07);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.06 + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06 + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + 0.06 + idx * 0.07);
        osc.stop(ctx.currentTime + 0.06 + idx * 0.07 + 0.25);
      });
    } catch {}
  }

  /**
   * 6. Tiếng Leo Tầng Tháp Ma Thuật
   */
  public playClimbStep(floor: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const baseFreq = 400 + floor * 120;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  /**
   * 7. Tiếng Thả Bi Plinko Va Chốt Đinh (Metallic Crystal Ping)
   */
  public playPlinkoBounce() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const freq = 1200 + Math.random() * 600;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  /**
   * 8. Tiếng Gõ Vỡ Trứng Vàng (Tiếng đập giòn tan 'Crackle')
   */
  public playEggCrack() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Tiếng đập búa
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);

      // Tiếng vỏ vỡ leng keng
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(1600, ctx.currentTime + 0.05);
      bellGain.gain.setValueAtTime(0.25, ctx.currentTime + 0.05);
      bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      bell.connect(bellGain);
      bellGain.connect(ctx.destination);
      bell.start(ctx.currentTime + 0.05);
      bell.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  /**
   * 9. Tiếng Cốc Lắc 3 Viên Xúc Xắc (Rhythmic Shaker)
   */
  public playDiceShake() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700 + Math.random() * 300, time);
        osc.frequency.exponentialRampToValueAtTime(250, time + 0.04);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.04);
      }
    } catch {}
  }

  /**
   * 10. Khúc Nhạc Chiến Thắng Khải Hoàn (Joyful Victory Fanfare)
   */
  public playWinFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Arpeggio Đô Trưởng rực rỡ: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const melody = [
        { freq: 523.25, duration: 0.12, delay: 0.0 },
        { freq: 659.25, duration: 0.12, delay: 0.12 },
        { freq: 783.99, duration: 0.12, delay: 0.24 },
        { freq: 1046.50, duration: 0.40, delay: 0.36 }
      ];

      melody.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.delay);

        gain.gain.setValueAtTime(0.35, ctx.currentTime + n.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.delay + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.delay);
        osc.stop(ctx.currentTime + n.delay + n.duration);
      });
    } catch {}
  }

  /**
   * 11. Khúc Nhạc Nổ Hũ Siêu Khủng (Epic Jackpot Fanfare)
   */
  public playJackpot() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const melody = [
        { freq: 523.25, duration: 0.10, delay: 0.00 },
        { freq: 659.25, duration: 0.10, delay: 0.10 },
        { freq: 783.99, duration: 0.10, delay: 0.20 },
        { freq: 1046.50, duration: 0.15, delay: 0.30 },
        { freq: 880.00, duration: 0.15, delay: 0.45 },
        { freq: 1046.50, duration: 0.15, delay: 0.60 },
        { freq: 1318.51, duration: 0.50, delay: 0.75 }
      ];

      melody.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.delay);

        gain.gain.setValueAtTime(0.4, ctx.currentTime + n.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.delay + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.delay);
        osc.stop(ctx.currentTime + n.delay + n.duration);
      });
    } catch {}
  }

  /**
   * 12. Tiếng An Ủi / Trượt mục tiêu (Gentle Slide)
   */
  public playLose() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}

export const soundManager = new GameAudioEngine();
