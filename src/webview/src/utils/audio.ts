/**
 * Bộ máy Quản lý Âm thanh Chuyên nghiệp Hybrid (GameSoundManager)
 * Hỗ trợ nạp và phát trực tiếp 20 file âm thanh WAV chuẩn (/sounds/*.wav)
 * Kết hợp Web Audio Buffer Cache (0ms trễ, phát đa âm đa luồng) + HTML5 Audio Fallback + Web Audio Synthesis Fallback.
 */

const SOUND_FILES: Record<string, string> = {
  tap: '/sounds/tap.wav',
  spin_tick: '/sounds/spin_tick.wav',
  scratch: '/sounds/scratch.wav',
  kick: '/sounds/kick.wav',
  goal_cheer: '/sounds/goal_cheer.wav',
  chest_open: '/sounds/chest_open.wav',
  tower_climb: '/sounds/tower_climb.wav',
  tower_crash: '/sounds/tower_crash.wav',
  plinko_bounce: '/sounds/plinko_bounce.wav',
  egg_crack: '/sounds/egg_crack.wav',
  dice_roll: '/sounds/dice_roll.wav',
  win_fanfare: '/sounds/win_fanfare.wav',
  jackpot: '/sounds/jackpot.wav',
  lose: '/sounds/lose.wav',
  heartbeat: '/sounds/heartbeat.wav',
  coin_rain: '/sounds/coin_rain.wav',
  correct: '/sounds/correct.wav',
  wrong: '/sounds/wrong.wav',
  countdown_tick: '/sounds/countdown_tick.wav',
  fifty_fifty: '/sounds/fifty_fifty.wav',
};

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Khôi phục trạng thái tắt âm thanh từ LocalStorage (mặc định luôn bật)
    try {
      const saved = localStorage.getItem('loyalty_game_sound_muted');
      if (saved !== null) {
        this.isMuted = JSON.parse(saved) === true;
      } else {
        this.isMuted = false;
      }
    } catch {
      this.isMuted = false;
    }

    // Tự động mở khóa và nạp trước âm thanh khi người dùng chạm hoặc click lần đầu tiên
    if (typeof window !== 'undefined') {
      const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'click', 'keydown'];
      const unlockHandler = () => {
        this.unlockAudio();
        this.preloadSoundBuffers();
        unlockEvents.forEach((evt) => window.removeEventListener(evt, unlockHandler));
      };
      unlockEvents.forEach((evt) => window.addEventListener(evt, unlockHandler, { passive: true }));
    }
  }

  /**
   * Mở khóa AudioContext và phần cứng âm thanh trên iOS Safari / Android WebView
   */
  public unlockAudio() {
    try {
      const ctx = this.getOrCreateContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (!this.isUnlocked) {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      }
    } catch {}
  }

  private getOrCreateContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    return this.ctx;
  }

  /**
   * Tải trước toàn bộ các file âm thanh vào bộ nhớ đệm RAM để phát tức thì 0ms trễ
   */
  public async preloadSoundBuffers() {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    for (const [name, url] of Object.entries(SOUND_FILES)) {
      if (this.audioBuffers.has(name)) continue;
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(name, decoded);
        }
      } catch {
        // Dự phòng: tạo sẵn HTMLAudioElement
        try {
          const audio = new Audio(url);
          audio.preload = 'auto';
          this.audioElements.set(name, audio);
        } catch {}
      }
    }
  }

  /**
   * Phát file âm thanh đã lưu sẵn (/sounds/*.wav) với cơ chế fallback tự động
   */
  public playFile(name: string, fallbackSynth?: () => void) {
    if (this.isMuted) return;

    const ctx = this.getOrCreateContext();

    // 1. Ưu tiên phát qua Web Audio Buffer (tốc độ cao nhất, không trễ, phát đè mượt mà)
    if (ctx && this.masterGain && this.audioBuffers.has(name)) {
      try {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const source = ctx.createBufferSource();
        source.buffer = this.audioBuffers.get(name)!;
        source.connect(this.masterGain);
        source.start(0);
        return;
      } catch {}
    }

    // 2. Dự phòng 1: Phát qua thẻ HTML5 Audio
    const url = SOUND_FILES[name];
    if (url && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(url);
        audio.volume = this.isMuted ? 0 : 0.9;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Nếu bị chặn autoplay hoặc tải file lỗi, chuyển sang Web Audio Synthesis
            if (fallbackSynth) fallbackSynth();
          });
        }
        return;
      } catch {}
    }

    // 3. Dự phòng 2: Bộ máy tổng hợp nốt Web Audio Synthesis
    if (fallbackSynth) {
      fallbackSynth();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('loyalty_game_sound_muted', JSON.stringify(this.isMuted));
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ─────────────────────────────────────────────────────────────
  // CÁC HÀM PHÁT ÂM THANH NGHIỆP VỤ CHO TẤT CẢ 9 TRÒ CHƠI
  // ─────────────────────────────────────────────────────────────

  /**
   * 1. Tiếng Click / Chạm nút điều khiển
   */
  public playTap() {
    this.playFile('tap', () => {
      const ctx = this.getOrCreateContext();
      if (!ctx || !this.masterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    });
  }

  /**
   * 2. Tiếng Vòng quay / Bánh răng lách cách
   */
  public playSpinTick() {
    this.playFile('spin_tick', () => {
      const ctx = this.getOrCreateContext();
      if (!ctx || !this.masterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    });
  }

  /**
   * 3. Tiếng Cào Vé May Mắn
   */
  public playScratch() {
    this.playFile('scratch');
  }

  /**
   * 4. Tiếng Sút Bóng Phạt Đền 11m
   */
  public playKick() {
    this.playFile('kick');
  }

  /**
   * 5. Tiếng Cổ Vũ Khán Đài & Bàn Thắng
   */
  public playCrowdCheer() {
    this.playFile('goal_cheer');
  }

  /**
   * 6. Tiếng Mở Rương Kho Báu Caribe
   */
  public playChestOpen() {
    this.playFile('chest_open');
  }

  /**
   * 7. Tiếng Leo Tầng Tháp Ma Thuật
   */
  public playClimbStep(_floor: number = 1) {
    this.playFile('tower_climb');
  }

  /**
   * 8. Tiếng Sập Tháp / Thua Cuộc Ma Thuật
   */
  public playTowerCrash() {
    this.playFile('tower_crash');
  }

  /**
   * 9. Tiếng Thả Bi Plinko Va Chốt Đinh
   */
  public playPlinkoBounce() {
    this.playFile('plinko_bounce');
  }

  /**
   * 10. Tiếng Đinh Đoong Thang Âm Plinko
   */
  public playChromaticDing(_step: number = 0) {
    this.playFile('plinko_bounce');
  }

  /**
   * 11. Tiếng Búa Thần Nện Trứng Vàng Uy Lực
   */
  public playHammerSmash() {
    this.playFile('egg_crack');
    this.triggerHaptic('heavy');
  }

  /**
   * 12. Tiếng Vỡ Vỏ Trứng Vàng
   */
  public playEggCrack() {
    this.playFile('egg_crack');
  }

  /**
   * 13. Tiếng Cốc Lắc 3 Viên Xúc Xắc VIP
   */
  public playDiceShake() {
    this.playFile('dice_roll');
  }

  /**
   * 14. Khúc Nhạc Chiến Thắng Khải Hoàn (Victory Fanfare)
   */
  public playWinFanfare() {
    this.playFile('win_fanfare');
  }

  /**
   * 15. Khúc Nhạc Nổ Hũ Siêu Khủng (Jackpot Fanfare)
   */
  public playJackpot() {
    this.playFile('jackpot');
  }

  /**
   * 16. Tiếng An Ủi / Thua Cuộc (Lose Slide)
   */
  public playLose() {
    this.playFile('lose');
  }

  /**
   * 17. Tiếng Tim Đập Dồn Dập Hồi Hộp (Tension Heartbeat)
   */
  public playHeartbeat() {
    this.playFile('heartbeat');
    this.triggerHaptic('medium');
  }

  /**
   * 18. Tiếng Mưa Tiền Vàng Rơi Dồn Dập (Coin Rain Cascade)
   */
  public playCoinRain() {
    this.playFile('coin_rain');
  }

  /**
   * 19. Tiếng Trả Lời Đố Vui Đúng (Correct Chime)
   */
  public playCorrect() {
    this.playFile('correct');
  }

  /**
   * 20. Tiếng Trả Lời Đố Vui Sai (Wrong Buzzer)
   */
  public playWrong() {
    this.playFile('wrong');
  }

  /**
   * 21. Tiếng Đồng Hồ Đếm Ngược Tích Tắc
   */
  public playCountdownTick() {
    this.playFile('countdown_tick');
  }

  /**
   * 22. Tiếng Quyền Trợ Giúp 50:50 Electric Zap
   */
  public playFiftyFifty() {
    this.playFile('fifty_fifty');
  }

  /**
   * 23. Bộ Rung Phản Hồi Xúc Giác Haptic Feedback Chuẩn Mobile
   */
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([20, 50, 40]);
          break;
        case 'warning':
          navigator.vibrate([30, 40, 30, 40]);
          break;
        case 'error':
          navigator.vibrate([60, 40, 80]);
          break;
      }
    } catch {}
  }
}

export const soundManager = new GameAudioEngine();
