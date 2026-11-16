import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import iconArrowLeft from '../assets/figma/icon-arrow-left.svg';
import iconEllipsis from '../assets/figma/icon-ellipsis.svg';
import iconX from '../assets/figma/icon-x.svg';

/** Shared building blocks of the Figma "App · Customer journeys" screens (Natcash · Webview frame). */

export const fmt = (n: number | undefined | null) => Math.round(Number(n) || 0).toLocaleString('en-US');

export const ddmm = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const ddmmyyyy = (iso?: string) => {
  const s = ddmm(iso);
  return s ? `${s}/${new Date(iso as string).getFullYear()}` : '';
};

/** Webview top bar: back · title · [… | ×]. `back` = parent route; omitted → browser history. */
export const WebviewHeader: React.FC<{ title: string; back?: string }> = ({ title, back }) => {
  const navigate = useNavigate();
  const goBack = () => (back ? navigate(back) : window.history.length > 1 ? navigate(-1) : LoyaltyJSBridge.closeWebview());
  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center gap-2 bg-white px-4 py-1">
      <button type="button" aria-label="Back" onClick={goBack} className="flex size-11 shrink-0 items-center justify-center">
        <img src={iconArrowLeft} alt="" className="size-[22px]" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 text-slate-900">{title}</h1>
      <div className="flex h-11 w-[88px] shrink-0 items-center rounded-[22px] border border-slate-200 bg-white">
        <button type="button" aria-label="More options" className="flex size-11 items-center justify-center">
          <img src={iconEllipsis} alt="" className="size-[18px]" />
        </button>
        <button type="button" aria-label="Close Loyalty" onClick={() => LoyaltyJSBridge.closeWebview()} className="flex size-11 items-center justify-center">
          <img src={iconX} alt="" className="size-[18px]" />
        </button>
      </div>
    </header>
  );
};

/** Full-height page in the Figma grey (#F7F8FA) with the Be Vietnam Pro type. */
export const Screen: React.FC<{ title: string; back?: string; children: React.ReactNode }> = ({ title, back, children }) => (
  <div className="min-h-screen bg-page font-nc text-slate-900">
    <WebviewHeader title={title} back={back} />
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-[18px] px-4 pb-8 pt-4">{children}</main>
  </div>
);

export const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({ title, action, onAction }) => (
  <div className="flex w-full items-center gap-2">
    <h2 className="min-w-0 flex-1 text-[18px] font-semibold leading-[26px] text-slate-900">{title}</h2>
    {action && (
      <button type="button" onClick={onAction} className="flex h-11 items-center justify-end whitespace-nowrap text-[12px] font-semibold leading-[17px] text-brand">
        {action}
      </button>
    )}
  </div>
);

/** White rounded card (radius 20, padding 16). */
export const Card: React.FC<{ className?: string; children: React.ReactNode; onClick?: () => void; tint?: string }> = ({
  className = '',
  children,
  onClick,
  tint,
}) => {
  const cls = `flex w-full flex-col gap-2.5 rounded-[20px] p-4 text-left ${tint ? '' : 'bg-white'} ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={cls} style={tint ? { background: tint } : undefined}>
      {children}
    </button>
  ) : (
    <div className={cls} style={tint ? { background: tint } : undefined}>
      {children}
    </div>
  );
};

type Tone = 'green' | 'orange' | 'red' | 'grey' | 'blue';
const TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  orange: 'bg-brand-soft text-[#B35400]',
  red: 'bg-[#FDE2E1] text-[#C0392B]',
  grey: 'bg-slate-100 text-slate-500',
  blue: 'bg-sky-50 text-sky-700',
};
export const Pill: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'grey', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4 ${TONE[tone]} ${className}`}>
    {children}
  </span>
);

export const PrimaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }> = ({
  children,
  onClick,
  disabled,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-[14px] font-semibold text-white disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

export const SecondaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className = '' }) => (
  <button type="button" onClick={onClick} className={`flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-[14px] font-semibold ${className}`}>
    {children}
  </button>
);

/** Bottom action bar pinned to the screen bottom (e.g. "Scan to pay", "Claim 150 coins"). */
export const BottomBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <div className="h-[70px]" />
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">{children}</div>
  </>
);

export const InfoRows: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <div className="w-full divide-y divide-slate-100 rounded-[20px] bg-white px-4">
    {rows.map(([k, v]) => (
      <div key={k} className="flex items-center justify-between gap-3 py-3 text-[13px]">
        <span className="text-slate-500">{k}</span>
        <span className="text-right font-semibold">{v}</span>
      </div>
    ))}
  </div>
);

