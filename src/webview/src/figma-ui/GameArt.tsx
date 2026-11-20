import React, { useState } from 'react';
import { GameCoverArt } from '../components/game-assets/GameArtAssets';
import { IN_HOUSE } from './games';

const VALID_ART_CODES = new Set([
  'WHEEL',
  'FLAPPY',
  'GAME2048',
  'MEMORY',
  'BUBBLE',
  'FRUIT',
  'KNIFE',
  'BLOCK',
  'RUNNER',
  'WORDLE',
  'SCREW',
  'UNTANGLE',
  'PULLPIN',
  'GOLDMINER',
  'HELIX',
  'PIGGY',
  'JIGSAW',
  'WATERSORT',
  'STACKTOWER',
  'PIPECONNECT',
  'MERGEDROP',
  'WHACKAMOLE',
  'MINESWEEPER',
  'SUDOKU',
  'SCRATCH',
  'LEARNING',
]);

const normCode = (c: string) => (c || '').toUpperCase().replace(/[^A-Z0-9_]/g, '');

export const resolveArtCode = (code: string): string => {
  const clean = normCode(code);
  const own = IN_HOUSE[clean];
  if (own?.artCode && VALID_ART_CODES.has(own.artCode)) {
    return own.artCode;
  }
  if (VALID_ART_CODES.has(clean)) {
    return clean;
  }
  // Smart keyword mapping for any custom backend or partner game codes
  if (/MINESWEEPER|SWEEPER|BOMB_SWEEP/i.test(clean)) return 'MINESWEEPER';
  if (/SUDOKU|SUDOCU/i.test(clean)) return 'SUDOKU';
  if (/GOLD|MINER/i.test(clean)) return 'GOLDMINER';
  if (/HELIX|SPIRAL/i.test(clean)) return 'HELIX';
  if (/PIGGY|PIG|COWBOY/i.test(clean)) return 'PIGGY';
  if (/JIGSAW|PIECE|SWAP_PUZZLE/i.test(clean)) return 'JIGSAW';
  if (/WATER|SORT|TUBE|LIQUID/i.test(clean)) return 'WATERSORT';
  if (/STACK|TOWER|BUILD/i.test(clean)) return 'STACKTOWER';
  if (/PIPE|PLUMB|CONNECT/i.test(clean)) return 'PIPECONNECT';
  if (/MERGE|DROP|WATERMELON|SUIKA/i.test(clean)) return 'MERGEDROP';
  if (/MOLE|WHACK|HAMMER/i.test(clean)) return 'WHACKAMOLE';
  if (/WHEEL|CHEST|REWARD|SPIN/i.test(clean)) return 'WHEEL';
  if (/SCRATCH|CARD|EGG|LUCKY_DICE/i.test(clean)) return 'SCRATCH';
  if (/RUN|SHOOT|TOWER|CLIMB|PENALTY/i.test(clean)) return 'RUNNER';
  if (/BUBBLE|BALL|DROP|PLINKO/i.test(clean)) return 'BUBBLE';
  if (/FRUIT|SLICE/i.test(clean)) return 'FRUIT';
  if (/KNIFE|HIT/i.test(clean)) return 'KNIFE';
  if (/BLOCK|TETRIS|GEM/i.test(clean)) return 'BLOCK';
  if (/SCREW|PUZZLE/i.test(clean)) return 'SCREW';
  if (/BIRD|FLAP|TOPUP/i.test(clean)) return 'FLAPPY';
  if (/MEMORY|MATCH/i.test(clean)) return 'MEMORY';
  if (/2048|DICE|MATH/i.test(clean)) return 'GAME2048';
  if (/WORD|TEXT/i.test(clean)) return 'WORDLE';
  if (/LEARN|QUIZ|COURSE/i.test(clean)) return 'LEARNING';
  return 'WHEEL';
};

/**
 * Game cover art component:
 * 1. Uses CMS remote image if iconUrl is a valid http(s) or data URL and loads successfully.
 * 2. Falls back automatically to handcrafted 3D vector SVG GameCoverArt if iconUrl is missing,
 *    fails to load, or points to a non-existent local asset path.
 */
export const GameArt: React.FC<{ code: string; iconUrl?: string; className?: string }> = ({
  code,
  iconUrl,
  className = 'h-full w-full',
}) => {
  const [imgError, setImgError] = useState(false);
  const artCode = resolveArtCode(code);

  const isInvalidLocalPath = iconUrl && (iconUrl.startsWith('/assets/games/') || iconUrl.startsWith('./assets/'));
  const hasValidIcon = !!iconUrl && !imgError && !isInvalidLocalPath;

  if (hasValidIcon) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={`object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return <GameCoverArt gameId={artCode} className={className} />;
};
