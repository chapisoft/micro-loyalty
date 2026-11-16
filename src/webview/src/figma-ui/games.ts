import { LoyaltyApi, type GameListItem } from '../services/api';

/**
 * Where each in-house game is played inside this webview. This is code knowledge (the player lives in this
 * bundle), not catalogue data: names, categories, order and on/off come from GET /gamehub/v1/games/list.
 */
/** Game taxonomy from the solution doc (GameCategory): Entertainment · Brain (puzzle) · Learning. */
export const CAT = { FUN: 'ENTERTAINMENT', BRAIN: 'PUZZLE_BRAIN', LEARN: 'EDUCATION_LEARNING' } as const;

export const IN_HOUSE: Record<string, { route: string; name: string; category: string; artCode: string }> = {
  WHEEL: { route: '/games/wheel', name: 'Rewards Wheel', category: CAT.FUN, artCode: 'WHEEL' },
  LUCKY_WHEEL: { route: '/games/wheel', name: 'Rewards Wheel', category: CAT.FUN, artCode: 'WHEEL' },
  LUCKY_WHEEL_NATCASH: { route: '/games/wheel', name: 'Rewards Wheel', category: CAT.FUN, artCode: 'WHEEL' },
  SCRATCH: { route: '/games/scratch', name: 'Lucky Scratch Card', category: CAT.FUN, artCode: 'SCRATCH' },
  SCRATCH_CARD: { route: '/games/scratch', name: 'Lucky Scratch Card', category: CAT.FUN, artCode: 'SCRATCH' },
  FLAPPY: { route: '/flappy', name: 'Flappy Natcom', category: CAT.FUN, artCode: 'FLAPPY' },
  GAME2048: { route: '/game2048', name: '2048 Natcash', category: CAT.BRAIN, artCode: 'GAME2048' },
  MEMORY: { route: '/memory', name: 'Memory Master', category: CAT.BRAIN, artCode: 'MEMORY' },
  BUBBLE: { route: '/bubble', name: 'Kanaval Bubbles', category: CAT.FUN, artCode: 'BUBBLE' },
  FRUIT: { route: '/fruit', name: 'Fruit Slice', category: CAT.FUN, artCode: 'FRUIT' },
  KNIFE: { route: '/knife', name: 'Knife Hit', category: CAT.FUN, artCode: 'KNIFE' },
  BLOCK: { route: '/block', name: 'Diamond Blocks', category: CAT.BRAIN, artCode: 'BLOCK' },
  RUNNER: { route: '/runner', name: 'Port Runner', category: CAT.FUN, artCode: 'RUNNER' },
  WORDLE: { route: '/wordle', name: 'Lucky Word', category: CAT.BRAIN, artCode: 'WORDLE' },
  SCREW: { route: '/screw', name: 'Screw Puzzle', category: CAT.BRAIN, artCode: 'SCREW' },
  SCREW_PUZZLE: { route: '/screw', name: 'Screw Puzzle', category: CAT.BRAIN, artCode: 'SCREW' },
  UNTANGLE: { route: '/untangle', name: 'Rope Untangle', category: CAT.BRAIN, artCode: 'UNTANGLE' },
  PULLPIN: { route: '/pullpin', name: 'Pull the Pin', category: CAT.BRAIN, artCode: 'PULLPIN' },
  TREASURE_CHEST: { route: '/games/wheel', name: 'Mở Rương Báu', category: CAT.FUN, artCode: 'WHEEL' },
  TOWER_CLIMB: { route: '/runner', name: 'Tháp Kho Báu', category: CAT.FUN, artCode: 'RUNNER' },
  PENALTY_SHOOTOUT: { route: '/runner', name: 'Penalty Shootout', category: CAT.FUN, artCode: 'RUNNER' },
  PLINKO_DROP: { route: '/bubble', name: 'Plinko Fortune', category: CAT.FUN, artCode: 'BUBBLE' },
  GOLDEN_EGG: { route: '/games/scratch', name: 'Đập Trứng Vàng', category: CAT.FUN, artCode: 'SCRATCH' },
  LUCKY_DICE: { route: '/game2048', name: 'Xúc Xắc May Mắn', category: CAT.FUN, artCode: 'GAME2048' },
  TOPUP_CHALLENGE: { route: '/flappy', name: 'Topup Challenge', category: CAT.FUN, artCode: 'FLAPPY' },
};

export interface GameEntry {
  code: string;
  name: string;
  category: string;
  /** internal route for in-house games */
  route?: string;
  /** partner game: opened through the partner sheet (GM-01 · Open partner game) */
  partnerUrl?: string;
  iconUrl?: string;
  freeLeft?: number;
}

const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9_]/g, '');

