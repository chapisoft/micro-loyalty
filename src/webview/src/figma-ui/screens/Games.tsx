import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Volume2, PlusCircle, Trophy, ShieldCheck, Volume1, Mic, Check } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import {
  LoyaltyApi, getDefaultUserId, type LearningCourseItem, type LearningQuestionItem, type LearningQuizSubmitResponse, type WheelPrizeItem, type LeaderboardRulesResponse,
} from '../../services/api';
import { GameArt } from '../GameArt';
import { IN_HOUSE, CAT, loadGames, catLabel, type GameEntry } from '../games';
import {
  Screen, Hero, SectionHeader, Skeleton, ErrorBlock, Pill, PrimaryButton, SecondaryButton, ResultBlock, InfoRows, Empty, Popup, Sheet, SlideRow, useLoad, fmt,
} from '../ui';
import { artCup, artEmptyBox, artGamepad, artHourglass, aiGames } from '../art';

const uid = () => getDefaultUserId();

const gameName = (code?: string) => IN_HOUSE[(code || '').toUpperCase()]?.name || code || 'Game';

const loadPlays = async () => {
  const p = await LoyaltyApi.getProfile(uid());
  return { free: p.freeDailyTurns ?? p.tier?.freeDailyTurns ?? 0, saved: p.perpetualTurns ?? 0, coins: p.currentPoints || 0 };
};

const PlaysBar: React.FC<{ free: number; saved: number }> = ({ free, saved }) => {
  const navigate = useNavigate();
  return (
    <div className="flex w-full items-center gap-3 rounded-[20px] bg-white p-4">
      <div className="flex-1">
        <p className="text-[15px] font-semibold">{free} free {free === 1 ? 'play' : 'plays'} left</p>
        <p className="text-[11px] text-slate-500">+{saved} saved plays · resets Monday</p>
      </div>
      <button type="button" onClick={() => navigate('/games/get-plays')} className="rounded-full border border-brand bg-brand-soft px-4 py-2 text-[12px] font-semibold text-brand">Get plays</button>
    </div>
  );
};