/** Result layout shared by reward / game / payment outcomes: 3D illustration, title, big value, rows, actions. */
export const ResultBlock: React.FC<{
  art: string;
  title: string;
  value?: React.ReactNode;
  valueTone?: 'green' | 'orange' | 'slate';
  sub?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ art, title, value, valueTone = 'green', sub, children }) => (
  <div className="flex w-full flex-col items-center overflow-hidden rounded-[20px] bg-white pb-5 text-center">
    <div className="flex h-[150px] w-full items-center justify-center bg-brand-soft">
      <img src={art} alt="" className="size-[120px] object-contain mix-blend-multiply" />
    </div>
    <h2 className="mt-4 px-4 text-[20px] font-semibold leading-7">{title}</h2>
    {value !== undefined && (
      <p className={`mt-1 text-[32px] font-semibold leading-[44px] ${valueTone === 'green' ? 'text-emerald-700' : valueTone === 'orange' ? 'text-brand' : 'text-slate-900'}`}>{value}</p>
    )}
    {sub && <p className="mt-1 px-6 text-[13px] leading-5 text-slate-500">{sub}</p>}
    {children}
  </div>
);

/** Centered popup over a dimmed screen (check-in complete, reward claimed, lesson complete). */
export const Popup: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({ open, onClose, children }) =>
  open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="dialog">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/45" />
      <div className="relative flex w-full max-w-[340px] flex-col items-center gap-2 rounded-[24px] bg-white p-5 text-center font-nc">{children}</div>
    </div>
  ) : null;

/** Bottom sheet (FIFO batches, filters). */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) =>
  open ? (
    <div className="fixed inset-0 z-40 flex flex-col justify-end font-nc" role="dialog" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/45" />
      <div className="relative mx-auto flex max-h-[85vh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[24px] bg-white px-5 pb-6 pt-2.5">
        <span className="mx-auto h-1 w-10 rounded-sm bg-slate-300" />
        <h2 className="mt-2 text-[19px] font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  ) : null;

export const Empty: React.FC<{ art?: string; title: string; text?: string; children?: React.ReactNode }> = ({ art, title, text, children }) => (
  <div className="flex w-full flex-col items-center gap-1 rounded-[20px] bg-white p-5 text-center">
    {art && <img src={art} alt="" className="mb-1 size-20 object-contain mix-blend-multiply" />}
    <p className="text-[15px] font-semibold">{title}</p>
    {text && <p className="text-[12px] leading-[17px] text-slate-500">{text}</p>}
    {children}
  </div>
);

/**
 * Horizontal slider row: touch-swipe on phones, click-and-drag with a mouse on desktop
 * (desktop browsers don't scroll horizontally on drag by themselves).
 */
export const SlideRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ x: number; left: number; moved: boolean } | null>(null);
  return (
    <div
      ref={ref}
      className={`no-scrollbar -mx-4 flex cursor-grab touch-pan-x select-none gap-2 overflow-x-auto scroll-smooth px-4 pb-1 active:cursor-grabbing ${className}`}
      onMouseDown={(e) => (drag.current = { x: e.clientX, left: ref.current?.scrollLeft || 0, moved: false })}
      onMouseMove={(e) => {
        if (!drag.current || !ref.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 4) drag.current.moved = true;
        ref.current.style.scrollBehavior = 'auto';
        ref.current.scrollLeft = drag.current.left - dx;
      }}
      onMouseUp={() => setTimeout(() => (drag.current = null), 0)}
      onMouseLeave={() => (drag.current = null)}
      onClickCapture={(e) => {
        if (drag.current?.moved) {
          e.stopPropagation(); // a drag is not a tap on the chip underneath
          e.preventDefault();
        }
      }}
    >
      {children}
    </div>
  );
};

/** Generic async loader: returns [data, error, reload]. */
export function useLoad<T>(fn: () => Promise<T>, deps: React.DependencyList = []): [T | undefined, boolean, () => void] {
  const [data, setData] = React.useState<T>();
  const [failed, setFailed] = React.useState(false);
  const run = React.useCallback(() => {
    setFailed(false);
    fn().then(setData).catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  React.useEffect(run, [run]);
  return [data, failed, run];
}

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-[20px] bg-slate-200/70 ${className}`} />
);

export const ErrorBlock: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="rounded-[20px] bg-white p-4 text-center">
    <p className="text-[14px] font-semibold">Couldn’t load this page</p>
    <p className="mt-1 text-[12px] text-slate-500">Check your connection and try again.</p>
    <button type="button" onClick={onRetry} className="mt-3 h-11 rounded-[14px] bg-brand px-5 text-[14px] font-semibold text-white">
      Try again
    </button>
  </div>
);
