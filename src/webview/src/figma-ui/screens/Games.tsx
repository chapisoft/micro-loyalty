import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, Volume2, PlusCircle, Trophy, ShieldCheck, Volume1, Mic, Check } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import {
  LoyaltyApi, getDefaultUserId, type LearningCourseItem, type LearningQuestionItem, type LearningQuizSubmitResponse, type WheelPrizeItem, type LeaderboardRulesResponse,
} from '../../services/api';
import { GameArt } from '../GameArt';
import { CAT, loadGames, catLabel, localizedGameName, type GameEntry } from '../games';
import { pickLocalizedField, toDateLocale } from '../../language';
import {
  Screen, Hero, Chip, SectionHeader, Skeleton, ErrorBlock, Pill, PrimaryButton, SecondaryButton, ResultBlock, InfoRows, Empty, Popup, Sheet, SlideRow, useLoad, fmt,
} from '../ui';
import { artCup, artEmptyBox, artGamepad, artHourglass, aiGames } from '../art';
import illGame from '../../assets/figma/ill-game.svg';

const uid = () => getDefaultUserId();

const gameName = (code?: string, fallback?: string) => localizedGameName(code, fallback);

const loadPlays = async () => {
  const userId = uid();
  if (!userId) return { free: 0, saved: 0, coins: 0 };
  const p = await LoyaltyApi.getProfile(userId).catch(() => null);
  return { free: p?.freeDailyTurns ?? p?.tier?.freeDailyTurns ?? 0, saved: p?.perpetualTurns ?? 0, coins: p?.currentPoints || 0 };
};

/** Free plays card — same look as the Home member card (cream card overlapping the orange header, illustration, soft shadow). */
const PlaysBar: React.FC<{ free: number; saved: number }> = ({ free, saved }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex w-full items-center gap-3 rounded-[20px] bg-gradient-to-br from-[#FFF4DD] to-[#FFE6BF] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <img src={illGame} alt="" className="size-[60px] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-slate-600">{t('figma_ui.games.weekly_plays_label')}</p>
        <p className="text-[28px] font-semibold leading-8">{free}<span className="ml-1 text-[14px] font-medium text-slate-500">{t('figma_ui.games.plays_left_badge')}</span></p>
        <p className="text-[12px] text-slate-500">{t('figma_ui.games.saved_resets_monday', { saved })}</p>
      </div>
      <button type="button" onClick={() => navigate('/games/get-plays')} className="h-9 shrink-0 rounded-full bg-[#FE810D] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(254,129,13,0.3)]">{t('figma_ui.games.get_plays_short_btn')}</button>
    </div>
  );
};