export const toEntry = (g: GameListItem): GameEntry => {
  const code = normCode(g.gameCode);
  const own = IN_HOUSE[code];
  return {
    code,
    name: g.gameName || own?.name || g.gameCode,
    category: (g.category || own?.category || 'OTHER').toUpperCase(),
    route: own?.route,
    partnerUrl: own ? undefined : g.gameUrl,
    iconUrl: g.iconUrl,
    freeLeft: g.remainingTurnsToday ?? g.freeTurnsDaily,
  };
};

/**
 * Catalogue from the API combined with all bundled in-house mini-games.
 * Guarantees that all designed games (Flappy, 2048, Memory, Fruit, etc.) remain
 * fully playable with their dedicated hand-crafted vector graphics.
 */
export async function loadGames(): Promise<{ games: GameEntry[]; fromApi: boolean }> {
  const bundledEntries: GameEntry[] = [
    { code: 'WHEEL', name: 'Rewards Wheel', category: CAT.FUN, route: '/games/wheel' },
    { code: 'SCRATCH', name: 'Lucky Scratch Card', category: CAT.FUN, route: '/games/scratch' },
    { code: 'FLAPPY', name: 'Flappy Natcom', category: CAT.FUN, route: '/flappy' },
    { code: 'GAME2048', name: '2048 Natcash', category: CAT.BRAIN, route: '/game2048' },
    { code: 'MEMORY', name: 'Memory Master', category: CAT.BRAIN, route: '/memory' },
    { code: 'BUBBLE', name: 'Kanaval Bubbles', category: CAT.FUN, route: '/bubble' },
    { code: 'FRUIT', name: 'Fruit Slice', category: CAT.FUN, route: '/fruit' },
    { code: 'KNIFE', name: 'Knife Hit', category: CAT.FUN, route: '/knife' },
    { code: 'BLOCK', name: 'Diamond Blocks', category: CAT.BRAIN, route: '/block' },
    { code: 'RUNNER', name: 'Port Runner', category: CAT.FUN, route: '/runner' },
    { code: 'WORDLE', name: 'Lucky Word', category: CAT.BRAIN, route: '/wordle' },
    { code: 'SCREW', name: 'Screw Puzzle', category: CAT.BRAIN, route: '/screw' },
    { code: 'UNTANGLE', name: 'Rope Untangle', category: CAT.BRAIN, route: '/untangle' },
    { code: 'PULLPIN', name: 'Pull the Pin', category: CAT.BRAIN, route: '/pullpin' },
  ];

  const list = await LoyaltyApi.getGamesList().catch(() => [] as GameListItem[]);
  const active = list.filter((g) => !g.status || /ACTIVE|PUBLISHED|RUNNING/i.test(g.status));
  if (!active.length) {
    return { games: bundledEntries, fromApi: false };
  }

  const apiMap = new Map<string, GameListItem>();
  active.forEach((g) => apiMap.set(normCode(g.gameCode), g));

  // Enrich bundled games with API turns and pricing
  const result: GameEntry[] = bundledEntries.map((b) => {
    const apiMatch =
      apiMap.get(b.code) ||
      (b.code === 'SCRATCH' ? apiMap.get('SCRATCH_CARD') : undefined) ||
      (b.code === 'SCREW' ? apiMap.get('SCREW_PUZZLE') : undefined) ||
      (b.code === 'WHEEL' ? apiMap.get('LUCKY_WHEEL') || apiMap.get('LUCKY_WHEEL_NATCASH') : undefined);
    if (apiMatch) {
      return {
        ...b,
        name: apiMatch.gameName || b.name,
        freeLeft: apiMatch.remainingTurnsToday ?? apiMatch.freeTurnsDaily ?? 1,
      };
    }
    return b;
  });

  // Append any additional games from backend
  active.forEach((g) => {
    const c = normCode(g.gameCode);
    const isBundled = result.some(
      (r) =>
        r.code === c ||
        (r.code === 'SCRATCH' && c === 'SCRATCH_CARD') ||
        (r.code === 'SCREW' && c === 'SCREW_PUZZLE') ||
        (r.code === 'WHEEL' && (c === 'LUCKY_WHEEL' || c === 'LUCKY_WHEEL_NATCASH'))
    );
    if (!isBundled) {
      result.push(toEntry(g));
    }
  });

  return { games: result, fromApi: true };
}

const LABEL: Record<string, string> = { ENTERTAINMENT: 'Entertainment', PUZZLE_BRAIN: 'Brain', EDUCATION_LEARNING: 'Learning', LEARNING: 'Learning' };
/** Known taxonomy codes get short labels; any other CMS category is shown as written ("PARTNER_SPORTS" → "Partner sports"). */
export const catLabel = (c: string) => {
  if (LABEL[c]) return LABEL[c];
  const s = c.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