/** Grid card: square cover art, name and category (Game hub). */
const GameCard: React.FC<{ g: GameEntry; onClick: () => void }> = ({ g, onClick }) => (
  <button type="button" onClick={onClick} className="flex min-w-0 flex-col items-center gap-1.5 rounded-[20px] bg-white p-2 pb-3 text-center shadow-[0_2px_10px_rgba(15,23,42,0.06)] active:scale-[0.98]">
    <span className="relative aspect-square w-full overflow-hidden rounded-[16px]">
      <GameArt code={g.code} iconUrl={g.iconUrl} />
      {g.partnerUrl && <span className="absolute left-1.5 top-1.5 rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-semibold text-white">Partner</span>}
      {g.freeLeft ? <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-semibold text-white">{g.freeLeft} free</span> : null}
    </span>
    <span className="w-full truncate text-[12px] font-semibold leading-4">{g.name}</span>
    <span className="text-[10px] text-slate-500">{catLabel(g.category)}</span>
  </button>
);

// ───────────────────────── GM-01 · Monthly leaderboard (podium) ─────────────────────────
type BoardRow = Awaited<ReturnType<typeof LoyaltyApi.getLearningLeaderboard>>[number];
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const PODIUM = {
  1: { block: 'h-[96px] bg-gradient-to-b from-[#FFD36B] to-[#F5A524] text-[#3B1D00]', ring: 'ring-[#FFD36B]', name: 'text-[#FFD36B]' },
  2: { block: 'h-[64px] bg-gradient-to-b from-[#E5E7EB] to-[#B6BCC6] text-slate-800', ring: 'ring-slate-300', name: 'text-white' },
  3: { block: 'h-[48px] bg-gradient-to-b from-[#F3B07A] to-[#C9773D] text-[#3B1D00]', ring: 'ring-[#F3B07A]', name: 'text-[#F3B07A]' },
} as const;

type LeaderboardTab = 'ALL' | 'LEARNING' | 'MINI_GAMES';

const Leaderboard: React.FC<{ initialBoard: BoardRow[] }> = ({ initialBoard }) => {
  const [boardType, setBoardType] = useState<LeaderboardTab>('ALL');
  const [board, setBoard] = useState<BoardRow[]>(initialBoard);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesData, setRulesData] = useState<LeaderboardRulesResponse | null>(null);

  const switchBoard = async (next: LeaderboardTab) => {
    setBoardType(next);
    try {
      const rows = await LoyaltyApi.getLearningLeaderboard(next);
      setBoard(rows);
    } catch {
      setBoard(next === 'ALL' ? initialBoard : []);
    }
  };

  const openRules = async () => {
    setRulesOpen(true);
    try {
      const info = await LoyaltyApi.getLeaderboardRules(boardType);
      setRulesData(info);
    } catch {
      setRulesData(null);
    }
  };

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const msLeft = end.getTime() - now.getTime();
  const left = `${Math.floor(msLeft / 86_400_000)}d ${String(Math.floor((msLeft % 86_400_000) / 3_600_000)).padStart(2, '0')}h`;
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const sorted = [...board].sort((a, b) => a.rank - b.rank);
  const top = (r: 1 | 2 | 3) => sorted.find((x) => x.rank === r);
  const me = sorted.find((x) => x.externalUserId === uid());
  const Slot: React.FC<{ r: 1 | 2 | 3 }> = ({ r }) => {
    const row = top(r);
    const name = row ? row.displayName || row.maskedPhone || 'Player' : '—';
    return (
      <div className="flex flex-1 flex-col items-center gap-1">
        {r === 1 && <span className="text-[18px]">👑</span>}
        <span className={`relative flex items-center justify-center rounded-full bg-white/15 font-semibold text-white ring-[3px] ${PODIUM[r].ring} ${r === 1 ? 'size-[68px] text-[20px]' : 'size-[54px] text-[16px]'}`}>
          {row ? initials(name) : '?'}
          <span className="absolute -bottom-2 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-900">{r}</span>
        </span>
        <span className="mt-1 max-w-full truncate text-[13px] font-semibold text-white">{name}</span>
        <span className={`text-[12px] font-semibold ${PODIUM[r].name}`}>{row ? `${fmt(row.totalPoints)} pts` : 'Open spot'}</span>
        <span className={`mt-1 flex w-full items-center justify-center rounded-t-[14px] px-1 text-center text-[12px] font-semibold ${PODIUM[r].block}`}>
          {row?.badge || `#${r}`}
        </span>
      </div>
    );
  };
  return (
    <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-[24px] bg-gradient-to-b from-[#3A1760] to-[#1E0B33] p-4 text-white">
      <span className="pointer-events-none absolute left-1/2 top-16 size-48 -translate-x-1/2 rounded-full bg-[#F5A524]/25 blur-3xl" />
      <div className="relative flex items-start gap-2">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-[16px] font-semibold"><Trophy className="size-4 text-[#FFD36B]" /> {month} leaderboard</p>
          <p className="text-[11px] text-white/70">Top players by game points this month</p>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">⏳ {left}</span>
      </div>

      <div className="relative flex items-center gap-1.5">
        {([
          { k: 'ALL', l: 'All' },
          { k: 'LEARNING', l: 'Learning' },
          { k: 'MINI_GAMES', l: 'Mini games' },
        ] as const).map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => switchBoard(t.k)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${boardType === t.k ? 'bg-[#FFBF40] text-[#2E1440]' : 'bg-white/10 text-white/85'}`}
          >
            {t.l}
          </button>
        ))}
        <button type="button" onClick={openRules} className="ml-auto text-[11px] font-semibold text-[#FFC759]">
          Rules ›
        </button>
      </div>

      <div className="relative mt-2 flex items-end gap-2">
        <Slot r={2} />
        <Slot r={1} />
        <Slot r={3} />
      </div>
      {sorted.filter((x) => x.rank > 3 && x.rank <= 5).map((x) => (
        <div key={x.rank} className="relative flex items-center gap-3 rounded-[14px] bg-white/10 px-3 py-2.5 text-[13px]">
          <span className="w-4 text-white/60">{x.rank}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">{initials(x.displayName || x.maskedPhone || '?')}</span>
          <span className="flex-1">{x.displayName || x.maskedPhone}</span>
          <span className="font-semibold">{fmt(x.totalPoints)} pts</span>
        </div>
      ))}
      <div className="relative flex items-center gap-3 rounded-[16px] bg-gradient-to-r from-[#FF8600] to-[#FFA23F] px-3 py-2.5">
        <span className="text-[15px] font-semibold">{me ? `#${me.rank}` : '—'}</span>
        <span className="flex-1">
          <span className="block text-[13px] font-semibold">{me ? `You · ${fmt(me.totalPoints)} pts` : 'You’re not on the board yet'}</span>
          <span className="block text-[11px] text-white/85">{board.length ? 'Play & learn this month to climb the ranks' : 'Be the first — play a game to earn game points'}</span>
        </span>
      </div>

      <Sheet open={rulesOpen} onClose={() => setRulesOpen(false)} title="Leaderboard rules & prizes">
        <div className="flex flex-col gap-3 text-[13px] text-slate-700">
          <div className="rounded-2xl bg-amber-50 p-3 text-[12px] text-amber-900">
            <p className="font-semibold">Game points (pts) are separate from Natcash Coins</p>
            <p className="mt-1">Pts are non-spendable and reset on the 1st of every month. Buying extra plays with coins never earns pts.</p>
          </div>
          <div>
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">Monthly rank prizes</p>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 px-3">
              {(rulesData?.prizes?.length ? rulesData.prizes : [
                { boardType: 'ALL', rankFrom: 1, rankTo: 1, prizeType: 'VOUCHER', prizeLabel: '10 GB 4G + Voucher 200 HTG' },
                { boardType: 'ALL', rankFrom: 2, rankTo: 2, prizeType: 'TELCO_DATA', prizeLabel: '5 GB 4G Data Pack' },
                { boardType: 'ALL', rankFrom: 3, rankTo: 3, prizeType: 'VOUCHER', prizeLabel: 'Voucher 100 HTG' },
                { boardType: 'ALL', rankFrom: 4, rankTo: 100, prizeType: 'BADGE_AND_TURNS', prizeLabel: 'Top 100 Badge + 1 free play/day' },
              ]).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-[12px]">
                  <span className="font-semibold text-slate-900">
                    {p.rankFrom === p.rankTo ? `#${p.rankFrom}` : `#${p.rankFrom}–#${p.rankTo}`}
                  </span>
                  <span className="text-right text-slate-600">{p.prizeLabel}</span>
                </div>
              ))}
            </div>
          </div>
          {rulesData?.rules && rulesData.rules.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">How pts are earned (daily caps)</p>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 px-3">
                {rulesData.rules.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-[12px]">
                    <span className="font-medium text-slate-800">{r.sourceCode.replace(/_/g, ' ')}</span>
                    <span className="text-right text-slate-500">Cap {fmt(r.dailyCapPts)} pts/day</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
};

// ───────────────────────── GM-01 · Game hub ─────────────────────────
export const GameHub: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState('ALL');
  const [data, failed, reload] = useLoad(async () => {
    const [plays, courses, board, catalogue, wheel, coins] = await Promise.all([
      loadPlays(),
      LoyaltyApi.getLearningCourses().catch(() => [] as LearningCourseItem[]),
      LoyaltyApi.getLearningLeaderboard().catch(() => []),
      loadGames(),
      LoyaltyApi.getLuckyWheelConfig(uid()).catch(() => null),
      LoyaltyApi.getProfile(uid()).then((p) => p.currentPoints).catch(() => undefined),
    ]);
    return { plays, courses, board, catalogue, wheel, coins };
  });
  // Catalogue (CMS) + learning courses (CMS). Categories and their order come from the data.
  const items: GameEntry[] = useMemo(() => {
    // Learning courses are always grouped under Learning; with none published yet one tile still opens the course list.
    const learning: GameEntry[] = data?.courses.length
      ? data.courses.map((c) => ({
          code: 'LEARNING',
          name: (c as any).titleVi || (c as any).titleEn || c.title || 'Learning Course',
          category: CAT.LEARN,
          route: `/learning/${c.id}`,
        }))
      : data ? [{ code: 'LEARNING', name: 'Learning', category: CAT.LEARN, route: '/learning' }] : [];
    return [...(data?.catalogue.games || []), ...learning];
  }, [data]);
  const cats = useMemo(() => Array.from(new Set(items.map((g) => g.category))), [items]);
  const shown = cat === 'ALL' ? items : items.filter((g) => g.category === cat);
  const partner = items.find((g) => g.code === params.get('open') && g.partnerUrl);
  const openGame = (g: GameEntry) => (g.route ? navigate(g.route) : setParams({ open: g.code }));

  return (
    <Screen title="Games" back="/" tab={{ shell: 'customer', active: 'games' }} hero={<Hero title="Games" sub="Play daily, win coins" coins={data?.coins} onCoins={() => navigate('/coins')} art={aiGames} />}>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[72px]" />}
      {data && <PlaysBar free={data.plays.free} saved={data.plays.saved} />}

      {data?.wheel && (
        <button type="button" onClick={() => navigate('/games/wheel')} className="flex w-full items-center gap-3 rounded-[20px] bg-[#1C2B33] p-4 text-left text-white">
          <div className="flex-1">
            <p className="text-[22px] font-semibold">{data.wheel.wheelName}</p>
            <p className="mb-3 text-[12px] text-white/75">{data.wheel.remainingSpinsToday} free spins left</p>
            <span className="rounded-[14px] bg-brand px-5 py-2.5 text-[13px] font-semibold">Play the wheel!</span>
          </div>
          <span className="size-[96px] shrink-0"><GameArt code="WHEEL" /></span>
        </button>
      )}

      {items.length > 0 && (
        <>
          <SectionHeader title="🔥 Hot this week" />
          {/* shortcut: the catalogue has no "featured" flag yet, so the first games in CMS order are featured */}
          <SlideRow className="gap-3">
            {items.slice(0, 6).map((g) => (
              <button key={`hot-${g.code}-${g.name}`} type="button" onClick={() => openGame(g)} className="flex w-[200px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-white text-left shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
                <span className="relative flex h-[120px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-soft to-[#FFE2B8]">
                  <GameArt code={g.code} iconUrl={g.iconUrl} className="h-[108px] w-[108px]" />
                  {g.partnerUrl && <span className="absolute left-2 top-2 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">Partner</span>}
                </span>
                <span className="px-3 pb-3 pt-2">
                  <span className="block truncate text-[14px] font-semibold">{g.name}</span>
                  <span className="text-[11px] text-slate-500">{catLabel(g.category)}</span>
                </span>
              </button>
            ))}
          </SlideRow>
        </>
      )}

      <SectionHeader title="All games" action="Play history ›" onAction={() => navigate('/games/history')} />
      {cats.length > 0 && (
        <SlideRow>
          {['ALL', ...cats].map((c) => {
            const n = c === 'ALL' ? items.length : items.filter((g) => g.category === c).length;
            const on = cat === c;
            return (
              <button key={c} type="button" onClick={() => setCat(c)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold ${on ? 'bg-brand text-white shadow-[0_4px_12px_rgba(255,134,0,0.35)]' : 'border border-slate-200 bg-white text-slate-700'}`}>
                {c === 'ALL' ? 'All games' : catLabel(c)}
                <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
              </button>
            );
          })}
        </SlideRow>
      )}
      {data && items.length === 0 && <Empty art={artGamepad} title="No games yet" text="Games will appear here once Natcash publishes them." />}
      <div className="grid w-full grid-cols-3 gap-2.5">
        {shown.map((g) => (
          <GameCard key={`${g.code}-${g.name}`} g={g} onClick={() => openGame(g)} />
        ))}
      </div>

      {data && <Leaderboard initialBoard={data.board} />}

      {/* GM-01 · Open partner game (388:914) */}
      <Sheet open={!!partner} onClose={() => setParams({})} title={`Open ${partner?.name ?? ''}?`}>
        {partner && (
          <>
            <span className="mx-auto size-16 overflow-hidden rounded-[16px]"><GameArt code={partner.code} iconUrl={partner.iconUrl} /></span>
            <p className="text-center text-[13px] text-slate-500">{partner.name} is a partner game. It opens in its own page and Natcash signs you in for you.</p>
            <ul className="list-disc space-y-1.5 rounded-[14px] bg-page p-4 pl-8 text-[12px] text-slate-600">
              <li>Coins or prizes from {partner.name} reach your coins history.</li>
              <li>{partner.name} has its own rules and odds. Natcash Rewards plays are not used.</li>
              <li>Tap Back at any time to return to Games.</li>
            </ul>
            <PrimaryButton onClick={() => partner.partnerUrl && (window.location.href = partner.partnerUrl)}>Open {partner.name}</PrimaryButton>
            <SecondaryButton onClick={() => setParams({})}>Cancel</SecondaryButton>
          </>
        )}
      </Sheet>
    </Screen>
  );
};

// ───────────────────────── Dark game frame (Rewards Wheel · Lucky Scratch Card) ─────────────────────────
const DarkGame: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B0A0A] via-[#5A1010] to-[#2A0606] font-nc text-white">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#2A0606]/95 px-4 py-2.5">
        <button type="button" aria-label="Back" onClick={() => navigate('/games')} className="flex size-10 items-center justify-center rounded-full bg-white/10"><ArrowLeft className="size-5" /></button>
        <div className="flex-1">
          <p className="text-[16px] font-semibold">{title}</p>
          <p className="text-[11px] text-white/70">{subtitle}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full border border-yellow-400/50"><HelpCircle className="size-4 text-yellow-400" /></span>
        <span className="flex size-9 items-center justify-center rounded-full border border-yellow-400/50"><Volume2 className="size-4 text-yellow-400" /></span>
      </header>
      <p className="flex items-center gap-2 bg-black/20 px-4 py-2 text-[11px] text-white/80"><ShieldCheck className="size-3.5 text-yellow-400" /> Rewards are saved to your Loyalty account.</p>
      <main className="mx-auto flex max-w-[430px] flex-col gap-4 px-4 pb-8 pt-4">{children}</main>
    </div>
  );
};

const DarkStats: React.FC<{ free: number; coins: number; unit: string }> = ({ free, coins, unit }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center rounded-[16px] border border-white/10 bg-white/5 p-3">
        <div className="flex-1">
          <p className="text-[11px] text-white/70">Free {unit}</p>
          <p className="text-[18px] font-semibold text-yellow-400">{free} <span className="text-[12px]">{unit}</span></p>
        </div>
        <button type="button" aria-label="Get plays" onClick={() => navigate('/games/get-plays')} className="flex size-9 items-center justify-center rounded-xl bg-yellow-400 text-[#3B0A0A]"><PlusCircle className="size-5" /></button>
      </div>
      <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
        <p className="text-[11px] text-white/70">Available coins</p>
        <p className="text-[18px] font-semibold text-emerald-400">{fmt(coins)} <span className="text-[12px]">coins</span></p>
      </div>
    </div>
  );
};

// ───────────────────────── GM-02 · Rewards Wheel ─────────────────────────
export const Wheel: React.FC = () => {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [data, failed, reload] = useLoad(async () => {
    const [cfg, plays] = await Promise.all([LoyaltyApi.getLuckyWheelConfig(uid()), loadPlays()]);
    return { cfg, plays };
  });
  const prizes = useMemo(() => [...(data?.cfg.prizes || [])].sort((a, b) => a.displayOrder - b.displayOrder), [data]);
  const left = data?.cfg.remainingSpinsToday ?? 0;
  const price = Number(data?.cfg.pricePerSpin) || 20;
  const coins = data?.plays.coins ?? 0;
  const canSpinPoints = left <= 0 && coins >= price;
  const seg = 360 / Math.max(prizes.length, 1);

  const spin = async (usePoints = false) => {
    if (!data || spinning) return;
    setSpinning(true);
    soundHaptics.playClick();
    try {
      const r = (await LoyaltyApi.spinLuckyWheel(uid(), usePoints, data.cfg.wheelCode)) as Record<string, unknown> & { wonPrize?: Partial<WheelPrizeItem> & { sliceIndex?: number } };
      const prizeId = (r.prizeId as number) ?? r.wonPrize?.prizeId;
      const idx = Math.max(0, (r.winningIndex as number) ?? r.wonPrize?.sliceIndex ?? prizes.findIndex((p) => p.prizeId === prizeId));
      setRotation((rot) => rot + 360 * 5 + (360 - (rot % 360)) - idx * seg - seg / 2);
      const prize = prizes[idx];
      const type = String(r.prizeType ?? r.wonPrize?.prizeType ?? prize?.prizeType ?? 'NO_LUCK');
      const value = Number(r.prizeValue ?? r.wonPrize?.prizeValue ?? prize?.prizeValue ?? 0);
      const isWon = !/NO_?LUCK|MISS|NONE/i.test(type);
      setTimeout(() => {
        if (isWon) soundHaptics.playVictoryFanfare();
        navigate('/games/result', {
          state: { game: 'Rewards Wheel', back: '/games/wheel', won: isWon, name: String(r.prizeName ?? prize?.prizeName ?? ''), type, value, balance: r.newPointBalance, left: r.remainingSpinsToday },
        });
      }, 4200);
    } catch {
      setSpinning(false);
      navigate('/games/result', { state: { game: 'Rewards Wheel', back: '/games/wheel', outOfPlays: true } });
    }
  };

  return (
    <DarkGame title={data?.cfg.wheelName || 'Rewards Wheel'} subtitle="Win coins and Loyalty rewards">
      {failed && (
        <div className="rounded-[20px] bg-white/10 p-5 text-center">
          <p className="text-[15px] font-semibold">The wheel isn’t available right now</p>
          <p className="mt-1 text-[12px] text-white/70">It may not be set up for your account yet. Try again later.</p>
          <button type="button" onClick={reload} className="mt-3 h-11 rounded-[14px] bg-brand px-5 text-[14px] font-semibold">Try again</button>
        </div>
      )}
      {!data && !failed && <div className="h-[300px] animate-pulse rounded-full bg-white/10" />}
      {data && (
        <>
          <DarkStats free={left} coins={coins} unit="spins" />
          <div className="relative mx-auto my-2 size-[300px]">
            <span className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-yellow-400" />
            <svg viewBox="-100 -100 200 200" className="size-full drop-shadow-xl transition-transform duration-[4000ms] ease-[cubic-bezier(.17,.67,.12,.99)]" style={{ transform: `rotate(${rotation}deg)` }}>
              <circle r="99" fill="#B91C1C" stroke="#F59E0B" strokeWidth="3" />
              {prizes.map((p, i) => {
                const a0 = ((i * seg - 90) * Math.PI) / 180;
                const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
                const mid = (i + 0.5) * seg - 90;
                const symbol = p.iconSymbol || (p.prizeType === 'CASHBACK' ? '💵' : p.prizeType === 'POINTS' ? '⭐' : p.prizeType === 'TURNS' ? '⚡' : p.prizeType === 'VOUCHER' ? '🎟️' : '🍀');
                const label = (p.nameVi || p.prizeName || p.nameEn || '').trim();
                return (
                  <g key={p.prizeId}>
                    <path d={`M0 0 L${92 * Math.cos(a0)} ${92 * Math.sin(a0)} A92 92 0 0 1 ${92 * Math.cos(a1)} ${92 * Math.sin(a1)} Z`} fill={p.colorCode || (i % 2 ? '#7C3AED' : '#DB2777')} stroke="#FCD34D" strokeWidth="1" />
                    <text transform={`rotate(${mid}) translate(66 0) rotate(90)`} textAnchor="middle" fill="#fff" fontSize="10">{symbol}</text>
                    <text transform={`rotate(${mid}) translate(48 0) rotate(90)`} textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="600">{label.length > 12 ? label.slice(0, 11) + '…' : label}</text>
                  </g>
                );
              })}
              <circle r="14" fill="#F59E0B" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
          <button
            type="button"
            disabled={spinning || (left <= 0 && !canSpinPoints)}
            onClick={() => spin(left <= 0)}
            className="h-12 rounded-[14px] bg-gradient-to-r from-[#374151] via-[#EF4444] to-[#EAB308] text-[14px] font-semibold disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {spinning ? 'SPINNING...' : left > 0 ? `SPIN NOW (FREE · ${left} LEFT)` : canSpinPoints ? `SPIN WITH ${fmt(price)} COINS` : 'NO SPINS LEFT'}
          </button>
          <p className="text-center text-[11px] text-white/70">
            {left > 0 ? `You have ${left} free spins left today` : canSpinPoints ? `Cost: ${fmt(price)} coins per spin` : 'Earn more spins or coins through missions'}
          </p>
          {prizes.length === 0 && <p className="text-center text-[12px] text-white/70">The wheel has no prizes configured yet.</p>}
        </>
      )}
    </DarkGame>
  );
};

// ───────────────────────── GM-02 · Lucky Scratch Card ─────────────────────────
export const ScratchCard: React.FC = () => {
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(loadPlays);
  const [cells, setCells] = useState<string[] | null>(null);
  const [shown, setShown] = useState<boolean[]>(Array(9).fill(false));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof LoyaltyApi.playScratchCard>> | null>(null);

  const start = async () => {
    setBusy(true);
    try {
      const r = await LoyaltyApi.playScratchCard(uid());
      setResult(r);
      setCells(r.scratchMatrix);
      return r;
    } catch {
      navigate('/games/result', { state: { game: 'Lucky Scratch Card', back: '/games/scratch', outOfPlays: true } });
      return null;
    } finally {
      setBusy(false);
    }
  };
  const reveal = async (i: number) => {
    const r = result || (await start());
    if (!r) return;
    setShown((s) => s.map((v, j) => v || j === i));
  };
  const revealAll = async () => {
    const r = result || (await start());
    if (!r) return;
    setShown(Array(9).fill(true));
    setTimeout(() => navigate('/games/result', {
      state: { game: 'Lucky Scratch Card', back: '/games/scratch', won: r.outcome === 'WIN', name: r.prizeName, type: r.prizeType, value: r.pointsAwarded, balance: r.newPointBalance, left: r.turnsRemaining },
    }), 1200);
  };

  return (
    <DarkGame title="Lucky Scratch Card" subtitle="Match 3 to win coins and rewards">
      {failed && <ErrorBlock onRetry={reload} />}
      {data && <DarkStats free={data.free} coins={data.coins} unit="plays" />}
      <div className="rounded-[20px] border-2 border-yellow-500/60 bg-gradient-to-b from-[#C2410C] to-[#7C2D12] p-4">
        <p className="mx-auto mb-3 w-fit rounded-full bg-black/30 px-4 py-1 text-[12px] font-semibold">MATCH 3 · WIN IT</p>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 9 }, (_, i) => (
            <button key={i} type="button" onClick={() => reveal(i)} disabled={busy} className={`flex aspect-square flex-col items-center justify-center rounded-[14px] text-[13px] font-semibold ${shown[i] && cells ? 'bg-[#FFF7E6] text-[#7C2D12]' : 'bg-gradient-to-br from-slate-300 to-slate-500 text-white/80'}`}>
              {shown[i] && cells ? cells[i] : '?'}
            </button>
          ))}
        </div>
      </div>
      <button type="button" disabled={busy || (data?.free ?? 0) <= 0} onClick={revealAll} className="h-12 rounded-[14px] bg-gradient-to-r from-[#374151] via-[#EF4444] to-[#EAB308] text-[14px] font-semibold disabled:opacity-60">
        SCRATCH ALL
      </button>
      <p className="text-center text-[11px] text-white/70">{data?.free ?? 0} free play left this week · scratch to reveal</p>
    </DarkGame>
  );
};

// ───────────────────────── GM-02 · Result (won · no prize · out of plays) ─────────────────────────
export const GameResult: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { game: string; back: string; won?: boolean; name?: string; type?: string; value?: number; balance?: number; left?: number; outOfPlays?: boolean } };
  if (!state) return <Navigate to="/games" replace />;
  const coins = state.type && /POINT|COIN/i.test(state.type);
  return (
    <Screen title="Game result" back={state.back}>
      {state.outOfPlays ? (
        <ResultBlock art={artHourglass} title="You're out of plays" sub="Free plays reset every Monday. Do a mission or check in to earn more." />
      ) : state.won ? (
        <ResultBlock art={artCup} title="You won a reward" value={coins ? `+${fmt(state.value)} coins` : state.name} sub={coins ? 'Added to your Loyalty account.' : 'Saved to My vouchers.'} />
      ) : (
        <ResultBlock art={artEmptyBox} title="No prize this time" sub="This play didn't win. Try again with your next free play." />
      )}
      <InfoRows
        rows={[
          ['Game', state.game],
          ...(state.left !== undefined ? ([['Plays left', `${state.left} play${state.left === 1 ? '' : 's'}`]] as [string, string][]) : []),
          ...(state.balance !== undefined ? ([['Current coins', `${fmt(state.balance)} coins`]] as [string, string][]) : []),
        ]}
      />
      {state.outOfPlays ? (
        <>
          <PrimaryButton onClick={() => navigate('/missions')}>Do a mission</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/games/get-plays')}>Get a play with coins</SecondaryButton>
        </>
      ) : (
        <>
          <PrimaryButton onClick={() => navigate(state.back)}>Play again</PrimaryButton>
          <SecondaryButton onClick={() => navigate(state.won && !coins ? '/my-vouchers' : '/coins')}>{state.won && !coins ? 'Open My vouchers' : 'See coins history'}</SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── GM-01 · Get a play with coins (+ play added) ─────────────────────────
export const GetPlays: React.FC = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [data, failed, reload] = useLoad(async () => {
    const [cfg, plays] = await Promise.all([LoyaltyApi.getLuckyWheelConfig(uid()).catch(() => null), loadPlays()]);
    return { price: Number(cfg?.pricePerSpin) || 0, code: cfg?.wheelCode || 'WHEEL', plays };
  });
  const buy = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const s = await LoyaltyApi.initGameSession(data.code);
      await LoyaltyApi.inGameCheckout(data.code, s.sessionToken, 1, data.price);
      setAdded(true);
    } catch {
      alert('Could not add the play. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Get plays" back="/games">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && !data.price && <Empty art={artGamepad} title="Getting plays with coins isn’t open yet" text="Natcash sets the coin price for a play. Do a mission or check in to earn free plays." />}
      {data && !!data.price && !added && (
        <>
          <ResultBlock art={artGamepad} title="1 extra play" value={`${fmt(data.price)} coins / play`} valueTone="orange" sub="Plays you get are added to your saved plays and never reset." />
          <InfoRows
            rows={[
              ['Saved plays now', `${data.plays.saved} plays`],
              ['Available coins', `${fmt(data.plays.coins)} coins`],
              ['Coins used', `${fmt(data.price)} coins`],
              data.plays.coins >= data.price
                ? ['Coins left', `${fmt(data.plays.coins - data.price)} coins`]
                : ['Coins missing', <span key="m" className="text-red-600">{fmt(data.price - data.plays.coins)} coins</span>],
            ]}
          />
          <p className="text-[12px] text-slate-500">Only Natcash Coin are used. Plays can't be bought with wallet money.</p>
          <PrimaryButton disabled={busy || data.plays.coins < data.price} onClick={buy}>
            {data.plays.coins < data.price ? 'Not enough coins' : 'Confirm 1 play'}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate(-1)}>Later</SecondaryButton>
        </>
      )}
      {data && added && (
        <>
          <ResultBlock art={artGamepad} title="Play added" value="+1 play" sub="The play was added to your saved plays." />
          <InfoRows rows={[['Coins used', `${fmt(data.price)} coins`], ['Coins left', `${fmt(data.plays.coins - data.price)} coins`], ['Saved plays now', `${data.plays.saved + 1} plays`]]} />
          <PrimaryButton onClick={() => navigate('/games')}>Back to games</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/coins')}>See coins history</SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── GM-01 · Learning list · GM-02 details · lesson ─────────────────────────
export const LearningList: React.FC = () => {
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getLearningCourses());
  return (
    <Screen title="Learning" back="/games">
      <div>
        <h2 className="text-[22px] font-semibold">Learning</h2>
        <p className="text-[13px] text-slate-500">Learn languages, reading and money skills in 3–5 minutes a day.</p>
      </div>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[200px]" />}
      {data?.length === 0 && <Empty art={artEmptyBox} title="No lessons yet" text="New courses are coming soon." />}
      {data?.map((c) => {
        const done = !!c.completedQuestions && c.completedQuestions >= c.totalQuestions;
        return (
          <button key={c.id} type="button" onClick={() => navigate(`/learning/${c.id}`)} className="flex w-full items-center gap-3 rounded-[20px] bg-white p-4 text-left">
            <span className="size-[64px] shrink-0 overflow-hidden rounded-[14px]"><GameArt code="LEARNING" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{c.title}</span>
              {c.description && <span className="line-clamp-1 text-[12px] text-slate-500">{c.description}</span>}
              <span className="text-[12px] font-semibold text-brand">Up to +{fmt(c.rewardPointsMax)} coins</span>
            </span>
            {done ? <Pill tone="green"><Check className="size-3" /> Done</Pill> : <span className="rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-white">{c.completedQuestions ? 'Continue' : 'Start'}</span>}
          </button>
        );
      })}
    </Screen>
  );
};

export const LearningDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(async () => {
    const [courses, plays] = await Promise.all([LoyaltyApi.getLearningCourses(), loadPlays()]);
    return { c: courses.find((x) => String(x.id) === id), plays };
  }, [id]);
  const c = data?.c;
  return (
    <Screen title="Game details" back="/learning">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && !c && <Empty art={artEmptyBox} title="Course not found" />}
      {c && (
        <>
          <div className="h-[200px] w-full overflow-hidden rounded-[20px]"><GameArt code="LEARNING" /></div>
          <div>
            <h2 className="text-[24px] font-semibold">{c.title}</h2>
            <div className="mt-1 flex gap-2"><Pill tone="blue">Learning</Pill><Pill tone="orange">Loyalty game</Pill></div>
          </div>
          <div className="flex items-center justify-between rounded-[14px] bg-white p-3 text-[13px]">
            <span>{data.plays.free} free plays left this week</span>
            <button type="button" onClick={() => navigate('/games/get-plays')} className="font-semibold text-brand">Get more ›</button>
          </div>
          <PrimaryButton onClick={() => navigate(`/learning/${c.id}/lesson`)}>Start lesson · uses 1 play</PrimaryButton>
          <div className="rounded-[20px] bg-white p-4">
            <p className="mb-2 text-[15px] font-semibold">Earn coins</p>
            <InfoRows rows={[[`${c.totalQuestions} questions`, `up to +${fmt(c.rewardPointsMax)} coins`], ['Difficulty', c.difficulty || 'Easy']]} />
          </div>
          {c.description && (
            <div className="rounded-[20px] bg-white p-4">
              <p className="mb-1 text-[15px] font-semibold">About</p>
              <p className="text-[13px] leading-5 text-slate-500">{c.description}</p>
            </div>
          )}
        </>
      )}
    </Screen>
  );
};

export const Lesson: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [qs, failed, reload] = useLoad(() => LoyaltyApi.getLearningQuestions(id), [id]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<LearningQuizSubmitResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const list: LearningQuestionItem[] = useMemo(() => [...(qs || [])].sort((a, b) => a.orderIndex - b.orderIndex), [qs]);
  const q = list[i];
  const picked = q ? answers[q.id] : undefined;

  const next = async () => {
    if (i < list.length - 1) return setI(i + 1);
    setBusy(true);
    try {
      setResult(await LoyaltyApi.submitLearningQuiz(id, list.map((x) => ({ questionId: x.id, selectedOptionIndex: answers[x.id] ?? -1 })), uid()));
    } catch {
      alert('Could not submit the lesson. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const speak = () => {
    if (!q) return;
    if (q.audioUrl) void new Audio(q.audioUrl).play();
    else if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(q.options[picked ?? 0] || q.questionText));
  };

  return (
    <Screen title="Lesson" back={`/learning/${id}`}>
      {failed && <ErrorBlock onRetry={reload} />}
      {!qs && !failed && <Skeleton className="h-[400px]" />}
      {qs && list.length === 0 && <Empty art={artEmptyBox} title="This lesson has no questions yet" />}
      {q && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand" style={{ width: `${((i + 1) / list.length) * 100}%` }} /></div>
            <span className="text-[13px] font-semibold">{i + 1} / {list.length}</span>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold">{q.questionText}</h2>
            <p className="text-[13px] text-slate-500">Listen, then tap the right answer.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton className="h-11 text-sky-700" onClick={speak}><Volume1 className="size-4" /> Listen</SecondaryButton>
            <SecondaryButton className="h-11 text-brand" onClick={speak}><Mic className="size-4" /> Say it</SecondaryButton>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {q.options.map((o, k) => (
              <button key={o} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: k }))} className={`flex h-14 items-center justify-center gap-1 rounded-[16px] border text-[16px] font-semibold ${picked === k ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white'}`}>
                {picked === k && <Check className="size-4" />} {o}
              </button>
            ))}
          </div>
          <PrimaryButton className="bg-emerald-700" disabled={picked === undefined || busy} onClick={next}>{i < list.length - 1 ? 'Next' : 'Finish lesson'}</PrimaryButton>
        </>
      )}
      <Popup open={!!result} onClose={() => navigate('/learning')}>
        <img src={artCup} alt="" className="size-24" />
        <p className="text-[18px] font-semibold">Lesson complete!</p>
        <p className="text-[13px] text-slate-500">{result?.correctCount} of {result?.totalQuestions} correct</p>
        <p className="text-[28px] font-semibold text-emerald-700">+{fmt(result?.pointsAwarded)} coins</p>
        <PrimaryButton className="mt-2" onClick={() => { setResult(null); setAnswers({}); setI(0); }}>Next lesson · uses 1 play</PrimaryButton>
        <SecondaryButton onClick={() => navigate('/learning')}>Back to Learning</SecondaryButton>
      </Popup>
    </Screen>
  );
};

// ───────────────────────── GM-01 · Play history ─────────────────────────
interface PlayRow { id?: number | string; gameType?: string; gameCode?: string; prizeName?: string; pointsAwarded?: number; outcome?: string; playedAt?: string; createdAt?: string }
export const PlayHistory: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Prizes' | 'Wheel' | 'Mini'>('All');
  const [data, failed, reload] = useLoad(async () => {
    const r = (await LoyaltyApi.getGamePlayHistory(uid(), 0, 50)) as { items?: PlayRow[]; content?: PlayRow[] } | PlayRow[];
    return Array.isArray(r) ? r : r.items || r.content || [];
  });
  const won = (r: PlayRow) => (r.pointsAwarded || 0) > 0 || (!!r.prizeName && !/no.?luck|no prize/i.test(r.prizeName));
  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = (data || []).filter((r) => new Date(r.playedAt || r.createdAt || 0).getTime() >= weekAgo);
  const rows = (data || []).filter((r) =>
    filter === 'All' ? true : filter === 'Prizes' ? won(r) : filter === 'Wheel' ? /WHEEL|LUCKY/i.test(r.gameCode || r.gameType || '') : !/WHEEL|LUCKY/i.test(r.gameCode || r.gameType || ''),
  );
  return (
    <Screen title="Play history" back="/games">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && (
        <>
          <div className="grid w-full grid-cols-3 rounded-[20px] bg-brand-soft p-4 text-center">
            <p className="col-span-3 mb-2 text-left text-[12px] text-slate-500">This week</p>
            <div><p className="text-[20px] font-semibold">{week.length}</p><p className="text-[11px] text-slate-500">plays</p></div>
            <div><p className="text-[20px] font-semibold">{week.filter(won).length}</p><p className="text-[11px] text-slate-500">prizes</p></div>
            <div><p className="text-[20px] font-semibold">+{fmt(week.reduce((s, r) => s + (r.pointsAwarded || 0), 0))}</p><p className="text-[11px] text-slate-500">coins won</p></div>
          </div>
          <SlideRow>
            {(['All', 'Prizes', 'Wheel', 'Mini'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${filter === f ? 'bg-brand text-white' : 'border border-slate-200 bg-white'}`}>
                {f === 'Wheel' ? 'Rewards Wheel' : f === 'Mini' ? 'Mini games' : f}
              </button>
            ))}
          </SlideRow>
          {rows.length === 0 && <Empty art={artGamepad} title="No plays yet" text="Your games and prizes will show up here." />}
          {rows.length > 0 && (
            <div className="w-full divide-y divide-slate-100 rounded-[20px] bg-white px-4">
              {rows.map((r, k) => {
                const code = r.gameCode || r.gameType || '';
                const d = new Date(r.playedAt || r.createdAt || '');
                return (
                  <div key={r.id ?? k} className="flex items-center gap-3 py-3">
                    <span className="size-11 shrink-0 overflow-hidden rounded-xl"><GameArt code={code.toUpperCase()} /></span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[14px] font-semibold">{gameName(code)}</span>
                      <span className="text-[11px] text-slate-500">{Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span className={`text-right text-[12px] font-semibold ${won(r) ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {r.pointsAwarded ? `+${fmt(r.pointsAwarded)} coins` : won(r) ? r.prizeName : 'No prize'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-slate-500">Results are decided by the Natcash server when you play. Prizes go to My vouchers or your coins history.</p>
        </>
      )}
    </Screen>
  );
};