/** Game tile — identical to the Home "Play every day" tile: 68px rounded icon, name below, no card around it. */
const GameCard: React.FC<{ g: GameEntry; onClick: () => void }> = ({ g, onClick }) => (
  <button type="button" onClick={onClick} className="flex min-w-0 flex-col items-center gap-1.5 active:scale-[0.97]">
    <span className="relative size-[68px] overflow-hidden rounded-[16px]">
      <GameArt code={g.code} iconUrl={g.iconUrl} />
    </span>
    <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-4">{g.code === 'LEARNING' ? g.name : localizedGameName(g.code, g.name)}</span>
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
  const { t, i18n } = useTranslation();
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

  useEffect(() => {
    LoyaltyApi.getLeaderboardRules(boardType).then(setRulesData).catch(() => setRulesData(null));
  }, [boardType]);
  const openRules = () => setRulesOpen(true);
  const prizeFor = (r: number) => rulesData?.prizes?.find((p) => p.rankFrom <= r && r <= p.rankTo)?.prizeLabel;

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const msLeft = end.getTime() - now.getTime();
  const left = t('figma_ui.games.countdown_dh', {
    days: Math.floor(msLeft / 86_400_000),
    hours: String(Math.floor((msLeft % 86_400_000) / 3_600_000)).padStart(2, '0'),
  });
  const month = now.toLocaleDateString(toDateLocale(i18n.language), { month: 'long' });
  const sorted = [...board].sort((a, b) => a.rank - b.rank);
  const top = (r: 1 | 2 | 3) => sorted.find((x) => x.rank === r);
  const me = sorted.find((x) => x.externalUserId === uid());
  const Slot: React.FC<{ r: 1 | 2 | 3 }> = ({ r }) => {
    const row = top(r);
    const name = row ? row.displayName || row.maskedPhone || t('figma_ui.games.default_player_name') : '—';
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        {r === 1 && <span className="text-[18px]">👑</span>}
        <span className={`relative flex items-center justify-center rounded-full bg-white/15 font-semibold text-white ring-[3px] ${PODIUM[r].ring} ${r === 1 ? 'size-[68px] text-[20px]' : 'size-[54px] text-[16px]'}`}>
          {row ? initials(name) : '?'}
          <span className="absolute -bottom-2 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-900">{r}</span>
        </span>
        <span className="mt-1 w-full truncate text-center text-[13px] font-semibold text-white">{name}</span>
        <span className={`text-[12px] font-semibold ${PODIUM[r].name}`}>{row ? t('figma_ui.games.leaderboard_points', { points: fmt(row.totalPoints) }) : t('figma_ui.games.open_spot')}</span>
        <span className={`mt-1 flex w-full items-center justify-center rounded-t-[14px] px-1.5 text-center text-[11px] font-semibold leading-[14px] ${PODIUM[r].block}`}>
          <span className="line-clamp-3">{prizeFor(r) || `#${r}`}</span>
        </span>
      </div>
    );
  };
  return (
    <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-[24px] bg-gradient-to-b from-[#3A1760] to-[#1E0B33] p-4 text-white">
      <span className="pointer-events-none absolute left-1/2 top-16 size-48 -translate-x-1/2 rounded-full bg-[#F5A524]/25 blur-3xl" />
      <div className="relative flex items-start gap-2">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-[16px] font-semibold"><Trophy className="size-4 text-[#FFD36B]" /> {t('figma_ui.games.leaderboard_title')} · {month}</p>
          <p className="text-[11px] text-white/70">{t('figma_ui.games.leaderboard_month', { month })}</p>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">⏳ {left}</span>
      </div>

      <div className="relative flex items-center gap-1.5">
        {([
          { k: 'ALL', l: t('figma_ui.games.board_tab_all') },
          { k: 'LEARNING', l: t('figma_ui.games.board_tab_learning') },
          { k: 'MINI_GAMES', l: t('figma_ui.games.board_tab_mini') },
        ] as const).map((tab) => (
          <button
            key={tab.k}
            type="button"
            onClick={() => switchBoard(tab.k)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${boardType === tab.k ? 'bg-[#FFBF40] text-[#2E1440]' : 'bg-white/10 text-white/85'}`}
          >
            {tab.l}
          </button>
        ))}
        <button type="button" onClick={openRules} className="ml-auto text-[11px] font-semibold text-[#FFC759]">
          {t('figma_ui.games.leaderboard_rules_btn')}
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
          <span className="min-w-0 flex-1 truncate">{x.displayName || x.maskedPhone}</span>
          <span className="font-semibold">{t('figma_ui.games.leaderboard_points', { points: fmt(x.totalPoints) })}</span>
        </div>
      ))}
      <div className="relative flex items-center gap-3 rounded-[16px] bg-gradient-to-r from-[#FF8600] to-[#FFA23F] px-3 py-2.5">
        <span className="text-[15px] font-semibold">{me ? `#${me.rank}` : '—'}</span>
        <span className="flex-1">
          <span className="block text-[13px] font-semibold">{me ? t('figma_ui.games.board_you_pts', { points: fmt(me.totalPoints) }) : t('figma_ui.games.board_not_on')}</span>
          <span className="block text-[11px] text-white/85">{board.length ? t('figma_ui.games.board_sub_play') : t('figma_ui.games.board_sub_first')}</span>
        </span>
      </div>

      <Sheet open={rulesOpen} onClose={() => setRulesOpen(false)} title={t('figma_ui.games.leaderboard_rules_sheet')}>
        <div className="flex flex-col gap-3 text-[13px] text-slate-700">
          <div className="rounded-2xl bg-amber-50 p-3 text-[12px] text-amber-900">
            <p className="font-semibold">{t('figma_ui.games.rules_pts_title')}</p>
            <p className="mt-1">{t('figma_ui.games.rules_pts_desc')}</p>
          </div>
          <div>
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{t('figma_ui.games.rules_prizes_heading')}</p>
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
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{t('figma_ui.games.rules_caps_heading')}</p>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 px-3">
                {rulesData.rules.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-[12px]">
                    <span className="font-medium text-slate-800">{r.sourceCode.replace(/_/g, ' ')}</span>
                    <span className="text-right text-slate-500">{t('figma_ui.games.rules_cap_day', { cap: fmt(r.dailyCapPts) })}</span>
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState('ALL');
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [plays, courses, board, catalogue, wheel, coins] = await Promise.all([
      loadPlays(),
      LoyaltyApi.getLearningCourses().catch(() => [] as LearningCourseItem[]),
      LoyaltyApi.getLearningLeaderboard().catch(() => []),
      loadGames(),
      LoyaltyApi.getLuckyWheelConfig(userId).catch(() => null),
      userId ? LoyaltyApi.getProfile(userId).then((p) => p.currentPoints).catch(() => undefined) : Promise.resolve(undefined),
    ]);
    return { plays, courses, board, catalogue, wheel, coins };
  });
  // Catalogue (CMS) + learning courses (CMS). Categories and their order come from the data.
  const items: GameEntry[] = useMemo(() => {
    // Learning courses are always grouped under Learning; with none published yet one tile still opens the course list.
    const learning: GameEntry[] = data?.courses.length
      ? data.courses.map((c) => ({
          code: 'LEARNING',
          name: pickLocalizedField(c, 'title', i18n.language) || c.title || t('figma_ui.games.learning_title'),
          category: CAT.LEARN,
          route: `/learning/${c.id}`,
        }))
      : data ? [{ code: 'LEARNING', name: t('figma_ui.games.learning_title'), category: CAT.LEARN, route: '/learning' }] : [];
    return [...(data?.catalogue.games || []), ...learning];
  }, [data, i18n.language, t]);
  const cats = useMemo(() => Array.from(new Set(items.map((g) => g.category))), [items]);
  const shown = cat === 'ALL' ? items : items.filter((g) => g.category === cat);
  const partner = items.find((g) => g.code === params.get('open') && g.partnerUrl);
  const openGame = (g: GameEntry) => (g.route ? navigate(g.route) : setParams({ open: g.code }));

  return (
    <Screen title={t('figma_ui.games.title')} back="/" tab={{ shell: 'customer', active: 'games' }} hero={<Hero title={t('figma_ui.games.title')} sub={t('figma_ui.games.subtitle')} coins={data?.coins} onCoins={() => navigate('/coins')} art={aiGames} />}>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[72px]" />}
      {data && <PlaysBar free={data.plays.free} saved={data.plays.saved} />}

      {data?.wheel && (
        <button type="button" onClick={() => navigate('/games/wheel')} className="flex w-full items-center gap-3 rounded-[20px] bg-[#1C2B33] px-[18px] py-5 text-left text-white">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[22px] font-semibold leading-7">{t('figma_ui.games.wheel_default_title')}</p>
            <p className="text-[13px] text-white/75">{t('figma_ui.games.wheel_subtitle')}</p>
            <span className="mt-2.5 flex h-12 w-full max-w-[200px] items-center justify-center rounded-[12px] bg-[#FF8600] text-[14px] font-semibold">{t('figma_ui.games.wheel_card_cta')}</span>
          </div>
          <span className="size-[92px] shrink-0"><GameArt code="WHEEL" /></span>
        </button>
      )}

      <SectionHeader title={t('figma_ui.games.all_games')} action={t('figma_ui.games.play_history')} onAction={() => navigate('/games/history')} />
      {cats.length > 0 && (
        <SlideRow>
          {['ALL', ...cats].map((c) => {
            const n = c === 'ALL' ? items.length : items.filter((g) => g.category === c).length;
            const on = cat === c;
            return (
              <Chip key={c} on={on} onClick={() => setCat(c)}>
                {c === 'ALL' ? t('figma_ui.games.all_games') : catLabel(c)}
                <span className="text-[12px] font-normal text-slate-400">{n}</span>
              </Chip>
            );
          })}
        </SlideRow>
      )}
      {data && items.length === 0 && <Empty art={artGamepad} title={t('figma_ui.games.empty_title')} text={t('figma_ui.games.empty_sub')} />}
      <div className="grid w-full grid-cols-4 gap-x-2 gap-y-4">
        {shown.map((g) => (
          <GameCard key={`${g.code}-${g.name}`} g={g} onClick={() => openGame(g)} />
        ))}
      </div>

      {data && <Leaderboard initialBoard={data.board} />}

      {/* GM-01 · Open partner game (388:914) */}
      <Sheet open={!!partner} onClose={() => setParams({})} title={t('figma_ui.games.partner_sheet_title', { name: partner?.name ?? '' })}>
        {partner && (
          <>
            <span className="mx-auto size-16 overflow-hidden rounded-[16px]"><GameArt code={partner.code} iconUrl={partner.iconUrl} /></span>
            <p className="text-center text-[13px] text-slate-500">{t('figma_ui.games.partner_modal_desc', { name: partner.name })}</p>
            <ul className="list-disc space-y-1.5 rounded-[14px] bg-page p-4 pl-8 text-[12px] text-slate-600">
              <li>{t('figma_ui.games.partner_bullet_1', { name: partner.name })}</li>
              <li>{t('figma_ui.games.partner_bullet_2', { name: partner.name })}</li>
              <li>{t('figma_ui.games.partner_bullet_3')}</li>
            </ul>
            <PrimaryButton onClick={() => partner.partnerUrl && (window.location.href = partner.partnerUrl)}>{t('figma_ui.games.partner_open_name', { name: partner.name })}</PrimaryButton>
            <SecondaryButton onClick={() => setParams({})}>{t('figma_ui.games.partner_sheet_cancel')}</SecondaryButton>
          </>
        )}
      </Sheet>
    </Screen>
  );
};

// ───────────────────────── Dark game frame (Rewards Wheel · Lucky Scratch Card) ─────────────────────────
const DarkGame: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B0A0A] via-[#5A1010] to-[#2A0606] font-nc text-white">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#2A0606]/95 px-4 py-2.5">
        <button type="button" aria-label={t('figma_ui.games.dark_back_aria')} onClick={() => navigate('/games')} className="flex size-10 items-center justify-center rounded-full bg-white/10"><ArrowLeft className="size-5" /></button>
        <div className="flex-1">
          <p className="text-[16px] font-semibold">{title}</p>
          <p className="text-[11px] text-white/70">{subtitle}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full border border-yellow-400/50"><HelpCircle className="size-4 text-yellow-400" /></span>
        <span className="flex size-9 items-center justify-center rounded-full border border-yellow-400/50"><Volume2 className="size-4 text-yellow-400" /></span>
      </header>
      <p className="flex items-center gap-2 bg-black/20 px-4 py-2 text-[11px] text-white/80"><ShieldCheck className="size-3.5 text-yellow-400" /> {t('figma_ui.games.dark_saved_note')}</p>
      <main className="mx-auto flex max-w-[430px] flex-col gap-4 px-4 pb-8 pt-4">{children}</main>
    </div>
  );
};

const DarkStats: React.FC<{ free: number; coins: number; unit: string }> = ({ free, coins, unit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center rounded-[16px] border border-white/10 bg-white/5 p-3">
        <div className="flex-1">
          <p className="text-[11px] text-white/70">{t('figma_ui.games.dark_free_unit', { unit })}</p>
          <p className="text-[18px] font-semibold text-yellow-400">{free} <span className="text-[12px]">{unit}</span></p>
        </div>
        <button type="button" aria-label={t('figma_ui.games.dark_get_plays_aria')} onClick={() => navigate('/games/get-plays')} className="flex size-9 items-center justify-center rounded-xl bg-yellow-400 text-[#3B0A0A]"><PlusCircle className="size-5" /></button>
      </div>
      <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
        <p className="text-[11px] text-white/70">{t('figma_ui.games.dark_available_coins')}</p>
        <p className="text-[18px] font-semibold text-emerald-400">{fmt(coins)} <span className="text-[12px]">{t('figma_ui.common.coins')}</span></p>
      </div>
    </div>
  );
};

// ───────────────────────── GM-02 · Rewards Wheel ─────────────────────────
export const Wheel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const userId = uid();
  const [data, failed, reload] = useLoad(async () => {
    const [cfg, plays] = await Promise.all([LoyaltyApi.getLuckyWheelConfig(uid()), loadPlays()]);
    return { cfg, plays };
  });
  const prizes = useMemo(() => [...(data?.cfg.prizes || [])].sort((a, b) => a.displayOrder - b.displayOrder), [data]);
  const left = data?.cfg.remainingSpinsToday ?? 0;
  const price = Number(data?.cfg.pricePerSpin) || 20;
  const coins = data?.plays.coins ?? 0;
  const canSpinPoints = !!userId && left <= 0 && coins >= price;
  const seg = 360 / Math.max(prizes.length, 1);

  const spin = async (usePoints = false) => {
    if (!userId) {
      alert(t('sso.guest_login_required_desc'));
      return;
    }
    if (!data || spinning) return;
    setSpinning(true);
    soundHaptics.playClick();
    try {
      const r = (await LoyaltyApi.spinLuckyWheel(userId, usePoints, data.cfg.wheelCode)) as Record<string, unknown> & { wonPrize?: Partial<WheelPrizeItem> & { sliceIndex?: number } };
      const prizeId = (r.prizeId as number) ?? r.wonPrize?.prizeId;
      const idx = Math.max(0, (r.winningIndex as number) ?? r.wonPrize?.sliceIndex ?? prizes.findIndex((p) => p.prizeId === prizeId));
      setRotation((rot) => rot + 360 * 5 + (360 - (rot % 360)) - idx * seg - seg / 2);
      const prize = prizes[idx];
      const type = String(r.prizeType ?? r.wonPrize?.prizeType ?? prize?.prizeType ?? 'NO_LUCK');
      const value = Number(r.prizeValue ?? r.wonPrize?.prizeValue ?? prize?.prizeValue ?? 0);
      const isWon = !/NO_?LUCK|MISS|NONE/i.test(type);
      const wonLabel = pickLocalizedField(r, 'name', i18n.language, ['prizeName']) || pickLocalizedField(prize, 'name', i18n.language, ['prizeName']) || '';
      setTimeout(() => {
        if (isWon) soundHaptics.playVictoryFanfare();
        navigate('/games/result', {
          state: { game: localizedGameName('WHEEL', t('figma_ui.games.wheel_default_title')), gameCode: 'WHEEL', back: '/games/wheel', won: isWon, name: wonLabel, type, value, balance: r.newPointBalance, left: r.remainingSpinsToday },
        });
      }, 4200);
    } catch {
      setSpinning(false);
      navigate('/games/result', { state: { game: localizedGameName('WHEEL', t('figma_ui.games.wheel_default_title')), gameCode: 'WHEEL', back: '/games/wheel', outOfPlays: true } });
    }
  };

  return (
    <DarkGame title={localizedGameName('WHEEL', data?.cfg.wheelName || t('figma_ui.games.wheel_default_title'))} subtitle={t('figma_ui.games.wheel_subtitle')}>
      {failed && (
        <div className="rounded-[20px] bg-white/10 p-5 text-center">
          <p className="text-[15px] font-semibold">{t('figma_ui.games.wheel_unavail_title')}</p>
          <p className="mt-1 text-[12px] text-white/70">{t('figma_ui.games.wheel_unavail_sub')}</p>
          <button type="button" onClick={reload} className="mt-3 h-11 rounded-[14px] bg-brand px-5 text-[14px] font-semibold">{t('figma_ui.common.try_again')}</button>
        </div>
      )}
      {!data && !failed && <div className="h-[300px] animate-pulse rounded-full bg-white/10" />}
      {data && (
        <>
          <DarkStats free={left} coins={coins} unit={t('figma_ui.games.unit_spins')} />
          <div className="relative mx-auto my-2 size-[300px]">
            <span className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-yellow-400" />
            <svg viewBox="-100 -100 200 200" className="size-full drop-shadow-xl transition-transform duration-[4000ms] ease-[cubic-bezier(.17,.67,.12,.99)]" style={{ transform: `rotate(${rotation}deg)` }}>
              <circle r="99" fill="#B91C1C" stroke="#F59E0B" strokeWidth="3" />
              {prizes.map((p, i) => {
                const a0 = ((i * seg - 90) * Math.PI) / 180;
                const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
                const mid = (i + 0.5) * seg - 90;
                const symbol = p.iconSymbol || (p.prizeType === 'CASHBACK' ? '💵' : p.prizeType === 'POINTS' ? '⭐' : p.prizeType === 'TURNS' ? '⚡' : p.prizeType === 'VOUCHER' ? '🎟️' : '🍀');
                const label = pickLocalizedField(p, 'name', i18n.language, ['prizeName']);
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
            disabled={!userId || spinning || (left <= 0 && !canSpinPoints)}
            onClick={() => spin(left <= 0)}
            className="h-12 rounded-[14px] bg-gradient-to-r from-[#374151] via-[#EF4444] to-[#EAB308] text-[14px] font-semibold disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {!userId
              ? t('sso.guest_login_required')
              : spinning
              ? t('figma_ui.games.wheel_spinning')
              : left > 0
              ? t('figma_ui.games.wheel_spin_free_left', { count: left })
              : canSpinPoints
              ? t('figma_ui.games.wheel_spin_with_coins', { price: fmt(price) })
              : t('figma_ui.games.wheel_no_spins_btn')}
          </button>
          <p className="text-center text-[11px] text-white/70">
            {!userId
              ? t('sso.guest_login_required_desc')
              : left > 0
              ? t('figma_ui.games.wheel_free_turns_note', { count: left })
              : canSpinPoints
              ? t('figma_ui.games.wheel_cost_note', { price: fmt(price) })
              : t('figma_ui.games.wheel_earn_more_note')}
          </p>
          {prizes.length === 0 && <p className="text-center text-[12px] text-white/70">{t('figma_ui.games.wheel_no_prizes')}</p>}
        </>
      )}
    </DarkGame>
  );
};

// ───────────────────────── GM-02 · Lucky Scratch Card ─────────────────────────
export const ScratchCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = uid();
  const [data, failed, reload] = useLoad(loadPlays);
  const [cells, setCells] = useState<string[] | null>(null);
  const [shown, setShown] = useState<boolean[]>(Array(9).fill(false));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof LoyaltyApi.playScratchCard>> | null>(null);

  const start = async () => {
    if (!userId) {
      alert(t('sso.guest_login_required_desc'));
      return null;
    }
    setBusy(true);
    try {
      const r = await LoyaltyApi.playScratchCard(userId);
      setResult(r);
      setCells(r.scratchMatrix);
      return r;
    } catch {
      navigate('/games/result', { state: { game: localizedGameName('SCRATCH', t('figma_ui.games.scratch_title')), gameCode: 'SCRATCH', back: '/games/scratch', outOfPlays: true } });
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
      state: { game: localizedGameName('SCRATCH', t('figma_ui.games.scratch_title')), gameCode: 'SCRATCH', back: '/games/scratch', won: r.outcome === 'WIN', name: r.prizeName, type: r.prizeType, value: r.pointsAwarded, balance: r.newPointBalance, left: r.turnsRemaining },
    }), 1200);
  };

  return (
    <DarkGame title={t('figma_ui.games.scratch_title')} subtitle={t('figma_ui.games.scratch_subtitle')}>
      {failed && <ErrorBlock onRetry={reload} />}
      {data && <DarkStats free={data.free} coins={data.coins} unit={t('figma_ui.games.unit_plays')} />}
      <div className="rounded-[20px] border-2 border-yellow-500/60 bg-gradient-to-b from-[#C2410C] to-[#7C2D12] p-4">
        <p className="mx-auto mb-3 w-fit rounded-full bg-black/30 px-4 py-1 text-[12px] font-semibold">{t('figma_ui.games.scratch_match_badge')}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 9 }, (_, i) => (
            <button key={i} type="button" onClick={() => reveal(i)} disabled={busy} className={`flex aspect-square flex-col items-center justify-center rounded-[14px] text-[13px] font-semibold ${shown[i] && cells ? 'bg-[#FFF7E6] text-[#7C2D12]' : 'bg-gradient-to-br from-slate-300 to-slate-500 text-white/80'}`}>
              {shown[i] && cells ? cells[i] : '?'}
            </button>
          ))}
        </div>
      </div>
      <button type="button" disabled={!userId || busy || (data?.free ?? 0) <= 0} onClick={revealAll} className="h-12 rounded-[14px] bg-gradient-to-r from-[#374151] via-[#EF4444] to-[#EAB308] text-[14px] font-semibold disabled:opacity-60">
        {!userId ? t('sso.guest_login_required') : busy ? t('figma_ui.games.scratch_scratching_btn') : t('figma_ui.games.scratch_all_btn')}
      </button>
      <p className="text-center text-[11px] text-white/70">{t('figma_ui.games.scratch_free_left_week', { count: data?.free ?? 0 })}</p>
    </DarkGame>
  );
};

