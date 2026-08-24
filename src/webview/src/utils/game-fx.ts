/**
 * High-Performance Procedural Particle & Motion FX Engine
 * Optimized for 60 FPS Mobile Canvas Game rendering with Zero Memory Allocations
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'CONFETTI' | 'SPARKLE' | 'JUICE_SPLASH' | 'SPLINTER' | 'CRYSTAL_SHARD' | 'SMOKE_PUFF' | 'FLOAT_TEXT';
  rotation: number;
  vRotation: number;
  gravity: number;
  text?: string;
}

export class GameFXSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 200;
  public shakeTrauma: number = 0; // 0 to 1

  public update(dt: number = 1): void {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.rotation += p.vRotation * dt;

      // Friction
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Dynamic alpha fade
      const progress = p.life / p.maxLife;
      p.alpha = Math.max(0, 1 - progress);
    }

    // 2. Decay shake trauma smoothly
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - 0.05 * dt);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'FLOAT_TEXT' && p.text) {
        // Floating juicy score popup
        const scale = 1 + Math.sin((p.life / p.maxLife) * Math.PI) * 0.4;
        ctx.scale(scale, scale);
        ctx.font = '900 13px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, 0, 0);
      } else if (p.type === 'CONFETTI') {
        // Fluttering 3D confetti
        ctx.fillStyle = p.color;
        const width = p.size;
        const height = p.size * 0.5 * Math.cos(p.life * 0.2);
        ctx.fillRect(-width / 2, -height / 2, width, height);
      } else if (p.type === 'SPARKLE') {
        // 4-Point Radiant Diamond Star
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const s = p.size * (1 - p.life / p.maxLife);
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fill();
      } else if (p.type === 'JUICE_SPLASH') {
        // Vibrant Fruit Droplet with highlight
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 - (p.life / p.maxLife) * 0.4), 0, Math.PI * 2);
        ctx.fill();
        // Inner glint
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'SPLINTER') {
        // Wood Shard
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size, -p.size * 0.3);
        ctx.lineTo(p.size * 0.5, p.size * 0.3);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'CRYSTAL_SHARD') {
        // Gemstone Faceted Shard
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.8, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'SMOKE_PUFF') {
        // Expanding Smoke Puff
        ctx.fillStyle = p.color;
        const currentSize = p.size * (1 + (p.life / p.maxLife) * 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  public getShakeOffset(): { x: number; y: number } {
    if (this.shakeTrauma <= 0) return { x: 0, y: 0 };
    const intensity = this.shakeTrauma * this.shakeTrauma; // non-linear
    const angle = Math.random() * Math.PI * 2;
    const maxOffset = 12 * intensity;
    return {
      x: Math.cos(angle) * maxOffset,
      y: Math.sin(angle) * maxOffset,
    };
  }

  public addScreenShake(amount: number = 0.5): void {
    this.shakeTrauma = Math.min(1, this.shakeTrauma + amount);
  }

  public spawnFloatText(x: number, y: number, text: string, color: string = '#F59E0B'): void {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.8,
      size: 14,
      color,
      alpha: 1,
      life: 0,
      maxLife: 35,
      type: 'FLOAT_TEXT',
      rotation: (Math.random() - 0.5) * 0.2,
      vRotation: 0,
      gravity: -0.02,
      text,
    });
  }

  public spawnSparkles(x: number, y: number, count: number = 10, color: string = '#FEF08A'): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        type: 'SPARKLE',
        rotation: Math.random() * Math.PI,
        vRotation: (Math.random() - 0.5) * 0.3,
        gravity: 0.1,
      });
    }
  }

  public spawnJuiceSplash(x: number, y: number, count: number = 15, color: string = '#EA580C'): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.random() * 15,
        type: 'JUICE_SPLASH',
        rotation: 0,
        vRotation: 0,
        gravity: 0.25,
      });
    }
  }

  public spawnWoodSplinters(x: number, y: number, count: number = 12): void {
    const colors = ['#78350F', '#92400E', '#B45309', '#D97706'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        type: 'SPLINTER',
        rotation: Math.random() * Math.PI,
        vRotation: (Math.random() - 0.5) * 0.4,
        gravity: 0.3,
      });
    }
  }

  public spawnCrystalShards(x: number, y: number, count: number = 14, color: string = '#38BDF8'): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.random() * 15,
        type: 'CRYSTAL_SHARD',
        rotation: Math.random() * Math.PI,
        vRotation: (Math.random() - 0.5) * 0.4,
        gravity: 0.2,
      });
    }
  }

  public spawnSmokePuff(x: number, y: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.8 - Math.random() * 0.8,
        size: 4 + Math.random() * 4,
        color: 'rgba(241, 245, 249, 0.4)',
        alpha: 0.6,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        type: 'SMOKE_PUFF',
        rotation: 0,
        vRotation: 0,
        gravity: -0.01,
      });
    }
  }

  public spawnConfettiExplosion(x: number, y: number, count: number = 40): void {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FDE047'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 45 + Math.random() * 25,
        type: 'CONFETTI',
        rotation: Math.random() * Math.PI,
        vRotation: (Math.random() - 0.5) * 0.3,
        gravity: 0.18,
      });
    }
  }

  public clear(): void {
    this.particles = [];
    this.shakeTrauma = 0;
  }
}
