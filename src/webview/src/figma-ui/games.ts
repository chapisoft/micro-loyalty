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
  UNTANGLE: { route: '/untangle', name: 'Rope Untangle', category: CAT.BRAIN, artCode: 'UNTANGLE' },
  GOLDMINER: { route: '/goldminer', name: 'Gold Miner', category: CAT.FUN, artCode: 'GOLDMINER' },
  GOLD_MINER: { route: '/goldminer', name: 'Gold Miner', category: CAT.FUN, artCode: 'GOLDMINER' },
  HELIX: { route: '/helix', name: 'Helix Jump', category: CAT.FUN, artCode: 'HELIX' },
  JIGSAW: { route: '/jigsaw', name: 'Jigsaw Puzzle', category: CAT.BRAIN, artCode: 'JIGSAW' },
  JIGSAW_PUZZLE: { route: '/jigsaw', name: 'Jigsaw Puzzle', category: CAT.BRAIN, artCode: 'JIGSAW' },
  WATERSORT: { route: '/watersort', name: 'Water Sort', category: CAT.BRAIN, artCode: 'WATERSORT' },
  WATER_SORT: { route: '/watersort', name: 'Water Sort', category: CAT.BRAIN, artCode: 'WATERSORT' },
  STACKTOWER: { route: '/stacktower', name: 'Stack Tower', category: CAT.FUN, artCode: 'STACKTOWER' },
  STACK_TOWER: { route: '/stacktower', name: 'Stack Tower', category: CAT.FUN, artCode: 'STACKTOWER' },
  PIPECONNECT: { route: '/pipeconnect', name: 'Pipe Connect', category: CAT.BRAIN, artCode: 'PIPECONNECT' },
  PIPE_CONNECT: { route: '/pipeconnect', name: 'Pipe Connect', category: CAT.BRAIN, artCode: 'PIPECONNECT' },
  MERGEDROP: { route: '/mergedrop', name: 'Merge Drop', category: CAT.BRAIN, artCode: 'MERGEDROP' },
  MERGE_DROP: { route: '/mergedrop', name: 'Merge Drop', category: CAT.BRAIN, artCode: 'MERGEDROP' },
  WHACKAMOLE: { route: '/whackamole', name: 'Whack a Mole', category: CAT.FUN, artCode: 'WHACKAMOLE' },
  WHACK_A_MOLE: { route: '/whackamole', name: 'Whack a Mole', category: CAT.FUN, artCode: 'WHACKAMOLE' },
  MINESWEEPER: { route: '/minesweeper', name: 'Minesweeper', category: CAT.BRAIN, artCode: 'MINESWEEPER' },
  MINE_SWEEPER: { route: '/minesweeper', name: 'Minesweeper', category: CAT.BRAIN, artCode: 'MINESWEEPER' },
  BOMB_SWEEPER: { route: '/minesweeper', name: 'Minesweeper', category: CAT.BRAIN, artCode: 'MINESWEEPER' },
  SUDOKU: { route: '/sudoku', name: 'Sudoku Master', category: CAT.BRAIN, artCode: 'SUDOKU' },
  SUDOCU: { route: '/sudoku', name: 'Sudoku Master', category: CAT.BRAIN, artCode: 'SUDOKU' },
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
    { code: 'UNTANGLE', name: 'Rope Untangle', category: CAT.BRAIN, route: '/untangle' },
    { code: 'GOLDMINER', name: 'Gold Miner', category: CAT.FUN, route: '/goldminer' },
    { code: 'HELIX', name: 'Helix Jump', category: CAT.FUN, route: '/helix' },
    { code: 'JIGSAW', name: 'Jigsaw Puzzle', category: CAT.BRAIN, route: '/jigsaw' },
    { code: 'WATERSORT', name: 'Water Sort', category: CAT.BRAIN, route: '/watersort' },
    { code: 'STACKTOWER', name: 'Stack Tower', category: CAT.FUN, route: '/stacktower' },
    { code: 'PIPECONNECT', name: 'Pipe Connect', category: CAT.BRAIN, route: '/pipeconnect' },
    { code: 'MERGEDROP', name: 'Merge Drop', category: CAT.BRAIN, route: '/mergedrop' },
    { code: 'WHACKAMOLE', name: 'Whack a Mole', category: CAT.FUN, route: '/whackamole' },
    { code: 'MINESWEEPER', name: 'Minesweeper', category: CAT.BRAIN, route: '/minesweeper' },
    { code: 'SUDOKU', name: 'Sudoku Master', category: CAT.BRAIN, route: '/sudoku' },
  ];

  const EXCLUDED_GAME_CODES = new Set([
    'DAILY_CHECKIN',
    'DAILYCHECKIN',
    'CHECKIN',
    'SCREW',
    'SCREW_PUZZLE',
    'TANGRAM_SCREW',
    'PULLPIN',
    'PULL_THE_PIN',
    'PIGGY',
    'PIGGY_SHOOTER',
    'COWBOY',
  ]);

  const list = await LoyaltyApi.getGamesList().catch(() => [] as GameListItem[]);
  const active = list.filter((g) => {
    const c = normCode(g.gameCode);
    if (EXCLUDED_GAME_CODES.has(c)) return false;
    return !g.status || /ACTIVE|PUBLISHED|RUNNING/i.test(g.status);
  });
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
      (b.code === 'GOLDMINER' ? apiMap.get('GOLD_MINER') : undefined) ||
      (b.code === 'HELIX' ? apiMap.get('HELIX_JUMP') : undefined) ||
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

  // Deduplicate by resolved code & route so backend alias stubs never duplicate in-house tiles
  const seenCodes = new Set<string>(result.map((r) => r.code));
  const seenRoutes = new Set<string>(result.map((r) => r.route).filter((rt): rt is string => Boolean(rt)));

  active.forEach((g) => {
    const c = normCode(g.gameCode);
    const isBundledAlias =
      (c === 'SCRATCH_CARD' && seenCodes.has('SCRATCH')) ||
      (c === 'SCREW_PUZZLE' && seenCodes.has('SCREW')) ||
      (c === 'GOLD_MINER' && seenCodes.has('GOLDMINER')) ||
      (c === 'HELIX_JUMP' && seenCodes.has('HELIX')) ||
      ((c === 'LUCKY_WHEEL' || c === 'LUCKY_WHEEL_NATCASH') && seenCodes.has('WHEEL'));
    if (isBundledAlias) return;

    const entry = toEntry(g);
    if (seenCodes.has(entry.code) || (entry.route && seenRoutes.has(entry.route))) {
      return;
    }

    result.push(entry);
    seenCodes.add(entry.code);
    if (entry.route) seenRoutes.add(entry.route);
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