// ───────────────────────── GM-02 · Result (won · no prize · out of plays) ─────────────────────────
export const GameResult: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { game: string; gameCode?: string; back: string; won?: boolean; name?: string; type?: string; value?: number; balance?: number; left?: number; outOfPlays?: boolean } };
  if (!state) return <Navigate to="/games" replace />;
  const coins = state.type && /POINT|COIN/i.test(state.type);
  const displayGame = state.gameCode ? localizedGameName(state.gameCode, state.game) : state.game;
  return (
    <Screen title={t('figma_ui.games.result_title')} back={state.back}>
      {state.outOfPlays ? (
        <ResultBlock art={artHourglass} title={t('figma_ui.games.result_out_title')} sub={t('figma_ui.games.result_out_sub')} />
      ) : state.won ? (
        <ResultBlock art={artCup} title={t('figma_ui.games.result_won_title')} value={coins ? t('figma_ui.games.result_coins_value', { coins: fmt(state.value) }) : state.name} sub={coins ? t('figma_ui.games.result_won_sub_coins') : t('figma_ui.games.result_won_sub_voucher')} />
      ) : (
        <ResultBlock art={artEmptyBox} title={t('figma_ui.games.result_lost_title')} sub={t('figma_ui.games.result_lost_sub')} />
      )}
      <InfoRows
        rows={[
          [t('figma_ui.games.result_row_game'), displayGame],
          ...(state.left !== undefined ? ([[t('figma_ui.games.result_row_plays_left'), t(state.left === 1 ? 'figma_ui.tiers.play_unit_one' : 'figma_ui.tiers.play_unit_other', { count: state.left })]] as [string, string][]) : []),
          ...(state.balance !== undefined ? ([[t('figma_ui.games.result_row_current_coins'), `${fmt(state.balance)} ${t('figma_ui.common.coins')}`]] as [string, string][]) : []),
        ]}
      />
      {state.outOfPlays ? (
        <>
          <PrimaryButton onClick={() => navigate('/missions')}>{t('figma_ui.games.result_out_do_mission')}</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/games/get-plays')}>{t('figma_ui.games.result_out_get_plays')}</SecondaryButton>
        </>
      ) : (
        <>
          <PrimaryButton onClick={() => navigate(state.back)}>{t('figma_ui.games.result_play_again')}</PrimaryButton>
          <SecondaryButton onClick={() => navigate(state.won && !coins ? '/my-vouchers' : '/coins')}>
            {state.won && !coins ? t('figma_ui.games.result_won_view_vouchers') : t('figma_ui.more.coins_history')}
          </SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── GM-01 · Get a play with coins (+ play added) ─────────────────────────
export const GetPlays: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = uid();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [data, failed, reload] = useLoad(async () => {
    const [cfg, plays] = await Promise.all([LoyaltyApi.getLuckyWheelConfig(userId).catch(() => null), loadPlays()]);
    return { price: Number(cfg?.pricePerSpin) || 0, code: cfg?.wheelCode || 'WHEEL', plays };
  });
  const buy = async () => {
    if (!data) return;
    if (!userId) {
      alert(t('sso.guest_login_required_desc'));
      return;
    }
    setBusy(true);
    try {
      const s = await LoyaltyApi.initGameSession(data.code, userId);
      await LoyaltyApi.inGameCheckout(data.code, s.sessionToken, 1, data.price, userId);
      setAdded(true);
    } catch {
      alert(t('figma_ui.games.get_plays_failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title={t('figma_ui.games.get_plays_title')} back="/games">
      {!userId && <Empty art={artGamepad} title={t('sso.guest_login_required')} text={t('sso.guest_login_required_desc')} />}
      {userId && failed && <ErrorBlock onRetry={reload} />}
      {userId && !data && !failed && <Skeleton className="h-[300px]" />}
      {userId && data && !data.price && <Empty art={artGamepad} title={t('figma_ui.games.get_plays_not_open')} text={t('figma_ui.games.get_plays_not_open_sub')} />}
      {userId && data && !!data.price && !added && (
        <>
          <ResultBlock art={artGamepad} title={t('figma_ui.games.get_plays_1_extra')} value={t('figma_ui.games.get_plays_price_per_play', { price: fmt(data.price) })} valueTone="orange" sub={t('figma_ui.games.get_plays_never_reset')} />
          <InfoRows
            rows={[
              [t('figma_ui.games.get_plays_row_saved'), t(data.plays.saved === 1 ? 'figma_ui.tiers.play_unit_one' : 'figma_ui.tiers.play_unit_other', { count: data.plays.saved })],
              [t('figma_ui.games.get_plays_row_available'), `${fmt(data.plays.coins)} ${t('figma_ui.common.coins')}`],
              [t('figma_ui.games.get_plays_row_used'), `${fmt(data.price)} ${t('figma_ui.common.coins')}`],
              data.plays.coins >= data.price
                ? [t('figma_ui.games.get_plays_row_left'), `${fmt(data.plays.coins - data.price)} ${t('figma_ui.common.coins')}`]
                : [t('figma_ui.games.get_plays_row_missing'), <span key="m" className="text-red-600">{fmt(data.price - data.plays.coins)} {t('figma_ui.common.coins')}</span>],
            ]}
          />
          <p className="text-[12px] text-slate-500">{t('figma_ui.games.get_plays_coins_only_note')}</p>
          <PrimaryButton disabled={busy || data.plays.coins < data.price} onClick={buy}>
            {data.plays.coins < data.price ? t('figma_ui.vouchers.result_short') : busy ? t('figma_ui.games.get_plays_buying_btn') : t('figma_ui.games.get_plays_confirm_btn')}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate(-1)}>{t('figma_ui.games.get_plays_later_btn')}</SecondaryButton>
        </>
      )}
      {data && added && (
        <>
          <ResultBlock art={artGamepad} title={t('figma_ui.games.get_plays_bought_title')} value={t('figma_ui.games.get_plays_bought_value')} sub={t('figma_ui.games.get_plays_bought_sub')} />
          <InfoRows rows={[
            [t('figma_ui.games.get_plays_row_used'), `${fmt(data.price)} ${t('figma_ui.common.coins')}`],
            [t('figma_ui.games.get_plays_row_left'), `${fmt(data.plays.coins - data.price)} ${t('figma_ui.common.coins')}`],
            [t('figma_ui.games.get_plays_row_saved'), t(data.plays.saved + 1 === 1 ? 'figma_ui.tiers.play_unit_one' : 'figma_ui.tiers.play_unit_other', { count: data.plays.saved + 1 })],
          ]} />
          <PrimaryButton onClick={() => navigate('/games')}>{t('figma_ui.games.get_plays_back_btn')}</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/coins')}>{t('figma_ui.more.coins_history')}</SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── GM-01 · Learning list · GM-02 details · lesson ─────────────────────────
export const LearningList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getLearningCourses());
  return (
    <Screen title={t('figma_ui.games.learning_title')} back="/games">
      <div>
        <h2 className="text-[22px] font-semibold">{t('figma_ui.games.learning_title')}</h2>
        <p className="text-[13px] text-slate-500">{t('figma_ui.games.learning_subtitle')}</p>
      </div>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[200px]" />}
      {data?.length === 0 && <Empty art={artEmptyBox} title={t('figma_ui.games.learning_empty_title')} text={t('figma_ui.games.learning_empty_sub')} />}
      {data?.map((c) => {
        const done = !!c.completedQuestions && c.completedQuestions >= c.totalQuestions;
        const title = pickLocalizedField(c, 'title', i18n.language) || c.title;
        const desc = pickLocalizedField(c, 'description', i18n.language) || c.description;
        return (
          <button key={c.id} type="button" onClick={() => navigate(`/learning/${c.id}`)} className="flex w-full items-center gap-3 rounded-[20px] bg-white p-4 text-left">
            <span className="size-[64px] shrink-0 overflow-hidden rounded-[14px]"><GameArt code="LEARNING" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{title}</span>
              {desc && <span className="line-clamp-1 text-[12px] text-slate-500">{desc}</span>}
              <span className="text-[12px] font-semibold text-brand">{t('figma_ui.games.learning_reward_up_to', { coins: fmt(c.rewardPointsMax) })}</span>
            </span>
            {done ? <Pill tone="green"><Check className="size-3" /> {t('figma_ui.games.learning_done_pill')}</Pill> : <span className="rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-white">{c.completedQuestions ? t('figma_ui.games.learning_continue_btn') : t('figma_ui.games.learning_start_pill')}</span>}
          </button>
        );
      })}
    </Screen>
  );
};

export const LearningDetail: React.FC = () => {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(async () => {
    const [courses, plays] = await Promise.all([LoyaltyApi.getLearningCourses(), loadPlays()]);
    return { c: courses.find((x) => String(x.id) === id), plays };
  }, [id]);
  const c = data?.c;
  const title = c ? pickLocalizedField(c, 'title', i18n.language) || c.title : '';
  const desc = c ? pickLocalizedField(c, 'description', i18n.language) || c.description : '';
  return (
    <Screen title={t('figma_ui.games.learning_details_title')} back="/learning">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && !c && <Empty art={artEmptyBox} title={t('figma_ui.games.learning_not_found')} />}
      {c && (
        <>
          <div className="h-[200px] w-full overflow-hidden rounded-[20px]"><GameArt code="LEARNING" /></div>
          <div>
            <h2 className="text-[24px] font-semibold">{title}</h2>
            <div className="mt-1 flex gap-2"><Pill tone="blue">{t('figma_ui.games.learning_badge_cat')}</Pill><Pill tone="orange">{t('figma_ui.games.learning_badge_loyalty')}</Pill></div>
          </div>
          <div className="flex items-center justify-between rounded-[14px] bg-white p-3 text-[13px]">
            <span>{t('figma_ui.games.learning_free_left_week', { count: data.plays.free })}</span>
            <button type="button" onClick={() => navigate('/games/get-plays')} className="font-semibold text-brand">{t('figma_ui.games.learning_get_more')}</button>
          </div>
          <PrimaryButton onClick={() => navigate(`/learning/${c.id}/lesson`)}>{t('figma_ui.games.learning_start_uses_play')}</PrimaryButton>
          <div className="rounded-[20px] bg-white p-4">
            <p className="mb-2 text-[15px] font-semibold">{t('figma_ui.games.learning_earn_coins')}</p>
            <InfoRows rows={[
              [t('figma_ui.games.learning_questions_count', { count: c.totalQuestions }), t('figma_ui.games.learning_up_to_coins', { coins: fmt(c.rewardPointsMax) })],
              [t('figma_ui.games.learning_difficulty'), c.difficulty || t('figma_ui.games.learning_difficulty_easy')],
            ]} />
          </div>
          {desc && (
            <div className="rounded-[20px] bg-white p-4">
              <p className="mb-1 text-[15px] font-semibold">{t('figma_ui.games.learning_about')}</p>
              <p className="text-[13px] leading-5 text-slate-500">{desc}</p>
            </div>
          )}
        </>
      )}
    </Screen>
  );
};

export const Lesson: React.FC = () => {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [qs, failed, reload] = useLoad(() => LoyaltyApi.getLearningQuestions(id), [id]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<LearningQuizSubmitResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const list: LearningQuestionItem[] = useMemo(() => [...(qs || [])].sort((a, b) => a.orderIndex - b.orderIndex), [qs]);
  const q = list[i];
  const picked = q ? answers[q.id] : undefined;
  const qText = q ? pickLocalizedField(q, 'questionText', i18n.language) || q.questionText : '';

  const next = async () => {
    if (i < list.length - 1) return setI(i + 1);
    const userId = uid();
    if (!userId) {
      alert(t('sso.guest_login_required_desc'));
      return;
    }
    setBusy(true);
    try {
      setResult(await LoyaltyApi.submitLearningQuiz(id, list.map((x) => ({ questionId: x.id, selectedOptionIndex: answers[x.id] ?? -1 })), userId));
    } catch {
      alert(t('figma_ui.games.lesson_submit_error'));
    } finally {
      setBusy(false);
    }
  };
  const speak = () => {
    if (!q) return;
    if (q.audioUrl) void new Audio(q.audioUrl).play();
    else if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(q.options[picked ?? 0] || qText));
  };

  return (
    <Screen title={t('figma_ui.games.lesson_title')} back={`/learning/${id}`}>
      {failed && <ErrorBlock onRetry={reload} />}
      {!qs && !failed && <Skeleton className="h-[400px]" />}
      {qs && list.length === 0 && <Empty art={artEmptyBox} title={t('figma_ui.games.lesson_no_questions')} />}
      {q && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand" style={{ width: `${((i + 1) / list.length) * 100}%` }} /></div>
            <span className="text-[13px] font-semibold">{i + 1} / {list.length}</span>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold">{qText}</h2>
            <p className="text-[13px] text-slate-500">{t('figma_ui.games.lesson_listen_hint')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton className="h-11 text-sky-700" onClick={speak}><Volume1 className="size-4" /> {t('figma_ui.games.lesson_listen_btn')}</SecondaryButton>
            <SecondaryButton className="h-11 text-brand" onClick={speak}><Mic className="size-4" /> {t('figma_ui.games.lesson_say_btn')}</SecondaryButton>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {q.options.map((o, k) => (
              <button key={o} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: k }))} className={`flex h-14 items-center justify-center gap-1 rounded-[16px] border text-[16px] font-semibold ${picked === k ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white'}`}>
                {picked === k && <Check className="size-4" />} {o}
              </button>
            ))}
          </div>
          <PrimaryButton className="bg-emerald-700" disabled={picked === undefined || busy} onClick={next}>{i < list.length - 1 ? t('figma_ui.games.lesson_next_short') : t('figma_ui.games.lesson_finish_short')}</PrimaryButton>
        </>
      )}
      <Popup open={!!result} onClose={() => navigate('/learning')}>
        <img src={artCup} alt="" className="size-24" />
        <p className="text-[18px] font-semibold">{t('figma_ui.games.lesson_complete_title')}</p>
        <p className="text-[13px] text-slate-500">{t('figma_ui.games.lesson_score_label', { correct: result?.correctCount ?? 0, total: result?.totalQuestions ?? 0 })}</p>
        <p className="text-[28px] font-semibold text-emerald-700">{t('figma_ui.games.result_coins_value', { coins: fmt(result?.pointsAwarded) })}</p>
        <PrimaryButton className="mt-2" onClick={() => { setResult(null); setAnswers({}); setI(0); }}>{t('figma_ui.games.lesson_next_uses_play')}</PrimaryButton>
        <SecondaryButton onClick={() => navigate('/learning')}>{t('figma_ui.games.lesson_back_learning')}</SecondaryButton>
      </Popup>
    </Screen>
  );
};

// ───────────────────────── GM-01 · Play history ─────────────────────────
interface PlayRow { id?: number | string; gameType?: string; gameCode?: string; prizeName?: string; pointsAwarded?: number; outcome?: string; playedAt?: string; createdAt?: string }
export const PlayHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const userId = uid();
  const [filter, setFilter] = useState<'All' | 'Prizes' | 'Wheel' | 'Mini'>('All');
  const [data, failed, reload] = useLoad(async () => {
    if (!userId) return [] as PlayRow[];
    const r = (await LoyaltyApi.getGamePlayHistory(userId, 0, 50)) as { items?: PlayRow[]; content?: PlayRow[] } | PlayRow[];
    return Array.isArray(r) ? r : r.items || r.content || [];
  });
  const won = (r: PlayRow) => (r.pointsAwarded || 0) > 0 || (!!r.prizeName && !/no.?luck|no prize/i.test(r.prizeName));
  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = (data || []).filter((r) => new Date(r.playedAt || r.createdAt || 0).getTime() >= weekAgo);
  const rows = (data || []).filter((r) =>
    filter === 'All' ? true : filter === 'Prizes' ? won(r) : filter === 'Wheel' ? /WHEEL|LUCKY/i.test(r.gameCode || r.gameType || '') : !/WHEEL|LUCKY/i.test(r.gameCode || r.gameType || ''),
  );
  const filterLabel = (f: 'All' | 'Prizes' | 'Wheel' | 'Mini') =>
    f === 'All'
      ? t('figma_ui.games.history_filter_all')
      : f === 'Prizes'
      ? t('figma_ui.games.history_filter_prizes')
      : f === 'Wheel'
      ? t('figma_ui.games.history_filter_wheel')
      : t('figma_ui.games.history_filter_mini');
  return (
    <Screen title={t('figma_ui.games.history_title')} back="/games">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && (
        <>
          <div className="grid w-full grid-cols-3 rounded-[20px] bg-brand-soft p-4 text-center">
            <p className="col-span-3 mb-2 text-left text-[12px] text-slate-500">{t('figma_ui.games.history_this_week')}</p>
            <div><p className="text-[20px] font-semibold">{week.length}</p><p className="text-[11px] text-slate-500">{t('figma_ui.games.history_stat_plays')}</p></div>
            <div><p className="text-[20px] font-semibold">{week.filter(won).length}</p><p className="text-[11px] text-slate-500">{t('figma_ui.games.history_stat_prizes')}</p></div>
            <div><p className="text-[20px] font-semibold">+{fmt(week.reduce((s, r) => s + (r.pointsAwarded || 0), 0))}</p><p className="text-[11px] text-slate-500">{t('figma_ui.games.history_stat_coins_won')}</p></div>
          </div>
          <SlideRow>
            {(['All', 'Prizes', 'Wheel', 'Mini'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${filter === f ? 'bg-brand text-white' : 'border border-slate-200 bg-white'}`}>
                {filterLabel(f)}
              </button>
            ))}
          </SlideRow>
          {rows.length === 0 && (
            <Empty
              art={artGamepad}
              title={!userId ? t('sso.guest_login_required') : t('figma_ui.games.history_empty_title')}
              text={!userId ? t('sso.guest_login_required_desc') : t('figma_ui.games.history_empty_sub')}
            />
          )}
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
                      <span className="text-[11px] text-slate-500">{Number.isNaN(d.getTime()) ? '' : d.toLocaleString(toDateLocale(i18n.language), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span className={`text-right text-[12px] font-semibold ${won(r) ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {r.pointsAwarded ? t('figma_ui.games.history_coins_won', { coins: fmt(r.pointsAwarded) }) : won(r) ? r.prizeName : t('figma_ui.games.history_no_prize')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-slate-500">{t('figma_ui.games.history_server_note')}</p>
        </>
      )}
    </Screen>
  );
};
