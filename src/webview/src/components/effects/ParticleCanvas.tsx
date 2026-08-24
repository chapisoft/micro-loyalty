import React, { useEffect, useRef } from 'react';

export interface ParticleCanvasProps {
  trigger?: number; // Increment to trigger a new burst
  type?: 'confetti' | 'coins' | 'fire' | 'stars';
  intensity?: number;
  durationMs?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'star' | 'coin';
}

const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FBBF24', '#06B6D4'];

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  trigger = 0,
  type = 'confetti',
  intensity = 60,
  durationMs = 3000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (trigger <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Sinh hạt mới theo loại hiệu ứng
    const newParticles: Particle[] = [];
    const count = type === 'coins' ? intensity * 0.7 : intensity;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 4 + Math.random() * 10;
      
      let startX = width / 2;
      let startY = height * 0.45;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed - (type === 'coins' ? 6 : 4);

      if (type === 'coins') {
        newParticles.push({
          x: startX + (Math.random() - 0.5) * 120,
          y: startY + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 8,
          vy: -8 - Math.random() * 6,
          size: 14 + Math.random() * 8,
          color: '#F59E0B',
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
          opacity: 1,
          shape: 'coin',
        });
      } else {
        newParticles.push({
          x: startX,
          y: startY,
          vx,
          vy,
          size: 6 + Math.random() * 8,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.3,
          opacity: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle',
        });
      }
    }

    particlesRef.current = newParticles;
    startTimeRef.current = performance.now();

    const render = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = elapsed / durationMs;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      if (progress >= 1) {
        particlesRef.current = [];
        return;
      }

      const gravity = type === 'coins' ? 0.35 : 0.22;
      const particles = particlesRef.current;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.vx *= 0.985;
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - progress * 1.15);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        if (p.shape === 'coin') {
          // Vẽ đồng xu vàng lấp lánh có viền 3D
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.8, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#78350F';
          ctx.font = `bold ${Math.round(p.size * 0.5)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', 0, 0);
        } else if (p.shape === 'rect') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [trigger, type, intensity, durationMs]);

  if (trigger <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
