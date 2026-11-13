import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Ticket, RefreshCw, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { GameHeader } from '../../components/common/GameHeader';
import { SkeletonCard, EmptyState } from '../../components/common/StateBlocks';
import {
  LoyaltyApi,
  ScratchCardPlayResponse,
  getDefaultUserId,
} from '../../services/api';
import { soundHaptics } from '../../utils/soundHaptics';

export interface LuckyScratchCardGameProps {
  onBack: () => void;
  externalUserId?: string;
  availableTurns?: number | null;
  onClaimReward?: (pointsAwarded: number, newBalance?: number) => void;
}

export const LuckyScratchCardGame: React.FC<LuckyScratchCardGameProps> = ({
  onBack,
  externalUserId,
  availableTurns,
  onClaimReward,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [soundEnabled, setSoundEnabled] = useState(!soundHaptics.isMuted());
  const [loadingCard, setLoadingCard] = useState(false);
  const [cardResult, setCardResult] = useState<ScratchCardPlayResponse | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const handleToggleSound = () => {
    const muted = soundHaptics.toggleMute();
    setSoundEnabled(!muted);
    soundHaptics.playClick();
  };

  const paintFoilLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.globalCompositeOperation = 'source-over';

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#cbd5e1');
    grad.addColorStop(0.35, '#f1f5f9');
    grad.addColorStop(0.65, '#94a3b8');
    grad.addColorStop(1, '#64748b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle diagonal shimmer stripes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 6;
    for (let i = -h; i < w + h; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }

    // Center prompt
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t('scratch.scratch_here'), w / 2, h / 2);
  }, [t]);

  useEffect(() => {
    if (cardResult && !revealed) {
      paintFoilLayer();
      setScratchPercent(0);
    }
  }, [cardResult, revealed, paintFoilLayer]);

  const finishReveal = useCallback(
    (result: ScratchCardPlayResponse) => {
      if (revealed) return;
      setRevealed(true);
      setScratchPercent(100);
      soundHaptics.triggerHaptic(result.pointsAwarded > 0 ? 40 : 15);
      if (result.pointsAwarded > 0) {
        soundHaptics.playVictoryFanfare();
      } else {
        soundHaptics.playClick();
      }
      onClaimReward?.(result.pointsAwarded, result.newPointBalance);
    },
    [onClaimReward, revealed]
  );

  const measureScratchedRatio = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let sampled = 0;
    for (let i = 3; i < data.length; i += 32) {
      sampled++;
      if (data[i] < 64) transparent++;
    }
    return sampled > 0 ? Math.round((transparent / sampled) * 100) : 0;
  }, []);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed || !cardResult) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 34;

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPointRef.current = { x, y };

    const pct = measureScratchedRatio();
    setScratchPercent(pct);
    if (pct >= 55) {
      finishReveal(cardResult);
    }
  };

  const handleStartNewCard = async () => {
    soundHaptics.playClick();
    setLoadingCard(true);
    setErrorMsg(null);
    setRevealed(false);
    setScratchPercent(0);
    setCardResult(null);
    try {
      const res = await LoyaltyApi.playScratchCard(userId);
      setCardResult(res);
      soundHaptics.playCardFlip();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('scratch.load_error'));
    } finally {
      setLoadingCard(false);
    }
  };

  const matrixCells =
    cardResult?.scratchMatrix && cardResult.scratchMatrix.length > 0
      ? cardResult.scratchMatrix.slice(0, 9)
      : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GameHeader
        title={t('scratch.title')}
        subtitle={
          availableTurns !== null && availableTurns !== undefined
            ? t('scratch.turns_remaining', { count: availableTurns })
            : t('scratch.subtitle')
        }
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* Card Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wide">
                <Sparkles className="w-3 h-3" /> {t('scratch.badge')}
              </span>
              <h2 className="text-lg font-bold mt-2">{t('scratch.hero_title')}</h2>
              <p className="text-xs text-amber-50 mt-0.5">{t('scratch.hero_desc')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Loading state */}
        {loadingCard && <SkeletonCard rows={4} />}

        {/* Initial empty / draw prompt */}
        {!loadingCard && !cardResult && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <EmptyState
              icon={<Ticket className="w-6 h-6 text-amber-500" />}
              title={t('scratch.ready_title')}
              description={t('scratch.ready_desc')}
              actionLabel={t('scratch.draw_button')}
              onAction={handleStartNewCard}
            />
          </div>
        )}

        {/* Active Scratch Area */}
        {!loadingCard && cardResult && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">#{cardResult.transactionRef}</span>
              <span>{t('scratch.scratched_pct', { pct: scratchPercent })}</span>
            </div>

            {/* Underlying Grid + Canvas Foil */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 select-none">
              <div className="grid grid-cols-3 gap-2.5 p-4 min-h-[240px]">
                {matrixCells.length > 0 ? (
                  matrixCells.map((symbol, idx) => {
                    const isWinCell =
                      Boolean(cardResult.winningSymbol) && symbol === cardResult.winningSymbol;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl flex flex-col items-center justify-center py-4 px-2 border transition ${
                          revealed && isWinCell
                            ? 'bg-amber-100 border-amber-400 shadow-sm scale-[1.02]'
                            : 'bg-white border-amber-100'
                        }`}
                      >
                        <span className="text-2xl leading-none">{symbol}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 flex flex-col items-center justify-center py-10 text-center">
                    <span className="text-lg font-bold text-amber-800">{cardResult.prizeName}</span>
                    <span className="text-sm font-mono text-emerald-700 mt-1">
                      +{cardResult.pointsAwarded.toLocaleString()} {t('common.points_unit')}
                    </span>
                  </div>
                )}
              </div>

              {!revealed && (
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={240}
                  onPointerDown={(e) => {
                    isDrawingRef.current = true;
                    lastPointRef.current = null;
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    scratchAt(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (!isDrawingRef.current) return;
                    scratchAt(e.clientX, e.clientY);
                  }}
                  onPointerUp={() => {
                    isDrawingRef.current = false;
                    lastPointRef.current = null;
                  }}
                  onPointerCancel={() => {
                    isDrawingRef.current = false;
                    lastPointRef.current = null;
                  }}
                  className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                />
              )}
            </div>

            {!revealed ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">{t('scratch.drag_hint')}</p>
                <button
                  type="button"
                  onClick={() => finishReveal(cardResult)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('scratch.reveal_all')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div
                  className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
                    cardResult.pointsAwarded > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        cardResult.pointsAwarded > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{cardResult.prizeName}</p>
                      <p className="text-[11px] opacity-80">
                        {cardResult.message ||
                          (cardResult.pointsAwarded > 0
                            ? t('scratch.win_subtitle')
                            : t('scratch.lose_subtitle'))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-sm shrink-0">
                    {cardResult.pointsAwarded > 0
                      ? `+${cardResult.pointsAwarded.toLocaleString()}`
                      : '0'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartNewCard}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md inline-flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('scratch.play_again')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LuckyScratchCardGame;
